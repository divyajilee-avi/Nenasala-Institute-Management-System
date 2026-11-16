/**
 * Axios API service — Nenasala IMS
 * All HTTP calls go through this module.
 */
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost/Nenasala_ims/BackEnd/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('nims_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API: Token attached to request');
  }
  return config;
});

// Global error handling
API.interceptors.response.use(
  (res) => {
    console.log('API Response:', res.status, res.config.url);
    return res;
  },
  (err) => {
    console.error('API Error:', err.response?.status, err.response?.data, err.config.url);
    if (err.response?.status === 401) {
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;

/* ── Auth ─────────────────────────────────────────── */
export const authAPI = {
  login:          (data) => API.post('/auth/login.php', data),
  me:             ()     => API.get('/auth/me.php'),
  changePassword: (data) => API.post('/auth/change_password.php', data),
};

/* ── Dashboard ────────────────────────────────────── */
export const dashboardAPI = {
  stats: () => API.get('/dashboard/stats.php'),
};

/* ── Students ─────────────────────────────────────── */
export const studentsAPI = {
  list:   (params) => API.get('/students/index.php', { params }),
  get:    (id)     => API.get('/students/index.php', { params: { id } }),
  create: (data)   => API.post('/students/index.php', data),
  update: (id, d)  => API.put('/students/index.php', d, { params: { id } }),
  delete: (id)     => API.delete('/students/index.php', { params: { id } }),
};

/* ── Teachers ─────────────────────────────────────── */
export const teachersAPI = {
  list:   (params) => API.get('/teachers/index.php', { params }),
  get:    (id)     => API.get('/teachers/index.php', { params: { id } }),
  create: (data)   => API.post('/teachers/index.php', data),
  update: (id, d)  => API.put('/teachers/index.php', d, { params: { id } }),
  delete: (id)     => API.delete('/teachers/index.php', { params: { id } }),
};

/* ── Courses & Subjects ───────────────────────────── */
export const coursesAPI = {
  list:          (p) => API.get('/courses/index.php', { params: { type:'course', ...p } }),
  get:           (id)=> API.get('/courses/index.php', { params: { type:'course', id } }),
  create:        (d) => API.post('/courses/index.php?type=course', d),
  update:        (id,d)=> API.put('/courses/index.php', d, { params: { type:'course', id } }),
  delete:        (id)=> API.delete('/courses/index.php', { params: { type:'course', id } }),
  listSubjects:  (p) => API.get('/courses/index.php', { params: { type:'subject', ...p } }),
  createSubject: (d) => API.post('/courses/index.php?type=subject', d),
  deleteSubject: (id)=> API.delete('/courses/index.php', { params: { type:'subject', id } }),
};

/* ── Classes (Timetable) ──────────────────────────── */
export const classesAPI = {
  list:   (p) => API.get('/classes/index.php', { params: p }),
  create: (d) => API.post('/classes/index.php', d),
  delete: (id)=> API.delete('/classes/index.php', { params: { id } }),
};

/* ── Attendance ───────────────────────────────────── */
export const attendanceAPI = {
  list:       (p) => API.get('/attendance/index.php', { params: p }),
  markBulk:   (d) => API.post('/attendance/index.php', d),
  generateQR: (d) => API.post('/attendance/qr_generate.php', d),
  scanQR:     (d) => API.post('/attendance/qr_scan.php', d),
};

/* ── Fees & Payments ──────────────────────────────── */
export const feesAPI = {
  list:      (p)     => API.get('/fees/index.php', { params: p }),
  summary:   (p)     => API.get('/fees/index.php', { params: { action:'summary', ...p } }),
  payments:  (p)     => API.get('/fees/index.php', { params: { action:'payments', ...p } }),
  create:    (d)     => API.post('/fees/index.php', d),
  pay:       (d)     => API.post('/fees/index.php?action=pay', d),
  payOnline: (d)     => API.post('/fees/pay_online.php', d),
  update:    (id, d) => API.put('/fees/index.php', d, { params: { id } }),
  delete:    (id)    => API.delete('/fees/index.php', { params: { id } }),
};

/* ── Exams & Results ──────────────────────────────── */
export const examsAPI = {
  list:          (p)    => API.get('/exams/index.php', { params: p }),
  get:           (id)   => API.get('/exams/index.php', { params: { id } }),
  create:        (d)    => API.post('/exams/index.php', d),
  getResults:    (id)   => API.get('/exams/index.php', { params: { id, action:'results' } }),
  uploadResults: (d)    => API.post('/exams/index.php?action=result', d),
};

/* ── Notices ──────────────────────────────────────── */
export const noticesAPI = {
  list:   ()    => API.get('/notices/index.php'),
  create: (d)   => API.post('/notices/index.php', d),
  delete: (id)  => API.delete('/notices/index.php', { params: { id } }),
};

/* ── Users (admin) ────────────────────────────────── */
export const usersAPI = {
  list:   (p)    => API.get('/users/index.php', { params: p }),
  update: (id,d) => API.put('/users/index.php', d, { params: { id } }),
  delete: (id)   => API.delete('/users/index.php', { params: { id } }),
};

/* ── Upload ───────────────────────────────────────── */
export const uploadAPI = {
  photo: (formData) => API.post('/upload/photo.php', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

/* ── Study Materials (PDF Modules) ───────────────── */
export const materialsAPI = {
  list:    (params)   => API.get('/materials/index.php', { params }),
  upload:  (formData) => API.post('/materials/index.php', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete:  (id)       => API.delete('/materials/index.php', { params: { id } }),
  get:     (id)       => API.get('/materials/index.php', { params: { id } }),
};
