<?php
// CLI-only regression for PHP installations without array_is_list().
if (PHP_SAPI !== 'cli') { http_response_code(403); exit(); }
require_once dirname(__DIR__) . '/app/bootstrap.php';
use Ternus\Infrastructure\RelationalCodec;
$checks = 0;
function checkList(bool $ok, string $message): void {
    global $checks;
    if (!$ok) throw new RuntimeException($message);
    $checks++;
}
$lists = [[], ['z', 'a'], [null, false, 0, ''], [['b' => 2, 'a' => 1], [9, 4]]];
foreach ($lists as $value) {
    $expected = $value;
    foreach ($expected as &$item) if (is_array($item) && isset($item['b'])) ksort($item);
    unset($item);
    checkList(RelationalCodec::canonical($value) === $expected, 'List order or nested values changed');
}
foreach ([[2 => 'two', 0 => 'zero'], ['b' => false, 'a' => null], [-1 => 0, 0 => 1], ['01' => 's', 0 => 'i']] as $value) {
    $expected = $value; ksort($expected);
    checkList(RelationalCodec::canonical($value) === $expected, 'Map canonical ordering differs');
}
checkList(RelationalCodec::digest(['items' => ['a','b']]) !== RelationalCodec::digest(['items' => ['b','a']]), 'List order must affect digest');
checkList(RelationalCodec::digest(['b' => 2,'a' => 1]) === RelationalCodec::digest(['a' => 1,'b' => 2]), 'Map ordering must not affect digest');
$state = initialState('Test', 'test@example.test', 'Test-only-1234');
$state['receipts'] = [['id' => 'r1', 'lines' => [['id' => 'line1', 'product' => 'test-product', 'qty' => 1000, 'cost' => 5000]]]];
$encoded = RelationalCodec::encode($state);
checkList(count($encoded['receipt_items']) === 1, 'Valid list of child rows rejected');
checkList(RelationalCodec::digest(RelationalCodec::decode($encoded)) === RelationalCodec::digest($state), 'Codec roundtrip changed data');
$state['receipts'][0]['lines'] = [1 => ['product' => 'test-product']];
try { RelationalCodec::encode($state); throw new LogicException('Sparse details accepted'); }
catch (RuntimeException $error) { checkList(strpos($error->getMessage(), 'Rincian') !== false, 'Unexpected validation error'); }
echo "$checks list-compatibility checks passed; native array_is_list " . (function_exists('array_is_list') ? 'available' : 'disabled/unavailable') . ".\n";
