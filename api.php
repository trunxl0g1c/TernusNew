<?php
declare(strict_types=1);
ini_set('display_errors', '0');
require_once __DIR__ . '/app/bootstrap.php';

use Ternus\Http\Kernel;
use Ternus\Http\Response;

try {
    (new Kernel())->run();
} catch (DomainException | JsonException $error) {
    Response::json(['error' => $error->getMessage()], 422);
} catch (Throwable $error) {
    error_log('TERNUS: ' . $error->getMessage());
    Response::json(
        [
            'error' =>
                'Proses gagal. Pastikan Apache dan MySQL aktif, PHP 8.1+ serta pdo_mysql tersedia, dan server/config.php sesuai. Detail ada di log PHP XAMPP.',
        ],
        500,
    );
}
