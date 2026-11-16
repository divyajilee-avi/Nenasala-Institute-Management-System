<?php
/**
 * User Management API — Nenasala IMS
 * Admin only.
 * GET    /api/users/           — list all users (search + role filter)
 * PUT    /api/users/?id=X      — update role & status
 * DELETE /api/users/?id=X      — delete user
 */
require_once __DIR__ . '/../../config/app.php';

$auth = JWT::authRole('admin');
$db   = Database::getInstance()->getConnection();
$m    = $_SERVER['REQUEST_METHOD'];
$id   = isset($_GET['id']) ? (int)$_GET['id'] : 0;

/* ── GET — list users ───────────────────────────── */
if ($m === 'GET') {
    $search = '%' . $db->real_escape_string($_GET['search'] ?? '') . '%';
    $role   = $db->real_escape_string($_GET['role']   ?? '');

    $where = "WHERE (u.name LIKE ? OR u.email LIKE ?)";
    $types = 'ss';
    $params = [$search, $search];

    if ($role) {
        $where  .= " AND u.role = ?";
        $types  .= 's';
        $params[] = $role;
    }

    $stmt = $db->prepare(
        "SELECT
            u.id, u.name, u.email, u.role, u.status,
            u.avatar, u.created_at
         FROM users u
         $where
         ORDER BY u.id DESC"
    );
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    Response::success($rows);
}

/* ── PUT — update role / status ─────────────────── */
if ($m === 'PUT') {
    if (!$id) Response::error('User ID required', 422);

    // Prevent admin from editing themselves via this endpoint
    if ($id === (int)$auth['user_id']) {
        Response::error('You cannot edit your own account here', 403);
    }

    $in     = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = trim($in['status'] ?? 'active');
    $role   = trim($in['role']   ?? 'student');

    $allowed_status = ['active', 'inactive'];
    $allowed_roles  = ['admin', 'teacher', 'student', 'receptionist'];

    if (!in_array($status, $allowed_status)) Response::error('Invalid status', 422);
    if (!in_array($role,   $allowed_roles))  Response::error('Invalid role', 422);

    // Check user exists
    $chk = $db->prepare("SELECT id, name FROM users WHERE id = ?");
    $chk->bind_param('i', $id);
    $chk->execute();
    $target = $chk->get_result()->fetch_assoc();
    $chk->close();
    if (!$target) Response::error('User not found', 404);

    $stmt = $db->prepare("UPDATE users SET status = ?, role = ? WHERE id = ?");
    $stmt->bind_param('ssi', $status, $role, $id);
    $stmt->execute();
    $stmt->close();

    Response::success(
        ['id' => $id, 'name' => $target['name'], 'status' => $status, 'role' => $role],
        "{$target['name']} updated successfully"
    );
}

/* ── DELETE — remove user ───────────────────────── */
if ($m === 'DELETE') {
    if (!$id) Response::error('User ID required', 422);

    // Prevent self-delete
    if ($id === (int)$auth['user_id']) {
        Response::error('You cannot delete your own account', 403);
    }

    // Check user exists
    $chk = $db->prepare("SELECT id, name, role FROM users WHERE id = ?");
    $chk->bind_param('i', $id);
    $chk->execute();
    $target = $chk->get_result()->fetch_assoc();
    $chk->close();
    if (!$target) Response::error('User not found', 404);

    // Prevent deleting last admin
    if ($target['role'] === 'admin') {
        $count = (int)$db->query("SELECT COUNT(*) c FROM users WHERE role = 'admin'")->fetch_assoc()['c'];
        if ($count <= 1) {
            Response::error('Cannot delete the last admin account', 403);
        }
    }

    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $stmt->close();

    Response::success(null, "{$target['name']} deleted successfully");
}

Response::error('Method not allowed', 405);
