<?php
use Ternus\Http\Controllers\SetupController;
use Ternus\Http\Controllers\AuthController;
use Ternus\Http\Controllers\StateController;
use Ternus\Http\Controllers\CommandController;
// action => [HTTP method, controller, method, requires login]
return [
    'migrate' => ['POST', \Ternus\Http\Controllers\MigrationController::class, 'migrate', true],
    'status' => ['GET', SetupController::class, 'status', false],
    'setup' => ['POST', SetupController::class, 'install', false],
    'login' => ['POST', AuthController::class, 'login', false],
    'logout' => ['POST', AuthController::class, 'logout', false],
    'state' => ['GET', StateController::class, 'show', true],
    'backup' => ['GET', StateController::class, 'backup', true],
    'mutate' => ['POST', CommandController::class, 'execute', true],
];
