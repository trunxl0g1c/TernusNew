<?php
declare(strict_types=1);
namespace Ternus\Http;
final class SessionGuard
{
    public static function start(): void
    {
        ini_set('session.use_strict_mode', '1');
        session_set_cookie_params([
            'httponly' => true,
            'samesite' => 'Strict',
            'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        ]);
        session_start();
    }
    public static function token(): string
    {
        return $_SESSION['csrf'] ??= bin2hex(random_bytes(24));
    }
    public static function csrf(): void
    {
        if (
            empty($_SESSION['csrf']) ||
            !hash_equals($_SESSION['csrf'], $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '')
        ) {
            Response::json(['error' => 'Sesi formulir berakhir. Muat ulang halaman.'], 403);
        }
    }
    public static function user(array $state): array
    {
        if (!isset($_SESSION['uid'])) {
            Response::json(['error' => 'Silakan login.'], 401);
        }
        $user = findById($state['users'], $_SESSION['uid']);
        need($user && $user['active'], 'Akun tidak aktif.');
        return $user;
    }
}
