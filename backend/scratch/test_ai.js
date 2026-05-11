require('dotenv').config();
const OpenAI = require('openai');

async function testDeepSeek() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  console.log('Testing DeepSeek with key starting with:', apiKey ? apiKey.substring(0, 8) : 'MISSING');

  if (!apiKey) {
    console.error('❌ No API key found in .env');
    return;
  }

  const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
  });

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello, are you working?' }],
      max_tokens: 10
    });
    console.log('✅ SUCCESS! Response:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ FAILED!');
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    if (error.status === 401) {
      console.error('👉 This means the API key is invalid or expired.');
    } else if (error.status === 402) {
      console.error('👉 This means your DeepSeek account has run out of balance/credits.');
    }
  }
}

testDeepSeek();
