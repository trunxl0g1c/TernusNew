<?php
declare(strict_types=1);

// Shared documents functions. No HTTP or database side effects.
function today(): string
{
    return date('Y-m-d');
}

function docDate(array $s, $v): string
{
    $v = (string) ($v ?: today());
    $d = DateTime::createFromFormat('!Y-m-d', $v);
    need($d && $d->format('Y-m-d') === $v, 'Tanggal tidak valid.');
    need($v <= today(), 'Tanggal transaksi tidak boleh di masa depan.');
    need($v > ($s['settings']['closed_until'] ?? ''), 'Periode sudah ditutup.');
    return $v;
}

function number(array &$s, string $prefix): string
{
    $k = $prefix . date('Ym');
    $s['seq'][$k] = ($s['seq'][$k] ?? 0) + 1;
    return $prefix . '/' . date('Ym') . '/' . str_pad((string) $s['seq'][$k], 5, '0', STR_PAD_LEFT);
}

function doc(array &$s, string $prefix, array $u, string $date): array
{
    return [
        'id' => uid(),
        'number' => number($s, $prefix),
        'date' => $date,
        'created_at' => date(DATE_ATOM),
        'by' => $u['id'],
        'by_name' => $u['name'],
    ];
}
