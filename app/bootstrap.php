<?php
declare(strict_types=1);
date_default_timezone_set('Asia/Jakarta');
// PSR-4-style autoloading without requiring Composer on a XAMPP installation.
spl_autoload_register(function (string $class): void {
    $prefix = 'Ternus\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }
    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $file = __DIR__ . '/' . $relative . '.php';
    if (is_file($file)) {
        require_once $file;
    }
});
foreach (
    ['Validation', 'Identity', 'Records', 'Documents', 'Stock', 'Sales', 'State', 'Commands']
    as $module
) {
    require_once __DIR__ . '/Support/' . $module . '.php';
}
