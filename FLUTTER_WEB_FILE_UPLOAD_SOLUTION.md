# حل مشكلة رفع الملفات في Flutter Web

## المشكلة
عند تشغيل تطبيق Flutter في بيئة الويب، تظهر رسالة الخطأ:
```
Unsupported operation: MultipartFile is only supported where dart:io is available
```

هذا يحدث لأن `dart:io` غير متاح في بيئة الويب، وبالتالي لا يمكن استخدام `MultipartFile` من `dart:io`.

## الحل

### 1. استخدام http package مع MultipartFile من http

```dart
import 'package:http/http.dart' as http;
import 'dart:typed_data';
import 'dart:html' as html; // للويب فقط

class FileUploadService {
  static const String baseUrl = 'http://localhost:5001';
  
  // رفع ملف في بيئة الويب
  static Future<Map<String, dynamic>> uploadFileWeb(Uint8List fileBytes, String fileName) async {
    try {
      var request = http.MultipartRequest(
        'POST',
        Uri.parse('$baseUrl/upload'),
      );
      
      // إضافة الملف كـ bytes
      request.files.add(
        http.MultipartFile.fromBytes(
          'file',
          fileBytes,
          filename: fileName,
        ),
      );
      
      // إضافة headers إذا لزم الأمر
      request.headers['Authorization'] = 'Bearer YOUR_TOKEN';
      
      var response = await request.send();
      var responseData = await response.stream.bytesToString();
      
      if (response.statusCode == 200) {
        return json.decode(responseData);
      } else {
        throw Exception('فشل في رفع الملف: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('خطأ في رفع الملف: $e');
    }
  }
  
  // اختيار ملف في بيئة الويب
  static Future<Map<String, dynamic>?> pickAndUploadFile() async {
    try {
      // إنشاء input element
      final html.FileUploadInputElement uploadInput = html.FileUploadInputElement();
      uploadInput.accept = 'image/*'; // قبول الصور فقط
      uploadInput.click();
      
      // انتظار اختيار الملف
      await uploadInput.onChange.first;
      
      if (uploadInput.files!.isEmpty) return null;
      
      final file = uploadInput.files!.first;
      final reader = html.FileReader();
      
      reader.readAsArrayBuffer(file);
      await reader.onLoad.first;
      
      final Uint8List fileBytes = reader.result as Uint8List;
      
      // رفع الملف
      return await uploadFileWeb(fileBytes, file.name);
    } catch (e) {
      print('خطأ في اختيار/رفع الملف: $e');
      return null;
    }
  }
}
```

### 2. استخدام file_picker package (الحل الأفضل)

```yaml
# في pubspec.yaml
dependencies:
  file_picker: ^6.1.1
  http: ^1.1.0
```

```dart
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

class UniversalFileUploadService {
  static const String baseUrl = 'http://localhost:5001';
  
  static Future<Map<String, dynamic>?> pickAndUploadFile() async {
    try {
      // اختيار الملف
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
      );
      
      if (result != null && result.files.isNotEmpty) {
        PlatformFile file = result.files.first;
        
        // التحقق من وجود bytes (للويب)
        if (file.bytes != null) {
          return await uploadFileBytes(file.bytes!, file.name);
        }
        // للموبايل - استخدام path
        else if (file.path != null) {
          return await uploadFilePath(file.path!);
        }
      }
      return null;
    } catch (e) {
      print('خطأ في اختيار الملف: $e');
      return null;
    }
  }
  
  // رفع ملف من bytes (للويب)
  static Future<Map<String, dynamic>> uploadFileBytes(Uint8List bytes, String fileName) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/upload'),
    );
    
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: fileName,
      ),
    );
    
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 200) {
      return json.decode(responseData);
    } else {
      throw Exception('فشل في رفع الملف');
    }
  }
  
  // رفع ملف من path (للموبايل)
  static Future<Map<String, dynamic>> uploadFilePath(String filePath) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/upload'),
    );
    
    request.files.add(
      await http.MultipartFile.fromPath('file', filePath),
    );
    
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 200) {
      return json.decode(responseData);
    } else {
      throw Exception('فشل في رفع الملف');
    }
  }
}
```

### 3. تحديث Widget لرفع الشعار

```dart
class LogoUploadWidget extends StatefulWidget {
  final Function(String) onLogoUploaded;
  
  const LogoUploadWidget({Key? key, required this.onLogoUploaded}) : super(key: key);
  
  @override
  _LogoUploadWidgetState createState() => _LogoUploadWidgetState();
}

class _LogoUploadWidgetState extends State<LogoUploadWidget> {
  bool _isUploading = false;
  String? _uploadedImageUrl;
  
  Future<void> _uploadLogo() async {
    setState(() {
      _isUploading = true;
    });
    
    try {
      final result = await UniversalFileUploadService.pickAndUploadFile();
      
      if (result != null && result['success'] == true) {
        setState(() {
          _uploadedImageUrl = result['url'];
        });
        widget.onLogoUploaded(result['url']);
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تم رفع الشعار بنجاح')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل في رفع الشعار: $e')),
      );
    } finally {
      setState(() {
        _isUploading = false;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_uploadedImageUrl != null)
          Container(
            width: 100,
            height: 100,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Image.network(
              _uploadedImageUrl!,
              fit: BoxFit.cover,
            ),
          ),
        SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _isUploading ? null : _uploadLogo,
          icon: _isUploading 
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(Icons.upload),
          label: Text(_isUploading ? 'جاري الرفع...' : 'رفع شعار جديد'),
        ),
      ],
    );
  }
}
```

## ملاحظات مهمة

1. **استخدم `file_picker` package** - هو الحل الأفضل لأنه يعمل على جميع المنصات
2. **تجنب استخدام `dart:io`** في الكود المشترك للويب والموبايل
3. **استخدم `http.MultipartFile.fromBytes()`** للويب و `http.MultipartFile.fromPath()` للموبايل
4. **تأكد من إعدادات CORS** في الخادم للسماح برفع الملفات من الويب

## تطبيق الحل

1. أضف `file_picker` إلى `pubspec.yaml`
2. استبدل الكود الحالي لرفع الملفات بالكود أعلاه
3. اختبر التطبيق في بيئة الويب والموبايل

هذا الحل سيعمل على جميع المنصات بدون أخطاء.