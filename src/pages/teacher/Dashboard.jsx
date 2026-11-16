import React, { useEffect, useState } from 'react';
import { classesAPI, noticesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses]  = useState([]);
  const [notices, setNotices]  = useState([]);

  useEffect(()=>{
    classesAPI.list().then(r=>setClasses(r.data.data)).catch(()=>{});
    noticesAPI.list().then(r=>setNotices(r.data.data.slice(0,5))).catch(()=>{});
  },[]);

  return (
    <>
      <div className="mb-4">
        <h4 className="page-title mb-0">Welcome, {user?.name}</h4>
        <p className="text-muted">Teacher Dashboard</p>
      </div>
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card stat-card text-center p-3">
            <div className="stat-icon bg-primary-subtle mx-auto mb-2" style={{color:'var(--bs-primary)'}}><i className="bi bi-calendar3"/></div>
            <div className="fs-3 fw-bold">{classes.length}</div>
            <div className="text-muted">Assigned Classes</div>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-7">
          <div className="card stat-card mb-4">
            <div className="card-body">
              <h6 className="fw-bold mb-3">My Classes</h6>
              <table className="table table-sm">
                <thead><tr><th>Subject</th><th>Course</th><th>Day</th><th>Time</th></tr></thead>
                <tbody>
                  {classes.map(c=><tr key={c.id}><td>{c.subject_name}</td><td>{c.course_name}</td><td>{c.day}</td><td>{c.start_time}–{c.end_time}</td></tr>)}
                  {!classes.length && <tr><td colSpan={4} className="text-muted text-center">No classes</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Latest Notices</h6>
              {notices.map(n=><div key={n.id} className="mb-2 pb-2 border-bottom"><div className="fw-semibold small">{n.title}</div><div className="text-muted" style={{fontSize:'.72rem'}}>{n.created_at?.slice(0,10)}</div></div>)}
              {!notices.length && <p className="text-muted small">No notices</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
