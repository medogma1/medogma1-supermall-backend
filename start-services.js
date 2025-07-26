/**
 * سكريبت لتشغيل مجموعة محددة من خدمات Super Mall Backend
 * يمكن استخدامه عندما لا تحتاج إلى تشغيل جميع الخدمات
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// تعيين متغير بيئي JWT_SECRET إذا لم يكن موجودًا
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'supermall_secret_key_2024';
  console.log('تم تعيين JWT_SECRET للجلسة الحالية');
}

// الحصول على أسماء الخدمات من سطر الأوامر
const requestedServices = process.argv.slice(2);

// تكوين جميع الخدمات المتاحة مع منافذها
const allServices = {
  'api-gateway': 5001,
  'auth-service': 5000,
  'user-service': 5002,
  'vendor-service': 5005,
  'product-service': 5003,
  'order-service': 5004,
  'support-service': 5006,
  'chat-service': 5007,
  'notification-service': 5008,
  'analytics-service': 5010,
  'upload-service': 5009
};

// تحديد الخدمات التي سيتم تشغيلها
let servicesToStart = [];

// إذا لم يتم تحديد أي خدمات، قم بتشغيل الخدمات الأساسية فقط
if (requestedServices.length === 0) {
  console.log('\x1b[33mلم يتم تحديد أي خدمات. سيتم تشغيل الخدمات الأساسية فقط.\x1b[0m');
  servicesToStart = [
    { name: 'api-gateway', port: allServices['api-gateway'] },
    { name: 'auth-service', port: allServices['auth-service'] },
    { name: 'user-service', port: allServices['user-service'] },
    { name: 'product-service', port: allServices['product-service'] }
  ];
} else {
  // تحقق من الخدمات المطلوبة وأضفها إلى قائمة التشغيل
  for (const serviceName of requestedServices) {
    if (allServices[serviceName]) {
      servicesToStart.push({ name: serviceName, port: allServices[serviceName] });
    } else {
      console.log(`\x1b[31mتحذير: الخدمة ${serviceName} غير معروفة وسيتم تجاهلها.\x1b[0m`);
    }
  }
}

// إضافة خدمة api-gateway و auth-service إذا لم تكن موجودة بالفعل
const essentialServices = ['api-gateway', 'auth-service'];
for (const essentialService of essentialServices) {
  if (!servicesToStart.some(service => service.name === essentialService)) {
    console.log(`\x1b[33mإضافة الخدمة الأساسية ${essentialService} تلقائيًا.\x1b[0m`);
    servicesToStart.push({ name: essentialService, port: allServices[essentialService] });
  }
}

// دالة لتشغيل خدمة
function startService(service) {
  return new Promise((resolve) => {
    const servicePath = path.join(__dirname, service.name);
    
    // التحقق من وجود الخدمة
    if (!fs.existsSync(servicePath)) {
      console.log(`\x1b[31mخطأ: الخدمة ${service.name} غير موجودة في المسار ${servicePath}\x1b[0m`);
      resolve();
      return;
    }
    
    console.log(`\x1b[33mبدء تشغيل ${service.name} (المنفذ ${service.port})...\x1b[0m`);
    
    // تحديد الأمر المناسب حسب نظام التشغيل
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    
    // تشغيل الخدمة
    const child = spawn(npmCmd, ['start'], {
      cwd: servicePath,
      env: { ...process.env },
      stdio: 'pipe',
      detached: true
    });
    
    // معالجة مخرجات الخدمة
    child.stdout.on('data', (data) => {
      console.log(`\x1b[36m[${service.name}]\x1b[0m ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`\x1b[31m[${service.name} ERROR]\x1b[0m ${data.toString().trim()}`);
    });
    
    child.on('error', (error) => {
      console.error(`\x1b[31mفشل في بدء ${service.name}: ${error.message}\x1b[0m`);
      resolve();
    });
    
    // الانتظار قبل بدء الخدمة التالية
    setTimeout(() => {
      console.log(`\x1b[32mتم بدء تشغيل ${service.name} بنجاح!\x1b[0m`);
      resolve();
    }, 3000);
  });
}

// دالة رئيسية لتشغيل الخدمات المحددة بالتتابع
async function startSelectedServices() {
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log('\x1b[35m=           بدء تشغيل الخدمات المحددة           =\x1b[0m');
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log();
  
  // عرض الخدمات التي سيتم تشغيلها
  console.log('\x1b[33mالخدمات التي سيتم تشغيلها:\x1b[0m');
  servicesToStart.forEach(service => {
    console.log(`- ${service.name} (المنفذ ${service.port})`);
  });
  console.log();
  
  // تشغيل الخدمات بالتتابع
  for (const service of servicesToStart) {
    await startService(service);
  }
  
  console.log();
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log('\x1b[35m=          تم بدء تشغيل الخدمات المحددة         =\x1b[0m');
  console.log(`\x1b[35m=   يمكنك الوصول إلى البوابة على المنفذ ${allServices['api-gateway']}    =\x1b[0m`);
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log();
  console.log('\x1b[33mطريقة الاستخدام:\x1b[0m');
  console.log('- لتشغيل خدمات محددة: node start-services.js service1 service2 ...');
  console.log('- لتشغيل الخدمات الأساسية فقط: node start-services.js');
  console.log('- لتشغيل جميع الخدمات: node start-all.js');
}

// بدء تشغيل الخدمات المحددة
startSelectedServices().catch(err => {
  console.error('\x1b[31mحدث خطأ أثناء بدء تشغيل الخدمات:\x1b[0m', err);
});