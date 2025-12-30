const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

router.post('/bouncie', webhookController.handleBouncieWebhook);

module.exports = router;

