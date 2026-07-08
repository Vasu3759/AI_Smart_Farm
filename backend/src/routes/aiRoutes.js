const express = require('express');
const router = express.Router();
const { getPrediction } = require('../controllers/aiController');
const { protect } = require('../middlewares/authMiddleware');

// Route is protected by JWT authentication
router.post('/predict', protect, getPrediction);

module.exports = router;
