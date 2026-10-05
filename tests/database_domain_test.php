<?php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(); }
require dirname(__DIR__) . '/app/bootstrap.php';
if (!function_exists('databaseTestConnection')) {
    function databaseTestConnection(): PDO {
        $dsn = getenv('TERNUS_TEST_DSN');
        if (!$dsn || !str_starts_with($dsn, 'mysql:')) throw new RuntimeException('Set TERNUS_TEST_DSN for an isolated test server.');
        return new PDO($dsn, getenv('TERNUS_TEST_USER') ?: 'root', getenv('TERNUS_TEST_PASSWORD') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
    }
}
$db = databaseTestConnection();
$name = 'ternus_relational_test_' . bin2hex(random_bytes(5));
$db->exec('CREATE DATABASE `' . $name . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$db->exec('USE `' . $name . '`');
try {
    $domainRepository = new \Ternus\Infrastructure\StateRepository($db);
    require __DIR__ . '/domain_test.php';
    echo "Full domain scenario persisted through relational tables after every operation.\n";
} finally { $db->exec('DROP DATABASE `' . $name . '`'); }
