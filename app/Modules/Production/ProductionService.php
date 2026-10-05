<?php
declare(strict_types=1);
namespace Ternus\Modules\Production;

final class ProductionService
{
    /** Command: production.start. Called inside a repository transaction. */
    public static function start(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $loc = $input['location'];
        location($state, $loc);
        unlocked($state, $loc);
        $d = doc($state, 'PRD', $actor, docDate($state, $input['date']));
        $d += [
            'location' => $loc,
            'kind' => clean($input['kind']),
            'status' => 'IN_PROGRESS',
            'inputs' => [],
            'outputs' => [],
            'cost' => 0,
            'pending' => false,
        ];
        need(count($input['inputs']) > 0, 'Isi bahan input.');
        $totals = [];
        foreach ($input['inputs'] as $r) {
            $b = entity($state, 'batches', $r['batch']);
            $p = product($state, $b['product']);
            need($p['process'], 'Barang tidak diizinkan diproses.');
            $q = qty($p, $r['qty']);
            $totals[$b['id']] = ($totals[$b['id']] ?? 0) + $q;
            need(
                available($state, $b['id'], $loc) >= $totals[$b['id']],
                'Stok bahan tidak cukup atau dicadangkan.',
            );
            $d['inputs'][] = [
                'batch' => $b['id'],
                'product' => $p['id'],
                'qty' => $q,
                'cost' => batchCost($b, $q),
            ];
            $d['cost'] += batchCost($b, $q);
            $d['pending'] = $d['pending'] || $b['pending'];
        }
        foreach ($d['inputs'] as $r) {
            move($state, $r['batch'], $loc, 'available', -$r['qty'], $d, 'Mulai produksi');
            move($state, $r['batch'], $loc, 'wip', $r['qty'], $d, 'Mulai produksi');
        }
        $state['productions'][] = $d;
        return ['id' => $d['id'], 'message' => 'Proses dimulai; bahan masuk WIP.'];
    }

    /** Command: production.complete. Called inside a repository transaction. */
    public static function complete(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $i = ix($state['productions'], $input['id']);
        $d = $state['productions'][$i];
        need($d['status'] === 'IN_PROGRESS', 'Proses sudah selesai.');
        unlocked($state, $d['location']);
        $post = $d;
        $post['date'] = docDate($state, $input['date']);
        $post['by_name'] = $actor['name'];
        $extra = money($input['extra']);
        $total = $d['cost'] + $extra;
        $outputs = $input['outputs'];
        need(count($outputs) > 0, 'Isi hasil produksi.');
        $sum = 0;
        $mass = 0;
        $inmass = 0;
        $parents = [];
        foreach ($d['inputs'] as $r) {
            $p = entity($state, 'products', $r['product']);
            $inmass += $p['unit'] === 'kg' ? $r['qty'] : $r['qty'] * ($p['net_g'] ?? 0);
            $parents[] = ['batch' => $r['batch'], 'qty' => $r['qty']];
        }
        foreach ($outputs as $r) {
            $p = product($state, $r['product']);
            $q = qty($p, $r['qty']);
            $mass += $p['unit'] === 'kg' ? $q : $q * ($p['net_g'] ?? 0);
            $sum += money($r['cost']);
        }
        need(
            $sum === $total,
            'Total alokasi biaya output harus sama dengan biaya bahan + biaya proses: Rp' .
                number_format($total, 0, ',', '.'),
        );
        need(
            $mass <= $inmass || trim($input['note'] ?? '') !== '',
            'Hasil lebih berat dari bahan. Isi alasan pada catatan.',
        );
        foreach ($d['inputs'] as $r) {
            move($state, $r['batch'], $d['location'], 'wip', -$r['qty'], $post, 'Selesai produksi');
        }
        foreach ($outputs as $r) {
            $p = product($state, $r['product']);
            $q = qty($p, $r['qty']);
            $b = batch(
                $state,
                $p['id'],
                $q,
                money($r['cost']),
                $d['pending'],
                'Produksi ' . $d['number'],
                $parents,
                $post,
            );
            $d['outputs'][] = [
                'batch' => $b,
                'product' => $p['id'],
                'qty' => $q,
                'cost' => money($r['cost']),
            ];
            move($state, $b, $d['location'], 'available', $q, $post, 'Hasil produksi');
        }
        $d['status'] = 'COMPLETED';
        $d['finished'] = $post['date'];
        $d['extra'] = $extra;
        $d['loss'] = $inmass - $mass;
        $d['input_mass'] = $inmass;
        $d['note'] = substr($input['note'] ?? '', 0, 1000);
        $state['productions'][$i] = $d;
        return ['id' => $d['id'], 'message' => 'Hasil produksi masuk stok.'];
    }
}
