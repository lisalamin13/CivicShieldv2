// routes/conversations.js
const express = require('express');
const convRouter = express.Router();
const { getConversations, sendMessage, approveAIDraft } = require('../controllers/conversationController');
const { protect, optionalAuth } = require('../middleware/auth');

convRouter.get('/:reportId', optionalAuth, getConversations);
convRouter.post('/:reportId', optionalAuth, sendMessage);
convRouter.patch('/:id/approve-ai', protect, approveAIDraft);
module.exports = convRouter;
