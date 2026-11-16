import React, { useEffect, useState } from 'react';
import { attendanceAPI } from '../../services/api';

export default function StudentAttendance() {
  const [att, setAtt] = useState([]);
  useEffect(()=>{ attendanceAPI.list().then(r=>setAtt(r.data.data)).catch(()=>{}); },[]);

  const total   = att.length;
  const present = att.filter(a=>a.status==='present').length;
  const pct     = total ? Math.round(present/total*100) : 0;

  return (
    <>
      <h4 className="page-title mb-4"><i className="bi bi-check2-square me-2"/>My Attendance</h4>
      <div className="row mb-4">
        {[['Total Classes',total,'primary'],['Present',present,'success'],['Absent',att.filter(a=>a.status==='absent').length,'danger'],['Percentage',pct+'%',pct>=75?'success':'danger']].map(([l,v,c])=>(
          <div key={l} className="col-md-3">
            <div className="card stat-card text-center p-3 mb-3">
              <div className={`fs-3 fw-bold text-${c}`}>{v}</div>
              <div className="text-muted small">{l}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card"><div className="card-body p-0">
        <table className="table table-hover mb-0">
          <thead><tr><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {att.map((a,i)=>(
              <tr key={i}>
                <td>{a.date}</td>
                <td><span className={`badge badge-${a.status==='present'?'paid':a.status==='absent'?'overdue':'pending'}`}>{a.status}</span></td>
              </tr>
            ))}
            {!att.length && <tr><td colSpan={2} className="text-center text-muted py-4">No attendance records</td></tr>}
          </tbody>
        </table>
      </div></div>
    </>
  );
}
