import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { attendanceAPI, classesAPI, studentsAPI } from '../../services/api';

export default function AttendancePage() {
  const [classes,  setClasses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [att,      setAtt]      = useState({});
  const [classId,  setClassId]  = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [loading,  setLoading]  = useState(false);
  const [saving,   setSaving]   = useState(false);

  /* ── Load classes once ───────────────────────── */
  useEffect(() => {
    classesAPI.list()
      .then(r => setClasses(r.data.data ?? []))
      .catch(() => {});
  }, []);

  /* ── Load only students registered in the selected class's COURSE ── */
  const loadStudents = useCallback((cid, currentDate) => {
    if (!cid) return;

    // Find the course_id for this class
    const cls = classes.find(c => String(c.id) === String(cid));
    if (!cls) return;

    setLoading(true);
    Promise.all([
      // Only load students enrolled in that course
      studentsAPI.list({ per_page: 300 }),
      attendanceAPI.list({ class_id: cid, date: currentDate }),
    ])
      .then(([studs, existing]) => {
        // Filter students by course
        const enrolled = (studs.data.data ?? []).filter(
          s => String(s.course_id) === String(cls.course_id)
        );
        setStudents(enrolled);

        // Pre-fill existing attendance; default new ones to 'present'
        const a = {};
        (existing.data.data ?? []).forEach(e => { a[e.student_id] = e.status; });
        enrolled.forEach(s => { if (!a[s.id]) a[s.id] = 'present'; });
        setAtt(a);
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false));
  }, [classes]);

  useEffect(() => {
    if (classId) loadStudents(classId, date);
  }, [classId, date, loadStudents]);

  /* ── Save attendance ─────────────────────────── */
  const save = () => {
    if (!classId) { toast.warning('Select a class first'); return; }
    const records = Object.entries(att).map(([student_id, status]) => ({
      student_id: +student_id, status,
    }));
    setSaving(true);
    attendanceAPI.markBulk({ class_id: +classId, date, records })
      .then(() => toast.success(`Attendance saved for ${records.length} students!`))
      .catch(() => toast.error('Failed to save'))
      .finally(() => setSaving(false));
  };

  const markAll = (status) => {
    const a = {};
    students.forEach(s => { a[s.id] = status; });
    setAtt(a);
  };

  const counts = { present: 0, absent: 0, late: 0 };
  Object.values(att).forEach(s => { if (counts[s] !== undefined) counts[s]++; });

  const selectedClass = classes.find(c => String(c.id) === String(classId));

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-check2-square me-2"/>Attendance
          </h4>
          {selectedClass && (
            <small className="text-muted">
              <span className="badge bg-primary me-1">{selectedClass.course_name}</span>
              {selectedClass.subject_name} · {selectedClass.day} {selectedClass.start_time}–{selectedClass.end_time}
            </small>
          )}
        </div>
      </div>

      {/* ── Controls ─────────────────────────── */}
      <div className="card border-0 shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-3 align-items-end">

            {/* Class selector */}
            <div className="col-md-5">
              <label className="form-label fw-semibold small">
                Class / Subject <span className="text-danger">*</span>
              </label>
              <select className="form-select" value={classId}
                      onChange={e => { setClassId(e.target.value); setStudents([]); setAtt({}); }}>
                <option value="">— Select class —</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.subject_name} · {c.course_name} ({c.day} {c.start_time})
                  </option>
                ))}
              </select>
            </div>

            {/* Date picker */}
            <div className="col-md-3">
              <label className="form-label fw-semibold small">Date</label>
              <input type="date" className="form-control" value={date}
                     onChange={e => setDate(e.target.value)} />
            </div>

            {/* Action buttons */}
            <div className="col-md-4 d-flex gap-2 flex-wrap">
              <button className="btn btn-outline-success btn-sm"
                      onClick={() => markAll('present')}
                      disabled={!students.length}>
                <i className="bi bi-check-all me-1"/>All Present
              </button>
              <button className="btn btn-outline-danger btn-sm"
                      onClick={() => markAll('absent')}
                      disabled={!students.length}>
                <i className="bi bi-x-circle me-1"/>All Absent
              </button>
              <button className="btn btn-primary"
                      onClick={save}
                      disabled={saving || !students.length}>
                {saving
                  ? <><span className="spinner-border spinner-border-sm me-1"/>Saving…</>
                  : <>Save</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ────────────────────────────── */}
      {students.length > 0 && (
        <div className="row g-2 mb-3">
          {[
            { key:'present', label:'Present', color:'success', icon:'check-circle-fill' },
            { key:'absent',  label:'Absent',  color:'danger',  icon:'x-circle-fill'     },
            { key:'late',    label:'Late',    color:'warning', icon:'clock-fill'         },
          ].map(s => (
            <div key={s.key} className="col-4">
              <div className={`card border-0 bg-${s.color}-subtle text-center py-2`}>
                <div className={`fw-bold fs-4 text-${s.color}`}>{counts[s.key]}</div>
                <div className="text-muted small">
                  <i className={`bi bi-${s.icon} me-1`}/>{s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Student list ─────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {!classId ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-calendar3 fs-1 d-block mb-2 opacity-25"/>
              <p>Select a class to view and mark attendance</p>
            </div>
          ) : loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"/>
              <p className="text-muted mt-2 small">Loading registered students…</p>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center text-muted py-5">
              <i className="bi bi-people fs-1 d-block mb-2 opacity-25"/>
              <p>No students registered for <strong>{selectedClass?.course_name}</strong></p>
            </div>
          ) : (
            <>
              <div className="px-3 py-2 border-bottom bg-light d-flex justify-content-between">
                <small className="text-muted fw-semibold">
                  {students.length} students enrolled in {selectedClass?.course_name}
                </small>
                <small className="text-muted">{date}</small>
              </div>
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const status = att[s.id] ?? 'present';
                    return (
                      <tr key={s.id}
                          style={{
                            background: status === 'absent' ? '#fff5f5'
                              : status === 'late' ? '#fffbeb' : '',
                          }}>
                        <td className="text-muted small">{i + 1}</td>
                        <td>
                          <span className="badge bg-primary">{s.student_id}</span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                 style={{ width: 32, height: 32, fontSize: '.75rem', flexShrink: 0 }}>
                              {s.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-semibold">{s.name}</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-3">
                            {[
                              { val:'present', color:'success' },
                              { val:'absent',  color:'danger'  },
                              { val:'late',    color:'warning' },
                            ].map(opt => (
                              <div key={opt.val} className="form-check mb-0">
                                <input
                                  type="radio"
                                  className="form-check-input"
                                  name={`att_${s.id}`}
                                  id={`att_${s.id}_${opt.val}`}
                                  checked={att[s.id] === opt.val}
                                  onChange={() => setAtt(prev => ({ ...prev, [s.id]: opt.val }))}
                                />
                                <label
                                  htmlFor={`att_${s.id}_${opt.val}`}
                                  className={`form-check-label small fw-semibold text-${opt.color}`}
                                >
                                  {opt.val.charAt(0).toUpperCase() + opt.val.slice(1)}
                                </label>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  );
}
