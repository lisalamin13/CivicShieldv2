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

/**
 * Generates an AI reassurance / status update message for a reporter
 * @param {string} title - The report title
 * @param {string} status - The new status
 * @param {string} resolutionNote - Any notes provided by the admin
 */
async function generateReassuranceMessage(title, status, resolutionNote = "") {
  try {
    const { data } = await axios.post(`${AI_URL}/reassure`, {
      title,
      status,
      resolution_note: resolutionNote
    }, { timeout: 120000 });
    return data.response;
  } catch (error) {
    console.error('Local AI Reassurance Error:', error.message);
    return `Thank you for your report. The case status has been updated to "${status}". We assure you that your concerns are taken seriously and handled with utmost confidentiality.`;
  }
}

module.exports = {
  getChatResponse,
  analyzeReport,
  generateReassuranceMessage
};