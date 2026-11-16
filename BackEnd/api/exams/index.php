<?php
/**
 * Exams & Results API — Nenasala IT Center
 */
require_once __DIR__ . '/../../config/app.php';

$u      = JWT::auth();
$db     = Database::getInstance()->getConnection();
$m      = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id'])   ? (int)$_GET['id']   : 0;
$action = $_GET['action'] ?? '';

/* ── GET: list exams ────────────────────────────────── */
if ($m === 'GET' && !$id && $action !== 'results') {

    $cid = (int)($_GET['course_id'] ?? 0);

    // Student: only see exams for their enrolled course
    if ($u['role'] === 'student') {
        $sr = $db->query(
            "SELECT course_id FROM students WHERE user_id = {$u['user_id']} LIMIT 1"
        )->fetch_assoc();
        $cid = $sr ? (int)$sr['course_id'] : 0;
    }

    $where = $cid ? "WHERE e.course_id = $cid" : '';

    $rows = $db->query("
        SELECT e.*, c.name AS course_name, s.name AS subject_name
        FROM exams e
        JOIN courses  c ON e.course_id  = c.id
        JOIN subjects s ON e.subject_id = s.id
        $where
        ORDER BY e.exam_date DESC
    ")->fetch_all(MYSQLI_ASSOC);

    Response::success($rows);
}

/* ── GET: single exam ───────────────────────────────── */
if ($m === 'GET' && $id && $action !== 'results') {
    $r = $db->query("
        SELECT e.*, c.name AS course_name, s.name AS subject_name
        FROM exams e
        JOIN courses  c ON e.course_id  = c.id
        JOIN subjects s ON e.subject_id = s.id
        WHERE e.id = $id
    ")->fetch_assoc();
    if (!$r) Response::error('Not found', 404);
    Response::success($r);
}

/* ── GET: results for an exam ───────────────────────── */
if ($m === 'GET' && $id && $action === 'results') {

    // Student: only return THEIR OWN result
    if ($u['role'] === 'student') {
        $stmt = $db->prepare("
            SELECT r.*, u.name AS student_name, s.student_id AS student_code
            FROM results r
            JOIN students s ON r.student_id = s.id
            JOIN users    u ON s.user_id    = u.id
            WHERE r.exam_id = ?
              AND s.user_id  = ?
            LIMIT 1
        ");
        $stmt->bind_param('ii', $id, $u['user_id']);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        // Return single result as array (consistent format)
        Response::success($row ? [$row] : []);
    }

    // Teacher / Admin: return all students' results
    $rows = $db->query("
        SELECT r.*, u.name AS student_name, s.student_id AS student_code
        FROM results r
        JOIN students s ON r.student_id = s.id
        JOIN users    u ON s.user_id    = u.id
        WHERE r.exam_id = $id
        ORDER BY r.marks DESC
    ")->fetch_all(MYSQLI_ASSOC);

    Response::success($rows);
}

/* ── POST: create exam ──────────────────────────────── */
if ($m === 'POST' && $action !== 'result') {
    JWT::authRole('admin');

    $in     = json_decode(file_get_contents('php://input'), true) ?? [];
    $name   = trim($in['name']        ?? '');
    $cid    = (int)($in['course_id']  ?? 0);
    $subid  = (int)($in['subject_id'] ?? 0);
    $ed     = trim($in['exam_date']   ?? '');
    $tot    = (int)($in['total_marks'] ?? 100);
    $pass   = (int)($in['pass_marks']  ?? 40);

    if (!$name || !$cid || !$subid || !$ed)
        Response::error('All fields required', 422);

    // Validate subject belongs to course
    $chk = $db->prepare("SELECT id FROM subjects WHERE id = ? AND course_id = ? LIMIT 1");
    $chk->bind_param('ii', $subid, $cid);
    $chk->execute();
    if (!$chk->get_result()->fetch_assoc()) {
        $chk->close();
        Response::error('Subject does not belong to selected course', 422);
    }
    $chk->close();

    $stmt = $db->prepare(
        "INSERT INTO exams (name, course_id, subject_id, exam_date, total_marks, pass_marks)
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('siisii', $name, $cid, $subid, $ed, $tot, $pass);
    $stmt->execute();
    $nid = $db->insert_id;
    $stmt->close();

    Response::success(['id' => $nid], 'Exam created', 201);
}

/* ── POST: upload results ───────────────────────────── */
if ($m === 'POST' && $action === 'result') {
    JWT::authRole('admin', 'teacher');

    $in      = json_decode(file_get_contents('php://input'), true) ?? [];
    $eid     = (int)($in['exam_id'] ?? 0);
    $records = $in['results'] ?? [];

    if (!$eid || empty($records)) Response::error('exam_id and results required', 422);

    $exam = $db->query(
        "SELECT total_marks, pass_marks FROM exams WHERE id = $eid LIMIT 1"
    )->fetch_assoc();
    if (!$exam) Response::error('Exam not found', 404);

    $stmt = $db->prepare("
        INSERT INTO results (exam_id, student_id, marks, grade, remarks, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            marks       = VALUES(marks),
            grade       = VALUES(grade),
            remarks     = VALUES(remarks),
            uploaded_by = VALUES(uploaded_by)
    ");

    foreach ($records as $rec) {
        $sid   = (int)($rec['student_id'] ?? 0);
        $marks = (float)($rec['marks']    ?? 0);
        if (!$sid) continue;

        $pct   = $exam['total_marks'] > 0 ? ($marks / $exam['total_marks']) * 100 : 0;
        $grade = $pct >= 75 ? 'A' : ($pct >= 65 ? 'B' : ($pct >= 55 ? 'C' : ($pct >= 45 ? 'S' : 'F')));
        $rem   = $marks >= $exam['pass_marks'] ? 'Pass' : 'Fail';

        $stmt->bind_param('iidssi', $eid, $sid, $marks, $grade, $rem, $u['user_id']);
        $stmt->execute();
    }
    $stmt->close();

    Response::success(null, 'Results uploaded successfully');
}

Response::error('Method not allowed', 405);
