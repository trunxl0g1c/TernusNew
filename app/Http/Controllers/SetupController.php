<?php
declare(strict_types=1);
namespace Ternus\Http\Controllers;
use Ternus\Infrastructure\StateRepository;
use Ternus\Http\Response;
use Ternus\Http\SessionGuard;
final class SetupController
{
    public function __construct(private StateRepository $repository) {}
    public function status(array $input): array
    {
        return [
            'installed' => $this->repository->installed(),
            'authenticated' => isset($_SESSION['uid']),
            'csrf' => SessionGuard::token(),
            'php' => PHP_VERSION,
        ];
    }
    public function install(array $input): array
    {
        if (!in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
            Response::json(
                ['error' => 'Instalasi hanya melalui localhost di komputer XAMPP.'],
                403,
            );
        }
        $name = clean($input['name'] ?? '', 100);
        $email = strtolower(clean($input['email'] ?? '', 150));
        $password = $input['password'] ?? '';
        need(filter_var($email, FILTER_VALIDATE_EMAIL) !== false, 'Email owner tidak valid.');
        need(strlen($password) >= 10, 'Password minimal 10 karakter.');
        $state = initialState($name, $email, $password);
        \Ternus\Support\Audit::event($state, $state['users'][0], 'setup', 'Database dan akun owner dibuat.');
        $this->repository->install($state);
        return ['ok' => true, 'message' => 'Database dan akun owner dibuat. Silakan login.'];
    }
}
