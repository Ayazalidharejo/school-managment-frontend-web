import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { feedbackAPI, attendanceAPI } from '../lib/api';
import { MessageSquare, Plus, Send, Image, X, Reply } from 'lucide-react';
import { formatDateTime } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Feedback = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);

  // Queries
  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: user?.role === 'user' ? ['my-feedback'] : ['all-feedback'],
    queryFn: () => {
      if (user?.role === 'user') {
        return feedbackAPI.getMyFeedback().then(res => res.data);
      } else {
        return feedbackAPI.getAllFeedback().then(res => res.data);
      }
    },
  });

  const { data: myAttendance } = useQuery({
    queryKey: ['my-attendance-for-feedback'],
    queryFn: () => attendanceAPI.getMyAttendance(1, 100).then(res => res.data),
    enabled: user?.role === 'user',
  });

  // Mutations
  const createFeedbackMutation = useMutation({
    mutationFn: feedbackAPI.createFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['all-feedback'] });
      setShowCreateForm(false);
      toast.success('Feedback sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send feedback');
    },
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => feedbackAPI.replyToFeedback(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-feedback'] });
      queryClient.invalidateQueries({ queryKey: ['all-feedback'] });
      setReplyText('');
      setReplyImage(null);
      setSelectedFeedback(null);
      toast.success('Reply sent successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send reply');
    },
  });

  const CreateFeedbackForm = () => {
    const [formData, setFormData] = useState({
      attendanceId: '',
      subject: '',
      message: '',
    });
    const [image, setImage] = useState<File | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.attendanceId || !formData.subject || !formData.message) {
        toast.error('Please fill in all required fields');
        return;
      }

      const data = new FormData();
      data.append('attendanceId', formData.attendanceId);
      data.append('subject', formData.subject);
      data.append('message', formData.message);
      if (image) {
        data.append('image', image);
      }

      createFeedbackMutation.mutate(data);
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Send Feedback</h3>
          <button
            onClick={() => setShowCreateForm(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attendance Record
            </label>
            <select
              value={formData.attendanceId}
              onChange={(e) => setFormData({ ...formData, attendanceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select an attendance record</option>
              {myAttendance?.attendance.map((record: any) => (
                <option key={record._id} value={record._id}>
                  {new Date(record.date).toLocaleDateString()} - {record.subjects.length} subjects
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter subject name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your feedback message..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attach Image (Optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="submit"
              disabled={createFeedbackMutation.isPending}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {createFeedbackMutation.isPending ? (
                <LoadingSpinner size="sm\" className="mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Feedback
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

  const handleReply = (feedbackId: string) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    const data = new FormData();
    data.append('message', replyText);
    if (replyImage) {
      data.append('image', replyImage);
    }

    replyMutation.mutate({ id: feedbackId, data });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feedback</h1>
            <p className="text-gray-600">
              {user?.role === 'user' ? 'Send and manage your feedback' : 'View and respond to student feedback'}
            </p>
          </div>
        </div>

        {user?.role === 'user' && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Send Feedback
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && <CreateFeedbackForm />}

      {/* Feedback List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {user?.role === 'user' ? 'My Feedback' : 'All Feedback'}
          </h2>
        </div>

        <div className="p-6">
          {feedbackLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : !feedback || feedback.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No feedback messages found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {feedback.map((item: any) => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.subject}</h3>
                      <p className="text-sm text-gray-600">
                        {user?.role !== 'user' && `From: ${item.sentBy.name} • `}
                        {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                      {item.replies.length} replies
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-700">{item.message}</p>
                    {item.image && (
                      <img
                        src={item.image}
                        alt="Feedback attachment"
                        className="mt-2 max-w-sm rounded-lg border border-gray-200"
                      />
                    )}
                  </div>

                  {/* Replies */}
                  {item.replies.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {item.replies.map((reply: any) => (
                        <div key={reply._id} className="ml-4 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {reply.sentBy.name} ({reply.sentByRole})
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDateTime(reply.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{reply.message}</p>
                          {reply.image && (
                            <img
                              src={reply.image}
                              alt="Reply attachment"
                              className="mt-2 max-w-sm rounded-lg border border-gray-200"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply Form */}
                  {selectedFeedback === item._id ? (
                    <div className="border-t pt-4">
                      <div className="space-y-3">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Write your reply..."
                        />
                        
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setReplyImage(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleReply(item._id)}
                            disabled={replyMutation.isPending}
                            className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                          >
                            {replyMutation.isPending ? (
                              <LoadingSpinner size="sm\" className="mr-2" />
                            ) : (
                              <Send className="w-4 h-4 mr-2" />
                            )}
                            Send Reply
                          </button>
                          <button
                            onClick={() => setSelectedFeedback(null)}
                            className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedFeedback(item._id)}
                      className="flex items-center px-3 py-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Reply className="w-4 h-4 mr-1" />
                      Reply
                    </button>
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

export default Feedback;