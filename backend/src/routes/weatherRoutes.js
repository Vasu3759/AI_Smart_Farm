const express = require('express');
const router = express.Router();
const { getWeather } = require('../controllers/weatherController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getWeather);

module.exports = router;
