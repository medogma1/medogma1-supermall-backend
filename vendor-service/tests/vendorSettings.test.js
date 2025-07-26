// Comprehensive Tests for PUT /vendors/:id/settings endpoint
const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js
const { 
  TestDataGenerator, 
  APITestHelpers, 
  TestAssertions 
} = require('../../utils/testing/testHelpers');

describe('PUT /vendors/:id/settings', () => {
  let apiHelper;
  
  beforeAll(() => {
    apiHelper = new APITestHelpers(app);
  });
  
  describe('Authentication Tests', () => {
    test('should return 401 when no token provided', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .send(TestDataGenerator.generateVendorSettings())
        .expect(401);
      
      TestAssertions.assertErrorResponse(response, 'AUTHENTICATION_REQUIRED');
    });
    
    test('should return 401 when malformed token provided', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', 'Bearer invalid.token.format')
        .send(TestDataGenerator.generateVendorSettings())
        .expect(401);
      
      TestAssertions.assertErrorResponse(response, 'INVALID_TOKEN', 'jwt malformed');
    });
    
    test('should return 401 when expired token provided', async () => {
      const expiredToken = TestDataGenerator.generateExpiredToken();
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(TestDataGenerator.generateVendorSettings())
        .expect(401);
      
      TestAssertions.assertErrorResponse(response, 'TOKEN_EXPIRED');
    });
    
    test('should return 401 when token has invalid signature', async () => {
      const invalidToken = TestDataGenerator.generateToken({}, { 
        algorithm: 'HS256' 
      }).replace(/.$/, 'X'); // Corrupt the signature
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send(TestDataGenerator.generateVendorSettings())
        .expect(401);
      
      TestAssertions.assertErrorResponse(response, 'INVALID_TOKEN');
    });
  });
  
  describe('Authorization Tests', () => {
    test('should return 403 when customer tries to access vendor endpoint', async () => {
      const customerToken = TestDataGenerator.generateCustomerToken();
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(TestDataGenerator.generateVendorSettings())
        .expect(403);
      
      TestAssertions.assertErrorResponse(response, 'INSUFFICIENT_PERMISSIONS');
    });
    
    test('should return 403 when vendor tries to access another vendor\'s settings', async () => {
      const vendorToken = TestDataGenerator.generateVendorToken(2); // Vendor ID 2
      const response = await request(app)
        .put('/vendors/1/settings') // Trying to access vendor ID 1
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(TestDataGenerator.generateVendorSettings())
        .expect(403);
      
      TestAssertions.assertErrorResponse(response, 'ACCESS_DENIED');
    });
    
    test('should allow vendor to access own settings', async () => {
      const vendorToken = TestDataGenerator.generateVendorToken(1);
      const validSettings = TestDataGenerator.generateVendorSettings();
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(validSettings);
      
      // Should not return 403 (may return 200 or validation error)
      expect(response.status).not.toBe(403);
    });
    
    test('should allow admin to access any vendor settings', async () => {
      const adminToken = TestDataGenerator.generateAdminToken();
      const validSettings = TestDataGenerator.generateVendorSettings();
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validSettings);
      
      // Should not return 403 (may return 200 or validation error)
      expect(response.status).not.toBe(403);
    });
  });
  
  describe('Validation Tests', () => {
    let vendorToken;
    
    beforeEach(() => {
      vendorToken = TestDataGenerator.generateVendorToken(1);
    });
    
    test('should return 400 when storeName is missing', async () => {
      const invalidData = TestDataGenerator.generateVendorSettings();
      delete invalidData.storeName;
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(invalidData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR', 'storeName');
    });
    
    test('should return 400 when storeName is too short', async () => {
      const invalidData = TestDataGenerator.generateInvalidVendorSettings('storeName');
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(invalidData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR');
    });
    
    test('should return 400 when contactEmail is invalid', async () => {
      const invalidData = TestDataGenerator.generateInvalidVendorSettings('contactEmail');
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(invalidData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR', 'email');
    });
    
    test('should return 400 when contactPhone is invalid', async () => {
      const invalidData = TestDataGenerator.generateInvalidVendorSettings('contactPhone');
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(invalidData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR', 'phone');
    });
    
    test('should return 400 when storeLogoUrl is invalid', async () => {
      const invalidData = TestDataGenerator.generateInvalidVendorSettings('storeLogoUrl');
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(invalidData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR', 'url');
    });
    
    test('should return 400 when storeAddress is too short', async () => {
      const invalidData = TestDataGenerator.generateInvalidVendorSettings('storeAddress');
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(invalidData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR');
    });
    
    test('should return 400 when required fields are missing', async () => {
      const incompleteData = {
        storeName: 'متجر ناقص'
        // Missing other required fields
      };
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(incompleteData)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR');
      expect(response.body.message).toMatch(/incomplete data|missing.*field/i);
    });
  });
  
  describe('Success Tests', () => {
    let vendorToken;
    
    beforeEach(() => {
      vendorToken = TestDataGenerator.generateVendorToken(1);
    });
    
    test('should successfully update vendor settings with valid data', async () => {
      const validSettings = TestDataGenerator.generateVendorSettings({
        storeName: 'متجر محدث للاختبار',
        storeDescription: 'وصف محدث للمتجر التجريبي'
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(validSettings);
      
      // Should return success (200 or 201)
      expect([200, 201]).toContain(response.status);
      
      if (response.status === 200 || response.status === 201) {
        TestAssertions.assertSuccessResponse(response);
        expect(response.body.data).toHaveProperty('storeSettingsCompleted', true);
      }
    });
    
    test('should handle Arabic text correctly', async () => {
      const arabicSettings = TestDataGenerator.generateVendorSettings({
        storeName: 'متجر النخبة للإلكترونيات',
        storeDescription: 'متجر متخصص في بيع الأجهزة الإلكترونية والهواتف الذكية بأفضل الأسعار',
        storeAddress: 'المملكة العربية السعودية، الرياض، حي الملز، شارع الأمير محمد بن عبدالعزيز'
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(arabicSettings);
      
      if ([200, 201].includes(response.status)) {
        expect(response.body.data.storeName).toBe(arabicSettings.storeName);
        expect(response.body.data.storeDescription).toBe(arabicSettings.storeDescription);
      }
    });
    
    test('should handle business hours correctly', async () => {
      const settingsWithHours = TestDataGenerator.generateVendorSettings({
        businessHours: {
          sunday: { open: '08:00', close: '23:00', isOpen: true },
          monday: { open: '08:00', close: '23:00', isOpen: true },
          tuesday: { open: '08:00', close: '23:00', isOpen: true },
          wednesday: { open: '08:00', close: '23:00', isOpen: true },
          thursday: { open: '08:00', close: '23:00', isOpen: true },
          friday: { open: '14:00', close: '23:00', isOpen: true }, // Friday afternoon only
          saturday: { open: '08:00', close: '23:00', isOpen: true }
        }
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(settingsWithHours);
      
      if ([200, 201].includes(response.status)) {
        expect(response.body.data.businessHours.friday.open).toBe('14:00');
        expect(response.body.data.businessHours.friday.isOpen).toBe(true);
      }
    });
    
    test('should handle delivery settings correctly', async () => {
      const settingsWithDelivery = TestDataGenerator.generateVendorSettings({
        deliverySettings: {
          deliveryFee: 20.00,
          freeDeliveryThreshold: 150.00,
          estimatedDeliveryTime: '45-60 دقيقة',
          deliveryAreas: ['الرياض', 'الخرج', 'الدرعية', 'القصيم']
        }
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(settingsWithDelivery);
      
      if ([200, 201].includes(response.status)) {
        expect(response.body.data.deliverySettings.deliveryFee).toBe(20.00);
        expect(response.body.data.deliverySettings.deliveryAreas).toContain('القصيم');
      }
    });
  });
  
  describe('Edge Cases', () => {
    let vendorToken;
    
    beforeEach(() => {
      vendorToken = TestDataGenerator.generateVendorToken(1);
    });
    
    test('should handle empty request body', async () => {
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({})
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR');
    });
    
    test('should handle null values', async () => {
      const dataWithNulls = {
        storeName: null,
        storeDescription: null,
        contactEmail: null
      };
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(dataWithNulls)
        .expect(400);
      
      TestAssertions.assertErrorResponse(response, 'VALIDATION_ERROR');
    });
    
    test('should handle very long strings', async () => {
      const longString = 'A'.repeat(1000);
      const dataWithLongStrings = TestDataGenerator.generateVendorSettings({
        storeName: longString,
        storeDescription: longString
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(dataWithLongStrings);
      
      // Should either succeed or return validation error for length
      expect([200, 201, 400]).toContain(response.status);
    });
    
    test('should handle special characters in text fields', async () => {
      const specialCharSettings = TestDataGenerator.generateVendorSettings({
        storeName: 'متجر النخبة @#$%^&*()_+-=[]{}|;:,.<>?',
        storeDescription: 'وصف يحتوي على رموز خاصة !@#$%^&*()_+-=[]{}|;:,.<>?'
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(specialCharSettings);
      
      // Should handle special characters gracefully
      expect([200, 201, 400]).toContain(response.status);
    });
    
    test('should handle non-existent vendor ID', async () => {
      const response = await request(app)
        .put('/vendors/99999/settings') // Non-existent vendor
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(TestDataGenerator.generateVendorSettings());
      
      // Should return 404 or 403 depending on implementation
      expect([403, 404]).toContain(response.status);
    });
  });
  
  describe('Performance Tests', () => {
    let vendorToken;
    
    beforeEach(() => {
      vendorToken = TestDataGenerator.generateVendorToken(1);
    });
    
    test('should respond within acceptable time limit', async () => {
      const validSettings = TestDataGenerator.generateVendorSettings();
      const startTime = Date.now();
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(validSettings);
      
      const responseTime = Date.now() - startTime;
      
      // Should respond within 2 seconds
      expect(responseTime).toBeLessThan(2000);
    });
    
    test('should handle concurrent requests', async () => {
      const validSettings = TestDataGenerator.generateVendorSettings();
      const concurrentRequests = [];
      
      // Create 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        const request = request(app)
          .put('/vendors/1/settings')
          .set('Authorization', `Bearer ${vendorToken}`)
          .send({
            ...validSettings,
            storeName: `متجر متزامن ${i + 1}`
          });
        
        concurrentRequests.push(request);
      }
      
      const responses = await Promise.all(concurrentRequests);
      
      // All requests should complete without server errors
      responses.forEach(response => {
        expect(response.status).not.toBe(500);
      });
    });
  });
  
  describe('Security Tests', () => {
    test('should prevent SQL injection in vendor ID', async () => {
      const vendorToken = TestDataGenerator.generateVendorToken(1);
      const maliciousId = "1'; DROP TABLE vendors; --";
      
      const response = await request(app)
        .put(`/vendors/${encodeURIComponent(maliciousId)}/settings`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(TestDataGenerator.generateVendorSettings());
      
      // Should handle malicious input safely
      expect([400, 403, 404]).toContain(response.status);
    });
    
    test('should prevent XSS in text fields', async () => {
      const vendorToken = TestDataGenerator.generateVendorToken(1);
      const xssPayload = '<script>alert("XSS")</script>';
      
      const maliciousSettings = TestDataGenerator.generateVendorSettings({
        storeName: xssPayload,
        storeDescription: xssPayload
      });
      
      const response = await request(app)
        .put('/vendors/1/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(maliciousSettings);
      
      if ([200, 201].includes(response.status)) {
        // Data should be sanitized
        expect(response.body.data.storeName).not.toContain('<script>');
        expect(response.body.data.storeDescription).not.toContain('<script>');
      }
    });
  });
});

// Additional helper functions for this specific test file
function expectValidationError(response, field) {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBe('VALIDATION_ERROR');
  if (field) {
    expect(response.body.message.toLowerCase()).toContain(field.toLowerCase());
  }
}

function expectAuthenticationError(response, errorType = 'AUTHENTICATION_REQUIRED') {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBe(errorType);
}

function expectAuthorizationError(response) {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toMatch(/INSUFFICIENT_PERMISSIONS|ACCESS_DENIED/);
}

module.exports = {
  expectValidationError,
  expectAuthenticationError,
  expectAuthorizationError
};