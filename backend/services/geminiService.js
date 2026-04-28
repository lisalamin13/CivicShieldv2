const OpenAI = require('openai');

let client = null;

function getClient() {
  if (!client) {
    if (!process.env.DEEPSEEK_API_KEY) {
      console.warn('⚠️  DEEPSEEK_API_KEY not set. AI features will use mock responses.');
      return null;
    }
    client = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }
  return client;
}

const MODEL = 'deepseek-chat';

const ETHICS_SYSTEM_PROMPT = `You are the CivicShield Ethics Advisor — a professional, empathetic AI assistant embedded in a secure anonymous grievance reporting platform.

Your primary role is to:
1. Help users understand organizational compliance policies and whether their concern constitutes a reportable violation.
2. Guide users on how to structure and submit their grievance effectively.
3. Explain whistleblower protections available to them.
4. Answer questions about the anonymous reporting process.
5. Help users determine the severity and category of their issue.

IMPORTANT RULES:
- NEVER ask for personally identifying information (name, employee ID, etc.).
- NEVER make legal determinations or give legal advice. Always recommend consulting HR or legal counsel.
- Always be empathetic, non-judgmental, and professional.
- If a user seems distressed, acknowledge their feelings before proceeding.
- Keep responses concise and clear (under 200 words unless details are needed).
- If an issue involves physical safety, immediately recommend reporting and contacting emergency services.

ORGANIZATIONAL POLICIES IN EFFECT:
{POLICIES}

When responding:
- Cite the relevant policy section when applicable.
- Use bullet points for clarity.
- End with a clear recommendation: whether to report, escalate, or seek HR guidance.`;

async function getChatResponse(userMessage, policies = [], history = []) {
  const deepseek = getClient();
  if (!deepseek) return getMockResponse(userMessage);

  try {
    const policyText = policies.length > 0
      ? policies.map(p => `**${p.title} (${p.category})**:\n${p.policyText.substring(0, 400)}`).join('\n\n---\n\n')
      : 'No specific policies loaded. Provide general guidance on ethical workplace conduct.';

    const systemPrompt = ETHICS_SYSTEM_PROMPT.replace('{POLICIES}', policyText);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || (msg.parts?.[0]?.text ?? ''),
      })),
      { role: 'user', content: userMessage },
    ];

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('DeepSeek chat error:', error.message);
    return getMockResponse(userMessage);
  }
}

async function analyzeReport(reportContent, policies = []) {
  const deepseek = getClient();
  if (!deepseek) return getMockAnalysis();

  try {
    const policyContext = policies
      .map(p => `${p.title}: ${p.shortDescription || p.policyText.substring(0, 150)}`)
      .join('\n');

    const prompt = `You are an AI compliance analyst for CivicShield. Analyze the grievance report below and return ONLY a valid JSON object — no markdown, no explanation, no code fences.

REPORT CONTENT:
"${reportContent.substring(0, 1000)}"

ORGANIZATIONAL POLICIES:
${policyContext}

Return ONLY this JSON:
{
  "summary": "2-3 sentence executive summary of the report",
  "category": "one of: Harassment, Discrimination, Financial Fraud, Data Privacy, Safety Violation, Conflict of Interest, Cybersecurity, Professional Misconduct, Retaliation, Academic Dishonesty, Other",
  "priority": "one of: Low, Medium, High, Critical",
  "redFlagScore": <integer 0-100, higher means more urgent>,
  "isUrgent": <true or false>,
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "sentimentScore": <float -1.0 to 1.0, negative means distressed>
}`;

    const response = await deepseek.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a JSON-only compliance analysis engine. Return only valid JSON, no other text.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.1,
    });

    const text = response.choices[0].message.content.trim();
    const cleaned = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('DeepSeek analyzeReport error:', error.message);
    return getMockAnalysis();
  }
}

function getMockResponse(message) {
  const lower = message.toLowerCase();
  if (lower.includes('harass') || lower.includes('bully') || lower.includes('abuse')) {
    return `I understand this may be a difficult situation. Based on our **Anti-Harassment and Discrimination Policy**, any conduct that creates a hostile environment is a reportable violation.\n\n**What you should do:**\n- Document incidents with dates, times, and witnesses\n- Submit a report using the anonymous reporting form\n- Your identity will be fully protected\n\nWould you like guidance on how to structure your report?`;
  }
  if (lower.includes('fraud') || lower.includes('money') || lower.includes('financial') || lower.includes('brib')) {
    return `Financial misconduct is taken very seriously under our **Financial Integrity and Anti-Fraud Policy**.\n\n**Key points:**\n- Misappropriation of funds or falsification of records is a clear violation\n- You are protected from retaliation under our Whistleblower Protection Policy\n- Evidence such as documents or screenshots can be submitted securely\n\nI recommend submitting a report. Shall I help you categorize this issue?`;
  }
  if (lower.includes('privacy') || lower.includes('data') || lower.includes('leak')) {
    return `Data privacy concerns fall under our **Data Privacy and Confidentiality Policy**.\n\n**What qualifies:**\n- Unauthorized sharing of personal or confidential data\n- Data breaches not reported within 24 hours\n- Unauthorized access to systems or accounts\n\nThis should be reported immediately. Would you like help structuring your submission?`;
  }
  if (lower.includes('safe') || lower.includes('danger') || lower.includes('injur')) {
    return `Safety concerns are covered under our **Workplace Safety and Health Policy**.\n\n**Immediate steps:**\n- If there is immediate danger, contact emergency services first\n- Document the unsafe condition with details and location\n- Submit a report — all safety violations must be addressed promptly\n\nShall I guide you through the submission?`;
  }
  if (lower.includes('anonymous') || lower.includes('identity') || lower.includes('protect')) {
    return `Your identity is protected by design — not just by policy.\n\n**How CivicShield protects you:**\n- All report content is **AES-256 encrypted** before storage\n- No IP addresses or device identifiers are logged\n- GPS and metadata are stripped from uploaded files\n- Only a hashed tracking ID connects you to your report\n\nYou can report completely anonymously — no account needed.`;
  }
  return `Hello! I'm the CivicShield Ethics Advisor. I'm here to help you understand your organization's policies and guide you through the reporting process safely and anonymously.\n\nCould you describe your concern? I'll help determine whether it falls under our compliance policies.\n\n**Common topics I can help with:**\n- Harassment or discrimination\n- Financial fraud or misconduct\n- Data privacy violations\n- Workplace safety issues\n- Whistleblower protections`;
}

function getMockAnalysis() {
  return {
    summary: 'The report describes a potential policy violation that requires administrative review.',
    category: 'Other',
    priority: 'Medium',
    redFlagScore: 45,
    isUrgent: false,
    keywords: ['policy violation', 'misconduct', 'review required'],
    sentimentScore: -0.4,
  };
}

module.exports = { getChatResponse, analyzeReport };