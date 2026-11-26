<?php
declare(strict_types=1);

// Small helpers for sending JSON back and reading what the front end sent.

final class Response
{
    public static function json(array $data, int $status = 200): never
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function error(string $message, int $status = 400, array $extra = []): never
    {
        self::json(['error' => $message] + $extra, $status);
    }
}

final class Request
{
    // the JSON body sent by fetch(), as an array
    public static function json(): array
    {
        $data = json_decode(file_get_contents('php://input') ?: '', true);
        return is_array($data) ? $data : [];
    }

    // the token from the "Authorization: Bearer ..." header
    public static function bearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/^Bearer\s+(\S+)$/i', $header, $match)) {
            return $match[1];
        }
        return null;
    }
}
