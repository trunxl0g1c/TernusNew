<?php
declare(strict_types=1);
namespace Ternus\Modules\Returns;

final class ReturnsService
{
    /** Command: return. Called inside a repository transaction. */
    public static function receive(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $si = ix($state['shipments'], $input['shipment']);
        $sh = $state['shipments'][$si];
        $loc = $input['location'];
        location($state, $loc);
        unlocked($state, $loc);
        $d = doc($state, 'RET', $actor, docDate($state, $input['date']));
        $d += [
            'shipment' => $sh['id'],
            'location' => $loc,
            'status' => 'QUARANTINE',
            'note' => clean($input['note']),
            'lines' => [],
        ];
        foreach ($input['lines'] as $r) {
            if ((float) $r['qty'] === 0) {
                continue;
            }
            $li = ix($sh['lines'], $r['id']);
            $l = $sh['lines'][$li];
            $p = entity($state, 'products', $l['product']);
            $q = qty($p, $r['qty']);
            need($q <= $l['qty'] - $l['returned'], 'Retur melebihi jumlah terkirim.');
            move($state, $l['batch'], $loc, 'quarantine', $q, $d, 'Retur');
            $sh['lines'][$li]['returned'] += $q;
            $d['lines'][] = ['batch' => $l['batch'], 'qty' => $q];
        }
        need(count($d['lines']) > 0, 'Isi jumlah retur.');
        $state['shipments'][$si] = $sh;
        $state['returns'][] = $d;
        return [
            'id' => $d['id'],
            'message' => 'Retur masuk karantina. Nota kredit dicatat terpisah.',
        ];
    }

    /** Command: return.release. Called inside a repository transaction. */
    public static function release(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $i = ix($state['returns'], $input['id']);
        $d = $state['returns'][$i];
        need($d['status'] === 'QUARANTINE', 'Retur sudah dilepas.');
        unlocked($state, $d['location']);
        $post = $d;
        $post['date'] = docDate($state, today());
        foreach ($d['lines'] as $l) {
            move(
                $state,
                $l['batch'],
                $d['location'],
                'quarantine',
                -$l['qty'],
                $post,
                'Lolos inspeksi',
            );
            move(
                $state,
                $l['batch'],
                $d['location'],
                'available',
                $l['qty'],
                $post,
                'Lolos inspeksi',
            );
        }
        $state['returns'][$i]['status'] = 'RELEASED';
        return ['id' => $d['id'], 'message' => 'Retur lolos inspeksi; stok tersedia.'];
    }
}
