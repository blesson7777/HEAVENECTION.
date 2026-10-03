enum UserRole { admin, manager, staff }

class SessionUser {
  const SessionUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });
  final String id;
  final String name;
  final String email;
  final UserRole role;
  factory SessionUser.fromJson(Map<String, dynamic> json) => SessionUser(
    id: json['id'] as String,
    name: json['name'] as String,
    email: json['email'] as String,
    role: switch (json['role']) {
      'ADMIN' => UserRole.admin,
      'MANAGER' => UserRole.manager,
      'STAFF' => UserRole.staff,
      _ => throw const FormatException('Unsupported account role'),
    },
  );
}
