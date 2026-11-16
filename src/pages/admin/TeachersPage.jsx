import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { teachersAPI } from '../../services/api';

const INIT = { name:'', email:'', password:'Teacher@123', phone:'', address:'', qualification:'', specialization:'', join_date:'' };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [search, setSearch]   = useState('');
  const [page,   setPage]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(INIT);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const r = await teachersAPI.list({ page, per_page:10, search });
      setTeachers(r.data.data); setPagination(r.data.pagination);
    } catch { toast.error('Failed to load'); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await teachersAPI.update(editing.id, form); toast.success('Updated'); }
      else         { await teachersAPI.create(form);              toast.success('Teacher added'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err.response?.data?.message ?? 'Error'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try { await teachersAPI.delete(id); toast.success('Deleted'); fetch(); } catch { toast.error('Failed'); }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="page-title mb-0"><i className="bi bi-person-badge me-2"/>Teachers</h4>
        <button className="btn btn-primary" onClick={()=>{setEditing(null);setForm(INIT);setModal(true);}}><i className="bi bi-plus-lg me-1"/>Add Teacher</button>
      </div>
      <div className="card mb-3"><div className="card-body py-2">
        <div className="input-group" style={{maxWidth:320}}>
          <span className="input-group-text"><i className="bi bi-search"/></span>
          <input className="form-control" placeholder="Search…" value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}/>
        </div>
      </div></div>
      <div className="card"><div className="card-body p-0">
        {loading ? <div className="text-center p-4"><div className="spinner-border text-primary"/></div> : (
          <table className="table table-hover mb-0">
            <thead><tr><th>Emp ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Qualification</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {teachers.map(t=>(
                <tr key={t.id}>
                  <td><span className="badge bg-success">{t.employee_id}</span></td>
                  <td className="fw-semibold">{t.name}</td><td className="text-muted small">{t.email}</td>
                  <td>{t.phone||'-'}</td><td>{t.qualification||'-'}</td>
                  <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={()=>{setEditing(t);setForm({name:t.name,phone:t.phone||'',qualification:t.qualification||'',specialization:t.specialization||'',status:t.status});setModal(true);}}><i className="bi bi-pencil"/></button>
                    <button className="btn btn-sm btn-outline-danger" onClick={()=>del(t.id)}><i className="bi bi-trash"/></button>
                  </td>
                </tr>
              ))}
              {!teachers.length && <tr><td colSpan={7} className="text-center text-muted py-4">No teachers</td></tr>}
            </tbody>
          </table>
        )}
      </div></div>

      {modal && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,.5)'}}>
          <div className="modal-dialog"><div className="modal-content">
            <div className="modal-header"><h5 className="modal-title">{editing?'Edit':'Add'} Teacher</h5><button className="btn-close" onClick={()=>setModal(false)}/></div>
            <form onSubmit={save}>
              <div className="modal-body row g-3">
                <div className="col-md-6"><label className="form-label">Name*</label><input className="form-control" name="name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/></div>
                {!editing && <>
                  <div className="col-md-6"><label className="form-label">Email*</label><input type="email" className="form-control" name="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/></div>
                  <div className="col-md-6"><label className="form-label">Password</label><input className="form-control" value={form.password} onChange={e=>setForm({...form,password:e.target.value})}/></div>
                </>}
                <div className="col-md-6"><label className="form-label">Phone</label><input className="form-control" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
                <div className="col-md-6"><label className="form-label">Qualification</label><input className="form-control" value={form.qualification} onChange={e=>setForm({...form,qualification:e.target.value})}/></div>
                <div className="col-md-6"><label className="form-label">Specialization</label><input className="form-control" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})}/></div>
                {!editing && <div className="col-md-6"><label className="form-label">Join Date</label><input type="date" className="form-control" value={form.join_date} onChange={e=>setForm({...form,join_date:e.target.value})}/></div>}
                {editing && <div className="col-md-6"><label className="form-label">Status</label><select className="form-select" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={()=>setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div></div>
        </div>
      )}
    </>
  );
}
