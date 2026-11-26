<?php
// POST /auth/register   { name, email, password }
// Creates the account (not verified yet) and emails a 6-digit code.

$data     = Request::json();
$name     = trim((string) ($data['name'] ?? ''));
$email    = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');

if (textLength($name) < 2 || textLength($name) > 60) {
    Response::error('Please enter your full name.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error('Please enter a valid email address.');
}
if (strlen($password) < 8) {
    Response::error('Your password must contain at least 8 characters.');
}

$db   = Database::pdo();
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare('select id, email_verified from profiles where email = :email');
$stmt->execute(['email' => $email]);
$existing = $stmt->fetch();

if ($existing && $existing['email_verified']) {
    Response::error('An account with this email already exists. Please log in.', 409);
}

if ($existing) {
    // they started registering before but never verified: let them try again
    $db->prepare('update profiles set full_name = :n, password_hash = :h where id = :id')
       ->execute(['n' => $name, 'h' => $hash, 'id' => $existing['id']]);
} else {
    $db->prepare('insert into profiles (full_name, email, password_hash) values (:n, :e, :h)')
       ->execute(['n' => $name, 'e' => $email, 'h' => $hash]);
}

$devCode = Otp::issue($email, $name, 'register');

$response = [
    'message'    => 'We sent a 6-digit code to your email.',
    'email'      => $email,
    'expires_in' => (int) env('OTP_TTL_SECONDS', '60'),
];
if ($devCode !== null) {
    $response['dev_otp'] = $devCode;   // only ever present in dev mode
}
Response::json($response, 201);
