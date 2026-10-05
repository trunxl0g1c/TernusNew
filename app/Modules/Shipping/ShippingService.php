<?php
declare(strict_types=1);
namespace Ternus\Modules\Shipping;

final class ShippingService
{
    /** Command: ship. Called inside a repository transaction. */
    public static function ship(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $oi = ix($state['orders'], $input['id']);
        $o = $state['orders'][$oi];
        need(in_array($o['status'], ['CONFIRMED', 'PARTIAL']), 'Order tidak siap dikirim.');
        unlocked($state, $o['location']);
        $d = doc($state, 'DO', $actor, docDate($state, $input['date']));
        $d += [
            'order' => $o['id'],
            'customer_name' => $o['customer_name'],
            'location' => $o['location'],
            'status' => 'SHIPPED',
            'lines' => [],
        ];
        foreach ($input['lines'] as $r) {
            if ((float) $r['qty'] === 0) {
                continue;
            }
            $ai = ix($o['allocations'], $r['id']);
            $al = $o['allocations'][$ai];
            $line = entity(['x' => $o['lines']], 'x', $al['line']);
            $p = entity($state, 'products', $line['product']);
            $q = qty($p, $r['qty']);
            need($q <= $al['remaining'], 'Qty kirim melebihi reservasi.');
            $b = entity($state, 'batches', $al['batch']);
            move($state, $b['id'], $o['location'], 'available', -$q, $d, 'Penjualan');
            $o['allocations'][$ai]['remaining'] -= $q;
            $d['lines'][] = [
                'id' => uid(),
                'batch' => $b['id'],
                'product' => $p['id'],
                'qty' => $q,
                'returned' => 0,
                'cost' => batchCost($b, $q),
                'net' => (int) round(($line['net'] * $q) / $line['qty']),
            ];
        }
        need(count($d['lines']) > 0, 'Isi jumlah pengiriman.');
        $o['status'] = array_sum(array_column($o['allocations'], 'remaining'))
            ? 'PARTIAL'
            : 'FULFILLED';
        $state['orders'][$oi] = $o;
        $state['shipments'][] = $d;
        return ['id' => $d['id'], 'message' => 'Pengiriman disahkan; stok berkurang.'];
    }
}
