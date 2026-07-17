const Farm = require('../models/Farm');

// @desc    Get all farms for logged in user
// @route   GET /api/farms
// @access  Private
const getFarms = async (req, res) => {
  try {
    const farms = await Farm.find({ user: req.user.id });
    res.status(200).json({ status: 'success', count: farms.length, data: farms });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Create new farm
// @route   POST /api/farms
// @access  Private
const createFarm = async (req, res) => {
  try {
    const { name, location, boundary, area, cropType } = req.body;

    if (!name || !location || !area || !cropType) {
      return res.status(400).json({ status: 'error', message: 'Please provide name, location, area, and cropType' });
    }

    const farm = await Farm.create({
      user: req.user.id,
      name,
      location,
      boundary,
      area,
      cropType
    });

    res.status(201).json({ status: 'success', data: farm });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// @desc    Delete a farm
// @route   DELETE /api/farms/:id
// @access  Private
const deleteFarm = async (req, res) => {
  try {
    const farm = await Farm.findOne({ _id: req.params.id, user: req.user.id });

    if (!farm) {
      return res.status(404).json({ status: 'error', message: 'Farm field not found' });
    }

    await Farm.deleteOne({ _id: req.params.id });

    // Delete prediction history linked to this farm
    const Prediction = require('../models/Prediction');
    await Prediction.deleteMany({ farm: req.params.id });

    res.status(200).json({ status: 'success', message: 'Farm field deleted successfully' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getFarms,
  createFarm,
  deleteFarm
};
