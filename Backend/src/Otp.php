<?php
declare(strict_types=1);

// One-time codes for registration and password reset (6 digits, short life).

final class Otp
{
    private const MAX_ATTEMPTS = 5;

    private static function hash(string $code): string
    {
        return hash_hmac('sha256', $code, (string) env('JWT_SECRET'));
    }

    // Creates a new code and emails it.
    // Returns the code only in dev mode without email set up (so you can test).
    public static function issue(string $email, string $name, string $purpose): ?string
    {
        $db = Database::pdo();

        // stop people from spamming the resend button
        $wait = (int) env('OTP_RESEND_WAIT_SECONDS', '30');
        $recent = $db->prepare(
            "select 1 from otp_codes where email = :e and purpose = :p
             and created_at > now() - make_interval(secs => :wait)"
        );
        $recent->execute(['e' => $email, 'p' => $purpose, 'wait' => $wait]);
        if ($recent->fetch()) {
            Response::error('Please wait a moment before asking for another code.', 429);
        }

        // only one active code per email + purpose
        $db->prepare('delete from otp_codes where email = :e and purpose = :p')
           ->execute(['e' => $email, 'p' => $purpose]);

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $ttl  = (int) env('OTP_TTL_SECONDS', '60');

        $db->prepare(
            "insert into otp_codes (email, purpose, code_hash, expires_at)
             values (:e, :p, :h, now() + make_interval(secs => :ttl))"
        )->execute(['e' => $email, 'p' => $purpose, 'h' => self::hash($code), 'ttl' => $ttl]);

        $title = $purpose === 'register' ? 'Verify your Pawfect account' : 'Reset your Pawfect password';
        $html  = "<p>Hi " . htmlspecialchars($name) . ",</p>"
               . "<p>Your Pawfect code is <strong style=\"font-size:22px;letter-spacing:4px\">$code</strong></p>"
               . "<p>It is valid for " . max(1, intdiv($ttl, 60)) . " minute(s). If you didn't ask for it, ignore this email.</p>";

        $sent = Mailer::send($email, $name, $title, $html);

        if (!$sent) {
            if (env('APP_ENV', 'production') === 'production') {
                Response::error('We could not send the email. Please try again.', 502);
            }
            return $code;   // dev mode: hand the code back so you can keep testing
        }
        return null;
    }

    // Checks the code. Stops the request with an error if it is wrong or old.
    public static function verify(string $email, string $purpose, string $code): void
    {
        $db = Database::pdo();

        $stmt = $db->prepare(
            "select id, code_hash, attempts, (expires_at < now()) as expired
             from otp_codes where email = :e and purpose = :p and verified_at is null"
        );
        $stmt->execute(['e' => $email, 'p' => $purpose]);
        $row = $stmt->fetch();

        if (!$row) {
            Response::error('No code found. Please request a new one.', 400, ['code' => 'no_code']);
        }
        if ($row['expired']) {
            Response::error('This code has expired. Please request a new one.', 400, ['code' => 'expired']);
        }
        if ($row['attempts'] >= self::MAX_ATTEMPTS) {
            Response::error('Too many wrong tries. Please request a new code.', 429, ['code' => 'too_many']);
        }

        if (!hash_equals($row['code_hash'], self::hash($code))) {
            $db->prepare('update otp_codes set attempts = attempts + 1 where id = :id')->execute(['id' => $row['id']]);
            Response::error('That code is not correct.', 400, ['code' => 'wrong']);
        }

        // correct: this code can't be used again
        $db->prepare('delete from otp_codes where id = :id')->execute(['id' => $row['id']]);
    }
}
