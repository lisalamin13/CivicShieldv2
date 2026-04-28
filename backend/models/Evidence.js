const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  originalName: { type: String, required: true },
  storedName: { type: String, required: true }, // name on disk after metadata strip
  mimetype: { type: String, required: true },
  size: { type: Number, required: true }, // in bytes
  path: { type: String, required: true }, // local file path
  virusScanStatus: {
    type: String,
    enum: ['Pending', 'Clean', 'Infected', 'Skipped'],
    default: 'Pending',
  },
  metadataStripped: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Evidence', evidenceSchema);
