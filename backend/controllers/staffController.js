const StaffUser = require('../models/StaffUser');
const AuditLog = require('../models/AuditLog');

// GET /api/staff
exports.getMyStaff = async (req, res) => {
  try {
    const tenantId = req.user.role === 'SuperAdmin' ? req.query.tenantId : req.user.tenantId;
    const staff = await StaffUser.find({ tenantId }).select('-passwordHash').lean();
    res.json({ success: true, staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const { name, email, department, isActive } = req.body;
    const staff = await StaffUser.findByIdAndUpdate(
      req.params.id,
      { name, email, department, isActive },
      { new: true }
    ).select('-passwordHash');
    if (!staff) return res.status(404).json({ error: 'Staff not found.' });
    res.json({ success: true, staff });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// PATCH /api/staff/:id/toggle — activate / deactivate
exports.toggleStaff = async (req, res) => {
  try {
    const staff = await StaffUser.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff not found.' });

    // Prevent self-deactivation
    if (String(staff._id) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot deactivate your own account.' });
    }

    staff.isActive = !staff.isActive;
    await staff.save({ validateBeforeSave: false });

    await AuditLog.create({
      tenantId: staff.tenantId,
      staffId: req.user.id,
      action: staff.isActive ? 'Activated Staff Member' : 'Deactivated Staff Member',
      targetId: staff._id,
      targetType: 'StaffUser',
      details: `${staff.name} (${staff.email})`,
    });

    res.json({ success: true, isActive: staff.isActive, message: `Staff member ${staff.isActive ? 'activated' : 'deactivated'}.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/staff/:id — permanent hard delete
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await StaffUser.findById(req.params.id);
    if (!staff) return res.status(404).json({ error: 'Staff member not found.' });

    // Prevent deleting yourself
    if (String(staff._id) === String(req.user.id)) {
      return res.status(400).json({ error: 'You cannot delete your own account.' });
    }

    // Prevent deleting a SuperAdmin unless the requester is also SuperAdmin
    if (staff.role === 'SuperAdmin' && req.user.role !== 'SuperAdmin') {
      return res.status(403).json({ error: 'Only a SuperAdmin can delete another SuperAdmin.' });
    }

    // OrgAdmin can only delete staff within their own tenant
    if (req.user.role === 'OrgAdmin' && String(staff.tenantId) !== String(req.user.tenantId)) {
      return res.status(403).json({ error: 'You can only delete staff from your own organization.' });
    }

    const staffName = staff.name;
    const staffEmail = staff.email;
    const tenantId = staff.tenantId;

    await StaffUser.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      tenantId,
      staffId: req.user.id,
      action: 'Permanently Deleted Staff Member',
      targetId: req.params.id,
      targetType: 'StaffUser',
      details: `Deleted: ${staffName} (${staffEmail})`,
    });

    res.json({ success: true, message: `${staffName} has been permanently deleted.` });
  } catch (e) { res.status(500).json({ error: e.message }); }
};