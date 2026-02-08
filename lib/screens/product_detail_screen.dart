import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/store_provider.dart';
import '../models/product.dart';
import '../theme.dart';

class ProductDetailScreen extends StatefulWidget {
  final int productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Product? _product;
  bool _isLoading = true;
  String? _selectedSize;
  String? _selectedColor;

  @override
  void initState() {
    super.initState();
    _loadProductDetails();
  }

  Future<void> _loadProductDetails() async {
    final provider = context.read<StoreProvider>();
    final product = await provider.getProductDetails(widget.productId);
    if (mounted) {
      setState(() {
        _product = product;
        _isLoading = false;
        
        // Set default selection if variants exist
        if (product != null && product.variants.isNotEmpty) {
           _selectedSize = product.variants.first.size;
           _selectedColor = product.variants.first.color;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppTheme.accent)),
      );
    }

    if (_product == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('Product not found')),
      );
    }

    // Filter unique sizes and colors if variants exist
    final sizes = _product!.variants.isEmpty 
        ? <String>[] 
        : _product!.variants.map((v) => v.size).toSet().toList();
    
    final colors = _product!.variants.isEmpty 
        ? <String>[] 
        : _product!.variants.map((v) => v.color).toSet().toList();

    // Find current price based on selection
    Variant? currentVariant;
    if (_product!.variants.isNotEmpty) {
       currentVariant = _product!.variants.firstWhere(
        (v) => v.size == _selectedSize && v.color == _selectedColor,
        orElse: () => _product!.variants.first,
      );
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            // ... (keep existing AppBar config if needed, but simplified here for the replacement context)
            expandedHeight: 400,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: CachedNetworkImage(
                imageUrl: _product!.thumbnailGraphUrl,
                fit: BoxFit.cover,
                 placeholder: (context, url) => Container(color: Colors.grey[200]),
              ),
            ),
             leading: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.8),
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppTheme.primaryText),
                  onPressed: () => Navigator.pop(context),
                ),
              ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _product!.name,
                    style: Theme.of(context).textTheme.displayMedium,
                  ),
                  const SizedBox(height: 8),
                  if (currentVariant != null)
                    Text(
                      '${currentVariant.price} ${currentVariant.currency}',
                      style: Theme.of(context).textTheme.displayLarge?.copyWith(
                        color: AppTheme.accent,
                        fontSize: 24,
                      ),
                    ),
                  const SizedBox(height: 24),
                  
                  // Description
                  Text(
                    'Description',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _product!.description.isNotEmpty ? _product!.description : 'No description available.',
                     style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey[700],
                        height: 1.5,
                     ),
                  ),
                  const SizedBox(height: 24),

                   // Color Selection
                   if (colors.isNotEmpty && colors.first.isNotEmpty) ...[
                      Text('Color', style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        children: colors.map((color) {
                          final isSelected = _selectedColor == color;
                          return ChoiceChip(
                            label: Text(color),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() => _selectedColor = color);
                            },
                             selectedColor: AppTheme.accent.withValues(alpha: 0.2),
                             backgroundColor: Colors.transparent,
                             side: BorderSide(
                               color: isSelected ? AppTheme.accent : Colors.grey[300]!,
                             ),
                             labelStyle: TextStyle(
                               color: isSelected ? AppTheme.accent : Colors.black,
                               fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                             ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 16),
                   ],


                  // Size Selection
                  if (sizes.isNotEmpty && sizes.first.isNotEmpty) ...[
                    Text('Size', style: Theme.of(context).textTheme.titleSmall),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: sizes.map((size) {
                         final isSelected = _selectedSize == size;
                        return ChoiceChip(
                          label: Text(size),
                          selected: isSelected,
                          onSelected: (selected) {
                            setState(() => _selectedSize = size);
                          },
                           selectedColor: AppTheme.accent.withValues(alpha: 0.2),
                           backgroundColor: Colors.transparent,
                            side: BorderSide(
                               color: isSelected ? AppTheme.accent : Colors.grey[300]!,
                             ),
                             labelStyle: TextStyle(
                               color: isSelected ? AppTheme.accent : Colors.black,
                               fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                             ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 32),
                  ],


                  // Add to Cart Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton(
                      onPressed: currentVariant != null ? () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Added ${currentVariant!.name} to cart')),
                        );
                      } : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primaryText,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 0,
                        disabledBackgroundColor: Colors.grey,
                      ),
                      child: const Text(
                        'Add to Cart',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
