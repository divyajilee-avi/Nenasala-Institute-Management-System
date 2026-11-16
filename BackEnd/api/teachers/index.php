<?php
/** Teachers CRUD API */
require_once __DIR__ . '/../../config/app.php';
$u=$db=null; $u=JWT::auth(); $db=Database::getInstance()->getConnection();
$m=$_SERVER['REQUEST_METHOD']; $id=isset($_GET['id'])?(int)$_GET['id']:0;

if($m==='GET'&&!$id){
    $page=max(1,(int)($_GET['page']??1));$pp=min(100,(int)($_GET['per_page']??15));
    $q='%'.($db->real_escape_string($_GET['search']??'')).'%';$off=($page-1)*$pp;
    $total=$db->query("SELECT COUNT(*) c FROM teachers t JOIN users u ON t.user_id=u.id WHERE u.name LIKE '$q' OR t.employee_id LIKE '$q'")->fetch_assoc()['c'];
    $rows=$db->query("SELECT t.*,u.name,u.email,u.status FROM teachers t JOIN users u ON t.user_id=u.id WHERE u.name LIKE '$q' OR t.employee_id LIKE '$q' ORDER BY t.id DESC LIMIT $pp OFFSET $off")->fetch_all(MYSQLI_ASSOC);
    Response::paginated($rows,(int)$total,$page,$pp);
}

if($m==='GET'&&$id){
    $s=$db->prepare("SELECT t.*,u.name,u.email,u.status FROM teachers t JOIN users u ON t.user_id=u.id WHERE t.id=?");
    $s->bind_param('i',$id);$s->execute();$r=$s->get_result()->fetch_assoc();$s->close();
    if(!$r) Response::error('Not found',404);
    // classes assigned
    $r['classes']=$db->query("SELECT cl.*,sub.name subject_name,c.name course_name FROM classes cl JOIN subjects sub ON cl.subject_id=sub.id JOIN courses c ON cl.course_id=c.id WHERE cl.teacher_id=$id")->fetch_all(MYSQLI_ASSOC);
    Response::success($r);
}

if($m==='POST'){
    JWT::authRole('admin');
    $in=json_decode(file_get_contents('php://input'),true)??[];
    $name=$in['name']??'';$email=$in['email']??'';$pass=$in['password']??'Teacher@123';
    $phone=$in['phone']??'';$addr=$in['address']??'';$qual=$in['qualification']??'';
    $spec=$in['specialization']??'';$jd=$in['join_date']??date('Y-m-d');
    if(!$name||!$email) Response::error('name and email required',422);
    $hash=password_hash($pass,PASSWORD_BCRYPT);
    $db->begin_transaction();
    try{
        $s=$db->prepare("INSERT INTO users(name,email,password,role)VALUES(?,?,?,'teacher')");
        $s->bind_param('sss',$name,$email,$hash);$s->execute();$uid=$db->insert_id;$s->close();
        $eid='TCH-'.date('Y').'-'.str_pad($uid,4,'0',STR_PAD_LEFT);
        $s=$db->prepare("INSERT INTO teachers(user_id,employee_id,phone,address,qualification,specialization,join_date)VALUES(?,?,?,?,?,?,?)");
        $s->bind_param('issssss',$uid,$eid,$phone,$addr,$qual,$spec,$jd);$s->execute();$nid=$db->insert_id;$s->close();
        $db->commit(); Response::success(['id'=>$nid,'employee_id'=>$eid],'Teacher created',201);
    }catch(Exception $e){$db->rollback();Response::error($e->getMessage(),500);}
}

if($m==='PUT'&&$id){
    JWT::authRole('admin');
    $in=json_decode(file_get_contents('php://input'),true)??[];
    $name=$in['name']??'';$phone=$in['phone']??'';$status=$in['status']??'active';
    $qual=$in['qualification']??'';$spec=$in['specialization']??'';
    $s=$db->prepare("UPDATE users u JOIN teachers t ON t.user_id=u.id SET u.name=?,u.status=? WHERE t.id=?");
    $s->bind_param('ssi',$name,$status,$id);$s->execute();$s->close();
    $s=$db->prepare("UPDATE teachers SET phone=?,qualification=?,specialization=? WHERE id=?");
    $s->bind_param('sssi',$phone,$qual,$spec,$id);$s->execute();$s->close();
    Response::success(null,'Teacher updated');
}

if($m==='DELETE'&&$id){
    JWT::authRole('admin');
    $r=$db->query("SELECT user_id FROM teachers WHERE id=$id")->fetch_assoc();
    if(!$r) Response::error('Not found',404);
    $db->query("DELETE FROM users WHERE id={$r['user_id']}");
    Response::success(null,'Teacher deleted');
}
Response::error('Bad request',400);
