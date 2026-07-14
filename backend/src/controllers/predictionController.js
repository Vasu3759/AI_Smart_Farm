const Prediction = require('../models/Prediction');

// @desc    Get all predictions for logged in user
// @route   GET /api/predictions
// @access  Private
const getPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user.id })
                                        .populate('farm', 'name area')
                                        .sort({ date: -1 }); // Newest first

    res.status(200).json({ status: 'success', count: predictions.length, data: predictions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getPredictions
};
