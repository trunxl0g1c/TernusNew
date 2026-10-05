<?php
declare(strict_types=1);
namespace Ternus\Modules\Invoices;
use DateTime;

final class InvoicesService
{
    /** Command: invoice.create. Called inside a repository transaction. */
    public static function create(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin', 'sales']);
        $o = entity($state, 'orders', $input['id']);
        own($actor, $o);
        need($o['status'] !== 'CANCELLED', 'Order dibatalkan.');
        $inv = draftInvoice($state, $o, $actor);
        return ['id' => $inv['id'], 'message' => 'Draft invoice siap.'];
    }

    /** Command: invoice.issue. Called inside a repository transaction. */
    public static function issue(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner', 'admin', 'sales']);
        $i = ix($state['invoices'], $input['id']);
        $v = $state['invoices'][$i];
        own($actor, $v);
        need($v['status'] === 'DRAFT', 'Invoice sudah diproses.');
        $o = entity($state, 'orders', $v['order']);
        need(
            in_array($o['status'], ['CONFIRMED', 'PARTIAL', 'FULFILLED']),
            'Konfirmasi order dahulu.',
        );
        $date = docDate($state, $input['date']);
        need($date >= $o['date'], 'Tanggal invoice tidak boleh sebelum order.');
        $due = (string) $input['due'];
        $check = DateTime::createFromFormat('!Y-m-d', $due);
        need(
            $check && $check->format('Y-m-d') === $due && $due >= $date,
            'Jatuh tempo tidak valid.',
        );
        $v['status'] = 'ISSUED';
        $v['date'] = $date;
        $v['due'] = $due;
        $v['company'] = $state['settings'];
        $state['invoices'][$i] = $v;
        return ['id' => $v['id'], 'message' => 'Invoice diterbitkan; tagihan aktif.'];
    }
}
