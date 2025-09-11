import type { PatientAllocation } from '@/components/admin/PatientAllocationForm';
import axios from 'axios';
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { get } from 'react-hook-form';

// In dev, Vite proxy will forward /api to backend at 
// In prod, set VITE_API_URL in environment to override
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',  // Prevent caching
    'Pragma': 'no-cache',
    'Expires': '0',
   },

  withCredentials: true,  // Remove if your backend doesn't use cookies for auth
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;  // <-- Return the config here
  },
  (error) => Promise.reject(error)
);


// Response interceptor: Handle unauthorized (401) errors by clearing token and redirecting
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';  // Redirect to login page
    } else if (error.response && error.response.status === 403) {
      console.error('Access denied: Insufficient permissions');
    }
    return Promise.reject(error);
  }
);

// Type definitions for payloads and responses
export interface LoginPayload { email: string; password: string; }
export interface SignupPayload {
  full_name?: string;  // Matches backend field name (not 'name')
  email: string;
  password: string;
  role?: string;
  department?: string;
  license_number?: string;  // Matches backend field name
}
export interface AuthResponse {
  token: string;
  user: { id: string; full_name: string; email: string; role?: string; department?: string; license_number?: string; };
}

// Authentication endpoints
export const authAPI = {
  signup: (data: SignupPayload) => api.post<AuthResponse>('/auth/register', data),
  login: (data: LoginPayload) => api.post<AuthResponse>('/auth/login', data),
};

export const userAPI = {
  profile: () => api.get<any>('/users/profile'),
  getAllUsers: () => api.get<any[]>('/users'),
  createUser: (data: any) => api.post('/users', data),
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  getStaffList: () => api.get<Staff[]>('/users/staff'),


};

export const alertAPI = {
  getAlerts: () => api.get('/alerts'),
  acknowledge: (id: string) => api.patch(`/alerts/${id}/acknowledge`),
  dismiss: (id: string) => api.delete(`/alerts/${id}`),
};

export const patientAPI = {
  getAllPatients: (filters: { assigned_doctor?: string; assigned_nurse?: string; status?: string } = {}) =>
    api.get<any[]>('/patients', { params: filters }),
  getPatient: (id: string) => api.get<any>(`/patients/${id}`),
  createPatient: (data: any) => api.post('/patients', data),
  updatePatient: (id: string, data: any) => api.put(`/patients/${id}`, data),
  deletePatient: (id: string) => api.delete(`/patients/${id}`),
};

// Vital signs endpoints 
export const vitalAPI = {
  getVitals: (patientId: string) => api.get<any[]>(`/patients/${patientId}/vitals`),
  recordVitals: (patientId: string, data: any) => api.post(`/patients/${patientId}/vitals`, data),
  getTrends: (patientId: string) => api.get<any>(`/patients/${patientId}/vitals/trends`),
};

export const allocationApi = {
get: async (id?: string) => {
  const url = id ? `/patient-allocations/${id}` : `/patient-allocations`;
  const res = await api.get(url);

  if (Array.isArray(res.data)) {
    return res.data.map(a => ({ ...a, id: a._id }));
  } else {
    return { ...res.data, id: res.data._id };
  }
},

  getPatients: async () => {
    const res = await api.get('/patients');
    return res.data;
  },
  put: async (id: string, data: PatientAllocation) => {
    const res = await api.put(`/patient-allocations/${id}`, data);
    return res.data;
  },
  delete: async (id: string) => {
    const res = await api.delete(`/patient-allocations/${id}`);
    return res.data;
  },
  post: async (data: PatientAllocation) => {
    const res = await api.post('/patient-allocations', data);
    return res.data;
  }
  ,
  discharge: async (id: string) => {
    const res = await api.post(`/patient-allocations/${id}/discharge`);
    return res.data;
  },
};


// Medical notes endpoints
export const noteAPI = {
  getNotes: (patientId: string, filters: { note_type?: string; date?: string; search?: string } = {}) => 
    api.get(`/patients/${patientId}/notes`, { params: filters }),
  createNote: (patientId: string, data: any) => api.post(`/patients/${patientId}/notes`, data),
  updateNote: (noteId: string, data: any) => api.put(`/notes/${noteId}`, data),
  deleteNote: (noteId: string) => api.delete(`/notes/${noteId}`),
};

// Appointment scheduling endpoints (aligned with backend routes)
export const appointmentAPI = {
  getAppointments: (filters = {}) => 
    api.get('/appointments', { 
      params: { page: 1, limit: 10, sort: '-appointment_date', ...filters }
    }),
  createAppointment: (data: any) => api.post('/appointments', data),
  updateAppointment: (id: string, data: any) => api.put(`/appointments/${id}`, data),
  cancelAppointment: (id: string) => api.delete(`/appointments/${id}`),
};

// Billing endpoints (aligned with backend routes)
export const billingAPI = {
  // Create a new billing (Admin only)
  createBilling: (data: any) =>
    api.post('/payments', data),  // matches billingRoutes POST '/'

  // Get all billings (Admin only)
  getAllBillingsGlobal: (filters: { patient_id?: string; status?: string } = {}) =>
    api.get('/payments', { params: filters }),  // matches billingRoutes GET '/'

  // Get all billings for a specific patient (Admin or Patient view)
  getBillingsForPatient: (patientId: string) =>
    api.get(`/payments/patient/${patientId}`),  // matches billingRoutes GET '/patient/:patientId'

  // Get single billing details (Admin or Patient view)
  getBillingDetails: (billingId: string) =>
    api.get(`/payments/${billingId}`),  // matches billingRoutes GET '/:id'

  // Update billing status (Admin only)
  updateBillingStatus: (billingId: string, data: any) =>
    api.patch(`/payments/${billingId}/status`, data),  // matches billingRoutes PATCH '/:id/status'

  // PayPal: Create order (Admin only)
  createPaymentOrder: (data: any) =>
    api.post('/payments/create-order', data),  // matches paymentRoutes POST '/create-order'

  // PayPal: Capture/verify payment (Admin only)
  capturePayment: (data: any) =>
    api.post('/payments/capture', data),  // matches paymentRoutes POST '/capture'
};


// Lab reports endpoints (aligned with backend routes)
export const labReportAPI = {
  getLabReports: (filters: { patient_id?: string; status?: string; test_type?: string } = {}) => 
    api.get('/labreports', { params: filters }),
  orderLabTest: (data: any) => api.post('/labreports', data),
  updateLabReport: (id: string, data: any) => api.put(`/labreports/${id}`, data),
};

// Analytics endpoints (aligned with backend routes)
export const analyticsAPI = {
  getDashboardStats: () => api.get('/analytics/dashboard'),
  getPatientStats: () => api.get('/analytics/patients/stats'),
  getStaffPerformance: () => api.get('/analytics/staff/performance'),
  getVitalsTrends: () => api.get('/analytics/vitals/trends'),
  getBillingStats: () => api.get('/analytics/billing/stats'),
};

// Document/file upload endpoints (aligned with backend routes)
export const documentAPI = {
  uploadDocument: (patientId: string, formData: FormData) => 
    api.post(`/patients/${patientId}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  listDocuments: (patientId: string) => api.get(`/patients/${patientId}/documents`),
  downloadDocument: (documentId: string) => api.get(`/documents/${documentId}/download`),
};

export default api;
