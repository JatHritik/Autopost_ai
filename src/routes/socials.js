const express = require('express');
const socialController = require('../controllers/socialController');
const auth = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Social account management
router.get('/accounts', socialController.getSocialAccounts);
router.delete('/accounts/:platform', socialController.disconnectAccount);

// Platform connections
router.post('/connect/instagram', validate(schemas.connectSocial), socialController.connectInstagram);
router.post('/connect/linkedin', validate(schemas.connectSocial), socialController.connectLinkedIn);
router.post('/connect/twitter', validate(schemas.connectTwitter), socialController.connectTwitter);

// Publishing
router.post('/publish', validate(schemas.publishNow), socialController.publishNow);

module.exports = router;