const axios = require('axios');

// Offline/Fallback prices (INR per Quintal) in case API limit is exceeded or server is down
const FALLBACK_PRICES = [
  { cropId: '41', name: 'Rice', pricePerQuintal: 2200, icon: '🌾' },
  { cropId: '54', name: 'Wheat', pricePerQuintal: 2275, icon: '🌾' },
  { cropId: '24', name: 'Maize', pricePerQuintal: 2090, icon: '🌽' },
  { cropId: '47', name: 'Sugarcane', pricePerQuintal: 340, icon: '🎋' },
  { cropId: '11', name: 'Cotton', pricePerQuintal: 7000, icon: '☁️' },
  { cropId: '38', name: 'Potato', pricePerQuintal: 1500, icon: '🥔' },
  { cropId: '31', name: 'Onion', pricePerQuintal: 2000, icon: '🧅' },
  { cropId: '3', name: 'Banana', pricePerQuintal: 1800, icon: '🍌' },
  { cropId: '4', name: 'Barley', pricePerQuintal: 1850, icon: '🌾' }
];

// @desc    Get current crop market prices
// @route   GET /api/market
// @access  Private
const getMarketPrices = async (req, res) => {
  const apiKey = process.env.OGD_API_KEY;

  if (!apiKey) {
    console.log("No OGD_API_KEY configured. Serving baseline commodity rates.");
    return res.status(200).json({
      status: 'success',
      source: 'offline_fallback',
      data: FALLBACK_PRICES
    });
  }

  try {
    // Call official Agmarknet API endpoint (from user's resource ID)
    const apiUrl = `https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=${apiKey}&format=json&limit=150`;
    
    console.log("Fetching live Mandi prices from data.gov.in...");
    const response = await axios.get(apiUrl, { timeout: 4000 }); // 4 second timeout fallback
    const records = response.data.records || [];

    // Map raw records to our target crops
    const updatedPrices = FALLBACK_PRICES.map(crop => {
      // Find matching commodity record (case-insensitive search in response records)
      const matches = records.filter(r => 
        r.commodity && r.commodity.toLowerCase().includes(crop.name.toLowerCase())
      );

      if (matches.length > 0) {
        // Calculate average modal price from all active mandis returning this commodity
        const totalModalPrice = matches.reduce((sum, r) => sum + (parseFloat(r.modal_price) || crop.pricePerQuintal), 0);
        const avgPrice = Math.round(totalModalPrice / matches.length);
        
        return {
          ...crop,
          pricePerQuintal: avgPrice > 0 ? avgPrice : crop.pricePerQuintal,
          source: 'government_api'
        };
      }

      return {
        ...crop,
        source: 'offline_fallback'
      };
    });

    res.status(200).json({
      status: 'success',
      source: 'live_government_api',
      count: updatedPrices.length,
      data: updatedPrices
    });

  } catch (error) {
    console.error("OGD API error, serving fallback catalog:", error.message);
    res.status(200).json({
      status: 'success',
      source: 'offline_fallback_on_error',
      data: FALLBACK_PRICES
    });
  }
};

module.exports = {
  getMarketPrices
};
