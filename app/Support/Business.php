<?php
declare(strict_types=1);
namespace Ternus\Support;

final class Business
{
    public static function catalog(): array
    {
        static $catalog = null;
        return $catalog ??= json_decode(
            file_get_contents(dirname(__DIR__) . '/business-catalog.json'),
            true,
            512,
            JSON_THROW_ON_ERROR,
        );
    }

    public static function config(array $state): array
    {
        $default = self::catalog()['profiles']['coffee'];
        $saved = $state['settings']['business'] ?? [];
        return [
            'profile' => $saved['profile'] ?? 'coffee',
            'modules' => array_replace($default['modules'], $saved['modules'] ?? []),
            'stages' => $saved['stages'] ?? $default['stages'],
            'processes' => $saved['processes'] ?? $default['processes'],
            'revision' => $saved['revision'] ?? 0,
        ];
    }

    public static function enabled(array $state, string $module): bool
    {
        $definition = self::catalog()['modules'][$module] ?? null;
        if (!$definition) return true;
        if (self::config($state)['modules'][$module] !== true) return false;
        foreach ($definition['depends'] as $dependency) {
            if (!self::enabled($state, $dependency)) return false;
        }
        return true;
    }

    public static function processes(array $state): array
    {
        $items = array_values(array_filter(self::config($state)['processes'], fn($p) => $p !== 'Pengemasan'));
        if (self::enabled($state, 'packaging')) $items[] = 'Pengemasan';
        return $items;
    }

    public static function guard(array $state, string $operation, array $input): void
    {
        foreach (self::catalog()['modules'] as $key => $definition) {
            if (in_array($operation, $definition['commands'], true)) {
                need(self::enabled($state, $key), 'Modul ' . $definition['label'] . ' nonaktif. Minta owner mengaktifkannya di Pengaturan Bisnis.');
            }
        }
        if (in_array($operation, ['production.start', 'production.complete'], true)) {
            $kind = $operation === 'production.start'
                ? trim((string) ($input['kind'] ?? ''))
                : (findById($state['productions'], $input['id'] ?? '')['kind'] ?? '');
            if ($kind === 'Pengemasan') {
                need(self::enabled($state, 'packaging'), 'Modul Pengemasan nonaktif. Aktifkan kembali sebelum melanjutkan.');
            }
            if ($operation === 'production.start') {
                need(in_array($kind, self::processes($state), true), 'Jenis proses tidak tersedia. Periksa Pengaturan Bisnis.');
            }
        }
    }

    private static function textList($value, string $label): array
    {
        need(is_array($value) && count($value) >= 1 && count($value) <= 100, $label . ' harus berisi 1–100 pilihan.');
        return array_values(array_unique(array_map(fn($item) => clean($item, 100), $value)));
    }

    public static function save(array &$state, array $actor, string $operation, array $input): array
    {
        permit($actor, ['owner']);
        $catalog = self::catalog();
        $old = self::config($state);
        need(($input['revision'] ?? -1) === $old['revision'], 'Pengaturan berubah oleh pengguna lain. Muat ulang sebelum menyimpan.');
        $profile = $input['profile'] ?? '';
        need(is_string($profile) && isset($catalog['profiles'][$profile]), 'Profil usaha tidak valid.');
        $modules = $input['modules'] ?? null;
        need(is_array($modules), 'Pilihan modul tidak valid.');
        need(count($modules) === count($catalog['modules']), 'Kirim semua pilihan modul.');
        foreach ($catalog['modules'] as $key => $definition) {
            need(array_key_exists($key, $modules) && is_bool($modules[$key]), 'Pilihan modul ' . $key . ' harus aktif atau nonaktif.');
            if (!$modules[$key]) continue;
            foreach ($definition['depends'] as $dependency) {
                need(($modules[$dependency] ?? false) === true, $definition['label'] . ' membutuhkan ' . $catalog['modules'][$dependency]['label'] . '.');
            }
        }
        $stages = self::textList($input['stages'] ?? null, 'Kategori / tahap');
        $processes = self::textList($input['processes'] ?? null, 'Jenis proses');
        need(!in_array('Pengemasan', $processes, true), 'Pengemasan diatur melalui pilihan modul, bukan daftar proses.');
        $state['settings']['business'] = [
            'profile' => $profile,
            'modules' => $modules,
            'stages' => $stages,
            'processes' => $processes,
            'revision' => $old['revision'] + 1,
        ];
        return ['message' => 'Pengaturan bisnis tersimpan. Data dan riwayat sebelumnya tetap tersedia.'];
    }
}
