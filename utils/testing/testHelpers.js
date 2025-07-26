// Comprehensive Testing Helpers and Utilities
const jwt = require('jsonwebtoken');
const request = require('supertest');
const config = require('../config');

/**
 * Test Data Generators
 */
class TestDataGenerator {
  /**
   * Generate valid JWT tokens for testing
   */
  static generateToken(payload = {}, options = {}) {
    const defaultPayload = {
      id: 1,
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const tokenPayload = { ...defaultPayload, ...payload };
    const tokenOptions = { 
      expiresIn: '24h',
      ...options 
    };
    
    return jwt.sign(tokenPayload, config.jwt.secret, tokenOptions);
  }
  
  /**
   * Generate expired token
   */
  static generateExpiredToken(payload = {}) {
    const expiredPayload = {
      id: 1,
      email: 'test@example.com',
      role: 'user',
      iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      exp: Math.floor(Date.now() / 1000) - 1800  // 30 minutes ago
    };
    
    return jwt.sign({ ...expiredPayload, ...payload }, config.jwt.secret);
  }
  
  /**
   * Generate malformed token
   */
  static generateMalformedToken() {
    return 'invalid.token.format';
  }
  
  /**
   * Generate vendor token
   */
  static generateVendorToken(vendorId = 1, overrides = {}) {
    return this.generateToken({
      id: vendorId,
      vendorId: vendorId,
      role: 'vendor',
      email: `vendor${vendorId}@test.com`,
      ...overrides
    });
  }
  
  /**
   * Generate admin token
   */
  static generateAdminToken(overrides = {}) {
    return this.generateToken({
      id: 999,
      role: 'admin',
      email: 'admin@test.com',
      permissions: ['all'],
      ...overrides
    });
  }
  
  /**
   * Generate customer token
   */
  static generateCustomerToken(customerId = 1, overrides = {}) {
    return this.generateToken({
      id: customerId,
      role: 'customer',
      email: `customer${customerId}@test.com`,
      ...overrides
    });
  }
  
  /**
   * Generate valid vendor settings data
   */
  static generateVendorSettings(overrides = {}) {
    return {
      storeName: 'متجر الاختبار',
      storeDescription: 'هذا متجر تجريبي لاختبار النظام والتأكد من عمل جميع الوظائف بشكل صحيح',
      storeLogoUrl: 'https://example.com/logo.png',
      contactEmail: 'store@test.com',
      contactPhone: '0501234567',
      storeAddress: 'الرياض، حي النخيل، شارع الملك فهد، مبنى رقم 123',
      businessHours: {
        sunday: { open: '09:00', close: '22:00', isOpen: true },
        monday: { open: '09:00', close: '22:00', isOpen: true },
        tuesday: { open: '09:00', close: '22:00', isOpen: true },
        wednesday: { open: '09:00', close: '22:00', isOpen: true },
        thursday: { open: '09:00', close: '22:00', isOpen: true },
        friday: { open: '14:00', close: '22:00', isOpen: true },
        saturday: { open: '09:00', close: '22:00', isOpen: true }
      },
      deliverySettings: {
        deliveryFee: 15.00,
        freeDeliveryThreshold: 100.00,
        estimatedDeliveryTime: '30-45 دقيقة',
        deliveryAreas: ['الرياض', 'الخرج', 'الدرعية']
      },
      socialMedia: {
        instagram: '@test_store',
        twitter: '@test_store',
        facebook: 'test.store',
        website: 'https://teststore.com'
      },
      isActive: true,
      allowReviews: true,
      minimumOrderAmount: 50.00,
      metaTitle: 'متجر الاختبار - أفضل المنتجات',
      metaDescription: 'متجر الاختبار يقدم أفضل المنتجات بأسعار منافسة وجودة عالية',
      keywords: ['تسوق', 'منتجات', 'جودة', 'أسعار منافسة'],
      ...overrides
    };
  }
  
  /**
   * Generate invalid vendor settings data
   */
  static generateInvalidVendorSettings(invalidField = 'storeName') {
    const validData = this.generateVendorSettings();
    
    switch (invalidField) {
      case 'storeName':
        validData.storeName = 'A'; // Too short
        break;
      case 'contactEmail':
        validData.contactEmail = 'invalid-email'; // Invalid format
        break;
      case 'contactPhone':
        validData.contactPhone = '123'; // Invalid format
        break;
      case 'storeLogoUrl':
        validData.storeLogoUrl = 'not-a-url'; // Invalid URL
        break;
      case 'storeAddress':
        validData.storeAddress = 'short'; // Too short
        break;
      default:
        delete validData[invalidField]; // Remove required field
    }
    
    return validData;
  }
  
  /**
   * Generate product data
   */
  static generateProduct(overrides = {}) {
    return {
      name: 'منتج تجريبي',
      description: 'وصف المنتج التجريبي للاختبار',
      price: 99.99,
      category: 'electronics',
      vendorId: 1,
      stock: 100,
      images: ['https://example.com/product1.jpg'],
      specifications: {
        brand: 'Test Brand',
        model: 'Test Model',
        warranty: '1 year'
      },
      isActive: true,
      ...overrides
    };
  }
  
  /**
   * Generate order data
   */
  static generateOrder(overrides = {}) {
    return {
      customerId: 1,
      vendorId: 1,
      items: [
        {
          productId: 1,
          quantity: 2,
          price: 99.99,
          name: 'منتج تجريبي'
        }
      ],
      totalAmount: 199.98,
      deliveryAddress: {
        street: 'شارع الملك فهد',
        city: 'الرياض',
        district: 'النخيل',
        postalCode: '12345',
        country: 'السعودية'
      },
      paymentMethod: 'credit_card',
      status: 'pending',
      ...overrides
    };
  }
}

/**
 * API Test Helpers
 */
class APITestHelpers {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Make authenticated request
   */
  authenticatedRequest(method, url, token, data = null) {
    const req = request(this.app)[method.toLowerCase()](url)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');
    
    if (data) {
      req.send(data);
    }
    
    return req;
  }
  
