<?php
/**
 * Materials API — Nenasala IMS
 * GET    /api/materials/         — list all materials (filtered by course/subject)
 * POST   /api/materials/         — upload new material (multipart/form-data)
 * DELETE /api/materials/?id=X    — delete material (teacher who uploaded or admin)
 * GET    /api/materials/?id=X    — get single material info
 */
require_once __DIR__ . '/../../config/app.php';

$u  = JWT::auth();
$db = Database::getInstance()->getConnection();
$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

define('MAT_UPLOAD_DIR', __DIR__ . '/../../uploads/materials/');
define('MAT_UPLOAD_URL', 'http://localhost/Nenasala_ims/BackEnd/uploads/materials/');

// Ensure upload dir exists
if (!is_dir(MAT_UPLOAD_DIR)) {
    mkdir(MAT_UPLOAD_DIR, 0755, true);
}

/* ── GET list / single ──────────────────────────── */
if ($m === 'GET') {
    if ($id) {
        // Single material
        $stmt = $db->prepare("
            SELECT m.*, c.name course_name, s.name subject_name,
                   u.name uploaded_by_name
            FROM materials m
            JOIN courses c ON m.course_id = c.id
            LEFT JOIN subjects s ON m.subject_id = s.id
            JOIN users u ON m.uploaded_by = u.id
            WHERE m.id = ?
        ");
        $stmt->bind_param('i', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        if (!$row) Response::error('Material not found', 404);
        Response::success($row);
    }

    // List with optional filters
    $courseId  = (int)($_GET['course_id']  ?? 0);
    $subjectId = (int)($_GET['subject_id'] ?? 0);
    $search    = '%' . $db->real_escape_string($_GET['search'] ?? '') . '%';

    // Students see only their course materials
    if ($u['role'] === 'student') {
        $r = $db->query("SELECT course_id FROM students WHERE user_id = {$u['user_id']} LIMIT 1")->fetch_assoc();
        if ($r) $courseId = (int)$r['course_id'];
    }

    $where = "WHERE m.title LIKE '$search'";
    if ($courseId)  $where .= " AND m.course_id = $courseId";
    if ($subjectId) $where .= " AND m.subject_id = $subjectId";

    $rows = $db->query("
        SELECT m.id, m.title, m.description, m.file_name, m.file_path,
               m.file_size, m.created_at,
               c.name AS course_name,
               s.name AS subject_name,
               u.name AS uploaded_by_name,
               m.uploaded_by, m.course_id, m.subject_id
        FROM materials m
        JOIN courses c ON m.course_id = c.id
        LEFT JOIN subjects s ON m.subject_id = s.id
        JOIN users u ON m.uploaded_by = u.id
        $where
        ORDER BY m.id DESC
    ")->fetch_all(MYSQLI_ASSOC);

    Response::success($rows);
}

/* ── POST — upload PDF ──────────────────────────── */
if ($m === 'POST') {
    JWT::authRole('admin', 'teacher');

    // Read form fields
    $title     = trim($_POST['title']       ?? '');
    $desc      = trim($_POST['description'] ?? '');
    $courseId  = (int)($_POST['course_id']  ?? 0);
    $subjectId = (int)($_POST['subject_id'] ?? 0) ?: null;

    if (!$title)    Response::error('Title is required', 422);
    if (!$courseId) Response::error('Course is required', 422);

    // Validate file
    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        $errMsg = [
            UPLOAD_ERR_INI_SIZE   => 'File too large (server limit)',
            UPLOAD_ERR_FORM_SIZE  => 'File too large (form limit)',
            UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
            UPLOAD_ERR_NO_FILE    => 'No file uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Temp directory missing',
            UPLOAD_ERR_CANT_WRITE => 'Cannot write file',
        ];
        $code = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
        Response::error($errMsg[$code] ?? 'Upload error', 422);
    }

    $file     = $_FILES['file'];
    $origName = basename($file['name']);
    $mimeType = mime_content_type($file['tmp_name']);
    $maxSize  = 20 * 1024 * 1024; // 20 MB

    // Allow PDF, DOC, DOCX, PPT, PPTX, images
    $allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg', 'image/png', 'image/webp',
    ];

    if (!in_array($mimeType, $allowed)) {
        Response::error('Only PDF, DOC, DOCX, PPT, PPTX, JPG, PNG files allowed', 422);
    }
    if ($file['size'] > $maxSize) {
        Response::error('File size must be under 20MB', 422);
    }

    // Generate unique filename
    $ext      = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($origName, PATHINFO_FILENAME));
    $fileName = date('Ymd_His') . '_' . $safeName . '_' . substr(md5(uniqid()), 0, 6) . '.' . $ext;
    $destPath = MAT_UPLOAD_DIR . $fileName;
    $fileUrl  = MAT_UPLOAD_URL . $fileName;

    if (!move_uploaded_file($file['tmp_name'], $destPath)) {
        Response::error('Failed to save file. Check server permissions.', 500);
    }

    // Save to DB
    $stmt = $db->prepare("
        INSERT INTO materials (title, description, file_name, file_path, file_size, course_id, subject_id, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('ssssiiis',
        $title, $desc, $origName, $fileUrl,
        $file['size'], $courseId, $subjectId, $u['user_id']
    );

    // Fix: subject_id can be NULL
    if ($subjectId) {
        $stmt->bind_param('ssssiiii',
            $title, $desc, $origName, $fileUrl,
            $file['size'], $courseId, $subjectId, $u['user_id']
        );
    } else {
        // Use null for subject_id
        $stmt = $db->prepare("
            INSERT INTO materials (title, description, file_name, file_path, file_size, course_id, subject_id, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, NULL, ?)
        ");
        $stmt->bind_param('ssssiii',
            $title, $desc, $origName, $fileUrl,
            $file['size'], $courseId, $u['user_id']
        );
    }

    if (!$stmt->execute()) {
        // Cleanup uploaded file if DB fails
        @unlink($destPath);
        Response::error('Database error: ' . $stmt->error, 500);
    }
    $newId = $db->insert_id;
    $stmt->close();

    Response::success([
        'id'        => $newId,
        'file_name' => $origName,
        'file_path' => $fileUrl,
        'file_size' => $file['size'],
    ], 'Material uploaded successfully', 201);
}

/* ── DELETE ──────────────────────────────────────── */
if ($m === 'DELETE') {
    if (!$id) Response::error('Material ID required', 422);

    // Get material info
    $stmt = $db->prepare("SELECT * FROM materials WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $mat = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$mat) Response::error('Material not found', 404);

    // Only uploader or admin can delete
    if ($u['role'] !== 'admin' && (int)$mat['uploaded_by'] !== (int)$u['user_id']) {
        Response::error('You can only delete your own materials', 403);
    }

    // Delete physical file
    $localPath = MAT_UPLOAD_DIR . basename($mat['file_path']);
    if (file_exists($localPath)) @unlink($localPath);

    // Delete DB record
    $del = $db->prepare("DELETE FROM materials WHERE id = ?");
    $del->bind_param('i', $id);
    $del->execute();
    $del->close();

    Response::success(null, 'Material deleted');
}

Response::error('Method not allowed', 405);
