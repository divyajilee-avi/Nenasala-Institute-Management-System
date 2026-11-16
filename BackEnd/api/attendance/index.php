<?php
/** Attendance API */
require_once __DIR__ . '/../../config/app.php';
$u=JWT::auth(); $db=Database::getInstance()->getConnection();
$m=$_SERVER['REQUEST_METHOD'];

if($m==='GET'){
    $cid=(int)($_GET['class_id']??0);$date=$db->real_escape_string($_GET['date']??date('Y-m-d'));
    $sid=(int)($_GET['student_id']??0);
    // Student sees only own
    if($u['role']==='student'){
        $r=$db->query("SELECT id FROM students WHERE user_id={$u['user_id']}")->fetch_assoc();
        $sid=$r?(int)$r['id']:0;
    }
    $w="WHERE 1=1";
    if($cid) $w.=" AND a.class_id=$cid";
    if($date) $w.=" AND a.date='$date'";
    if($sid)  $w.=" AND a.student_id=$sid";
    $rows=$db->query("SELECT a.*,u.name student_name,s.student_id student_code FROM attendance a JOIN students s ON a.student_id=s.id JOIN users u ON s.user_id=u.id $w ORDER BY a.date DESC")->fetch_all(MYSQLI_ASSOC);
    Response::success($rows);
}

if($m==='POST'){
    JWT::authRole('admin','teacher');
    $in=json_decode(file_get_contents('php://input'),true)??[];
    $cid=(int)($in['class_id']??0);$date=trim($in['date']??date('Y-m-d'));$records=$in['records']??[];
    if(!$cid||empty($records)) Response::error('class_id and records required',422);
    $s=$db->prepare("INSERT INTO attendance(student_id,class_id,date,status,marked_by)VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status),marked_by=VALUES(marked_by)");
    $cnt=0;
    foreach($records as $rec){
        $rid=(int)($rec['student_id']??0);
        $status=in_array($rec['status']??'',['present','absent','late'])?$rec['status']:'present';
        $s->bind_param('iissi',$rid,$cid,$date,$status,$u['user_id']);$s->execute();$cnt++;
    }
    $s->close();
    Response::success(['marked'=>$cnt],'Attendance saved');
}
Response::error('Bad request',400);