  /**
   * Test authentication scenarios
   */
  async testAuthenticationScenarios(endpoint, method = 'get', data = null) {
    const results = {};
    
    // Test without token
    results.noToken = await request(this.app)[method](endpoint)
      .send(data)
      .expect(401);
    
    // Test with malformed token
    results.malformedToken = await request(this.app)[method](endpoint)
      .set('Authorization', 'Bearer invalid.token.format')
      .send(data)
      .expect(401);
    
    // Test with expired token
    const expiredToken = TestDataGenerator.generateExpiredToken();
    results.expiredToken = await request(this.app)[method](endpoint)
      .set('Authorization', `Bearer ${expiredToken}`)
      .send(data)
      .expect(401);
    
    return results;
  }
  
  /**
   * Test validation scenarios
   */
  async testValidationScenarios(endpoint, method, validData, invalidFields = []) {
    const results = {};
    
    // Test with valid data
    const validToken = TestDataGenerator.generateVendorToken();
    results.validData = await this.authenticatedRequest(method, endpoint, validToken, validData);
    
    // Test with invalid data for each field
    for (const field of invalidFields) {
      const invalidData = TestDataGenerator.generateInvalidVendorSettings(field);
      results[`invalid_${field}`] = await this.authenticatedRequest(method, endpoint, validToken, invalidData)
        .expect(400);
    }
    
    return results;
  }
  
  /**
   * Test authorization scenarios
   */
  async testAuthorizationScenarios(endpoint, method = 'get', data = null) {
    const results = {};
    
    // Test with customer token (should fail for vendor endpoints)
    const customerToken = TestDataGenerator.generateCustomerToken();
    results.customerAccess = await this.authenticatedRequest(method, endpoint, customerToken, data)
      .expect(403);
    
    // Test with vendor token (should succeed for own resources)
    const vendorToken = TestDataGenerator.generateVendorToken(1);
    results.vendorAccess = await this.authenticatedRequest(method, endpoint.replace(':id', '1'), vendorToken, data);
    
    // Test with different vendor token (should fail)
    const otherVendorToken = TestDataGenerator.generateVendorToken(2);
    results.otherVendorAccess = await this.authenticatedRequest(method, endpoint.replace(':id', '1'), otherVendorToken, data)
      .expect(403);
    
    // Test with admin token (should succeed)
    const adminToken = TestDataGenerator.generateAdminToken();
    results.adminAccess = await this.authenticatedRequest(method, endpoint.replace(':id', '1'), adminToken, data);
    
    return results;
  }
}

/**
 * Database Test Helpers
 */
class DatabaseTestHelpers {
  /**
   * Clean test data
   */
  static async cleanTestData(db, tables = []) {
    for (const table of tables) {
      await db.execute(`DELETE FROM ${table} WHERE email LIKE '%@test.com'`);
    }
  }
  
