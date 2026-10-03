import 'package:flutter/material.dart';
import '../auth/auth_controller.dart';
import '../auth/user.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, required this.auth});
  final AuthController auth;
  @override
  Widget build(BuildContext context) {
    final user = auth.user!;
    final title = switch (user.role) {
      UserRole.admin => 'Admin workspace',
      UserRole.manager => 'Manager workspace',
      UserRole.staff => 'Staff workspace',
    };
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: auth.busy ? null : auth.logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome, ${user.name}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            const Text(
              'Your workspace is ready. Mobile features and screens will be added after design review.',
            ),
            if (auth.error != null)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: Text(
                  auth.error!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
