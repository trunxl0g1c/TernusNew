<?php
declare(strict_types=1);
namespace Ternus\Http\Controllers;
use Ternus\Infrastructure\StateRepository;
use Ternus\Http\Response;
use Ternus\Support\Audit;
final class AuthController
{
    public function __construct(private StateRepository $repository) {}
    public function login(array $input): array
    {
        // Return errors from the callback so failed-attempt counters are committed.
        $result = $this->repository->transaction(function (array &$state) use ($input): array {
            $email = strtolower(trim($input['email'] ?? ''));
            $key = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . '|' . $email);
            $attempt = $state['login_attempts'][$key] ?? ['count' => 0, 'time' => 0];
            if ($attempt['count'] >= 8 && time() - $attempt['time'] < 900) {
                return [
                    'status' => 429,
                    'error' => 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
                ];
            }
            $user = null;
            foreach ($state['users'] as $candidate) {
                if ($candidate['email'] === $email && $candidate['active']) {
                    $user = $candidate;
                }
            }
            if (!$user || !password_verify($input['password'] ?? '', $user['password'])) {
                $state['login_attempts'][$key] = [
                    'count' => time() - $attempt['time'] >= 900 ? 1 : $attempt['count'] + 1,
                    'time' => time(),
                ];
                return ['status' => 401, 'error' => 'Email atau password salah.'];
            }
            unset($state['login_attempts'][$key]);
            Audit::event($state, $user, 'auth.login', 'Berhasil masuk ke aplikasi.');
            return ['user' => $user];
        });
        if (isset($result['error'])) {
            Response::json(['error' => $result['error']], $result['status']);
        }
        session_regenerate_id(true);
        $_SESSION['uid'] = $result['user']['id'];
        $_SESSION['csrf'] = bin2hex(random_bytes(24));
        return ['ok' => true, 'csrf' => $_SESSION['csrf']];
    }
    public function logout(array $input): array
    {
        if (isset($_SESSION['uid'])) {
            $this->repository->transaction(function (array &$state): array {
                $user = findById($state['users'], $_SESSION['uid']);
                if ($user) Audit::event($state, $user, 'auth.logout', 'Keluar dari aplikasi.');
                return [];
            });
        }
        $_SESSION = [];
        session_destroy();
        return ['ok' => true];
    }
}
