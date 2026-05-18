require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const { decrypt } = require('../utils/crypto');

async function test() {
  await connectDB();
  const trackingId = 'CSIN5DQ8USHJX7AZ';
  const report = await Report.findOne({ trackingId });
  if (!report) {
    console.log('Report not found');
    await mongoose.connection.close();
    return;
  }
  console.log(`Report ID: ${report._id}`);
  const messages = await Conversation.find({ reportId: report._id })
    .populate('senderId', 'name role')
    .lean();
  console.log(`Raw conversations count: ${messages.length}`);
  for (const m of messages) {
    console.log(`  - ID: ${m._id}, senderType: ${m.senderType}, isApprovedByHuman: ${m.isApprovedByHuman}`);
  }
  await mongoose.connection.close();
}

test();
