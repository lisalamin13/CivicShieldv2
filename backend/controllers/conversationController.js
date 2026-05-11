const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const { encrypt, decrypt } = require('../utils/crypto');
const { getChatResponse } = require('../services/aiService');

// GET /api/conversations/:reportId
exports.getConversations = async (req, res) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.reportId);
    const query = isObjectId 
      ? { $or: [{ _id: req.params.reportId }, { trackingId: req.params.reportId }] }
      : { trackingId: req.params.reportId };

    const report = await Report.findOne(query);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Staff: check tenant
    if (req.user?.role && req.user.role !== 'SuperAdmin') {
      if (String(report.tenantId) !== String(req.user.tenantId))
        return res.status(403).json({ error: 'Access denied.' });
    }

    const messages = await Conversation.find({ reportId: report._id })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name role')
      .lean();

    // Decrypt messages
    const decrypted = messages.map(m => ({ ...m, message: decrypt(m.encryptedMessage) }));

    res.json({ success: true, messages: decrypted, reportId: report._id, trackingId: report.trackingId });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/conversations/:reportId
exports.sendMessage = async (req, res) => {
  try {
    const { message, trackingId } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.reportId);
    const query = isObjectId 
      ? { $or: [{ _id: req.params.reportId }, { trackingId: req.params.reportId }] }
      : { trackingId: req.params.reportId };

    const report = await Report.findOne(query);
    console.log('Sending message for report:', report?.trackingId || 'NOT FOUND');
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    let senderType = 'Anonymous';
    let senderId = null;

    if (req.user?.userType === 'staff') {
      senderType = 'Staff';
      senderId = req.user.id;
    } else if (req.user?.userType === 'reporter') {
      senderType = 'Reporter';
    }

    const encryptedMessage = encrypt(message);

    // Generate AI draft for staff responses (for admin to review)
    let aiDraftedResponse = null;
    if (senderType === 'Anonymous' || senderType === 'Reporter') {
      try {
        const Policy = require('../models/Policy');
        const policies = await Policy.find({ tenantId: report.tenantId, isActive: true }).select('title policyText').lean();
        const policyContext = policies.map(p => `${p.title}: ${p.policyText}`).join('\n');
        
        aiDraftedResponse = await getChatResponse(
          `A whistleblower sent this message: "${message}". Draft a professional response based on company policies.`,
          policyContext
        );
      } catch (err) { console.error('Draft error:', err.message); }
    }

    const conversation = await Conversation.create({
      reportId: report._id,
      tenantId: report.tenantId,
      senderType, senderId,
      encryptedMessage,
      aiDraftedResponse,
      isApprovedByHuman: false,
    });

    if (senderType === 'Staff') {
      await AuditLog.create({
        tenantId: report.tenantId,
        staffId: req.user.id,
        action: 'Sent Message to Reporter',
        targetId: report._id,
        targetType: 'Report',
      });
    }

    const populated = await Conversation.findById(conversation._id).populate('senderId', 'name role').lean();
    res.status(201).json({ success: true, message: { ...populated, message: decrypt(populated.encryptedMessage) } });
  } catch (e) {
    console.error('sendMessage error:', e);
    res.status(500).json({ error: e.message });
  }
};

// PATCH /api/conversations/:id/approve-ai
exports.approveAIDraft = async (req, res) => {
  try {
    const msg = await Conversation.findByIdAndUpdate(
      req.params.id, { isApprovedByHuman: true }, { new: true }
    );
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    res.json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
