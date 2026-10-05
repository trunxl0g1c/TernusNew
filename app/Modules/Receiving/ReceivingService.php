<?php
declare(strict_types=1);
namespace Ternus\Modules\Receiving;

final class ReceivingService
{
    /** Command: receive. Called inside a repository transaction. */
    public static function receive(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $loc = $input['location'];
        location($state, $loc);
        unlocked($state, $loc);
        $date = docDate($state, $input['date']);
        need(
            in_array($input['source'], ['Kebun sendiri', 'Vendor', 'Saldo awal']),
            'Sumber tidak valid.',
        );
        $source = $input['source'];
        if ($source === 'Kebun sendiri' && \Ternus\Support\Business::config($state)['profile'] !== 'coffee') {
            $source = 'Sumber internal';
        }
        if ($source === 'Vendor') {
            $v = entity($state, 'suppliers', $input['supplier']);
            need($v['active'], 'Vendor diarsipkan.');
            $source .= ' · ' . $v['name'];
        } else {
            $source .= ' · ' . clean($input['origin'] ?? 'Sumber internal');
        }
        $d = doc($state, 'RCV', $actor, $date);
        $d += ['source' => $source, 'location' => $loc, 'status' => 'POSTED', 'lines' => []];
        need(count($input['lines']) > 0, 'Isi barang.');
        foreach ($input['lines'] as $r) {
            $p = product($state, $r['product']);
            $q = qty($p, $r['qty']);
            $cost = money($r['cost']);
            $b = batch(
                $state,
                $p['id'],
                $q,
                $cost,
                (bool) ($r['pending'] ?? false),
                $source,
                [],
                $d,
            );
            $d['lines'][] = ['product' => $p['id'], 'batch' => $b, 'qty' => $q, 'cost' => $cost];
            move($state, $b, $loc, 'available', $q, $d, 'Penerimaan');
        }
        $state['receipts'][] = $d;
        return ['id' => $d['id'], 'message' => 'Penerimaan disahkan; stok bertambah.'];
    }
}
