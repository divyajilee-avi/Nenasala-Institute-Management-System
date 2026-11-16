import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { classesAPI, coursesAPI, teachersAPI } from '../../services/api';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const DAY_COLORS = {
  Monday:'primary', Tuesday:'success', Wednesday:'warning',
  Thursday:'info',  Friday:'danger',   Saturday:'purple',  Sunday:'secondary',
};

export default function ClassesPage() {
  const [classes,  setClasses]  = useState([]);
  const [courses,  setCourses]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [modal,    setModal]    = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterCourse,  setFilterCourse]  = useState('');
  const [form, setForm] = useState({
    day:'Monday', start_time:'08:00', end_time:'09:00',
  });

  const loadClasses = useCallback(() => {
    classesAPI.list()
      .then(r => setClasses(r.data.data ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadClasses();
    coursesAPI.list().then(r => setCourses(r.data.data ?? [])).catch(() => {});
    coursesAPI.listSubjects().then(r => setSubjects(r.data.data ?? [])).catch(() => {});
    teachersAPI.list({ per_page: 200 }).then(r => setTeachers(r.data.data ?? [])).catch(() => {});
  }, [loadClasses]);

  const save = (e) => {
    e.preventDefault();
    setSaving(true);
    classesAPI.create({
      ...form,
      course_id:  +form.course_id,
      subject_id: +form.subject_id,
      teacher_id: +form.teacher_id,
    })
      .then(() => {
        toast.success('Class scheduled');
        setModal(false);
        loadClasses();
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'))
      .finally(() => setSaving(false));
  };

  const del = (id) => {
    if (!window.confirm('Delete this class from timetable?')) return;
    classesAPI.delete(id)
      .then(() => { toast.success('Deleted'); setClasses(prev => prev.filter(c => c.id !== id)); })
      .catch(() => toast.error('Failed'));
  };

  /* ── Filters ───────────────────────────────── */
  const filtered = classes.filter(c =>
    (!filterTeacher || String(c.teacher_id) === filterTeacher) &&
    (!filterCourse  || String(c.course_id)  === filterCourse)
  );

  const byDay = {};
  DAYS.forEach(d => { byDay[d] = filtered.filter(c => c.day === d); });

  const filteredSubjects = subjects.filter(
    s => !form.course_id || String(s.course_id) === String(form.course_id)
  );

  return (
    <>
      {/* ── Header ───────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-calendar3 me-2"/>Class Timetable
          </h4>
          <small className="text-muted">{classes.length} class{classes.length !== 1 ? 'es' : ''} scheduled</small>
        </div>
        <button className="btn btn-primary d-flex align-items-center gap-2"
                onClick={() => { setForm({ day:'Monday', start_time:'08:00', end_time:'09:00' }); setModal(true); }}>
          <i className="bi bi-plus-lg"/>Schedule Class
        </button>
      </div>

      {/* ── Filters ──────────────────────────── */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-4">
              <label className="form-label small fw-semibold mb-1">Filter by Teacher</label>
              <select className="form-select form-select-sm" value={filterTeacher}
                      onChange={e => setFilterTeacher(e.target.value)}>
                <option value="">All Teachers</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label small fw-semibold mb-1">Filter by Course</label>
              <select className="form-select form-select-sm" value={filterCourse}
                      onChange={e => setFilterCourse(e.target.value)}>
                <option value="">All Courses</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              {(filterTeacher || filterCourse) && (
                <button className="btn btn-sm btn-outline-secondary"
                        onClick={() => { setFilterTeacher(''); setFilterCourse(''); }}>
                  <i className="bi bi-x-circle me-1"/>Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Timetable by day ─────────────────── */}
      {DAYS.map(day => {
        const dayCls = byDay[day] ?? [];
        if (!dayCls.length) return null;
        const color = DAY_COLORS[day] ?? 'secondary';
        return (
          <div key={day} className="mb-4">
            <div className="d-flex align-items-center gap-2 mb-2 pb-1 border-bottom">
              <span className={`badge bg-${color} px-3 py-2`}>{day}</span>
              <span className="text-muted small">{dayCls.length} class{dayCls.length !== 1 ? 'es' : ''}</span>
            </div>
            <div className="row g-3">
              {dayCls.map(c => (
                <div key={c.id} className="col-md-4 col-lg-3">
                  <div className="card border-0 shadow-sm h-100"
                       style={{ borderLeft:`4px solid var(--bs-${color})` }}>
                    <div className="card-body py-2 px-3">

                      {/* Subject + Course */}
                      <div className="fw-bold mb-0" style={{ fontSize:'.9rem' }}>
                        {c.subject_name}
                      </div>
                      <span className={`badge bg-${color}-subtle text-${color} mb-2`}
                            style={{ fontSize:'.68rem' }}>
                        {c.course_name}
                      </span>

                      {/* Teacher */}
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                             style={{ width:26, height:26, fontSize:'.7rem' }}>
                          {c.teacher_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="small fw-semibold">{c.teacher_name}</div>
                          <div className="text-muted" style={{ fontSize:'.68rem' }}>Teacher</div>
                        </div>
                      </div>

                      {/* Time + Room */}
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="small text-muted">
                          <i className="bi bi-clock me-1"/>
                          {c.start_time}–{c.end_time}
                        </span>
                        {c.room && (
                          <span className="small text-muted">
                            <i className="bi bi-door-open me-1"/>Room {c.room}
                          </span>
                        )}
                        <button className="btn btn-sm btn-outline-danger p-0 px-1"
                                onClick={() => del(c.id)} title="Delete">
                          <i className="bi bi-trash" style={{ fontSize:'.75rem' }}/>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {!filtered.length && (
        <div className="text-center text-muted py-5">
          <i className="bi bi-calendar-x fs-1 d-block mb-2 opacity-25"/>
          <p>{classes.length ? 'No classes match the selected filters' : 'No classes scheduled yet'}</p>
        </div>
      )}

      {/* ══ Schedule Modal ════════════════════ */}
      {modal && (
        <div className="modal d-block" style={{ background:'rgba(0,0,0,.55)', zIndex:1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0 text-white"
                   style={{ background:'linear-gradient(135deg,#1a3c6e,#2563eb)' }}>
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-calendar-plus me-2"/>Schedule Class
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setModal(false)}/>
              </div>
              <form onSubmit={save}>
                <div className="modal-body row g-3">

                  <div className="col-md-6">
                    <label className="form-label fw-semibold small">Course <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.course_id || ''}
                            onChange={e => setForm({...form, course_id: e.target.value, subject_id:''})} required>
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

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Teacher <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.teacher_id || ''}
                            onChange={e => setForm({...form, teacher_id: e.target.value})} required>
                      <option value="">— Select teacher —</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.specialization ? `· ${t.specialization}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Day <span className="text-danger">*</span></label>
                    <select className="form-select" value={form.day}
                            onChange={e => setForm({...form, day: e.target.value})}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">Start Time <span className="text-danger">*</span></label>
                    <input type="time" className="form-control" value={form.start_time}
                           onChange={e => setForm({...form, start_time: e.target.value})} required/>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-semibold small">End Time <span className="text-danger">*</span></label>
                    <input type="time" className="form-control" value={form.end_time}
                           onChange={e => setForm({...form, end_time: e.target.value})} required/>
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold small">Room (optional)</label>
                    <input className="form-control" value={form.room || ''}
                           onChange={e => setForm({...form, room: e.target.value})}
                           placeholder="e.g. Lab 01, Room A"/>
                  </div>

                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary"
                          onClick={() => setModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                      : <><i className="bi bi-calendar-check me-1"/>Schedule</>
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
