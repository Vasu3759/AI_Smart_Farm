const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../src/models/User');

// Connect to a test database before all tests
beforeAll(async () => {
  const url = `mongodb://127.0.0.1/smartfarming_test_db`;
  await mongoose.connect(url);
});

// Clear users before each test
beforeEach(async () => {
  await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Auth API Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual('success');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.email).toEqual('test@example.com');
    });

    it('should not register user if email already exists', async () => {
      // Create first user
      await User.create({
        name: 'Existing User',
        email: 'test@example.com',
        password: 'password123'
      });

      // Try creating user with same email
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User 2',
          email: 'test@example.com',
          password: 'password456'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toEqual('error');
      expect(res.body.message).toEqual('User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user for login tests
      const user = new User({
        name: 'Login Test User',
        email: 'login@example.com',
        password: 'password123'
      });
      await user.save(); // save will hash the password
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('success');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toEqual('error');
    });
  });
});
