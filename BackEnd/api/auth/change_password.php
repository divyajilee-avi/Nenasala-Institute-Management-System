<?php
/** POST /api/auth/change-password */
require_once __DIR__ . '/../../config/app.php';
$u  = JWT::auth();
$in = json_decode(file_get_contents('php://input'), true) ?? [];
$cur = trim($in['current_password'] ?? '');
$new = trim($in['new_password']     ?? '');
if (!$cur || !$new) Response::error('Both passwords required', 422);
if (strlen($new) < 6) Response::error('New password must be ≥ 6 chars', 422);

$db   = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT password FROM users WHERE id=?");
$stmt->bind_param('i', $u['user_id']); $stmt->execute();
$row  = $stmt->get_result()->fetch_assoc(); $stmt->close();
if (!$row || !password_verify($cur, $row['password'])) Response::error('Current password wrong', 401);

$hash = password_hash($new, PASSWORD_BCRYPT);
$stmt = $db->prepare("UPDATE users SET password=? WHERE id=?");
$stmt->bind_param('si', $hash, $u['user_id']); $stmt->execute(); $stmt->close();
Response::success(null, 'Password updated');
