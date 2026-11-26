<?php
declare(strict_types=1);

// One shared connection to the Supabase PostgreSQL database.

final class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo === null) {
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
                env('DB_HOST'),
                env('DB_PORT', '5432'),
                env('DB_NAME', 'postgres'),
                env('DB_SSLMODE', 'require')
            );

            self::$pdo = new PDO($dsn, env('DB_USER'), env('DB_PASSWORD'), [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,  // errors become exceptions
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,        // rows come back as arrays
            ]);
        }
        return self::$pdo;
    }
}
