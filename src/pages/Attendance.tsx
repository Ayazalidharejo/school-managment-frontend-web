import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, usersAPI } from '../lib/api';
import { Calendar, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { formatDate, getStatusColor } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Attendance = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  // Queries
  const { data: attendanceData, isLoading: attendanceLoading } = useQuery({
    queryKey: user?.role === 'user' ? ['my-attendance', currentPage] : ['user-attendance', selectedUser, currentPage],
    queryFn: () => {
      if (user?.role === 'user') {
        return attendanceAPI.getMyAttendance(currentPage).then(res => res.data);
      } else if (selectedUser) {
        return attendanceAPI.getUserAttendance(selectedUser, currentPage).then(res => res.data);
      }
      return Promise.resolve(null);
    },
    enabled: user?.role === 'user' || !!selectedUser,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getUsers().then(res => res.data),
    enabled: user?.role === 'teacher' || user?.role === 'superadmin',
  });

  const approvedUsers = users?.filter(u => u.isApproved) || [];

  // Mutations
  const createAttendanceMutation = useMutation({
    mutationFn: attendanceAPI.createAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['user-attendance'] });
      setShowCreateForm(false);
      toast.success('Attendance record created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create attendance record');
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => attendanceAPI.updateAttendance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['user-attendance'] });
      setEditingRecord(null);
      toast.success('Attendance record updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update attendance record');
    },
  });

  const deleteAttendanceMutation = useMutation({
    mutationFn: attendanceAPI.deleteAttendance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['user-attendance'] });
      toast.success('Attendance record deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete attendance record');
    },
  });

  const CreateAttendanceForm = () => {
    const [formData, setFormData] = useState({
      userId: '',
      date: new Date().toISOString().split('T')[0],
      subjects: [{ subjectName: '', status: 'present', marks: 0, feedback: '' }],
    });

    const addSubject = () => {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, { subjectName: '', status: 'present', marks: 0, feedback: '' }],
      });
    };

    const removeSubject = (index: number) => {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter((_, i) => i !== index),
      });
    };

    const updateSubject = (index: number, field: string, value: any) => {
      const updatedSubjects = formData.subjects.map((subject, i) =>
        i === index ? { ...subject, [field]: value } : subject
      );
      setFormData({ ...formData, subjects: updatedSubjects });
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.userId || formData.subjects.some(s => !s.subjectName)) {
        toast.error('Please fill in all required fields');
        return;
      }
      createAttendanceMutation.mutate(formData);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Create Attendance Record</h3>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student
              </label>
             <select
  value={formData.userId}
  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  required
>
  <option value="">Select a student</option>
  {approvedUsers.map((user) => (
    <option key={user._id} value={user._id}>
      {user.name} ({user.email})
    </option>
  ))}
</select>

            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Subjects
              </label>
              <button
                type="button"
                onClick={addSubject}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Subject
              </button>
            </div>

            <div className="space-y-4">
              {formData.subjects.map((subject, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <input
                      type="text"
                      placeholder="Subject name"
                      value={subject.subjectName}
                      onChange={(e) => updateSubject(index, 'subjectName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <select
                      value={subject.status}
                      onChange={(e) => updateSubject(index, 'status', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="Marks"
                      value={subject.marks}
                      onChange={(e) => updateSubject(index, 'marks', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="100"
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Feedback"
                      value={subject.feedback}
                      onChange={(e) => updateSubject(index, 'feedback', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      className="p-2 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={createAttendanceMutation.isPending}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createAttendanceMutation.isPending ? (
                <LoadingSpinner size="sm\" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Create Record
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
            <p className="text-gray-600">
              {user?.role === 'user' ? 'View your attendance records' : 'Manage student attendance'}
            </p>
          </div>
        </div>

        {(user?.role === 'teacher' || user?.role === 'superadmin') && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Record
          </button>
        )}
      </div>

      {/* User Selection for Teachers/Admins */}
      {(user?.role === 'teacher' || user?.role === 'superadmin') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Student
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose a student to view attendance</option>
            {approvedUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && <CreateAttendanceForm />}

      {/* Attendance Records */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records</h2>
        </div>

        <div className="p-6">
          {attendanceLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !attendanceData || attendanceData.attendance.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">
                {user?.role === 'user' 
                  ? 'No attendance records found' 
                  : selectedUser 
                    ? 'No attendance records found for this student'
                    : 'Select a student to view their attendance records'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {attendanceData.attendance.map((record: any) => (
                  <div key={record._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatDate(record.date)}</h3>
                        <p className="text-sm text-gray-600">
                          Created by {record.createdBy.name} ({record.createdBy.role})
                        </p>
                      </div>
                      
                      {(user?.role === 'teacher' || user?.role === 'superadmin') && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingRecord(editingRecord === record._id ? null : record._id)}
                            className="p-2 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this attendance record?')) {
                                deleteAttendanceMutation.mutate(record._id);
                              }
                            }}
                            className="p-2 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {record.subjects.map((subject: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{subject.subjectName}</h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subject.status)}`}>
                              {subject.status}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>Marks: {subject.marks}/100</p>
                            {subject.feedback && <p>Feedback: {subject.feedback}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {attendanceData.totalPages > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-600">
                    Page {currentPage} of {attendanceData.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(attendanceData.totalPages, currentPage + 1))}
                    disabled={currentPage === attendanceData.totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;