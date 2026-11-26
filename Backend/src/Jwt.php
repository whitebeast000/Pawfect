<?php
declare(strict_types=1);

// Minimal JWT (HS256) so we don't need any extra library.
// A token proves "this request comes from user X" without a session on the server.

final class Jwt
{
    private static function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function sign(string $input): string
    {
        return self::b64(hash_hmac('sha256', $input, (string) env('JWT_SECRET'), true));
    }

    public static function encode(array $claims, int $ttlSeconds): string
    {
        $claims['iat'] = time();
        $claims['exp'] = time() + $ttlSeconds;

        $header  = self::b64(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::b64(json_encode($claims));

        return "$header.$payload." . self::sign("$header.$payload");
    }

    // returns the claims, or null if the token is fake / changed / expired
    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$header, $payload, $signature] = $parts;
        if (!hash_equals(self::sign("$header.$payload"), $signature)) {
            return null;
        }

        $claims = json_decode(base64_decode(strtr($payload, '-_', '+/')), true);
        if (!is_array($claims) || ($claims['exp'] ?? 0) < time()) {
            return null;
        }
        return $claims;
    }
}
