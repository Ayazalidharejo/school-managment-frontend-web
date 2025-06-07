export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'teacher' | 'superadmin';
  isApproved: boolean;
  subjects?: string[];
  profileImage?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AttendanceSubject {
  subjectName: string;
  status: 'present' | 'absent' | 'late';
  marks: number;
  feedback: string;
}

export interface Attendance {
  _id: string;
  userId: string;
  date: string;
  subjects: AttendanceSubject[];
  createdBy: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

export interface FeedbackReply {
  _id: string;
  message: string;
  image?: string;
  sentBy: {
    _id: string;
    name: string;
    role: string;
  };
  sentByRole: string;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  userId: string;
  attendanceId: string;
  subject: string;
  message: string;
  image?: string;
  sentBy: {
    _id: string;
    name: string;
    role: string;
  };
  sentByRole: string;
  replies: FeedbackReply[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  recipientId: string;
  senderId: {
    _id: string;
    name: string;
    role: string;
  };
  type: 'user_registration' | 'feedback_received' | 'feedback_reply' | 'attendance_update';
  message: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  total: number;
}