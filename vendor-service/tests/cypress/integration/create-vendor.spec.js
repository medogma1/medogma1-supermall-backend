/**
 * اختبارات Cypress لواجهة API لإنشاء بائع جديد
 */

describe('إنشاء بائع جديد API', () => {
  // بيانات بائع صالحة للاختبار
  const validVendorData = {
    name: 'تاجر اختبار',
    email: 'test-vendor@example.com',
    phone: '0123456789',
    user_id: 12345,
    business_type: 'retail',
    storeName: 'متجر اختبار',
    storeDescription: 'وصف متجر الاختبار',
    storeLogoUrl: 'https://example.com/logo.png',
    contactEmail: 'contact@example.com',
    contactPhone: '0123456789',
    storeAddress: 'عنوان متجر الاختبار',
    country: 'مصر',
    governorate: 'القاهرة',
    nationalId: '12345678901234'
  };

  // قبل كل اختبار، نقوم بتنظيف قاعدة البيانات (إذا كان ذلك ممكنًا)
  beforeEach(() => {
    // يمكن استخدام طلب API لتنظيف البيانات أو استخدام أوامر مخصصة
    // هذا مثال فقط، قد تحتاج إلى تعديله حسب بنية التطبيق الخاص بك
    cy.task('db:clean', { table: 'vendors' }).catch(err => {
      // تجاهل الأخطاء هنا لأن هذه مهمة اختيارية
      console.log('تعذر تنظيف قاعدة البيانات:', err);
    });
  });

  it('يجب إنشاء بائع جديد بنجاح مع بيانات صالحة', () => {
    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: validVendorData,
      failOnStatusCode: false
    }).then((response) => {
      // التحقق من الاستجابة
      expect(response.status).to.eq(201);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('created successfully');
      expect(response.body).to.have.property('vendor');
      expect(response.body.vendor).to.have.property('id');
      expect(response.body.vendor).to.have.property('name', validVendorData.name);
      expect(response.body.vendor).to.have.property('email', validVendorData.email);
    });
  });

  it('يجب أن يفشل الإنشاء عند عدم توفير الحقول المطلوبة', () => {
    // نسخة من البيانات الصالحة مع حذف الحقول المطلوبة
    const invalidData = { ...validVendorData };
    delete invalidData.name;
    delete invalidData.email;

    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: invalidData,
      failOnStatusCode: false
    }).then((response) => {
      // التحقق من الاستجابة
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('required');
    });
  });

  it('يجب أن يفشل الإنشاء عند استخدام بريد إلكتروني موجود بالفعل', () => {
    // أولاً، نقوم بإنشاء بائع
    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: validVendorData,
      failOnStatusCode: false
    }).then(() => {
      // ثم نحاول إنشاء بائع آخر بنفس البريد الإلكتروني
      const duplicateEmailData = {
        ...validVendorData,
        name: 'تاجر آخر',
        user_id: 54321 // معرف مستخدم مختلف
      };

      cy.request({
        method: 'POST',
        url: '/api/vendors',
        body: duplicateEmailData,
        failOnStatusCode: false
      }).then((response) => {
        // التحقق من الاستجابة
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('already exists');
      });
    });
  });

  it('يجب أن يفشل الإنشاء عند استخدام معرف مستخدم موجود بالفعل', () => {
    // أولاً، نقوم بإنشاء بائع
    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: validVendorData,
      failOnStatusCode: false
    }).then(() => {
      // ثم نحاول إنشاء بائع آخر بنفس معرف المستخدم
      const duplicateUserIdData = {
        ...validVendorData,
        name: 'تاجر آخر',
        email: 'another-vendor@example.com' // بريد إلكتروني مختلف
      };

      cy.request({
        method: 'POST',
        url: '/api/vendors',
        body: duplicateUserIdData,
        failOnStatusCode: false
      }).then((response) => {
        // التحقق من الاستجابة
        expect(response.status).to.eq(400);
        expect(response.body).to.have.property('message');
        expect(response.body.message).to.include('already exists');
      });
    });
  });

  it('يجب أن يفشل الإنشاء عند استخدام معرف مستخدم غير صالح', () => {
    // نسخة من البيانات الصالحة مع معرف مستخدم غير صالح
    const invalidUserIdData = { ...validVendorData, user_id: 'not-a-number' };

    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: invalidUserIdData,
      failOnStatusCode: false
    }).then((response) => {
      // التحقق من الاستجابة
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('user_id must be a number');
    });
  });

  it('يجب أن يفشل الإنشاء عند استخدام بريد إلكتروني غير صالح', () => {
    // نسخة من البيانات الصالحة مع بريد إلكتروني غير صالح
    const invalidEmailData = { ...validVendorData, email: 'not-an-email' };

    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: invalidEmailData,
      failOnStatusCode: false
    }).then((response) => {
      // التحقق من الاستجابة
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('Invalid vendor data');
    });
  });

  it('يجب أن يفشل الإنشاء عند استخدام رقم هاتف غير صالح', () => {
    // نسخة من البيانات الصالحة مع رقم هاتف غير صالح
    const invalidPhoneData = { ...validVendorData, phone: 'not-a-phone' };

    cy.request({
      method: 'POST',
      url: '/api/vendors',
      body: invalidPhoneData,
      failOnStatusCode: false
    }).then((response) => {
      // التحقق من الاستجابة
      expect(response.status).to.eq(400);
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.include('Invalid vendor data');
    });
  });
});