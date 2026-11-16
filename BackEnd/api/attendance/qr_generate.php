<?php
/**
 * POST /api/attendance/qr_generate.php
 * Teacher/Admin generates a QR token for a class session.
 * Returns a signed token valid for N minutes.
 */
require_once __DIR__ . '/../../config/app.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

$u  = JWT::authRole('admin', 'teacher');
$db = Database::getInstance()->getConnection();
$in = json_decode(file_get_contents('php://input'), true) ?? [];

$classId  = (int)($in['class_id']   ?? 0);
$date     = trim($in['date']        ?? date('Y-m-d'));
$minutes  = min(60, max(5, (int)($in['valid_minutes'] ?? 15)));

if (!$classId) Response::error('class_id required', 422);

// Verify class exists
$cls = $db->query("
    SELECT cl.*, s.name subject_name, c.name course_name,
           u.name teacher_name, c.id course_id
    FROM classes cl
    JOIN subjects s ON cl.subject_id = s.id
    JOIN courses  c ON cl.course_id  = c.id
    JOIN teachers t ON cl.teacher_id = t.id
    JOIN users    u ON t.user_id     = u.id
    WHERE cl.id = $classId
    LIMIT 1
")->fetch_assoc();

if (!$cls) Response::error('Class not found', 404);

// Generate a secure token
$token    = bin2hex(random_bytes(16));
$expires  = time() + ($minutes * 60);
$expiresAt = date('Y-m-d H:i:s', $expires);

// Store token in DB (we use a simple tokens table — created if not exists)
$db->query("
    CREATE TABLE IF NOT EXISTS `qr_tokens` (
      `id`         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      `token`      VARCHAR(64) NOT NULL UNIQUE,
      `class_id`   INT UNSIGNED NOT NULL,
      `date`       DATE NOT NULL,
      `created_by` INT UNSIGNED NOT NULL,
      `expires_at` DATETIME NOT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
");

// Delete old tokens for same class+date
$db->query("DELETE FROM qr_tokens WHERE class_id = $classId AND date = '$date'");

$stmt = $db->prepare(
    "INSERT INTO qr_tokens (token, class_id, date, created_by, expires_at)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param('sissi', $token, $classId, $date, $u['user_id'], $expiresAt);
$stmt->execute();
$stmt->close();

// Build the QR scan URL (student opens this on phone)
$scanUrl = 'http://localhost:3000/attendance/scan?token=' . $token;

Response::success([
    'token'         => $token,
    'scan_url'      => $scanUrl,
    'class_id'      => $classId,
    'date'          => $date,
    'expires_at'    => $expiresAt,
    'valid_minutes' => $minutes,
    'class_info'    => $cls,
], 'QR token generated');
