<?php
declare(strict_types=1);
namespace Ternus\Infrastructure;
use PDO;
use PDOException;
use RuntimeException;
use Throwable;

/** Relational persistence with a read/write compatibility path until the owner migrates. */
final class StateRepository implements StateStore
{
    private ?PDO $connection;
    private ?array $baseline = null;
    private ?string $transactionMode = null;
    public function __construct(?PDO $connection = null) { $this->connection = $connection; }
    public function connection(bool $create = false): PDO
    {
        if ($this->connection) return $this->connection;
        $config = require dirname(__DIR__, 2) . '/server/config.php';
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $config['database'])) throw new RuntimeException('Nama database tidak valid.');
        $dsn = 'mysql:host=' . $config['host'] . ';port=' . $config['port'] . ';charset=utf8mb4';
        if (!$create) $dsn .= ';dbname=' . $config['database'];
        $db = new PDO($dsn, $config['username'], $config['password'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES => false]);
        if ($create) {
            $db->exec('CREATE DATABASE IF NOT EXISTS `' . $config['database'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
            $db->exec('USE `' . $config['database'] . '`');
        }
        return $this->connection = $db;
    }
    public function storageStatus(): array
    {
        $db = $this->connection();
        if (RelationalSchema::exists($db, 'ternus_storage')) {
            $row = $db->query('SELECT schema_version,mode,migrated_at,source_sha256 FROM ternus_storage WHERE id=1')->fetch(PDO::FETCH_ASSOC);
            if ($row && $row['mode'] === 'relational') {
                if ((int) $row['schema_version'] !== 2) throw new RuntimeException('Versi database tidak didukung aplikasi ini.');
                return ['mode' => 'relational', 'schema_version' => 2, 'migrated_at' => $row['migrated_at'], 'table_count' => count(RelationalSchema::tables())];
            }
        }
        if (RelationalSchema::exists($db, 'app_state') && $db->query('SELECT 1 FROM app_state WHERE id=1')->fetchColumn()) return ['mode' => 'legacy', 'schema_version' => 1];
        return ['mode' => 'empty', 'schema_version' => 0];
    }
    public function installed(): bool
    {
        try { return $this->storageStatus()['mode'] !== 'empty'; }
        catch (PDOException $error) {
            // Only a missing database means not installed. Access/connection errors must stay visible.
            if (($error->errorInfo[1] ?? 0) === 1049) return false;
            throw $error;
        }
    }
    private function locked(callable $action): mixed
    {
        $db = $this->connection();
        $name = 'ternus:' . substr(hash('sha256', (string) $db->query('SELECT DATABASE()')->fetchColumn()), 0, 50);
        $lock = $db->prepare('SELECT GET_LOCK(?, 15)'); $lock->execute([$name]);
        if ((int) $lock->fetchColumn() !== 1) throw new RuntimeException('Database sedang memproses transaksi lain. Coba lagi.');
        try { return $action(); }
        finally { $release = $db->prepare('SELECT RELEASE_LOCK(?)'); $release->execute([$name]); }
    }
    public function install(array $state): void
    {
        $this->connection(true);
        $this->locked(function () use ($state): void {
            if ($this->installed()) throw new \DomainException('Aplikasi sudah terpasang. Silakan login.');
            RelationalSchema::prepare($this->connection());
            $this->activate($state, null, null);
        });
    }
    private function legacy(bool $lock = false): array
    {
        $payload = $this->connection()->query('SELECT payload FROM app_state WHERE id=1' . ($lock ? ' FOR UPDATE' : ''))->fetchColumn();
        if (!$payload) throw new RuntimeException('Aplikasi belum terpasang.');
        return json_decode($payload, true, 512, JSON_THROW_ON_ERROR);
    }
    public function read(bool $lock = false): array
    {
        $db = $this->connection();
        if ($db->inTransaction()) {
            $mode = $this->transactionMode ?? $this->storageStatus()['mode'];
            return $mode === 'relational' ? (new RelationalStore($db))->read() : $this->legacy($lock);
        }
        if ($lock) throw new RuntimeException('Pembacaan terkunci harus di dalam transaksi.');
        // Every table is read from one consistent snapshot, never a mixture of two transactions.
        $db->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        $db->beginTransaction();
        try {
            $mode = $this->storageStatus()['mode'];
            $state = $mode === 'relational' ? (new RelationalStore($db))->read() : $this->legacy();
            $db->commit(); return $state;
        } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
    }
    public function save(array $state): void
    {
        $db = $this->connection();
        if (!$db->inTransaction() || $this->baseline === null) throw new RuntimeException('Penyimpanan wajib melalui transaksi repository.');
        if ($this->transactionMode === 'relational') {
            (new RelationalStore($db))->save($this->baseline, $state);
            $db->exec('UPDATE ternus_storage SET revision=revision+1 WHERE id=1');
        } else {
            $db->prepare('UPDATE app_state SET payload=?,version=version+1 WHERE id=1')->execute([RelationalCodec::json($state)]);
        }
    }
    public function transaction(callable $callback): array
    {
        return $this->locked(function () use ($callback): array {
            $db = $this->connection(); $db->beginTransaction();
            try {
                $this->transactionMode = $this->storageStatus()['mode'];
                if ($this->transactionMode === 'empty') throw new RuntimeException('Aplikasi belum terpasang.');
                if ($this->transactionMode === 'relational') $db->query('SELECT id FROM ternus_storage WHERE id=1 FOR UPDATE')->fetchColumn();
                $state = $this->read(true); $this->baseline = $state;
                $result = $callback($state); $this->save($state);
                $db->commit(); return $result;
            } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
            finally { $this->baseline = null; $this->transactionMode = null; }
        });
    }
    /** CLI restore is an explicit full replacement, including conflicting unique values. */
    public function restore(array $state): void
    {
        $this->locked(function () use ($state): void {
            $db = $this->connection(); $db->beginTransaction();
            try {
                $mode = $this->storageStatus()['mode'];
                if ($mode === 'empty') throw new RuntimeException('Pasang aplikasi sebelum memulihkan backup.');
                if ($mode === 'relational') {
                    $db->query('SELECT id FROM ternus_storage WHERE id=1 FOR UPDATE')->fetchColumn();
                    (new RelationalStore($db))->replace($state);
                    $db->exec('UPDATE ternus_storage SET revision=revision+1 WHERE id=1');
                } else {
                    $this->legacy(true);
                    $db->prepare('UPDATE app_state SET payload=?,version=version+1 WHERE id=1')->execute([RelationalCodec::json($state)]);
                }
                $db->commit();
            } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
        });
    }
    /** Auth callback is repeated under the same lock as migration. No DDL before authorization. */
    public function migrate(callable $authorize): array
    {
        return $this->locked(function () use ($authorize): array {
            $status = $this->storageStatus();
            $state = $this->read(); $actor = $authorize($state);
            if ($status['mode'] === 'relational') return ['ok' => true, 'message' => 'Database sudah menggunakan tabel terpisah.', 'storage' => $status];
            RelationalSchema::prepare($this->connection());
            $db = $this->connection(); $db->beginTransaction();
            try {
                // The legacy row lock also excludes in-flight writers using the earlier repository.
                $source = $db->query('SELECT payload,version FROM app_state WHERE id=1 FOR UPDATE')->fetch(PDO::FETCH_ASSOC);
                if (!$source) throw new RuntimeException('Data lama tidak ditemukan.');
                $state = json_decode($source['payload'], true, 512, JSON_THROW_ON_ERROR);
                $actor = $authorize($state);
                $this->activate($state, (int) $source['version'], hash('sha256', $source['payload']), $actor);
                $db->commit();
                return ['ok' => true, 'message' => 'Migrasi berhasil. Akun dan transaksi kini disimpan di tabel terpisah.', 'storage' => $this->storageStatus()];
            } catch (Throwable $error) { if ($db->inTransaction()) $db->rollBack(); throw $error; }
        });
    }
    private function activate(array $state, ?int $sourceVersion, ?string $sourceHash, ?array $actor = null): void
    {
        $db = $this->connection(); $ownTransaction = !$db->inTransaction();
        if ($ownTransaction) $db->beginTransaction();
        try {
            $store = new RelationalStore($db);
            if (!$store->empty()) throw new RuntimeException('Tabel tujuan sudah berisi data. Migrasi dihentikan agar tidak menimpa data.');
            $store->save([], $state);
            $restored = $store->read();
            if (RelationalCodec::digest($restored) !== RelationalCodec::digest($state)) throw new RuntimeException('Verifikasi data hasil migrasi tidak cocok. Seluruh pemindahan dibatalkan.');
            if ($actor) {
                $before = $restored;
                \Ternus\Support\Audit::event($restored, $actor, 'database.migrate', 'Migrasi ke tabel terpisah; seluruh data lama lolos verifikasi.');
                $store->save($before, $restored);
            }
            $db->prepare("UPDATE ternus_storage SET mode='relational',revision=1,migrated_at=?,source_version=?,source_sha256=? WHERE id=1")->execute([date(DATE_ATOM),$sourceVersion,$sourceHash]);
            if ($ownTransaction) $db->commit();
        } catch (Throwable $error) { if ($ownTransaction && $db->inTransaction()) $db->rollBack(); throw $error; }
    }
}
