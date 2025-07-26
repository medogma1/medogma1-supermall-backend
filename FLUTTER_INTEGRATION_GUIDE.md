# دليل تكامل Flutter مع SuperMall Backend

## 🚨 حل مشكلة 401 Unauthorized

### المشكلة المكتشفة
الخطأ الذي تواجهه:
```
PUT http://localhost:5001/vendors/53/settings 401 (Unauthorized)
Error response: {"status":"fail","message":"غير مصرح - التوكن مطلوب"}
```

### الأسباب المحتملة

1. **عدم إرسال الرمز المميز**: التطبيق لا يرسل Authorization header
2. **رمز مميز منتهي الصلاحية**: الرمز المميز انتهت صلاحيته
3. **تنسيق خاطئ للرمز المميز**: عدم استخدام تنسيق Bearer الصحيح
4. **رمز مميز غير صحيح**: الرمز المميز تالف أو غير صالح
5. **مشكلة في التخزين المحلي**: فقدان الرمز المميز من التخزين المحلي

## ✅ الحلول المطلوبة

### 1. التحقق من إرسال الرمز المميز

#### ❌ الطريقة الخاطئة:
```dart
// بدون Authorization header
final response = await http.put(
  Uri.parse('$baseUrl/vendors/$vendorId/settings'),
  headers: {
    'Content-Type': 'application/json',
  },
  body: jsonEncode(data),
);
```

#### ✅ الطريقة الصحيحة:
```dart
// مع Authorization header صحيح
String? token = await _getStoredToken();
if (token == null || token.isEmpty) {
  // إعادة توجيه لصفحة تسجيل الدخول
  _redirectToLogin();
  return;
}

final response = await http.put(
  Uri.parse('$baseUrl/vendors/$vendorId/settings'),
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'application/json',
  },
  body: jsonEncode(data),
);
```

### 2. إدارة الرموز المميزة بشكل صحيح

#### إنشاء خدمة إدارة الرموز المميزة:

```dart
// lib/services/auth_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  static const String _userDataKey = 'user_data';

  // حفظ الرمز المميز
  static Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  // جلب الرمز المميز
  static Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  // التحقق من صحة الرمز المميز
  static Future<bool> isTokenValid() async {
    try {
      String? token = await getToken();
      if (token == null || token.isEmpty) {
        return false;
      }

      // التحقق من انتهاء صلاحية الرمز المميز
      bool isExpired = JwtDecoder.isExpired(token);
      return !isExpired;
    } catch (e) {
      print('Error checking token validity: $e');
      return false;
    }
  }

  // جلب بيانات المستخدم من الرمز المميز
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      String? token = await getToken();
      if (token == null) return null;

      Map<String, dynamic> decodedToken = JwtDecoder.decode(token);
      return decodedToken;
    } catch (e) {
      print('Error decoding token: $e');
      return null;
    }
  }

  // حذف الرمز المميز (تسجيل الخروج)
  static Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
    await _storage.delete(key: _refreshTokenKey);
    await _storage.delete(key: _userDataKey);
  }

  // التحقق من دور المستخدم
  static Future<String?> getUserRole() async {
    Map<String, dynamic>? userData = await getUserData();
    return userData?['role'];
  }

  // التحقق من معرف البائع
  static Future<int?> getVendorId() async {
    Map<String, dynamic>? userData = await getUserData();
    return userData?['vendorId'] ?? userData?['id'];
  }
}
```

### 3. إنشاء HTTP Client محسن

