<?php
declare(strict_types=1);
namespace Ternus\Modules\OfficeAssets;
use DomainException;

final class OfficeAssetsService
{
    /** Command: asset.create. Called inside a repository transaction. */
    public static function create(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        location($state, $input['location']);
        $d = doc($state, 'AST', $actor, docDate($state, $input['date']));
        $d += [
            'name' => clean($input['name']),
            'serial' => trim($input['serial'] ?? ''),
            'location' => $input['location'],
            'pic' => clean($input['pic']),
            'cost' => money($input['cost']),
            'condition' => 'Baik',
            'status' => 'AVAILABLE',
        ];
        if ($d['serial'] !== '') {
            foreach ($state['assets'] as $v) {
                need($v['serial'] !== $d['serial'], 'Serial sudah digunakan.');
            }
        }
        $state['assets'][] = $d;
        return ['id' => $d['id'], 'message' => 'Aset dicatat.'];
    }

    /** Command: asset.event. Called inside a repository transaction. */
    public static function recordEvent(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin']);
        $i = ix($state['assets'], $input['id']);
        $asset = $state['assets'][$i];
        $event = $input['event'];
        $d = doc($state, 'ASE', $actor, docDate($state, today()));
        $d += [
            'asset' => $asset['id'],
            'event' => $event,
            'note' => clean($input['note']),
            'before' => $asset,
        ];
        if ($event === 'loan') {
            need(in_array($asset['status'], ['AVAILABLE', 'IN_USE']), 'Aset tidak siap dipinjam.');
            $asset['status'] = 'ON_LOAN';
            $asset['pic'] = clean($input['pic']);
        } elseif ($event === 'return') {
            need($asset['status'] === 'ON_LOAN', 'Aset tidak sedang dipinjam.');
            $asset['condition'] = clean($input['condition']);
            $asset['status'] = $asset['condition'] === 'Baik' ? 'AVAILABLE' : 'MAINTENANCE';
        } elseif ($event === 'maintenance') {
            need(in_array($asset['status'], ['AVAILABLE', 'IN_USE']), 'Status aset tidak sesuai.');
            $asset['status'] = 'MAINTENANCE';
        } elseif ($event === 'ready') {
            need($asset['status'] === 'MAINTENANCE', 'Aset bukan dalam perawatan.');
            $asset['status'] = 'AVAILABLE';
            $asset['condition'] = 'Baik';
        } elseif ($event === 'move') {
            need(in_array($asset['status'], ['AVAILABLE', 'IN_USE']), 'Aset belum dapat dipindah.');
            location($state, $input['location']);
            $asset['location'] = $input['location'];
            $asset['pic'] = clean($input['pic']);
        } elseif ($event === 'retire') {
            permit($actor, ['owner']);
            need(
                $asset['status'] !== 'ON_LOAN' && $asset['status'] !== 'RETIRED',
                'Selesaikan pinjaman dahulu.',
            );
            $asset['status'] = 'RETIRED';
        } else {
            throw new DomainException('Aksi aset tidak dikenal.');
        }
        $d['after'] = $asset;
        $state['asset_events'][] = $d;
        $state['assets'][$i] = $asset;
        return ['id' => $asset['id'], 'message' => 'Riwayat aset diperbarui.'];
    }
}
