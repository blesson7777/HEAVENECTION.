import 'package:flutter/foundation.dart';

class ApiConfig {
  static Uri get baseUrl {
    const configured = String.fromEnvironment('API_BASE_URL');
    final fallback = defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:4000/api/v1'
        : 'http://localhost:4000/api/v1';
    if (kReleaseMode && configured.isEmpty) {
      throw StateError('API_BASE_URL is required for release builds');
    }
    final uri = Uri.parse(configured.isEmpty ? fallback : configured);
    if (!uri.hasAuthority || (kReleaseMode && uri.scheme != 'https')) {
      throw StateError('A valid HTTPS API_BASE_URL is required');
    }
    return uri;
  }
}
