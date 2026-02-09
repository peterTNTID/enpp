import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/store_provider.dart';
import '../models/product.dart';
import '../theme.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StoreProvider>().loadProducts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('DANGAR ISLAND MERCH'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined),
            onPressed: () {
              // TODO: Implement cart
            },
          ),
        ],
      ),
      body: Consumer<StoreProvider>(
        builder: (context, store, child) {
          if (store.isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.accent));
          }

          if (store.error != null) {
            return Center(child: Text('Error: ${store.error}'));
          }

          if (store.products.isEmpty) {
            return const Center(child: Text('No products found.'));
          }

          return MasonryGridView.count(
            crossAxisCount: 3, // Smaller items
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            padding: const EdgeInsets.all(12),
            itemCount: store.products.length,
            itemBuilder: (context, index) {
              final product = store.products[index];
              return _ProductCard(product: product);
            },
          );
        },
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ProductDetailScreen(productId: product.id),
          ),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: AspectRatio(
              // Random aspect ratio to create staggered effect, or fixed if desired
              aspectRatio: 0.8, 
              child: CachedNetworkImage(
                imageUrl: product.thumbnailGraphUrl,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  color: Colors.grey[200],
                ),
                errorWidget: (context, url, error) => const Icon(Icons.error),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            product.name,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          // Price would ideally come from API list, but might need detail fetch.
          // For now, placeholder or 'View'
          Text(
            'View Options',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppTheme.secondaryAccent,
            ),
          ),
        ],
      ),
    );
  }
}
