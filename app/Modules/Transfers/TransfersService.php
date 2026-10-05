<?php
declare(strict_types=1);
namespace Ternus\Modules\Transfers;

final class TransfersService
{
    /** Command: transfer.send. Called inside a repository transaction. */
    public static function send(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $from = $input['from'];
        $to = $input['to'];
        need($from !== $to, 'Lokasi harus berbeda.');
        location($state, $from);
        location($state, $to);
        unlocked($state, $from);
        $d = doc($state, 'TRF', $actor, docDate($state, $input['date']));
        $d += ['from' => $from, 'to' => $to, 'status' => 'IN_TRANSIT', 'lines' => []];
        need(count($input['lines']) > 0, 'Isi barang transfer.');
        foreach ($input['lines'] as $r) {
            $b = entity($state, 'batches', $r['batch']);
            $p = entity($state, 'products', $b['product']);
            $q = qty($p, $r['qty']);
            need(available($state, $b['id'], $from) >= $q, 'Stok transfer tidak mencukupi.');
            move($state, $b['id'], $from, 'available', -$q, $d, 'Transfer kirim');
            move($state, $b['id'], $from, 'transit', $q, $d, 'Transfer kirim');
            $d['lines'][] = ['id' => uid(), 'batch' => $b['id'], 'qty' => $q, 'received' => 0];
        }
        $state['transfers'][] = $d;
        return ['id' => $d['id'], 'message' => 'Barang dalam perjalanan.'];
    }

    /** Command: transfer.receive. Called inside a repository transaction. */
    public static function receive(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $i = ix($state['transfers'], $input['id']);
        $d = $state['transfers'][$i];
        need($d['status'] !== 'RECEIVED', 'Transfer selesai.');
        unlocked($state, $d['to']);
        unlocked($state, $d['from']);
        $post = $d;
        $post['date'] = docDate($state, $input['date']);
        $post['by_name'] = $actor['name'];
        $changed = 0;
        foreach ($input['lines'] as $r) {
            if ((float) $r['qty'] === 0) {
                continue;
            }
            $li = ix($d['lines'], $r['id']);
            $l = $d['lines'][$li];
            $b = entity($state, 'batches', $l['batch']);
            $p = entity($state, 'products', $b['product']);
            $q = qty($p, $r['qty']);
            need($q <= $l['qty'] - $l['received'], 'Jumlah penerimaan melebihi sisa.');
            move($state, $b['id'], $d['from'], 'transit', -$q, $post, 'Transfer terima');
            move($state, $b['id'], $d['to'], 'available', $q, $post, 'Transfer terima');
            $d['lines'][$li]['received'] += $q;
            $changed++;
        }
        need($changed > 0, 'Isi minimal satu penerimaan.');
        $d['status'] = count(array_filter($d['lines'], fn($l) => $l['qty'] !== $l['received']))
            ? 'PARTIAL_RECEIVED'
            : 'RECEIVED';
        $state['transfers'][$i] = $d;
        return ['id' => $d['id'], 'message' => 'Penerimaan transfer tersimpan.'];
    }
}
