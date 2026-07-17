const express = require('express');
const router = express.Router();
const { getMarketPrices } = require('../controllers/marketController');
const { protect } = require('../middlewares/authMiddleware');

// Route is protected by JWT authentication
router.get('/', protect, getMarketPrices);

module.exports = router;
