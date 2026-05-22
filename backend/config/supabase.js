const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase URL or Key is missing. Cloud storage will not function correctly.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Programmatic bucket creation utility
async function initBucket() {
  try {
    const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets();
    if (getBucketsError) {
      console.error('❌ Error listing Supabase buckets:', getBucketsError.message);
      return;
    }

    const bucketExists = buckets.some(b => b.name === 'evidence');
    if (!bucketExists) {
      console.log('📦 Supabase: Creating public "evidence" bucket...');
      const { error: createError } = await supabase.storage.createBucket('evidence', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav'
        ]
      });

      if (createError) {
        console.error('❌ Error creating Supabase bucket:', createError.message);
      } else {
        console.log('✅ Supabase "evidence" bucket created successfully.');
      }
    } else {
      console.log('✅ Supabase: "evidence" bucket already exists.');
    }
  } catch (err) {
    console.error('❌ Unexpected error initializing Supabase bucket:', err.message);
  }
}

// Call bucket initialization
initBucket();

/**
 * Uploads a local file to Supabase Storage in the 'evidence' bucket
 * @param {string} localFilePath - Path to the local file (e.g. backend/uploads/filename)
 * @param {string} destinationName - File name/path to save in the bucket
 * @param {string} mimetype - The file mimetype
 * @returns {Promise<string>} Public URL of the uploaded file
 */
async function uploadToSupabase(localFilePath, destinationName, mimetype) {
  const fileBuffer = fs.readFileSync(localFilePath);
  const { data, error } = await supabase.storage
    .from('evidence')
    .upload(destinationName, fileBuffer, {
      contentType: mimetype,
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  // Generate the public URL
  const { data: publicUrlData } = supabase.storage
    .from('evidence')
    .getPublicUrl(destinationName);

  return publicUrlData.publicUrl;
}

module.exports = { supabase, uploadToSupabase };
