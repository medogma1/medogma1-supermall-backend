/**
 * ملف إعداد Mocha
 * يتم تنفيذ هذا الملف قبل تشغيل اختبارات Mocha
 */

// تعيين متغيرات البيئة للاختبارات
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || '';
process.env.DB_NAME = process.env.DB_NAME || 'supermall_test';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.PORT = process.env.PORT || '3000';

// استيراد المكتبات المطلوبة
const chai = require('chai');
const chaiHttp = require('chai-http');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

// تكوين Chai
chai.use(chaiHttp);
chai.use(chaiAsPromised);
chai.use(sinonChai);

// إضافة توقعات مخصصة لـ Chai إذا لزم الأمر
chai.use(function(chai, utils) {
  // مثال على توقع مخصص
  chai.Assertion.addMethod('validVendor', function() {
    const obj = this._obj;
    
    new chai.Assertion(obj).to.be.an('object');
    new chai.Assertion(obj).to.have.property('id').that.is.a('number');
    new chai.Assertion(obj).to.have.property('name').that.is.a('string');
    new chai.Assertion(obj).to.have.property('email').that.is.a('string');
    new chai.Assertion(obj).to.have.property('phone').that.is.a('string');
    new chai.Assertion(obj).to.have.property('user_id').that.is.a('number');
    new chai.Assertion(obj).to.have.property('business_type').that.is.a('string');
  });
});

// تعطيل سجلات وحدة التحكم أثناء الاختبارات
// يمكن إزالة هذا التعليق إذا كنت تريد رؤية سجلات وحدة التحكم أثناء الاختبارات
/*
console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.error = () => {};
*/

// تصدير المتغيرات العامة
global.expect = chai.expect;
global.should = chai.should();
global.assert = chai.assert;