import 'package:flutter/foundation.dart';
import '../../core/api/api_client.dart';
import 'auth_repository.dart';
import 'user.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._repository);
  final AuthRepository _repository;
  SessionUser? user;
  bool busy = false;
  bool initialized = false;
  bool restoreFailed = false;
  String? error;
  Future<void> restore() async {
    restoreFailed = false;
    await _run(() async {
      user = await _repository.restore();
    }, restoring: true);
    initialized = true;
    notifyListeners();
  }

  Future<void> login(String email, String password) => _run(() async {
    user = await _repository.login(email, password);
  });
  Future<void> logout() => _run(() async {
    await _repository.logout();
    user = null;
  });
  Future<void> _run(
    Future<void> Function() action, {
    bool restoring = false,
  }) async {
    if (busy) return;
    busy = true;
    error = null;
    notifyListeners();
    try {
      await action();
    } catch (cause) {
      error = cause is ApiException
          ? cause.message
          : 'Unable to complete this action. Please retry.';
      restoreFailed = restoring;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _repository.dispose();
    super.dispose();
  }
}
