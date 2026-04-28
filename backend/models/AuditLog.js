const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffUser',
    required: true,
  },
  action: { type: String, required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetType: {
    type: String,
    enum: ['Report', 'Tenant', 'Policy', 'StaffUser', 'Conversation', 'System'],
  },
  details: { type: String },
  ipAddress: { type: String, default: 'Not recorded' }, // Zero-knowledge: always set to 'Not recorded'
  timestamp: { type: Date, default: Date.now },
}, { timestamps: false });

auditLogSchema.index({ tenantId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
