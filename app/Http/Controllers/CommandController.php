<?php
declare(strict_types=1);
namespace Ternus\Http\Controllers;
use Ternus\Infrastructure\StateRepository;
use Ternus\Http\SessionGuard;
use Ternus\Support\Audit;
final class CommandController
{
    public function __construct(private StateRepository $repository) {}
    public function execute(array $input): array
    {
        return $this->repository->transaction(function (array &$state) use ($input): array {
            $user = SessionGuard::user($state);
            $key = clean($input['key'] ?? '', 100);
            $operation = $input['op'] ?? '';
            $data = $input['data'] ?? [];
            need(is_array($data), 'Data perintah harus berupa object.');
            $hash = hash('sha256', json_encode([$operation, $data]));
            if (isset($state['requests'][$key])) {
                $previous = $state['requests'][$key];
                need(
                    $previous['hash'] === $hash && $previous['user'] === $user['id'],
                    'Kunci permintaan tidak cocok.',
                );
                return ['ok' => true, 'result' => $previous['result']];
            }
            $before = Audit::snapshot($state);
            $result = operate($state, $user, $operation, $data);
            Audit::record($state, $user, $operation, $result, $before,
                ($input['source'] ?? '') === 'quick-edit' ? 'quick-edit' : 'form');
            $state['requests'][$key] = [
                'hash' => $hash,
                'user' => $user['id'],
                'result' => $result,
            ];
            return ['ok' => true, 'result' => $result];
        });
    }
}
