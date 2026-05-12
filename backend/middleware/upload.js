const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate anonymous filename - no original name stored on disk
    const randomName = crypto.randomBytes(20).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomName}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'video/mp4', 'video/quicktime',
    'audio/mpeg', 'audio/wav',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed.`), false);
  }
};

const MAX_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024;

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
});

/**
 * Universal Media Sanitizer: Strips EXIF/GPS/ID3 metadata from images, videos, and audio.
 * Uses 'sharp' for images and 'ffmpeg' for video/audio.
 */
async function stripMetadata(filePath, mimetype) {
  const { execSync } = require('child_process');

  // 1. Handle Images (using sharp)
  if (mimetype.startsWith('image/')) {
    try {
      const sharp = require('sharp');
      const inputBuffer = fs.readFileSync(filePath);
      const outputBuffer = await sharp(inputBuffer)
        .rotate()
        .toBuffer();
      fs.writeFileSync(filePath, outputBuffer);
      return true;
    } catch (err) {
      console.warn('⚠️  Image metadata stripping failed:', err.message);
      return false;
    }
  }

  // 2. Handle Video and Audio (using ffmpeg)
  if (mimetype.startsWith('video/') || mimetype.startsWith('audio/')) {
    try {
      const tempPath = filePath + '.tmp';
      // Using absolute path to bypass environment variable issues
      const ffmpegPath = 'D:\\ffmpeg-2026-05-11-git-17bc88e67f-essentials_build\\bin\\ffmpeg.exe';
      const cmd = `"${ffmpegPath}" -i "${filePath}" -map_metadata -1 -c copy "${tempPath}" -y`;
      execSync(cmd, { stdio: 'ignore' });
      
      // Replace original with the sanitized version
      if (fs.existsSync(tempPath)) {
        fs.renameSync(tempPath, filePath);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('⚠️  Media (ffmpeg) metadata stripping failed:', err.message);
      return false;
    }
  }

  return false;
}

module.exports = { upload, stripMetadata };
