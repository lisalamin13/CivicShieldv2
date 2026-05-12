const axios = require('axios');

// Local AI Engine URL (FastAPI)
const AI_URL = 'http://localhost:8000';

// Set default timeout for AI requests to 120 seconds
// Local inference can take time, especially on non-GPU systems
axios.defaults.timeout = 120000;

/**
 * Sends a message to the Local AI Ethics Advisor
 * @param {string} message - The user's query
 * @param {string} context - Company policies or other context
 */
async function getChatResponse(message, context = "", history = []) {
  try {
    const { data } = await axios.post(`${AI_URL}/chat`, { 
      message, 
      context,
      history
    }, { timeout: 120000 });
    
    return data.response;
  } catch (error) {
    console.error('Local AI Engine Error:', error.message);
    throw new Error('AI Advisor is currently unavailable. Please ensure the local AI engine is running.');
  }
}

/**
 * Analyzes a report for category and priority using local NLP
 * @param {string} title 
 * @param {string} description 
 */
async function analyzeReport(title, description) {
  try {
    const { data } = await axios.post(`${AI_URL}/analyze`, { 
      title, 
      description 
    });
    return data;
  } catch (error) {
    console.error('Local AI Analysis Error:', error.message);
    return null;
  }
}

module.exports = {
  getChatResponse,
  analyzeReport
};