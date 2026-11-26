<?php
// POST /auth/verify-reset-otp   { email, code }
// If the code is right, returns a short-lived reset_token for the "new password" page.

$data  = Request::json();
$email = strtolower(trim((string) ($data['email'] ?? '')));
$code  = trim((string) ($data['code'] ?? ''));

if (!preg_match('/^\d{6}$/', $code)) {
    Response::error('Please enter the 6-digit code.');
}

Otp::verify($email, 'reset', $code);

$stmt = Database::pdo()->prepare('select id from profiles where email = :e');
$stmt->execute(['e' => $email]);
$profile = $stmt->fetch();

Response::json([
    'reset_token' => Jwt::encode(['purpose' => 'reset', 'sub' => $profile['id']], 600),   // valid 10 minutes
]);
