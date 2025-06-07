import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { attendanceAPI, feedbackAPI, usersAPI, notificationsAPI } from '../lib/api';
import { 
  Calendar, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  Clock,
  Bell,
  Award,
  BookOpen
} from 'lucide-react';
import { formatDate, getStatusColor } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();

  // Common queries
  const { data: unreadCount } = useQuery({
    queryKey: ['unread-count'],
    queryFn: () => notificationsAPI.getUnreadCount().then(res => res.data),
  });

  // User-specific queries
  const { data: myAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['my-attendance'],
    queryFn: () => attendanceAPI.getMyAttendance(1, 5).then(res => res.data),
    enabled: user?.role === 'user' && user?.isApproved,
  });

  const { data: myFeedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['my-feedback'],
    queryFn: () => feedbackAPI.getMyFeedback().then(res => res.data),
    enabled: user?.role === 'user' && user?.isApproved,
  });

  // Teacher/Admin queries
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getUsers().then(res => res.data),
    enabled: user?.role === 'teacher' || user?.role === 'superadmin',
  });

  const { data: allFeedback, isLoading: allFeedbackLoading } = useQuery({
    queryKey: ['all-feedback'],
    queryFn: () => feedbackAPI.getAllFeedback().then(res => res.data),
    enabled: user?.role === 'teacher' || user?.role === 'superadmin',
  });

  if (!user) {
    return null;
  }

  if (user.role === 'user' && !user.isApproved) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Account Pending Approval</h3>
              <p className="text-yellow-700 mt-1">
                Your account is waiting for approval from a teacher or administrator. 
                You'll be notified once your account is approved and you can start using the system.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderUserDashboard = () => {
    const recentAttendance = myAttendance?.attendance || [];
    const recentFeedback = myFeedback?.slice(0, 3) || [];

    // Calculate attendance stats
    const totalDays = recentAttendance.length;
    const presentDays = recentAttendance.filter(record => 
      record.subjects.some(subject => subject.status === 'present')
    ).length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}!</h1>
            <p className="text-gray-600 mt-1">Here's your academic overview</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {unreadCount?.count || 0} new notifications
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Attendance Rate</p>
                <p className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Total Classes</p>
                <p className="text-2xl font-bold">{totalDays}</p>
              </div>
              <BookOpen className="w-8 h-8 text-emerald-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Feedback Messages</p>
                <p className="text-2xl font-bold">{myFeedback?.length || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Attendance</h2>
          </div>
          <div className="p-6">
            {attendanceLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentAttendance.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No attendance records yet</p>
            ) : (
              <div className="space-y-4">
                {recentAttendance.map((record) => (
                  <div key={record._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{formatDate(record.date)}</p>
                      <p className="text-sm text-gray-600">
                        {record.subjects.length} subjects recorded
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      {record.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subject.status)}`}
                        >
                          {subject.status}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
          </div>
          <div className="p-6">
            {feedbackLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentFeedback.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No feedback messages yet</p>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div key={feedback._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{feedback.subject}</p>
                        <p className="text-sm text-gray-600 mt-1">{feedback.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {feedback.replies.length} replies
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherAdminDashboard = () => {
    const pendingUsers = allUsers?.filter(u => !u.isApproved) || [];
    const recentFeedback = allFeedback?.slice(0, 5) || [];
    const totalUsers = allUsers?.length || 0;
    const approvedUsers = allUsers?.filter(u => u.isApproved).length || 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {user.role === 'superadmin' ? 'Admin' : 'Teacher'} Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage students and track progress</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {unreadCount?.count || 0} new notifications
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Students</p>
                <p className="text-2xl font-bold">{totalUsers}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100">Approved</p>
                <p className="text-2xl font-bold">{approvedUsers}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">Pending Approval</p>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Feedback</p>
                <p className="text-2xl font-bold">{allFeedback?.length || 0}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        {pendingUsers.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Pending User Approvals</h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {pendingUsers.slice(0, 3).map((pendingUser) => (
                  <div key={pendingUser.id} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div>
                      <p className="font-medium text-gray-900">{pendingUser.name}</p>
                      <p className="text-sm text-gray-600">{pendingUser.email}</p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
              {pendingUsers.length > 3 && (
                <p className="text-sm text-gray-500 mt-4 text-center">
                  And {pendingUsers.length - 3} more pending approvals
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
          </div>
          <div className="p-6">
            {allFeedbackLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : recentFeedback.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No feedback messages yet</p>
            ) : (
              <div className="space-y-4">
                {recentFeedback.map((feedback) => (
                  <div key={feedback._id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{feedback.subject}</p>
                        <p className="text-sm text-gray-600 mt-1">{feedback.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          From {feedback.sentBy.name} • {formatDate(feedback.createdAt)}
                        </p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                        {feedback.replies.length} replies
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {user.role === 'user' ? renderUserDashboard() : renderTeacherAdminDashboard()}
    </div>
  );
};

export default Dashboard;