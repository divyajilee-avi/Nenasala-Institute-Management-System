<?php
/**
 * Students CRUD API — Nenasala IMS
 */
require_once __DIR__ . '/../../config/app.php';

$u  = JWT::auth();
$db = Database::getInstance()->getConnection();
$m  = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

/* ── helper: empty string → NULL for DATE columns ── */
function dateOrNull(string $val): ?string {
    return ($val !== '' && $val !== '0000-00-00') ? $val : null;
}

/* ── LIST ──────────────────────────────────────── */
if ($m === 'GET' && !$id) {
    $page = max(1,   (int)($_GET['page']     ?? 1));
    $pp   = min(100, (int)($_GET['per_page'] ?? 15));
    $q    = '%' . $db->real_escape_string($_GET['search'] ?? '') . '%';
    $off  = ($page - 1) * $pp;

    $total = (int)$db->query(
        "SELECT COUNT(*) c FROM students s
         JOIN users u ON s.user_id = u.id
         WHERE u.name LIKE '$q' OR s.student_id LIKE '$q'"
    )->fetch_assoc()['c'];

    $rows = $db->query(
        "SELECT s.id, s.student_id, s.course_id, s.phone, s.address,
                s.dob, s.gender, s.guardian_name, s.guardian_phone,
                s.admission_date, s.created_at,
                u.name, u.email, u.status,
                c.name AS course_name
         FROM students s
         JOIN users   u ON s.user_id   = u.id
         JOIN courses c ON s.course_id = c.id
         WHERE u.name LIKE '$q' OR s.student_id LIKE '$q'
         ORDER BY s.id DESC LIMIT $pp OFFSET $off"
    )->fetch_all(MYSQLI_ASSOC);

    Response::paginated($rows, $total, $page, $pp);
}

/* ── GET ONE ───────────────────────────────────── */
if ($m === 'GET' && $id) {
    $stmt = $db->prepare(
        "SELECT s.*, u.name, u.email, u.status, c.name AS course_name
         FROM students s
         JOIN users   u ON s.user_id   = u.id
         JOIN courses c ON s.course_id = c.id
         WHERE s.id = ?"
    );
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    if (!$row) Response::error('Student not found', 404);
    Response::success($row);
}

/* ── CREATE ────────────────────────────────────── */
if ($m === 'POST') {
    JWT::authRole('admin', 'receptionist');

    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) Response::error('Invalid JSON body', 400);

    $name     = trim($in['name']           ?? '');
    $email    = strtolower(trim($in['email'] ?? ''));
    $pass     = trim($in['password']       ?? 'Student@123');
    $courseId = (int)($in['course_id']     ?? 0);
    $phone    = trim($in['phone']          ?? '');
    $addr     = trim($in['address']        ?? '');
    $dob      = dateOrNull(trim($in['dob'] ?? ''));
    $gender   = trim($in['gender']         ?? 'male');
    $gname    = trim($in['guardian_name']  ?? '');
    $gphone   = trim($in['guardian_phone'] ?? '');
    $admDate  = dateOrNull(trim($in['admission_date'] ?? date('Y-m-d')));
    if ($admDate === null) $admDate = date('Y-m-d');  // default to today

    /* Validation */
    if (!$name)                                     Response::error('Full name is required', 422);
    if (!$email)                                    Response::error('Email is required', 422);
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) Response::error('Invalid email format', 422);
    if (!$courseId)                                 Response::error('Course is required', 422);
    if (strlen($pass) < 6)                          Response::error('Password must be at least 6 characters', 422);

    /* Check duplicate email */
    $chk = $db->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
    $chk->bind_param('s', $email);
    $chk->execute();
    $dup = $chk->get_result()->fetch_assoc();
    $chk->close();
    if ($dup) Response::error('This email is already registered', 409);

    /* Check course exists */
    $cc = $db->prepare("SELECT id FROM courses WHERE id = ? LIMIT 1");
    $cc->bind_param('i', $courseId);
    $cc->execute();
    $courseExists = $cc->get_result()->fetch_assoc();
    $cc->close();
    if (!$courseExists) Response::error('Selected course does not exist', 422);

    $hash = password_hash($pass, PASSWORD_BCRYPT);

    $db->begin_transaction();
    try {
        /* Step 1 — create user */
        $s1 = $db->prepare(
            "INSERT INTO users (name, email, password, role, status)
             VALUES (?, ?, ?, 'student', 'active')"
        );
        $s1->bind_param('sss', $name, $email, $hash);
        if (!$s1->execute()) throw new Exception('User insert failed: ' . $s1->error);
        $uid = (int)$db->insert_id;
        $s1->close();

        if (!$uid) throw new Exception('No user ID returned');

        /* Step 2 — generate student ID */
        $sid = 'STU-' . date('Y') . '-' . str_pad($uid, 4, '0', STR_PAD_LEFT);

        /* Step 3 — create student profile
           Columns:  user_id  student_id  course_id  phone  address  dob  gender  guardian_name  guardian_phone  admission_date
           Types:       i         s           i        s       s      s      s          s               s               s
           Count:       1         2           3        4       5      6      7          8               9               10
        */
        $s2 = $db->prepare(
            "INSERT INTO students
             (user_id, student_id, course_id, phone, address,
              dob, gender, guardian_name, guardian_phone, admission_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        );

        $s2->bind_param(
            'isisssssss',  /* 10 types matching 10 values */
            $uid,          /* i — int  */
            $sid,          /* s — str  */
            $courseId,     /* i — int  */
            $phone,        /* s — str  */
            $addr,         /* s — str  */
            $dob,          /* s — str|null */
            $gender,       /* s — str  */
            $gname,        /* s — str  */
            $gphone,       /* s — str  */
            $admDate       /* s — str  */
        );

        if (!$s2->execute()) throw new Exception('Student insert failed: ' . $s2->error);
        $newId = (int)$db->insert_id;
        $s2->close();

        if (!$newId) throw new Exception('No student ID returned');

        $db->commit();

        Response::success(
            ['id' => $newId, 'student_id' => $sid, 'user_id' => $uid],
            'Student registered successfully',
            201
        );

    } catch (Exception $e) {
        $db->rollback();
        Response::error('Registration failed: ' . $e->getMessage(), 500);
    }
}

