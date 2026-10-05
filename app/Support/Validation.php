<?php
declare(strict_types=1);

// Shared validation functions. No HTTP or database side effects.
function need($ok, string $message): void
{
    if (!$ok) {
        throw new DomainException($message);
    }
}

function clean($v, int $max = 200): string
{
    need(is_scalar($v), 'Nilai teks tidak valid.');
    $s = trim((string) $v);
    need($s !== '' && strlen($s) <= $max, 'Kolom wajib kosong atau terlalu panjang.');
    return $s;
}

function integer($v, int $min = 0, int $max = 100000000000): int
{
    need(
        is_numeric($v) &&
            (float) $v == floor((float) $v) &&
            (float) $v >= $min &&
            (float) $v <= $max,
        'Nilai harus berupa bilangan bulat dalam rentang yang diperbolehkan.',
    );
    return (int) $v;
}

function money($v): int
{
    return integer($v, 0, 100000000000);
}

function qty(array $p, $value): int
{
    need(
        is_numeric($value) && (float) $value > 0 && (float) $value < 100000000,
        'Kuantitas harus lebih dari nol.',
    );
    $n = (float) $value * ($p['unit'] === 'kg' ? 1000 : 1);
    need(abs($n - round($n)) < 0.00001, 'Kuantitas kg maksimal 3 desimal; pcs harus bulat.');
    return (int) round($n);
}
