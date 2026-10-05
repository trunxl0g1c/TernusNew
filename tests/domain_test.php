<?php
// Jalankan melalui CLI. Tidak memakai atau mengubah database operasional.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit();
}
require dirname(__DIR__) . '/server/domain.php';
$s = initialState('Test Owner', 'owner@example.test', 'TestingOnly-12345');
$owner = $s['users'][0];
if (isset($domainRepository)) $domainRepository->install($s);
$count = 0;
function ok(bool $value, string $message): void
{
    global $count;
    if (!$value) {
        throw new RuntimeException('FAIL: ' . $message);
    }
    $count++;
    echo 'PASS ' . $message . PHP_EOL;
}
function runOp(string $op, array $a, ?array $user = null): array
{
    global $s, $owner, $domainRepository;
    if (isset($domainRepository)) {
        $r = $domainRepository->transaction(function (array &$state) use ($op, $a, $user, $owner): array {
            return operate($state, $user ?? $owner, $op, $a);
        });
        $s = $domainRepository->read();
        return $r;
    }
    $working = $s;
    $r = operate($working, $user ?? $owner, $op, $a);
    $s = $working;
    return $r;
}
function fails(string $op, array $a, ?array $u = null): void
{
    try {
        runOp($op, $a, $u);
    } catch (DomainException $e) {
        ok(true, 'Menolak ' . $op . ' — ' . $e->getMessage());
        return;
    }
    throw new RuntimeException('FAIL: seharusnya ditolak ' . $op);
}
$loc = $s['locations'][1]['id'];
$store = $s['locations'][2]['id'];
$p = runOp('master.save', [
    'type' => 'products',
    'name' => 'Test Green',
    'sku' => 'TEST-GREEN',
    'unit' => 'kg',
    'stage' => 'Greenbeans',
    'cost' => 100000,
    'price' => 200000,
    'sell' => true,
    'process' => true,
])['id'];
$roast = runOp('master.save', [
    'type' => 'products',
    'name' => 'Test Roast',
    'sku' => 'TEST-ROAST',
    'unit' => 'kg',
    'stage' => 'Roasted',
    'cost' => 0,
    'price' => 250000,
    'sell' => true,
    'process' => true,
])['id'];
$customer = runOp('master.save', [
    'type' => 'customers',
    'name' => 'Test Customer',
    'kind' => 'Retail',
    'address' => 'Jl. Contoh 1',
])['id'];
runOp('receive', [
    'location' => $loc,
    'date' => today(),
    'source' => 'Kebun sendiri',
    'origin' => 'Kebun A',
    'lines' => [['product' => $p, 'qty' => 6, 'cost' => 600000]],
]);
$a = end($s['batches'])['id'];
runOp('receive', [
    'location' => $loc,
    'date' => today(),
    'source' => 'Saldo awal',
    'origin' => 'Batch B',
    'lines' => [['product' => $p, 'qty' => 4, 'cost' => 360000]],
]);
$b = end($s['batches'])['id'];
ok(balance($s, $a, $loc) === 6000, 'Penerimaan 6 kg tersimpan 6000 gram');
$pr = runOp('production.start', [
    'date' => today(),
    'location' => $loc,
    'kind' => 'Roasting',
    'inputs' => [['batch' => $a, 'qty' => 6], ['batch' => $b, 'qty' => 4]],
])['id'];
ok(
    balance($s, $a, $loc) === 0 && balance($s, $a, $loc, 'wip') === 6000,
    'Mulai produksi memindahkan ke WIP',
);
fails('production.complete', [
    'id' => $pr,
    'date' => today(),
    'extra' => 90000,
    'outputs' => [['product' => $roast, 'qty' => 8.4, 'cost' => 1]],
]);
runOp('production.complete', [
    'id' => $pr,
    'date' => today(),
    'extra' => 90000,
    'outputs' => [['product' => $roast, 'qty' => 8.4, 'cost' => 1050000]],
]);
$r = end($s['batches'])['id'];
ok(entity($s, 'productions', $pr)['loss'] === 1600, 'Susut roasting 1.6 kg');
ok(count(entity($s, 'batches', $r)['parents']) === 2, 'Campuran mempunyai dua induk');
ok(batchCost(entity($s, 'batches', $r), 1000) === 125000, 'HPP contoh Rp125000 per kg');
fails('production.complete', ['id' => $pr, 'date' => today(), 'extra' => 0, 'outputs' => []]);
$tr = runOp('transfer.send', [
    'from' => $loc,
    'to' => $store,
    'date' => today(),
    'lines' => [['batch' => $r, 'qty' => 4]],
])['id'];
$tl = entity($s, 'transfers', $tr)['lines'][0]['id'];
runOp('transfer.receive', ['id' => $tr, 'date' => today(), 'lines' => [['id' => $tl, 'qty' => 3]]]);
ok(
    balance($s, $r, $loc, 'transit') === 1000 && balance($s, $r, $store) === 3000,
    'Transfer diterima sebagian',
);
runOp('transfer.receive', ['id' => $tr, 'date' => today(), 'lines' => [['id' => $tl, 'qty' => 1]]]);
ok(
    entity($s, 'transfers', $tr)['status'] === 'RECEIVED',
    'Transfer ditutup setelah seluruhnya diterima',
);
$q = runOp('quote.create', [
    'date' => today(),
    'valid_until' => today(),
    'customer' => $customer,
    'location' => $store,
    'shipping' => 0,
    'lines' => [['product' => $roast, 'qty' => 4, 'price' => 250000, 'discount' => 0]],
])['id'];
runOp('quote.accept', ['id' => $q]);
runOp('quote.convert', ['id' => $q]);
$o = end($s['orders'])['id'];
$inv = end($s['invoices'])['id'];
fails('quote.convert', ['id' => $q]);
runOp('order.confirm', ['id' => $o]);
ok(
    available($s, $r, $store) === 0 && balance($s, $r, $store) === 4000,
    'Order mencadangkan tanpa memotong fisik',
);
$o2 = runOp('order.create', [
    'date' => today(),
    'customer' => $customer,
    'location' => $store,
    'lines' => [['product' => $roast, 'qty' => 1, 'price' => 250000]],
    'shipping' => 0,
])['id'];
fails('order.confirm', ['id' => $o2]);
runOp('invoice.issue', ['id' => $inv, 'date' => today(), 'due' => today()]);
ok(balance($s, $r, $store) === 4000, 'Terbit invoice tidak memotong stok');
$al = entity($s, 'orders', $o)['allocations'][0]['id'];
runOp('ship', ['id' => $o, 'date' => today(), 'lines' => [['id' => $al, 'qty' => 2.5]]]);
ok(
    balance($s, $r, $store) === 1500 && reserved($s, $r, $store) === 1500,
    'Pengiriman parsial melepas reservasi tepat',
);
runOp('ship', ['id' => $o, 'date' => today(), 'lines' => [['id' => $al, 'qty' => 1.5]]]);
$sh = end($s['shipments']);
ok(entity($s, 'orders', $o)['status'] === 'FULFILLED', 'Order fulfilled');
runOp('pay', ['invoice' => $inv, 'date' => today(), 'amount' => 400000, 'note' => 'Reference A']);
ok(
    invoiceBalance($s, entity($s, 'invoices', $inv))['outstanding'] === 600000,
    'Pembayaran parsial',
);
fails('pay', ['invoice' => $inv, 'date' => today(), 'amount' => 600001, 'note' => 'Overpay']);
runOp('pay', ['invoice' => $inv, 'date' => today(), 'amount' => 600000, 'note' => 'Reference B']);
runOp('credit', [
    'invoice' => $inv,
    'date' => today(),
    'amount' => 100000,
    'note' => 'Diskon koreksi',
]);
ok(
    invoiceBalance($s, entity($s, 'invoices', $inv))['refundable'] === 100000,
    'Kredit setelah lunas menghasilkan refund payable',
);
runOp('refund', [
    'invoice' => $inv,
    'date' => today(),
    'amount' => 100000,
    'note' => 'Transfer balik',
]);
ok(
    invoiceBalance($s, entity($s, 'invoices', $inv))['outstanding'] === 0,
    'Refund tidak membuka piutang',
);
$ret = runOp('return', [
    'shipment' => $sh['id'],
    'location' => $store,
    'date' => today(),
    'note' => 'Retur uji',
    'lines' => [['id' => $sh['lines'][0]['id'], 'qty' => 0.5]],
])['id'];
ok(
    balance($s, $r, $store, 'quarantine') === 500 && balance($s, $r, $store) === 0,
    'Retur masuk karantina',
);
runOp('return.release', ['id' => $ret]);
ok(balance($s, $r, $store) === 500, 'Lolos inspeksi menambah stok tersedia');
$op = runOp('opname.start', ['location' => $store])['id'];
fails('transfer.send', [
    'from' => $store,
    'to' => $loc,
    'date' => today(),
    'lines' => [['batch' => $r, 'qty' => 0.1]],
]);
$ol = entity($s, 'stocktakes', $op)['lines'][0]['id'];
runOp('opname.submit', [
    'id' => $op,
    'lines' => [['id' => $ol, 'qty' => 0.4, 'reason' => 'Selisih timbang']],
]);
runOp('opname.approve', ['id' => $op]);
ok(balance($s, $r, $store) === 400, 'Opname memposting selisih');
fails('opname.approve', ['id' => $op]);
$asset = runOp('asset.create', [
    'name' => 'Laptop uji',
    'serial' => 'TEST001',
    'location' => $loc,
    'date' => today(),
    'pic' => 'Admin',
    'cost' => 1000000,
])['id'];
runOp('asset.event', ['id' => $asset, 'event' => 'loan', 'pic' => 'Sales A', 'note' => 'Pinjaman']);
fails('asset.event', ['id' => $asset, 'event' => 'loan', 'pic' => 'Sales B', 'note' => 'Ganda']);
runOp('asset.event', [
    'id' => $asset,
    'event' => 'return',
    'condition' => 'Rusak Ringan',
    'note' => 'Kembali',
]);
ok(entity($s, 'assets', $asset)['status'] === 'MAINTENANCE', 'Aset kembali rusak masuk perawatan');
$sales = [
    'id' => 'sales-test',
    'name' => 'Sales',
    'role' => 'sales',
    'active' => true,
    'email' => 'sales@test',
];
fails('receive', [], $sales);
fails('credit', [], $sales);
$view = viewState($s, $sales);
ok(
    count($view['invoices']) === 0 &&
        count($view['users']) === 0 &&
        !isset($view['batches'][0]['cost']),
    'Scope dan biaya tersembunyi dari sales lain',
);
$product = entity($s, 'products', $p);
fails('master.save', array_merge($product, ['type' => 'products', 'version' => 0]));
foreach ($s['batches'] as $bt) {
    foreach ($s['locations'] as $lo) {
        foreach (['available', 'wip', 'transit', 'quarantine'] as $bucket) {
            need(balance($s, $bt['id'], $lo['id'], $bucket) >= 0, 'Negative ledger');
        }
    }
}
ok(true, 'Seluruh saldo nonnegatif');
echo "\n$count pemeriksaan lulus.\n";
