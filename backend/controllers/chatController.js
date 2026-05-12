const { getChatResponse } = require('../services/aiService');
const Policy = require('../models/Policy');
const Tenant = require('../models/Tenant');

// POST /api/chat
exports.chat = async (req, res) => {
  try {
    const { message, tenantId, history = [] } = req.body;

    if (!message || !message.trim())
      return res.status(400).json({ error: 'Message is required.' });

    if (!tenantId)
      return res.status(400).json({ error: 'Tenant ID is required.' });

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Organization not found.' });

    // Fetch active policies for this tenant
    const policies = await Policy.find({ tenantId, isActive: true })
      .select('title category policyText shortDescription')
      .lean();

    // Format policies as a readable string for AI context
    const policyContext = policies.map(p => 
      `TITLE: ${p.title}\nCATEGORY: ${p.category}\nCONTENT: ${p.policyText || p.shortDescription}`
    ).join('\n\n---\n\n');

    console.log(`📡 Sending query to Local AI for Org: ${tenant.orgName}...`);
    const response = await getChatResponse(message, policyContext, history);
    console.log(`✅ AI Responded successfully.`);

    res.json({ success: true, response, timestamp: new Date() });
  } catch (error) {
    console.error('❌ Chat Controller Error:', error.message);
    res.status(500).json({ error: 'The AI Advisor is busy thinking or took too long to respond. Please try again in a few seconds!' });
  }
};

// GET /api/chat/tenants — Public: list tenants for chatbot organization selector
exports.getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find({ 
      isSuspended: false,
      organizationId: { $ne: 'CIVICSHIELD-MAIN' }
    })
      .select('orgName organizationId sectorType _id')
      .lean();
    res.json({ success: true, tenants });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
