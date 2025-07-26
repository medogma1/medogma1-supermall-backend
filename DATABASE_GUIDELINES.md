# إرشادات وأفضل ممارسات قاعدة البيانات لمشروع Super Mall Backend

يوفر هذا المستند إرشادات وأفضل الممارسات المتعلقة بتصميم وإدارة واستخدام قاعدة البيانات في مشروع Super Mall Backend. الهدف هو ضمان اتساق وكفاءة وأمان عمليات قاعدة البيانات عبر جميع الخدمات المصغرة.

## جدول المحتويات

- [نظرة عامة على قاعدة البيانات](#نظرة-عامة-على-قاعدة-البيانات)
- [تصميم قاعدة البيانات](#تصميم-قاعدة-البيانات)
- [نمذجة البيانات](#نمذجة-البيانات)
- [استعلامات قاعدة البيانات](#استعلامات-قاعدة-البيانات)
- [الفهارس](#الفهارس)
- [العلاقات](#العلاقات)
- [الترحيلات](#الترحيلات)
- [البذور](#البذور)
- [التعامل مع الأخطاء](#التعامل-مع-الأخطاء)
- [الأمان](#الأمان)
- [الأداء](#الأداء)
- [النسخ الاحتياطي واستعادة البيانات](#النسخ-الاحتياطي-واستعادة-البيانات)
- [بيئات قاعدة البيانات](#بيئات-قاعدة-البيانات)
- [أفضل الممارسات](#أفضل-الممارسات)
- [موارد إضافية](#موارد-إضافية)

## نظرة عامة على قاعدة البيانات

### التقنيات المستخدمة

- **نظام إدارة قاعدة البيانات**: MySQL
- **ORM**: Sequelize
- **التخزين المؤقت**: Redis

### هيكل قاعدة البيانات

يستخدم المشروع نموذج قاعدة بيانات مقسمة حسب الخدمة (Database per Service)، حيث تمتلك كل خدمة مصغرة قاعدة بيانات منطقية خاصة بها. هذا يعزز الاستقلالية ويقلل من الاعتماديات بين الخدمات.

## تصميم قاعدة البيانات

### مبادئ التصميم

1. **التطبيع المناسب**: استخدم القواعد القياسية للتطبيع (عادة 3NF) مع مراعاة متطلبات الأداء.
2. **تصميم موجه بالاستخدام**: صمم الجداول والعلاقات بناءً على أنماط الاستخدام الفعلية.
3. **الاتساق**: استخدم اتفاقيات تسمية متسقة عبر جميع الجداول والأعمدة.
4. **المرونة**: صمم لاستيعاب التغييرات المستقبلية.

### اتفاقيات التسمية

- **الجداول**: استخدم صيغة الجمع، حروف صغيرة، مع فصل الكلمات بشرطات سفلية (snake_case).
  - مثال: `users`, `product_categories`, `order_items`

- **الأعمدة**: استخدم حروف صغيرة، مع فصل الكلمات بشرطات سفلية (snake_case).
  - مثال: `first_name`, `created_at`, `product_id`

- **المفاتيح الأساسية**: استخدم `id` كمفتاح أساسي قياسي.

- **المفاتيح الأجنبية**: استخدم اسم الجدول المرتبط بصيغة المفرد متبوعًا بـ `_id`.
  - مثال: `user_id`, `product_id`, `category_id`

- **الفهارس**: استخدم نمط `idx_[table_name]_[column_name(s)]`.
  - مثال: `idx_products_name`, `idx_orders_user_id_status`

## نمذجة البيانات

### تعريف النماذج

استخدم Sequelize لتعريف نماذج البيانات. اتبع هذا النمط:

```javascript
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'vendor'),
      defaultValue: 'user'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    User.hasMany(models.Order, {
      foreignKey: 'user_id',
      as: 'orders'
    });
  };

  return User;
};
```

### التحقق من صحة البيانات

استخدم آليات التحقق المدمجة في Sequelize لضمان سلامة البيانات:

```javascript
email: {
  type: DataTypes.STRING(100),
  allowNull: false,
  unique: true,
  validate: {
    isEmail: true
  }
},
price: {
  type: DataTypes.DECIMAL(10, 2),
  allowNull: false,
  validate: {
    min: 0
  }
}
```

### الخطافات (Hooks)

aاستخدم خطافات Sequelize لتنفيذ المنطق قبل أو بعد عمليات قاعدة البيانات:

```javascript
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 12);
  }
});
```

## استعلامات قاعدة البيانات

### أفضل الممارسات للاستعلامات

1. **استخدم ORM**: استخدم Sequelize لمعظم العمليات لتحسين الأمان والقابلية للصيانة.
2. **تجنب N+1**: استخدم التحميل المسبق (eager loading) لتجنب مشكلة N+1.
3. **حدد الأعمدة**: حدد فقط الأعمدة التي تحتاجها لتقليل حجم البيانات المنقولة.
4. **استخدم المعاملات**: استخدم المعاملات للعمليات المتعددة المترابطة.
5. **تجنب الاستعلامات المتداخلة**: استخدم الانضمامات (joins) بدلاً من الاستعلامات المتداخلة.

### أمثلة على استعلامات Sequelize

**استعلام بسيط**:

```javascript
// الحصول على مستخدم بواسطة المعرف
const user = await User.findByPk(userId, {
  attributes: ['id', 'first_name', 'last_name', 'email', 'role']
});
```

**استعلام مع تحميل مسبق**:

```javascript
// الحصول على طلب مع تفاصيل المنتجات
const order = await Order.findByPk(orderId, {
  include: [{
    model: OrderItem,
    as: 'items',
    include: [{
      model: Product,
      as: 'product',
      attributes: ['id', 'name', 'price', 'image_url']
    }]
  }, {
    model: User,
    as: 'user',
    attributes: ['id', 'first_name', 'last_name', 'email']
  }]
});
```

**استعلام مع شروط**:

```javascript
// البحث عن منتجات بناءً على معايير متعددة
const products = await Product.findAll({
  where: {
    category_id: categoryId,
    price: {
      [Op.between]: [minPrice, maxPrice]
    },
    status: 'active'
  },
  order: [['price', 'ASC']],
  limit: 10,
  offset: (page - 1) * 10
});
```

**استخدام المعاملات**:

```javascript
const t = await sequelize.transaction();

try {
  // إنشاء طلب
  const order = await Order.create({
    user_id: userId,
    total_amount: totalAmount,
    status: 'pending'
  }, { transaction: t });

  // إنشاء عناصر الطلب
  await Promise.all(items.map(item => {
    return OrderItem.create({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price
    }, { transaction: t });
  }));

  // تحديث المخزون
  await Promise.all(items.map(item => {
    return Product.decrement('stock', {
      by: item.quantity,
      where: { id: item.productId },
      transaction: t
    });
  }));

  await t.commit();
  return order;
} catch (error) {
  await t.rollback();
  throw error;
}
```

## الفهارس

### استراتيجية الفهرسة

1. **المفاتيح الأجنبية**: قم بفهرسة جميع المفاتيح الأجنبية.
2. **أعمدة البحث**: قم بفهرسة الأعمدة المستخدمة بشكل متكرر في عمليات البحث.
3. **أعمدة الترتيب**: قم بفهرسة الأعمدة المستخدمة بشكل متكرر في عمليات الترتيب.
4. **الفهارس المركبة**: استخدم الفهارس المركبة للاستعلامات التي تستخدم أكثر من عمود في شروط البحث.

### تعريف الفهارس في Sequelize

```javascript
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    // تعريف الأعمدة
  }, {
    tableName: 'products',
    indexes: [
      {
        name: 'idx_products_category_id',
        fields: ['category_id']
      },
      {
        name: 'idx_products_name',
        fields: ['name']
      },
      {
        name: 'idx_products_price_status',
        fields: ['price', 'status']
      }
    ]
  });

  return Product;
};
```

## العلاقات

### أنواع العلاقات

1. **واحد إلى واحد (One-to-One)**:

```javascript
// في نموذج User
User.hasOne(models.Profile, {
  foreignKey: 'user_id',
  as: 'profile'
});

// في نموذج Profile
Profile.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user'
});
```

2. **واحد إلى متعدد (One-to-Many)**:

```javascript
// في نموذج User
User.hasMany(models.Order, {
  foreignKey: 'user_id',
  as: 'orders'
});

// في نموذج Order
Order.belongsTo(models.User, {
  foreignKey: 'user_id',
  as: 'user'
});
```

3. **متعدد إلى متعدد (Many-to-Many)**:

```javascript
// في نموذج Product
Product.belongsToMany(models.Tag, {
  through: 'product_tags',
  foreignKey: 'product_id',
  otherKey: 'tag_id',
  as: 'tags'
});

// في نموذج Tag
Tag.belongsToMany(models.Product, {
  through: 'product_tags',
  foreignKey: 'tag_id',
  otherKey: 'product_id',
  as: 'products'
});
```

## الترحيلات

### استخدام Sequelize CLI للترحيلات

1. **إنشاء ترحيل جديد**:

```bash
npx sequelize-cli migration:generate --name create-users-table
```

2. **هيكل ملف الترحيل**:

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      first_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin', 'vendor'),
        defaultValue: 'user'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // إضافة فهارس
    await queryInterface.addIndex('users', ['email'], {
      name: 'idx_users_email',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
```

3. **تشغيل الترحيلات**:

```bash
npx sequelize-cli db:migrate
```

4. **التراجع عن الترحيلات**:

```bash
npx sequelize-cli db:migrate:undo
```

## البذور

### إنشاء بيانات اختبار

1. **إنشاء ملف بذور جديد**:

```bash
npx sequelize-cli seed:generate --name demo-users
```

2. **هيكل ملف البذور**:

```javascript
'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    return queryInterface.bulkInsert('users', [{
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    }, {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      password: hashedPassword,
      role: 'user',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete('users', null, {});
  }
};
```

3. **تشغيل البذور**:

```bash
npx sequelize-cli db:seed:all
```

## التعامل مع الأخطاء

### استراتيجيات التعامل مع أخطاء قاعدة البيانات

1. **التقاط الأخطاء**: استخدم بلوكات try-catch لالتقاط ومعالجة أخطاء قاعدة البيانات.

```javascript
try {
  const user = await User.create(userData);
  return user;
} catch (error) {
  if (error.name === 'SequelizeUniqueConstraintError') {
    throw new AppError('البريد الإلكتروني مستخدم بالفعل', 400);
  }
  throw new AppError('حدث خطأ أثناء إنشاء المستخدم', 500);
}
```

2. **التسجيل**: قم بتسجيل أخطاء قاعدة البيانات للتحليل والتصحيح.

```javascript
try {
  // عملية قاعدة البيانات
} catch (error) {
  logger.error('خطأ في قاعدة البيانات:', {
    error: error.message,
    stack: error.stack,
    query: error.sql // إذا كان متاحًا
  });
  throw error;
}
```

## الأمان

### أفضل ممارسات أمان قاعدة البيانات

1. **الحماية من حقن SQL**: استخدم دائمًا الاستعلامات المعدة مسبقًا أو ORM.

```javascript
// آمن - استخدام Sequelize
const user = await User.findOne({
  where: { email }
});

// غير آمن - استعلام SQL مباشر
// const [user] = await sequelize.query(`SELECT * FROM users WHERE email = '${email}'`);
```

2. **تشفير البيانات الحساسة**: قم بتشفير البيانات الحساسة قبل تخزينها.

```javascript
// تشفير كلمة المرور قبل التخزين
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 12);
});
```

3. **التحكم في الوصول**: قيد الوصول إلى قاعدة البيانات باستخدام أقل الامتيازات الممكنة.

4. **تدقيق التغييرات**: قم بتسجيل التغييرات المهمة في البيانات.

```javascript
// تسجيل تغييرات المستخدم
User.afterUpdate(async (user) => {
  if (user.changed('role') || user.changed('status')) {
    await AuditLog.create({
      entity_type: 'user',
      entity_id: user.id,
      action: 'update',
      changes: JSON.stringify(user.changed()),
      user_id: user._currentUserId // يجب تعيينه قبل الحفظ
    });
  }
});
```

## الأداء

### تحسين أداء قاعدة البيانات

1. **الفهرسة المناسبة**: قم بفهرسة الأعمدة المستخدمة بشكل متكرر في عمليات البحث والترتيب.

2. **تحسين الاستعلامات**: استخدم EXPLAIN لتحليل وتحسين الاستعلامات.

```javascript
const [results, metadata] = await sequelize.query('EXPLAIN SELECT * FROM products WHERE category_id = 1');
console.log(results);
```

3. **التخزين المؤقت**: استخدم Redis لتخزين نتائج الاستعلامات المتكررة مؤقتًا.

```javascript
async function getProductById(id) {
  const cacheKey = `product:${id}`;
  
  // محاولة الحصول على المنتج من التخزين المؤقت
  const cachedProduct = await redisClient.get(cacheKey);
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }
  
  // إذا لم يكن موجودًا في التخزين المؤقت، احصل عليه من قاعدة البيانات
  const product = await Product.findByPk(id);
  
  // تخزين المنتج في التخزين المؤقت لمدة ساعة
  if (product) {
    await redisClient.set(cacheKey, JSON.stringify(product), 'EX', 3600);
  }
  
  return product;
}
```

4. **تقليل البيانات المنقولة**: حدد فقط الأعمدة التي تحتاجها.

```javascript
const users = await User.findAll({
  attributes: ['id', 'first_name', 'last_name', 'email'] // فقط الأعمدة المطلوبة
});
```

5. **تقسيم النتائج**: استخدم الترقيم والتقسيم للاستعلامات التي تعيد مجموعات كبيرة من البيانات.

```javascript
const { page = 1, limit = 10 } = req.query;
const offset = (page - 1) * limit;

const { rows: products, count } = await Product.findAndCountAll({
  limit: parseInt(limit),
  offset: parseInt(offset),
  order: [['created_at', 'DESC']]
});

return {
  products,
  pagination: {
    page: parseInt(page),
    limit: parseInt(limit),
    totalItems: count,
    totalPages: Math.ceil(count / limit)
  }
};
```

## النسخ الاحتياطي واستعادة البيانات

### استراتيجيات النسخ الاحتياطي

1. **النسخ الاحتياطي الكامل**: قم بإجراء نسخ احتياطي كامل لقاعدة البيانات بشكل منتظم.

```bash
mysqldump -u [username] -p [database_name] > backup_$(date +%Y%m%d).sql
```

2. **النسخ الاحتياطي التزايدي**: قم بإجراء نسخ احتياطي للتغييرات فقط بين النسخ الاحتياطية الكاملة.

3. **جدولة النسخ الاحتياطي**: استخدم cron jobs لجدولة النسخ الاحتياطي التلقائي.

```bash
# نسخ احتياطي يومي في الساعة 2 صباحًا
0 2 * * * mysqldump -u [username] -p [database_name] > /path/to/backups/backup_$(date +\%Y\%m\%d).sql
```

### استعادة البيانات

```bash
mysql -u [username] -p [database_name] < backup_file.sql
```

## بيئات قاعدة البيانات

### إعداد بيئات متعددة

1. **بيئة التطوير**: استخدم قاعدة بيانات محلية مع بيانات اختبار.

2. **بيئة الاختبار**: استخدم قاعدة بيانات منفصلة للاختبارات الآلية.

3. **بيئة الإنتاج**: استخدم قاعدة بيانات مؤمنة ومحسنة للأداء.

### تكوين Sequelize لبيئات متعددة

```javascript
// config/database.js
module.exports = {
  development: {
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'supermall_dev',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'supermall_test',
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};
```

## أفضل الممارسات

### للمطورين

1. **استخدم ORM**: استخدم Sequelize بدلاً من استعلامات SQL المباشرة.

2. **استخدم المعاملات**: استخدم المعاملات للعمليات المتعددة المترابطة.

3. **تجنب N+1**: استخدم التحميل المسبق لتجنب مشكلة N+1.

4. **اختبر استعلامات قاعدة البيانات**: اكتب اختبارات للتأكد من أن استعلامات قاعدة البيانات تعمل بشكل صحيح.

5. **استخدم الترحيلات**: استخدم ترحيلات Sequelize لإدارة تغييرات قاعدة البيانات.

### لمسؤولي قاعدة البيانات

1. **مراقبة الأداء**: راقب أداء قاعدة البيانات وحدد الاستعلامات البطيئة.

2. **النسخ الاحتياطي المنتظم**: قم بإجراء نسخ احتياطي منتظم واختبر عملية الاستعادة.

3. **تحسين الفهارس**: راجع وحسن استراتيجية الفهرسة بناءً على أنماط الاستخدام.

4. **تحديث النظام**: حافظ على تحديث نظام إدارة قاعدة البيانات.

5. **أمان قاعدة البيانات**: طبق أفضل ممارسات الأمان وراجعها بانتظام.

## موارد إضافية

- [وثائق Sequelize](https://sequelize.org/master/)
- [وثائق MySQL](https://dev.mysql.com/doc/)
- [أفضل ممارسات أداء MySQL](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [أنماط تصميم قاعدة البيانات](https://www.amazon.com/Database-Design-Relational-Theory-Normal/dp/1449328016)

---

## ملاحظة

هذه الإرشادات قابلة للتطوير وقد تتغير مع تطور المشروع. يرجى الرجوع إلى هذا المستند بانتظام للحصول على أحدث الإرشادات والممارسات الموصى بها.