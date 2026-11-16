import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_COLORS = {
  admin:        'danger',
  teacher:      'success',
  student:      'primary',
  receptionist: 'warning',
};

const ROLE_ICONS = {
  admin:        'shield-fill',
  teacher:      'person-badge-fill',
  student:      'mortarboard-fill',
  receptionist: 'headset',
};

export default function UsersPage() {
  const { user: me }              = useAuth();
  const [users,    setUsers]      = useState([]);
  const [loading,  setLoading]    = useState(false);
  const [search,   setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editModal, setEditModal] = useState(null);   // user obj being edited
  const [editForm,  setEditForm]  = useState({});
  const [saving,    setSaving]    = useState(false);
  const [stats,     setStats]     = useState({});

  /* ── Load users ──────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true);
    usersAPI.list({ search, role: roleFilter })
      .then(r => {
        const data = r.data.data ?? [];
        setUsers(data);
        // Compute stats
        const s = { total: data.length, admin: 0, teacher: 0, student: 0, receptionist: 0 };
        data.forEach(u => { if (s[u.role] !== undefined) s[u.role]++; });
        setStats(s);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [search, roleFilter]);

  useEffect(() => { load(); }, [load]);

  /* ── Open edit modal ─────────────────────────── */
  const openEdit = (u) => {
    setEditForm({ status: u.status, role: u.role });
    setEditModal(u);
  };

  /* ── Save user changes ───────────────────────── */
  const saveUser = (e) => {
    e.preventDefault();
    if (!editModal) return;
    setSaving(true);
    usersAPI.update(editModal.id, editForm)
      .then(() => {
        toast.success(`${editModal.name} updated`);
        setEditModal(null);
        load();
      })
      .catch(err => toast.error(err.response?.data?.message ?? 'Update failed'))
      .finally(() => setSaving(false));
  };

  /* ── Quick status toggle ─────────────────────── */
  const toggleStatus = (u) => {
    if (u.id === me?.id) { toast.warning("You can't change your own status"); return; }
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    usersAPI.update(u.id, { status: newStatus, role: u.role })
      .then(() => {
        toast.success(`${u.name} marked as ${newStatus}`);
        load();
      })
      .catch(() => toast.error('Update failed'));
  };

  /* ── Delete user ─────────────────────────────── */
  const delUser = (u) => {
    if (u.id === me?.id) { toast.warning("You can't delete your own account"); return; }
    if (!window.confirm(`Delete user "${u.name}"?\nThis will permanently remove all their data.`)) return;
    usersAPI.delete(u.id)
      .then(() => { toast.success(`${u.name} deleted`); load(); })
      .catch(() => toast.error('Delete failed'));
  };

  return (
    <>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="page-title mb-0">
            <i className="bi bi-shield-lock-fill me-2"/>User Management
          </h4>
          <small className="text-muted">{stats.total ?? 0} total users</small>
        </div>
      </div>

      {/* Stats row */}
      <div className="row mb-4">
        {[
          { key: 'admin',        label: 'Admins',        color: 'danger'  },
          { key: 'teacher',      label: 'Teachers',      color: 'success' },
          { key: 'student',      label: 'Students',      color: 'primary' },
          { key: 'receptionist', label: 'Receptionists', color: 'warning' },
        ].map(s => (
          <div key={s.key} className="col-6 col-md-3 mb-3">
            <div
              className="card border-0 shadow-sm text-center py-3 px-2"
              style={{ cursor: 'pointer', borderLeft: `4px solid var(--bs-${s.color}) !important` }}
              onClick={() => setRoleFilter(roleFilter === s.key ? '' : s.key)}
            >
              <div className={`fw-bold fs-4 text-${s.color}`}>{stats[s.key] ?? 0}</div>
              <div className="text-muted small">{s.label}</div>
              {roleFilter === s.key && (
                <div className="mt-1">
                  <span className={`badge bg-${s.color}-subtle text-${s.color}`} style={{fontSize:'.65rem'}}>
                    Filtered
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white"><i className="bi bi-search text-muted"/></span>
                <input
                  className="form-control"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                    <i className="bi bi-x"/>
                  </button>
                )}
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>
            <div className="col-md-3 text-end">
              <button className="btn btn-outline-secondary btn-sm" onClick={load}>
                <i className="bi bi-arrow-clockwise me-1"/>Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"/>
              <p className="text-muted mt-2 small">Loading users…</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => (
                    <tr key={u.id} className={u.id === me?.id ? 'table-warning' : ''}>
                      <td className="text-muted small">{idx + 1}</td>

                      {/* User */}
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className={`rounded-circle d-flex align-items-center justify-content-center text-white fw-bold`}
                            style={{
                              width: 36, height: 36, fontSize: '.8rem', flexShrink: 0,
                              background: `var(--bs-${ROLE_COLORS[u.role] ?? 'secondary'})`,
                            }}
                          >
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold">
                              {u.name}
                              {u.id === me?.id && (
                                <span className="badge bg-warning text-dark ms-1" style={{fontSize:'.6rem'}}>You</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="text-muted small">{u.email}</td>

                      {/* Role */}
                      <td>
                        <span className={`badge bg-${ROLE_COLORS[u.role] ?? 'secondary'}-subtle text-${ROLE_COLORS[u.role] ?? 'secondary'} d-flex align-items-center gap-1`}
                              style={{width:'fit-content'}}>
                          <i className={`bi bi-${ROLE_ICONS[u.role] ?? 'person'}`}/>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </td>

                      {/* Status toggle */}
                      <td>
                        <div
                          className="form-check form-switch mb-0"
                          title={u.id === me?.id ? "Can't change own status" : `Click to ${u.status === 'active' ? 'deactivate' : 'activate'}`}
                        >
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={u.status === 'active'}
                            onChange={() => toggleStatus(u)}
                            disabled={u.id === me?.id}
                            style={{ cursor: u.id === me?.id ? 'not-allowed' : 'pointer', width: 40, height: 20 }}
                          />
                          <label className={`form-check-label small ${u.status === 'active' ? 'text-success' : 'text-danger'}`}>
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </label>
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="text-muted small">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-LK') : '—'}
                      </td>

                      {/* Actions */}
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          title="Edit role & status"
                          onClick={() => openEdit(u)}
                          disabled={u.id === me?.id}
                        >
                          <i className="bi bi-pencil"/>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          title={u.id === me?.id ? "Can't delete yourself" : 'Delete user'}
                          onClick={() => delUser(u)}
                          disabled={u.id === me?.id}
                        >
                          <i className="bi bi-trash"/>
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!users.length && !loading && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-5">
                        <i className="bi bi-people fs-1 d-block mb-2 opacity-25"/>
                        No users found
                        {(search || roleFilter) && ' matching your filters'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────── */}
      {editModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 400 }}>
            <div className="modal-content border-0 shadow">

              <div className="modal-header"
                   style={{ background: 'linear-gradient(135deg,#1a3c6e,#2563eb)', color: '#fff' }}>
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"/>Edit User
                </h5>
                <button className="btn-close btn-close-white" onClick={() => setEditModal(null)}/>
              </div>

              <form onSubmit={saveUser}>
                <div className="modal-body">
                  {/* User info preview */}
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                      style={{
                        width: 46, height: 46, fontSize: '1rem', flexShrink: 0,
                        background: `var(--bs-${ROLE_COLORS[editModal.role] ?? 'secondary'})`,
                      }}
                    >
                      {editModal.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="fw-bold">{editModal.name}</div>
                      <div className="text-muted small">{editModal.email}</div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Role</label>
                    <select
                      className="form-select"
                      value={editForm.role}
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                    >
                      <option value="admin">Admin</option>
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="receptionist">Receptionist</option>
                    </select>
                    <div className="form-text">
                      Changing role affects what this user can access.
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-2">
                    <label className="form-label fw-semibold small">Account Status</label>
                    <div className="d-flex gap-2">
                      {['active', 'inactive'].map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`btn btn-sm flex-fill ${editForm.status === s
                            ? s === 'active' ? 'btn-success' : 'btn-danger'
                            : 'btn-outline-secondary'
                          }`}
                          onClick={() => setEditForm({ ...editForm, status: s })}
                        >
                          <i className={`bi bi-${s === 'active' ? 'check-circle' : 'x-circle'} me-1`}/>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary"
                          onClick={() => setEditModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                    {saving
                      ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</>
                      : <><i className="bi bi-check-circle me-1"/>Save Changes</>
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
