const Report = require('../models/Report');
const Evidence = require('../models/Evidence');
const AccessKey = require('../models/AccessKey');
const Tenant = require('../models/Tenant');
const AuditLog = require('../models/AuditLog');
const Policy = require('../models/Policy');
const { encrypt, decrypt, generateTrackingId, hashData } = require('../utils/crypto');
const { analyzeReport } = require('../services/aiService');
const { upload, stripMetadata } = require('../middleware/upload');
const path = require('path');

// POST /api/reports — Submit a grievance (anonymous or authenticated)
exports.submitReport = async (req, res) => {
  try {
    const { tenantId, title, content, department, incidentDate, secretPhrase } = req.body;

    if (!tenantId || !title || !content)
      return res.status(400).json({ error: 'Tenant ID, title, and content are required.' });

    const tenant = await Tenant.findById(tenantId);
    if (!tenant || tenant.isSuspended)
      return res.status(404).json({ error: 'Organization not found or suspended.' });

    // Encrypt the content
    const encryptedContent = encrypt(content);

    // Generate tracking ID
    const trackingId = generateTrackingId();

    // Hash the secret phrase for anonymous access (if provided)
    const claimHash = secretPhrase ? hashData(secretPhrase) : null;

    // Determine if reporter is authenticated
    const reporterId = req.user?.userType === 'reporter' ? req.user.id : null;
    const isAnonymous = !reporterId;

    // Create report
    const report = await Report.create({
      tenantId,
      reporterId,
      trackingId,
      claimHash,
      title: title.trim(),
      encryptedContent,
      department: department?.trim(),
      incidentDate: incidentDate ? new Date(incidentDate) : undefined,
      isAnonymous,
      status: 'Open',
    });

    // Store access key
    await AccessKey.create({
      reportId: report._id,
      trackingId,
      hashedToken: hashData(trackingId),
    });

    // Update tenant report count
    await Tenant.findByIdAndUpdate(tenantId, { $inc: { reportCount: 1 } });

    // Update reporter count if authenticated
    if (reporterId) {
      const Reporter = require('../models/Reporter');
      await Reporter.findByIdAndUpdate(reporterId, { $inc: { reportCount: 1 } });
    }

    // AI Analysis (async — don't block the response)
    processReportWithAI(report._id, content, tenantId).catch(console.error);

    return res.status(201).json({
      success: true,
      trackingId,
      message: 'Your report has been submitted securely. Save your tracking ID to monitor progress.',
      reportId: report._id,
    });
  } catch (error) {
    console.error('submitReport error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Background AI processing
async function processReportWithAI(reportId, content, tenantId) {
  try {
    const policies = await Policy.find({ tenantId, isActive: true }).lean();
    const analysis = await analyzeReport(content, policies);

    await Report.findByIdAndUpdate(reportId, {
      aiSummary: analysis.summary || '',
      category: analysis.category || 'Other',
      priority: analysis.priority || 'Medium',
      redFlagScore: analysis.redFlagScore || 0,
      isUrgent: analysis.isUrgent || false,
      keywords: analysis.keywords || [],
      sentimentScore: analysis.sentimentScore || 0,
      aiProcessed: true,
    });
  } catch (err) {
    console.error('AI processing failed for report:', reportId, err.message);
  }
}

// GET /api/reports — Get all reports for org admin (filtered by tenant)
exports.getAllReports = async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 20 } = req.query;
    const tenantId = req.user.role === 'SuperAdmin' ? req.query.tenantId : req.user.tenantId;

    if (!tenantId) return res.status(400).json({ error: 'Tenant ID required.' });

    const filter = { tenantId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { trackingId: { $regex: search, $options: 'i' } },
    ];

    const total = await Report.countDocuments(filter);
    const reports = await Report.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('assignedTo', 'name email')
      .lean();

    // Decrypt content snippet for preview (first 150 chars)
    const reportsWithPreview = reports.map(r => ({
      ...r,
      contentPreview: decrypt(r.encryptedContent).substring(0, 150) + '...',
    }));

    res.json({ success: true, reports: reportsWithPreview, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reports/:id — Get single report (full, decrypted)
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('tenantId', 'orgName')
      .populate('assignedTo', 'name email role')
      .lean();

    if (!report) return res.status(404).json({ error: 'Report not found.' });

    // Tenant guard
    if (req.user.role !== 'SuperAdmin' && String(report.tenantId._id) !== String(req.user.tenantId))
      return res.status(403).json({ error: 'Access denied.' });

    // Decrypt content
    const decryptedContent = decrypt(report.encryptedContent);

    // Fetch evidence files
    const evidence = await Evidence.find({ reportId: report._id }).lean();

    // Log audit
    await AuditLog.create({
      tenantId: report.tenantId._id || report.tenantId,
      staffId: req.user.id,
      action: 'Viewed Report',
      targetId: report._id,
      targetType: 'Report',
    });

    res.json({
      success: true,
      report: { ...report, decryptedContent },
      evidence,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/reports/:id/status — Update report status
exports.updateReportStatus = async (req, res) => {
  try {
    const { status, priority, assignedTo, resolutionNote } = req.body;

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found.' });

    if (req.user.role !== 'SuperAdmin' && String(report.tenantId) !== String(req.user.tenantId))
      return res.status(403).json({ error: 'Access denied.' });

    const updates = {};
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (resolutionNote) updates.resolutionNote = resolutionNote;
    if (status === 'Resolved' || status === 'Dismissed') updates.resolvedAt = new Date();

    const updated = await Report.findByIdAndUpdate(req.params.id, updates, { new: true });

    await AuditLog.create({
      tenantId: report.tenantId,
      staffId: req.user.id,
      action: `Updated Report Status to "${status || 'N/A'}"`,
      targetId: report._id,
      targetType: 'Report',
      details: JSON.stringify(updates),
    });

    res.json({ success: true, report: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reports/track/:trackingId — Public tracking (no auth)
exports.trackReport = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { secretPhrase } = req.query;

    const report = await Report.findOne({ trackingId })
      .populate('tenantId', 'orgName')
      .lean();

    if (!report) return res.status(404).json({ error: 'No report found with this tracking ID.' });

    // If report has a secret phrase, verify it
    if (report.claimHash && secretPhrase) {
      if (hashData(secretPhrase) !== report.claimHash)
        return res.status(401).json({ error: 'Invalid secret phrase.' });
    }

    // Update access key
    await AccessKey.findOneAndUpdate({ trackingId }, { lastAccessedAt: new Date(), $inc: { accessCount: 1 } });

    // Return public-safe info only
    return res.json({
      success: true,
      report: {
        trackingId: report.trackingId,
        title: report.title,
        status: report.status,
        priority: report.priority,
        category: report.category,
        submittedAt: report.createdAt,
        updatedAt: report.updatedAt,
        orgName: report.tenantId?.orgName,
        resolutionNote: report.resolutionNote,
        aiSummary: report.aiSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/reports/my — Reporter's own reports
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ reporterId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('tenantId', 'orgName')
      .lean();

    const result = reports.map(r => ({
      ...r,
      contentPreview: decrypt(r.encryptedContent).substring(0, 150) + '...',
    }));

    res.json({ success: true, reports: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/reports/evidence/:id — Upload evidence files
exports.uploadEvidence = [
  upload.array('files', 5),
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) return res.status(404).json({ error: 'Report not found.' });

      if (!req.files || req.files.length === 0)
        return res.status(400).json({ error: 'No files uploaded.' });

      const evidenceRecords = [];
      for (const file of req.files) {
        const stripped = await stripMetadata(file.path, file.mimetype);
        const evidence = await Evidence.create({
          reportId: report._id,
          tenantId: report.tenantId,
          originalName: file.originalname,
          storedName: file.filename,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
          metadataStripped: stripped,
          virusScanStatus: 'Clean',
        });
        evidenceRecords.push(evidence);
      }

      await Report.findByIdAndUpdate(report._id, { $inc: { evidenceCount: req.files.length } });

      res.json({ success: true, evidence: evidenceRecords, message: `${req.files.length} file(s) uploaded and metadata stripped.` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
];
