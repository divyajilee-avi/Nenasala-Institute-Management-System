<?php
/** POST /api/upload/photo  — student/teacher photo upload */
require_once __DIR__ . '/../../config/app.php';
$u=JWT::auth();
if($_SERVER['REQUEST_METHOD']!=='POST') Response::error('Method not allowed',405);
if(!isset($_FILES['photo'])) Response::error('No file uploaded',422);

$file=$_FILES['photo'];
$allowed=['image/jpeg','image/png','image/webp'];
if(!in_array($file['type'],$allowed)) Response::error('Only JPG/PNG/WEBP allowed',422);
if($file['size']>2*1024*1024) Response::error('Max file size 2MB',422);

if(!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR,0755,true);
$ext=pathinfo($file['name'],PATHINFO_EXTENSION);
$name='photo_'.time().'_'.bin2hex(random_bytes(4)).'.'.$ext;
$dest=UPLOAD_DIR.$name;
if(!move_uploaded_file($file['tmp_name'],$dest)) Response::error('Upload failed',500);

// Update avatar in users table
$db=Database::getInstance()->getConnection();
$url=UPLOAD_URL.$name;
$s=$db->prepare("UPDATE users SET avatar=? WHERE id=?");
$s->bind_param('si',$url,$u['user_id']);$s->execute();$s->close();
Response::success(['url'=>$url],'Photo uploaded');
