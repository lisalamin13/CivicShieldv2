const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const StaffUser = require('../models/StaffUser');
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

    // Verify access if report is protected by claimHash (anonymous) or is an authenticated report
    if (report.claimHash) {
      if (req.user?.userType !== 'staff') {
        const { secretPhrase } = req.query;
        const { hashData } = require('../utils/crypto');
        if (!secretPhrase || hashData(secretPhrase) !== report.claimHash) {
          return res.status(401).json({ error: 'Invalid or missing secret phrase for this report.' });
        }
      }
    } else if (report.reporterId) {
      const isStaffOfTenant = req.user?.userType === 'staff' && (req.user.role === 'SuperAdmin' || String(report.tenantId) === String(req.user.tenantId));
      const isOwningReporter = req.user?.userType === 'reporter' && String(report.reporterId) === String(req.user.id);
      if (!isStaffOfTenant && !isOwningReporter) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      // Anonymous report with no secret phrase protection - access allowed since tracking ID is in URL (proves possession)
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

    // Verify access if report is protected by claimHash (anonymous) or is an authenticated report
    if (report.claimHash) {
      if (req.user?.userType !== 'staff') {
        const secretPhrase = req.query.secretPhrase || req.body.secretPhrase;
        const { hashData } = require('../utils/crypto');
        if (!secretPhrase || hashData(secretPhrase) !== report.claimHash) {
          return res.status(401).json({ error: 'Invalid or missing secret phrase for this report.' });
        }
      }
    } else if (report.reporterId) {
      const isStaffOfTenant = req.user?.userType === 'staff' && (req.user.role === 'SuperAdmin' || String(report.tenantId) === String(req.user.tenantId));
      const isOwningReporter = req.user?.userType === 'reporter' && String(report.reporterId) === String(req.user.id);
      if (!isStaffOfTenant && !isOwningReporter) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      // Anonymous report with no secret phrase protection - access allowed since tracking ID is in URL (proves possession)
    }

    let senderType = 'Anonymous';
    let senderId = null;

    if (req.user?.userType === 'staff') {
      senderType = 'Staff';
      senderId = req.user.id;
    } else if (req.user?.userType === 'reporter') {
      senderType = 'Reporter';
    }

    const encryptedMessage = encrypt(message);

    const conversation = await Conversation.create({
      reportId: report._id,
      tenantId: report.tenantId,
      senderType, senderId,
      encryptedMessage,
      aiDraftedResponse: null,
      isApprovedByHuman: false,
    });

    // Generate AI draft for staff responses asynchronously in the background (async) so it doesn't block the request
    if (senderType === 'Anonymous' || senderType === 'Reporter') {
      generateAIDraftInBackground(conversation._id, report.tenantId, message).catch(err => {
        console.error('Background AI draft warning:', err.message);
      });
    }

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
    const msg = await Conversation.findById(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found.' });

    if (req.user.role !== 'SuperAdmin' && String(msg.tenantId) !== String(req.user.tenantId)) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    msg.isApprovedByHuman = true;
    await msg.save();
    
    res.json({ success: true, message: msg });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// Helper to generate AI draft response in the background
async function generateAIDraftInBackground(conversationId, tenantId, message) {
  try {
    const Policy = require('../models/Policy');
    const policies = await Policy.find({ tenantId, isActive: true }).select('title policyText').lean();
    const policyContext = policies.map(p => `${p.title}: ${p.policyText}`).join('\n');

    const { getChatResponse } = require('../services/aiService');
    const draft = await getChatResponse(
      `A whistleblower sent this message: "${message}". Draft a professional response based on organizational policies.`,
      policyContext
    );

    if (draft) {
      await Conversation.findByIdAndUpdate(conversationId, { aiDraftedResponse: draft });
      console.log(`🤖 Auto-generated AI draft response for conversation ${conversationId} updated successfully.`);
    }
  } catch (err) {
    console.error('Background AI draft generation failed:', err.message);
  }
}
