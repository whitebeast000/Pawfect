<?php
declare(strict_types=1);

// Login helpers used by every protected route.

final class Auth
{
    public static function makeToken(array $profile): string
    {
        $hours = (int) env('JWT_TTL_HOURS', '24');
        return Jwt::encode(['sub' => $profile['id'], 'role' => $profile['role']], $hours * 3600);
    }

    // what we are allowed to send to the browser (never the password hash)
    public static function publicUser(array $profile): array
    {
        return [
            'id'         => $profile['id'],
            'name'       => $profile['full_name'],
            'email'      => $profile['email'],
            'phone'      => $profile['phone'],
            'city'       => $profile['city'],
            'avatar_url' => $profile['avatar_url'],
            'role'       => $profile['role'],
        ];
    }

    // call this at the top of any route that needs a logged-in user
    public static function require(): array
    {
        $token  = Request::bearerToken();
        $claims = $token ? Jwt::decode($token) : null;

        if (!$claims || isset($claims['purpose'])) {   // reset tokens can't be used to log in
            Response::error('Please log in first.', 401);
        }

        $stmt = Database::pdo()->prepare('select * from profiles where id = :id');
        $stmt->execute(['id' => $claims['sub']]);
        $profile = $stmt->fetch();

        if (!$profile || $profile['status'] !== 'active') {
            Response::error('Please log in first.', 401);
        }
        return $profile;
    }

    // same, but only for admins
    public static function requireAdmin(): array
    {
        $profile = self::require();
        if ($profile['role'] !== 'admin') {
            Response::error('Admins only.', 403);
        }
        return $profile;
    }
}
