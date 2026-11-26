<?php
// POST /auth/reset-password   { reset_token, password }
// Saves the new password.

$data     = Request::json();
$claims   = Jwt::decode((string) ($data['reset_token'] ?? ''));
$password = (string) ($data['password'] ?? '');

if (!$claims || ($claims['purpose'] ?? '') !== 'reset') {
    Response::error('This reset link has expired. Please start again.', 400);
}
if (strlen($password) < 8) {
    Response::error('Your password must contain at least 8 characters.');
}

Database::pdo()->prepare('update profiles set password_hash = :h where id = :id')
    ->execute(['h' => password_hash($password, PASSWORD_DEFAULT), 'id' => $claims['sub']]);

Response::json(['message' => 'Your password has been changed. You can log in now.']);
