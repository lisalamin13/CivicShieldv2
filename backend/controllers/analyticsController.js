const Report = require('../models/Report');
const Tenant = require('../models/Tenant');
const StaffUser = require('../models/StaffUser');
const Policy = require('../models/Policy');
const AuditLog = require('../models/AuditLog');

// GET /api/analytics — Org admin analytics
exports.getAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.role === 'SuperAdmin' ? req.query.tenantId : req.user.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required.' });

    const [
      totalReports, openReports, resolvedReports, urgentReports,
      byStatus, byCategory, byPriority, recentReports, staffCount, policyCount
    ] = await Promise.all([
      Report.countDocuments({ tenantId }),
      Report.countDocuments({ tenantId, status: 'Open' }),
      Report.countDocuments({ tenantId, status: 'Resolved' }),
      Report.countDocuments({ tenantId, isUrgent: true }),

      Report.aggregate([
        { $match: { tenantId: require('mongoose').Types.ObjectId.createFromHexString(String(tenantId)) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Report.aggregate([
        { $match: { tenantId: require('mongoose').Types.ObjectId.createFromHexString(String(tenantId)) } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      Report.aggregate([
        { $match: { tenantId: require('mongoose').Types.ObjectId.createFromHexString(String(tenantId)) } },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      Report.find({ tenantId }).sort({ createdAt: -1 }).limit(5)
        .select('trackingId title status category priority createdAt redFlagScore').lean(),

      StaffUser.countDocuments({ tenantId }),
      Policy.countDocuments({ tenantId, isActive: true }),
    ]);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Report.aggregate([
      { $match: { tenantId: require('mongoose').Types.ObjectId.createFromHexString(String(tenantId)), createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    const avgRedFlag = await Report.aggregate([
      { $match: { tenantId: require('mongoose').Types.ObjectId.createFromHexString(String(tenantId)), redFlagScore: { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: '$redFlagScore' } } },
    ]);

    res.json({
      success: true,
      stats: {
        totalReports, openReports, resolvedReports, urgentReports,
        staffCount, policyCount, resolutionRate,
        avgRedFlagScore: avgRedFlag[0]?.avg ? Math.round(avgRedFlag[0].avg) : 0,
      },
      byStatus, byCategory, byPriority,
      recentReports, monthlyTrend,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
};

// GET /api/analytics/global — SuperAdmin global analytics
exports.getGlobalAnalytics = async (req, res) => {
  try {
    const [totalTenants, totalReports, totalStaff, activeTenants,
      reportsByTenant, reportsBySector, recentActivity] = await Promise.all([
      Tenant.countDocuments(),
      Report.countDocuments(),
      StaffUser.countDocuments(),
      Tenant.countDocuments({ isSuspended: false }),

      Report.aggregate([
        { $group: { _id: '$tenantId', count: { $sum: 1 } } },
        { $lookup: { from: 'tenants', localField: '_id', foreignField: '_id', as: 'tenant' } },
        { $unwind: '$tenant' },
        { $project: { orgName: '$tenant.orgName', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      Report.aggregate([
        { $lookup: { from: 'tenants', localField: 'tenantId', foreignField: '_id', as: 'tenant' } },
        { $unwind: '$tenant' },
        { $group: { _id: '$tenant.sectorType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      AuditLog.find().sort({ timestamp: -1 }).limit(10)
        .populate('staffId', 'name role').lean(),
    ]);

    res.json({
      success: true,
      stats: { totalTenants, totalReports, totalStaff, activeTenants },
      reportsByTenant, reportsBySector, recentActivity,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
