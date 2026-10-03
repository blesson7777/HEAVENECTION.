import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/api/api_client.dart';
import 'user.dart';

class AuthRepository {
  AuthRepository({ApiClient? api, FlutterSecureStorage? storage})
    : _api = api ?? ApiClient(),
      _storage = storage ?? const FlutterSecureStorage();
  final ApiClient _api;
  final FlutterSecureStorage _storage;
  static const _tokenKey = 'heavenection_session';
  Future<SessionUser?> restore() async {
    final token = await _storage.read(key: _tokenKey);
    if (token == null) return null;
    try {
      return SessionUser.fromJson(await _api.request('/auth/me', token: token));
    } on ApiException catch (error) {
      if (error.status == 401) {
        await _storage.delete(key: _tokenKey);
        return null;
      }
      rethrow;
    }
  }

  Future<SessionUser> login(String email, String password) async {
    final result = await _api.request(
      '/auth/login',
      post: true,
      body: {'email': email.trim(), 'password': password},
    );
    final user = SessionUser.fromJson(result['user'] as Map<String, dynamic>);
    await _storage.write(
      key: _tokenKey,
      value: result['accessToken'] as String,
    );
    return user;
  }

  Future<void> logout() async {
    final token = await _storage.read(key: _tokenKey);
    if (token != null) {
      try {
        await _api.request('/auth/logout', token: token, post: true);
      } on ApiException catch (error) {
        if (error.status != 401) {
          rethrow;
        }
      }
    }
    await _storage.delete(key: _tokenKey);
  }

  void dispose() => _api.close();
}
