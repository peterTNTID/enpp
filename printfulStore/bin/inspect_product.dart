import 'dart:convert';
import 'dart:io';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

Future<void> main() async {
  // Load .env manually since we are in a script
  final envFile = File('.env');
  if (!envFile.existsSync()) {
    print('Error: .env file not found');
    return;
  }
  
  final lines = await envFile.readAsLines();
  String apiKey = '';
  for (var line in lines) {
    if (line.startsWith('PRINTFUL_API_KEY=')) {
      apiKey = line.split('=')[1];
    }
  }

  if (apiKey.isEmpty) {
    print('Error: API Key not found in .env');
    return;
  }

  // Fetch first product to get an ID
  print('Fetching products...');
  final productsResponse = await http.get(
    Uri.parse('https://api.printful.com/store/products'),
    headers: {'Authorization': 'Bearer $apiKey'},
  );

  if (productsResponse.statusCode != 200) {
    print('Error fetching products: ${productsResponse.statusCode}');
    return;
  }

  final productsData = json.decode(productsResponse.body);
  final List products = productsData['result'];
  
  if (products.isEmpty) {
    print('No products found.');
    return;
  }

  final firstProductId = products.first['id'];
  print('Inspecting Product ID: $firstProductId');

  // Fetch details
  final detailResponse = await http.get(
    Uri.parse('https://api.printful.com/store/products/$firstProductId'),
    headers: {'Authorization': 'Bearer $apiKey'},
  );

  if (detailResponse.statusCode != 200) {
    print('Error fetching details: ${detailResponse.statusCode}');
    return;
  }

  final detailData = json.decode(detailResponse.body);
  
  // Save to file for easy reading
  final file = File('product_debug.json');
  await file.writeAsString(const JsonEncoder.withIndent('  ').convert(detailData));
  print('Saved raw product data to product_debug.json');
}
