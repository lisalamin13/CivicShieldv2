const Inquiry = require('../models/Inquiry');
const AuditLog = require('../models/AuditLog');

// POST /api/inquiries
exports.submitInquiry = async (req, res) => {
  try {
    const { orgName, contactPerson, email, phone, message } = req.body;
    
    if (!orgName || !contactPerson || !email || !message) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const inquiry = await Inquiry.create({
      orgName, contactPerson, email, phone, message
    });

    res.status(201).json({ success: true, message: 'Your inquiry has been sent successfully. Our team will contact you soon.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/inquiries (SuperAdmin only)
exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.json({ success: true, inquiries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PATCH /api/inquiries/:id (SuperAdmin only)
exports.updateInquiryStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { status }, { new: true });
    
    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found.' });

    res.json({ success: true, inquiry });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
