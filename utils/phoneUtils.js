/**
 * مكتبة مساعدة لمعالجة أرقام الهاتف
 * تحتوي على دوال لتنظيف وتحقق من صحة أرقام الهاتف
 */

/**
 * تنظيف رقم الهاتف من الأحرف غير المرغوب فيها
 * @param {string} phone - رقم الهاتف المراد تنظيفه
 * @returns {string} - رقم الهاتف المنظف
 */
function cleanPhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return '';
    }
    
    // إزالة جميع المسافات والأحرف غير المرئية
    let cleaned = phone
        .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]/g, '') // جميع أنواع المسافات
        .replace(/[\u200B\u200C\u200D\u2060]/g, '') // Zero-width characters
        .replace(/[\r\n\t]/g, '') // أحرف التحكم
        .replace(/[-\.\(\)]/g, '') // الشرطات والنقاط والأقواس
        .trim();
    
    // إزالة جميع الأحرف غير الرقمية باستثناء علامة +
    cleaned = cleaned.replace(/[^\d+]/g, '');
    
    // معالجة أكواد الدول الخاصة
    if (cleaned.startsWith('0020')) {
        cleaned = '+20' + cleaned.substring(4);
    } else if (cleaned.startsWith('00966')) {
        cleaned = '+966' + cleaned.substring(5);
    }
    
    // إزالة الأصفار الزائدة في البداية (ما عدا الأرقام المحلية)
    if (cleaned.startsWith('00') && !cleaned.startsWith('0020') && !cleaned.startsWith('00966')) {
        cleaned = '+' + cleaned.substring(2);
    }
    
    return cleaned;
}

/**
 * تحقق محسن من صحة رقم الهاتف (مصري وسعودي ودولي)
 * @param {string} phone - رقم الهاتف المراد التحقق منه
 * @returns {boolean} - true إذا كان الرقم صحيح
 */
function validatePhoneNumber(phone) {
    if (!phone || typeof phone !== 'string') {
        return false;
    }
    
    // تنظيف الرقم أولاً
    const cleanedPhone = cleanPhoneNumber(phone);
    
    if (!cleanedPhone) {
        return false;
    }
    
    // أنماط مختلفة للأرقام المدعومة
    const patterns = [
        // أرقام مصرية محلية
        /^01[0125][0-9]{8}$/,
        // أرقام سعودية محلية
        /^05[0-9]{8}$/,
        // أرقام سعودية مع كود الدولة
        /^\+9665[0-9]{8}$/,
        /^9665[0-9]{8}$/,
        // أرقام مصرية مع كود الدولة
        /^\+201[0125][0-9]{8}$/,
        /^201[0125][0-9]{8}$/,
        // أرقام دولية عامة
        /^\+[1-9]\d{7,14}$/
    ];
    
    return patterns.some(pattern => pattern.test(cleanedPhone));
}

/**
 * تنسيق رقم الهاتف للعرض
 * @param {string} phone - رقم الهاتف
 * @returns {string} - رقم الهاتف منسق للعرض
 */
function formatPhoneForDisplay(phone) {
    const cleaned = cleanPhoneNumber(phone);
    
    if (!cleaned) {
        return '';
    }
    
    // تنسيق الأرقام المصرية
    if (cleaned.match(/^01[0125][0-9]{8}$/)) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    
    // تنسيق الأرقام الدولية
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    
    return cleaned;
}

/**
 * اختبار شامل لدالة تنظيف رقم الهاتف
 */
function testPhoneUtils() {
    console.log('🧪 اختبار دوال معالجة رقم الهاتف...');
    
    const testCases = [
        // حالات الأحرف غير المرئية
        { input: ' 01012345678 ', expected: '01012345678', description: 'مسافات في البداية والنهاية' },
        { input: '0101 234 5678', expected: '01012345678', description: 'مسافات في الوسط' },
        { input: '0101-234-5678', expected: '01012345678', description: 'شرطات' },
        { input: '0101.234.5678', expected: '01012345678', description: 'نقاط' },
        { input: '\u200B01012345678\u200B', expected: '01012345678', description: 'Zero-width space' },
        { input: '01012345678\u00A0', expected: '01012345678', description: 'Non-breaking space' },
        { input: '\t01012345678\r\n', expected: '01012345678', description: 'أحرف التحكم' },
        
        // حالات كود الدولة
        { input: '+20 101 234 5678', expected: '+201012345678', description: 'كود مصر مع مسافات' },
        { input: '0020101234567', expected: '+20101234567', description: 'كود مصر بدون +' },
        { input: '+1 234 567 890', expected: '+1234567890', description: 'رقم دولي' },
        
        // حالات خاصة
        { input: 'abc01012345678def', expected: '01012345678', description: 'أحرف مع الرقم' },
        { input: '(010) 123-4567', expected: '0101234567', description: 'أقواس وشرطات' },
        { input: '', expected: '', description: 'نص فارغ' },
        { input: null, expected: '', description: 'null' },
        { input: undefined, expected: '', description: 'undefined' }
    ];
    
    let passed = 0;
    let failed = 0;
    
    testCases.forEach((testCase, index) => {
        const result = cleanPhoneNumber(testCase.input);
        const success = result === testCase.expected;
        
        console.log(`${success ? '✅' : '❌'} اختبار ${index + 1}: ${testCase.description}`);
        console.log(`   المدخل: "${testCase.input}" -> النتيجة: "${result}" (متوقع: "${testCase.expected}")`);
        
        if (success) {
            passed++;
        } else {
            failed++;
            console.log(`   ❌ فشل: توقع "${testCase.expected}" لكن حصل على "${result}"`);
        }
    });
    
    console.log(`\n📊 نتائج الاختبار: ${passed} نجح، ${failed} فشل`);
    
    // اختبار التحقق من الصحة
    console.log('\n🔍 اختبار التحقق من صحة الأرقام:');
    const validationTests = [
        { phone: '01012345678', expected: true },
        { phone: ' 01012345678 ', expected: true },
        { phone: '0101-234-5678', expected: true },
        { phone: '+201012345678', expected: true },
        { phone: '+1234567890', expected: true },
        { phone: '1234567890', expected: false }, // رقم بدون كود دولة أو 0
        { phone: '0101234567', expected: false }, // رقم ناقص
        { phone: 'abc123', expected: false },
        { phone: '', expected: false }
    ];
    
    validationTests.forEach((test, index) => {
        const result = validatePhoneNumber(test.phone);
        const success = result === test.expected;
        console.log(`${success ? '✅' : '❌'} "${test.phone}" -> ${result} (متوقع: ${test.expected})`);
    });
}

module.exports = {
    cleanPhoneNumber,
    validatePhoneNumber,
    formatPhoneForDisplay,
    testPhoneUtils
};