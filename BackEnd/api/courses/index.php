<?php
/** Courses & Subjects API  —  ?type=course|subject */
require_once __DIR__ . '/../../config/app.php';
$u=JWT::auth(); $db=Database::getInstance()->getConnection();
$m=$_SERVER['REQUEST_METHOD']; $id=isset($_GET['id'])?(int)$_GET['id']:0;
$type=$_GET['type']??'course';

/* ── COURSES ─────────────────────────────────── */
if($type==='course'){
    if($m==='GET'&&!$id){
        $rows=$db->query("SELECT * FROM courses ORDER BY name")->fetch_all(MYSQLI_ASSOC);
        Response::success($rows);
    }
    if($m==='GET'&&$id){
        $r=$db->query("SELECT * FROM courses WHERE id=$id")->fetch_assoc();
        if(!$r) Response::error('Not found',404);
        $r['subjects']=$db->query("SELECT * FROM subjects WHERE course_id=$id")->fetch_all(MYSQLI_ASSOC);
        Response::success($r);
    }
    if($m==='POST'){
        JWT::authRole('admin');
        $in=json_decode(file_get_contents('php://input'),true)??[];
        $name=trim($in['name']??'');$code=strtoupper(trim($in['code']??''));
        $desc=$in['description']??'';$dur=$in['duration']??'';$fee=(float)($in['fee']??0);
        if(!$name||!$code) Response::error('name and code required',422);
        $s=$db->prepare("INSERT INTO courses(name,code,description,duration,fee)VALUES(?,?,?,?,?)");
        $s->bind_param('ssssd',$name,$code,$desc,$dur,$fee);$s->execute();$nid=$db->insert_id;$s->close();
        Response::success(['id'=>$nid],'Course created',201);
    }
    if($m==='PUT'&&$id){
        JWT::authRole('admin');
        $in=json_decode(file_get_contents('php://input'),true)??[];
        $name=$in['name']??'';$fee=(float)($in['fee']??0);$status=$in['status']??'active';
        $s=$db->prepare("UPDATE courses SET name=?,fee=?,status=? WHERE id=?");
        $s->bind_param('sdsi',$name,$fee,$status,$id);$s->execute();$s->close();
        Response::success(null,'Course updated');
    }
    if($m==='DELETE'&&$id){
        JWT::authRole('admin');
        $db->query("DELETE FROM courses WHERE id=$id");
        Response::success(null,'Course deleted');
    }
}

/* ── SUBJECTS ────────────────────────────────── */
if($type==='subject'){
    if($m==='GET'){
        $cid=(int)($_GET['course_id']??0);
        $w=$cid?"WHERE s.course_id=$cid":"";
        $rows=$db->query("SELECT s.*,c.name course_name FROM subjects s JOIN courses c ON s.course_id=c.id $w ORDER BY s.name")->fetch_all(MYSQLI_ASSOC);
        Response::success($rows);
    }
    if($m==='POST'){
        JWT::authRole('admin');
        $in=json_decode(file_get_contents('php://input'),true)??[];
        $cid=(int)($in['course_id']??0);$name=trim($in['name']??'');$code=strtoupper(trim($in['code']??''));$cred=(int)($in['credits']??1);
        if(!$cid||!$name||!$code) Response::error('course_id, name, code required',422);
        $s=$db->prepare("INSERT INTO subjects(course_id,name,code,credits)VALUES(?,?,?,?)");
        $s->bind_param('issi',$cid,$name,$code,$cred);$s->execute();$nid=$db->insert_id;$s->close();
        Response::success(['id'=>$nid],'Subject created',201);
    }
    if($m==='DELETE'&&$id){ JWT::authRole('admin'); $db->query("DELETE FROM subjects WHERE id=$id"); Response::success(null,'Deleted'); }
}
Response::error('Bad request',400);
