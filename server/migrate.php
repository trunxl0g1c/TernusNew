<?php
declare(strict_types=1);
// Local maintenance only. Never callable through the browser.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(); }
require_once dirname(__DIR__) . '/app/bootstrap.php';
if (count($argv) !== 2 || !in_array($argv[1], ['--check', '--apply'], true)) {
    fwrite(STDERR, "Pemakaian: php server/migrate.php --check | --apply\nSimpan backup database dan hentikan input semua pengguna sebelum --apply.\n"); exit(1);
}
try {
    $repository = new \Ternus\Infrastructure\StateRepository();
    if ($argv[1] === '--check') {
        echo json_encode($repository->storageStatus(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n";
    } else {
        // CLI access already grants the operator access to database credentials.
        $result = $repository->migrate(fn(array $state): array => [
            'id' => 'system-migration', 'name' => 'Migrasi lokal (CLI)', 'role' => 'system',
        ]);
        echo $result['message'] . "\n";
    }
} catch (Throwable $error) { fwrite(STDERR, $error->getMessage() . "\n"); exit(1); }
