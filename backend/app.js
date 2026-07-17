const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Initialize app
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Basic health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running' });
});

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const farmRoutes = require('./src/routes/farmRoutes');
const aiRoutes = require('./src/routes/aiRoutes');
const weatherRoutes = require('./src/routes/weatherRoutes');
const predictionRoutes = require('./src/routes/predictionRoutes');
const marketRoutes = require('./src/routes/marketRoutes');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/market', marketRoutes);


// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: err.message || 'Server Error' });
});

module.exports = app;
