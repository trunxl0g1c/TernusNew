<?php
declare(strict_types=1);
namespace Ternus\Modules\Stocktakes;

final class StocktakesService
{
    /** Command: opname.start. Called inside a repository transaction. */
    public static function start(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $loc = $input['location'];
        location($state, $loc);
        unlocked($state, $loc);
        $d = doc($state, 'OPN', $actor, docDate($state, today()));
        $d += ['location' => $loc, 'status' => 'COUNTING', 'lines' => []];
        foreach ($state['batches'] as $b) {
            foreach (['available', 'quarantine'] as $bucket) {
                $q = balance($state, $b['id'], $loc, $bucket);
                if ($q) {
                    $d['lines'][] = [
                        'id' => uid(),
                        'batch' => $b['id'],
                        'bucket' => $bucket,
                        'system' => $q,
                        'physical' => null,
                        'reason' => '',
                    ];
                }
            }
        }
        need(count($d['lines']) > 0, 'Tidak ada stok untuk dihitung.');
        $state['stocktakes'][] = $d;
        return [
            'id' => $d['id'],
            'message' => 'Lokasi dikunci sampai opname disetujui/dibatalkan.',
        ];
    }

    /** Command: opname.submit. Called inside a repository transaction. */
    public static function submit(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $i = ix($state['stocktakes'], $input['id']);
        $d = $state['stocktakes'][$i];
        need($d['status'] === 'COUNTING', 'Sesi tidak dapat diedit.');
        need(count($input['lines']) === count($d['lines']), 'Semua baris harus dihitung.');
        $seen = [];
        foreach ($input['lines'] as $r) {
            need(!isset($seen[$r['id']]), 'Baris opname ganda.');
            $seen[$r['id']] = true;
            $li = ix($d['lines'], $r['id']);
            $l = $d['lines'][$li];
            $b = entity($state, 'batches', $l['batch']);
            $p = entity($state, 'products', $b['product']);
            need(
                $r['qty'] !== '' && is_numeric($r['qty']) && (float) $r['qty'] >= 0,
                'Hasil hitung wajib termasuk jika nol.',
            );
            $q = (float) $r['qty'] == 0 ? 0 : qty($p, $r['qty']);
            $d['lines'][$li]['physical'] = $q;
            $d['lines'][$li]['reason'] = $q !== $l['system'] ? clean($r['reason'] ?? '') : '';
        }
        $d['status'] = 'SUBMITTED';
        $state['stocktakes'][$i] = $d;
        return ['id' => $d['id'], 'message' => 'Hasil diajukan kepada owner.'];
    }

    /** Command: opname.approve, opname.cancel. Called inside a repository transaction. */
    public static function review(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, $op === 'opname.approve' ? ['owner'] : ['owner', 'admin']);
        $i = ix($state['stocktakes'], $input['id']);
        $d = $state['stocktakes'][$i];
        need(in_array($d['status'], ['COUNTING', 'SUBMITTED']), 'Sesi selesai.');
        if ($op === 'opname.approve') {
            need($d['status'] === 'SUBMITTED', 'Ajukan hitungan dahulu.');
            $post = $d;
            $post['date'] = docDate($state, today());
            $post['by_name'] = $actor['name'];
            foreach ($d['lines'] as $l) {
                if ($l['bucket'] === 'available') {
                    need(
                        $l['physical'] >= reserved($state, $l['batch'], $d['location']),
                        'Saldo fisik di bawah reservasi. Batalkan order terkait dahulu.',
                    );
                }
                $delta = $l['physical'] - $l['system'];
                if ($delta) {
                    move(
                        $state,
                        $l['batch'],
                        $d['location'],
                        $l['bucket'],
                        $delta,
                        $post,
                        'Stok opname',
                    );
                }
            }
            $d['status'] = 'APPROVED';
        } else {
            $d['status'] = 'CANCELLED';
        }
        $state['stocktakes'][$i] = $d;
        return ['id' => $d['id'], 'message' => 'Sesi selesai; lokasi dibuka.'];
    }
}
