const fs = require('fs');
const path = require('path');
const Tenant = require('../models/Tenant');
const StaffUser = require('../models/StaffUser');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const Evidence = require('../models/Evidence');
const Conversation = require('../models/Conversation');
const AccessKey = require('../models/AccessKey');
const Policy = require('../models/Policy');

// GET /api/tenants — All tenants (SuperAdmin only)
exports.getAllTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ isDefault: { $ne: true } }).sort({ createdAt: -1 }).lean();

    // Attach staff count and report count
    const enriched = await Promise.all(tenants.map(async (t) => {
      const staffCount = await StaffUser.countDocuments({ tenantId: t._id });
      return { ...t, staffCount };
    }));

    res.json({ success: true, tenants: enriched, total: enriched.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/tenants — Create organization (SuperAdmin only)
exports.createTenant = async (req, res) => {
  try {
    const { orgName, sectorType, contactEmail, contactPhone, address, subscriptionPlan } = req.body;

    if (!orgName || !sectorType) return res.status(400).json({ error: 'Organization name and sector are required.' });

    // Generate org ID from name
    const organizationId = orgName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8)
      + '-' + Date.now().toString().slice(-4);

    const tenant = await Tenant.create({
      organizationId,
      orgName,
      sectorType,
      contactEmail,
      contactPhone,
      address,
      subscriptionPlan: subscriptionPlan || 'free',
    });

    await AuditLog.create({
      tenantId: tenant._id,
      staffId: req.user.id,
      action: 'Created Organization',
      targetId: tenant._id,
      targetType: 'Tenant',
      details: `Created "${orgName}" (${sectorType})`,
    });

    res.status(201).json({ success: true, tenant });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Organization ID already exists.' });
    res.status(500).json({ error: error.message });
  }
};

// GET /api/tenants/:id
exports.getTenant = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin' && String(req.params.id) !== String(req.user.tenantId)) {
      return res.status(403).json({ error: 'Access denied. You can only view your own organization.' });
    }

    const tenant = await Tenant.findById(req.params.id).lean();
    if (!tenant) return res.status(404).json({ error: 'Organization not found.' });

    const staff = await StaffUser.find({ tenantId: tenant._id }).select('-passwordHash').lean();
    const recentReports = await Report.find({ tenantId: tenant._id })
      .sort({ createdAt: -1 }).limit(5).lean();

    res.json({ success: true, tenant, staff, recentReports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/tenants/:id
exports.updateTenant = async (req, res) => {
  try {
    const allowed = ['orgName', 'contactEmail', 'contactPhone', 'address', 'subscriptionPlan', 'aiSettings'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const tenant = await Tenant.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!tenant) return res.status(404).json({ error: 'Organization not found.' });

    res.json({ success: true, tenant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/tenants/:id/suspend
exports.suspendTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Organization not found.' });
    if (tenant.isDefault) return res.status(400).json({ error: 'Cannot suspend the default CivicShield tenant.' });

    tenant.isSuspended = !tenant.isSuspended;
    await tenant.save();

    await AuditLog.create({
      tenantId: tenant._id,
      staffId: req.user.id,
      action: tenant.isSuspended ? 'Suspended Organization' : 'Reactivated Organization',
      targetId: tenant._id,
      targetType: 'Tenant',
    });

    res.json({ success: true, isSuspended: tenant.isSuspended, message: `Organization ${tenant.isSuspended ? 'suspended' : 'reactivated'}.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/tenants/:id/staff — Add staff to org
exports.addStaff = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin' && String(req.params.id) !== String(req.user.tenantId)) {
      return res.status(403).json({ error: 'Access denied. You can only add staff to your own organization.' });
    }

    const { name, email, phone, password, role, department } = req.body;
    if (!name || !email || !phone || !password || !role)
      return res.status(400).json({ error: 'All fields are required.' });

    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Organization not found.' });

    const existing = await StaffUser.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(409).json({ error: 'Email or phone already in use.' });

    // Enforce that OrgAdmins can only add staff/investigators to their own department
    const staffDepartment = req.user.role === 'SuperAdmin' ? department : (req.user.department || '');

    const staff = await StaffUser.create({
      tenantId: tenant._id,
      name, email, phone,
      passwordHash: password,
      role,
      department: staffDepartment,
      isOrgAdmin: role === 'OrgAdmin',
    });

    res.status(201).json({ success: true, staff });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: 'Email or phone already in use.' });
    res.status(500).json({ error: error.message });
  }
};

// GET /api/tenants/:id/staff
exports.getStaff = async (req, res) => {
  try {
    if (req.user.role !== 'SuperAdmin' && String(req.params.id) !== String(req.user.tenantId)) {
      return res.status(403).json({ error: 'Access denied. You can only view staff of your own organization.' });
    }

    const query = { tenantId: req.params.id };
    if (req.user.role === 'OrgAdmin') {
      query.department = req.user.department || '';
    }

    const staff = await StaffUser.find(query)
      .select('-passwordHash').lean();
    res.json({ success: true, staff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// DELETE /api/tenants/:id — Delete organization (SuperAdmin only)
exports.deleteTenant = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) return res.status(404).json({ error: 'Organization not found.' });
    if (tenant.isDefault) return res.status(400).json({ error: 'Cannot delete the default CivicShield tenant.' });

    // Find all evidence records for the tenant to delete their physical files
    const evidenceList = await Evidence.find({ tenantId: tenant._id }).lean();
    evidenceList.forEach(ev => {
      if (ev.path && fs.existsSync(ev.path)) {
        try { fs.unlinkSync(ev.path); } catch (err) { console.error('Failed to delete evidence file:', err); }
      }
    });

    // Find all report IDs for deleting AccessKeys
    const reports = await Report.find({ tenantId: tenant._id }).select('_id').lean();
    const reportIds = reports.map(r => r._id);

    // Delete all associated data
    await Promise.all([
      StaffUser.deleteMany({ tenantId: tenant._id }),
      Report.deleteMany({ tenantId: tenant._id }),
      AuditLog.deleteMany({ tenantId: tenant._id }),
      Evidence.deleteMany({ tenantId: tenant._id }),
      Conversation.deleteMany({ tenantId: tenant._id }),
      AccessKey.deleteMany({ reportId: { $in: reportIds } }),
      Policy.deleteMany({ tenantId: tenant._id }),
      Tenant.findByIdAndDelete(tenant._id),
    ]);

    await AuditLog.create({
      tenantId: req.user.tenantId,
      staffId: req.user.id,
      action: 'Deleted Organization',
      details: `Deleted "${tenant.orgName}" and all associated data.`,
    });

    res.json({ success: true, message: 'Organization and all associated data permanently deleted.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
