<?php
// POST /auth/verify-otp   { email, code }
// Confirms the registration code, marks the email as verified.

$data  = Request::json();
$email = strtolower(trim((string) ($data['email'] ?? '')));
$code  = trim((string) ($data['code'] ?? ''));

if (!preg_match('/^\d{6}$/', $code)) {
    Response::error('Please enter the 6-digit code.');
}

Otp::verify($email, 'register', $code);

$db = Database::pdo();
$db->prepare('update profiles set email_verified = true where email = :e')->execute(['e' => $email]);

$stmt = $db->prepare('select * from profiles where email = :e');
$stmt->execute(['e' => $email]);
$profile = $stmt->fetch();

Response::json([
    'message' => 'Your account is verified.',
    'token'   => Auth::makeToken($profile),
    'user'    => Auth::publicUser($profile),
]);
