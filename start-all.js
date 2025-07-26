/**
 * سكريبت لتشغيل جميع خدمات Super Mall Backend
 * يمكن استخدامه كبديل لملف start-all.bat على أنظمة التشغيل المختلفة
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

// تكوين الخدمات مع منافذها
const services = [
  { name: 'api-gateway', port: 5001 },
  { name: 'auth-service', port: 5000 },
  { name: 'user-service', port: 5002 },
  { name: 'vendor-service', port: 5005 },
  { name: 'product-service', port: 5003 },
  { name: 'order-service', port: 5004 },
  { name: 'support-service', port: 5006 },
  { name: 'chat-service', port: 5007 },
  { name: 'notification-service', port: 5008 },
  { name: 'analytics-service', port: 5010 },
  { name: 'upload-service', port: 5009 }
];

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
    const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';
    
    // تشغيل الخدمة
    const child = spawn(nodeCmd, ['index.js'], {
      cwd: servicePath,
      env: { ...process.env, PORT: service.port },
      stdio: 'pipe',
      detached: false
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

// دالة رئيسية لتشغيل جميع الخدمات بالتتابع
async function startAllServices() {
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log('\x1b[35m=           بدء تشغيل جميع الخدمات              =\x1b[0m');
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log();
  
  // تشغيل الخدمات بالتتابع
  for (const service of services) {
    await startService(service);
  }
  
  console.log();
  console.log('\x1b[35m===================================================\x1b[0m');
  console.log('\x1b[35m=          تم بدء تشغيل جميع الخدمات            =\x1b[0m');
  console.log('\x1b[35m=   يمكنك الوصول إلى البوابة على المنفذ 5001    =\x1b[0m');
  console.log('\x1b[35m===================================================\x1b[0m');
}

// بدء تشغيل جميع الخدمات
startAllServices().catch(err => {
  console.error('\x1b[31mحدث خطأ أثناء بدء تشغيل الخدمات:\x1b[0m', err);
});