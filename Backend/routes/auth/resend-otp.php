<?php
// POST /auth/resend-otp   { email }
// Sends a fresh registration code.

$email = strtolower(trim((string) (Request::json()['email'] ?? '')));

$stmt = Database::pdo()->prepare('select full_name, email_verified from profiles where email = :e');
$stmt->execute(['e' => $email]);
$profile = $stmt->fetch();

if (!$profile || $profile['email_verified']) {
    Response::error('Please register first.', 400);
}

$devCode  = Otp::issue($email, $profile['full_name'], 'register');
$response = ['message' => 'We sent you a new code.', 'expires_in' => (int) env('OTP_TTL_SECONDS', '60')];
if ($devCode !== null) {
    $response['dev_otp'] = $devCode;
}
Response::json($response);
