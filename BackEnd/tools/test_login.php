<?php
/**
 * Login Test Tool — Nenasala IMS
 * Access: http://localhost/Nenasala_ims/BackEnd/tools/test_login.php
 * DELETE this file after use!
 */
if (!in_array($_SERVER['REMOTE_ADDR'], ['127.0.0.1', '::1'])) die('Access denied');

require_once __DIR__ . '/../config/database.php';
$db = Database::getInstance()->getConnection();

$tests = [
    ['admin@nenasala.lk',           'Admin@123'],
    ['kamal.silva@nenasala.lk',     'Teacher@123'],
    ['nimali.perera@nenasala.lk',   'Teacher@123'],
    ['ashan.fernando@nenasala.lk',  'Student@123'],
    ['dilani.j@nenasala.lk',        'Student@123'],
    ['kasun.r@nenasala.lk',         'Student@123'],
];

echo '<html><body style="font-family:monospace;padding:20px">';
echo '<h2>Login Test — Nenasala IMS</h2>';
echo '<table border="1" cellpadding="8" style="border-collapse:collapse">';
echo '<tr style="background:#1a3c6e;color:white"><th>Email</th><th>Password</th><th>Role</th><th>DB Hash</th><th>Verify</th></tr>';

foreach ($tests as [$email, $pass]) {
    $stmt = $db->prepare("SELECT email, password, role, status FROM users WHERE email=?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        echo "<tr><td>$email</td><td>$pass</td><td colspan=3 style='color:red'>❌ USER NOT FOUND — Import SQL first</td></tr>";
        continue;
    }

    $ok    = password_verify($pass, $user['password']);
    $color = $ok ? 'green' : 'red';
    $icon  = $ok ? '✅ LOGIN OK' : '❌ PASSWORD WRONG';
    $hash  = substr($user['password'], 0, 20) . '...';

    echo "<tr>
        <td>$email</td>
        <td><code>$pass</code></td>
        <td><b>{$user['role']}</b></td>
        <td style='font-size:.8em'>$hash</td>
        <td style='color:$color;font-weight:bold'>$icon</td>
    </tr>";
}

echo '</table>';
echo '<br><p>If any show ❌, run <a href="generate_passwords.php">generate_passwords.php</a> first.</p>';
echo '<p style="color:red"><b>⚠️ DELETE these tools after use.</b></p>';
echo '</body></html>';
