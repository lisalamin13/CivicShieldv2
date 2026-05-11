require('dotenv').config();
const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');
const Policy = require('../models/Policy');
const StaffUser = require('../models/StaffUser');

async function setup() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'civicshield' });
  
  // 1. Create Tenant
  const cyberTenant = await Tenant.create({
    organizationId: 'ASSAM-CYBER-01',
    orgName: 'Assam CyberSystems',
    sectorType: 'Technology',
    contactEmail: 'security@assamcyber.io',
    contactPhone: '+91-9854000123',
    address: 'Borguri, Tinsukia, Assam',
    subscriptionPlan: 'premium'
  });

  // 2. Create Admin
  const cyberAdmin = await StaffUser.create({
    tenantId: cyberTenant._id,
    name: 'Dr. Pallav Baruah',
    email: 'pallav@assamcyber.io',
    phone: '+919954000123',
    passwordHash: 'Cyber@1234',
    role: 'OrgAdmin',
    isOrgAdmin: true,
    department: 'AI Research'
  });

  // 3. Create Unique Policies
  const cyberPolicies = [
    {
      title: 'Responsible AI & Data Collection Policy',
      category: 'Professional Integrity',
      shortDescription: 'Rules for ethical data gathering and bias prevention in our AI models.',
      policyText: 'Assam CyberSystems is committed to unbiased AI. All datasets must be audited for racial or gender bias before training. Personal data used for training must be anonymized. Any attempt to use customer data without consent for model training is a major violation.'
    },
    {
      title: 'Open Source Engagement Policy',
      category: 'IT & Cybersecurity',
      shortDescription: 'How we contribute to and use open source software.',
      policyText: 'We encourage contributions to open source! However, any pull request to an external project must be reviewed by the security team first. No company API keys or internal endpoints should ever be committed to public repositories.'
    }
  ];

  await Policy.insertMany(cyberPolicies.map(p => ({
    ...p,
    tenantId: cyberTenant._id,
    createdBy: cyberAdmin._id,
    lastUpdatedBy: cyberAdmin._id
  })));

  console.log('🚀 Successfully created Assam CyberSystems with 2 unique policies.');
  process.exit();
}

setup().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
