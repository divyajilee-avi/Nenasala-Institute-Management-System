<?php
/**
 * Fees & Payments API — Nenasala IT Center
 * GET  /api/fees/               — list fees
 * GET  /api/fees/?action=summary — dashboard summary stats
 * GET  /api/fees/?action=payments — payment history
 * POST /api/fees/               — create fee
 * POST /api/fees/?action=pay    — record payment
 * PUT  /api/fees/?id=X          — update fee status (overdue)
 * DELETE /api/fees/?id=X        — delete fee record
 */
require_once __DIR__ . '/../../config/app.php';

$u      = JWT::auth();
$db     = Database::getInstance()->getConnection();
$m      = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id     = isset($_GET['id']) ? (int)$_GET['id'] : 0;

/* ── GET: summary stats ─────────────────────────── */
if ($m === 'GET' && $action === 'summary') {
    $sid = 0;
    if ($u['role'] === 'student') {
        $r = $db->query("SELECT id FROM students WHERE user_id={$u['user_id']} LIMIT 1")->fetch_assoc();
        $sid = $r ? (int)$r['id'] : 0;
    }
    $sw = $sid ? "WHERE f.student_id = $sid" : "";

    $stats = $db->query("
        SELECT
            COUNT(*)                                             AS total_records,
            SUM(f.amount)                                        AS total_amount,
            SUM(CASE WHEN f.status='paid'    THEN f.amount ELSE 0 END) AS paid_amount,
            SUM(CASE WHEN f.status='pending' THEN f.amount ELSE 0 END) AS pending_amount,
            SUM(CASE WHEN f.status='overdue' THEN f.amount ELSE 0 END) AS overdue_amount,
            SUM(CASE WHEN f.status='paid'    THEN 1 ELSE 0 END) AS paid_count,
            SUM(CASE WHEN f.status='pending' THEN 1 ELSE 0 END) AS pending_count,
            SUM(CASE WHEN f.status='overdue' THEN 1 ELSE 0 END) AS overdue_count
        FROM fees f $sw
    ")->fetch_assoc();

    // Monthly collection (last 6 months)
    $sw2 = $sid ? "AND p.student_id = $sid" : "";
    $monthly = $db->query("
        SELECT DATE_FORMAT(p.payment_date,'%b %Y') AS month,
               SUM(p.amount_paid) AS total,
               COUNT(*) AS count
        FROM payments p
        WHERE p.payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        $sw2
        GROUP BY DATE_FORMAT(p.payment_date,'%Y-%m')
        ORDER BY MIN(p.payment_date) ASC
    ")->fetch_all(MYSQLI_ASSOC);

    Response::success(['stats' => $stats, 'monthly' => $monthly]);
}

/* ── GET: payment history ───────────────────────── */
if ($m === 'GET' && $action === 'payments') {
    $sid = 0;
    if ($u['role'] === 'student') {
        $r = $db->query("SELECT id FROM students WHERE user_id={$u['user_id']} LIMIT 1")->fetch_assoc();
        $sid = $r ? (int)$r['id'] : 0;
    }
    $filterSid = (int)($_GET['student_id'] ?? 0);
    if ($filterSid && $u['role'] !== 'student') $sid = $filterSid;

    $w = $sid ? "WHERE p.student_id = $sid" : "";

    $rows = $db->query("
        SELECT p.*, f.description, f.amount AS fee_amount,
               u.name AS student_name, s.student_id AS student_code
        FROM payments p
        JOIN fees f     ON p.fee_id = f.id
        JOIN students s ON p.student_id = s.id
        JOIN users u    ON s.user_id = u.id
        $w
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT 200
    ")->fetch_all(MYSQLI_ASSOC);

    Response::success($rows);
}

/* ── GET: list fees ─────────────────────────────── */
if ($m === 'GET' && !$action) {
    $sid    = (int)($_GET['student_id'] ?? 0);
    $status = $db->real_escape_string($_GET['status'] ?? '');
    $search = '%' . $db->real_escape_string($_GET['search'] ?? '') . '%';

    if ($u['role'] === 'student') {
        $r = $db->query("SELECT id FROM students WHERE user_id={$u['user_id']} LIMIT 1")->fetch_assoc();
        $sid = $r ? (int)$r['id'] : 0;
    }

    $w = "WHERE (u.name LIKE '$search' OR s.student_id LIKE '$search' OR f.description LIKE '$search')";
    if ($sid)    $w .= " AND f.student_id = $sid";
    if ($status) $w .= " AND f.status = '$status'";

    $rows = $db->query("
        SELECT f.*, u.name AS student_name, s.student_id AS student_code,
               c.name AS course_name
        FROM fees f
        JOIN students s ON f.student_id = s.id
        JOIN users u    ON s.user_id = u.id
        JOIN courses c  ON s.course_id = c.id
        $w
        ORDER BY f.due_date ASC, f.id DESC
    ")->fetch_all(MYSQLI_ASSOC);

    Response::success($rows);
}

/* ── POST: create fee ───────────────────────────── */
if ($m === 'POST' && !$action) {
    JWT::authRole('admin', 'receptionist');

    $in   = json_decode(file_get_contents('php://input'), true) ?? [];
    $sid  = (int)($in['student_id']  ?? 0);
    $amt  = (float)($in['amount']    ?? 0);
    $due  = trim($in['due_date']     ?? '');
    $desc = trim($in['description']  ?? '');
    $type = trim($in['fee_type']     ?? 'Course Fee');

    if (!$sid || !$amt || !$due) Response::error('student_id, amount, due_date required', 422);
    if ($amt <= 0)               Response::error('Amount must be greater than 0', 422);

    $fullDesc = $type . ($desc ? " — $desc" : '');

    $stmt = $db->prepare("INSERT INTO fees (student_id, amount, due_date, description, status) VALUES (?, ?, ?, ?, 'pending')");
    $stmt->bind_param('idss', $sid, $amt, $due, $fullDesc);
    $stmt->execute();
    $nid = $db->insert_id;
    $stmt->close();

    Response::success(['id' => $nid], 'Fee created successfully', 201);
}

/* ── POST: record payment ───────────────────────── */
if ($m === 'POST' && $action === 'pay') {
    JWT::authRole('admin', 'receptionist');

    $in   = json_decode(file_get_contents('php://input'), true) ?? [];
    $fid  = (int)($in['fee_id']         ?? 0);
    $sid  = (int)($in['student_id']     ?? 0);
    $amt  = (float)($in['amount_paid']  ?? 0);
    $pd   = trim($in['payment_date']    ?? date('Y-m-d'));
    $pm   = trim($in['payment_method']  ?? 'cash');
    $note = trim($in['note']            ?? '');

    if (!$fid || !$sid || !$amt) Response::error('fee_id, student_id, amount_paid required', 422);

    // Generate receipt number
    $rcp = 'RCP-' . date('Y') . '-' . strtoupper(substr(md5(uniqid()), 0, 8));

    $stmt = $db->prepare("
        INSERT INTO payments (fee_id, student_id, amount_paid, payment_date, payment_method, receipt_no, collected_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('iidsssi', $fid, $sid, $amt, $pd, $pm, $rcp, $u['user_id']);
    $stmt->execute();
    $pid = $db->insert_id;
    $stmt->close();

    // Mark fee as paid
    $db->query("UPDATE fees SET status = 'paid' WHERE id = $fid");

    // Return full payment details for receipt
    $receipt = $db->query("
        SELECT p.*, f.description, f.amount AS fee_amount,
               u.name AS student_name, s.student_id AS student_code,
               c.name AS course_name, ub.name AS collected_by_name
        FROM payments p
        JOIN fees f     ON p.fee_id = f.id
        JOIN students s ON p.student_id = s.id
        JOIN users u    ON s.user_id = u.id
        JOIN courses c  ON s.course_id = c.id
        LEFT JOIN users ub ON p.collected_by = ub.id
        WHERE p.id = $pid
    ")->fetch_assoc();

    Response::success(['payment_id' => $pid, 'receipt_no' => $rcp, 'receipt' => $receipt], 'Payment recorded', 201);
}

/* ── PUT: update fee (mark overdue) ─────────────── */
if ($m === 'PUT' && $id) {
    JWT::authRole('admin');
    $in     = json_decode(file_get_contents('php://input'), true) ?? [];
    $status = trim($in['status'] ?? '');
    $allowed = ['pending', 'paid', 'overdue'];
    if (!in_array($status, $allowed)) Response::error('Invalid status', 422);

    $stmt = $db->prepare("UPDATE fees SET status = ? WHERE id = ?");
    $stmt->bind_param('si', $status, $id);
    $stmt->execute();
    $stmt->close();
    Response::success(null, 'Fee updated');
}

/* ── DELETE: remove fee ─────────────────────────── */
if ($m === 'DELETE' && $id) {
    JWT::authRole('admin');
    $stmt = $db->prepare("DELETE FROM fees WHERE id = ? AND status != 'paid'");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    if ($stmt->affected_rows === 0) Response::error('Cannot delete a paid fee or fee not found', 400);
    $stmt->close();
    Response::success(null, 'Fee deleted');
}

Response::error('Method not allowed', 405);
