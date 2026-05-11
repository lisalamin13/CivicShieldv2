const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  // For authenticated reporters
  reporterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reporter',
    default: null,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IncidentGroup',
    default: null,
  },
  // Unique 16-char public tracking ID (e.g., CS1A2B3C4D5E6F7G)
  trackingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // SHA-256 hash of the reporter's secret phrase (for anonymous access)
  claimHash: { type: String },

  title: { type: String, required: true, trim: true },

  // Encrypted grievance content (AES-256)
  encryptedContent: { type: String, required: true },

  // Decrypted content stored temporarily for AI processing (cleared after analysis)
  // In production, only admins with proper roles can decrypt
  category: {
    type: String,
    enum: [
      'Harassment', 'Discrimination', 'Financial Fraud', 'Data Privacy',
      'Safety Violation', 'Conflict of Interest', 'Cybersecurity',
      'Professional Misconduct', 'Retaliation', 'Academic Dishonesty', 'Other'
    ],
    default: 'Other',
  },
  department: { type: String, trim: true },
  incidentDate: { type: Date },
  isUrgent: { type: Boolean, default: false },

  // AI-generated fields
  aiSummary: { type: String, default: '' },
  redFlagScore: { type: Number, min: 0, max: 100, default: 0 },
  sentimentScore: { type: Number, min: -1, max: 1, default: 0 }, // -1 negative, 1 positive
  keywords: [{ type: String }],
  aiProcessed: { type: Boolean, default: false },

  // Case management
  status: {
    type: String,
    enum: ['Submitted', 'Open', 'Under Review', 'In Investigation', 'Resolved', 'Dismissed', 'Escalated'],
    default: 'Submitted',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffUser',
    default: null,
  },
  resolutionNote: { type: String, trim: true },
  resolvedAt: { type: Date },

  // Evidence file count
  evidenceCount: { type: Number, default: 0 },

  // Whether report was submitted anonymously
  isAnonymous: { type: Boolean, default: true },
}, { timestamps: true });

// Index for faster querying
reportSchema.index({ tenantId: 1, status: 1 });
reportSchema.index({ tenantId: 1, category: 1 });
reportSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
