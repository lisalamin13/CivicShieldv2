const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
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
  senderType: {
    type: String,
    enum: ['Staff', 'Anonymous', 'Reporter'],
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StaffUser',
    default: null, // null for anonymous senders
  },
  // Encrypted message content
  encryptedMessage: { type: String, required: true },
  // AI-generated response draft (for admin review)
  aiDraftedResponse: { type: String, default: null },
  isApprovedByHuman: { type: Boolean, default: false },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

conversationSchema.index({ reportId: 1, createdAt: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
