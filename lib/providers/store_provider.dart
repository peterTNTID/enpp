
import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class StoreProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Product> _products = [];
  bool _isLoading = false;
  String? _error;

  List<Product> get products => _products;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadProducts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _products = await _apiService.fetchProducts();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Product?> getProductDetails(int id) async {
    // Check if we already have full details? Maybe simply re-fetch for fresh data or specific details not in list
    try {
      return await _apiService.fetchProductDetails(id);
    } catch (e) {
      print('Error fetching details in provider: $e');
      return null;
    }
  }
}
