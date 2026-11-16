import React, { useEffect, useState } from 'react';
import { authAPI, uploadAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

export default function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [pwForm,  setPwForm]  = useState({ current_password:'', new_password:'' });
  const [uploading, setUploading] = useState(false);

  useEffect(()=>{ authAPI.me().then(r=>setProfile(r.data.data)).catch(()=>{}); },[]);

  const changePassword = async e => {
    e.preventDefault();
    try{ await authAPI.changePassword(pwForm); toast.success('Password changed'); setPwForm({current_password:'',new_password:''}); }
    catch(err){ toast.error(err.response?.data?.message??'Error'); }
  };

  const uploadPhoto = async e => {
    const file = e.target.files[0]; if(!file) return;
    const fd = new FormData(); fd.append('photo', file);
    setUploading(true);
    try{ await uploadAPI.photo(fd); toast.success('Photo updated'); authAPI.me().then(r=>setProfile(r.data.data)); }
    catch{ toast.error('Upload failed'); } finally{ setUploading(false); }
  };

  if (!profile) return <div className="text-center py-5"><div className="spinner-border text-primary"/></div>;

  const p = profile.profile || {};
  return (
    <>
      <h4 className="page-title mb-4"><i className="bi bi-person-circle me-2"/>My Profile</h4>
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card stat-card text-center p-4">
            <div className="position-relative d-inline-block mx-auto mb-3">
              {profile.avatar
                ? <img src={profile.avatar} alt="avatar" className="rounded-circle" style={{width:80,height:80,objectFit:'cover'}}/>
                : <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{width:80,height:80,fontSize:'2rem'}}>{profile.name?.charAt(0)}</div>
              }
            </div>
            <h5 className="fw-bold">{profile.name}</h5>
            <span className="badge bg-primary">{p.student_id}</span>
            <p className="text-muted small mt-1">{p.course_name}</p>
            <label className="btn btn-sm btn-outline-primary mt-2">
              {uploading ? 'Uploading…' : <><i className="bi bi-camera me-1"/>Change Photo</>}
              <input type="file" hidden accept="image/*" onChange={uploadPhoto} disabled={uploading}/>
            </label>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card stat-card mb-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Personal Information</h6>
              <div className="row g-2">
                {[['Email', profile.email],['Phone',p.phone||'-'],['DOB',p.dob||'-'],['Gender',p.gender||'-'],['Address',p.address||'-'],['Guardian',p.guardian_name||'-'],['Guardian Phone',p.guardian_phone||'-'],['Admission',p.admission_date||'-']].map(([l,v])=>(
                  <div key={l} className="col-md-6">
                    <div className="text-muted small">{l}</div>
                    <div className="fw-semibold">{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card stat-card">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Change Password</h6>
              <form onSubmit={changePassword} className="row g-3">
                <div className="col-md-6"><label className="form-label">Current Password</label><input type="password" className="form-control" value={pwForm.current_password} onChange={e=>setPwForm({...pwForm,current_password:e.target.value})} required/></div>
                <div className="col-md-6"><label className="form-label">New Password</label><input type="password" className="form-control" value={pwForm.new_password} onChange={e=>setPwForm({...pwForm,new_password:e.target.value})} required/></div>
                <div className="col-12"><button type="submit" className="btn btn-primary">Update Password</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
