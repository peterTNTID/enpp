
class Product {
  final int id;
  final String name;
  final String description;
  final String thumbnailGraphUrl;
  final List<ProductImage> images;
  final List<Variant> variants;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.thumbnailGraphUrl,
    this.images = const [],
    this.variants = const [],
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Unknown Product',
      description: json['description'] ?? '', // API might require extra call for description
      thumbnailGraphUrl: json['thumbnail_url'] ?? '',
      // Files/Images usually come from a separate endpoint or detailed view in Printful
    );
  }
}

class Variant {
  final int id;
  final int productId;
  final String name;
  final String size;
  final String color;
  final String price;
  final String currency;
  final bool inStock;

  Variant({
    required this.id,
    required this.productId,
    required this.name,
    required this.size,
    required this.color,
    required this.price,
    required this.currency,
    required this.inStock,
  });

  factory Variant.fromJson(Map<String, dynamic> json) {
    return Variant(
      id: json['id'] ?? 0,
      productId: json['product_id'] ?? 0,
      name: json['name'] ?? '',
      size: json['size'] ?? '',
      color: json['color'] ?? '',
      price: json['retail_price'] ?? '0.00',
      currency: json['currency'] ?? 'USD',
      inStock: json['in_stock'] ?? true,
    );
  }
}

class ProductImage {
  final String url;
  final bool isDefault;

  ProductImage({required this.url, required this.isDefault});

  factory ProductImage.fromJson(Map<String, dynamic> json) {
    return ProductImage(
      url: json['url'] ?? '',
      isDefault: json['is_default'] ?? false,
    );
  }
}
