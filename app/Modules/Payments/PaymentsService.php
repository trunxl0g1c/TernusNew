<?php
declare(strict_types=1);
namespace Ternus\Modules\Payments;

final class PaymentsService
{
    /** Command: pay, credit, refund. Called inside a repository transaction. */
    public static function record(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, $op === 'pay' ? ['owner', 'admin'] : ['owner']);
        $v = entity($state, 'invoices', $input['invoice']);
        need($v['status'] === 'ISSUED', 'Invoice belum terbit.');
        $b = invoiceBalance($state, $v);
        $amount = integer($input['amount'], 1);
        $d = doc(
            $state,
            $op === 'pay' ? 'PAY' : ($op === 'credit' ? 'CN' : 'REF'),
            $actor,
            docDate($state, $input['date']),
        );
        need($d['date'] >= $v['date'], 'Tanggal tidak boleh sebelum invoice.');
        $d += [
            'invoice' => $v['id'],
            'amount' => $amount,
            'note' => clean($input['note'], 500),
            'method' => $input['method'] ?? 'Transfer',
        ];
        if ($op === 'pay') {
            need($amount <= $b['outstanding'], 'Pembayaran melebihi sisa tagihan.');
            $state['payments'][] = $d;
        } elseif ($op === 'credit') {
            need(
                $amount <= $v['total'] - $b['credit'],
                'Nota kredit melebihi nilai yang belum dikreditkan.',
            );
            $state['credits'][] = $d;
        } else {
            need($amount <= $b['refundable'], 'Refund melebihi saldo yang harus dikembalikan.');
            $state['refunds'][] = $d;
        }
        return ['id' => $d['id'], 'message' => 'Transaksi pembayaran/kredit tersimpan.'];
    }
}
