import 'package:flutter/material.dart';
import 'modules/auth/auth_controller.dart';
import 'modules/auth/auth_repository.dart';
import 'modules/auth/login_screen.dart';
import 'modules/dashboard/dashboard_screen.dart';

class HeavenectionApp extends StatefulWidget {
  const HeavenectionApp({super.key});
  @override
  State<HeavenectionApp> createState() => _HeavenectionAppState();
}

class _HeavenectionAppState extends State<HeavenectionApp> {
  late final AuthController _auth;
  @override
  void initState() {
    super.initState();
    _auth = AuthController(AuthRepository());
    _auth.restore();
  }

  @override
  void dispose() {
    _auth.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Heavenection',
    debugShowCheckedModeBanner: false,
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3C50E0)),
      useMaterial3: true,
    ),
    home: AnimatedBuilder(
      animation: _auth,
      builder: (context, _) {
        if (!_auth.initialized) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (_auth.restoreFailed) {
          return Scaffold(
            body: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_auth.error ?? 'Unable to restore session'),
                  FilledButton(
                    onPressed: _auth.busy ? null : _auth.restore,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }
        return _auth.user == null
            ? LoginScreen(auth: _auth)
            : DashboardScreen(auth: _auth);
      },
    ),
  );
}
