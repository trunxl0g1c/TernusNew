<?php
// Creates only uniquely named ternus_relational_test_* databases. Never uses server/config.php.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(); }
ini_set('session.save_path', sys_get_temp_dir());
if (!session_start()) throw new RuntimeException('Test session could not start.');
require_once dirname(__DIR__) . '/app/bootstrap.php';
use Ternus\Infrastructure\StateRepository;
use Ternus\Infrastructure\RelationalSchema;
use Ternus\Infrastructure\RelationalCodec;
use Ternus\Infrastructure\RelationalStore;
use Ternus\Support\Audit;
use Ternus\Http\Controllers\CommandController;
use Ternus\Http\Controllers\AuthController;
if (!function_exists('databaseTestConnection')) {
    function databaseTestConnection(): PDO {
        $dsn = getenv('TERNUS_TEST_DSN');
        if (!$dsn || !str_starts_with($dsn, 'mysql:')) throw new RuntimeException('Set TERNUS_TEST_DSN and optional TERNUS_TEST_USER / TERNUS_TEST_PASSWORD for an isolated test server.');
        return new PDO($dsn, getenv('TERNUS_TEST_USER') ?: 'root', getenv('TERNUS_TEST_PASSWORD') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
    }
}
$db = databaseTestConnection();
$databases = []; $checks = 0;
function verifyDatabase(bool $condition, string $message): void {
    global $checks;
    if (!$condition) throw new RuntimeException('FAIL: ' . $message);
    $checks++;
}
function freshDatabase(PDO $db): string {
    global $databases;
    $name = 'ternus_relational_test_' . bin2hex(random_bytes(5));
    $db->exec('CREATE DATABASE `' . $name . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $db->exec('USE `' . $name . '`'); $databases[] = $name;
    return $name;
}
function legacyDatabase(PDO $db, array $state): void {
    $db->exec('CREATE TABLE app_state (id INT PRIMARY KEY, payload LONGTEXT NOT NULL, version INT NOT NULL DEFAULT 1) ENGINE=InnoDB');
    $db->prepare('INSERT INTO app_state (id,payload,version) VALUES (1,?,19)')->execute([RelationalCodec::json($state)]);
}
try {
    // Produce a realistic fixture covering production, transfers, sales, invoices, returns and opname.
    ob_start(); require __DIR__ . '/domain_test.php'; ob_end_clean();
    $fixture = $s;
    $fixture['users'][] = ['id' => uid(), 'name' => 'Sales fixture', 'email' => 'sales@example.test', 'password' => password_hash('Fixture-pass-123', PASSWORD_DEFAULT), 'role' => 'sales', 'active' => true];
    $fixture['settings']['custom_optional'] = ['zero' => 0, 'false' => false, 'null' => null, 'empty' => ''];
    $fixture['future_extension'] = ['unicode' => 'Kopi 日本', 'value' => 0.0];
    Audit::event($fixture, $owner, 'auth.login', 'Fixture history');
    freshDatabase($db); legacyDatabase($db, $fixture);
    $repo = new StateRepository($db);
    verifyDatabase($repo->storageStatus()['mode'] === 'legacy', 'Legacy detected');
    $source = $db->query('SELECT payload FROM app_state WHERE id=1')->fetchColumn();
    try { $repo->migrate(function () { throw new DomainException('Owner required'); }); throw new RuntimeException('Authorization failed'); }
    catch (DomainException $error) { verifyDatabase(!RelationalSchema::exists($db, 'ternus_storage'), 'No DDL before authorization'); }
    $result = $repo->migrate(fn($state) => $state['users'][0]);
    verifyDatabase($result['storage']['mode'] === 'relational', 'Migration activated');
    $after = $repo->read(); $migrationLog = array_pop($after['audit']);
    verifyDatabase($migrationLog['op'] === 'database.migrate', 'Migration audited');
    verifyDatabase(RelationalCodec::digest($after) === RelationalCodec::digest($fixture), 'Every value, ID, optional field, order and hash preserved');
    verifyDatabase($db->query('SELECT payload FROM app_state WHERE id=1')->fetchColumn() === $source, 'Legacy row unchanged');
    verifyDatabase((int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn() === 2, 'Users visible as rows');
    $savedHash = $db->query("SELECT password_hash FROM users WHERE email='sales@example.test'")->fetchColumn();
    verifyDatabase(password_verify('Fixture-pass-123', $savedHash), 'Migrated password still verifies');
    verifyDatabase((int) $db->query('SELECT COUNT(*) FROM invoice_items')->fetchColumn() > 0, 'Invoice lines separated');
    verifyDatabase((int) $db->query('SELECT COUNT(*) FROM stock_movements')->fetchColumn() === count($fixture['ledger']), 'Stock movements separated');
    $again = $repo->read(); $repo->migrate(fn($state) => $state['users'][0]);
    verifyDatabase(RelationalCodec::digest($again) === RelationalCodec::digest($repo->read()), 'Repeated migration is idempotent');
    $auth = new AuthController($repo);
    foreach ([['owner@example.test', 'TestingOnly-12345', 'owner'], ['sales@example.test', 'Fixture-pass-123', 'sales']] as [$email, $password, $role]) {
        $login = $auth->login(['email' => $email, 'password' => $password]);
        verifyDatabase($login['ok'] && findById($repo->read()['users'], $_SESSION['uid'])['role'] === $role, 'Real login after migration: ' . $role);
    }
    $db2 = databaseTestConnection();
    $dbName = $db->query('SELECT DATABASE()')->fetchColumn();
    $db2->exec('USE `' . $dbName . '`');
    $lockName = 'ternus:' . substr(hash('sha256', $dbName), 0, 50);
    $repo->transaction(function (&$state) use ($db2, $lockName): array {
        $q = $db2->prepare('SELECT GET_LOCK(?,0)'); $q->execute([$lockName]);
        verifyDatabase((int) $q->fetchColumn() === 0, 'Second connection cannot write during transaction');
        return [];
    });
    $q = $db2->prepare('SELECT GET_LOCK(?,0)'); $q->execute([$lockName]);
    verifyDatabase((int) $q->fetchColumn() === 1, 'Lock released after transaction');
    $q = $db2->prepare('SELECT RELEASE_LOCK(?)'); $q->execute([$lockName]);
    $db2 = null;
    $_SESSION = ['uid' => $owner['id']];
    $controller = new CommandController($repo);
    $request = ['key' => 'database-retry', 'op' => 'master.save', 'data' => ['type' => 'customers', 'name' => 'Database test customer', 'kind' => 'Retail']];
    $saved = $controller->execute($request);
    $beforeRetry = $repo->read(); $controller->execute($request);
    verifyDatabase(RelationalCodec::digest($beforeRetry) === RelationalCodec::digest($repo->read()), 'Controller retry does not duplicate relational data');
    verifyDatabase($db->query('SELECT payload FROM app_state WHERE id=1')->fetchColumn() === $source, 'New mutations do not write legacy JSON');
    $p = $fixture['products'][0]['id'];
    $before = $repo->read(); $changed = $before; $changed['products'][0]['price']++;
    $db->beginTransaction();
    $writes = (new RelationalStore($db))->save($before, $changed);
    verifyDatabase($writes === ['inserted' => 0, 'updated' => 1, 'deleted' => 0], 'Single master edit updates one row');
    $db->rollBack();
    try {
        $repo->transaction(function (&$state): array { $state['batches'][0]['product'] = 'missing-product'; return []; });
        throw new RuntimeException('FK was not enforced');
    } catch (PDOException $error) { verifyDatabase(RelationalCodec::digest($before) === RelationalCodec::digest($repo->read()), 'FK failure rolls back everything'); }
    $controller->execute(['key' => 'delete-unused', 'op' => 'master.bulk', 'data' => ['type' => 'customers', 'action' => 'delete', 'ids' => [$saved['result']['id']]]]);
    verifyDatabase(findById($repo->read()['customers'], $saved['result']['id']) === null, 'Unused master deletion and audit coexist');
    $before = $repo->read();
    try {
        $controller->execute(['key' => 'bad-receipt', 'op' => 'receive', 'data' => ['location' => $fixture['locations'][0]['id'], 'date' => today(), 'source' => 'Saldo awal', 'origin' => 'Test', 'lines' => [['product' => $p, 'qty' => 1, 'cost' => 100], ['product' => $p, 'qty' => -1, 'cost' => 100]]]]);
        throw new RuntimeException('Invalid quantity not rejected');
    } catch (DomainException $error) { verifyDatabase(RelationalCodec::digest($before) === RelationalCodec::digest($repo->read()), 'Partially applied domain failure leaves no movement or audit'); }
    $sales = end($fixture['users']);
    verifyDatabase(viewState($repo->read(), $sales)['audit'] === [], 'Sales privacy retained');
    // Restore compatibility: same replacement mechanism used by server/restore.php.
    $repo->restore($fixture);
    verifyDatabase(RelationalCodec::digest($fixture) === RelationalCodec::digest($repo->read()), 'Backup replacement remains lossless');
    freshDatabase($db);
    $clean = initialState('Fresh owner', 'owner@example.test', 'Fresh-pass-1234');
    $fresh = new StateRepository($db); $fresh->install($clean);
    verifyDatabase($fresh->storageStatus()['mode'] === 'relational', 'New install is relational');
    verifyDatabase(!RelationalSchema::exists($db, 'app_state'), 'New install creates no giant JSON table');
    verifyDatabase(RelationalCodec::digest($clean) === RelationalCodec::digest($fresh->read()), 'New install roundtrip');
    // A fresh installation can have the same email and SKU with different IDs.
    $fresh->restore($fixture);
    verifyDatabase(RelationalCodec::digest($fixture) === RelationalCodec::digest($fresh->read()), 'Restore handles unique values belonging to different IDs');
    $brokenBackup = $fixture; $brokenBackup['batches'][0]['product'] = 'missing';
    try { $fresh->restore($brokenBackup); throw new LogicException('Broken restore accepted'); }
    catch (PDOException $error) { verifyDatabase(RelationalCodec::digest($fixture) === RelationalCodec::digest($fresh->read()), 'Failed full replacement restores every previous row'); }
    freshDatabase($db);
    $bad = $fixture; $bad['batches'][0]['product'] = 'missing'; legacyDatabase($db, $bad);
    $failed = new StateRepository($db);
    try { $failed->migrate(fn($state) => $state['users'][0]); throw new RuntimeException('Bad migration accepted'); }
    catch (PDOException $error) {
        verifyDatabase($failed->storageStatus()['mode'] === 'legacy', 'Failed migration does not activate destination');
        verifyDatabase((new RelationalStore($db))->empty(), 'Failed migration has no partial destination rows');
        verifyDatabase(RelationalCodec::digest($failed->read()) === RelationalCodec::digest($bad), 'Failed migration preserves source');
    }
    $db->prepare('UPDATE app_state SET payload=? WHERE id=1')->execute([RelationalCodec::json($fixture)]);
    $failed->migrate(fn($state) => $state['users'][0]);
    verifyDatabase($failed->storageStatus()['mode'] === 'relational', 'Retry after corrected source works');
    freshDatabase($db); legacyDatabase($db, $fixture);
    $db->exec('CREATE TABLE users (id INT PRIMARY KEY)');
    try { (new StateRepository($db))->migrate(fn($state) => $state['users'][0]); throw new LogicException('Collision not rejected'); }
    catch (RuntimeException $error) { verifyDatabase(!RelationalSchema::exists($db, 'ternus_storage'), 'Preexisting unrelated tables are never overwritten'); }
    echo "$checks relational database checks passed.\n";
} finally {
    foreach ($databases as $name) $db->exec('DROP DATABASE `' . $name . '`');
}
