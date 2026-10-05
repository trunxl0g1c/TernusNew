<?php
declare(strict_types=1);

// Shared stock functions. No HTTP or database side effects.
function reserved(array $s, string $batch, string $loc): int
{
    $n = 0;
    foreach ($s['orders'] as $o) {
        foreach ($o['allocations'] ?? [] as $a) {
            if ($a['batch'] === $batch && $o['location'] === $loc) {
                $n += $a['remaining'];
            }
        }
    }
    return $n;
}

function balance(array $s, string $batch, string $loc, string $bucket = 'available'): int
{
    $n = 0;
    foreach ($s['ledger'] as $l) {
        if ($l['batch'] === $batch && $l['location'] === $loc && $l['bucket'] === $bucket) {
            $n += $l['qty'];
        }
    }
    return $n;
}

function available(array $s, string $batch, string $loc): int
{
    return balance($s, $batch, $loc) - reserved($s, $batch, $loc);
}

function unlocked(array $s, string $loc): void
{
    foreach ($s['stocktakes'] as $o) {
        need(
            $o['location'] !== $loc || !in_array($o['status'], ['COUNTING', 'SUBMITTED']),
            'Lokasi sedang dikunci untuk stok opname.',
        );
    }
}

function move(
    array &$s,
    string $batch,
    string $loc,
    string $bucket,
    int $q,
    array $document,
    string $kind,
): void {
    need(balance($s, $batch, $loc, $bucket) + $q >= 0, 'Saldo stok tidak mencukupi.');
    $b = entity($s, 'batches', $batch);
    foreach ($s['ledger'] as $prior) {
        if ($prior['batch'] === $batch) {
            need(
                $document['date'] >= $prior['date'],
                'Tanggal mutasi batch tidak boleh sebelum mutasi terakhir.',
            );
        }
    }
    $s['ledger'][] = [
        'id' => uid(),
        'batch' => $batch,
        'product' => $b['product'],
        'location' => $loc,
        'bucket' => $bucket,
        'qty' => $q,
        'date' => $document['date'],
        'time' => date(DATE_ATOM),
        'document' => $document['number'],
        'document_id' => $document['id'],
        'kind' => $kind,
        'by' => $document['by_name'],
    ];
}

function batch(
    array &$s,
    string $product,
    int $q,
    int $cost,
    bool $pending,
    string $source,
    array $parents,
    array $document,
): string {
    $id = uid();
    $s['batches'][] = [
        'id' => $id,
        'number' => number($s, 'BAT'),
        'product' => $product,
        'initial_qty' => $q,
        'cost' => $cost,
        'pending' => $pending,
        'source' => $source,
        'parents' => $parents,
        'date' => $document['date'],
        'document' => $document['number'],
    ];
    return $id;
}

function batchCost(array $b, int $q): int
{
    return (int) round(($b['cost'] * $q) / $b['initial_qty']);
}
