const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  farm: {
    type: mongoose.Schema.ObjectId,
    ref: 'Farm',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  recommendedCrop: {
    type: String
  },
  fertilizerRecommendations: {
    type: [String]
  },
  irrigationSchedule: {
    type: String
  },
  aiConfidenceScore: {
    type: Number
  },
  predictedYield: {
    type: Number
  },
  weatherContext: {
    temperature: Number,
    humidity: Number,
    rainfall: Number
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Prediction', predictionSchema);
