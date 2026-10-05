<?php
declare(strict_types=1);
namespace Ternus\Infrastructure;
use PDO;
use RuntimeException;

final class RelationalSchema
{
    public static function definition(): array
    {
        static $schema;
        return $schema ??= json_decode(file_get_contents(dirname(__DIR__) . '/storage-schema.json'), true, 512, JSON_THROW_ON_ERROR);
    }
    public static function quote(string $name): string
    {
        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $name)) throw new RuntimeException('Identifier database tidak valid.');
        return '`' . $name . '`';
    }
    public static function column(string $field): string { return $field === 'password' ? 'password_hash' : $field; }
    public static function exists(PDO $db, string $table): bool
    {
        $q = $db->prepare('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?');
        $q->execute([$table]);
        return (int) $q->fetchColumn() > 0;
    }
    public static function tables(): array
    {
        $s = self::definition(); $tables = [];
        foreach ($s['entities'] as $e) $tables[$e['table']] = ['kind' => 'entity', 'definition' => $e];
        foreach ($s['entities'] as $e) foreach ($e['children'] as $c) {
            $tables[$c['table']] = ['kind' => 'child', 'parent' => $e['table'], 'definition' => $c];
        }
        foreach ($s['maps'] as $m) $tables[$m['table']] = ['kind' => 'map', 'definition' => $m];
        $tables['app_extensions'] = ['kind' => 'map', 'definition' => ['value' => 'json']];
        return $tables;
    }
    private static function type(string $type): string
    {
        return match ($type) {
            'id' => 'VARCHAR(100) COLLATE utf8mb4_bin',
            'short' => 'VARCHAR(190)', 'email' => 'VARCHAR(254)', 'hash' => 'VARCHAR(255) COLLATE utf8mb4_bin',
            'int' => 'BIGINT', 'bool' => 'TINYINT', 'date' => 'VARCHAR(10)', 'time' => 'VARCHAR(40)',
            'text', 'json' => 'LONGTEXT', default => throw new RuntimeException('Tipe kolom tidak dikenal.'),
        };
    }
    public static function statements(): array
    {
        $suffix = ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
        $sql = ['CREATE TABLE IF NOT EXISTS `ternus_storage` (`id` TINYINT PRIMARY KEY, `schema_version` INT NOT NULL, `mode` VARCHAR(20) NOT NULL, `revision` BIGINT NOT NULL DEFAULT 0, `migrated_at` VARCHAR(40) NULL, `source_version` BIGINT NULL, `source_sha256` CHAR(64) NULL)' . $suffix];
        $entities = self::definition()['entities'];
        foreach (self::tables() as $table => $t) {
            $d = $t['definition']; $parts = [];
            if ($t['kind'] === 'child') {
                $parts[] = '`parent_id` VARCHAR(100) COLLATE utf8mb4_bin NOT NULL';
                $parts[] = '`line_no` BIGINT NOT NULL';
                $parts[] = 'PRIMARY KEY (`parent_id`,`line_no`)';
                $parts[] = 'FOREIGN KEY (`parent_id`) REFERENCES ' . self::quote($t['parent']) . ' (`id`) ON DELETE RESTRICT';
            } elseif ($t['kind'] === 'map') {
                $parts[] = '`entry_key` VARCHAR(190) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY';
                $parts[] = '`sort_order` BIGINT NOT NULL';
            } else {
                $parts[] = '`sort_order` BIGINT NOT NULL';
            }
            $fields = $d['fields'] ?? ['value' => $d['value']];
            foreach ($fields as $field => $type) {
                $primary = $field === 'id' && $t['kind'] === 'entity';
                $parts[] = self::quote(self::column($field)) . ' ' . self::type($type) . ($primary ? ' NOT NULL PRIMARY KEY' : ' NULL');
            }
            $parts[] = '`_present` LONGTEXT NOT NULL';
            $parts[] = '`_extra_json` LONGTEXT NOT NULL';
            foreach ($d['references'] ?? [] as $field => $target) {
                $col = self::quote(self::column($field));
                $parts[] = 'INDEX (' . $col . ')';
                $parts[] = 'FOREIGN KEY (' . $col . ') REFERENCES ' . self::quote($entities[$target]['table']) . ' (`id`) ON DELETE RESTRICT';
            }
            foreach ($d['unique'] ?? [] as $field) $parts[] = 'UNIQUE (' . self::quote(self::column($field)) . ')';
            foreach (['date','status','time','op','document','document_id','user_id'] as $field) {
                if (isset($fields[$field]) && !isset($d['references'][$field]) && !in_array($field, $d['unique'] ?? [], true)) $parts[] = 'INDEX (' . self::quote($field) . ')';
            }
            $sql[] = 'CREATE TABLE IF NOT EXISTS ' . self::quote($table) . " (\n  " . implode(",\n  ", $parts) . "\n)" . $suffix;
        }
        return $sql;
    }
    /** DDL is deliberately outside any business transaction (MySQL implicit commits). */
    public static function prepare(PDO $db): void
    {
        if (!self::exists($db, 'ternus_storage')) {
            foreach (array_keys(self::tables()) as $table) {
                if (self::exists($db, $table)) throw new RuntimeException('Tabel ' . $table . ' sudah ada di luar skema migrasi. Gunakan database TERNUS yang sesuai; tidak ada data yang ditimpa.');
            }
        } else {
            $row = $db->query('SELECT * FROM ternus_storage WHERE id=1')->fetch(PDO::FETCH_ASSOC);
            if ($row && (int) $row['schema_version'] !== 2) throw new RuntimeException('Versi skema database tidak didukung.');
        }
        foreach (self::statements() as $sql) $db->exec($sql);
        $db->exec("INSERT IGNORE INTO ternus_storage (id,schema_version,mode) VALUES (1,2,'preparing')");
    }
}