```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:5001';
  
  // إرسال طلب مع مصادقة تلقائية
  static Future<http.Response> authenticatedRequest(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? additionalHeaders,
  }) async {
    // التحقق من صحة الرمز المميز
    bool isValid = await AuthService.isTokenValid();
    if (!isValid) {
      throw UnauthorizedException('Token is invalid or expired');
    }

    String? token = await AuthService.getToken();
    if (token == null) {
      throw UnauthorizedException('No token found');
    }

    // إعداد الرؤوس
    Map<String, String> headers = {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (additionalHeaders != null) {
      headers.addAll(additionalHeaders);
    }

    // إرسال الطلب
    Uri uri = Uri.parse('$baseUrl$endpoint');
    http.Response response;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await http.get(uri, headers: headers);
        break;
      case 'POST':
        response = await http.post(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'PUT':
        response = await http.put(
          uri,
          headers: headers,
          body: body != null ? jsonEncode(body) : null,
        );
        break;
      case 'DELETE':
        response = await http.delete(uri, headers: headers);
        break;
      default:
        throw ArgumentError('Unsupported HTTP method: $method');
    }

    // معالجة الاستجابة
    return _handleResponse(response);
  }

  // معالجة الاستجابة والأخطاء
  static http.Response _handleResponse(http.Response response) {
    print('Response Status: ${response.statusCode}');
    print('Response Body: ${response.body}');

    switch (response.statusCode) {
      case 200:
      case 201:
        return response;
      case 401:
        // رمز مميز غير صالح - تسجيل خروج تلقائي
        AuthService.clearToken();
        throw UnauthorizedException('Unauthorized - Please login again');
      case 403:
        throw ForbiddenException('Access denied');
      case 404:
        throw NotFoundException('Resource not found');
      case 422:
        throw ValidationException('Validation error', response.body);
      case 500:
        throw ServerException('Internal server error');
      default:
        throw ApiException('Request failed with status: ${response.statusCode}');
    }
  }
}

// فئات الأخطاء المخصصة
class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => 'ApiException: $message';
}

class UnauthorizedException extends ApiException {
  UnauthorizedException(String message) : super(message);
}

class ForbiddenException extends ApiException {
  ForbiddenException(String message) : super(message);
}

class NotFoundException extends ApiException {
  NotFoundException(String message) : super(message);
}

class ValidationException extends ApiException {
  final String details;
  ValidationException(String message, this.details) : super(message);
}

class ServerException extends ApiException {
  ServerException(String message) : super(message);
}
```

### 4. تحديث إعدادات المتجر بشكل صحيح

```dart
// lib/services/vendor_service.dart
import 'dart:convert';
import 'api_service.dart';
import 'auth_service.dart';

class VendorService {
  // تحديث إعدادات المتجر
  static Future<Map<String, dynamic>> updateStoreSettings(
    Map<String, dynamic> settings,
  ) async {
    try {
      // التحقق من دور المستخدم
      String? role = await AuthService.getUserRole();
      if (role != 'vendor' && role != 'admin') {
        throw ForbiddenException('Only vendors and admins can update store settings');
      }

      // جلب معرف البائع
      int? vendorId = await AuthService.getVendorId();
      if (vendorId == null && role == 'vendor') {
        throw Exception('Vendor ID not found in token');
      }

      // التحقق من صحة البيانات المطلوبة
      _validateStoreSettings(settings);

      // إرسال الطلب
      final response = await ApiService.authenticatedRequest(
        'PUT',
        '/vendors/$vendorId/settings',
        body: settings,
      );

      // تحليل الاستجابة
      Map<String, dynamic> responseData = jsonDecode(response.body);
      return responseData;
    } catch (e) {
      print('Error updating store settings: $e');
      rethrow;
    }
  }

  // التحقق من صحة بيانات إعدادات المتجر
  static void _validateStoreSettings(Map<String, dynamic> settings) {
    List<String> requiredFields = [
      'storeName',
      'storeDescription',
      'storeLogoUrl',
      'contactEmail',
      'contactPhone',
      'storeAddress',
    ];

    for (String field in requiredFields) {
      if (!settings.containsKey(field) || 
          settings[field] == null || 
          settings[field].toString().trim().isEmpty) {
        throw ValidationException('Missing required field: $field', '');
      }
    }

    // التحقق من صحة البريد الإلكتروني
    String email = settings['contactEmail'];
    if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(email)) {
      throw ValidationException('Invalid email format', '');
    }

    // التحقق من صحة رقم الهاتف السعودي
    String phone = settings['contactPhone'];
    if (!RegExp(r'^(\+966|0)?[5][0-9]{8}$').hasMatch(phone.replaceAll(' ', ''))) {
      throw ValidationException('Invalid Saudi phone number format', '');
    }
  }

  // جلب إعدادات المتجر الحالية
  static Future<Map<String, dynamic>> getStoreSettings() async {
    try {
      int? vendorId = await AuthService.getVendorId();
      if (vendorId == null) {
        throw Exception('Vendor ID not found');
      }

      final response = await ApiService.authenticatedRequest(
        'GET',
        '/vendors/$vendorId/settings',
      );

      Map<String, dynamic> responseData = jsonDecode(response.body);
      return responseData['data'] ?? {};
    } catch (e) {
      print('Error fetching store settings: $e');
      rethrow;
    }
  }
}
```

### 5. استخدام الخدمات في واجهة المستخدم

