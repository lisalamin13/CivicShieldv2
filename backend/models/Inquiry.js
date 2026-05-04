const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  orgName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Contacted', 'Onboarded', 'Rejected'],
    default: 'Pending'
  },
  ipAddress: { type: String, default: 'Not recorded' }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
