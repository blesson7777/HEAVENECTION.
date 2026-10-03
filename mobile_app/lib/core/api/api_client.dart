import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

class ApiException implements Exception {
  const ApiException(this.message, [this.status]);
  final String message;
  final int? status;
  @override
  String toString() => message;
}

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();
  final http.Client _client;
  Future<Map<String, dynamic>> request(
    String path, {
    String? token,
    Map<String, dynamic>? body,
    bool post = false,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$path');
      final headers = {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };
      final response =
          await (post
                  ? _client.post(
                      uri,
                      headers: headers,
                      body: body == null ? null : jsonEncode(body),
                    )
                  : _client.get(uri, headers: headers))
              .timeout(const Duration(seconds: 10));
      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw ApiException(switch (response.statusCode) {
          401 => 'Session expired or invalid sign-in details.',
          403 => 'You do not have permission for this action.',
          429 => 'Too many attempts. Please try again shortly.',
          _ => 'Service unavailable. Please try again.',
        }, response.statusCode);
      }
      return response.body.isEmpty
          ? {}
          : jsonDecode(response.body) as Map<String, dynamic>;
    } on TimeoutException {
      throw const ApiException('Request timed out. Please retry.');
    } on SocketException {
      throw const ApiException('Unable to connect to the service.');
    } on http.ClientException {
      throw const ApiException('Unable to connect to the service.');
    }
  }

  void close() => _client.close();
}
