/**
 * Authorization Tests
 * SuperMall Backend - Security Tests
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const config = require('../utils/config');

describe('Authorization Tests', () => {
  let adminToken, vendorToken, userToken, vendor2Token;
  
  beforeAll(() => {
    // إنشاء توكنات الاختبار
    adminToken = jwt.sign(
      { id: 1, role: 'admin', email: 'admin@test.com' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    vendorToken = jwt.sign(
      { id: 54, vendorId: 54, role: 'vendor', email: 'vendor54@test.com' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    vendor2Token = jwt.sign(
      { id: 55, vendorId: 55, role: 'vendor', email: 'vendor55@test.com' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    
    userToken = jwt.sign(
      { id: 1, role: 'user', email: 'user@test.com' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  describe('GET /vendors - قائمة البائعين', () => {
    it('يجب أن يسمح للمدير بالوصول', async () => {
      const response = await request(app)
        .get('/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('vendors');
    });

    it('يجب أن يرفض وصول البائع', async () => {
      const response = await request(app)
        .get('/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);
      
      expect(response.body.message).toContain('صلاحيات المدير مطلوبة');
    });

    it('يجب أن يرفض وصول المستخدم العادي', async () => {
      const response = await request(app)
        .get('/vendors')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
      
      expect(response.body.message).toContain('صلاحيات المدير مطلوبة');
    });
  });

  describe('GET /vendors/:id/settings - إعدادات البائع', () => {
    it('يجب أن يسمح للمدير بالوصول لأي بائع', async () => {
      const response = await request(app)
        .get('/vendors/54/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('يجب أن يسمح للبائع بالوصول لإعداداته', async () => {
      const response = await request(app)
        .get('/vendors/54/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(200);
    });

    it('يجب أن يرفض وصول البائع لإعدادات بائع آخر', async () => {
      const response = await request(app)
        .get('/vendors/55/settings')
        .set('Authorization', `Bearer ${vendorToken}`)
        .expect(403);
      
      expect(response.body.message).toContain('يمكنك الوصول لبياناتك فقط');
    });

    it('يجب أن يرفض وصول المستخدم العادي', async () => {
      const response = await request(app)
        .get('/vendors/54/settings')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('POST /vendors - إنشاء بائع جديد', () => {
    it('يجب أن يسمح للمدير فقط', async () => {
      const vendorData = {
        name: 'بائع جديد',
        email: 'newvendor@test.com',
        phone: '1234567890'
      };

      const response = await request(app)
        .post('/vendors')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(vendorData)
        .expect(201);
    });

    it('يجب أن يرفض وصول البائع', async () => {
      const vendorData = {
        name: 'بائع جديد',
        email: 'newvendor2@test.com',
        phone: '1234567891'
      };

      const response = await request(app)
        .post('/vendors')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send(vendorData)
        .expect(403);
    });
  });
});