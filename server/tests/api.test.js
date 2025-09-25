const request = require('supertest');
const { app } = require('../server');

describe('API Health Check', () => {
  test('GET /api/health should return OK', async () => {
    const response = await request(app)
      .get('/api/health');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.timestamp).toBeDefined();
  });
});

describe('Authentication Routes', () => {
  test('POST /api/auth/register should require valid data', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({});
    
    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
  });

  test('POST /api/auth/login should require valid data', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});
    
    expect(response.statusCode).toBe(400);
    expect(response.body.errors).toBeDefined();
  });
});

describe('Protected Routes', () => {
  test('GET /api/projects should require authentication', async () => {
    const response = await request(app)
      .get('/api/projects');
    
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });

  test('GET /api/cost/materials should require authentication', async () => {
    const response = await request(app)
      .get('/api/cost/materials');
    
    expect(response.statusCode).toBe(401);
  });
});