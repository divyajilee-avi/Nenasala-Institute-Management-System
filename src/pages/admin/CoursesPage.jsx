import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { coursesAPI } from '../../services/api';

export default function CoursesPage() {
  const [courses,  setCourses]  = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [tab,      setTab]      = useState('courses');
  const [modal,    setModal]    = useState('');
  const [form,     setForm]     = useState({});

  // Use .then/.catch — never return a Promise to useEffect
  const loadCourses = useCallback(() => {
    coursesAPI.list()
      .then(r => setCourses(r.data.data))
      .catch(() => {});
  }, []);

  const loadSubjects = useCallback(() => {
    coursesAPI.listSubjects()
      .then(r => setSubjects(r.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCourses();
    loadSubjects();
  }, [loadCourses, loadSubjects]);

  const saveCourse = (e) => {
    e.preventDefault();
    const action = form.id
      ? coursesAPI.update(form.id, form)
      : coursesAPI.create(form);
    action
      .then(() => { toast.success('Saved'); setModal(''); loadCourses(); })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'));
  };

  const saveSubject = (e) => {
    e.preventDefault();
    coursesAPI.createSubject(form)
      .then(() => { toast.success('Subject added'); setModal(''); loadSubjects(); })
      .catch(err => toast.error(err.response?.data?.message ?? 'Error'));
  };

  const delCourse = (id) => {
    if (!window.confirm('Delete this course?')) return;
    coursesAPI.delete(id)
      .then(() => { toast.success('Deleted'); loadCourses(); })
      .catch(() => toast.error('Delete failed'));
  };

  const delSubject = (id) => {
    if (!window.confirm('Delete this subject?')) return;
    coursesAPI.deleteSubject(id)
      .then(() => { toast.success('Deleted'); loadSubjects(); })
      .catch(() => toast.error('Delete failed'));
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="page-title mb-0">
          <i className="bi bi-book-fill me-2"/>Courses &amp; Subjects
        </h4>
        <div className="d-flex gap-2">
          {tab === 'courses' && (
            <button className="btn btn-primary"
                    onClick={() => { setForm({}); setModal('course'); }}>
              <i className="bi bi-plus-lg me-1"/>Add Course
            </button>
          )}
          {tab === 'subjects' && (
            <button className="btn btn-success"
                    onClick={() => { setForm({}); setModal('subject'); }}>
              <i className="bi bi-plus-lg me-1"/>Add Subject
            </button>
          )}
        </div>
      </div>

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'courses' ? 'active' : ''}`}
                  onClick={() => setTab('courses')}>
            Courses ({courses.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'subjects' ? 'active' : ''}`}
                  onClick={() => setTab('subjects')}>
            Subjects ({subjects.length})
          </button>
        </li>
      </ul>

      {/* Courses Table */}
      {tab === 'courses' && (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead>
                <tr><th>Code</th><th>Name</th><th>Duration</th><th>Fee</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td><span className="badge bg-primary">{c.code}</span></td>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.duration || '-'}</td>
                    <td>Rs. {Number(c.fee).toLocaleString()}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-1"
                              onClick={() => { setForm(c); setModal('course'); }}>
                        <i className="bi bi-pencil"/>
                      </button>
                      <button className="btn btn-sm btn-outline-danger"
                              onClick={() => delCourse(c.id)}>
                        <i className="bi bi-trash"/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!courses.length && (
                  <tr><td colSpan={6} className="text-center text-muted py-4">No courses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subjects Table */}
      {tab === 'subjects' && (
        <div className="card">
          <div className="card-body p-0">
            <table className="table table-hover mb-0">
              <thead>
                <tr><th>Code</th><th>Name</th><th>Course</th><th>Credits</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id}>
                    <td><span className="badge bg-success">{s.code}</span></td>
                    <td className="fw-semibold">{s.name}</td>
                    <td>{s.course_name}</td>
                    <td>{s.credits}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-danger"
                              onClick={() => delSubject(s.id)}>
                        <i className="bi bi-trash"/>
                      </button>
                    </td>
                  </tr>
                ))}
                {!subjects.length && (
                  <tr><td colSpan={5} className="text-center text-muted py-4">No subjects found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {modal === 'course' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{form.id ? 'Edit' : 'Add'} Course</h5>
                <button className="btn-close" onClick={() => setModal('')}/>
              </div>
              <form onSubmit={saveCourse}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Course Name*</label>
                    <input className="form-control" value={form.name || ''}
                           onChange={e => setForm({ ...form, name: e.target.value })} required/>
                  </div>
                  {!form.id && (
                    <div className="col-md-6">
                      <label className="form-label">Code*</label>
                      <input className="form-control" value={form.code || ''}
                             onChange={e => setForm({ ...form, code: e.target.value })} required/>
                    </div>
                  )}
                  <div className="col-md-6">
                    <label className="form-label">Duration</label>
                    <input className="form-control" value={form.duration || ''}
                           onChange={e => setForm({ ...form, duration: e.target.value })}/>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Fee (Rs.)</label>
                    <input type="number" className="form-control" value={form.fee || 0}
                           onChange={e => setForm({ ...form, fee: e.target.value })}/>
                  </div>
                  {form.id && (
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select className="form-select" value={form.status || 'active'}
                              onChange={e => setForm({ ...form, status: e.target.value })}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  )}
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" rows={2} value={form.description || ''}
                              onChange={e => setForm({ ...form, description: e.target.value })}/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary"
                          onClick={() => setModal('')}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {modal === 'subject' && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Subject</h5>
                <button className="btn-close" onClick={() => setModal('')}/>
              </div>
              <form onSubmit={saveSubject}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Course*</label>
                    <select className="form-select" value={form.course_id || ''}
                            onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                      <option value="">Select course…</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-8">
                    <label className="form-label">Subject Name*</label>
                    <input className="form-control" value={form.name || ''}
                           onChange={e => setForm({ ...form, name: e.target.value })} required/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Code*</label>
                    <input className="form-control" value={form.code || ''}
                           onChange={e => setForm({ ...form, code: e.target.value })} required/>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Credits</label>
                    <input type="number" className="form-control" value={form.credits || 1}
                           onChange={e => setForm({ ...form, credits: e.target.value })}/>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary"
                          onClick={() => setModal('')}>Cancel</button>
                  <button type="submit" className="btn btn-success">Add Subject</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
