<?php
declare(strict_types=1);
namespace Ternus\Modules\Users;

final class UsersService
{
    /** Command: user.save. Called inside a repository transaction. */
    public static function save(array &$state, array $actor, string $op, array $input): array
    {
        permit($actor, ['owner']);
        $email = strtolower(clean($input['email']));
        need(filter_var($email, FILTER_VALIDATE_EMAIL) !== false, 'Email tidak valid.');
        $id = $input['id'] ?? uid();
        $old = findById($state['users'], $id);
        foreach ($state['users'] as $r) {
            need($r['id'] === $id || $r['email'] !== $email, 'Email sudah digunakan.');
        }
        need(in_array($input['role'], ['owner', 'admin', 'sales']), 'Role tidak valid.');
        $active = (bool) ($input['active'] ?? true);
        if ($old && $old['role'] === 'owner' && (!$active || $input['role'] !== 'owner')) {
            need(
                count(
                    array_filter(
                        $state['users'],
                        fn($r) => $r['role'] === 'owner' && $r['active'] && $r['id'] !== $id,
                    ),
                ) > 0,
                'Harus ada owner aktif.',
            );
        }
        $hash = $old['password'] ?? '';
        if (!empty($input['password'])) {
            need(strlen($input['password']) >= 10, 'Password minimal 10 karakter.');
            $hash = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        need($hash !== '', 'Password wajib.');
        $r = [
            'id' => $id,
            'name' => clean($input['name']),
            'email' => $email,
            'password' => $hash,
            'role' => $input['role'],
            'active' => $active,
        ];
        if ($old) {
            $state['users'][ix($state['users'], $id)] = $r;
        } else {
            $state['users'][] = $r;
        }
        return ['id' => $id, 'message' => 'Pengguna tersimpan.'];
    }
}
