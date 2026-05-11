const axios = require('axios');

async function testLocalAI() {
  console.log('📡 Pinging Local AI Engine on http://localhost:8000...');
  try {
    const start = Date.now();
    const response = await axios.post('http://localhost:8000/chat', {
      message: 'Hello, are you there?',
      context: 'Test policy: Be helpful.'
    }, { timeout: 10000 });
    
    console.log('✅ SUCCESS!');
    console.log('Time taken:', (Date.now() - start) / 1000, 'seconds');
    console.log('AI Response:', response.data.response);
  } catch (error) {
    console.error('❌ FAILED!');
    if (error.code === 'ECONNREFUSED') {
      console.error('👉 The Python AI Engine is NOT running. Please restart it with: python ai_engine/main.py');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('👉 The AI Engine is running but it is too slow to respond.');
    } else {
      console.error('Error:', error.message);
    }
  }
}

testLocalAI();
