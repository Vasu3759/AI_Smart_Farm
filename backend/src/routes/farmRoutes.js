const express = require('express');
const router = express.Router();
const { getFarms, createFarm, deleteFarm } = require('../controllers/farmController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getFarms).post(protect, createFarm);
router.route('/:id').delete(protect, deleteFarm);

module.exports = router;
