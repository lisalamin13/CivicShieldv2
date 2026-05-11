const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function purgeCivicShieldOrg() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const Tenant = require('../models/Tenant');
    const Policy = require('../models/Policy');
    const Report = require('../models/Report');

    // Find the organization with "CivicShield" in its name
    const org = await Tenant.findOne({ orgName: /CivicShield/i });

    if (!org) {
      console.log('Organization "CivicShield Platform" not found. It might already be gone!');
    } else {
      console.log(`Found organization: ${org.orgName} (${org._id})`);

      // Delete associated policies and reports
      const policyCount = await Policy.deleteMany({ tenantId: org._id });
      const reportCount = await Report.deleteMany({ tenantId: org._id });
      
      // Finally, delete the organization itself
      await Tenant.deleteOne({ _id: org._id });

      console.log(`✅ Successfully deleted "${org.orgName}"`);
      console.log(`🗑️ Removed ${policyCount.deletedCount} policies and ${reportCount.deletedCount} reports.`);
    }

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

purgeCivicShieldOrg();
