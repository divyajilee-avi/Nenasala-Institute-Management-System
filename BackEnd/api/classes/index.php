<?php
/** Class Schedules (Timetable) API */
require_once __DIR__ . '/../../config/app.php';
$u=JWT::auth(); $db=Database::getInstance()->getConnection();
$m=$_SERVER['REQUEST_METHOD']; $id=isset($_GET['id'])?(int)$_GET['id']:0;

if($m==='GET'){
    $tid=(int)($_GET['teacher_id']??0); $cid=(int)($_GET['course_id']??0);
    // Teacher sees own classes only
    if($u['role']==='teacher'){
        $r=$db->query("SELECT id FROM teachers WHERE user_id={$u['user_id']}")->fetch_assoc();
        $tid=$r?(int)$r['id']:0;
    }
    // Student sees course timetable
    if($u['role']==='student'){
        $r=$db->query("SELECT course_id FROM students WHERE user_id={$u['user_id']}")->fetch_assoc();
        $cid=$r?(int)$r['course_id']:0;
    }
    $w="WHERE 1=1";
    if($tid) $w.=" AND cl.teacher_id=$tid";
    if($cid) $w.=" AND cl.course_id=$cid";
    $rows=$db->query("SELECT cl.*,sub.name subject_name,c.name course_name,u.name teacher_name FROM classes cl JOIN subjects sub ON cl.subject_id=sub.id JOIN courses c ON cl.course_id=c.id JOIN teachers t ON cl.teacher_id=t.id JOIN users u ON t.user_id=u.id $w ORDER BY FIELD(cl.day,'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),cl.start_time")->fetch_all(MYSQLI_ASSOC);
    Response::success($rows);
}

if($m==='POST'){
    JWT::authRole('admin');
    $in=json_decode(file_get_contents('php://input'),true)??[];
    $sid=(int)($in['subject_id']??0);$tid=(int)($in['teacher_id']??0);$cid=(int)($in['course_id']??0);
    $day=$in['day']??'';$st=$in['start_time']??'';$et=$in['end_time']??'';$room=$in['room']??'';
    if(!$sid||!$tid||!$cid||!$day||!$st||!$et) Response::error('All fields required',422);
    $s=$db->prepare("INSERT INTO classes(subject_id,teacher_id,course_id,day,start_time,end_time,room)VALUES(?,?,?,?,?,?,?)");
    $s->bind_param('iiissss',$sid,$tid,$cid,$day,$st,$et,$room);$s->execute();$nid=$db->insert_id;$s->close();
    Response::success(['id'=>$nid],'Class scheduled',201);
}

if($m==='DELETE'&&$id){
    JWT::authRole('admin');
    $db->query("DELETE FROM classes WHERE id=$id");
    Response::success(null,'Deleted');
}
Response::error('Bad request',400);
