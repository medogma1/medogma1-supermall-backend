// auth-service/utils/constants.js

// ثوابت المستخدم
const USER_ROLES = {
  ADMIN: 'admin',
  VENDOR: 'vendor',
  CUSTOMER: 'user'
};

// ثوابت التحقق
const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 50,
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
  PHONE_REGEX: /^01[0125][0-9]{8}$/,
  NATIONAL_ID_REGEX: /^[2-3][0-9]{13}$/,
  PASSWORD_REGEX: /^(?=.*\d)(?=.*[!@#$&*])[A-Za-z\d!@#$&*]{8,}$/,
  // تعبير منتظم أقل تشددًا لكلمة مرور المسؤول
  ADMIN_PASSWORD_REGEX: /^[A-Za-z\d!@#$&*]{8,}$/
};

// الدول المتاحة
const COUNTRIES = [
  { code: 'EG', nameAr: 'مصر', nameEn: 'Egypt' }
];

// محافظات مصر
const EGYPT_GOVERNORATES = [
  { code: 'CAI', nameAr: 'القاهرة', nameEn: 'Cairo' },
  { code: 'GIZ', nameAr: 'الجيزة', nameEn: 'Giza' },
  { code: 'ALX', nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
  { code: 'DAK', nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
  { code: 'SHR', nameAr: 'الشرقية', nameEn: 'Sharqia' },
  { code: 'GHR', nameAr: 'الغربية', nameEn: 'Gharbia' },
  { code: 'MNF', nameAr: 'المنوفية', nameEn: 'Monufia' },
  { code: 'QAL', nameAr: 'القليوبية', nameEn: 'Qalyubia' },
  { code: 'BEH', nameAr: 'البحيرة', nameEn: 'Beheira' },
  { code: 'KFS', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh' },
  { code: 'DAM', nameAr: 'دمياط', nameEn: 'Damietta' },
  { code: 'PSD', nameAr: 'بورسعيد', nameEn: 'Port Said' },
  { code: 'ISM', nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
  { code: 'SUZ', nameAr: 'السويس', nameEn: 'Suez' },
  { code: 'ASN', nameAr: 'أسوان', nameEn: 'Aswan' },
  { code: 'AST', nameAr: 'أسيوط', nameEn: 'Assiut' },
  { code: 'BNS', nameAr: 'بني سويف', nameEn: 'Beni Suef' },
  { code: 'FYM', nameAr: 'الفيوم', nameEn: 'Fayoum' },
  { code: 'LXR', nameAr: 'الأقصر', nameEn: 'Luxor' },
  { code: 'MNY', nameAr: 'المنيا', nameEn: 'Minya' },
  { code: 'QNA', nameAr: 'قنا', nameEn: 'Qena' },
  { code: 'SHG', nameAr: 'سوهاج', nameEn: 'Sohag' },
  { code: 'WAD', nameAr: 'الوادي الجديد', nameEn: 'New Valley' },
  { code: 'MAT', nameAr: 'مطروح', nameEn: 'Matrouh' },
  { code: 'NSI', nameAr: 'شمال سيناء', nameEn: 'North Sinai' },
  { code: 'SSI', nameAr: 'جنوب سيناء', nameEn: 'South Sinai' },
  { code: 'RSE', nameAr: 'البحر الأحمر', nameEn: 'Red Sea' }
];

module.exports = {
  USER_ROLES,
  VALIDATION,
  COUNTRIES,
  EGYPT_GOVERNORATES
};