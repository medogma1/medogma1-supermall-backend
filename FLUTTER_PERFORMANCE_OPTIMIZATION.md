# Flutter Web Performance Optimization Guide

## Issue Analysis

### Current Problem
```
[Violation] 'requestAnimationFrame' handler took 70ms
[Violation] 'requestAnimationFrame' handler took 50ms
```

### Root Causes
These violations indicate that your Flutter web app's main thread is being blocked by heavy operations during frame rendering, causing poor user experience and janky animations.

## Common Performance Bottlenecks

### 1. Heavy Build Methods
**Problem**: Complex widget trees or expensive computations in `build()` methods

**Solutions**:
```dart
// ❌ BAD: Heavy computation in build method
class BadWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final expensiveData = _performHeavyCalculation(); // Runs every rebuild!
    return Text(expensiveData);
  }
}

// ✅ GOOD: Cache expensive computations
class GoodWidget extends StatefulWidget {
  @override
  _GoodWidgetState createState() => _GoodWidgetState();
}

class _GoodWidgetState extends State<GoodWidget> {
  String? _cachedData;
  
  @override
  void initState() {
    super.initState();
    _computeDataAsync();
  }
  
  Future<void> _computeDataAsync() async {
    final data = await compute(_performHeavyCalculation, null);
    if (mounted) {
      setState(() {
        _cachedData = data;
      });
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Text(_cachedData ?? 'Loading...');
  }
}
```

### 2. Large Lists Without Optimization
**Problem**: Rendering all list items at once

**Solutions**:
```dart
// ❌ BAD: Renders all items
Column(
  children: items.map((item) => ItemWidget(item)).toList(),
)

// ✅ GOOD: Use ListView.builder for large lists
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
)

// ✅ BETTER: Use ListView.separated for better performance
ListView.separated(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
  separatorBuilder: (context, index) => const Divider(),
)
```

### 3. Inefficient State Management
**Problem**: Unnecessary rebuilds of large widget trees

**Solutions**:
```dart
// ❌ BAD: Rebuilds entire tree
class BadCounter extends StatefulWidget {
  @override
  _BadCounterState createState() => _BadCounterState();
}

class _BadCounterState extends State<BadCounter> {
  int _counter = 0;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ExpensiveWidget(), // Rebuilds unnecessarily!
        Text('Count: $_counter'),
        ElevatedButton(
          onPressed: () => setState(() => _counter++),
          child: Text('Increment'),
        ),
      ],
    );
  }
}

// ✅ GOOD: Use const widgets and separate stateful parts
class GoodCounter extends StatefulWidget {
  @override
  _GoodCounterState createState() => _GoodCounterState();
}

class _GoodCounterState extends State<GoodCounter> {
  int _counter = 0;
  
  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const ExpensiveWidget(), // Won't rebuild!
        CounterDisplay(counter: _counter),
        ElevatedButton(
          onPressed: () => setState(() => _counter++),
          child: const Text('Increment'),
        ),
      ],
    );
  }
}

class CounterDisplay extends StatelessWidget {
  final int counter;
  const CounterDisplay({Key? key, required this.counter}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Text('Count: $counter');
  }
}
```

### 4. Image Loading Issues
**Problem**: Loading large images without optimization

**Solutions**:
```dart
// ❌ BAD: No caching or optimization
Image.network('https://example.com/large-image.jpg')

// ✅ GOOD: Use cached network images with loading states
CachedNetworkImage(
  imageUrl: 'https://example.com/large-image.jpg',
  placeholder: (context, url) => const CircularProgressIndicator(),
  errorWidget: (context, url, error) => const Icon(Icons.error),
  fadeInDuration: const Duration(milliseconds: 200),
  memCacheWidth: 300, // Resize for memory efficiency
  memCacheHeight: 300,
)
```

### 5. Synchronous File Operations
**Problem**: Blocking the main thread with file I/O

**Solutions**:
```dart
// ❌ BAD: Synchronous file reading
String loadData() {
  final file = File('data.txt');
  return file.readAsStringSync(); // Blocks main thread!
}

// ✅ GOOD: Asynchronous operations with FutureBuilder
FutureBuilder<String>(
  future: _loadDataAsync(),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      return Text(snapshot.data!);
    } else if (snapshot.hasError) {
      return Text('Error: ${snapshot.error}');
    }
    return const CircularProgressIndicator();
  },
)

Future<String> _loadDataAsync() async {
  final file = File('data.txt');
  return await file.readAsString();
}
```

## Specific Optimizations for Your App

