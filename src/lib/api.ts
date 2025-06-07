import axios from 'axios';
import { AuthResponse, User, Attendance, Feedback, Notification, PaginatedResponse } from '../types';

const API_BASE_URL = 'https://school-managment-web-backend.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role: string = 'user') =>
    api.post<AuthResponse>('/auth/register', { name, email, password, role }),
  
  googleAuth: (token: string) =>
    api.post<AuthResponse>('/auth/google', { token }),
  
  getCurrentUser: () =>
    api.get<{ user: User }>('/auth/me'),
};

// Users API
export const usersAPI = {
  getUsers: () =>
    api.get<User[]>('/users'),
  
  approveUser: (id: string) =>
    api.put<User>(`/users/${id}/approve`),
  
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
  
  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
};

// Attendance API
export const attendanceAPI = {
  createAttendance: (data: {
    userId: string;
    date: string;
    subjects: Array<{
      subjectName: string;
      status: string;
      marks: number;
      feedback: string;
    }>;
  }) =>
    api.post<Attendance>('/attendance', data),
  
  getMyAttendance: (page = 1, limit = 10) =>
    api.get<PaginatedResponse<Attendance>>(`/attendance/my-attendance?page=${page}&limit=${limit}`),
  
  getUserAttendance: (userId: string, page = 1, limit = 10) =>
    api.get<PaginatedResponse<Attendance>>(`/attendance/user/${userId}?page=${page}&limit=${limit}`),
  
  updateAttendance: (id: string, data: { subjects: any[] }) =>
    api.put<Attendance>(`/attendance/${id}`, data),
  
  deleteAttendance: (id: string) =>
    api.delete(`/attendance/${id}`),
};

// Feedback API
export const feedbackAPI = {
  createFeedback: (data: FormData) =>
    api.post<Feedback>('/feedback', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  getMyFeedback: () =>
    api.get<Feedback[]>('/feedback/my-feedback'),
  
  getAllFeedback: () =>
    api.get<Feedback[]>('/feedback'),
  
  replyToFeedback: (id: string, data: FormData) =>
    api.post<Feedback>(`/feedback/${id}/reply`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () =>
    api.get<Notification[]>('/notifications'),
  
  markAsRead: (id: string) =>
    api.put<Notification>(`/notifications/${id}/read`),
  
  markAllAsRead: () =>
    api.put('/notifications/mark-all-read'),
  
  getUnreadCount: () =>
    api.get<{ count: number }>('/notifications/unread-count'),
};

export default api;