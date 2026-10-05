<?php
// Run with PHP 8.1+ CLI. Does not connect to or change the operational database.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(); }
require dirname(__DIR__) . '/app/bootstrap.php';
use Ternus\Support\Business;

$count = 0;
function verify(bool $value, string $message): void {
    global $count;
    if (!$value) throw new RuntimeException('FAIL: ' . $message);
    $count++;
}
function rejected(callable $action): void {
    try { $action(); } catch (DomainException $error) { verify(true, $error->getMessage()); return; }
    throw new RuntimeException('FAIL: operation should be rejected');
}
$state = initialState('Owner', 'owner@example.test', 'Test-only-12345');
$owner = $state['users'][0];
$catalog = Business::catalog();
$original = $state;
foreach ($catalog['modules'] as $key => $definition) verify(Business::enabled($state, $key), 'Legacy enabled ' . $key);
$payload = Business::config($state);
$payload['profile'] = 'retail';
$payload['modules'] = $catalog['profiles']['retail']['modules'];
$payload['stages'] = ['Barang dagang', 'Peralatan'];
$payload['processes'] = ['Perakitan'];
operate($state, $owner, 'business.settings', $payload);
verify(Business::config($state)['revision'] === 1, 'Revision increment');
foreach ($original as $key => $value) {
    if ($key !== 'settings') verify($state[$key] === $value, 'Data retained: ' . $key);
}
verify(!Business::enabled($state, 'production'), 'Retail disables production');
rejected(function () use (&$state, $owner) { operate($state, $owner, 'production.start', ['kind' => 'Perakitan']); });
rejected(function () use (&$state, $owner, $payload) { operate($state, $owner, 'business.settings', $payload); });
rejected(function () use (&$state) { operate($state, ['role' => 'admin'], 'business.settings', Business::config($state)); });
$bad = Business::config($state);
$bad['modules']['sales'] = false;
rejected(function () use (&$state, $owner, $bad) { operate($state, $owner, 'business.settings', $bad); });
$bad = Business::config($state);
$bad['modules']['receiving'] = 'false';
rejected(function () use (&$state, $owner, $bad) { operate($state, $owner, 'business.settings', $bad); });
$bad = Business::config($state);
$bad['processes'] = ['Pengemasan'];
rejected(function () use (&$state, $owner, $bad) { operate($state, $owner, 'business.settings', $bad); });

// Every catalogued mutation is rejected when its own module is disabled,
// before any missing business payload can affect the state.
foreach ($catalog['modules'] as $key => $definition) {
    $copy = $original;
    $copy['settings']['business'] = Business::config($copy);
    $copy['settings']['business']['modules'][$key] = false;
    foreach ($definition['commands'] as $command) {
        $before = $copy;
        rejected(function () use (&$copy, $owner, $command) { operate($copy, $owner, $command, []); });
        verify($before === $copy, 'Blocked command does not mutate data: ' . $command);
    }
}
$copy = $original;
$copy['settings']['business'] = Business::config($copy);
$copy['settings']['business']['modules']['packaging'] = false;
$copy['productions'][] = ['id' => 'pkg', 'kind' => 'Pengemasan'];
rejected(function () use ($copy) { Business::guard($copy, 'production.start', ['kind' => 'Pengemasan']); });
rejected(function () use ($copy) { Business::guard($copy, 'production.complete', ['id' => 'pkg']); });
Business::guard($copy, 'production.start', ['kind' => 'Roasting']);
verify(true, 'Non-packaging production still allowed');
$view = viewState($state, $owner);
verify(isset($view['business_catalog']), 'Catalog projected');
verify(!isset($state['business_catalog']), 'Catalog not persisted into operational state');
$businessBefore = $state['settings']['business'];
operate($state, $owner, 'settings', ['company' => 'Updated Company']);
verify($state['settings']['business'] === $businessBefore, 'Identity settings preserve module settings');
$restore = Business::config($state);
$restore['modules'] = $catalog['profiles']['coffee']['modules'];
operate($state, $owner, 'business.settings', $restore);
verify(Business::enabled($state, 'production'), 'Reactivation');
echo "$count business checks passed.\n";
