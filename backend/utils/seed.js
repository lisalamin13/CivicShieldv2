require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Tenant = require('../models/Tenant');
const StaffUser = require('../models/StaffUser');
const Reporter = require('../models/Reporter');
const Policy = require('../models/Policy');
const Report = require('../models/Report');
const AccessKey = require('../models/AccessKey');
const { encrypt, generateTrackingId, hashData } = require('./crypto');

const connectDB = require('../config/db');

async function seed() {
  await connectDB();
  console.log('🌱 Starting CivicShield database seed...\n');

  // ─── CLEANUP ────────────────────────────────────────────────
  await Promise.all([
    Tenant.deleteMany({}), StaffUser.deleteMany({}), Reporter.deleteMany({}),
    Policy.deleteMany({}), Report.deleteMany({}), AccessKey.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data.');

  // ─── TENANTS ────────────────────────────────────────────────
  const civicTenant = await Tenant.create({
    organizationId: 'CIVICSHIELD-MAIN',
    orgName: 'CivicShield Platform',
    sectorType: 'Technology',
    contactEmail: 'admin@civicshield.io',
    contactPhone: '+91-8575599561',
    address: 'Guwahati, Assam, India',
    isDefault: true,
    subscriptionPlan: 'premium',
    aiSettings: { tone: 'formal', strictness: 'high' },
  });

  const uniTenant = await Tenant.create({
    organizationId: 'ADBU-2024',
    orgName: 'Assam Don Bosco University',
    sectorType: 'Academic',
    contactEmail: 'compliance@adbu.edu.in',
    contactPhone: '+91-9000000002',
    address: 'Azara, Guwahati – 781017',
    subscriptionPlan: 'basic',
    aiSettings: { tone: 'formal', strictness: 'high' },
  });

  const corpTenant = await Tenant.create({
    organizationId: 'TECHCORP-NE01',
    orgName: 'NorthEast TechCorp Pvt. Ltd.',
    sectorType: 'Corporate',
    contactEmail: 'ethics@netechcorp.in',
    contactPhone: '+91-9000000003',
    address: 'Dispur, Guwahati, Assam',
    subscriptionPlan: 'premium',
    aiSettings: { tone: 'neutral', strictness: 'medium' },
  });

  console.log('🏢 Created 3 organizations (tenants).');

  // ─── STAFF USERS ────────────────────────────────────────────
  const superAdmin = await StaffUser.create({
    tenantId: civicTenant._id,
    name: 'Super Administrator',
    email: 'superadmin@civicshield.io',
    phone: '+917629904753',
    passwordHash: 'Super@1234',
    role: 'SuperAdmin',
    isOrgAdmin: true,
    department: 'Platform Administration',
  });

  const orgAdmin1 = await StaffUser.create({
    tenantId: uniTenant._id,
    name: 'Mr. B Jyoti',
    email: 'orgadmin@adbu.edu.in',
    phone: '+919864911404',
    passwordHash: 'Admin@1234',
    role: 'OrgAdmin',
    isOrgAdmin: true,
    department: 'Internal Compliance Cell',
  });

  const investigator1 = await StaffUser.create({
    tenantId: uniTenant._id,
    name: 'Mr. Rajiv Borah',
    email: 'investigator@adbu.edu.in',
    phone: '+919100000003',
    passwordHash: 'Invest@1234',
    role: 'Investigator',
    department: 'Student Affairs',
  });

  const orgAdmin2 = await StaffUser.create({
    tenantId: corpTenant._id,
    name: 'Ms. Ananya Das',
    email: 'orgadmin@netechcorp.in',
    phone: '+919100000004',
    passwordHash: 'Admin@1234',
    role: 'OrgAdmin',
    isOrgAdmin: true,
    department: 'HR & Compliance',
  });

  console.log('👔 Created 4 staff accounts.');

  // ─── REPORTERS ───────────────────────────────────────────────
  const reporter1 = await Reporter.create({
    name: 'John Doe (Demo)',
    phone: '+919200000001',
    email: 'reporter@demo.com',
    passwordHash: 'Report@1234',
  });

  console.log('📝 Created 1 reporter account.');

  // ─── POLICIES (CivicShield default) ─────────────────────────
  const civicPolicies = [
    {
      title: 'Anti-Harassment and Discrimination Policy',
      category: 'Harassment & Discrimination',
      shortDescription: 'CivicShield prohibits all forms of harassment, bullying, and discrimination based on gender, caste, religion, disability, or any protected characteristic.',
      policyText: `CivicShield is committed to providing a work environment free from harassment and discrimination of any kind.

PROHIBITED CONDUCT includes:
• Verbal or physical harassment based on gender, age, religion, caste, race, disability, sexual orientation, or national origin.
• Sexual harassment — unwelcome advances, requests for sexual favors, or any verbal/physical conduct of a sexual nature.
• Bullying, intimidation, threats, or creating a hostile work environment.
• Discriminatory jokes, slurs, epithets, or stereotyping.

REPORTING: Any employee who experiences or witnesses harassment must report it through the CivicShield anonymous reporting portal immediately. All reports are treated with strict confidentiality.

INVESTIGATION: All complaints will be investigated promptly and impartially. Interim protective measures will be put in place during investigation.

NON-RETALIATION: CivicShield strictly prohibits retaliation against any individual who reports harassment in good faith. Retaliation is itself a serious violation subject to disciplinary action up to and including termination.

CONSEQUENCES: Substantiated violations will result in disciplinary action ranging from formal warning to immediate termination and, where applicable, referral to law enforcement.

Legal Reference: The Sexual Harassment of Women at Workplace Act (POSH Act), 2013; IT Act, 2000; Indian Penal Code.`,
    },
    {
      title: 'Financial Integrity and Anti-Fraud Policy',
      category: 'Financial Integrity',
      shortDescription: 'All employees must maintain the highest standards of financial integrity. Fraud, embezzlement, and misuse of company resources are strictly prohibited.',
      policyText: `CivicShield is committed to the highest standards of financial integrity and ethical conduct.

PROHIBITED CONDUCT includes:
• Misappropriation, embezzlement, or theft of company funds, property, or resources.
• Falsification of financial records, expense claims, timesheets, or any official documents.
• Unauthorized access to financial systems or data.
• Accepting or offering bribes, kickbacks, or improper gifts from clients, vendors, or partners.
• Creating fictitious vendors, employees, or transactions.
• Conflicts of interest involving personal financial benefit.

REPORTING OBLIGATIONS: All employees who become aware of or suspect financial misconduct are obligated to report it immediately through the anonymous reporting portal. Failure to report known violations is itself a disciplinary offense.

INVESTIGATION AUTHORITY: The Finance and Compliance Committee has full authority to investigate all reported financial misconduct, with access to all relevant records.

CONSEQUENCES: Financial fraud will result in immediate suspension pending investigation, termination upon confirmation, recovery of misappropriated funds, and referral to law enforcement authorities.

Legal Reference: Indian Penal Code Sections 406, 409, 420; Prevention of Corruption Act; Companies Act, 2013.`,
    },
    {
      title: 'Data Privacy and Confidentiality Policy',
      category: 'Data Privacy',
      shortDescription: 'Employees must protect all personal data, client data, and confidential company information in accordance with applicable data protection laws.',
      policyText: `CivicShield processes sensitive personal data and is bound by strict data protection obligations.

SCOPE: This policy applies to all employees, contractors, and third-party vendors who handle CivicShield data.

DATA CLASSIFICATION:
• Public: Information approved for public release.
• Internal: Company information not for external distribution.
• Confidential: Sensitive business, employee, and client data.
• Restricted: Whistleblower reports, legal files, encryption keys — highest protection.

PROHIBITED CONDUCT includes:
• Unauthorized access, sharing, or disclosure of confidential or restricted data.
• Sharing client or employee personal data with unauthorized third parties.
• Storing sensitive data on personal devices without encryption.
• Photographing or copying restricted documents without authorization.
• Using company data for personal benefit.

WHISTLEBLOWER DATA: All grievance reports and reporter identities are classified as Restricted data. Unauthorized access or disclosure of whistleblower identity is a critical violation with immediate termination.

BREACH REPORTING: Data breaches must be reported to the IT Security team within 24 hours of discovery.

Legal Reference: Information Technology Act, 2000; IT (Amendment) Act, 2008; GDPR (for EU clients); Personal Data Protection Bill.`,
    },
    {
      title: 'Whistleblower Protection Policy',
      category: 'Whistleblower Protection',
      shortDescription: 'CivicShield guarantees absolute protection from retaliation for all individuals who report concerns in good faith.',
      policyText: `CivicShield's entire mission is built on the safety of those who speak up. This policy provides iron-clad protection for all whistleblowers.

PROTECTED DISCLOSURES include reporting:
• Any violation of law, regulation, or company policy.
• Fraud, corruption, or financial irregularities.
• Harassment, discrimination, or workplace misconduct.
• Safety violations or environmental hazards.
• Any activity that poses risk to CivicShield's integrity.

ANONYMITY GUARANTEE:
• All reports submitted through this platform use end-to-end AES-256 encryption.
• No IP addresses, device identifiers, or metadata are stored.
• Reporter identity is never shared with the subject of the complaint.
• Access to reporter information is restricted to the Super Administrator only.

ANTI-RETALIATION PROTECTIONS:
Retaliation includes: termination, demotion, harassment, unfavorable assignments, threats, or any adverse employment action taken against a whistleblower.
• Any manager or employee found to have retaliated against a whistleblower will face immediate disciplinary action, up to and including termination.
• The whistleblower will be entitled to all available legal remedies.

GOOD FAITH REPORTING: Protection applies to reporters acting in good faith. False accusations made with malicious intent are not protected.

Legal Reference: Whistle Blowers Protection Act, 2014; Section 177 of Companies Act, 2013.`,
    },
    {
      title: 'Workplace Safety and Health Policy',
      category: 'Workplace Safety',
      shortDescription: 'CivicShield maintains a safe, healthy work environment. All safety hazards, accidents, and unsafe conditions must be reported immediately.',
      policyText: `CivicShield is committed to providing a safe and healthy workplace for all employees, visitors, and contractors.

EMPLOYEE OBLIGATIONS:
• Follow all safety procedures and use required protective equipment.
• Report unsafe conditions, equipment failures, or accidents immediately.
• Participate in mandatory safety training programs.
• Never operate equipment while impaired.

PROHIBITED CONDUCT includes:
• Creating or ignoring known safety hazards.
• Tampering with safety equipment or fire systems.
• Bringing unauthorized substances or weapons onto premises.
• Engaging in horseplay or reckless behavior in the workplace.

ACCIDENT REPORTING: All accidents, near-misses, and occupational illnesses must be reported within 24 hours. Failure to report is a disciplinary offense.

EMERGENCY PROCEDURES: In case of fire, medical emergency, or security threat, evacuate immediately and contact emergency services. Emergency contacts are posted at all exits.

MENTAL HEALTH: CivicShield recognizes mental health as equally important. Employees experiencing mental health challenges are encouraged to access the Employee Assistance Programme (EAP) without fear of stigma.

Legal Reference: Factories Act, 1948; Occupational Safety, Health and Working Conditions Code, 2020.`,
    },
    {
      title: 'IT, Cybersecurity and Acceptable Use Policy',
      category: 'IT & Cybersecurity',
      shortDescription: 'Company IT resources must be used responsibly. Unauthorized access, hacking, or misuse of systems is strictly prohibited.',
      policyText: `CivicShield's technology infrastructure is critical to its operations and must be protected.

ACCEPTABLE USE:
• Company devices and systems are for official business use.
• Limited personal use is permitted provided it does not interfere with work.
• Employees must use strong, unique passwords and enable MFA on all systems.

PROHIBITED CONDUCT includes:
• Unauthorized access to systems, databases, or accounts (internal or external).
• Installing unlicensed software or bypassing security controls.
• Sharing login credentials with colleagues or third parties.
• Accessing, downloading, or distributing malicious software.
• Attempting to monitor or intercept network traffic without authorization.
• Using company systems for illegal activities, cryptocurrency mining, or personal gain.
• Accessing dark web services or prohibited content on company networks.

INCIDENT REPORTING: Any suspected cybersecurity incident — including phishing attempts, unauthorized access, or data anomalies — must be reported to IT Security immediately via the emergency security hotline or this reporting portal.

MONITORING: CivicShield reserves the right to monitor company-owned systems and networks for security purposes, in accordance with applicable law and with appropriate notice.

Legal Reference: Information Technology Act, 2000; Computer Fraud and Abuse Act concepts; ISO 27001 standards.`,
    },
  ];

  const createdPolicies = await Policy.insertMany(
    civicPolicies.map(p => ({ ...p, tenantId: civicTenant._id, createdBy: superAdmin._id, lastUpdatedBy: superAdmin._id }))
  );

  // ADBU Policies
  await Policy.insertMany([
    {
      tenantId: uniTenant._id,
      title: 'Academic Integrity and Anti-Plagiarism Policy',
      category: 'Professional Integrity',
      shortDescription: 'All academic work must be original. Plagiarism, cheating, and academic fraud are grounds for serious disciplinary action.',
      policyText: `Assam Don Bosco University upholds the highest standards of academic integrity.\n\nPROHIBITED CONDUCT:\n• Plagiarism: Presenting another's work as your own without proper citation.\n• Fabrication: Inventing data, citations, or research results.\n• Cheating: Using unauthorized materials during examinations.\n• Collusion: Unauthorized collaboration on individual assignments.\n• Contract cheating: Paying others to complete academic work.\n• Misrepresentation of credentials or qualifications.\n\nREPORTING: Students and faculty can report suspected violations anonymously through this portal.\n\nCONSEQUENCES: Disciplinary actions range from academic warning, zero grade on assessment, suspension, to expulsion from the university.\n\nAppeals process available within 14 days of disciplinary decision.`,
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Student Grievance and Anti-Ragging Policy',
      category: 'Harassment & Discrimination',
      shortDescription: 'ADBU has zero tolerance for ragging. All forms of ragging, bullying, and student harassment are strictly prohibited.',
      policyText: `In compliance with UGC regulations, ADBU has zero tolerance for ragging.\n\nRAGGING INCLUDES:\n• Any act that causes physical or psychological harm to students.\n• Forcing students to perform humiliating acts.\n• Verbal abuse, threats, or intimidation of junior students.\n• Any act that disrupts the academic environment.\n\nREPORTING: All incidents can be reported anonymously through this portal or directly to the Anti-Ragging Committee. Reports are handled with absolute confidentiality.\n\nCONSEQUENCES: Suspension, expulsion, debarment from examinations, FIR with local police as per Supreme Court directives.\n\nLegal Reference: UGC (Prevention, Prohibition and Punishment of Ragging) Regulations, 2009; Supreme Court directions in SLP No. 24295/2006.`,
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
  ]);

  console.log('📋 Created policies for all organizations.');

  // ─── SAMPLE REPORTS ──────────────────────────────────────────
  const sampleReports = [
    {
      tenantId: uniTenant._id,
      title: 'Repeated Harassment by Department Head',
      content: 'The HOD of the Computer Science department has been consistently making inappropriate comments about female students during lab sessions. This has been happening for the past 3 months. Multiple students are afraid to report this openly. The behavior includes making sexist remarks, giving lower grades without academic basis, and singling out specific students for humiliation in front of the class.',
      category: 'Harassment',
      priority: 'High',
      status: 'Under Review',
      redFlagScore: 82,
      isUrgent: true,
      department: 'Computer Science',
    },
    {
      tenantId: uniTenant._id,
      title: 'Suspected Exam Paper Leak',
      content: 'I have strong reason to believe that the mid-semester examination paper for Database Management Systems was leaked before the exam. Several students who were known to be struggling in the course scored unusually high marks. I overheard a conversation in the library about obtaining the paper in advance. The pattern of scores is very suspicious.',
      category: 'Academic Dishonesty',
      priority: 'High',
      status: 'In Investigation',
      redFlagScore: 71,
      isUrgent: false,
      department: 'MCA Programme',
    },
    {
      tenantId: uniTenant._id,
      title: 'Missing Library Funds',
      content: 'The student union fee collected for library development (Rs. 50,000 approximately) does not appear to have been used for its stated purpose. New books promised for the MCA section have not arrived despite the collection happening last semester. The treasurer has been evasive when questioned about the expenditure report.',
      category: 'Financial Fraud',
      priority: 'Medium',
      status: 'Open',
      redFlagScore: 60,
      isUrgent: false,
      department: 'Student Affairs',
    },
    {
      tenantId: corpTenant._id,
      title: 'Manager Demanding Personal Favors',
      content: 'My direct manager has been making increasingly inappropriate requests that seem tied to my performance appraisal. The requests started subtly but have escalated. I feel my career advancement is being conditioned on compliance. I am afraid to raise this internally as the manager is close to the director.',
      category: 'Harassment',
      priority: 'Critical',
      status: 'Open',
      redFlagScore: 91,
      isUrgent: true,
      department: 'Engineering',
    },
    {
      tenantId: corpTenant._id,
      title: 'Falsified Client Billing Records',
      content: 'I work in accounts and have noticed that hours billed to our major client (Project Brahmaputra) are being inflated consistently each month. The project manager appears to be aware of this. Over-billing appears to be approximately 15-20% above actual hours worked. I have copies of the original timesheets versus what was submitted.',
      category: 'Financial Fraud',
      priority: 'High',
      status: 'Under Review',
      redFlagScore: 78,
      isUrgent: false,
      department: 'Finance',
    },
  ];

  for (const r of sampleReports) {
    const trackingId = generateTrackingId();
    const encryptedContent = encrypt(r.content);
    const report = await Report.create({
      tenantId: r.tenantId,
      trackingId,
      title: r.title,
      encryptedContent,
      category: r.category,
      priority: r.priority,
      status: r.status,
      redFlagScore: r.redFlagScore,
      isUrgent: r.isUrgent,
      department: r.department,
      isAnonymous: true,
      aiProcessed: true,
      aiSummary: `AI Summary: ${r.title}. This report has been automatically analyzed and flagged with a risk score of ${r.redFlagScore}/100. Immediate review recommended for ${r.priority.toLowerCase()} priority cases.`,
      keywords: r.title.split(' ').slice(0, 3).map(w => w.toLowerCase()),
    });
    await AccessKey.create({ reportId: report._id, trackingId, hashedToken: hashData(trackingId) });
  }

  await Tenant.findByIdAndUpdate(uniTenant._id, { reportCount: 3 });
  await Tenant.findByIdAndUpdate(corpTenant._id, { reportCount: 2 });

  console.log('📊 Created 5 sample reports with tracking IDs.');

  // ─── PRINT SUMMARY ───────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('✅  CIVICSHIELD SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log('\n🔐 DEMO LOGIN CREDENTIALS:\n');
  console.log('SUPER ADMIN:');
  console.log('  Phone    : +917629904753');
  console.log('  Password : Super@1234');
  console.log('  OTP      : 123456  (test mode)');
  console.log('  Role     : SuperAdmin\n');
  console.log('ORG ADMIN (ADBU):');
  console.log('  Phone    : +919864911404');
  console.log('  Password : Admin@1234');
  console.log('  OTP      : 123456  (test mode)\n');
  console.log('INVESTIGATOR (ADBU):');
  console.log('  Phone    : +919100000003');
  console.log('  Password : Invest@1234');
  console.log('  OTP      : 123456  (test mode)\n');
  console.log('ORG ADMIN (NE TechCorp):');
  console.log('  Phone    : +919100000004');
  console.log('  Password : Admin@1234');
  console.log('  OTP      : 123456  (test mode)\n');
  console.log('REPORTER (Registered):');
  console.log('  Phone    : +919200000001');
  console.log('  Password : Report@1234\n');
  console.log('NOTE: In test mode, OTP is always 123456.');
  console.log('═'.repeat(60) + '\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
