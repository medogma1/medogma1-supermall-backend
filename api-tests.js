const axios = require('axios');
const fs = require('fs');
const path = require('path');

// متغيرات عامة
let authToken = '';
let vendorAuthToken = '';
let testUserId = null;
let testVendorUserId = null;
let testProductId = null;
let testOrderId = null;
let testTicketId = null;
let testNotificationId = null;
let testChatId = null;
let testVendorId = null;
let testServiceId = null;

const config = {
  baseURLs: {
    product: 'http://localhost:5003/products',
    user: 'http://localhost:5003/users',
    auth: 'http://localhost:5003/auth',
    order: 'http://localhost:5003/orders',
    support: 'http://localhost:5003/support',
    notification: 'http://localhost:5003/notification',
    chat: 'http://localhost:5003/chat',
    analytics: 'http://localhost:5003/analytics',
    upload: 'http://localhost:5003/upload',
    vendor: 'http://localhost:5003/vendors',
    service: 'http://localhost:5003/services',
    payment: 'http://localhost:5003/payment'
  },
  testUser: {
    email: 'admin@supermall.com',
    password: 'xx100100',
    name: 'مدير النظام'
  },
  testVendorUser: {
    email: 'vendor@example.com',
    password: 'Vendor@123',
    name: 'تاجر اختبار',
    role: 'vendor'
  },
  testProduct: {
    name: 'منتج اختبار',
    description: 'وصف منتج اختبار',
    price: 99.99,
    stock: 100,
    category_id: 1
  },
  testOrder: {
    items: [
      { product_id: 1, quantity: 2, price: 99.99 }
    ],
    shipping_address: {
      address: 'عنوان اختبار',
      city: 'مدينة اختبار',
      postal_code: '12345'
    },
    payment_method: 'cash_on_delivery'
  },
  testTicket: {
    subject: 'موضوع تذكرة اختبار',
    message: 'محتوى تذكرة اختبار',
    priority: 'medium'
  },
  testNotification: {
    user_id: 1,
    title: 'عنوان إشعار اختبار',
    message: 'محتوى إشعار اختبار',
    type: 'info'
  },
  testChat: {
    title: 'محادثة اختبار',
    participants: [1, 2]
  },
  testVendor: {
    name: 'متجر اختبار',
    email: 'vendor@example.com',
    phone: '01012345678',
    user_id: 1,
    storeName: 'متجر اختبار',
    storeDescription: 'وصف متجر اختبار',
    storeLogoUrl: 'logo.jpg',
    contactEmail: 'store@example.com',
    contactPhone: '01012345678',
    storeAddress: 'عنوان متجر اختبار',
    business_type: 'individual'
  },
  testService: {
    name: 'خدمة اختبار',
    description: 'وصف خدمة اختبار',
    price: 199.99,
    vendor_id: 1
  }
};

