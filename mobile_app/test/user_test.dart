import 'package:flutter_test/flutter_test.dart';
import 'package:heavenection_mobile/modules/auth/user.dart';

void main() {
  test('recognized server roles map to the matching mobile workspace', () {
    for (final role in UserRole.values) {
      final user = SessionUser.fromJson({
        'id': 'test',
        'name': 'Test',
        'email': 'test@example.com',
        'role': role.name.toUpperCase(),
      });
      expect(user.role, role);
    }
  });
  test('unknown server role is rejected rather than granting access', () {
    expect(
      () => SessionUser.fromJson({
        'id': 'test',
        'name': 'Test',
        'email': 'test@example.com',
        'role': 'UNKNOWN',
      }),
      throwsFormatException,
    );
  });
}
