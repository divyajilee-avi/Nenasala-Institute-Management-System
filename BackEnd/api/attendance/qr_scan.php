<?php
/**
 * POST /api/attendance/qr_scan.php
 * Student scans QR → auto-marks their attendance as 'present'
 * Called from the public scan page (no auth header, uses token)
 */
require_once __DIR__ . '/../../config/app.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

// Student must be logged in — verify their JWT
$u  = JWT::auth();
$db = Database::getInstance()->getConnection();
$in = json_decode(file_get_contents('php://input'), true) ?? [];

$token = trim($in['token'] ?? '');
if (!$token) Response::error('Token required', 422);

// Validate token
$stmt = $db->prepare("
    SELECT q.*, cl.course_id,
           s.name subject_name, c.name course_name
    FROM qr_tokens q
    JOIN classes  cl ON q.class_id   = cl.id
    JOIN subjects  s ON cl.subject_id = s.id
    JOIN courses   c ON cl.course_id  = c.id
    WHERE q.token = ?
    LIMIT 1
");
$stmt->bind_param('s', $token);
$stmt->execute();
$qr = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$qr)                              Response::error('Invalid QR code', 404);
if (strtotime($qr['expires_at']) < time()) Response::error('QR code has expired. Ask your teacher to regenerate.', 410);

// Get student record
$stud = $db->query("
    SELECT s.id, s.student_id, s.course_id, u.name
    FROM students s
    JOIN users u ON s.user_id = u.id
    WHERE s.user_id = {$u['user_id']}
    LIMIT 1
")->fetch_assoc();

if (!$stud) Response::error('Student record not found', 404);

// Verify student is enrolled in this course
if ((int)$stud['course_id'] !== (int)$qr['course_id']) {
    Response::error('You are not enrolled in this course.', 403);
}

$classId   = (int)$qr['class_id'];
$date      = $qr['date'];
$studentId = (int)$stud['id'];
$markedBy  = (int)$u['user_id'];
$status    = 'present';

// Check already marked
$dup = $db->query("
    SELECT id FROM attendance
    WHERE student_id = $studentId AND class_id = $classId AND date = '$date'
    LIMIT 1
")->fetch_assoc();

if ($dup) {
    Response::success([
        'already_marked' => true,
        'student_name'   => $stud['name'],
        'subject'        => $qr['subject_name'],
        'course'         => $qr['course_name'],
        'date'           => $date,
        'status'         => 'present',
    ], 'Attendance already recorded for today');
}

// Insert attendance
$stmt = $db->prepare("
    INSERT INTO attendance (student_id, class_id, date, status, marked_by)
    VALUES (?, ?, ?, 'present', ?)
");
$stmt->bind_param('iisi', $studentId, $classId, $date, $markedBy);
$stmt->execute();
$stmt->close();

Response::success([
    'already_marked' => false,
    'student_name'   => $stud['name'],
    'student_id'     => $stud['student_id'],
    'subject'        => $qr['subject_name'],
    'course'         => $qr['course_name'],
    'date'           => $date,
    'status'         => 'present',
], 'Attendance marked successfully!', 201);
