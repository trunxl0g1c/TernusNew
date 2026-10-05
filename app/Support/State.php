<?php
declare(strict_types=1);

// Shared state functions. No HTTP or database side effects.
function initialState(string $name, string $email, string $pass): array
{
    $s = [
        'settings' => [
            'company' => 'Teras Nusantara',
            'address' => '',
            'phone' => '',
            'bank' => '',
            'closed_until' => '',
        ],
        'seq' => [],
        'requests' => [],
        'login_attempts' => [],
    ];
    foreach (
        [
            'products',
            'customers',
            'suppliers',
            'users',
            'locations',
            'terms',
            'batches',
            'ledger',
            'receipts',
            'productions',
            'transfers',
            'quotes',
            'orders',
            'shipments',
            'invoices',
            'payments',
            'credits',
            'refunds',
            'returns',
            'stocktakes',
            'assets',
            'asset_events',
            'audit',
        ]
        as $key
    ) {
        $s[$key] = [];
    }
    $s['users'][] = [
        'id' => uid(),
        'name' => $name,
        'email' => $email,
        'password' => password_hash($pass, PASSWORD_DEFAULT),
        'role' => 'owner',
        'active' => true,
    ];
    foreach (['Kebun', 'Gudang', 'Store'] as $v) {
        $s['locations'][] = ['id' => uid(), 'name' => $v, 'active' => true, 'version' => 1];
    }
    foreach (
        [
            'Cherry Arabica' => 'CHR-ARB',
            'Gabah' => 'GBH',
            'Green Beans' => 'GRB',
            'Roasted Beans' => 'RST',
            'Ground Coffee' => 'GRD',
            'Natural' => 'NAT',
            'Full Washed' => 'FWS',
            'Honey' => 'HNY',
            'Pouch' => 'PCH',
        ]
        as $v => $code
    ) {
        $s['terms'][] = [
            'id' => uid(),
            'name' => $v,
            'code' => $code,
            'active' => true,
            'version' => 1,
        ];
    }
    $seed = json_decode(file_get_contents(dirname(__DIR__, 2) . '/server/products.json'), true);
    foreach ($seed as $p) {
        $s['products'][] = array_merge($p, [
            'id' => uid(),
            'active' => true,
            'version' => 1,
            'minimum' => 0,
        ]);
    }
    return $s;
}

function viewState(array $s, array $u): array
{
    $s['business_catalog'] = \Ternus\Support\Business::catalog();
    $s['settings']['business'] = \Ternus\Support\Business::config($s);
    unset($s['requests'], $s['login_attempts']);
    foreach ($s['users'] as &$v) {
        unset($v['password']);
    }
    unset($v);
    foreach ($s['invoices'] as &$i) {
        $i = array_merge($i, invoiceBalance($s, $i));
    }
    unset($i);
    $s['stock'] = [];
    foreach ($s['batches'] as $b) {
        foreach ($s['locations'] as $loc) {
            $row = [
                'batch' => $b['id'],
                'product' => $b['product'],
                'location' => $loc['id'],
                'reserved' => reserved($s, $b['id'], $loc['id']),
            ];
            $total = 0;
            foreach (['available', 'wip', 'transit', 'quarantine'] as $bucket) {
                $row[$bucket] = balance($s, $b['id'], $loc['id'], $bucket);
                $total += $row[$bucket];
            }
            $row['free'] = $row['available'] - $row['reserved'];
            if ($total || $row['reserved']) {
                $s['stock'][] = $row;
            }
        }
    }
    if ($u['role'] === 'sales') {
        $allowed = [];
        foreach (['quotes', 'orders', 'invoices'] as $key) {
            $s[$key] = array_values(array_filter($s[$key], fn($x) => $x['by'] === $u['id']));
            foreach ($s[$key] as $r) {
                $allowed[$r['id']] = true;
            }
        }
        foreach (['payments', 'credits', 'refunds'] as $key) {
            $s[$key] = array_values(
                array_filter($s[$key], fn($x) => isset($allowed[$x['invoice']])),
            );
        }
        $s['shipments'] = array_values(
            array_filter($s['shipments'], fn($x) => isset($allowed[$x['order']])),
        );
        foreach ($s['shipments'] as &$v) {
            foreach ($v['lines'] as &$line) {
                unset($line['cost']);
            }
            unset($line);
        }
        unset($v);
        foreach ($s['products'] as &$v) {
            unset($v['cost']);
        }
        unset($v);
        foreach ($s['batches'] as &$v) {
            unset($v['cost'], $v['source'], $v['parents']);
        }
        unset($v);
        foreach (
            [
                'users',
                'audit',
                'receipts',
                'productions',
                'transfers',
                'stocktakes',
                'assets',
                'asset_events',
                'suppliers',
                'ledger',
                'returns',
            ]
            as $key
        ) {
            $s[$key] = [];
        }
    }
    return $s;
}
