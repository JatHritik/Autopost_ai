const express = require('express');
const authController = require('../controllers/authController.js');
const auth = require('../middleware/auth.js');
const { validate, schemas } = require('../middleware/validation.js');

const router = express.Router();

// Public routes
router.post('/register', validate(schemas.register), authController.register);
router.post('/login', validate(schemas.login), authController.login);

// Protected routes
router.get('/profile', auth, authController.getProfile);

module.exports = router;

