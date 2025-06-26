const express = require('express');
const postController = require('../controllers/postController.js');
const auth = require('../middleware/auth.js');
const { validate, schemas } = require('../middleware/validation.js');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Content generation
router.post('/generate', validate(schemas.generateContent), postController.generateContent);

// Post management
router.post('/', validate(schemas.createPost), postController.createPost);
router.get('/', postController.getPosts);

// Scheduling
router.post('/schedule', validate(schemas.schedulePost), postController.schedulePost);
router.get('/scheduled', postController.getScheduledPosts);
router.delete('/scheduled/:id', postController.deleteScheduledPost);

module.exports = router;
