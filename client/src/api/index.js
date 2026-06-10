import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

// Auth API
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data)
}

// Talents API
export const talentsApi = {
  list: (params) => api.get('/talents', { params }),
  get: (id) => api.get(`/talents/${id}`),
  create: (data) => api.post('/talents', data),
  update: (id, data) => api.put(`/talents/${id}`, data),
  delete: (id) => api.delete(`/talents/${id}`),
  addNote: (id, content) => api.post(`/talents/${id}/notes`, { content }),
  updateNote: (id, nid, content) => api.put(`/talents/${id}/notes/${nid}`, { content }),
  deleteNote: (id, nid) => api.delete(`/talents/${id}/notes/${nid}`),
  addProfile: (id, data) => api.post(`/talents/${id}/profiles`, data),
  updateProfile: (talentId, profileId, data) => api.put(`/talents/${talentId}/profiles/${profileId}`, data),
  deleteProfile: (talentId, profileId) => api.delete(`/talents/${talentId}/profiles/${profileId}`),
  // 工作经历
  getExperiences: (id) => api.get(`/talents/${id}/experiences`),
  addExperience: (id, data) => api.post(`/talents/${id}/experiences`, data),
  updateExperience: (id, eid, data) => api.put(`/talents/${id}/experiences/${eid}`, data),
  deleteExperience: (id, eid) => api.delete(`/talents/${id}/experiences/${eid}`),
  // 教育经历
  getEducations: (id) => api.get(`/talents/${id}/educations`),
  addEducation: (id, data) => api.post(`/talents/${id}/educations`, data),
  updateEducation: (id, eid, data) => api.put(`/talents/${id}/educations/${eid}`, data),
  deleteEducation: (id, eid) => api.delete(`/talents/${id}/educations/${eid}`),
  merge: (data) => api.post('/talents/merge', data),
  unmerge: (data) => api.delete('/talents/merge', { data }),
  // 跟盯记录
  getFollowups: (id) => api.get(`/talents/${id}/followups`),
  addFollowup: (id, data) => api.post(`/talents/${id}/followups`, data),
  updateFollowup: (id, fid, data) => api.put(`/talents/${id}/followups/${fid}`, data),
  deleteFollowup: (id, fid) => api.delete(`/talents/${id}/followups/${fid}`),
  // 论文
  getPapers: (id) => api.get(`/talents/${id}/papers`),
  addPaper: (id, data) => api.post(`/talents/${id}/papers`, data),
  updatePaper: (id, pid, data) => api.put(`/talents/${id}/papers/${pid}`, data),
  deletePaper: (id, pid) => api.delete(`/talents/${id}/papers/${pid}`),
  // 专利
  getPatents: (id) => api.get(`/talents/${id}/patents`),
  addPatent: (id, data) => api.post(`/talents/${id}/patents`, data),
  updatePatent: (id, pid, data) => api.put(`/talents/${id}/patents/${pid}`, data),
  deletePatent: (id, pid) => api.delete(`/talents/${id}/patents/${pid}`),
  // 行业会议
  getConferences: (id) => api.get(`/talents/${id}/conferences`),
  addConference: (id, data) => api.post(`/talents/${id}/conferences`, data),
  updateConference: (id, cid, data) => api.put(`/talents/${id}/conferences/${cid}`, data),
  deleteConference: (id, cid) => api.delete(`/talents/${id}/conferences/${cid}`),
  // GitHub项目
  getRepos: (id) => api.get(`/talents/${id}/repos`),
  addRepo: (id, data) => api.post(`/talents/${id}/repos`, data),
  updateRepo: (id, rid, data) => api.put(`/talents/${id}/repos/${rid}`, data),
  deleteRepo: (id, rid) => api.delete(`/talents/${id}/repos/${rid}`),
  sourceStats: () => api.get('/talents/stats/sources'),
  importMethodStats: () => api.get('/talents/stats/import-methods'),
  companyStats: () => api.get('/talents/stats/companies'),
  platformStats: () => api.get('/talents/stats/platforms')
}

// Admin API
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  users: () => api.get('/admin/users'),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createApiKey: (data) => api.post('/admin/api-keys', data),
  listApiKeys: () => api.get('/admin/api-keys'),
  deleteApiKey: (id) => api.delete(`/admin/api-keys/${id}`)
}

export default api
