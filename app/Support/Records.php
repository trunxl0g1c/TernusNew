<?php
declare(strict_types=1);

// Shared records functions. No HTTP or database side effects.
function findById(array $rows, string $id): ?array
{
    foreach ($rows as $r) {
        if ($r['id'] === $id) {
            return $r;
        }
    }
    return null;
}

function ix(array $rows, string $id): int
{
    foreach ($rows as $i => $r) {
        if ($r['id'] === $id) {
            return $i;
        }
    }
    throw new DomainException('Data tidak ditemukan.');
}

function entity(array $s, string $type, string $id): array
{
    $r = findById($s[$type], $id);
    need($r !== null, 'Data ' . $type . ' tidak ditemukan.');
    return $r;
}

function location(array $s, string $id): array
{
    $r = entity($s, 'locations', $id);
    need($r['active'], 'Lokasi tidak aktif.');
    return $r;
}

function product(array $s, string $id): array
{
    $r = entity($s, 'products', $id);
    need($r['active'], 'Barang diarsipkan.');
    return $r;
}
