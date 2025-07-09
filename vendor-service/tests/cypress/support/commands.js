// ***********************************************
// هذا المثال يوضح كيفية إنشاء أوامر مخصصة وإضافتها إلى Cypress.
//
// للمزيد من المعلومات حول الأوامر المخصصة راجع:
// https://on.cypress.io/custom-commands
// ***********************************************

// أمر مخصص للتسجيل في النظام (إذا كان مطلوبًا للاختبارات)
Cypress.Commands.add('login', (email, password) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    // حفظ رمز المصادقة في localStorage أو cookies
    window.localStorage.setItem('token', response.body.token);
    return response;
  });
});

// أمر مخصص لتنظيف البيانات (إذا كان مطلوبًا للاختبارات)
Cypress.Commands.add('cleanVendors', () => {
  // هذا مثال فقط، قد تحتاج إلى تعديله حسب بنية التطبيق الخاص بك
  cy.request({
    method: 'DELETE',
    url: '/api/test/clean-vendors',
    failOnStatusCode: false
  });
});

// أمر مخصص لإنشاء بائع جديد
Cypress.Commands.add('createVendor', (vendorData) => {
  return cy.request({
    method: 'POST',
    url: '/api/vendors',
    body: vendorData,
    failOnStatusCode: false
  });
});

// أمر مخصص للحصول على بائع بواسطة المعرف
Cypress.Commands.add('getVendorById', (vendorId) => {
  return cy.request({
    method: 'GET',
    url: `/api/vendors/${vendorId}`,
    failOnStatusCode: false
  });
});