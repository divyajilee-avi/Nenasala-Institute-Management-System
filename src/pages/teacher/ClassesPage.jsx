import React, { useEffect, useState } from 'react';
import { classesAPI } from '../../services/api';

export default function TeacherClasses() {
  const [classes, setClasses] = useState([]);
  useEffect(()=>{ classesAPI.list().then(r=>setClasses(r.data.data)).catch(()=>{}); },[]);
  return (
    <>
      <h4 className="page-title mb-4"><i className="bi bi-calendar3 me-2"/>My Classes</h4>
      <div className="card"><div className="card-body p-0">
        <table className="table table-hover mb-0">
          <thead><tr><th>Subject</th><th>Course</th><th>Day</th><th>Start</th><th>End</th><th>Room</th></tr></thead>
          <tbody>
            {classes.map(c=>(
              <tr key={c.id}>
                <td className="fw-semibold">{c.subject_name}</td><td>{c.course_name}</td>
                <td><span className="badge bg-primary">{c.day}</span></td>
                <td>{c.start_time}</td><td>{c.end_time}</td><td>{c.room||'-'}</td>
              </tr>
            ))}
            {!classes.length && <tr><td colSpan={6} className="text-center text-muted py-4">No classes assigned</td></tr>}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
