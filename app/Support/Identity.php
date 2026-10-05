<?php
declare(strict_types=1);

// Shared identity functions. No HTTP or database side effects.
function uid(): string
{
    return bin2hex(random_bytes(10));
}

function permit(array $u, array $roles): void
{
    need(in_array($u['role'], $roles, true), 'Anda tidak berhak menjalankan tindakan ini.');
}

function own(array $u, array $d): void
{
    need($u['role'] !== 'sales' || $d['by'] === $u['id'], 'Dokumen ini milik sales lain.');
}
