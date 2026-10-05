<?php
declare(strict_types=1);
namespace Ternus\Support;

/** Append-only application history; inventory balances continue to use the stock ledger. */
final class Audit
{
    private const COLLECTIONS = [
        'products', 'customers', 'suppliers', 'users', 'locations', 'terms',
        'batches', 'ledger', 'receipts', 'productions', 'transfers', 'quotes',
        'orders', 'shipments', 'invoices', 'payments', 'credits', 'refunds',
        'returns', 'stocktakes', 'assets', 'asset_events',
    ];

    public static function snapshot(array $state): array
    {
        $snapshot = ['settings' => $state['settings'] ?? []];
        foreach (self::COLLECTIONS as $key) {
            $snapshot[$key] = array_column($state[$key] ?? [], null, 'id');
        }
        foreach ($snapshot['invoices'] as &$invoice) {
            $invoice = array_merge($invoice, invoiceBalance($state, $invoice));
        }
        unset($invoice);
        return $snapshot;
    }

    private static function safe(mixed $value): mixed
    {
        if (!is_array($value)) return $value;
        $result = [];
        foreach ($value as $key => $item) {
            if (preg_match('/password|token|secret|csrf/i', (string) $key)) continue;
            $result[$key] = self::safe($item);
        }
        return $result;
    }

    private static function change(string $entity, string $id, ?array $old, ?array $new): ?array
    {
        if ($old === $new) return null;
        $before = self::safe($old ?? []);
        $after = self::safe($new ?? []);
        $fields = [];
        foreach (array_unique(array_merge(array_keys($before), array_keys($after))) as $key) {
            if (in_array($key, ['id', 'version'], true)) continue;
            $a = $before[$key] ?? null;
            $b = $after[$key] ?? null;
            if ($a !== $b) $fields[] = ['key' => $key, 'before' => $a, 'after' => $b];
        }
        // Record that a credential changed, never the credential or its hash.
        if ($entity === 'users' && $new !== null && ($old['password'] ?? null) !== ($new['password'] ?? null)) {
            $fields[] = ['key' => 'password_changed', 'before' => $old === null ? null : 'Tersimpan', 'after' => $old === null ? 'Ditetapkan' : 'Diubah'];
        }
        if (!$fields && $old !== null && $new !== null) return null;
        $record = $new ?? $old;
        return [
            'entity' => $entity, 'id' => $id,
            'label' => $record['number'] ?? $record['name'] ?? $record['document'] ?? ($entity === 'settings' ? 'Pengaturan usaha' : $id),
            'kind' => $old === null ? 'created' : ($new === null ? 'deleted' : 'updated'),
            'context' => array_intersect_key($record, array_flip(['unit', 'product', 'batch', 'location'])),
            'fields' => $fields,
        ];
    }

    public static function record(array &$state, array $actor, string $op, array $result, array $before, string $source = 'form'): void
    {
        $after = self::snapshot($state);
        $changes = [];
        $stockBalances = [];
        foreach ($before['ledger'] ?? [] as $row) {
            $key = $row['batch'] . '|' . $row['location'] . '|' . $row['bucket'];
            $stockBalances[$key] = ($stockBalances[$key] ?? 0) + $row['qty'];
        }
        foreach (self::COLLECTIONS as $entity) {
            foreach (array_unique(array_merge(array_keys($before[$entity] ?? []), array_keys($after[$entity]))) as $id) {
                $change = self::change($entity, (string) $id, $before[$entity][$id] ?? null, $after[$entity][$id] ?? null);
                if ($change !== null && $entity === 'ledger' && !isset($before['ledger'][$id]) && isset($after['ledger'][$id])) {
                    $row = $after['ledger'][$id];
                    $key = $row['batch'] . '|' . $row['location'] . '|' . $row['bucket'];
                    $balance = $stockBalances[$key] ?? 0;
                    $stockBalances[$key] = $balance + $row['qty'];
                    $change['fields'][] = ['key' => 'stock_balance', 'before' => $balance, 'after' => $stockBalances[$key]];
                }
                if ($change !== null) $changes[] = $change;
            }
        }
        $settings = self::change('settings', 'settings', $before['settings'] ?? [], $after['settings']);
        if ($settings !== null) $changes[] = $settings;
        self::event($state, $actor, $op, $result['message'] ?? 'Perubahan tersimpan.', [
            'document' => $result['id'] ?? '',
            'source' => $source === 'quick-edit' ? 'quick-edit' : 'form',
            'changes' => $changes,
        ]);
    }

    public static function event(array &$state, array $actor, string $op, string $summary, array $details = []): void
    {
        $state['audit'][] = [
            'id' => uid(), 'time' => date(DATE_ATOM), 'user' => $actor['name'],
            'user_id' => $actor['id'], 'role' => $actor['role'], 'op' => $op,
            'document' => $details['document'] ?? '', 'summary' => $summary,
            'schema' => 2, 'source' => $details['source'] ?? 'system',
            'changes' => $details['changes'] ?? [],
        ];
    }
}