  /**
   * Create test vendor
   */
  static async createTestVendor(db, vendorData = {}) {
    const defaultVendor = {
      business_name: 'Test Vendor',
      email: 'vendor@test.com',
      phone: '0501234567',
      business_type: 'retail',
      commercial_register: '1234567890',
      status: 'active'
    };
    
    const vendor = { ...defaultVendor, ...vendorData };
    
    const [result] = await db.execute(
      'INSERT INTO vendors (business_name, email, phone, business_type, commercial_register, status) VALUES (?, ?, ?, ?, ?, ?)',
      [vendor.business_name, vendor.email, vendor.phone, vendor.business_type, vendor.commercial_register, vendor.status]
    );
    
    return { id: result.insertId, ...vendor };
  }
  
  /**
   * Create test product
   */
  static async createTestProduct(db, productData = {}) {
    const defaultProduct = {
      name: 'Test Product',
      description: 'Test product description',
      price: 99.99,
      vendor_id: 1,
      category_id: 1,
      stock: 100,
      status: 'active'
    };
    
    const product = { ...defaultProduct, ...productData };
    
    const [result] = await db.execute(
      'INSERT INTO products (name, description, price, vendor_id, category_id, stock, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product.name, product.description, product.price, product.vendor_id, product.category_id, product.stock, product.status]
    );
    
    return { id: result.insertId, ...product };
  }
}

/**
 * Performance Test Helpers
 */
class PerformanceTestHelpers {
  /**
   * Measure response time
   */
  static async measureResponseTime(requestFunction) {
    const startTime = Date.now();
    const result = await requestFunction();
    const endTime = Date.now();
    
    return {
      duration: endTime - startTime,
      result: result
    };
  }
  
  /**
   * Load test endpoint
   */
  static async loadTest(requestFunction, options = {}) {
    const {
      concurrency = 10,
      duration = 30000, // 30 seconds
      rampUp = 5000 // 5 seconds
    } = options;
    
    const results = [];
    const startTime = Date.now();
    const endTime = startTime + duration;
    
    // Ramp up
    const rampUpInterval = rampUp / concurrency;
    const workers = [];
    
    for (let i = 0; i < concurrency; i++) {
      setTimeout(() => {
        const worker = this.createWorker(requestFunction, endTime, results);
        workers.push(worker);
      }, i * rampUpInterval);
    }
    
    // Wait for test completion
    await new Promise(resolve => setTimeout(resolve, duration + 1000));
    
    return this.analyzeResults(results);
  }
  
  /**
   * Create worker for load testing
   */
  static async createWorker(requestFunction, endTime, results) {
    while (Date.now() < endTime) {
      try {
        const measurement = await this.measureResponseTime(requestFunction);
        results.push({
          timestamp: Date.now(),
          duration: measurement.duration,
          success: true,
          statusCode: measurement.result.status
        });
      } catch (error) {
        results.push({
          timestamp: Date.now(),
          duration: 0,
          success: false,
          error: error.message
        });
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  /**
   * Analyze load test results
   */
  static analyzeResults(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const durations = successful.map(r => r.duration);
    
    durations.sort((a, b) => a - b);
    
    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageResponseTime: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      medianResponseTime: durations[Math.floor(durations.length / 2)],
      p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
      p99ResponseTime: durations[Math.floor(durations.length * 0.99)],
      minResponseTime: Math.min(...durations),
      maxResponseTime: Math.max(...durations),
      requestsPerSecond: results.length / ((results[results.length - 1].timestamp - results[0].timestamp) / 1000)
    };
  }
}

/**
 * Test Assertions
 */
class TestAssertions {
  /**
   * Assert response structure
   */
  static assertResponseStructure(response, expectedStructure) {
    const checkStructure = (obj, structure, path = '') => {
      for (const [key, type] of Object.entries(structure)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in obj)) {
          throw new Error(`Missing property: ${currentPath}`);
        }
        
        if (typeof type === 'string') {
          if (typeof obj[key] !== type) {
            throw new Error(`Invalid type for ${currentPath}: expected ${type}, got ${typeof obj[key]}`);
          }
        } else if (typeof type === 'object' && type !== null) {
          checkStructure(obj[key], type, currentPath);
        }
      }
    };
    
    checkStructure(response.body, expectedStructure);
  }
  
  /**
   * Assert error response
   */
  static assertErrorResponse(response, expectedErrorCode, expectedMessage = null) {
    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error', expectedErrorCode);
    
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  }
  
  /**
   * Assert success response
   */
  static assertSuccessResponse(response, expectedData = null) {
    expect(response.body).toHaveProperty('success', true);
    
    if (expectedData) {
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject(expectedData);
    }
  }
}

module.exports = {
  TestDataGenerator,
  APITestHelpers,
  DatabaseTestHelpers,
  PerformanceTestHelpers,
  TestAssertions
};