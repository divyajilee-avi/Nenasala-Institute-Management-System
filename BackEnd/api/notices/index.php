<?php
/**
 * Notices API — Nenasala IMS
 * GET    /api/notices/  — list notices for current user's role
 * POST   /api/notices/  — create notice (admin/teacher only)
 * DELETE /api/notices/?id=X — delete notice (admin only)
 */
require_once __DIR__ . '/../../config/app.php';

$u  = JWT::auth();
$db = Database::getInstance()->getConnection();
$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

/* ── GET — list notices ─────────────────────────── */
if ($m === 'GET') {
    $role = $db->real_escape_string($u['role']);

    $stmt = $db->prepare("
        SELECT
            n.id,
            n.title,
            n.content,
            n.audience,
            n.created_at,
            u.name AS posted_by_name
        FROM notices n
        JOIN users u ON n.posted_by = u.id
        WHERE n.audience = 'all' OR n.audience = ?
        ORDER BY n.id DESC
        LIMIT 100
    ");
    $stmt->bind_param('s', $role);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    Response::success($rows);
}

/* ── POST — create notice ───────────────────────── */
if ($m === 'POST') {
    JWT::authRole('admin', 'teacher');

    $in      = json_decode(file_get_contents('php://input'), true) ?? [];
    $title   = trim($in['title']    ?? '');
    $content = trim($in['content']  ?? '');
    $aud     = trim($in['audience'] ?? 'all');

    // Validate
    if (!$title)   Response::error('Title is required', 422);
    if (!$content) Response::error('Content is required', 422);

    // Allowed audiences
    $allowed = ['all', 'student', 'teacher', 'admin'];
    if (!in_array($aud, $allowed)) $aud = 'all';

    $stmt = $db->prepare(
        "INSERT INTO notices (title, content, audience, posted_by)
         VALUES (?, ?, ?, ?)"
    );
    $stmt->bind_param('sssi', $title, $content, $aud, $u['user_id']);
    $stmt->execute();
    $newId = $db->insert_id;
    $stmt->close();

    Response::success(['id' => $newId], 'Notice posted successfully', 201);
}

/* ── DELETE — remove notice ─────────────────────── */
if ($m === 'DELETE') {
    JWT::authRole('admin');

    if (!$id) Response::error('Notice ID is required', 422);

    // Check exists
    $check = $db->prepare("SELECT id FROM notices WHERE id = ?");
    $check->bind_param('i', $id);
    $check->execute();
    $exists = $check->get_result()->fetch_assoc();
    $check->close();

    if (!$exists) Response::error('Notice not found', 404);

    $del = $db->prepare("DELETE FROM notices WHERE id = ?");
    $del->bind_param('i', $id);
    $del->execute();
    $del->close();

    Response::success(null, 'Notice deleted');
}

Response::error('Method not allowed', 405);
