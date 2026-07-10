const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

let token;

const { MongoMemoryServer } = require('mongodb-memory-server');
let mongoServer;

// Connect to a test database before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const url = mongoServer.getUri();
  await mongoose.connect(url);

  // Clear users
  await User.deleteMany({});

  // Create a mock user and generate token
  const user = await User.create({
    name: 'Weather Test User',
    email: 'weather@example.com',
    password: 'password123'
  });

  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'supersecret_ci_key', {
    expiresIn: '30d',
  });
}, 120000);

// Close database connection after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Weather API Endpoints', () => {
  describe('GET /api/weather', () => {
    it('should return 401 if no auth token is provided', async () => {
      const res = await request(app).get('/api/weather?lat=28.7041&lon=77.1025');
      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 if lat or lon is missing', async () => {
      const res = await request(app)
        .get('/api/weather?lat=28.7041')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toMatch(/Please provide both latitude/i);
    });

    it('should return weather data and recommendations with valid coordinates', async () => {
      const res = await request(app)
        .get('/api/weather?lat=28.7041&lon=77.1025')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data).toHaveProperty('temperature');
      expect(res.body.data).toHaveProperty('recommendations');
      expect(Array.isArray(res.body.data.recommendations)).toBeTruthy();
      expect(res.body.data).toHaveProperty('isMock');
    });
  });
});
