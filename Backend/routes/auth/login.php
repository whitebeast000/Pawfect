<?php
// POST /auth/login   { email, password }
// Returns a token the front end keeps and sends with every later request.

$data     = Request::json();
$email    = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');

$stmt = Database::pdo()->prepare('select * from profiles where email = :e');
$stmt->execute(['e' => $email]);
$profile = $stmt->fetch();

// same message for "no such email" and "wrong password" so nobody can guess emails
if (!$profile || !password_verify($password, $profile['password_hash'])) {
    Response::error('Invalid email or password.', 401);
}
if (!$profile['email_verified']) {
    Response::error('Please verify your email first.', 403, ['code' => 'unverified']);
}
if ($profile['status'] !== 'active') {
    Response::error('This account has been blocked. Please contact support.', 403);
}

Response::json([
    'token' => Auth::makeToken($profile),
    'user'  => Auth::publicUser($profile),
]);
