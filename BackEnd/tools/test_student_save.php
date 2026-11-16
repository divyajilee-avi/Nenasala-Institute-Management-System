<?php
/**
 * Test Student Save — Nenasala IMS
 * Access: http://localhost/Nenasala_ims/BackEnd/tools/test_student_save.php
 * This directly tests the database INSERT without needing a token.
 * DELETE after use!
 */
if (!in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1'])) die('Access denied');

require_once __DIR__ . '/../config/database.php';
$db = Database::getInstance()->getConnection();

echo '<!DOCTYPE html><html><body style="font-family:monospace;padding:20px;max-width:800px">';
echo '<h2>🧪 Student Save Test — Nenasala IMS</h2>';

$errors = [];
$steps  = [];

// Step 1: Check courses exist
$courses = $db->query("SELECT id, name FROM courses LIMIT 5")->fetch_all(MYSQLI_ASSOC);
$steps[] = ['step' => '1. Courses in DB', 'result' => count($courses) . ' found', 'ok' => count($courses) > 0];

if (empty($courses)) {
    echo '<p style="color:red">❌ No courses found. Import the SQL file first.</p>';
    exit;
}
$courseId = (int)$courses[0]['id'];

// Step 2: Test INSERT into users
$testEmail = 'test_' . time() . '@test.com';
$hash      = password_hash('Test@123', PASSWORD_BCRYPT);

$s = $db->prepare("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'student', 'active')");
$s->bind_param('sss', $testName = 'Test Student', $testEmail, $hash);
$ok = $s->execute();
$uid = (int)$db->insert_id;
$s->close();
$steps[] = ['step' => '2. INSERT users', 'result' => $ok ? "OK — user_id=$uid" : 'FAILED: ' . $db->error, 'ok' => $ok];

if (!$ok || !$uid) {
    echo '<p style="color:red">❌ Cannot insert user. Check MySQL user permissions.</p>';
} else {
    // Step 3: Test INSERT into students
    $sid     = 'TEST-' . date('Y') . '-' . str_pad($uid, 4, '0', STR_PAD_LEFT);
    $admDate = date('Y-m-d');
    $dob     = null;

    $s = $db->prepare(
        "INSERT INTO students
         (user_id, student_id, course_id, phone, address, dob, gender,
          guardian_name, guardian_phone, admission_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $s->bind_param('isisssssss', $uid, $sid, $courseId, $phone='', $addr='', $dob, $gender='male', $gname='', $gphone='', $admDate);
    $ok2   = $s->execute();
    $newId = (int)$db->insert_id;
    $err2  = $s->error;
    $s->close();
    $steps[] = ['step' => '3. INSERT students', 'result' => $ok2 ? "OK — student_id=$sid" : 'FAILED: ' . $err2, 'ok' => $ok2];

    // Cleanup
    $db->query("DELETE FROM users WHERE id=$uid");
    $steps[] = ['step' => '4. Cleanup', 'result' => 'Test records deleted', 'ok' => true];
}

// Display results
echo '<table border="1" cellpadding="10" style="border-collapse:collapse;width:100%">';
echo '<tr style="background:#1a3c6e;color:white"><th>Step</th><th>Result</th><th>Status</th></tr>';
foreach ($steps as $s) {
    $bg = $s['ok'] ? '#d1fae5' : '#fee2e2';
    $ic = $s['ok'] ? '✅' : '❌';
    echo "<tr style='background:$bg'><td><b>{$s['step']}</b></td><td>{$s['result']}</td><td>$ic</td></tr>";
}
echo '</table>';

$allOk = array_reduce($steps, fn($c, $s) => $c && $s['ok'], true);
if ($allOk) {
    echo '<h3 style="color:green;margin-top:20px">✅ Database is working correctly!</h3>';
    echo '<p>The student save should work. If still failing, check browser Console for the exact error message.</p>';
} else {
    echo '<h3 style="color:red;margin-top:20px">❌ Database issue found — see above</h3>';
}

echo '<h3>Available Courses:</h3><ul>';
foreach ($courses as $c) echo "<li>ID: {$c['id']} — {$c['name']}</li>";
echo '</ul>';
echo '<p style="color:red"><b>DELETE this file after use!</b></p>';
echo '</body></html>';