```dart
// lib/screens/store_settings_screen.dart
import 'package:flutter/material.dart';
import '../services/vendor_service.dart';
import '../services/auth_service.dart';

class StoreSettingsScreen extends StatefulWidget {
  @override
  _StoreSettingsScreenState createState() => _StoreSettingsScreenState();
}

class _StoreSettingsScreenState extends State<StoreSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  
  // متحكمات النصوص
  final _storeNameController = TextEditingController();
  final _storeDescriptionController = TextEditingController();
  final _contactEmailController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _storeAddressController = TextEditingController();
  final _storeLogoUrlController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCurrentSettings();
  }

  // تحميل الإعدادات الحالية
  Future<void> _loadCurrentSettings() async {
    try {
      setState(() => _isLoading = true);
      
      Map<String, dynamic> settings = await VendorService.getStoreSettings();
      
      _storeNameController.text = settings['storeName'] ?? '';
      _storeDescriptionController.text = settings['storeDescription'] ?? '';
      _contactEmailController.text = settings['contactEmail'] ?? '';
      _contactPhoneController.text = settings['contactPhone'] ?? '';
      _storeAddressController.text = settings['storeAddress'] ?? '';
      _storeLogoUrlController.text = settings['storeLogoUrl'] ?? '';
      
    } catch (e) {
      _showErrorDialog('خطأ في تحميل الإعدادات: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // حفظ الإعدادات
  Future<void> _saveSettings() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    try {
      setState(() => _isLoading = true);

      Map<String, dynamic> settings = {
        'storeName': _storeNameController.text.trim(),
        'storeDescription': _storeDescriptionController.text.trim(),
        'contactEmail': _contactEmailController.text.trim(),
        'contactPhone': _contactPhoneController.text.trim(),
        'storeAddress': _storeAddressController.text.trim(),
        'storeLogoUrl': _storeLogoUrlController.text.trim(),
        'businessHours': {
          'sunday': {'open': '09:00', 'close': '22:00', 'isOpen': true},
          'monday': {'open': '09:00', 'close': '22:00', 'isOpen': true},
          'tuesday': {'open': '09:00', 'close': '22:00', 'isOpen': true},
          'wednesday': {'open': '09:00', 'close': '22:00', 'isOpen': true},
          'thursday': {'open': '09:00', 'close': '22:00', 'isOpen': true},
          'friday': {'open': '14:00', 'close': '22:00', 'isOpen': true},
          'saturday': {'open': '09:00', 'close': '22:00', 'isOpen': true},
        },
        'deliverySettings': {
          'deliveryFee': 15.0,
          'freeDeliveryThreshold': 100.0,
          'estimatedDeliveryTime': '30-45 دقيقة',
          'deliveryAreas': ['الرياض', 'الخرج', 'الدرعية']
        },
        'isActive': true,
        'allowReviews': true,
        'minimumOrderAmount': 50.0,
      };

      await VendorService.updateStoreSettings(settings);
      
      _showSuccessDialog('تم حفظ الإعدادات بنجاح!');
      
    } catch (e) {
      String errorMessage = 'خطأ في حفظ الإعدادات';
      
      if (e is UnauthorizedException) {
        errorMessage = 'انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.';
        _redirectToLogin();
      } else if (e is ValidationException) {
        errorMessage = 'خطأ في البيانات المدخلة: ${e.message}';
      } else if (e is ForbiddenException) {
        errorMessage = 'غير مسموح لك بتحديث هذه الإعدادات';
      } else {
        errorMessage = 'خطأ غير متوقع: $e';
      }
      
      _showErrorDialog(errorMessage);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  // إعادة توجيه لصفحة تسجيل الدخول
  void _redirectToLogin() {
    Navigator.of(context).pushNamedAndRemoveUntil(
      '/login',
      (route) => false,
    );
  }

  // عرض رسالة خطأ
  void _showErrorDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('خطأ'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('موافق'),
          ),
        ],
      ),
    );
  }

  // عرض رسالة نجاح
  void _showSuccessDialog(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('نجح'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('موافق'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('إعدادات المتجر'),
        actions: [
          if (_isLoading)
            Center(child: CircularProgressIndicator())
          else
            IconButton(
              icon: Icon(Icons.save),
              onPressed: _saveSettings,
            ),
        ],
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: EdgeInsets.all(16),
                children: [
                  TextFormField(
                    controller: _storeNameController,
                    decoration: InputDecoration(
                      labelText: 'اسم المتجر *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'اسم المتجر مطلوب';
                      }
                      if (value.trim().length < 2) {
                        return 'اسم المتجر يجب أن يكون أكثر من حرفين';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _storeDescriptionController,
                    decoration: InputDecoration(
                      labelText: 'وصف المتجر *',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 3,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'وصف المتجر مطلوب';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _contactEmailController,
                    decoration: InputDecoration(
                      labelText: 'البريد الإلكتروني *',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.emailAddress,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'البريد الإلكتروني مطلوب';
                      }
                      if (!RegExp(r'^[^@]+@[^@]+\.[^@]+').hasMatch(value)) {
                        return 'تنسيق البريد الإلكتروني غير صحيح';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _contactPhoneController,
                    decoration: InputDecoration(
                      labelText: 'رقم الهاتف *',
                      border: OutlineInputBorder(),
                      hintText: '05xxxxxxxx',
                    ),
                    keyboardType: TextInputType.phone,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'رقم الهاتف مطلوب';
                      }
                      String phone = value.replaceAll(' ', '');
                      if (!RegExp(r'^(\+966|0)?[5][0-9]{8}$').hasMatch(phone)) {
                        return 'تنسيق رقم الهاتف السعودي غير صحيح';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _storeAddressController,
                    decoration: InputDecoration(
                      labelText: 'عنوان المتجر *',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'عنوان المتجر مطلوب';
                      }
                      if (value.trim().length < 10) {
                        return 'عنوان المتجر يجب أن يكون مفصلاً أكثر';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _storeLogoUrlController,
                    decoration: InputDecoration(
                      labelText: 'رابط شعار المتجر *',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'رابط شعار المتجر مطلوب';
                      }
                      try {
                        Uri.parse(value);
                      } catch (e) {
                        return 'رابط غير صحيح';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _isLoading ? null : _saveSettings,
                    child: _isLoading
                        ? CircularProgressIndicator()
                        : Text('حفظ الإعدادات'),
                    style: ElevatedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  @override
  void dispose() {
    _storeNameController.dispose();
    _storeDescriptionController.dispose();
    _contactEmailController.dispose();
    _contactPhoneController.dispose();
    _storeAddressController.dispose();
    _storeLogoUrlController.dispose();
    super.dispose();
  }
}
```

