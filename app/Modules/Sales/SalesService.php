<?php
declare(strict_types=1);
namespace Ternus\Modules\Sales;

final class SalesService
{
    /** Command: quote.create, order.create. Called inside a repository transaction. */
    public static function create(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin', 'sales']);
        $customer = entity($state, 'customers', $input['customer']);
        need($customer['active'], 'Pelanggan diarsipkan.');
        location($state, $input['location']);
        $lines = saleLines($state, $input['lines']);
        $d = doc(
            $state,
            $op === 'quote.create' ? 'QUO' : 'SO',
            $actor,
            docDate($state, $input['date']),
        );
        $d += [
            'customer' => $customer['id'],
            'customer_name' => $customer['name'],
            'address' => $customer['address'],
            'location' => $input['location'],
            'lines' => $lines,
            'shipping' => money($input['shipping'] ?? 0),
            'status' => 'DRAFT',
        ];
        $d['total'] = array_sum(array_column($lines, 'net')) + $d['shipping'];
        need($d['total'] > 0, 'Nilai penjualan harus lebih dari nol.');
        if ($op === 'quote.create') {
            $d['valid_until'] = $input['valid_until'];
            need(
                (bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $d['valid_until']) &&
                    $d['valid_until'] >= $d['date'],
                'Tanggal berlaku tidak valid.',
            );
            $state['quotes'][] = $d;
        } else {
            $d['quote'] = '';
            $d['allocations'] = [];
            $state['orders'][] = $d;
        }
        return ['id' => $d['id'], 'message' => 'Draft dibuat.'];
    }

    /** Command: quote.accept. Called inside a repository transaction. */
    public static function acceptQuote(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin', 'sales']);
        $i = ix($state['quotes'], $input['id']);
        own($actor, $state['quotes'][$i]);
        need($state['quotes'][$i]['status'] === 'DRAFT', 'Quotation sudah diproses.');
        need($state['quotes'][$i]['valid_until'] >= today(), 'Quotation kedaluwarsa.');
        $state['quotes'][$i]['status'] = 'ACCEPTED';
        return ['id' => $input['id'], 'message' => 'Penerimaan pelanggan dicatat.'];
    }

    /** Command: quote.convert. Called inside a repository transaction. */
    public static function convertQuote(
        array &$state,
        array $actor,
        string $op,
        array $input,
    ): array {
        permit($actor, ['owner', 'admin', 'sales']);
        $i = ix($state['quotes'], $input['id']);
        $q = $state['quotes'][$i];
        own($actor, $q);
        need($q['status'] === 'ACCEPTED', 'Quotation harus diterima dan belum dikonversi.');
        need($q['valid_until'] >= today(), 'Quotation kedaluwarsa.');
        $o = orderFrom($state, $q, $actor);
        $inv = draftInvoice($state, $o, $actor);
        $state['quotes'][$i]['status'] = 'CONVERTED';
        $state['quotes'][$i]['order'] = $o['id'];
        return [
            'id' => $inv['id'],
            'message' =>
                'Order dan draft invoice dibuat. Konfirmasi order untuk mencadangkan stok.',
        ];
    }

    /** Command: order.confirm. Called inside a repository transaction. */
    public static function confirmOrder(
        array &$state,
        array $actor,
        string $op,
        array $input,
    ): array {
        permit($actor, ['owner', 'admin', 'sales']);
        $i = ix($state['orders'], $input['id']);
        $o = $state['orders'][$i];
        own($actor, $o);
        need($o['status'] === 'DRAFT', 'Order sudah dikonfirmasi.');
        unlocked($state, $o['location']);
        $taken = [];
        $alloc = [];
        $orderedBatches = $state['batches'];
        usort(
            $orderedBatches,
            fn($input, $b) => strcmp($input['date'], $b['date']) ?:
            strcmp($input['number'], $b['number']),
        );
        foreach ($o['lines'] as $l) {
            product($state, $l['product']);
            $remaining = $l['qty'];
            foreach ($orderedBatches as $b) {
                if ($b['product'] !== $l['product']) {
                    continue;
                }
                $free = available($state, $b['id'], $o['location']) - ($taken[$b['id']] ?? 0);
                $take = min($remaining, max(0, $free));
                if ($take > 0) {
                    $alloc[] = [
                        'id' => uid(),
                        'line' => $l['id'],
                        'batch' => $b['id'],
                        'remaining' => $take,
                    ];
                    $taken[$b['id']] = ($taken[$b['id']] ?? 0) + $take;
                    $remaining -= $take;
                }
                if (!$remaining) {
                    break;
                }
            }
            need(!$remaining, 'Stok tidak cukup untuk ' . $l['name'] . '. Order tetap draft.');
        }
        $o['allocations'] = $alloc;
        $o['status'] = 'CONFIRMED';
        $state['orders'][$i] = $o;
        return ['id' => $o['id'], 'message' => 'Order dikonfirmasi; stok dicadangkan.'];
    }

    /** Command: order.cancel. Called inside a repository transaction. */
    public static function cancelOrder(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin', 'sales']);
        $i = ix($state['orders'], $input['id']);
        $o = $state['orders'][$i];
        own($actor, $o);
        need(
            in_array($o['status'], ['DRAFT', 'CONFIRMED']),
            'Hanya order belum terkirim yang dapat dibatalkan.',
        );
        foreach ($state['invoices'] as $v) {
            need(
                $v['order'] !== $o['id'] || $v['status'] !== 'ISSUED',
                'Invoice sudah terbit; selesaikan kredit dahulu.',
            );
        }
        $state['orders'][$i]['status'] = 'CANCELLED';
        $state['orders'][$i]['allocations'] = [];
        foreach ($state['invoices'] as &$v) {
            if ($v['order'] === $o['id']) {
                $v['status'] = 'VOID';
            }
        }
        unset($v);
        return ['id' => $o['id'], 'message' => 'Order dibatalkan; reservasi dilepas.'];
    }
}
