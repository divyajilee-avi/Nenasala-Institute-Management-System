import React, { useEffect, useState } from 'react';
import { feesAPI, attendanceAPI, noticesAPI, examsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [fees,    setFees]    = useState([]);
  const [att,     setAtt]     = useState([]);
  const [notices, setNotices] = useState([]);

  useEffect(()=>{
    feesAPI.list({status:'pending'}).then(r=>setFees(r.data.data)).catch(()=>{});
    attendanceAPI.list().then(r=>setAtt(r.data.data.slice(0,5))).catch(()=>{});
    noticesAPI.list().then(r=>setNotices(r.data.data.slice(0,4))).catch(()=>{});
  },[]);

  const pendingFees = fees.reduce((s,f)=>s+parseFloat(f.amount),0);

  return (
    <>
      <div className="mb-4">
        <h4 className="page-title mb-0">Dashboard</h4>
        <p className="text-muted">Student Portal — {user?.name}</p>
      </div>
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card stat-card text-center p-3">
            <div className="stat-icon bg-warning-subtle mx-auto mb-2" style={{color:'var(--bs-warning)'}}><i className="bi bi-cash-stack"/></div>
            <div className="fs-4 fw-bold text-warning">Rs. {pendingFees.toLocaleString()}</div>
            <div className="text-muted small">Pending Fees</div>
            <Link to="/student/fees" className="btn btn-sm btn-outline-warning mt-2">View Fees</Link>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card stat-card text-center p-3">
            <div className="stat-icon bg-success-subtle mx-auto mb-2" style={{color:'var(--bs-success)'}}><i className="bi bi-check2-square"/></div>
            <div className="fs-4 fw-bold text-success">{att.filter(a=>a.status==='present').length}</div>
            <div className="text-muted small">Present (Recent)</div>
            <Link to="/student/attendance" className="btn btn-sm btn-outline-success mt-2">View All</Link>
          </div>
        </div>
        <div className="col-md-4 mb-4">
          <div className="card stat-card text-center p-3">
            <div className="stat-icon bg-info-subtle mx-auto mb-2" style={{color:'var(--bs-info)'}}><i className="bi bi-megaphone-fill"/></div>
            <div className="fs-4 fw-bold text-info">{notices.length}</div>
            <div className="text-muted small">Notices</div>
            <Link to="/student/notices" className="btn btn-sm btn-outline-info mt-2">View All</Link>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="card stat-card mb-4">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Recent Attendance</h6>
              <table className="table table-sm">
                <thead><tr><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {att.map((a,i)=><tr key={i}><td>{a.date}</td><td><span className={`badge badge-${a.status==='present'?'paid':a.status==='absent'?'overdue':'pending'}`}>{a.status}</span></td></tr>)}
                  {!att.length && <tr><td colSpan={2} className="text-muted text-center">No records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Notices</h6>
              {notices.map(n=><div key={n.id} className="mb-2 pb-2 border-bottom"><div className="fw-semibold small">{n.title}</div><div className="text-muted" style={{fontSize:'.72rem'}}>{n.created_at?.slice(0,10)}</div></div>)}
              {!notices.length && <p className="text-muted small">No notices</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
