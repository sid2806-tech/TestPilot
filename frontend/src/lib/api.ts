import axios from 'axios';
import { auth } from './firebase';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({ baseURL: BASE_URL });

// Attach Firebase ID token to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Normalize error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    if (detail) {
      err.message = typeof detail === 'string' ? detail : JSON.stringify(detail);
    }
    return Promise.reject(err);
  }
);

export default api;

// ── API helpers ───────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: object) => api.post('/projects', data),
  update: (id: string, data: object) => api.patch(`/projects/${id}`, data),
};

export const runsApi = {
  list: (projectId?: string) =>
    api.get('/runs', { params: projectId ? { project_id: projectId } : {} }),
  get: (id: string) => api.get(`/runs/${id}`),
  generate: (data: object) => api.post('/runs/generate', data),
  execute: (runId: string) => api.post(`/runs/${runId}/execute`),
  cancel: (runId: string) => api.post(`/runs/${runId}/cancel`),
};

export const bugsApi = {
  list: (projectId?: string) =>
    api.get('/bugs', { params: projectId ? { project_id: projectId } : {} }),
  get: (id: string) => api.get(`/bugs/${id}`),
  groups: (projectId?: string) =>
    api.get('/bugs/groups', { params: projectId ? { project_id: projectId } : {} }),
};

export const analyticsApi = {
  get: () => api.get('/analytics'),
};

export const reportsApi = {
  json: (runId: string) => `${BASE_URL}/reports/${runId}/json`,
  csv: (runId: string) => `${BASE_URL}/reports/${runId}/csv`,
  pdf: (runId: string) => `${BASE_URL}/reports/${runId}/pdf`,
};

export const demoApi = {
  status: () => api.get('/demo/status'),
  toggleBug: () => api.post('/demo/toggle-bug'),
};
