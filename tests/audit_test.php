<?php
// CLI-only domain/controller tests, using an in-memory transactional repository.
namespace Ternus\Infrastructure {
    class StateRepository {
        public array $state;
        public function __construct(array $state) { $this->state = $state; }
        public function transaction(callable $callback): array {
            $working = $this->state;
            $result = $callback($working);
            $this->state = $working;
            return $result;
        }
    }
}
namespace {
    if (PHP_SAPI !== 'cli') { http_response_code(403); exit(); }
    require dirname(__DIR__) . '/app/bootstrap.php';
    use Ternus\Support\Audit;
    use Ternus\Infrastructure\StateRepository;
    use Ternus\Http\Controllers\CommandController;
    $count = 0;
    function check(bool $ok, string $label): void {
        global $count;
        if (!$ok) throw new \RuntimeException('FAIL: ' . $label);
        $count++;
    }
    function denied(callable $fn): void {
        try { $fn(); } catch (\DomainException $e) { check(true, $e->getMessage()); return; }
        throw new \RuntimeException('Expected rejection');
    }
    $state = initialState('Owner', 'owner@example.test', 'Test-password-12345');
    $owner = $state['users'][0];
    $_SESSION = ['uid' => $owner['id']];
    $repo = new StateRepository($state);
    $controller = new CommandController($repo);
    $serial = 0;
    function command(string $op, array $data, string $source = 'form'): array {
        global $controller, $serial;
        return $controller->execute(['key' => 'test-' . ++$serial, 'op' => $op, 'data' => $data, 'source' => $source])['result'];
    }
    $id = command('master.save', ['type' => 'products', 'name' => 'Audit test', 'sku' => 'AUDIT-TEST', 'unit' => 'kg', 'stage' => 'Bahan', 'price' => 10000, 'cost' => 8000])['id'];
    $first = end($repo->state['audit']);
    check($first['user_id'] === $owner['id'] && $first['role'] === 'owner', 'Actor from session');
    check($first['changes'][0]['kind'] === 'created', 'Creation captured');
    $product = entity($repo->state, 'products', $id);
    $request = ['key' => 'retry', 'op' => 'master.save', 'source' => 'quick-edit', 'data' => array_merge($product, ['type' => 'products', 'price' => 12000])];
    $controller->execute($request);
    $logged = end($repo->state['audit']);
    $price = array_values(array_filter($logged['changes'][0]['fields'], fn($f) => $f['key'] === 'price'))[0];
    check($price['before'] === 10000 && $price['after'] === 12000, 'Price before and after');
    check($logged['source'] === 'quick-edit', 'Quick Edit source');
    $beforeRetry = $repo->state;
    $controller->execute($request);
    check($repo->state === $beforeRetry, 'Retry does not duplicate log or mutation');
    $request['data']['price'] = 13000;
    denied(fn() => $controller->execute($request));
    check($repo->state === $beforeRetry, 'Idempotency mismatch unchanged');
    denied(fn() => command('master.save', array_merge($product, ['type' => 'products'])));
    check($repo->state === $beforeRetry, 'Stale version leaves no success log');
    command('user.save', ['id' => $owner['id'], 'name' => 'New owner name', 'email' => $owner['email'], 'role' => 'owner', 'password' => 'Another-secret-12345']);
    $json = json_encode($repo->state['audit']);
    check(!str_contains($json, $owner['password']) && !str_contains($json, 'Another-secret-12345'), 'No credential values in logs');
    check(str_contains($json, 'password_changed'), 'Password change indicator');
    check($repo->state['audit'][0]['user'] === 'Owner', 'Historical actor name retained');
    $loc = $repo->state['locations'][0]['id'];
    command('receive', ['location' => $loc, 'date' => today(), 'source' => 'Saldo awal', 'origin' => 'Test', 'lines' => [['product' => $id, 'qty' => 2, 'cost' => 16000]]]);
    $event = end($repo->state['audit']);
    check(count($event['changes']) === 3, 'Receipt, batch and movement captured');
    $movement = array_values(array_filter($event['changes'], fn($c) => $c['entity'] === 'ledger'))[0];
    $balanceField = array_values(array_filter($movement['fields'], fn($f) => $f['key'] === 'stock_balance'))[0];
    check($balanceField['before'] === 0 && $balanceField['after'] === 2000, 'Stock balance before and after');
    $beforeInvalid = $repo->state;
    denied(fn() => command('receive', ['location' => $loc, 'date' => today(), 'source' => 'Saldo awal', 'origin' => 'Test', 'lines' => [['product' => $id, 'qty' => 1, 'cost' => 1], ['product' => $id, 'qty' => -2, 'cost' => 1]]]));
    check($repo->state === $beforeInvalid, 'Partial domain failure rolls back data and audit');
    command('master.bulk', ['type' => 'products', 'action' => 'delete', 'ids' => [$id]]);
    check(findById($repo->state['products'], $id) !== null, 'Used product still protected');
    $unused = command('master.save', ['type' => 'customers', 'name' => 'Unused', 'kind' => 'Retail'])['id'];
    command('master.bulk', ['type' => 'customers', 'action' => 'delete', 'ids' => [$unused]]);
    check(findById($repo->state['customers'], $unused) === null, 'History/request bookkeeping does not block unused master deletion');
    check(end($repo->state['audit'])['changes'][0]['kind'] === 'deleted', 'Deletion captured with old values');
    $sales = ['id' => 'sales', 'name' => 'Sales', 'email' => 's@example.test', 'role' => 'sales', 'active' => true];
    check(viewState($repo->state, $sales)['audit'] === [], 'Audit not exposed to sales API');
    $repo->state['invoices'][] = ['id' => 'invoice-test', 'number' => 'INV-TEST', 'total' => 100000];
    $snap = Audit::snapshot($repo->state);
    $repo->state['payments'][] = ['id' => 'payment-test', 'invoice' => 'invoice-test', 'amount' => 40000];
    Audit::record($repo->state, $owner, 'pay', ['id' => 'payment-test'], $snap);
    $invoiceChange = array_values(array_filter(end($repo->state['audit'])['changes'], fn($c) => $c['entity'] === 'invoices'))[0];
    $outstanding = array_values(array_filter($invoiceChange['fields'], fn($f) => $f['key'] === 'outstanding'))[0];
    check($outstanding['before'] === 100000 && $outstanding['after'] === 60000, 'Derived invoice balance captured');
    check(!isset($repo->state['invoices'][0]['outstanding']), 'Derived values not persisted into business records');
    $original = $repo->state;
    Audit::event($repo->state, $owner, 'auth.login', 'Login');
    unset($original['audit']); $rest = $repo->state; unset($rest['audit']);
    check($original === $rest, 'Access event does not change business data');
    echo "$count audit checks passed (in-memory repository, no MySQL).\n";
}
