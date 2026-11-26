<?php
// POST /auth/forgot-password   { email }
// Emails a reset code if the account exists. The answer is always the same,
// so nobody can use this page to find out which emails are registered.

$email = strtolower(trim((string) (Request::json()['email'] ?? '')));

$stmt = Database::pdo()->prepare('select full_name from profiles where email = :e and email_verified = true');
$stmt->execute(['e' => $email]);
$profile = $stmt->fetch();

$response = ['message' => 'If this email is registered, a code is on its way.', 'expires_in' => (int) env('OTP_TTL_SECONDS', '60')];

if ($profile) {
    $devCode = Otp::issue($email, $profile['full_name'], 'reset');
    if ($devCode !== null) {
        $response['dev_otp'] = $devCode;
    }
}
Response::json($response);
