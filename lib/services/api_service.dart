import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../models/product.dart';

class ApiService {
  final String _baseUrl = 'https://api.printful.com';
  
  // Get API key from dotenv
  String get _apiKey => dotenv.env['PRINTFUL_API_KEY'] ?? '';

  Future<List<Product>> fetchProducts() async {
    if (_apiKey.isEmpty) {
      print('Warning: No API Key found. Using mock data.');
      return _getMockProducts();
    }

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/store/products'),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        final List<dynamic> result = data['result'];
        return result.map((json) => Product.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load products: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching products: $e');
      // Fallback to mock data on error for development if needed
      return _getMockProducts(); 
    }
  }

  Future<Product> fetchProductDetails(int id) async {
      if (_apiKey.isEmpty) {
        return _getMockProductDetails(id);
      }

      try {
        final response = await http.get(
          Uri.parse('$_baseUrl/store/products/$id'),
          headers: {
            'Authorization': 'Bearer $_apiKey',
             'Content-Type': 'application/json',
          },
        );

        if (response.statusCode == 200) {
          final Map<String, dynamic> data = json.decode(response.body);
          final Map<String, dynamic> result = data['result'];
          
          // Map sync product data
          final productSync = result['sync_product'];
          final List<dynamic> syncVariants = result['sync_variants'];
          
          List<Variant> variants = syncVariants.map((v) => Variant.fromJson(v)).toList();

          return Product(
            id: productSync['id'],
            name: productSync['name'],
            description: '', // Printful sync product endpoint doesn't always return description, might need catalog API
            thumbnailGraphUrl: productSync['thumbnail_url'],
            variants: variants,
          );

        } else {
           throw Exception('Failed to load product details: ${response.statusCode}');
        }
      } catch (e) {
        print('Error fetching product details: $e');
        return _getMockProductDetails(id);
      }
  }

  // Mock Data Generators
  List<Product> _getMockProducts() {
    return [
      Product(
        id: 1,
        name: 'Essential Cotton T-Shirt',
        description: 'A classic staple for every wardrobe. Made with organic cotton.',
        thumbnailGraphUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ),
      Product(
        id: 2,
        name: 'Minimalist Canvas Totebag',
        description: 'Durable, eco-friendly, and stylishly simple.',
        thumbnailGraphUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ),
       Product(
        id: 3,
        name: 'Ceramic Coffee Mug',
        description: 'Handcrafted feel for your daily brew.',
        thumbnailGraphUrl: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ),
      Product(
        id: 4,
        name: 'Nordic Wool Throw',
        description: 'Warm, cozy, and perfectly textured.',
        thumbnailGraphUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ),
       Product(
        id: 5,
        name: 'Abstract Art Print',
        description: 'Modern art to elevate your living space.',
        thumbnailGraphUrl: 'https://images.unsplash.com/photo-1582201943021-e8e6443112bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      ),
    ];
  }

  Product _getMockProductDetails(int id) {
     return Product(
        id: id,
        name: 'Mock Product $id',
        description: 'This is a detailed description of the mock product. It features high quality materials and sustainable production methods.',
        thumbnailGraphUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        variants: [
            Variant(id: 101, productId: id, name: 'S / White', size: 'S', color: 'White', price: '25.00', currency: 'USD', inStock: true),
            Variant(id: 102, productId: id, name: 'M / White', size: 'M', color: 'White', price: '25.00', currency: 'USD', inStock: true),
            Variant(id: 103, productId: id, name: 'L / White', size: 'L', color: 'White', price: '25.00', currency: 'USD', inStock: true),
        ]
      );
  }
}
