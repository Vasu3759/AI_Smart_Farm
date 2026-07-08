const mongoose = require('mongoose');

const farmSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a farm name']
  },
  location: {
    // GeoJSON Point
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  boundary: {
    // GeoJSON Polygon
    type: {
      type: String,
      enum: ['Polygon']
    },
    coordinates: {
      type: [[[Number]]] // Array of arrays of arrays of numbers
    }
  },
  area: {
    type: Number, // In acres or hectares
    required: true
  },
  cropType: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Farm', farmSchema);
