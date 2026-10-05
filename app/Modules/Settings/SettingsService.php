<?php
declare(strict_types=1);
namespace Ternus\Modules\Settings;
use DateTime;

final class SettingsService
{
    /** Command: settings. Called inside a repository transaction. */
    public static function save(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner']);
        $cut = $input['closed_until'] ?? '';
        if ($cut !== '') {
            $cd = DateTime::createFromFormat('!Y-m-d', $cut);
            need(
                $cd && $cd->format('Y-m-d') === $cut && $cut <= today(),
                'Tanggal tutup periode tidak valid.',
            );
        }
        $state['settings'] = [
            ...$state['settings'],
            'company' => clean($input['company']),
            'address' => substr($input['address'] ?? '', 0, 500),
            'phone' => substr($input['phone'] ?? '', 0, 50),
            'bank' => substr($input['bank'] ?? '', 0, 500),
            'closed_until' => $input['closed_until'] ?? '',
        ];
        return ['message' => 'Pengaturan tersimpan.'];
    }
}
