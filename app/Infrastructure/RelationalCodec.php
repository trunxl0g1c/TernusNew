<?php
declare(strict_types=1);
namespace Ternus\Infrastructure;
use RuntimeException;

/** Lossless bridge between the existing domain arrays and relational rows. */
final class RelationalCodec
{
    /** Same list semantics on PHP 8.0 and newer; no dependency on array_is_list(). */
    private static function isList(array $value): bool
    {
        $expected = 0;
        foreach ($value as $key => $_) {
            if ($key !== $expected++) return false;
        }
        return true;
    }
    public static function json(mixed $value): string
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION | JSON_THROW_ON_ERROR);
    }
    public static function canonical(mixed $value): mixed
    {
        if (!is_array($value)) return $value;
        if (!self::isList($value)) ksort($value);
        foreach ($value as &$item) $item = self::canonical($item);
        unset($item);
        return $value;
    }
    public static function digest(array $state): string { return hash('sha256', self::json(self::canonical($state))); }
    private static function encodeValue(mixed $value, string $type, string $label): mixed
    {
        if ($value === null) return null;
        if ($type === 'json') return self::json($value);
        $valid = match ($type) {
            'int' => is_int($value), 'bool' => is_bool($value), default => is_string($value),
        };
        if (!$valid) throw new RuntimeException('Tipe data tidak sesuai pada ' . $label . '; migrasi dihentikan tanpa mengubah sumber.');
        return $type === 'bool' ? (int) $value : $value;
    }
    private static function record(array $record, array $definition, string $label): array
    {
        $row = []; $known = $definition['fields'] ?? ['value' => $definition['value']];
        foreach ($known as $field => $type) {
            $value = $record[$field] ?? null;
            // Empty optional relationships are represented by SQL NULL, and restored via metadata.
            if (isset($definition['references'][$field]) && $value === '') $value = null;
            $row[RelationalSchema::column($field)] = self::encodeValue($value, $type, $label . '.' . $field);
        }
        $emptyRefs = [];
        foreach ($definition['references'] ?? [] as $field => $_) if (($record[$field] ?? null) === '') $emptyRefs[] = $field;
        $row['_present'] = self::json(['keys' => array_keys($record), 'empty_refs' => $emptyRefs]);
        $row['_extra_json'] = self::json(array_diff_key($record, $known, $definition['children'] ?? []));
        return $row;
    }
    private static function decodeRecord(array $row, array $definition): array
    {
        $meta = json_decode($row['_present'], true, 512, JSON_THROW_ON_ERROR);
        $extra = json_decode($row['_extra_json'], true, 512, JSON_THROW_ON_ERROR);
        $fields = $definition['fields'] ?? ['value' => $definition['value']];
        $result = [];
        foreach ($meta['keys'] as $key) {
            if (isset($definition['children'][$key])) { $result[$key] = []; continue; }
            if (!isset($fields[$key])) { $result[$key] = $extra[$key]; continue; }
            $value = $row[RelationalSchema::column($key)];
            if (in_array($key, $meta['empty_refs'], true)) $value = '';
            elseif ($value !== null) $value = match ($fields[$key]) {
                'int' => (int) $value, 'bool' => (bool) $value,
                'json' => json_decode($value, true, 512, JSON_THROW_ON_ERROR), default => (string) $value,
            };
            $result[$key] = $value;
        }
        return $result;
    }
    public static function encode(array $state): array
    {
        if (array_key_exists('__state_keys', $state)) throw new RuntimeException('Nama ekstensi __state_keys digunakan oleh sistem migrasi. Sumber tidak diubah.');
        $schema = RelationalSchema::definition();
        $tables = array_fill_keys(array_keys(RelationalSchema::tables()), []);
        foreach ($schema['entities'] as $key => $d) {
            foreach ($state[$key] ?? [] as $order => $record) {
                $id = $record['id'] ?? '';
                if (!is_string($id) || $id === '' || isset($tables[$d['table']][$id])) throw new RuntimeException('ID kosong/ganda pada ' . $key . '.');
                $tables[$d['table']][$id] = ['sort_order' => $order] + self::record($record, $d, $key);
                foreach ($d['children'] as $field => $child) {
                    if (isset($record[$field]) && (!is_array($record[$field]) || !self::isList($record[$field]))) throw new RuntimeException('Rincian ' . $key . '.' . $field . ' tidak valid.');
                    foreach ($record[$field] ?? [] as $i => $line) {
                        $tables[$child['table']][$id . ':' . $i] = ['parent_id' => $id, 'line_no' => $i] + self::record($line, $child, $child['table']);
                    }
                }
            }
        }
        foreach ($schema['maps'] as $key => $d) {
            $order = 0;
            foreach ($state[$key] ?? [] as $name => $value) {
                $record = isset($d['fields']) ? $value : ['value' => $value];
                $tables[$d['table']][(string) $name] = ['entry_key' => (string) $name, 'sort_order' => $order++] + self::record($record, $d, $key);
            }
        }
        $known = $schema['entities'] + $schema['maps'];
        $extensions = array_diff_key($state, $known);
        // Preserve top-level key presence/order without copying any business values.
        $extensions['__state_keys'] = array_keys($state);
        $i = 0;
        foreach ($extensions as $name => $value) $tables['app_extensions'][$name] = ['entry_key' => $name, 'sort_order' => $i++] + self::record(['value' => $value], ['value' => 'json'], 'extensions');
        return $tables;
    }
    public static function decode(array $tables): array
    {
        $schema = RelationalSchema::definition(); $state = [];
        foreach ($schema['entities'] as $key => $d) {
            $records = []; $positions = [];
            foreach ($tables[$d['table']] as $row) {
                $positions[$row['id']] = count($records);
                $records[] = self::decodeRecord($row, $d);
            }
            foreach ($d['children'] as $field => $child) foreach ($tables[$child['table']] as $row) {
                if (!isset($positions[$row['parent_id']])) throw new RuntimeException('Rincian tanpa dokumen induk: ' . $child['table']);
                $records[$positions[$row['parent_id']]][$field][] = self::decodeRecord($row, $child);
            }
            $state[$key] = $records;
        }
        foreach ($schema['maps'] as $key => $d) {
            $state[$key] = [];
            foreach ($tables[$d['table']] as $row) {
                $record = self::decodeRecord($row, $d);
                $state[$key][$row['entry_key']] = isset($d['fields']) ? $record : $record['value'];
            }
        }
        $keys = array_keys($state);
        foreach ($tables['app_extensions'] as $row) {
            $value = self::decodeRecord($row, ['value' => 'json'])['value'];
            if ($row['entry_key'] === '__state_keys') $keys = $value;
            else $state[$row['entry_key']] = $value;
        }
        $result = [];
        foreach ($keys as $key) $result[$key] = $state[$key];
        return $result;
    }
}
