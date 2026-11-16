<?php
/**
 * POST /api/fees/pay_online.php
 * Student self-initiated online payment
 * Simulates payment gateway processing
 */
require_once __DIR__ . '/../../config/app.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed', 405);

$u  = JWT::auth();
$db = Database::getInstance()->getConnection();
$in = json_decode(file_get_contents('php://input'), true) ?? [];

$feeId     = (int)($in['fee_id']        ?? 0);
$cardName  = trim($in['card_name']      ?? '');
$cardNo    = trim($in['card_number']    ?? '');
$expiry    = trim($in['expiry']         ?? '');
$cvv       = trim($in['cvv']            ?? '');
$amount    = (float)($in['amount']      ?? 0);
$method    = trim($in['payment_method'] ?? 'online');

// Validate
if (!$feeId)   Response::error('Fee ID required', 422);
if (!$amount)  Response::error('Amount required', 422);

// Only the student who owns this fee can pay
$stmt = $db->prepare("
    SELECT f.*, s.id AS student_id, s.user_id, u.name AS student_name,
           s.student_id AS student_code, c.name AS course_name
    FROM fees f
    JOIN students s ON f.student_id = s.id
    JOIN users    u ON s.user_id    = u.id
    JOIN courses  c ON s.course_id  = c.id
    WHERE f.id = ? AND f.status != 'paid'
    LIMIT 1
");
$stmt->bind_param('i', $feeId);
$stmt->execute();
$fee = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$fee)                          Response::error('Fee not found or already paid', 404);
if ((int)$fee['user_id'] !== (int)$u['user_id']) Response::error('Unauthorized', 403);

// Validate card (basic format check — real gateway would do this)
if ($method === 'card') {
    $cleanCard = preg_replace('/\s+/', '', $cardNo);
    if (strlen($cleanCard) < 13 || strlen($cleanCard) > 19)
        Response::error('Invalid card number', 422);
    if (!$cardName)     Response::error('Card holder name required', 422);
    if (!$expiry)       Response::error('Expiry date required', 422);
    if (strlen($cvv) < 3) Response::error('Invalid CVV', 422);

    // Simulate: cards ending in 0000 are declined
    if (substr($cleanCard, -4) === '0000')
        Response::error('Payment declined. Please use a different card.', 402);
}

// Simulate 1-second processing delay (already done client-side)
// Generate receipt number
$receiptNo = 'ONL-' . date('Y') . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 10));

$db->begin_transaction();
try {
    // Record payment
    $payDate = date('Y-m-d');
    $stmt = $db->prepare("
        INSERT INTO payments
            (fee_id, student_id, amount_paid, payment_date, payment_method, receipt_no, collected_by)
        VALUES (?, ?, ?, ?, 'online', ?, NULL)
    ");
    $stmt->bind_param('iidss', $feeId, $fee['student_id'], $amount, $payDate, $receiptNo);
    $stmt->execute();
    $payId = $db->insert_id;
    $stmt->close();

    // Mark fee as paid
    $upd = $db->prepare("UPDATE fees SET status = 'paid' WHERE id = ?");
    $upd->bind_param('i', $feeId);
    $upd->execute();
    $upd->close();

    $db->commit();

    // Return full receipt data
    Response::success([
        'payment_id'    => $payId,
        'receipt_no'    => $receiptNo,
        'amount_paid'   => $amount,
        'payment_date'  => $payDate,
        'payment_method'=> 'Online',
        'fee_id'        => $feeId,
        'description'   => $fee['description'],
        'student_name'  => $fee['student_name'],
        'student_code'  => $fee['student_code'],
        'course_name'   => $fee['course_name'],
        'fee_amount'    => $fee['amount'],
    ], 'Payment successful', 201);

} catch (Exception $e) {
    $db->rollback();
    Response::error('Payment processing failed: ' . $e->getMessage(), 500);
}
