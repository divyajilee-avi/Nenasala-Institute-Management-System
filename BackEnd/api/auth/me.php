<?php
/** GET /api/auth/me */
require_once __DIR__ . '/../../config/app.php';
$u  = JWT::auth();
$db = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT id,name,email,role,status,avatar,created_at FROM users WHERE id=?");
$stmt->bind_param('i', $u['user_id']); $stmt->execute();
$row = $stmt->get_result()->fetch_assoc(); $stmt->close();
if (!$row) Response::error('Not found', 404);

// Attach role-specific profile
if ($u['role'] === 'student') {
    $s = $db->query("SELECT s.*,c.name AS course_name FROM students s JOIN courses c ON s.course_id=c.id WHERE s.user_id={$u['user_id']}")->fetch_assoc();
    $row['profile'] = $s;
}
if ($u['role'] === 'teacher') {
    $t = $db->query("SELECT * FROM teachers WHERE user_id={$u['user_id']}")->fetch_assoc();
    $row['profile'] = $t;
}
Response::success($row);
