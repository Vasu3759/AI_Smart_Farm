const express = require('express');
const router = express.Router();
const { getFarms, createFarm } = require('../controllers/farmController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getFarms).post(protect, createFarm);

module.exports = router;
