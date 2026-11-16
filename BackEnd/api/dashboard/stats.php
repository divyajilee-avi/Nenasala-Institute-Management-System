<?php
/** GET /api/dashboard/stats */
require_once __DIR__ . '/../../config/app.php';
JWT::auth();
$db = Database::getInstance()->getConnection();

$counts = [];
foreach (['students','teachers','courses','subjects','exams'] as $t) {
    $counts[$t] = (int)$db->query("SELECT COUNT(*) c FROM $t")->fetch_assoc()['c'];
}

$fees = $db->query("SELECT
    SUM(CASE WHEN status='paid'    THEN amount ELSE 0 END) AS collected,
    SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) AS pending,
    SUM(CASE WHEN status='overdue' THEN amount ELSE 0 END) AS overdue
    FROM fees")->fetch_assoc();

$today  = date('Y-m-d');
$att    = $db->query("SELECT
    SUM(status='present') AS present,
    SUM(status='absent')  AS absent,
    SUM(status='late')    AS late
    FROM attendance WHERE date='$today'")->fetch_assoc();

$monthlyFees = $db->query("
    SELECT DATE_FORMAT(payment_date,'%b %Y') month, SUM(amount_paid) total
    FROM payments WHERE payment_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
    GROUP BY DATE_FORMAT(payment_date,'%Y-%m') ORDER BY MIN(payment_date)
")->fetch_all(MYSQLI_ASSOC);

$recentStudents = $db->query("
    SELECT s.student_id, u.name, c.name course, s.admission_date
    FROM students s JOIN users u ON s.user_id=u.id JOIN courses c ON s.course_id=c.id
    ORDER BY s.id DESC LIMIT 5
")->fetch_all(MYSQLI_ASSOC);

$notices = $db->query("
    SELECT n.title, n.audience, n.created_at, u.name posted_by
    FROM notices n JOIN users u ON n.posted_by=u.id
    ORDER BY n.id DESC LIMIT 5
")->fetch_all(MYSQLI_ASSOC);

Response::success(compact('counts','fees','att','monthlyFees','recentStudents','notices'));
