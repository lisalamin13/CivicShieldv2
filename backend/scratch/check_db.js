require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Conversation = require('../models/Conversation');
const Report = require('../models/Report');
const { decrypt } = require('../utils/crypto');

async function check() {
  await connectDB();
  const reports = await Report.find({});
  console.log(`Total Reports: ${reports.length}`);
  for (const r of reports) {
    const convs = await Conversation.find({ reportId: r._id });
    console.log(`Report: ${r.title} (${r.trackingId}) | Status: ${r.status}`);
    console.log(`  Conversations count: ${convs.length}`);
    for (const c of convs) {
      console.log(`    - [${c.senderType}] ${decrypt(c.encryptedMessage)}`);
    }
  }
  await mongoose.connection.close();
}

check();
