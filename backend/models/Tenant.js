const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  orgName: {
    type: String,
    required: true,
    trim: true,
  },
  sectorType: {
    type: String,
    enum: ['Academic', 'Corporate', 'Government', 'NGO', 'Healthcare', 'Technology', 'Other'],
    required: true,
  },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },
  address: { type: String, trim: true },
  isSuspended: { type: Boolean, default: false },
  isDefault: { type: Boolean, default: false }, // CivicShield's own tenant
  onboardingDate: { type: Date, default: Date.now },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'basic', 'premium'],
    default: 'free',
  },
  aiSettings: {
    tone: { type: String, enum: ['formal', 'friendly', 'neutral'], default: 'formal' },
    strictness: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
  },
  logoUrl: { type: String },
  reportCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
