<?php
declare(strict_types=1);
namespace Ternus\Infrastructure;

/** Storage contract used by HTTP controllers; SQL details stay in the adapter. */
interface StateStore
{
    public function installed(): bool;
    public function install(array $state): void;
    public function read(bool $lock = false): array;
    public function transaction(callable $callback): array;
}
