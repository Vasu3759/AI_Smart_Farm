const axios = require('axios');

/**
 * Generates agricultural recommendations based on weather conditions
 */
const generateRecommendations = (weatherData) => {
  const recommendations = [];
  const { temp } = weatherData.main;
  const { humidity } = weatherData.main;
  const condition = weatherData.weather[0].main.toLowerCase();

  // Temperature rules
  if (temp > 35) {
    recommendations.push("High temperature detected. Increase irrigation to prevent heat stress.");
  } else if (temp < 10) {
    recommendations.push("Low temperature detected. Protect sensitive crops from potential frost.");
  }

  // Humidity rules
  if (humidity > 85) {
    recommendations.push("High humidity detected. Monitor closely for fungal diseases.");
  }

  // Rain rules
  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
    recommendations.push("Rain is expected. Do not irrigate today to prevent waterlogging.");
  } else if (temp > 30 && humidity < 40) {
    recommendations.push("Dry and hot conditions. Ensure optimal irrigation schedule is maintained.");
  }

  if (recommendations.length === 0) {
    recommendations.push("Weather conditions are stable. Follow standard crop maintenance.");
  }

  return recommendations;
};

/**
 * Fetches weather data from OpenWeather API or returns mock data
 */
const getWeatherData = async (lat, lon) => {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  
  // If no API key or dummy key is provided, return mock data
  if (!apiKey || apiKey === 'your_openweather_api_key_here') {
    console.log("Using mock weather data because OPENWEATHER_API_KEY is not set.");
    const mockWeather = {
      main: { temp: 32, humidity: 65 },
      weather: [{ main: "Clouds", description: "scattered clouds" }],
      name: "Mock City"
    };
    return {
      location: mockWeather.name,
      temperature: mockWeather.main.temp,
      humidity: mockWeather.main.humidity,
      condition: mockWeather.weather[0].main,
      description: mockWeather.weather[0].description,
      recommendations: generateRecommendations(mockWeather),
      rainfall: 12,
      isMock: true
    };
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );

    const data = response.data;
    const rainVal = data.rain ? (data.rain['1h'] || data.rain['3h'] || 0) : 0;
    return {
      location: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      condition: data.weather[0].main,
      description: data.weather[0].description,
      recommendations: generateRecommendations(data),
      rainfall: rainVal || (data.weather[0].main.toLowerCase().includes('rain') ? 15 : 0),
      isMock: false
    };
  } catch (error) {
    console.error("OpenWeather API Error:", error.message);
    throw new Error('Failed to fetch weather data');
  }
};

module.exports = {
  getWeatherData,
  generateRecommendations
};