// دالة مساعدة لتسجيل نتائج الاختبار
function logResult(service, endpoint, method, status, message) {
  const result = {
    service,
    endpoint,
    method,
    status,
    message,
    timestamp: new Date().toISOString()
  };
  console.log(`${result.status === 'SUCCESS' ? '✅' : '❌'} [${result.service}] ${result.method} ${result.endpoint}: ${result.message}`);
  const logDir = path.join(__dirname, 'test-logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `api-test-results-${new Date().toISOString().split('T')[0]}.json`);
  let logs = [];
  if (fs.existsSync(logFile)) logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
  logs.push(result);
  fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
  return result;
}

// دالة مساعدة لإجراء طلب HTTP مع معالجة الأخطاء
async function makeRequest(service, endpoint, method, data = null, headers = {}) {
  try {
    const url = `${config.baseURLs[service]}${endpoint}`;
    console.log(`🔄 إرسال طلب ${method} إلى ${url}`);
    const options = {
      method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) options.data = data;
    const response = await axios(options);
    console.log(`✅ استجابة ناجحة من ${url}:`, response.status);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    console.log(`❌ خطأ في الطلب إلى ${config.baseURLs[service]}${endpoint}:`, error.message);
    if (error.response) {
      console.log('حالة الاستجابة:', error.response.status);
      console.log('بيانات الاستجابة:', JSON.stringify(error.response.data));
    }
    return { success: false, error: error.response ? error.response.data : error.message, status: error.response ? error.response.status : null };
  }
}

// اختبارات الخدمات
async function testServiceService() {
  console.log('\n🔍 اختبار خدمة الخدمات...');
  
  // اختبار الحصول على قائمة الخدمات
  const getServicesResult = await makeRequest('service', '/', 'GET');
  
  if (getServicesResult.success) {
    logResult('service', '/', 'GET', 'SUCCESS', 'تم الحصول على قائمة الخدمات بنجاح');
  } else {
    logResult('service', '/', 'GET', 'FAIL', `فشل الحصول على قائمة الخدمات: "${getServicesResult.error}"`);
  }
  
  // اختبار إنشاء خدمة جديدة (يتطلب توكن مصادقة)
  if (vendorAuthToken || authToken) {
    const createServiceResult = await makeRequest('service', '/', 'POST', config.testService, {
      Authorization: `Bearer ${vendorAuthToken || authToken}`
    });
    
    if (createServiceResult.success) {
      testServiceId = createServiceResult.data.id;
      logResult('service', '/', 'POST', 'SUCCESS', 'تم إنشاء خدمة جديدة بنجاح');
    } else {
      logResult('service', '/', 'POST', 'FAIL', `فشل إنشاء خدمة جديدة: "${createServiceResult.error}"`);
    }
  } else {
    logResult('service', '/', 'POST', 'WARNING', 'لا يوجد توكن مصادقة، تم تخطي اختبار إنشاء خدمة');
  }
}
async function testPaymentService() {
  console.log('\n🔍 اختبار خدمة الدفع...');
  
  if (!authToken) {
    logResult('payment', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات الدفع');
    return;
  }
  
  // اختبار إنشاء معاملة دفع جديدة
  const createPaymentResult = await makeRequest('payment', '/transaction', 'POST', {
    order_id: testOrderId || 1,
    amount: 99.99,
    payment_method: 'credit_card'
  }, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (createPaymentResult.success) {
    logResult('payment', '/transaction', 'POST', 'SUCCESS', 'تم إنشاء معاملة دفع جديدة بنجاح');
  } else {
    logResult('payment', '/transaction', 'POST', 'FAIL', `فشل إنشاء معاملة دفع جديدة: "${createPaymentResult.error}"`);
  }
  
  // اختبار الحصول على قائمة معاملات الدفع
  const getPaymentsResult = await makeRequest('payment', '/transactions', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getPaymentsResult.success) {
    logResult('payment', '/transactions', 'GET', 'SUCCESS', 'تم الحصول على قائمة معاملات الدفع بنجاح');
  } else {
    logResult('payment', '/transactions', 'GET', 'FAIL', `فشل الحصول على قائمة معاملات الدفع: "${getPaymentsResult.error}"`);
  }
}
async function testAuthService() {
  console.log('\n🔍 اختبار خدمة المصادقة...');
  
  // اختبار تسجيل الدخول للمستخدم العادي
  console.log('🔄 محاولة تسجيل دخول المستخدم العادي باستخدام:', config.testUser.email);
  console.log('🔍 عنوان خدمة المصادقة:', config.baseURLs.auth);
  console.log('🔑 كلمة المرور المستخدمة:', config.testUser.password);
  
  try {
    console.log('🔄 محاولة الاتصال المباشر بخدمة المصادقة...');
    const axios = require('axios');
    const directResponse = await axios.post(`${config.baseURLs.auth}/login`, {
      email: config.testUser.email,
      password: config.testUser.password
    });
    console.log('✅ استجابة مباشرة من خدمة المصادقة:', directResponse.status);
    console.log('📄 بيانات الاستجابة:', JSON.stringify(directResponse.data));
  } catch (error) {
    console.log('❌ خطأ في الاتصال المباشر بخدمة المصادقة:', error.message);
    if (error.response) {
      console.log('📄 حالة الاستجابة:', error.response.status);
      console.log('📄 بيانات الاستجابة:', JSON.stringify(error.response.data));
    }
  }
  
  const loginResult = await makeRequest('auth', '/login', 'POST', {
    email: config.testUser.email,
    password: config.testUser.password
  });
  
  if (loginResult.success && loginResult.data && loginResult.data.token) {
    authToken = loginResult.data.token;
    testUserId = loginResult.data.user ? loginResult.data.user.id : null;
    logResult('auth', '/login', 'POST', 'SUCCESS', 'تم تسجيل دخول المستخدم العادي بنجاح');
    console.log('✅ تم تسجيل دخول المستخدم العادي بنجاح');
  } else {
    console.log('❌ فشل تسجيل دخول المستخدم العادي:', JSON.stringify(loginResult));
    logResult('auth', '/login', 'POST', 'FAIL', `فشل تسجيل دخول المستخدم العادي: "${loginResult.error || 'خطأ غير معروف'}"`);
    
    // محاولة تسجيل الدخول مرة أخرى بكلمة مرور بديلة
    console.log('🔄 محاولة تسجيل دخول المستخدم العادي باستخدام كلمة مرور بديلة');
    const alternativeLoginResult = await makeRequest('auth', '/login', 'POST', {
      email: config.testUser.email,
      password: 'admin123'
    });
    
    if (alternativeLoginResult.success && alternativeLoginResult.data && alternativeLoginResult.data.token) {
      authToken = alternativeLoginResult.data.token;
      testUserId = alternativeLoginResult.data.user ? alternativeLoginResult.data.user.id : null;
      logResult('auth', '/login', 'POST', 'SUCCESS', 'تم تسجيل دخول المستخدم العادي بنجاح (كلمة مرور بديلة)');
      console.log('✅ تم تسجيل دخول المستخدم العادي بنجاح (كلمة مرور بديلة)');
    }
  }
  
  // اختبار تسجيل الدخول للتاجر
  console.log('🔄 محاولة تسجيل دخول التاجر باستخدام:', config.testVendorUser.email);
  const vendorLoginResult = await makeRequest('auth', '/login', 'POST', {
    email: config.testVendorUser.email,
    password: config.testVendorUser.password
  });
  
  if (vendorLoginResult.success && vendorLoginResult.data && vendorLoginResult.data.token) {
    vendorAuthToken = vendorLoginResult.data.token;
    testVendorUserId = vendorLoginResult.data.user ? vendorLoginResult.data.user.id : null;
    logResult('auth', '/login/vendor', 'POST', 'SUCCESS', 'تم تسجيل دخول التاجر بنجاح');
    console.log('✅ تم تسجيل دخول التاجر بنجاح');
  } else {
    console.log('❌ فشل تسجيل دخول التاجر:', JSON.stringify(vendorLoginResult));
    logResult('auth', '/login/vendor', 'POST', 'FAIL', `فشل تسجيل دخول التاجر: "${vendorLoginResult.error || 'خطأ غير معروف'}"`);
    
    // محاولة تسجيل الدخول مرة أخرى بكلمة مرور بديلة
    console.log('🔄 محاولة تسجيل دخول التاجر باستخدام كلمة مرور بديلة');
    const alternativeVendorLoginResult = await makeRequest('auth', '/login', 'POST', {
      email: config.testVendorUser.email,
      password: 'Vendor123'
    });
    console.log('نتيجة محاولة تسجيل دخول التاجر البديلة:', JSON.stringify(alternativeVendorLoginResult));
    
    if (alternativeVendorLoginResult.success && alternativeVendorLoginResult.data && alternativeVendorLoginResult.data.token) {
      vendorAuthToken = alternativeVendorLoginResult.data.token;
      testVendorUserId = alternativeVendorLoginResult.data.user ? alternativeVendorLoginResult.data.user.id : null;
      logResult('auth', '/login/vendor', 'POST', 'SUCCESS', 'تم تسجيل دخول التاجر بنجاح (كلمة مرور بديلة)');
      console.log('✅ تم تسجيل دخول التاجر بنجاح (كلمة مرور بديلة)');
    }
  }
  
  // اختبار تسجيل مستخدم جديد
  const randomEmail = `user${Math.floor(Math.random() * 10000)}@example.com`;
  const registerResult = await makeRequest('auth', '/register', 'POST', {
    name: 'مستخدم اختبار',
    email: randomEmail,
    password: 'Test@123',
    confirmPassword: 'Test@123',
    role: 'user',
    phone: '01012345678'
  });
  
  if (registerResult.success) {
    logResult('auth', '/register', 'POST', 'SUCCESS', 'تم تسجيل مستخدم جديد بنجاح');
    console.log('✅ تم تسجيل مستخدم جديد بنجاح');
  } else {
    console.log('❌ فشل تسجيل مستخدم جديد:', registerResult);
    logResult('auth', '/register', 'POST', 'WARNING', `لم يتم تسجيل مستخدم جديد: "${registerResult.error}"`);
    
    // محاولة تسجيل مستخدم جديد مرة أخرى بمعلومات مختلفة
    const alternativeRegisterResult = await makeRequest('auth', '/register', 'POST', {
      name: 'مستخدم اختبار جديد',
      email: `user${Math.floor(Math.random() * 10000)}@supermall.com`,
      password: 'Test@123456',
      confirmPassword: 'Test@123456',
      role: 'user',
      phone: '01023456789'
    });
    
    if (alternativeRegisterResult.success) {
      logResult('auth', '/register', 'POST', 'SUCCESS', 'تم تسجيل مستخدم جديد بنجاح (محاولة بديلة)');
      console.log('✅ تم تسجيل مستخدم جديد بنجاح (محاولة بديلة)');
    }
  }
}
async function testUserService() {
  console.log('\n🔍 اختبار خدمة المستخدمين...');
  
  if (!authToken) {
    logResult('user', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات المستخدمين');
    return;
  }
  
  // اختبار الحصول على معلومات المستخدم الحالي
  const profileResult = await makeRequest('user', '/profile', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (profileResult.success) {
    logResult('user', '/profile', 'GET', 'SUCCESS', 'تم الحصول على معلومات المستخدم بنجاح');
  } else {
    logResult('user', '/profile', 'GET', 'FAIL', `فشل الحصول على معلومات المستخدم: "${profileResult.error}"`);
  }
  
  // اختبار تحديث معلومات المستخدم
  const updateResult = await makeRequest('user', '/profile', 'PUT', {
    name: 'مستخدم محدث',
    phone: '01012345678'
  }, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (updateResult.success) {
    logResult('user', '/profile', 'PUT', 'SUCCESS', 'تم تحديث معلومات المستخدم بنجاح');
  } else {
    logResult('user', '/profile', 'PUT', 'FAIL', `فشل تحديث معلومات المستخدم: "${updateResult.error}"`);
  }
}
async function testProductService() {
  console.log('\n🔍 اختبار خدمة المنتجات...');
  
  // اختبار الحصول على قائمة المنتجات
  const getProductsResult = await makeRequest('product', '/', 'GET');
  
  if (getProductsResult.success) {
    logResult('product', '/', 'GET', 'SUCCESS', 'تم الحصول على قائمة المنتجات بنجاح');
  } else {
    logResult('product', '/', 'GET', 'FAIL', `فشل الحصول على قائمة المنتجات: "${getProductsResult.error}"`);
  }
  
  // اختبار إنشاء منتج جديد (يتطلب توكن مصادقة)
  if (authToken) {
    const createProductResult = await makeRequest('product', '/', 'POST', config.testProduct, {
      Authorization: `Bearer ${authToken}`
    });
    
    if (createProductResult.success) {
      testProductId = createProductResult.data.id;
      logResult('product', '/', 'POST', 'SUCCESS', 'تم إنشاء منتج جديد بنجاح');
    } else {
      logResult('product', '/', 'POST', 'FAIL', `فشل إنشاء منتج جديد: "${createProductResult.error}"`);
    }
  } else {
    logResult('product', '/', 'POST', 'WARNING', 'لا يوجد توكن مصادقة، تم تخطي اختبار إنشاء منتج');
  }
}
async function testOrderService() {
  console.log('\n🔍 اختبار خدمة الطلبات...');
  
  if (!authToken) {
    logResult('order', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات الطلبات');
    return;
  }
  
  // اختبار إنشاء طلب جديد
  const createOrderResult = await makeRequest('order', '/', 'POST', config.testOrder, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (createOrderResult.success) {
    testOrderId = createOrderResult.data.id;
    logResult('order', '/', 'POST', 'SUCCESS', 'تم إنشاء طلب جديد بنجاح');
  } else {
    logResult('order', '/', 'POST', 'FAIL', `فشل إنشاء طلب جديد: "${createOrderResult.error}"`);
  }
  
  // اختبار الحصول على قائمة الطلبات
  const getOrdersResult = await makeRequest('order', '/', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getOrdersResult.success) {
    logResult('order', '/', 'GET', 'SUCCESS', 'تم الحصول على قائمة الطلبات بنجاح');
  } else {
    logResult('order', '/', 'GET', 'FAIL', `فشل الحصول على قائمة الطلبات: "${getOrdersResult.error}"`);
  }
}
async function testCartService() {
  console.log('\n🔍 اختبار خدمة سلة التسوق...');
  
  if (!authToken) {
    logResult('cart', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات سلة التسوق');
    return;
  }
  
  // اختبار إضافة منتج إلى سلة التسوق
  const addToCartResult = await makeRequest('order', '/cart', 'POST', {
    product_id: 1,
    quantity: 2
  }, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (addToCartResult.success) {
    logResult('cart', '/cart', 'POST', 'SUCCESS', 'تم إضافة منتج إلى سلة التسوق بنجاح');
  } else {
    logResult('cart', '/cart', 'POST', 'FAIL', `فشل إضافة منتج إلى سلة التسوق: "${addToCartResult.error}"`);
  }
  
  // اختبار الحصول على محتويات سلة التسوق
  const getCartResult = await makeRequest('order', '/cart', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getCartResult.success) {
    logResult('cart', '/cart', 'GET', 'SUCCESS', 'تم الحصول على محتويات سلة التسوق بنجاح');
  } else {
    logResult('cart', '/cart', 'GET', 'FAIL', `فشل الحصول على محتويات سلة التسوق: "${getCartResult.error}"`);
  }
}
async function testSupportService() {
  console.log('\n🔍 اختبار خدمة الدعم...');
  
  if (!authToken) {
    logResult('support', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات الدعم');
    return;
  }
  
  // اختبار إنشاء تذكرة دعم جديدة
  const createTicketResult = await makeRequest('support', '/tickets', 'POST', config.testTicket, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (createTicketResult.success) {
    testTicketId = createTicketResult.data.id;
    logResult('support', '/tickets', 'POST', 'SUCCESS', 'تم إنشاء تذكرة دعم جديدة بنجاح');
  } else {
    logResult('support', '/tickets', 'POST', 'FAIL', `فشل إنشاء تذكرة دعم جديدة: "${createTicketResult.error}"`);
  }
  
  // اختبار الحصول على قائمة تذاكر الدعم
  const getTicketsResult = await makeRequest('support', '/tickets', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getTicketsResult.success) {
    logResult('support', '/tickets', 'GET', 'SUCCESS', 'تم الحصول على قائمة تذاكر الدعم بنجاح');
  } else {
    logResult('support', '/tickets', 'GET', 'FAIL', `فشل الحصول على قائمة تذاكر الدعم: "${getTicketsResult.error}"`);
  }
}
async function testNotificationService() {
  console.log('\n🔍 اختبار خدمة الإشعارات...');
  
  if (!authToken) {
    logResult('notification', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات الإشعارات');
    return;
  }
  
  // اختبار إنشاء إشعار جديد
  const createNotificationResult = await makeRequest('notification', '/', 'POST', config.testNotification, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (createNotificationResult.success) {
    testNotificationId = createNotificationResult.data.id;
    logResult('notification', '/', 'POST', 'SUCCESS', 'تم إنشاء إشعار جديد بنجاح');
  } else {
    logResult('notification', '/', 'POST', 'FAIL', `فشل إنشاء إشعار جديد: "${createNotificationResult.error}"`);
  }
  
  // اختبار الحصول على قائمة الإشعارات
  const getNotificationsResult = await makeRequest('notification', '/', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getNotificationsResult.success) {
    logResult('notification', '/', 'GET', 'SUCCESS', 'تم الحصول على قائمة الإشعارات بنجاح');
  } else {
    logResult('notification', '/', 'GET', 'FAIL', `فشل الحصول على قائمة الإشعارات: "${getNotificationsResult.error}"`);
  }
}
async function testChatService() {
  console.log('\n🔍 اختبار خدمة المحادثات...');
  
  if (!authToken) {
    logResult('chat', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات المحادثات');
    return;
  }
  
  // اختبار إنشاء محادثة جديدة
  const createChatResult = await makeRequest('chat', '/conversations', 'POST', config.testChat, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (createChatResult.success) {
    testChatId = createChatResult.data.id;
    logResult('chat', '/conversations', 'POST', 'SUCCESS', 'تم إنشاء محادثة جديدة بنجاح');
  } else {
    logResult('chat', '/conversations', 'POST', 'FAIL', `فشل إنشاء محادثة جديدة: "${createChatResult.error}"`);
  }
  
  // اختبار الحصول على قائمة المحادثات
  const getChatsResult = await makeRequest('chat', '/conversations', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getChatsResult.success) {
    logResult('chat', '/conversations', 'GET', 'SUCCESS', 'تم الحصول على قائمة المحادثات بنجاح');
  } else {
    logResult('chat', '/conversations', 'GET', 'FAIL', `فشل الحصول على قائمة المحادثات: "${getChatsResult.error}"`);
  }
}
async function testAnalyticsService() {
  console.log('\n🔍 اختبار خدمة التحليلات...');
  
  if (!authToken) {
    logResult('analytics', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات التحليلات');
    return;
  }
  
  // اختبار الحصول على إحصائيات المبيعات
  const getSalesStatsResult = await makeRequest('analytics', '/sales', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getSalesStatsResult.success) {
    logResult('analytics', '/sales', 'GET', 'SUCCESS', 'تم الحصول على إحصائيات المبيعات بنجاح');
  } else {
    logResult('analytics', '/sales', 'GET', 'FAIL', `فشل الحصول على إحصائيات المبيعات: "${getSalesStatsResult.error}"`);
  }
  
  // اختبار الحصول على إحصائيات المستخدمين
  const getUserStatsResult = await makeRequest('analytics', '/users', 'GET', null, {
    Authorization: `Bearer ${authToken}`
  });
  
  if (getUserStatsResult.success) {
    logResult('analytics', '/users', 'GET', 'SUCCESS', 'تم الحصول على إحصائيات المستخدمين بنجاح');
  } else {
    logResult('analytics', '/users', 'GET', 'FAIL', `فشل الحصول على إحصائيات المستخدمين: "${getUserStatsResult.error}"`);
  }
}
async function testUploadService() {
  console.log('\n🔍 اختبار خدمة رفع الملفات...');
  
  if (!authToken) {
    logResult('upload', '', '', 'WARNING', 'لا يوجد توكن مصادقة، سيتم تخطي اختبارات رفع الملفات');
    return;
  }
  
  // اختبار الحصول على معلومات حول الملفات المدعومة
  const getSupportedFilesResult = await makeRequest('upload', '/supported-types', 'GET');
  
  if (getSupportedFilesResult.success) {
    logResult('upload', '/supported-types', 'GET', 'SUCCESS', 'تم الحصول على معلومات حول الملفات المدعومة بنجاح');
  } else {
    logResult('upload', '/supported-types', 'GET', 'FAIL', `فشل الحصول على معلومات حول الملفات المدعومة: "${getSupportedFilesResult.error}"`);
  }
}
async function testVendorService() {
  console.log('\n🔍 اختبار خدمة البائعين...');
  
  if (!authToken) {
    logResult('vendor', '', '', 'WARNING', 'لا يوجد توكن مصادقة للمستخدم العادي، سيتم استخدام توكن المستخدم العادي');
  }
  
  if (!vendorAuthToken) {
    logResult('vendor', '', '', 'WARNING', 'لا يوجد توكن مصادقة للتاجر، سيتم استخدام توكن المستخدم العادي');
  }
  
  // اختبار إنشاء بائع جديد
  const createVendorResult = await makeRequest('vendor', '/', 'POST', config.testVendor, {
    Authorization: `Bearer ${authToken || vendorAuthToken}`
  });
  
  if (createVendorResult.success) {
    testVendorId = createVendorResult.data.id;
    logResult('vendor', '/', 'POST', 'SUCCESS', 'تم إنشاء بائع جديد بنجاح');
  } else {
    logResult('vendor', '/', 'POST', 'FAIL', `فشل إنشاء بائع جديد: "${createVendorResult.error}"`);
  }
  
  // اختبار الحصول على قائمة البائعين
  const getVendorsResult = await makeRequest('vendor', '/', 'GET');
  
  if (getVendorsResult.success) {
    logResult('vendor', '/', 'GET', 'SUCCESS', 'تم الحصول على قائمة البائعين بنجاح');
  } else {
    logResult('vendor', '/', 'GET', 'FAIL', `فشل الحصول على قائمة البائعين: "${getVendorsResult.error}"`);
  }
}

// دالة لتشغيل جميع الاختبارات بالتسلسل
async function runAllTests() {
  await testAuthService();
  await testUserService();
  await testVendorService();
  await testProductService();
  await testOrderService();
  await testCartService();
  await testServiceService();
  await testPaymentService();
  await testSupportService();
  await testNotificationService();
  await testChatService();
  await testAnalyticsService();
  await testUploadService();
}

runAllTests().catch(error => {
  console.error('حدث خطأ أثناء تنفيذ الاختبارات:', error);
});
