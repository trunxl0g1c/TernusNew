<?php
declare(strict_types=1);
namespace Ternus\Modules\MasterData;

final class MasterDataService
{
    /** Command: master.save. Called inside a repository transaction. */
    public static function save(array &$state, array $actor, string $op, array $input): array
    {
        $type = $input['type'] ?? '';
        need(
            in_array($type, ['products', 'customers', 'suppliers', 'locations', 'terms']),
            'Jenis master tidak valid.',
        );
        permit($actor, $type === 'customers' ? ['owner', 'admin', 'sales'] : ['owner', 'admin']);
        $old = empty($input['id']) ? null : entity($state, $type, $input['id']);
        if ($old) {
            need(
                $old['version'] === ($input['version'] ?? 0),
                'Data berubah oleh pengguna lain. Muat ulang.',
            );
        }
        $r = $old ?? ['id' => uid(), 'active' => true, 'version' => 0];
        $r['name'] = clean($input['name']);
        $r['version']++;
        if ($type === 'products') {
            $r['sku'] = strtoupper(clean($input['sku'], 80));
            foreach ($state[$type] as $p) {
                need(
                    $p['id'] === $r['id'] || strtoupper($p['sku']) !== $r['sku'],
                    'SKU sudah digunakan.',
                );
            }
            $r['unit'] = $input['unit'];
            need(in_array($r['unit'], ['kg', 'pcs']), 'Satuan tidak valid.');
            if ($old) {
                foreach ($state['batches'] as $b) {
                    if ($b['product'] === $r['id']) {
                        need(
                            $r['unit'] === $old['unit'] && $r['sku'] === $old['sku'],
                            'SKU/satuan sudah digunakan dalam stok.',
                        );
                    }
                }
            }
            $r['stage'] = clean($input['stage']);
            $r['cost'] = money($input['cost'] ?? 0);
            $r['price'] = money($input['price'] ?? 0);
            $r['minimum'] = integer($input['minimum'] ?? 0);
            $r['sell'] = (bool) ($input['sell'] ?? true);
            $r['process'] = (bool) ($input['process'] ?? true);
            $r['net_g'] = integer($input['net_g'] ?? 0);
        }
        if (in_array($type, ['customers', 'suppliers'])) {
            $r['phone'] = substr(trim($input['phone'] ?? ''), 0, 50);
            $r['address'] = substr(trim($input['address'] ?? ''), 0, 500);
            $r['kind'] = clean($input['kind'] ?? 'Retail');
        }
        if ($type === 'terms') {
            $r['code'] = strtoupper(clean($input['code'], 40));
            need(
                preg_match('/^[A-Z0-9-]+$/', $r['code']) === 1,
                'Kode SKU hanya huruf/angka/tanda minus.',
            );
        }
        if ($old) {
            $state[$type][ix($state[$type], $r['id'])] = $r;
        } else {
            $state[$type][] = $r;
        }
        return ['id' => $r['id'], 'message' => 'Data tersimpan.'];
    }

    /** Command: master.bulk. Called inside a repository transaction. */
    public static function bulk(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $type = $input['type'];
        need(
            in_array($type, ['products', 'customers', 'suppliers', 'locations', 'terms']),
            'Master tidak valid.',
        );
        $action = $input['action'];
        need(in_array($action, ['archive', 'restore', 'delete']), 'Aksi tidak valid.');
        $done = 0;
        $blocked = [];
        foreach (array_unique($input['ids']) as $id) {
            $i = ix($state[$type], $id);
            $r = $state[$type][$i];
            $used = false;
            foreach ($state as $k => $records) {
                if (
                    $k !== $type &&
                    !in_array($k, ['audit', 'requests', 'login_attempts', 'seq'], true) &&
                    is_array($records) &&
                    strpos(json_encode($records), '"' . $id . '"') !== false
                ) {
                    $used = true;
                }
            }
            if ($type === 'locations' && $used && $action !== 'restore') {
                $blocked[] = $r['name'];
                continue;
            }
            if ($action === 'delete') {
                if ($used) {
                    $blocked[] = $r['name'];
                    continue;
                }
                array_splice($state[$type], $i, 1);
            } else {
                $state[$type][$i]['active'] = $action === 'restore';
                $state[$type][$i]['version']++;
            }
            $done++;
        }
        return [
            'message' =>
                $done .
                ' data diproses.' .
                ($blocked ? ' Terhalang riwayat: ' . implode(', ', $blocked) : ''),
        ];
    }
}
