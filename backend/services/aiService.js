const axios = require('axios');

// Local/Online AI Engine URL (FastAPI)
const AI_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

// Set default timeout for AI requests to 120 seconds
// Local inference can take time, especially on non-GPU systems
axios.defaults.timeout = 120000;

// Helper to check if the AI engine is configured to a local address in a production environment
function isLocalAIUnavailable() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isLocalHost = AI_URL.includes('localhost') || AI_URL.includes('127.0.0.1') || AI_URL.includes('0.0.0.0');
  return isProduction && isLocalHost;
}

/**
 * Sends a message to the Local AI Ethics Advisor
 * @param {string} message - The user's query
 * @param {string} context - Company policies or other context
 */
async function getChatResponse(message, context = "", history = []) {
  if (isLocalAIUnavailable()) {
    console.warn('Skipping AI request in production because AI_ENGINE_URL is pointing to a local address.');
    throw new Error('AI Advisor is currently unavailable in this environment.');
  }
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
  if (isLocalAIUnavailable()) {
    console.warn('Skipping AI request in production because AI_ENGINE_URL is pointing to a local address.');
    return null;
  }
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
 * @param {string} sectorType - The sector/organization type (e.g., Academic, Corporate)
 */
async function generateReassuranceMessage(title, status, resolutionNote = "", sectorType = "") {
  if (isLocalAIUnavailable()) {
    console.warn('Skipping AI request in production because AI_ENGINE_URL is pointing to a local address.');
    return `Thank you for your report. The case status has been updated to "${status}". We assure you that your concerns are taken seriously and handled with utmost confidentiality.`;
  }
  try {
    const { data } = await axios.post(`${AI_URL}/reassure`, {
      title,
      status,
      resolution_note: resolutionNote,
      sector_type: sectorType
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