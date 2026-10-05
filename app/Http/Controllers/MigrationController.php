<?php
declare(strict_types=1);
namespace Ternus\Http\Controllers;
use Ternus\Infrastructure\StateRepository;
use Ternus\Http\SessionGuard;
final class MigrationController
{
    public function __construct(private StateRepository $repository) {}
    public function migrate(array $input): array
    {
        need(($input['confirm'] ?? false) === true, 'Simpan backup terlebih dahulu dan konfirmasi migrasi.');
        try { return $this->repository->migrate(function (array $state): array {
            $user = SessionGuard::user($state);
            permit($user, ['owner']);
            return $user;
        }); } catch (\PDOException $error) {
            error_log('TERNUS migration: ' . $error->getMessage());
            throw new \DomainException('Migrasi belum berhasil; format lama tetap digunakan. Ada kendala tabel, izin database, atau relasi data. Periksa log PHP XAMPP sebelum mencoba kembali.');
        } catch (\RuntimeException $error) {
            throw new \DomainException($error->getMessage());
        }
    }
}
