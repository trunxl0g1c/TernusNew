<?php
// Pemulihan hanya CLI. Backup memakai format v1 yang tetap kompatibel.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit();
}
if (count($argv) !== 3 || $argv[2] !== '--replace') {
    fwrite(
        STDERR,
        "Pemakaian: php server/restore.php C:\\backup\\ternus-backup.json --replace\nIni mengganti seluruh data. Backup database lama terlebih dahulu.\n",
    );
    exit(1);
}
require_once dirname(__DIR__) . '/app/bootstrap.php';

try {
    $input = json_decode(file_get_contents($argv[1]), true, 512, JSON_THROW_ON_ERROR);
    if (
        ($input['format'] ?? '') !== 'ternus-backup-1' ||
        !isset($input['state']['users'], $input['state']['ledger'], $input['state']['settings'])
    ) {
        throw new RuntimeException('Format backup tidak valid.');
    }
    $restored = $input['state'];
    $restored['login_attempts'] = [];
    $restored['requests'] ??= [];
    $owners = array_filter(
        $restored['users'],
        fn($user) => $user['active'] && $user['role'] === 'owner',
    );
    if (!$owners) {
        throw new RuntimeException('Backup tidak mempunyai owner aktif.');
    }
    $repository = new \Ternus\Infrastructure\StateRepository();
    $repository->restore($restored);
    echo "Backup dipulihkan. Login memakai akun dari backup.\n";
} catch (Throwable $error) {
    fwrite(STDERR, $error->getMessage() . "\n");
    exit(1);
}
