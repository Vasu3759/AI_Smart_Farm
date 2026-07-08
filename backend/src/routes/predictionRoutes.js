const express = require('express');
const router = express.Router();
const { getPredictions } = require('../controllers/predictionController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getPredictions);

module.exports = router;
