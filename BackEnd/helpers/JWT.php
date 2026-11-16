<?php
/**
 * Lightweight JWT helper — Nenasala IMS
 * Algorithm: HMAC-SHA256
 */
class JWT {

    public static function generate(array $payload): string {
        $header  = self::b64e(json_encode(['alg'=>'HS256','typ'=>'JWT']));
        $payload = array_merge($payload, ['iat'=>time(), 'exp'=>time()+JWT_EXPIRY]);
        $body    = self::b64e(json_encode($payload));
        $sig     = self::b64e(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
        return "$header.$body.$sig";
    }

    public static function verify(string $token): ?array {
        $p = explode('.', $token);
        if (count($p) !== 3) return null;
        [$h, $b, $s] = $p;
        $expected = self::b64e(hash_hmac('sha256', "$h.$b", JWT_SECRET, true));
        if (!hash_equals($expected, $s)) return null;
        $data = json_decode(self::b64d($b), true);
        if (!$data || $data['exp'] < time()) return null;
        return $data;
    }

    /** Require valid JWT; return payload or send 401 */
    public static function auth(): array {
        $h = getallheaders();
        $raw = $h['Authorization'] ?? $h['authorization'] ?? '';
        $token = str_starts_with($raw, 'Bearer ') ? substr($raw, 7) : null;
        if (!$token) { Response::error('Unauthorized', 401); exit(); }
        $data = self::verify($token);
        if (!$data)  { Response::error('Token invalid or expired', 401); exit(); }
        return $data;
    }

    /** Require specific role(s) */
    public static function authRole(string ...$roles): array {
        $u = self::auth();
        if (!in_array($u['role'], $roles, true)) { Response::error('Forbidden', 403); exit(); }
        return $u;
    }

    private static function b64e(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    private static function b64d(string $data): string {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
