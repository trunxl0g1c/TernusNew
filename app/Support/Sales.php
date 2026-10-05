<?php
declare(strict_types=1);

// Shared sales functions. No HTTP or database side effects.
function invoiceBalance(array $s, array $inv): array
{
    $paid = 0;
    $credit = 0;
    $refund = 0;
    foreach ($s['payments'] as $p) {
        if ($p['invoice'] === $inv['id']) {
            $paid += $p['amount'];
        }
    }
    foreach ($s['credits'] as $p) {
        if ($p['invoice'] === $inv['id']) {
            $credit += $p['amount'];
        }
    }
    foreach ($s['refunds'] as $p) {
        if ($p['invoice'] === $inv['id']) {
            $refund += $p['amount'];
        }
    }
    $net = $inv['total'] - $credit;
    $held = $paid - $refund;
    return [
        'paid' => $paid,
        'credit' => $credit,
        'refund' => $refund,
        'outstanding' => max($net - $held, 0),
        'refundable' => max($held - $net, 0),
    ];
}

function saleLines(array $s, array $rows): array
{
    need(count($rows) > 0 && count($rows) <= 100, 'Isi minimal satu baris barang.');
    $lines = [];
    foreach ($rows as $r) {
        $p = product($s, $r['product']);
        need($p['sell'], 'Barang ini tidak untuk dijual.');
        $q = qty($p, $r['qty']);
        $price = money($r['price']);
        $gross = (int) round(($q * $price) / ($p['unit'] === 'kg' ? 1000 : 1));
        $discount = money($r['discount'] ?? 0);
        need($discount <= $gross, 'Diskon melebihi nilai barang.');
        $lines[] = [
            'id' => uid(),
            'product' => $p['id'],
            'name' => $p['name'],
            'sku' => $p['sku'],
            'unit' => $p['unit'],
            'qty' => $q,
            'price' => $price,
            'discount' => $discount,
            'net' => $gross - $discount,
        ];
    }
    return $lines;
}

function orderFrom(array &$s, array $quote, array $u): array
{
    $o = doc($s, 'SO', $u, today());
    $o += [
        'customer' => $quote['customer'],
        'customer_name' => $quote['customer_name'],
        'address' => $quote['address'] ?? '',
        'location' => $quote['location'],
        'lines' => $quote['lines'],
        'shipping' => $quote['shipping'],
        'total' => $quote['total'],
        'quote' => $quote['id'],
        'status' => 'DRAFT',
        'allocations' => [],
    ];
    $s['orders'][] = $o;
    return $o;
}

function draftInvoice(array &$s, array $o, array $u): array
{
    foreach ($s['invoices'] as $i) {
        if ($i['order'] === $o['id']) {
            return $i;
        }
    }
    $i = doc($s, 'INV', $u, today());
    $i += [
        'order' => $o['id'],
        'customer' => $o['customer'],
        'customer_name' => $o['customer_name'],
        'address' => $o['address'] ?? '',
        'lines' => $o['lines'],
        'shipping' => $o['shipping'],
        'total' => $o['total'],
        'status' => 'DRAFT',
        'due' => today(),
        'company' => $s['settings'],
    ];
    $s['invoices'][] = $i;
    return $i;
}
