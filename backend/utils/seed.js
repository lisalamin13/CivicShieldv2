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
  console.log('Starting CivicShield database seed...\n');

  // ─── CLEANUP ────────────────────────────────────────────────
  await Promise.all([
    Tenant.deleteMany({}), StaffUser.deleteMany({}), Reporter.deleteMany({}),
    Policy.deleteMany({}), Report.deleteMany({}), AccessKey.deleteMany({}),
  ]);
  console.log('Cleared existing data.');

  // ─── TENANTS ────────────────────────────────────────────────
  const civicTenant = await Tenant.create({
    organizationId: 'CIVICSHIELD-MAIN',
    orgName: 'CivicShield Administration',
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
    organizationId: 'ASSAM-CYBER-01',
    orgName: 'Assam CyberSystems',
    sectorType: 'Corporate',
    contactEmail: 'security@assamcyber.io',
    contactPhone: '+91-9854000123',
    address: 'Borguri, Tinsukia, Assam',
    subscriptionPlan: 'premium',
    aiSettings: { tone: 'neutral', strictness: 'medium' },
  });

  console.log('Created 3 organizations (tenants).');

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
    name: 'Dr. Pallav Baruah',
    email: 'pallav@assamcyber.io',
    phone: '+919954000123',
    passwordHash: 'Cyber@1234',
    role: 'OrgAdmin',
    isOrgAdmin: true,
    department: 'AI Research',
  });

  console.log('Created 4 staff accounts.');

  // ─── REPORTERS ───────────────────────────────────────────────
  const reporter1 = await Reporter.create({
    name: 'John Doe (Demo)',
    phone: '+919200000001',
    email: 'reporter@demo.com',
    passwordHash: 'Report@1234',
  });

  console.log('Created 1 reporter account.');

  // ─── POLICIES (CivicShield default) ─────────────────────────
  const civicPolicies = [
    {
      title: 'Anti-Harassment and Discrimination Policy',
      category: 'Harassment & Discrimination',
      shortDescription: 'The organization prohibits all forms of harassment, bullying, and discrimination based on gender, caste, religion, disability, or any protected characteristic.',
      policyText: `The organization is committed to providing a work environment free from harassment and discrimination of any kind.

PROHIBITED CONDUCT includes:
• Verbal or physical harassment based on gender, age, religion, caste, race, disability, sexual orientation, or national origin.
• Sexual harassment — unwelcome advances, requests for sexual favors, or any verbal/physical conduct of a sexual nature.
• Bullying, intimidation, threats, or creating a hostile work environment.
• Discriminatory jokes, slurs, epithets, or stereotyping.

REPORTING: Any employee who experiences or witnesses harassment must report it through the secure anonymous reporting portal immediately. All reports are treated with strict confidentiality.

INVESTIGATION: All complaints will be investigated promptly and impartially. Interim protective measures will be put in place during investigation.

NON-RETALIATION: The organization strictly prohibits retaliation against any individual who reports harassment in good faith. Retaliation is itself a serious violation subject to disciplinary action up to and including termination.

CONSEQUENCES: Substantiated violations will result in disciplinary action ranging from formal warning to immediate termination and, where applicable, referral to law enforcement.

Legal Reference: The Sexual Harassment of Women at Workplace Act (POSH Act), 2013; IT Act, 2000; Indian Penal Code.`,
    },
    {
      title: 'Financial Integrity and Anti-Fraud Policy',
      category: 'Financial Integrity',
      shortDescription: 'All employees must maintain the highest standards of financial integrity. Fraud, embezzlement, and misuse of organizational resources are strictly prohibited.',
      policyText: `The organization is committed to the highest standards of financial integrity and ethical conduct.

PROHIBITED CONDUCT includes:
• Misappropriation, embezzlement, or theft of organizational funds, property, or resources.
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
      shortDescription: 'Employees must protect all personal data, client data, and confidential organizational information in accordance with applicable data protection laws.',
      policyText: `The organization processes sensitive personal data and is bound by strict data protection obligations.

SCOPE: This policy applies to all employees, contractors, and third-party vendors who handle organizational data.

DATA CLASSIFICATION:
• Public: Information approved for public release.
• Internal: Organizational information not for external distribution.
• Confidential: Sensitive business, employee, and client data.
• Restricted: Whistleblower reports, legal files, encryption keys — highest protection.

PROHIBITED CONDUCT includes:
• Unauthorized access, sharing, or disclosure of confidential or restricted data.
• Sharing client or employee personal data with unauthorized third parties.
• Storing sensitive data on personal devices without encryption.
• Photographing or copying restricted documents without authorization.
• Using organizational data for personal benefit.

WHISTLEBLOWER DATA: All grievance reports and reporter identities are classified as Restricted data. Unauthorized access or disclosure of whistleblower identity is a critical violation with immediate termination.

BREACH REPORTING: Data breaches must be reported to the IT Security team within 24 hours of discovery.

Legal Reference: Information Technology Act, 2000; IT (Amendment) Act, 2008; GDPR (for EU clients); Personal Data Protection Bill.`,
    },
    {
      title: 'Whistleblower Protection Policy',
      category: 'Whistleblower Protection',
      shortDescription: 'The organization guarantees absolute protection from retaliation for all individuals who report concerns in good faith.',
      policyText: `The organization is committed to the safety of those who speak up. This policy provides iron-clad protection for all whistleblowers.

PROTECTED DISCLOSURES include reporting:
• Any violation of law, regulation, or organizational policy.
• Fraud, corruption, or financial irregularities.
• Harassment, discrimination, or workplace misconduct.
• Safety violations or environmental hazards.
• Any activity that poses risk to organizational integrity.

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
      shortDescription: 'The organization maintains a safe, healthy work environment. All safety hazards, accidents, and unsafe conditions must be reported immediately.',
      policyText: `The organization is committed to providing a safe and healthy workplace for all employees, visitors, and contractors.

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

MENTAL HEALTH: The organization recognizes mental health as equally important. Employees experiencing mental health challenges are encouraged to access the Employee Assistance Programme (EAP) without fear of stigma.

Legal Reference: Factories Act, 1948; Occupational Safety, Health and Working Conditions Code, 2020.`,
    },
    {
      title: 'IT, Cybersecurity and Acceptable Use Policy',
      category: 'IT & Cybersecurity',
      shortDescription: 'Organizational IT resources must be used responsibly. Unauthorized access, hacking, or misuse of systems is strictly prohibited.',
      policyText: `The organization's technology infrastructure is critical to its operations and must be protected.

ACCEPTABLE USE:
• Organizational devices and systems are for official business use.
• Limited personal use is permitted provided it does not interfere with work.
• Employees must use strong, unique passwords and enable MFA on all systems.

PROHIBITED CONDUCT includes:
• Unauthorized access to systems, databases, or accounts (internal or external).
• Installing unlicensed software or bypassing security controls.
• Sharing login credentials with colleagues or third parties.
• Accessing, downloading, or distributing malicious software.
• Attempting to monitor or intercept network traffic without authorization.
• Using organizational systems for illegal activities, cryptocurrency mining, or personal gain.
• Accessing dark web services or prohibited content on organizational networks.

INCIDENT REPORTING: Any suspected cybersecurity incident — including phishing attempts, unauthorized access, or data anomalies — must be reported to IT Security immediately via the emergency security hotline or this reporting portal.

MONITORING: The organization reserves the right to monitor organizational systems and networks for security purposes, in accordance with applicable law and with appropriate notice.

Legal Reference: Information Technology Act, 2000; Computer Fraud and Abuse Act concepts; ISO 27001 standards.`,
    },
  ];

  const createdPolicies = await Policy.insertMany(
    civicPolicies.map(p => ({ ...p, tenantId: civicTenant._id, createdBy: superAdmin._id, lastUpdatedBy: superAdmin._id }))
  );

  // ADBU (Academic) Policies (9)
  await Policy.insertMany([
    {
      tenantId: uniTenant._id,
      title: 'Student Discipline and Grievance Redressal Policy',
      category: 'Student Grievances & Discipline',
      shortDescription: 'Ensures proper student behavior and provides a fair grievance resolution system.',
      policyText: 'Assam Don Bosco University expects all students to maintain discipline, respect university regulations, and behave responsibly on campus. Any form of misconduct including disruption of classes, abusive behavior, vandalism, or violation of university rules may result in disciplinary action. Students may raise grievances related to academics, facilities, or misconduct through official university channels. All complaints will be handled fairly and confidentially without retaliation.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Academic Honesty and Anti-Plagiarism Policy',
      category: 'Academic Integrity & Anti-Plagiarism',
      shortDescription: 'Promotes academic honesty and prohibits plagiarism or cheating.',
      policyText: 'Students must submit original academic work and maintain honesty in examinations, assignments, projects, and research activities. Copying content without proper citation, using unauthorized materials during examinations, impersonation, or submitting another person’s work as one’s own is strictly prohibited. The university may use plagiarism detection tools to verify academic submissions. Violations may lead to grade penalties, suspension, or disciplinary action.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Campus Safety and Anti-Ragging Policy',
      category: 'Campus Safety & Anti-Ragging',
      shortDescription: 'Provides a safe, secure, and ragging-free campus environment.',
      policyText: 'Assam Don Bosco University maintains a zero-tolerance policy toward ragging, bullying, intimidation, physical abuse, or harassment of students. Any student found engaging in ragging activities either on campus, in hostels, or through online platforms will face strict disciplinary action. Students must also follow campus safety procedures and report suspicious or unsafe activities immediately. The university is committed to ensuring a secure and respectful environment for all students.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Student Data Protection and Privacy Policy',
      category: 'Student Data Privacy & Records',
      shortDescription: 'Protects confidentiality and proper handling of student records and personal information.',
      policyText: 'The university is committed to protecting student personal information, academic records, and confidential data. Unauthorized access, sharing, modification, or misuse of student records is prohibited. Students and staff must use university systems responsibly and protect login credentials from unauthorized access. Sensitive student information may only be accessed for authorized academic or administrative purposes.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Research Ethics and Funding Compliance Policy',
      category: 'Research Ethics & Funding',
      shortDescription: 'Ensures ethical research practices and proper use of research funding.',
      policyText: 'Students and faculty involved in research activities must maintain honesty, transparency, and ethical conduct throughout the research process. Fabrication, falsification, or manipulation of research data is strictly prohibited. Research grants and funding must only be used for approved academic purposes with proper documentation. Any misuse of research funds or unethical experimentation may result in disciplinary and legal action.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Anti-Harassment and Equal Respect Policy',
      category: 'Harassment & Discrimination',
      shortDescription: 'Prevents harassment, discrimination, and disrespectful behavior within the university.',
      policyText: 'All students, faculty, and staff members must maintain a respectful and inclusive environment. Harassment, discrimination, verbal abuse, threats, cyberbullying, or offensive behavior based on gender, religion, ethnicity, disability, language, or background is strictly prohibited. Complaints of harassment will be investigated confidentially, and retaliation against complainants is not allowed.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Student Financial Ethics Policy',
      category: 'Financial Integrity',
      shortDescription: 'Promotes honesty and transparency in financial matters involving students.',
      policyText: 'Students must provide accurate information in scholarship applications, fee submissions, reimbursement requests, and financial aid processes. Submission of forged documents, fee fraud, unauthorized financial transactions, or misuse of university funds is prohibited. Any attempt to manipulate financial records or engage in bribery may result in disciplinary action.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Student Code of General Conduct Policy',
      category: 'General Conduct',
      shortDescription: 'Defines expected student behavior and campus conduct standards.',
      policyText: 'Students are expected to behave responsibly and respectfully toward faculty, staff, visitors, and fellow students. Disruptive behavior, use of abusive language, damage to university property, substance abuse, or violation of university rules is prohibited. Students must follow classroom etiquette, maintain cleanliness, and comply with university instructions during academic and extracurricular activities.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
    {
      tenantId: uniTenant._id,
      title: 'Digital Communication and Social Media Policy',
      category: 'Other',
      shortDescription: 'Regulates responsible online behavior and use of university digital platforms.',
      policyText: 'Students must use university digital platforms, email systems, and online learning resources responsibly. Sharing false information, posting offensive content, cyberbullying, or damaging the reputation of Assam Don Bosco University through social media platforms is prohibited. Students must maintain respectful communication in online classes, discussion forums, and university-related digital spaces.',
      createdBy: orgAdmin1._id, lastUpdatedBy: orgAdmin1._id,
    },
  ]);

  // Assam CyberSystems (Corporate) Policies (10)
  await Policy.insertMany([
    {
      tenantId: corpTenant._id,
      title: 'Anti-Harassment and Respectful Workplace Policy',
      category: 'Harassment & Discrimination',
      shortDescription: 'Ensures a safe, respectful, and discrimination-free workplace for all employees.',
      policyText: 'Assam CyberSystems maintains a zero-tolerance policy toward workplace harassment, bullying, discrimination, or intimidation of any kind. Employees must treat coworkers, clients, interns, vendors, and management with professionalism and respect at all times. Any offensive comments, threats, inappropriate jokes, unwanted advances, or discriminatory behavior based on gender, religion, caste, ethnicity, disability, age, or nationality are strictly prohibited. Reports of harassment will be investigated confidentially, and retaliation against complainants is not allowed. Violations may result in disciplinary action including suspension or termination.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Financial Transparency and Fraud Prevention Policy',
      category: 'Financial Integrity',
      shortDescription: 'Prevents fraud, bribery, and misuse of company financial resources.',
      policyText: 'All employees of Assam CyberSystems must maintain honesty and transparency in financial activities. Submission of false expense claims, invoice manipulation, bribery, unauthorized transactions, or misuse of company funds is strictly prohibited. Employees must follow approved financial procedures and immediately report any suspected fraud or corruption. Financial records must be accurate and properly documented. Violations may lead to termination and legal action.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Confidential Data Protection Policy',
      category: 'Data Privacy',
      shortDescription: 'Protects company, employee, and customer confidential information.',
      policyText: 'Employees are responsible for safeguarding sensitive company and customer information. Confidential data including passwords, project files, client records, and employee information must not be shared with unauthorized individuals. Employees must use secure systems for storing and transferring data. Unauthorized copying, downloading, or leaking of company information is prohibited. Data breaches or privacy incidents must be reported immediately to the cybersecurity team.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Workplace Health and Safety Policy',
      category: 'Workplace Safety',
      shortDescription: 'Ensures a secure and safe working environment for all employees.',
      policyText: 'Assam CyberSystems is committed to maintaining a safe working environment. Employees must follow all safety procedures, emergency protocols, and equipment handling guidelines. Any hazardous activity, violence, threats, or unsafe conduct is strictly prohibited. Employees are required to report accidents, fire hazards, electrical issues, or suspicious behavior immediately. Failure to comply with workplace safety standards may result in disciplinary action.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Conflict of Interest Disclosure Policy',
      category: 'Conflict of Interest',
      shortDescription: 'Prevents personal interests from affecting professional decisions.',
      policyText: 'Employees must avoid situations where personal, financial, or external relationships interfere with company responsibilities. Employees must disclose any conflicts of interest involving vendors, clients, competitors, or business partners. Accepting gifts, favors, or benefits that may influence business decisions is prohibited without management approval. Failure to disclose conflicts of interest may result in disciplinary action.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Whistleblower Protection Policy',
      category: 'Whistleblower Protection',
      shortDescription: 'Protects employees who report unethical or illegal activities.',
      policyText: 'Employees who report unethical behavior, policy violations, fraud, or illegal activities in good faith will be protected from retaliation. Assam CyberSystems encourages employees to report concerns confidentially through approved reporting channels. Threatening, harassing, or punishing whistleblowers is strictly prohibited. All reports will be investigated fairly and professionally.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Cybersecurity and Device Usage Policy',
      category: 'IT & Cybersecurity',
      shortDescription: 'Defines secure use of company systems, devices, and networks.',
      policyText: 'Employees must use company devices, networks, and software responsibly and securely. Strong passwords and multi-factor authentication must be used wherever applicable. Unauthorized software installation, sharing of login credentials, accessing malicious websites, or bypassing security controls is prohibited. Employees must report phishing attempts, malware infections, or suspicious cyber activities immediately. Company systems are monitored for security and compliance purposes.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Professional Conduct and Ethics Policy',
      category: 'Professional Integrity',
      shortDescription: 'Promotes honesty, professionalism, and ethical behavior at work.',
      policyText: 'Employees must maintain integrity, honesty, and professionalism in all business interactions. Falsifying attendance, project work, reports, qualifications, or company documents is prohibited. Employees must communicate respectfully with clients and coworkers and avoid unethical practices including plagiarism or intellectual property theft. Professional misconduct may result in disciplinary action or termination.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Employee Behavior and Discipline Policy',
      category: 'General Conduct',
      shortDescription: 'Defines acceptable workplace behavior and disciplinary expectations.',
      policyText: 'Employees are expected to maintain respectful and responsible behavior during work hours. Repeated lateness, excessive absenteeism, misuse of company property, disruptive behavior, or failure to follow company procedures may result in disciplinary action. Substance abuse, inappropriate language, and intentional damage to company assets are strictly prohibited. Employees must follow workplace etiquette and organizational standards at all times.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
    {
      tenantId: corpTenant._id,
      title: 'Remote Work and Communication Policy',
      category: 'Other',
      shortDescription: 'Establishes guidelines for remote work and online communication.',
      policyText: 'Employees working remotely must maintain secure internet connections and protect company data from unauthorized access. Official communication platforms must be used for work-related discussions and documentation. Employees are expected to remain available during assigned work hours and maintain professional communication standards. Sharing confidential company information through personal or unsecured platforms is prohibited.',
      createdBy: orgAdmin2._id, lastUpdatedBy: orgAdmin2._id,
    },
  ]);

  console.log('Created policies for all organizations.');

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
      priority: 'Urgent',
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

  console.log('Created 5 sample reports with tracking IDs.');

  // ─── PRINT SUMMARY ───────────────────────────────────────────
  console.log('\n' + '═'.repeat(60));
  console.log('CIVICSHIELD SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log('\nDEMO LOGIN CREDENTIALS:\n');
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
  console.log('ORG ADMIN (Assam CyberSystems):');
  console.log('  Phone    : +919954000123');
  console.log('  Password : Cyber@1234');
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
  console.error('Seed failed:', err);
  process.exit(1);
});
