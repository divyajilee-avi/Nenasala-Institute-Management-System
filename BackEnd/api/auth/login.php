<?php
/** POST /api/auth/login */
require_once __DIR__ . '/../../config/app.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') Response::error('Method not allowed',405);

$in       = json_decode(file_get_contents('php://input'), true) ?? [];
$email    = trim($in['email']    ?? '');
$password = trim($in['password'] ?? '');
if (!$email || !$password) Response::error('Email and password required', 422);

$db   = Database::getInstance()->getConnection();
$stmt = $db->prepare("SELECT id,name,email,password,role,status,avatar FROM users WHERE email=? LIMIT 1");
$stmt->bind_param('s', $email);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$user || !password_verify($password, $user['password'])) Response::error('Invalid credentials', 401);
if ($user['status'] !== 'active') Response::error('Account inactive. Contact admin.', 403);

$token = JWT::generate([
    'user_id' => (int)$user['id'],
    'name'    => $user['name'],
    'email'   => $user['email'],
    'role'    => $user['role'],
]);

Response::success([
    'token' => $token,
    'user'  => ['id'=>$user['id'],'name'=>$user['name'],'email'=>$user['email'],'role'=>$user['role'],'avatar'=>$user['avatar']],
], 'Login successful');