## 📋 قائمة التحقق للتشخيص

### 1. فحص الرمز المميز
```dart
// إضافة هذا الكود للتشخيص
Future<void> debugTokenInfo() async {
  String? token = await AuthService.getToken();
  print('Token exists: ${token != null}');
  
  if (token != null) {
    print('Token length: ${token.length}');
    print('Token starts with: ${token.substring(0, 20)}...');
    
    bool isValid = await AuthService.isTokenValid();
    print('Token is valid: $isValid');
    
    Map<String, dynamic>? userData = await AuthService.getUserData();
    print('User data: $userData');
  }
}
```

### 2. فحص الطلب
```dart
// إضافة logging للطلبات
class DebugHttpClient {
  static Future<http.Response> debugRequest(
    String method,
    String url,
    Map<String, String> headers,
    String? body,
  ) async {
    print('=== DEBUG REQUEST ===');
    print('Method: $method');
    print('URL: $url');
    print('Headers: $headers');
    print('Body: $body');
    print('====================');
    
    // إرسال الطلب الفعلي هنا
    // ...
  }
}
```

## 🔧 التبعيات المطلوبة

أضف هذه التبعيات إلى `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  flutter_secure_storage: ^9.0.0
  jwt_decoder: ^2.0.1
  
dev_dependencies:
  flutter_test:
    sdk: flutter
```

## 🚀 خطوات التنفيذ

1. **إضافة التبعيات** إلى `pubspec.yaml`
2. **إنشاء خدمة المصادقة** (`AuthService`)
3. **إنشاء خدمة API** (`ApiService`)
4. **إنشاء خدمة البائعين** (`VendorService`)
5. **تحديث واجهات المستخدم** لاستخدام الخدمات الجديدة
6. **اختبار التكامل** مع الخادم

## 📞 الدعم والاستكشاف

إذا استمرت المشكلة:

1. **تحقق من سجلات الخادم**:
   ```bash
   tail -f logs/vendor-service.log
   ```

2. **اختبر الرمز المميز يدوياً**:
   ```bash
   npm run generate-tokens
   ```

3. **اختبر نقطة النهاية**:
   ```bash
   npm run test-endpoint
   ```

4. **تشغيل اختبارات المصادقة**:
   ```bash
   npm run test:auth
   ```

هذا الدليل يجب أن يحل مشكلة 401 Unauthorized ويوفر أساساً قوياً لتكامل Flutter مع SuperMall Backend! 🎯