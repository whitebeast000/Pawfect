<?php
declare(strict_types=1);

// src/bootstrap.php - runs before every request:
// loads settings, sets up CORS, and loads the helper classes.

date_default_timezone_set('UTC');

// ---------- 1. Settings from the .env file (local development) ----------
// On Render there is no .env file: you type the same settings in its dashboard.
$envFile = __DIR__ . '/../.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
            continue;
        }
        [$name, $value] = explode('=', $line, 2);
        putenv(trim($name) . '=' . trim($value, " \t\"'"));
    }
}

function env(string $name, ?string $default = null): ?string
{
    $value = getenv($name);
    return ($value === false || $value === '') ? $default : $value;
}

// length of a text in characters (works for names in any language)
function textLength(string $text): int
{
    return function_exists('mb_strlen') ? mb_strlen($text) : strlen($text);
}

// ---------- 2. Helper classes ----------
require __DIR__ . '/Response.php';
require __DIR__ . '/Database.php';
require __DIR__ . '/Jwt.php';
require __DIR__ . '/Auth.php';
require __DIR__ . '/Mailer.php';
require __DIR__ . '/Otp.php';

// ---------- 3. CORS: which websites may call this API ----------
$allowedOrigins = array_map('trim', explode(',', env('ALLOWED_ORIGINS', '')));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}

header('Content-Type: application/json; charset=utf-8');

// ---------- 4. Never show raw errors to visitors ----------
set_exception_handler(function (Throwable $e) {
    error_log($e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $extra = env('APP_ENV', 'production') === 'production' ? [] : ['detail' => $e->getMessage()];
    Response::error('Something went wrong on the server.', 500, $extra);
});
