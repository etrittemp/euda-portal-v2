import axios from 'axios';

// API base URL - will use environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API methods
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/api/auth/verify');
    return response.data;
  },
};

export const responsesAPI = {
  getAll: async () => {
    const response = await api.get('/api/responses');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/responses/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/responses/submit', data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/responses/${id}`);
    return response.data;
  },

  deleteAll: async () => {
    const response = await api.delete('/api/responses');
    return response.data;
  },
};

export const adminAPI = {
  getUsers: async () => {
    const response = await api.get('/api/admin/users');
    return response.data;
  },

  createUser: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post('/api/admin/users', data);
    return response.data;
  },

  updateUser: async (id: string, data: any) => {
    const response = await api.put(`/api/admin/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/api/admin/users/${id}`);
    return response.data;
  },
};

export const questionnaireAPI = {
  getAll: async (status?: string) => {
    const response = await api.get('/api/questionnaires', {
      params: status ? { status } : {}
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/questionnaires/${id}`);
    return response.data;
  },

  getPublic: async (id: string) => {
    const response = await api.get(`/api/questionnaires/public/${id}`);
    return response.data;
  },

  create: async (data: any) => {
    const response = await api.post('/api/questionnaires', data);
    return response.data.questionnaire; // Return just the questionnaire object
  },

  update: async (id: string, data: any) => {
    const response = await api.put(`/api/questionnaires/${id}`, data);
    return response.data.questionnaire || response.data; // Handle both response formats
  },

  delete: async (id: string, force: boolean = false) => {
    const response = await api.delete(`/api/questionnaires/${id}${force ? '?force=true' : ''}`);
    return response.data;
  },

  getStats: async (id: string) => {
    const response = await api.get(`/api/questionnaires/${id}/stats`);
    return response.data;
  },

  duplicate: async (id: string, title: string) => {
    const response = await api.post(`/api/questionnaires/${id}/duplicate`, { title });
    return response.data;
  },

  uploadFile: async (file: File, title: string, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post('/api/file-upload/convert', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getUploadHistory: async () => {
    const response = await api.get('/api/file-upload/uploads');
    return response.data;
  },

  exportToExcel: async (id: string, language: string = 'en') => {
    const response = await api.get(`/api/questionnaires/${id}/export/excel`, {
      params: { language },
      responseType: 'blob', // Important for file downloads
    });
    return response;
  },

  getLibrary: async () => {
    const response = await api.get('/api/questionnaires/library/all');
    return response.data;
  },

  cloneSections: async (data: {
    targetQuestionnaireId: string | null;
    title?: string;
    description?: string;
    items: Array<{
      type: 'section' | 'question';
      sourceQuestionnaireId: string;
      sectionId: string;
      questionId?: string;
    }>;
  }) => {
    const response = await api.post('/api/questionnaires/clone-sections', data);
    return response.data;
  },
};
