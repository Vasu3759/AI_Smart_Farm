const axios = require('axios');
const Prediction = require('../models/Prediction');

// @desc    Get AI Prediction
// @route   POST /api/ai/predict
// @access  Private
const getPrediction = async (req, res) => {
  try {
    const { 
      crop, year, season, state, temperature, rainfall, 
      humidity, N, P, K, pH, fertilizer, pesticide, area, farmId 
    } = req.body;

    // Validate required features
    if (crop === undefined || year === undefined || season === undefined || state === undefined || 
        temperature === undefined || rainfall === undefined || humidity === undefined || 
        N === undefined || P === undefined || K === undefined || pH === undefined || 
        fertilizer === undefined || pesticide === undefined || area === undefined) {
      return res.status(400).json({ status: 'error', message: 'Missing required features for AI prediction. Please provide all 14 features.' });
    }

    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    
    // Forward the payload to the FastAPI Python service
    const response = await axios.post(`${aiServiceUrl}/api/v1/predict`, {
      crop, year, season, state, temperature, rainfall, humidity, N, P, K, pH, fertilizer, pesticide, area
    });

    const aiData = response.data;

    // Find the user's active farm, or return an error if they haven't registered any fields yet.
    let targetFarmId = farmId;
    if (!targetFarmId) {
      const Farm = require('../models/Farm');
      let farm = await Farm.findOne({ user: req.user.id });
      if (!farm) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'No registered fields found. Please add a field on the home dashboard first.' 
        });
      }
      targetFarmId = farm._id;
    }

    const CROP_MAPPING = {
      '41': 'Rice',
      '54': 'Wheat',
      '24': 'Maize',
      '47': 'Sugarcane',
      '11': 'Cotton',
      '38': 'Potato',
      '31': 'Onion',
      '3': 'Banana',
      '4': 'Barley'
    };
    const cropName = CROP_MAPPING[crop.toString()] || 'Rice';

    const savedPrediction = await Prediction.create({
      farm: targetFarmId,
      user: req.user.id,
      crop: cropName,
      N: parseFloat(N) || 0,
      P: parseFloat(P) || 0,
      K: parseFloat(K) || 0,
      pH: parseFloat(pH) || 0,
      weatherContext: {
        temperature: parseFloat(temperature) || 0,
        humidity: parseFloat(humidity) || 0,
        rainfall: parseFloat(rainfall) || 0
      },
      aiConfidenceScore: aiData.ai_confidence_score,
      predictedYield: aiData.predicted_yield_per_area,
      date: Date.now()
    });

    res.status(200).json({
      status: 'success',
      data: {
        predicted_yield_per_area: aiData.predicted_yield_per_area,
        ai_confidence_score: aiData.ai_confidence_score,
        savedRecordId: savedPrediction ? savedPrediction._id : null
      }
    });

  } catch (error) {
    console.error("AI Service Error:", error.response ? error.response.data : error.message);
    res.status(500).json({ 
      status: 'error', 
      message: error.response && error.response.data.detail 
        ? error.response.data.detail 
        : 'Failed to communicate with the FastAPI AI Service' 
    });
  }
};

module.exports = {
  getPrediction
};
