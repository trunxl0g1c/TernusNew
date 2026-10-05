<?php
/** Backward-compatible facade used by CLI domain tests and command controller. */
function operate(array &$s, array $u, string $op, array $a): array
{
    static $handlers = null;
    $handlers ??= require dirname(__DIR__) . '/commands.php';
    need(isset($handlers[$op]), 'Aksi tidak dikenal.');
    \Ternus\Support\Business::guard($s, $op, $a);
    [$class, $method] = $handlers[$op];
    return $class::$method($s, $u, $op, $a);
}