/* ── UPDATE ────────────────────────────────────── */
if ($m === 'PUT' && $id) {
    JWT::authRole('admin');

    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) Response::error('Invalid JSON body', 400);

    $name     = trim($in['name']           ?? '');
    $courseId = (int)($in['course_id']     ?? 0);
    $phone    = trim($in['phone']          ?? '');
    $addr     = trim($in['address']        ?? '');
    $dob      = dateOrNull(trim($in['dob'] ?? ''));
    $gender   = trim($in['gender']         ?? 'male');
    $gname    = trim($in['guardian_name']  ?? '');
    $gphone   = trim($in['guardian_phone'] ?? '');
    $admDate  = dateOrNull(trim($in['admission_date'] ?? ''));
    $status   = trim($in['status']         ?? 'active');

    if (!$name)     Response::error('Name is required', 422);
    if (!$courseId) Response::error('Course is required', 422);

    /* Check student exists */
    $chk = $db->prepare("SELECT id, user_id FROM students WHERE id = ? LIMIT 1");
    $chk->bind_param('i', $id);
    $chk->execute();
    $student = $chk->get_result()->fetch_assoc();
    $chk->close();
    if (!$student) Response::error('Student not found', 404);

    /* Update users row */
    $s1 = $db->prepare("UPDATE users SET name = ?, status = ? WHERE id = ?");
    $s1->bind_param('ssi', $name, $status, $student['user_id']);
    if (!$s1->execute()) Response::error('Failed to update user: ' . $s1->error, 500);
    $s1->close();

    /* Update students row
       Columns: course_id  phone  address  dob  gender  guardian_name  guardian_phone  admission_date  id
       Types:       i        s       s      s      s          s               s               s         i
    */
    $s2 = $db->prepare(
        "UPDATE students
         SET course_id = ?, phone = ?, address = ?, dob = ?,
             gender = ?, guardian_name = ?, guardian_phone = ?,
             admission_date = ?
         WHERE id = ?"
    );
    $s2->bind_param(
        'isssssssi',
        $courseId, $phone, $addr, $dob,
        $gender, $gname, $gphone, $admDate,
        $id
    );
    if (!$s2->execute()) Response::error('Failed to update student: ' . $s2->error, 500);
    $s2->close();

    Response::success(null, 'Student updated successfully');
}

/* ── DELETE ────────────────────────────────────── */
if ($m === 'DELETE' && $id) {
    JWT::authRole('admin');

    $stmt = $db->prepare("SELECT user_id FROM students WHERE id = ? LIMIT 1");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$row) Response::error('Student not found', 404);

    $del = $db->prepare("DELETE FROM users WHERE id = ?");
    $del->bind_param('i', $row['user_id']);
    $del->execute();
    $del->close();

    Response::success(null, 'Student deleted successfully');
}

Response::error('Method not allowed', 405);
