<?php
declare(strict_types=1);

// Sends email through Brevo's web API (plain HTTPS).
// Render's free plan blocks normal SMTP ports, so we don't use SMTP.

final class Mailer
{
    public static function isConfigured(): bool
    {
        return env('BREVO_API_KEY') !== null;
    }

    public static function send(string $toEmail, string $toName, string $subject, string $html): bool
    {
        if (!self::isConfigured()) {
            return false;
        }

        $ch = curl_init('https://api.brevo.com/v3/smtp/email');
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_HTTPHEADER     => [
                'accept: application/json',
                'content-type: application/json',
                'api-key: ' . env('BREVO_API_KEY'),
            ],
            CURLOPT_POSTFIELDS     => json_encode([
                'sender'      => ['name' => env('MAIL_FROM_NAME', 'Pawfect'), 'email' => env('MAIL_FROM_EMAIL')],
                'to'          => [['email' => $toEmail, 'name' => $toName]],
                'subject'     => $subject,
                'htmlContent' => $html,
            ]),
        ]);

        curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status < 200 || $status >= 300) {
            error_log("Brevo email failed with HTTP $status");
            return false;
        }
        return true;
    }
}