### 1. Optimize Product Lists
```dart
// For your product grid/list views
class OptimizedProductGrid extends StatelessWidget {
  final List<Product> products;
  
  const OptimizedProductGrid({Key? key, required this.products}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.8,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
      ),
      itemCount: products.length,
      itemBuilder: (context, index) {
        return ProductCard(product: products[index]);
      },
    );
  }
}

class ProductCard extends StatelessWidget {
  final Product product;
  
  const ProductCard({Key? key, required this.product}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          Expanded(
            child: CachedNetworkImage(
              imageUrl: product.imageUrl,
              fit: BoxFit.cover,
              memCacheWidth: 200,
              memCacheHeight: 200,
              placeholder: (context, url) => Container(
                color: Colors.grey[200],
                child: const Center(
                  child: CircularProgressIndicator(),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Column(
              children: [
                Text(
                  product.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.subtitle1,
                ),
                const SizedBox(height: 4),
                Text(
                  '\$${product.price}',
                  style: Theme.of(context).textTheme.headline6?.copyWith(
                    color: Colors.green,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

### 2. Optimize API Calls
```dart
// Use proper state management to avoid unnecessary API calls
class ProductProvider extends ChangeNotifier {
  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;
  
  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  Future<void> loadProducts({bool forceRefresh = false}) async {
    if (_products.isNotEmpty && !forceRefresh) {
      return; // Don't reload if already have data
    }
    
    _isLoading = true;
    _error = null;
    notifyListeners();
    
    try {
      _products = await ApiService.getProducts();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### 3. Optimize Animations
```dart
// Use efficient animations
class OptimizedAnimation extends StatefulWidget {
  @override
  _OptimizedAnimationState createState() => _OptimizedAnimationState();
}

class _OptimizedAnimationState extends State<OptimizedAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _animation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.scale(
          scale: _animation.value,
          child: child,
        );
      },
      child: const Card( // This child won't rebuild
        child: Text('Animated Content'),
      ),
    );
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
```

## Performance Monitoring

### 1. Add Performance Tracking
```dart
// Add this to your main.dart
void main() {
  if (kDebugMode) {
    // Enable performance overlay in debug mode
    WidgetsApp.debugAllowBannerOverride = false;
  }
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // Show performance overlay in debug mode
      showPerformanceOverlay: kDebugMode,
      home: HomePage(),
    );
  }
}
```

### 2. Use Flutter Inspector
```bash
# Run with performance profiling
flutter run --profile

# Open DevTools for performance analysis
flutter pub global activate devtools
flutter pub global run devtools
```

## Web-Specific Optimizations

### 1. Optimize for Web Rendering
```dart
// Use web-optimized widgets
class WebOptimizedApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      // Use HTML renderer for better text performance
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: SingleChildScrollView(
          // Use physics for better scrolling on web
          physics: const BouncingScrollPhysics(),
          child: YourContent(),
        ),
      ),
    );
  }
}
```

### 2. Lazy Loading
```dart
// Implement lazy loading for better initial load time
class LazyLoadedContent extends StatefulWidget {
  @override
  _LazyLoadedContentState createState() => _LazyLoadedContentState();
}

class _LazyLoadedContentState extends State<LazyLoadedContent> {
  bool _isVisible = false;
  
  @override
  void initState() {
    super.initState();
    // Delay heavy content loading
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) {
        setState(() {
          _isVisible = true;
        });
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    if (!_isVisible) {
      return const SizedBox.shrink();
    }
    
    return HeavyWidget();
  }
}
```

## Immediate Action Items

### 1. Profile Your App
1. Run `flutter run --profile`
2. Open Flutter DevTools
3. Use the Performance tab to identify bottlenecks
4. Look for widgets that take >16ms to build

### 2. Quick Fixes
1. Add `const` constructors to all possible widgets
2. Use `ListView.builder` instead of `Column` with many children
3. Implement proper image caching
4. Move heavy computations to `compute()` isolates

### 3. Dependencies to Add
```yaml
# Add to pubspec.yaml
dependencies:
  cached_network_image: ^3.3.0
  provider: ^6.1.1
  flutter_staggered_grid_view: ^0.7.0 # For optimized grids
```

## Monitoring and Testing

### Performance Metrics to Track
- Frame rendering time (should be <16ms)
- Memory usage
- Network request frequency
- Image loading time

### Testing Commands
```bash
# Test performance
flutter test --coverage
flutter analyze
flutter run --profile

# Web-specific testing
flutter build web --profile
flutter run -d chrome --web-renderer html
```

## Next Steps

1. **Immediate**: Profile your app to identify the specific bottlenecks
2. **Short-term**: Implement the optimizations relevant to your app
3. **Long-term**: Set up continuous performance monitoring

This guide should help you resolve the requestAnimationFrame violations and improve your Flutter web app's performance significantly.