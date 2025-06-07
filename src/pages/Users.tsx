import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../lib/api';
import { Users as UsersIcon, Check, X, Trash2, Edit, User } from 'lucide-react';
import { formatDate, getRoleColor } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Users = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', subjects: [] });

  // Queries
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersAPI.getUsers().then(res => res.data),
  });

  // Mutations
  const approveMutation = useMutation({
    mutationFn: usersAPI.approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User approved successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve user');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersAPI.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast.success('User updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user');
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      subjects: user.subjects || [],
    });
  };

  const handleUpdate = (userId: string) => {
    updateMutation.mutate({ id: userId, data: editForm });
  };

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      deleteMutation.mutate(userId);
    }
  };

  const pendingUsers = users?.filter(u => !u.isApproved) || [];
  const approvedUsers = users?.filter(u => u.isApproved) || [];

  if (!user || (user.role !== 'teacher' && user.role !== 'superadmin')) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <UsersIcon className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage student accounts and approvals</p>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals ({pendingUsers.length})
            </h2>
            <p className="text-sm text-gray-600">Users waiting for approval to access the system</p>
          </div>

          <div className="p-6">
            {usersLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingUsers.map((pendingUser: any) => (
                  <div key={pendingUser.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{pendingUser.name}</h3>
                          <p className="text-sm text-gray-600">{pendingUser.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(pendingUser.role)}`}>
                        {pendingUser.role}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-3">
                      Registered: {formatDate(pendingUser.createdAt)}
                    </p>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => approveMutation.mutate(pendingUser._id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleDelete(pendingUser._id, pendingUser.name)}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approved Users */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Approved Users ({approvedUsers.length})
          </h2>
          <p className="text-sm text-gray-600">Active users with system access</p>
        </div>

        <div className="p-6">
          {usersLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : approvedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No approved users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {approvedUsers.map((approvedUser: any) => (
                <div key={approvedUser._id} className="border border-gray-200 rounded-lg p-4">
                  {editingUser === approvedUser._id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleUpdate(approvedUser._id)}
                          disabled={updateMutation.isPending}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updateMutation.isPending ? (
                            <LoadingSpinner size="sm\" className="mr-2" />
                          ) : (
                            <Check className="w-4 h-4 mr-2" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUser(null)}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {approvedUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{approvedUser.name}</h3>
                          <p className="text-sm text-gray-600">{approvedUser.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(approvedUser.role)}`}>
                              {approvedUser.role}
                            </span>
                            <span className="text-xs text-gray-500">
                              Joined {formatDate(approvedUser.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(approvedUser)}
                          className="p-2 text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(approvedUser._id, approvedUser.name)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;