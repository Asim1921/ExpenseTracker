import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

export const projectAPI = {
  getAll: () => api.get('/projects'),
  create: (data: { name: string; grossIncome: number }) =>
    api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const expenseAPI = {
  getAll: (params?: { type?: string; projectId?: string; employeeId?: string; startDate?: string; endDate?: string }) =>
    api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const userAPI = {
  getEmployees: () => api.get('/users/employees'),
  getEmployee: (id: string) => api.get(`/users/employees/${id}`),
  createEmployee: (data: { name: string; email?: string; phone?: string; position?: string }) =>
    api.post('/users/employees', data),
  updateEmployee: (id: string, data: { name?: string; email?: string; phone?: string; position?: string }) =>
    api.put(`/users/employees/${id}`, data),
  deleteEmployee: (id: string) => api.delete(`/users/employees/${id}`),
};

export const exportAPI = {
  exportAll: (year?: string) => {
    const params: any = { format: 'csv' };
    if (year) params.year = year;
    return api.get('/export/all', { 
      params,
      responseType: 'blob',
    });
  },
  exportExpenses: (type: 'payroll' | 'operating' | 'material', year?: string) => {
    const params: any = { format: 'csv' };
    if (year) params.year = year;
    return api.get(`/export/expenses/${type}`, { 
      params,
      responseType: 'blob',
    });
  },
};

export const estimateAPI = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get('/estimates', { params }),
  get: (id: string) => api.get(`/estimates/${id}`),
  create: (data: any) => api.post('/estimates', data),
  update: (id: string, data: any) => api.put(`/estimates/${id}`, data),
  delete: (id: string) => api.delete(`/estimates/${id}`),
};

export default api;

