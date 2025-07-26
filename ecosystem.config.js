/**
 * تكوين PM2 لإدارة عمليات الخدمات
 * يستخدم هذا الملف لتشغيل وإدارة جميع خدمات Super Mall Backend في بيئات مختلفة
 */
module.exports = {
  apps: [
    // بوابة API
    {
      name: 'api-gateway',
      script: './api-gateway/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    },
    
    // خدمة المصادقة
    {
      name: 'auth-service',
      script: './auth-service/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'development',
        PORT: 5000
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    },
    
    // خدمة المستخدمين
    {
      name: 'user-service',
      script: './user-service/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'development',
        PORT: 5002
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5002
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5002
      }
    },
    
    // خدمة المنتجات
    {
      name: 'product-service',
      script: './product-service/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'development',
        PORT: 5003
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5003
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5003
      }
    },
    
    // خدمة الطلبات
    {
      name: 'order-service',
      script: './order-service/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '250M',
      env: {
        NODE_ENV: 'development',
        PORT: 5004
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5004
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5004
      }
    },
    
    // خدمة البائعين
    {
      name: 'vendor-service',
      script: './vendor-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 5005
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5005
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5005
      }
    },
    
    // خدمة التحليلات
    {
      name: 'analytics-service',
      script: './analytics-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 5006
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5006
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5006
      }
    },
    
    // خدمة الإشعارات
    {
      name: 'notification-service',
      script: './notification-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 5007
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5007
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5007
      }
    },
    
    // خدمة الدعم
    {
      name: 'support-service',
      script: './support-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 5008
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5008
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5008
      }
    },
    
    // خدمة الدردشة
    {
      name: 'chat-service',
      script: './chat-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 5009
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5009
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5009
      }
    },
    
    // خدمة الرفع
    {
      name: 'upload-service',
      script: './upload-service/index.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '200M',
      env: {
        NODE_ENV: 'development',
        PORT: 5010
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5010
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5010
      }
    }
  ],

  // نشر التطبيق
  deploy: {
    // بيئة الإنتاج
    production: {
      user: 'deploy',
      host: ['production-server'],
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/supermall-backend.git',
      path: '/var/www/supermall-backend',
      'post-deploy': 'npm install --production && npm run install:all:prod && pm2 reload ecosystem.config.js --env production'
    },
    
    // بيئة الاختبار
    staging: {
      user: 'deploy',
      host: ['staging-server'],
      ref: 'origin/develop',
      repo: 'git@github.com:yourusername/supermall-backend.git',
      path: '/var/www/supermall-backend-staging',
      'post-deploy': 'npm install && npm run install:all && pm2 reload ecosystem.config.js --env staging'
    }
  }
};