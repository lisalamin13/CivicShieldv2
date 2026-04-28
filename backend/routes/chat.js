// routes/chat.js
const express = require('express');
const chatRouter = express.Router();
const { chat, getTenants } = require('../controllers/chatController');
chatRouter.post('/', chat);
chatRouter.get('/tenants', getTenants);
module.exports = chatRouter;
