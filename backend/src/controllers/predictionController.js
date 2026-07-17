const Prediction = require('../models/Prediction');

// @desc    Get all predictions for logged in user
// @route   GET /api/predictions
// @access  Private
const getPredictions = async (req, res) => {
  try {
    const predictions = await Prediction.find({ user: req.user.id })
                                        .populate('farm', 'name area')
                                        .sort({ date: -1 });

    // Filter and identify predictions where the target farm no longer exists
    const validPredictions = [];
    const orphanedIds = [];

    for (const pred of predictions) {
      if (pred.farm) {
        validPredictions.push(pred);
      } else {
        orphanedIds.push(pred._id);
      }
    }

    // Flush orphaned predictions from the database automatically
    if (orphanedIds.length > 0) {
      await Prediction.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`Cleaned up ${orphanedIds.length} orphaned prediction records.`);
    }

    res.status(200).json({ status: 'success', count: validPredictions.length, data: validPredictions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getPredictions
};
