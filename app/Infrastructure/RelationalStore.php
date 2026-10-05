<?php
declare(strict_types=1);
namespace Ternus\Infrastructure;
use PDO;

final class RelationalStore
{
    public function __construct(private PDO $db) {}
    public function read(): array
    {
        $tables = [];
        foreach (RelationalSchema::tables() as $name => $table) {
            $order = $table['kind'] === 'child' ? '`parent_id`,`line_no`' : '`sort_order`';
            $tables[$name] = $this->db->query('SELECT * FROM ' . RelationalSchema::quote($name) . ' ORDER BY ' . $order)->fetchAll(PDO::FETCH_ASSOC);
        }
        return RelationalCodec::decode($tables);
    }
    /** Writes only changed rows. The caller owns the transaction and application lock. */
    public function save(array $before, array $after): array
    {
        $old = $before === [] ? array_fill_keys(array_keys(RelationalSchema::tables()), []) : RelationalCodec::encode($before);
        $new = RelationalCodec::encode($after);
        $counts = ['inserted' => 0, 'updated' => 0, 'deleted' => 0];
        foreach (RelationalSchema::tables() as $name => $table) {
            $insert = null; $update = null;
            $pk = $table['kind'] === 'entity' ? ['id'] : ($table['kind'] === 'child' ? ['parent_id','line_no'] : ['entry_key']);
            foreach ($new[$name] as $key => $row) {
                if (($old[$name][$key] ?? null) === $row) continue;
                if (!isset($old[$name][$key])) {
                    $columns = array_map([RelationalSchema::class, 'quote'], array_keys($row));
                    $insert ??= $this->db->prepare('INSERT INTO ' . RelationalSchema::quote($name) . ' (' . implode(',', $columns) . ') VALUES (' . implode(',', array_fill(0, count($columns), '?')) . ')');
                    $insert->execute(array_values($row)); $counts['inserted']++;
                } else {
                    $values = array_diff_key($row, array_flip($pk));
                    $sets = array_map(fn($k) => RelationalSchema::quote($k) . '=?', array_keys($values));
                    $where = array_map(fn($k) => RelationalSchema::quote($k) . '=?', $pk);
                    $update ??= $this->db->prepare('UPDATE ' . RelationalSchema::quote($name) . ' SET ' . implode(',', $sets) . ' WHERE ' . implode(' AND ', $where));
                    $update->execute([...array_values($values), ...array_map(fn($k) => $row[$k], $pk)]); $counts['updated']++;
                }
            }
        }
        // Details are removed before headers; business records before referenced masters.
        foreach (array_reverse(RelationalSchema::tables(), true) as $name => $table) {
            $pk = $table['kind'] === 'entity' ? ['id'] : ($table['kind'] === 'child' ? ['parent_id','line_no'] : ['entry_key']);
            $delete = null;
            foreach (array_diff_key($old[$name], $new[$name]) as $row) {
                $where = array_map(fn($k) => RelationalSchema::quote($k) . '=?', $pk);
                $delete ??= $this->db->prepare('DELETE FROM ' . RelationalSchema::quote($name) . ' WHERE ' . implode(' AND ', $where));
                $delete->execute(array_map(fn($k) => $row[$k], $pk)); $counts['deleted']++;
            }
        }
        return $counts;
    }
    /** Full backup replacement only. DELETE is transactional; never TRUNCATE or disable FKs. */
    public function replace(array $state): void
    {
        foreach (array_reverse(array_keys(RelationalSchema::tables())) as $name) {
            $this->db->exec('DELETE FROM ' . RelationalSchema::quote($name));
        }
        $this->save([], $state);
        if (RelationalCodec::digest($state) !== RelationalCodec::digest($this->read())) {
            throw new \RuntimeException('Verifikasi pemulihan gagal. Pemulihan dibatalkan.');
        }
    }
    public function empty(): bool
    {
        foreach (array_keys(RelationalSchema::tables()) as $name) {
            if ($this->db->query('SELECT 1 FROM ' . RelationalSchema::quote($name) . ' LIMIT 1')->fetchColumn()) return false;
        }
        return true;
    }
}
