<?php
declare(strict_types=1);
namespace Ternus\Http\Controllers;
use Ternus\Infrastructure\StateRepository;
use Ternus\Http\SessionGuard;
final class StateController
{
    public function __construct(private StateRepository $repository) {}
    public function show(array $input): array
    {
        $state = $this->repository->read();
        $user = SessionGuard::user($state);
        return [
            'state' => viewState($state, $user),
            'storage' => $user['role'] === 'owner' ? $this->repository->storageStatus() : null,
            'user' => array_diff_key($user, ['password' => true]),
            'csrf' => SessionGuard::token(),
        ];
    }
    public function backup(array $input): array
    {
        return $this->repository->transaction(function (array &$state): array {
            $user = SessionGuard::user($state);
            permit($user, ['owner']);
            \Ternus\Support\Audit::event($state, $user, 'backup.export', 'Menyiapkan ekspor backup database.');
            $export = $state;
            unset($export['login_attempts']);
            return ['exported_at' => date(DATE_ATOM), 'format' => 'ternus-backup-1', 'state' => $export];
        });
    }
}
