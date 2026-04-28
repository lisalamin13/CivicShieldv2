const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'Harassment & Discrimination', 'Financial Integrity', 'Data Privacy',
      'Workplace Safety', 'Conflict of Interest', 'Whistleblower Protection',
      'IT & Cybersecurity', 'Professional Integrity', 'General Conduct', 'Other'
    ],
    required: true,
  },
  policyText: { type: String, required: true },
  shortDescription: { type: String, trim: true },
  // AI-evaluated compliance score (0-100)
  legalAlignmentScore: { type: Number, min: 0, max: 100, default: 75 },
  version: { type: String, default: '1.0' },
  isActive: { type: Boolean, default: true },
  effectiveDate: { type: Date, default: Date.now },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffUser',
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffUser',
  },
}, { timestamps: true });

policySchema.index({ tenantId: 1, isActive: 1 });

module.exports = mongoose.model('Policy', policySchema);
