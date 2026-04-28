// ===================== POLICY CONTROLLER =====================
const Policy = require('../models/Policy');
const AuditLog = require('../models/AuditLog');

exports.getPolicies = async (req, res) => {
  try {
    const tenantId = req.user.role === 'SuperAdmin' ? req.query.tenantId : req.user.tenantId;
    const policies = await Policy.find({ tenantId, isActive: true }).sort({ category: 1 }).lean();
    res.json({ success: true, policies });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.createPolicy = async (req, res) => {
  try {
    const { title, category, policyText, shortDescription } = req.body;
    if (!title || !category || !policyText) return res.status(400).json({ error: 'Title, category and policy text are required.' });

    const policy = await Policy.create({
      tenantId: req.user.tenantId,
      title, category, policyText, shortDescription,
      createdBy: req.user.id,
      lastUpdatedBy: req.user.id,
    });

    await AuditLog.create({ tenantId: req.user.tenantId, staffId: req.user.id, action: 'Created Policy', targetId: policy._id, targetType: 'Policy', details: title });
    res.status(201).json({ success: true, policy });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.updatePolicy = async (req, res) => {
  try {
    const { title, category, policyText, shortDescription, isActive } = req.body;
    const policy = await Policy.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.role === 'SuperAdmin' ? undefined : req.user.tenantId },
      { title, category, policyText, shortDescription, isActive, lastUpdatedBy: req.user.id },
      { new: true, omitUndefined: true }
    );
    if (!policy) return res.status(404).json({ error: 'Policy not found.' });
    res.json({ success: true, policy });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.deletePolicy = async (req, res) => {
  try {
    await Policy.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Policy deactivated.' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

module.exports.policyController = { getPolicies: exports.getPolicies, createPolicy: exports.createPolicy, updatePolicy: exports.updatePolicy, deletePolicy: exports.deletePolicy };
