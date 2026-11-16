import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { examsAPI, coursesAPI, studentsAPI } from '../../services/api';

export default function ExamsPage() {
  const [exams,    setExams]    = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal,    setModal]    = useState('');   // '' | 'exam' | 'results'
  const [form,     setForm]     = useState({ total_marks: 100, pass_marks: 40 });
  const [selected, setSelected] = useState(null);
  const [results,  setResults]  = useState([]);
  const [students, setStudents] = useState([]);
  const [marks,    setMarks]    = useState({});
  const [saving,   setSaving]   = useState(false);
  const [loadingR, setLoadingR] = useState(false);

  /* ── Load on mount ───────────────────────────── */
  const loadExams = useCallback(() => {
    examsAPI.list()
      .then(r => setExams(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadExams();
    coursesAPI.list().then(r => setCourses(r.data.data ?? [])).catch(() => {});
    coursesAPI.listSubjects().then(r => setSubjects(r.data.data ?? [])).catch(() => {});
  }, [loadExams]);

  /* ── Open results modal ──────────────────────── */
  const viewResults = (exam) => {
    setSelected(exam);
    setMarks({});
    setStudents([]);
    setResults([]);
    setModal('results');
    setLoadingR(true);

    Promise.all([
      examsAPI.getResults(exam.id),
      // Only students registered in the exam's course
      studentsAPI.list({ per_page: 300 }),
    ])
      .then(([res, studs]) => {
        const allStudents = studs.data.data ?? [];
        // Filter by course
        const enrolled = allStudents.filter(
          s => String(s.course_id) === String(exam.course_id)
        );
        setStudents(enrolled);
        setResults(res.data.data ?? []);
        // Pre-fill existing marks
        const m = {};
        (res.data.data ?? []).forEach(r => { m[r.student_id] = r.marks; });
        setMarks(m);
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoadingR(false));
  };

  /* ── Create exam ─────────────────────────────── */
  const saveExam = (e) => {
    e.preventDefault();
    setSaving(true);
    examsAPI.create({ ...form, course_id: +form.course_id, subject_id: +form.subject_id,
                       total_marks: +form.total_marks, pass_marks: +form.pass_marks })
      .then(() => { toast.success('Exam scheduled'); setModal(''); loadExams(); })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'))
      .finally(() => setSaving(false));
  };

  /* ── Save results ────────────────────────────── */
  const submitResults = (e) => {
    e.preventDefault();
    const records = Object.entries(marks)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([student_id, m]) => ({ student_id: +student_id, marks: +m }));

    if (!records.length) { toast.warning('Enter at least one mark'); return; }
    setSaving(true);
    examsAPI.uploadResults({ exam_id: selected.id, results: records })
      .then(() => { toast.success(`Results saved for ${records.length} students!`); setModal(''); })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'))
      .finally(() => setSaving(false));
  };

  const filteredSubjects = subjects.filter(
    s => !form.course_id || String(s.course_id) === String(form.course_id)
  );

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-pencil-square me-2"/>Exams &amp; Results
          </h4>
          <small className="text-muted">{exams.length} exam{exams.length !== 1 ? 's' : ''} scheduled</small>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => { setForm({ total_marks: 100, pass_marks: 40 }); setModal('exam'); }}>
          <i className="bi bi-plus-lg"/>Schedule Exam
        </button>
      </div>

      {/* ── Exams table ──────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          <table className="table table-hover align-middle mb-0">
            <thead>
              <tr>
                <th>Exam Name</th><th>Course</th><th>Subject</th>
                <th>Date</th><th>Total</th><th>Pass</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(e => (
                <tr key={e.id}>
                  <td className="fw-semibold">{e.name}</td>
                  <td><span className="badge bg-primary-subtle text-primary">{e.course_name}</span></td>
                  <td className="text-muted small">{e.subject_name}</td>
                  <td className="text-muted small">{e.exam_date}</td>
                  <td><span className="badge bg-secondary">{e.total_marks}</span></td>
                  <td><span className="badge bg-warning-subtle text-warning">{e.pass_marks}</span></td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1 mx-auto"
                            onClick={() => viewResults(e)}>
                      <i className="bi bi-list-ol"/>Results
                    </button>
                  </td>
                </tr>
              ))}
              {!exams.length && (
                <tr><td colSpan={7} className="text-center text-muted py-5">
                  <i className="bi bi-pencil-square fs-1 d-block mb-2 opacity-25"/>No exams scheduled
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══ Schedule Exam Modal ═══════════════ */}
      {modal === 'exam' && (
        <div className="modal d-block" style={{ background:'rgba(0,0,0,.55)', zIndex:1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 text-white"
                   style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus me-2"/>Schedule Exam
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setModal('')}/>
              </div>
              <form onSubmit={saveExam}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label fw-semibold small">Exam Name <span className="text-danger">*</span></label>
                    <input className="form-control" value={form.name || ''}
                           onChange={e => setForm({...form, name: e.target.value})} required
                           placeholder="e.g. Mid-Term Exam 2026"/>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Course <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.course_id || ''}
                            onChange={e => setForm({...form, course_id: e.target.value, subject_id: ''})} required>
                      <option value="">— Select course —</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Subject <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.subject_id || ''}
                            onChange={e => setForm({...form, subject_id: e.target.value})} required>
                      <option value="">— Select subject —</option>
                      {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Exam Date <span className="text-danger">*</span></label>
                    <input type="date" className="form-control" value={form.exam_date || ''}
                           onChange={e => setForm({...form, exam_date: e.target.value})} required/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Total Marks</label>
                    <input type="number" className="form-control" value={form.total_marks}
                           onChange={e => setForm({...form, total_marks: e.target.value})} min={1}/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Pass Marks</label>
                    <input type="number" className="form-control" value={form.pass_marks}
                           onChange={e => setForm({...form, pass_marks: e.target.value})} min={1}/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setModal('')}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : 'Create Exam'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ══ Results Modal ════════════════════════ */}
      {modal === 'results' && selected && (
        <div className="modal d-block" tabIndex="-1"
             style={{ background:'rgba(0,0,0,.55)', zIndex:1050 }}>
          <div className="modal-dialog modal-xl"
               style={{ margin:'20px auto', maxHeight:'calc(100vh - 40px)',
                        display:'flex', flexDirection:'column' }}>
            <div className="modal-content border-0 shadow-lg"
                 style={{ display:'flex', flexDirection:'column', maxHeight:'calc(100vh - 40px)' }}>

              {/* Header */}
              <div className="modal-header flex-shrink-0 border-0 text-white"
                   style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                <div>
                  <h5 className="modal-title fw-bold mb-0">
                    <i className="bi bi-list-ol me-2"/>Enter Marks — {selected.name}
                  </h5>
                  <small className="opacity-75">
                    {selected.course_name} · {selected.subject_name} · {selected.exam_date}
                    · Total: {selected.total_marks} · Pass: {selected.pass_marks}
                  </small>
                </div>
                <button className="btn-close btn-close-white ms-3" onClick={() => setModal('')}/>
              </div>

              <form onSubmit={submitResults}
                    style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>

                {/* Info bar */}
                <div className="flex-shrink-0 px-4 py-2 border-bottom"
                     style={{ background:'#eff6ff' }}>
                  <small className="text-primary fw-semibold">
                    <i className="bi bi-info-circle me-1"/>
                    Showing {students.length} registered students for <strong>{selected.course_name}</strong>
                  </small>
                </div>

                {/* Scrollable table */}
                <div className="overflow-auto flex-grow-1">
                  {loadingR ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary"/>
                      <p className="text-muted mt-2 small">Loading registered students…</p>
                    </div>
                  ) : (
                    <table className="table table-hover align-middle mb-0">
                      <thead style={{ position:'sticky', top:0, zIndex:2 }}>
                        <tr>
                          <th style={{ background:'#1a3c6e', color:'#fff' }}>#</th>
                          <th style={{ background:'#1a3c6e', color:'#fff' }}>Student ID</th>
                          <th style={{ background:'#1a3c6e', color:'#fff' }}>Name</th>
                          <th style={{ background:'#1a3c6e', color:'#fff' }}>
                            Marks
                            <span className="opacity-75 fw-normal small ms-1">/ {selected.total_marks}</span>
                          </th>
                          <th style={{ background:'#1a3c6e', color:'#fff' }}>Grade</th>
                          <th style={{ background:'#1a3c6e', color:'#fff' }}>Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => {
                          const m     = marks[s.id] ?? '';
                          const pct   = selected.total_marks > 0 && m !== ''
                            ? (+m / selected.total_marks) * 100 : null;
                          const grade = pct !== null
                            ? pct >= 75 ? 'A' : pct >= 65 ? 'B'
                              : pct >= 55 ? 'C' : pct >= 45 ? 'S' : 'F'
                            : '—';
                          const passed = m !== '' && +m >= selected.pass_marks;
                          const gc = { A:'success', B:'primary', C:'info', S:'warning', F:'danger' };

                          return (
                            <tr key={s.id}>
                              <td className="text-muted small">{i + 1}</td>
                              <td>
                                <span className="badge bg-primary">{s.student_id}</span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold"
                                       style={{ width:32, height:32, fontSize:'.75rem', flexShrink:0 }}>
                                    {s.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="fw-semibold">{s.name}</span>
                                </div>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  style={{ width: 90 }}
                                  min={0}
                                  max={selected.total_marks}
                                  value={m}
                                  placeholder="—"
                                  onChange={e => setMarks(prev => ({
                                    ...prev, [s.id]: e.target.value,
                                  }))}
                                />
                              </td>
                              <td>
                                <span className={`badge bg-${gc[grade] ?? 'secondary'} px-2`}>
                                  {grade}
                                </span>
                              </td>
                              <td>
                                {m !== ''
                                  ? <span className={`badge ${passed ? 'bg-success' : 'bg-danger'}`}>
                                      {passed ? 'PASS' : 'FAIL'}
                                    </span>
                                  : <span className="text-muted small">—</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                        {!students.length && !loadingR && (
                          <tr>
                            <td colSpan={6} className="text-center text-muted py-5">
                              <i className="bi bi-people fs-1 d-block mb-2 opacity-25"/>
                              No students registered for {selected.course_name}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 d-flex justify-content-between align-items-center px-4 py-3"
                     style={{ borderTop:'2px solid #e5e7eb', background:'#f8fafc' }}>
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"/>
                    Grades: A(75%+) B(65%+) C(55%+) S(45%+) F(below 45%)
                  </small>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-outline-secondary"
                            onClick={() => setModal('')}>Close</button>
                    <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                      {saving
                        ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                        : <><i className="bi bi-cloud-upload me-1"/>Save Results</>
                      }
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
