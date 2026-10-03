import 'package:flutter/material.dart';
import 'auth_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.auth});
  final AuthController auth;
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    if (!widget.auth.busy && _form.currentState!.validate()) {
      widget.auth.login(_email.text, _password.text);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Heavenection')),
    body: Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 420),
          child: Form(
            key: _form,
            child: AutofillGroup(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Sign in',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _email,
                    decoration: const InputDecoration(labelText: 'Email'),
                    keyboardType: TextInputType.emailAddress,
                    autofillHints: const [AutofillHints.username],
                    validator: (value) => value != null && value.contains('@')
                        ? null
                        : 'Enter your email',
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _password,
                    decoration: const InputDecoration(labelText: 'Password'),
                    obscureText: true,
                    autofillHints: const [AutofillHints.password],
                    onFieldSubmitted: (_) => _submit(),
                    validator: (value) => value != null && value.isNotEmpty
                        ? null
                        : 'Enter your password',
                  ),
                  const SizedBox(height: 24),
                  if (widget.auth.error != null)
                    Semantics(
                      liveRegion: true,
                      child: Text(
                        widget.auth.error!,
                        style: TextStyle(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  FilledButton(
                    onPressed: widget.auth.busy ? null : _submit,
                    child: Text(widget.auth.busy ? 'Signing in...' : 'Sign in'),
                  ),
                  const SizedBox(height: 16),
                  const Text('Contact your administrator to get an account.'),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
