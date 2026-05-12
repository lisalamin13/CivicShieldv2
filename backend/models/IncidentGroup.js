const mongoose = require('mongoose');

const incidentGroupSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  clusterLabel: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String },
  reportIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
  }],
  reportCount: { type: Number, default: 0 },
  humanVerified: { type: Boolean, default: false },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium',
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Monitoring'],
    default: 'Active',
  },
}, { timestamps: true });

module.exports = mongoose.model('IncidentGroup', incidentGroupSchema);
