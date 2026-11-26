<?php
// public/index.php - every request to the API starts here.
// It finds the right file in /routes and runs it.

require __DIR__ . '/../src/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$path   = '/' . trim((string) parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

// Browsers send an OPTIONS "preflight" request before POST/PUT; just say OK.
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// "METHOD /url" => file inside /routes
$routes = [
    'GET /health'                     => 'health.php',

    'POST /auth/register'             => 'auth/register.php',
    'POST /auth/verify-otp'           => 'auth/verify-otp.php',
    'POST /auth/resend-otp'           => 'auth/resend-otp.php',
    'POST /auth/login'                => 'auth/login.php',
    'GET /auth/me'                    => 'auth/me.php',

    'POST /auth/forgot-password'      => 'auth/forgot-password.php',
    'POST /auth/verify-reset-otp'     => 'auth/verify-reset-otp.php',
    'POST /auth/reset-password'       => 'auth/reset-password.php',

    // next steps: pets, appointments, health, care, reminders, diary, articles, admin
];

$key = "$method $path";

if (!isset($routes[$key])) {
    Response::error('Route not found', 404);
}

require __DIR__ . '/../routes/' . $routes[$key];
