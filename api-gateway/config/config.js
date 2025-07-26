/**
 * Configuration for API Gateway
 */

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  },
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:60987',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:60987'
    ],
    credentials: true
  },
  port: process.env.PORT || 5001,
  environment: process.env.NODE_ENV || 'development'
};