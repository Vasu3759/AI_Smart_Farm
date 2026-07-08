const { getWeatherData } = require('../services/weatherService');

// @desc    Get weather data and recommendations
// @route   GET /api/weather
// @access  Private
const getWeather = async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide both latitude (lat) and longitude (lon) query parameters.' 
      });
    }

    const weatherData = await getWeatherData(lat, lon);

    res.status(200).json({
      status: 'success',
      data: weatherData
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  getWeather
};
