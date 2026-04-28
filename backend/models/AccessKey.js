const mongoose = require('mongoose');

const accessKeySchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
  },
  trackingId: {
    type: String,
    required: true,
    index: true,
  },
  // SHA-256 hashed token for additional security
  hashedToken: { type: String, required: true },
  lastAccessedAt: { type: Date },
  accessCount: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
  },
}, { timestamps: true });

module.exports = mongoose.model('AccessKey', accessKeySchema);
