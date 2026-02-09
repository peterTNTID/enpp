
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

// Catalog IDs (approximations for common products)
// Bella + Canvas 3001
const int TSHIRT_ID = 71; 
const int VARIANT_BLACK_L = 4014;
const int VARIANT_WHITE_L = 4013;

// White Glossy Mug
const int MUG_ID = 19;
const int VARIANT_MUG_11OZ = 1320; 

// Enhanced Matte Paper Poster
const int POSTER_ID = 1;
const int VARIANT_POSTER_12X18 = 1; // Needs verification, usually specific ID

Future<void> main() async {
  // Load .env manually since we are in a script
  final envFile = File('.env');
  if (!await envFile.exists()) {
    print('Error: .env file not found');
    return;
  }
  
  final lines = await envFile.readAsLines();
  final env = <String, String>{};
  for (var line in lines) {
    final parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.sublist(1).join('=').trim();
    }
  }

  final apiKey = env['PRINTFUL_API_KEY'];
  if (apiKey == null || apiKey.isEmpty) {
    print('Error: PRINTFUL_API_KEY not found in .env');
    return;
  }

  final api = PrintfulApi(apiKey);

  print('Checking existing products...');
  final existingProducts = await api.getProducts();
  if (existingProducts.isNotEmpty) {
    print('Found ${existingProducts.length} existing products.');
    for (var p in existingProducts) {
      print(' - ID: ${p['id']}');
      print('   Name: ${p['name']}');
      print('   Thumbnail: ${p['thumbnail_url']}'); // Check if this is null
    }
    
    // Ask user if they want to clear? For now, just exit.
    // print('To clear and re-seed, uncomment the clearProducts line in source.');
    return;
  }

  print('Seeding store with Scandi products...');

  // 1. Scandi Mountains Tee
  await api.createProduct(
    name: 'Scandi Minimalist Tee - Mountains',
    thumbnail: 'https://placehold.co/1000x1000/2B2B2B/FFF/png?text=Mountains',
    variants: [
      ProductVariant(
        variantId: VARIANT_BLACK_L,
        retailPrice: '29.99',
        imageUrl: 'https://placehold.co/4000x4000/transparent/FFFFFF/png?text=Mountains',
      ),
    ],
  );

  // 2. Scandi Hygge Mug
  await api.createProduct(
    name: 'Scandi Living - Hygge Mug',
    thumbnail: 'https://placehold.co/1000x1000/FFF/000/png?text=Hygge',
    variants: [
      ProductVariant(
        variantId: VARIANT_MUG_11OZ,
        retailPrice: '18.50',
        imageUrl: 'https://placehold.co/3000x1000/transparent/000000/png?text=HYGGE',
      ),
    ],
  );

  // 3. Abstract Lines Tee
  await api.createProduct(
    name: 'Abstract Lines Tee',
    thumbnail: 'https://placehold.co/1000x1000/FFF/2B2B2B/png?text=Lines',
    variants: [
      ProductVariant(
        variantId: VARIANT_WHITE_L,
        retailPrice: '29.99',
        imageUrl: 'https://placehold.co/4000x4000/transparent/000000/png?text=|||||',
      ),
    ],
  );

  print('Seeding complete! Restart your app to see the products.');
}

class ProductVariant {
  final int variantId;
  final String retailPrice;
  final String imageUrl;

  ProductVariant({
    required this.variantId,
    required this.retailPrice,
    required this.imageUrl,
  });
}

class PrintfulApi {
  final String apiKey;
  final String baseUrl = 'https://api.printful.com';

  PrintfulApi(this.apiKey);

  Map<String, String> get headers => {
        'Authorization': 'Bearer $apiKey',
        'Content-Type': 'application/json',
      };

  Future<List<dynamic>> getProducts() async {
    final response = await http.get(Uri.parse('$baseUrl/store/products'), headers: headers);
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['result'];
    }
    print('Failed to get products: ${response.body}');
    return [];
  }

  Future<void> createProduct({
    required String name,
    required String thumbnail,
    required List<ProductVariant> variants,
  }) async {
    print('Creating product: $name...');
    
    // 1. Create Sync Product
    final productRes = await http.post(
      Uri.parse('$baseUrl/store/products'),
      headers: headers,
      body: json.encode({
        'sync_product': {
          'name': name,
          'thumbnail': thumbnail, // Usually ignored by API but good for ref
        }
      }),
    );

    if (productRes.statusCode != 200) {
      print('Failed to create product shell: ${productRes.body}');
      return;
    }

    final productData = json.decode(productRes.body)['result'];
    final productId = productData['id'];
    print('  Created product ID: $productId');

    // 2. Create Variants
    for (var variant in variants) {
      print('  Adding variant ${variant.variantId}...');
      final variantRes = await http.post(
        Uri.parse('$baseUrl/store/products/$productId/variants'),
        headers: headers,
        body: json.encode({
          'retail_price': variant.retailPrice,
          'variant_id': variant.variantId,
          'files': [
            {
              'url': variant.imageUrl,
              'type': 'default', // Front print
            }
          ]
        }),
      );

      if (variantRes.statusCode != 200) {
        print('  Failed to create variant: ${variantRes.body}');
        // Verify if it's a catalog ID issue
      } else {
        print('  Variant added.');
      }
    }
  }
}
