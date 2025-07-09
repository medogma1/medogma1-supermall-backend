/**
 * سكريبت لتشغيل جميع أنواع الاختبارات
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد التقارير إذا لم يكن موجودًا
const reportsDir = path.join(__dirname, 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const newmanReportsDir = path.join(reportsDir, 'newman');
if (!fs.existsSync(newmanReportsDir)) {
  fs.mkdirSync(newmanReportsDir, { recursive: true });
}

const mochaReportsDir = path.join(reportsDir, 'mocha');
if (!fs.existsSync(mochaReportsDir)) {
  fs.mkdirSync(mochaReportsDir, { recursive: true });
}

const jestReportsDir = path.join(reportsDir, 'jest');
if (!fs.existsSync(jestReportsDir)) {
  fs.mkdirSync(jestReportsDir, { recursive: true });
}

const cypressReportsDir = path.join(reportsDir, 'cypress');
if (!fs.existsSync(cypressReportsDir)) {
  fs.mkdirSync(cypressReportsDir, { recursive: true });
}

/**
 * تشغيل أمر في سطر الأوامر
 * @param {string} command - الأمر المراد تنفيذه
 * @param {string[]} args - وسائط الأمر
 * @param {Object} options - خيارات إضافية
 * @returns {Promise<number>} - رمز الخروج
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`تشغيل: ${command} ${args.join(' ')}`);
    console.log(`${'='.repeat(80)}\n`);

    const proc = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        console.error(`فشل الأمر بكود الخروج: ${code}`);
        resolve(code); // نستمر في تشغيل الاختبارات الأخرى حتى لو فشل أحدها
      }
    });

    proc.on('error', (err) => {
      console.error(`خطأ في تنفيذ الأمر: ${err.message}`);
      resolve(1); // نستمر في تشغيل الاختبارات الأخرى حتى لو فشل أحدها
    });
  });
}

/**
 * تشغيل اختبارات Mocha
 */
async function runMochaTests() {
  console.log('\n\nتشغيل اختبارات Mocha...');
  const mochaArgs = [
    './node_modules/.bin/mocha',
    'tests/controllers.test.js',
    'tests/models.test.js',
    '--reporter', 'spec',
    '--reporter-options', `output=${path.join(mochaReportsDir, 'mocha-report.txt')}`,
    '--timeout', '10000'
  ];
  return runCommand('node', mochaArgs);
}

/**
 * تشغيل اختبارات Jest
 */
async function runJestTests() {
  console.log('\n\nتشغيل اختبارات Jest...');
  const jestArgs = [
    './node_modules/.bin/jest',
    'tests/create-vendor.test.js',
    '--json', `--outputFile=${path.join(jestReportsDir, 'jest-report.json')}`,
    '--coverage'
  ];
  return runCommand('node', jestArgs);
}

/**
 * تشغيل اختبارات API باستخدام SuperTest
 */
async function runSupertestTests() {
  console.log('\n\nتشغيل اختبارات SuperTest...');
  const supertestArgs = [
    './node_modules/.bin/mocha',
    'tests/test-create-vendor-supertest.js',
    '--reporter', 'spec',
    '--timeout', '10000'
  ];
  return runCommand('node', supertestArgs);
}

/**
 * تشغيل اختبارات Cypress
 */
async function runCypressTests() {
  console.log('\n\nتشغيل اختبارات Cypress...');
  const cypressArgs = [
    './node_modules/.bin/cypress',
    'run',
    '--spec', 'tests/cypress/integration/create-vendor.spec.js',
    '--reporter', 'mochawesome',
    '--reporter-options', `reportDir=${cypressReportsDir},reportFilename=cypress-report`
  ];
  return runCommand('node', cypressArgs);
}

/**
 * تشغيل اختبارات Postman باستخدام Newman
 */
async function runNewmanTests() {
  console.log('\n\nتشغيل اختبارات Postman باستخدام Newman...');
  const newmanArgs = [
    'run',
    path.join(__dirname, 'postman/vendor-api.postman_collection.json'),
    '-e', path.join(__dirname, 'postman/vendor-api.postman_environment.json'),
    '-r', 'cli,htmlextra',
    '--reporter-htmlextra-export', path.join(newmanReportsDir, 'vendor-api-report.html')
  ];
  return runCommand('newman', newmanArgs);
}

/**
 * الدالة الرئيسية لتشغيل جميع الاختبارات
 */
async function runAllTests() {
  try {
    console.log('\n\nبدء تشغيل جميع الاختبارات...');
    console.log(`${'*'.repeat(80)}\n`);

    // تشغيل اختبارات الوحدة
    const mochaResult = await runMochaTests();
    console.log(`نتيجة اختبارات Mocha: ${mochaResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);

    // تشغيل اختبارات Jest
    const jestResult = await runJestTests();
    console.log(`نتيجة اختبارات Jest: ${jestResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);

    // تشغيل اختبارات SuperTest
    const supertestResult = await runSupertestTests();
    console.log(`نتيجة اختبارات SuperTest: ${supertestResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);

    // تشغيل اختبارات Cypress
    const cypressResult = await runCypressTests();
    console.log(`نتيجة اختبارات Cypress: ${cypressResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);

    // تشغيل اختبارات Newman
    const newmanResult = await runNewmanTests();
    console.log(`نتيجة اختبارات Newman: ${newmanResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);

    console.log(`\n${'-'.repeat(80)}`);
    console.log('ملخص نتائج الاختبارات:');
    console.log(`- اختبارات Mocha: ${mochaResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);
    console.log(`- اختبارات Jest: ${jestResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);
    console.log(`- اختبارات SuperTest: ${supertestResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);
    console.log(`- اختبارات Cypress: ${cypressResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);
    console.log(`- اختبارات Newman: ${newmanResult === 0 ? 'نجاح ✅' : 'فشل ❌'}`);

    const allPassed = (
      mochaResult === 0 &&
      jestResult === 0 &&
      supertestResult === 0 &&
      cypressResult === 0 &&
      newmanResult === 0
    );

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`النتيجة النهائية: ${allPassed ? 'جميع الاختبارات نجحت ✅' : 'بعض الاختبارات فشلت ❌'}`);
    console.log(`${'*'.repeat(80)}\n`);

    // إرجاع رمز الخروج المناسب
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('حدث خطأ أثناء تشغيل الاختبارات:', error);
    process.exit(1);
  }
}

// تشغيل جميع الاختبارات
runAllTests();