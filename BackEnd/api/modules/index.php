<?php
/**
 * Modules (Study Materials) API — Nenasala IMS
 *
 * GET    /api/modules/              — list modules (filter by course/subject)
 * POST   /api/modules/              — upload module PDF (teacher/admin)
 * DELETE /api/modules/?id=X         — delete module (teacher owner / admin)
 * GET    /api/modules/?action=download&id=X — download file
 */
require_once __DIR__ . '/../../config/app.php';

$u      = JWT::auth();
$db     = Database::getInstance()->getConnection();
$m      = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id'])     ? (int)$_GET['id']   : 0;
$action = $_GET['action']        ?? '';

/* ── helpers ─────────────────────────────────────── */
define('MODULE_UPLOAD_DIR', __DIR__ . '/../../uploads/modules/');
define('MODULE_UPLOAD_URL', UPLOAD_URL . 'modules/');

function formatBytes(int $bytes): string {
    if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
    if ($bytes >= 1024)    return round($bytes / 1024, 1)    . ' KB';
    return $bytes . ' B';
}

/* ── DOWNLOAD ──────────────────────────────────── */
if ($m === 'GET' && $action === 'download' && $id) {
    $stmt = $db->prepare("SELECT * FROM modules WHERE id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $mod = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$mod) { http_response_code(404); echo 'File not found'; exit(); }

    $filePath = MODULE_UPLOAD_DIR . $mod['file_name'];
    if (!file_exists($filePath)) { http_response_code(404); echo 'File missing on server'; exit(); }

    // Increment download count
    $db->query("UPDATE modules SET downloads = downloads + 1 WHERE id = $id");

    // Stream file
    header('Content-Type: ' . $mod['file_type']);
    header('Content-Disposition: attachment; filename="' . addslashes($mod['file_name']) . '"');
    header('Content-Length: ' . filesize($filePath));
    header('Cache-Control: private');
    readfile($filePath);
    exit();
}

/* ── LIST ──────────────────────────────────────── */
if ($m === 'GET' && !$action) {
    $courseId  = (int)($_GET['course_id']  ?? 0);
    $subjectId = (int)($_GET['subject_id'] ?? 0);
    $search    = '%' . $db->real_escape_string($_GET['search'] ?? '') . '%';

    $where = "WHERE m.title LIKE '$search'";
    if ($courseId)  $where .= " AND m.course_id  = $courseId";
    if ($subjectId) $where .= " AND m.subject_id = $subjectId";

    $rows = $db->query("
        SELECT m.*,
               s.name  AS subject_name,
               c.name  AS course_name,
               u.name  AS teacher_name
        FROM modules m
        JOIN subjects s  ON m.subject_id = s.id
        JOIN courses  c  ON m.course_id  = c.id
        JOIN teachers t  ON m.teacher_id = t.id
        JOIN users    u  ON t.user_id    = u.id
        $where
        ORDER BY m.id DESC
    ")->fetch_all(MYSQLI_ASSOC);

    // Add formatted size and download URL
    foreach ($rows as &$row) {
        $row['size_formatted'] = formatBytes((int)$row['file_size']);
        $row['download_url']   = MODULE_UPLOAD_URL . $row['file_name'];
        $row['api_download']   = UPLOAD_URL . '../api/modules/index.php?action=download&id=' . $row['id'];
    }
    unset($row);

    Response::success($rows);
}

/* ── UPLOAD (POST multipart) ───────────────────── */
if ($m === 'POST') {
    JWT::authRole('admin', 'teacher');

    // Get teacher record for logged-in user
    $teacherRow = null;
    if ($u['role'] === 'teacher') {
        $tr = $db->prepare("SELECT id FROM teachers WHERE user_id = ?");
        $tr->bind_param('i', $u['user_id']);
        $tr->execute();
        $teacherRow = $tr->get_result()->fetch_assoc();
        $tr->close();
        if (!$teacherRow) Response::error('Teacher profile not found', 404);
    }

    // Fields from multipart form
    $title     = trim($_POST['title']       ?? '');
    $desc      = trim($_POST['description'] ?? '');
    $subjectId = (int)($_POST['subject_id'] ?? 0);
    $courseId  = (int)($_POST['course_id']  ?? 0);
    $teacherId = $u['role'] === 'admin'
        ? (int)($_POST['teacher_id'] ?? 0)
        : (int)$teacherRow['id'];

    // Validate fields
    if (!$title)     Response::error('Title is required', 422);
    if (!$subjectId) Response::error('Subject is required', 422);
    if (!$courseId)  Response::error('Course is required', 422);
    if (!$teacherId) Response::error('Teacher is required', 422);

    // Validate file
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        Response::error('Please select a file to upload', 422);
    }

    $file     = $_FILES['file'];
    $maxSize  = 20 * 1024 * 1024; // 20 MB
    $allowed  = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg', 'image/png',
    ];

    if ($file['size'] > $maxSize) {
        Response::error('File too large. Max 20 MB allowed', 422);
    }

    // Detect real MIME type
    $finfo    = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);

    if (!in_array($mimeType, $allowed)) {
        Response::error('Only PDF, Word, PowerPoint, and image files are allowed', 422);
    }

    // Create upload directory
    if (!is_dir(MODULE_UPLOAD_DIR)) {
        mkdir(MODULE_UPLOAD_DIR, 0755, true);
    }

    // Generate safe unique filename
    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $safeName = preg_replace('/[^a-z0-9_\-]/i', '_', pathinfo($file['name'], PATHINFO_FILENAME));
    $fileName = $safeName . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $destPath = MODULE_UPLOAD_DIR . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        Response::error('File upload failed. Check server permissions', 500);
    }

    // Save to database
    $stmt = $db->prepare(
        "INSERT INTO modules
         (title, description, subject_id, course_id, teacher_id,
          file_name, file_path, file_size, file_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $filePath = 'uploads/modules/' . $fileName;
    $fileSize = (int)$file['size'];
    $stmt->bind_param(
        'ssiiiissi',
        $title, $desc, $subjectId, $courseId, $teacherId,
        $fileName, $filePath, $fileSize, $mimeType
    );

    if (!$stmt->execute()) {
        unlink($destPath); // Remove uploaded file if DB fails
        Response::error('Database error: ' . $stmt->error, 500);
    }

    $newId = $db->insert_id;
    $stmt->close();

    Response::success([
        'id'               => $newId,
        'file_name'        => $fileName,
        'size_formatted'   => formatBytes($fileSize),
        'download_url'     => MODULE_UPLOAD_URL . $fileName,
    ], 'Module uploaded successfully', 201);
}

/* ── DELETE ────────────────────────────────────── */
if ($m === 'DELETE' && $id) {
    JWT::authRole('admin', 'teacher');

    $stmt = $db->prepare("SELECT m.*, t.user_id AS t_user_id FROM modules m JOIN teachers t ON m.teacher_id = t.id WHERE m.id = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $mod = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$mod) Response::error('Module not found', 404);

    // Teachers can only delete their own modules
    if ($u['role'] === 'teacher' && (int)$mod['t_user_id'] !== (int)$u['user_id']) {
        Response::error('You can only delete your own modules', 403);
    }

    // Delete file from disk
    $filePath = MODULE_UPLOAD_DIR . $mod['file_name'];
    if (file_exists($filePath)) unlink($filePath);

    $del = $db->prepare("DELETE FROM modules WHERE id = ?");
    $del->bind_param('i', $id);
    $del->execute();
    $del->close();

    Response::success(null, 'Module deleted successfully');
}

Response::error('Method not allowed', 405);
