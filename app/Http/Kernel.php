<?php
declare(strict_types=1);
namespace Ternus\Http;
use Ternus\Infrastructure\StateRepository;
final class Kernel
{
    public function run(): never
    {
        SessionGuard::start();
        $routes = require dirname(__DIR__) . '/routes.php';
        $action = $_GET['action'] ?? 'status';
        if (!isset($routes[$action])) {
            Response::json(['error' => 'Endpoint tidak ditemukan.'], 404);
        }
        [$httpMethod, $controller, $method, $authenticated] = $routes[$action];
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== $httpMethod) {
            Response::json(['error' => 'Gunakan ' . $httpMethod . '.'], 405);
        }
        $input = [];
        if ($httpMethod === 'POST') {
            SessionGuard::csrf();
            if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 2000000) {
                Response::json(['error' => 'Permintaan terlalu besar.'], 413);
            }
            $input = json_decode(file_get_contents('php://input'), true, 512, JSON_THROW_ON_ERROR);
            need(is_array($input), 'Format permintaan tidak valid.');
        }
        if ($authenticated && !isset($_SESSION['uid'])) {
            Response::json(['error' => 'Silakan login.'], 401);
        }
        $instance = new $controller(new StateRepository());
        Response::json($instance->$method($input));
    }
}
