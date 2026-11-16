import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { dashboardAPI } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const StatCard = ({ icon, label, value, color, sub }) => (
  <div className="col-xl-3 col-md-6 mb-4">
    <div className="card stat-card h-100">
      <div className="card-body d-flex align-items-center gap-3">
        <div className={`stat-icon bg-${color}-subtle`} style={{color:`var(--bs-${color})`}}>
          <i className={`bi bi-${icon}`}/>
        </div>
        <div>
          <div className="fs-4 fw-bold">{value}</div>
          <div className="text-muted small">{label}</div>
          {sub && <div className="text-muted" style={{fontSize:'.72rem'}}>{sub}</div>}
        </div>
      </div>
    </div>
  </div>
);

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void dashboardAPI.stats()
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"/></div>;
  if (!data)   return <p className="text-danger">Failed to load dashboard</p>;

  const { counts, fees, att, monthlyFees, recentStudents, notices } = data;

  const barData = {
    labels: monthlyFees.map(m => m.month),
    datasets: [{ label: 'Fee Collection (Rs.)', data: monthlyFees.map(m => m.total),
      backgroundColor: '#1a3c6e', borderRadius: 6 }],
  };
  const doughnutData = {
    labels: ['Collected', 'Pending', 'Overdue'],
    datasets: [{ data: [fees?.collected??0, fees?.pending??0, fees?.overdue??0],
      backgroundColor: ['#10b981','#f59e0b','#ef4444'], borderWidth: 0 }],
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="page-title mb-0">Dashboard</h4>
        <span className="badge bg-primary">Admin Panel</span>
      </div>

      {/* Stat Cards */}
      <div className="row">
        <StatCard icon="people-fill"    label="Total Students" value={counts.students} color="primary" />
        <StatCard icon="person-badge"   label="Teachers"       value={counts.teachers} color="success" />
        <StatCard icon="book-fill"      label="Courses"        value={counts.courses}  color="warning" />
        <StatCard icon="pencil-square"  label="Exams"          value={counts.exams}    color="danger"  />
      </div>
      <div className="row">
        <StatCard icon="check2-square"  label="Present Today"  value={att?.present??0} color="success" sub={`Absent: ${att?.absent??0}`}/>
        <StatCard icon="cash-stack"     label="Fees Collected" value={`Rs. ${Number(fees?.collected??0).toLocaleString()}`} color="info" />
        <StatCard icon="exclamation-triangle" label="Pending Fees" value={`Rs. ${Number(fees?.pending??0).toLocaleString()}`} color="warning" />
        <StatCard icon="journal-bookmark" label="Subjects"     value={counts.subjects} color="secondary"/>
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-lg-8 mb-4">
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Fee Collection — Last 6 Months</h6>
              <Bar data={barData} options={{ responsive:true, plugins:{legend:{display:false}} }}/>
            </div>
          </div>
        </div>
        <div className="col-lg-4 mb-4">
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Fee Status Overview</h6>
              <Doughnut data={doughnutData} options={{ responsive:true, cutout:'65%' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Students & Notices */}
      <div className="row">
        <div className="col-lg-7 mb-4">
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Recent Admissions</h6>
              <table className="table table-sm table-hover">
                <thead><tr><th>ID</th><th>Name</th><th>Course</th><th>Date</th></tr></thead>
                <tbody>
                  {recentStudents.map((s,i)=>(
                    <tr key={i}>
                      <td><span className="badge bg-primary-subtle text-primary">{s.student_id}</span></td>
                      <td>{s.name}</td><td>{s.course}</td>
                      <td className="text-muted small">{s.admission_date}</td>
                    </tr>
                  ))}
                  {!recentStudents.length && <tr><td colSpan={4} className="text-center text-muted">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="col-lg-5 mb-4">
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Latest Notices</h6>
              {notices.map((n,i)=>(
                <div key={i} className="d-flex gap-2 mb-2 pb-2 border-bottom">
                  <i className="bi bi-megaphone-fill text-warning mt-1"/>
                  <div>
                    <div className="fw-semibold small">{n.title}</div>
                    <div className="text-muted" style={{fontSize:'.72rem'}}>{n.posted_by} · {n.created_at?.slice(0,10)}</div>
                  </div>
                </div>
              ))}
              {!notices.length && <p className="text-muted small">No notices</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
