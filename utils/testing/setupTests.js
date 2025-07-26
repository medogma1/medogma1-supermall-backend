// Jest Setup File for SuperMall Backend Tests
const path = require('path');
const fs = require('fs');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'supermall_test';
process.env.DB_PORT = '3306';
process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use database 1 for tests
process.env.LOG_LEVEL = 'error'; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise during tests
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests unless explicitly needed
  if (process.env.SUPPRESS_TEST_LOGS !== 'false') {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
  
  // Create test directories if they don't exist
  const testDirs = [
    path.join(__dirname, '../../logs'),
    path.join(__dirname, '../../uploads/test'),
    path.join(__dirname, '../../coverage')
  ];
  
  testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
  
  // Clean up test files
  const testUploadsDir = path.join(__dirname, '../../uploads/test');
  if (fs.existsSync(testUploadsDir)) {
    try {
      fs.rmSync(testUploadsDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Custom matchers for better test assertions
expect.extend({
  toBeValidJWT(received) {
    const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    const pass = typeof received === 'string' && jwtRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid JWT`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid JWT`,
        pass: false,
      };
    }
  },
  
  toBeValidEmail(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = typeof received === 'string' && emailRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid email`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid email`,
        pass: false,
      };
    }
  },
  
  toBeValidPhoneNumber(received) {
    const phoneRegex = /^(\+966|0)?[5][0-9]{8}$/; // Saudi phone number format
    const pass = typeof received === 'string' && phoneRegex.test(received.replace(/\s/g, ''));
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid phone number`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid phone number`,
        pass: false,
      };
    }
  },
  
  toBeValidURL(received) {
    try {
      new URL(received);
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } catch {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },
  
  toHaveValidResponseStructure(received) {
    const hasSuccess = 'success' in received;
    const hasValidSuccess = typeof received.success === 'boolean';
    const hasMessage = 'message' in received;
    const hasValidMessage = typeof received.message === 'string';
    
    const pass = hasSuccess && hasValidSuccess && hasMessage && hasValidMessage;
    
    if (pass) {
      return {
        message: () => `expected response not to have valid structure`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected response to have valid structure with success (boolean) and message (string)`,
        pass: false,
      };
    }
  },
  
  toBeWithinTimeRange(received, expectedTime, toleranceMs = 1000) {
    const actualTime = new Date(received).getTime();
    const expectedTimeMs = new Date(expectedTime).getTime();
    const difference = Math.abs(actualTime - expectedTimeMs);
    const pass = difference <= toleranceMs;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within ${toleranceMs}ms of ${expectedTime}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within ${toleranceMs}ms of ${expectedTime}, but difference was ${difference}ms`,
        pass: false,
      };
    }
  }
});

// Helper functions available globally in tests
global.testHelpers = {
  /**
   * Wait for a specified amount of time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  /**
   * Generate random string for testing
   */
  randomString: (length = 10) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  /**
   * Generate random email for testing
   */
  randomEmail: () => {
    const username = global.testHelpers.randomString(8);
    return `${username}@test.com`;
  },
  
  /**
   * Generate random phone number for testing
   */
  randomPhone: () => {
    const number = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `05${number}`;
  },
  
  /**
   * Clean up test data from database
   */
  cleanupTestData: async (db, tables = []) => {
    if (!db) return;
    
    for (const table of tables) {
      try {
        await db.execute(`DELETE FROM ${table} WHERE email LIKE '%@test.com' OR phone LIKE '05%'`);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  },
  
  /**
   * Create test database connection
   */
  createTestDB: () => {
    const mysql = require('mysql2/promise');
    return mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
  },
  
  /**
   * Verify response time is within acceptable limits
   */
  verifyResponseTime: (startTime, maxTime = 2000) => {
    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(maxTime);
    return responseTime;
  },
  
  /**
   * Create mock request object
   */
  createMockRequest: (overrides = {}) => {
    return {
      headers: {},
      body: {},
      params: {},
      query: {},
      user: null,
      ...overrides
    };
  },
  
  /**
   * Create mock response object
   */
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
      redirect: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      get: jest.fn(),
      locals: {}
    };
    return res;
  },
  
  /**
   * Create mock next function
   */
  createMockNext: () => jest.fn()
};

// Database setup for tests
let testDB = null;

beforeAll(async () => {
  // Only create DB connection if needed
  if (process.env.SETUP_TEST_DB === 'true') {
    try {
      testDB = await global.testHelpers.createTestDB();
      global.testDB = testDB;
    } catch (error) {
      console.warn('Could not connect to test database:', error.message);
    }
  }
});

afterAll(async () => {
  // Close database connection
  if (testDB) {
    try {
      await testDB.end();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

// Export for use in other test files
module.exports = {
  testHelpers: global.testHelpers
};