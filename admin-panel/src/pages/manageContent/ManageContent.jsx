import React, { useState, useEffect, useCallback, useContext } from "react";
import { useLocalization } from "../../context/LocalizationContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DarkModeContext } from "../../context/darkModeContext.jsx";
import manageContentTranslations from "../../localization/manageContent.json";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  getAllFaqs, 
  getFaqStats, 
  createFaq, 
  updateFaq, 
  deleteFaq, 
  bulkUpdateFaqs, 
  bulkDeleteFaqs,
  getFaqCategories
} from '../../utils/adminApi';
import { LoadingSpinner, ErrorMessage } from '../../components/ui';
import { HelpCircle, Shield, Plus, RefreshCw, Edit, Trash2, X, Check, Save } from 'lucide-react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

// Zod validation schema
const faqSchema = z.object({
  category: z.string().min(1, "Category is required"),
  question: z.string().min(10, "Question must be at least 10 characters").max(500, "Question must be less than 500 characters"),
  answer: z.string().min(20, "Answer must be at least 20 characters").max(2000, "Answer must be less than 2000 characters"),
  isActive: z.boolean(),
  order: z.number().min(0, "Order must be 0 or greater")
});

const ManageContent = () => {
  const { darkMode } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  const { isAdmin, hasPermission } = useAuth();
  
  // Form setup with React Hook Form and Zod
  const { control, handleSubmit, reset, register, formState: { errors } } = useForm({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      category: '',
      question: '',
      answer: '',
      isActive: true,
      order: 0
    }
  });

  // Privacy Policy state
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [privacySaving, setPrivacySaving] = useState(false);

  // Load Privacy Policy
  const loadPrivacyPolicy = useCallback(async () => {
    try {
      setPrivacyLoading(true);
      const response = await axios.get(`${API_CONFIG.BASE_URL}/api/content/privacy-policy`, {
        withCredentials: true
      });
      setPrivacyPolicy(response.data?.content || response.data?.privacyPolicy || '');
    } catch (error) {
      console.error('Error loading privacy policy:', error);
      setPrivacyPolicy('');
    } finally {
      setPrivacyLoading(false);
    }
  }, []);

  // Save Privacy Policy
  const savePrivacyPolicy = async () => {
    try {
      setPrivacySaving(true);
      await axios.put(`${API_CONFIG.BASE_URL}/api/content/privacy-policy`, {
        content: privacyPolicy
      }, {
        withCredentials: true
      });
      showNotification('Privacy Policy saved successfully!');
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      showNotification(error.response?.data?.message || 'Failed to save Privacy Policy', 'error');
    } finally {
      setPrivacySaving(false);
    }
  };

  // State management
  const [activeTab, setActiveTab] = useState('faqs');
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dialogMode, setDialogMode] = useState('create');
  const [selectedFaq, setSelectedFaq] = useState(null);
  const [notification, setNotification] = useState(null);

  // Load data
  const loadCategories = useCallback(async () => {
    try {
      const response = await getFaqCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }, []);

  const loadFaqs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [faqsResponse, statsResponse] = await Promise.all([
        getAllFaqs({ page: 1, limit: 50 }),
        getFaqStats()
      ]);
      
      setFaqs(faqsResponse.data || []);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setError(error.message || 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    loadFaqs();
  }, [loadCategories, loadFaqs]);

  // Load privacy policy when tab changes
  useEffect(() => {
    if (activeTab === 'privacy') {
      loadPrivacyPolicy();
    }
  }, [activeTab, loadPrivacyPolicy]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreate = () => {
    setDialogMode('create');
    setSelectedFaq(null);
    reset({
      category: '',
      question: '',
      answer: '',
      isActive: true,
      order: 0
    });
    setShowModal(true);
  };

  const handleEdit = (faq) => {
    setDialogMode('edit');
    setSelectedFaq(faq);
    reset({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      isActive: faq.isActive,
      order: faq.order || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await deleteFaq(id);
        showNotification('FAQ deleted successfully!');
        loadFaqs();
      } catch (error) {
        showNotification(error.message || 'Delete failed', 'error');
      }
    }
  };

  const onSubmit = async (data) => {
    try {
      if (dialogMode === 'create') {
        await createFaq(data);
        showNotification('FAQ created successfully!');
      } else {
        await updateFaq(selectedFaq._id, data);
        showNotification('FAQ updated successfully!');
      }
      
      setShowModal(false);
      loadFaqs();
    } catch (error) {
      showNotification(error.message || 'Operation failed', 'error');
    }
  };

  if (!isAdmin() || !hasPermission(['content_moderation'])) {
    return (
      <div className={`p-6 rounded-xl text-center ${
        darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'
      }`}>
        <p className="text-red-500 font-medium">Access Denied</p>
        <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading content..." />;
  }

  if (error) {
    return (
      <ErrorMessage 
        message={`Error: ${error}`}
        onRetry={loadFaqs}
        retryText="Retry"
      />
    );
  }

  return (
    <div className="w-full">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
          notification.type === 'success' 
            ? 'bg-orange-500 text-white' 
            : 'bg-slate-600 text-white'
        }`}>
          {notification.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {getTranslation(manageContentTranslations, "manageContent") || "Content Management"}
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage FAQs, privacy policy, and other content
          </p>
        </div>
        <button
          onClick={loadFaqs}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            darkMode 
              ? 'bg-white/10 text-white hover:bg-white/20' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total FAQs', value: faqs.length, color: '#f97316' },
          { label: 'Active', value: faqs.filter(f => f.isActive).length, color: '#22c55e' },
          { label: 'Inactive', value: faqs.filter(f => !f.isActive).length, color: '#ef4444' },
          { label: 'Categories', value: categories.length, color: '#8b5cf6' },
        ].map(({ label, value, color }) => (
          <div 
            key={label}
            className={`p-4 rounded-xl ${
              darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
            }`}
          >
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg"
                style={{ backgroundColor: color + '20', color }}
              >
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`flex gap-2 p-1 rounded-xl mb-6 w-fit ${
        darkMode ? 'bg-white/5' : 'bg-gray-100'
      }`}>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'faqs'
              ? 'bg-orange-500 text-white'
              : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          {getTranslation(manageContentTranslations, "manageFaqs") || "Manage FAQs"}
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'privacy'
              ? 'bg-orange-500 text-white'
              : darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          {getTranslation(manageContentTranslations, "managePrivacyPolicy") || "Privacy Policy"}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'faqs' && (
        <>
          {/* Add Button */}
          <div className="mb-6">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Add New FAQ
            </button>
          </div>

          {/* FAQs Table */}
          <div className={`rounded-2xl overflow-hidden ${
            darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${darkMode ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Question</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Category</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Status</th>
                    <th className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {faqs.map((faq) => (
                    <tr 
                      key={faq._id}
                      className={`border-b last:border-b-0 transition-colors ${
                        darkMode 
                          ? 'border-white/5 hover:bg-white/5' 
                          : 'border-gray-50 hover:bg-gray-50'
                      }`}
                    >
                      <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        <p className="max-w-md truncate font-medium">{faq.question}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-500">
                          {faq.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          faq.isActive
                            ? 'bg-orange-500/20 text-orange-500'
                            : 'bg-slate-400/20 text-slate-500'
                        }`}>
                          {faq.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(faq)}
                            className="p-2 rounded-lg bg-orange-500/20 text-orange-500 hover:bg-orange-500/30 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(faq._id)}
                            className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {faqs.length === 0 && (
              <div className="p-12 text-center">
                <HelpCircle className={`w-12 h-12 mx-auto mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-lg font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No FAQs found
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'privacy' && (
        <div className={`p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Privacy Policy Management
          </h2>
          <p className={`mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Edit the Privacy Policy content below. Changes will be reflected on the frontend immediately after saving.
          </p>
          
          {privacyLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <textarea
                value={privacyPolicy}
                onChange={(e) => setPrivacyPolicy(e.target.value)}
                rows={20}
                placeholder="Enter the Privacy Policy content here..."
                className={`w-full px-4 py-3 rounded-xl transition-all outline-none resize-y font-mono text-sm ${
                  darkMode 
                    ? 'bg-gray-800 border border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:border-orange-500`}
              />
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={savePrivacyPolicy}
                  disabled={privacySaving}
                  className="flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-all disabled:opacity-50"
                >
                  {privacySaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Privacy Policy
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div 
            className={`p-6 rounded-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-[#1a1a2e] border border-white/10' : 'bg-white'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <h3 className={`text-xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {dialogMode === 'create' ? 'Create New FAQ' : 'Edit FAQ'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <select
                  {...register('category')}
                  className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                    darkMode 
                      ? 'bg-gray-800 border border-gray-700 text-white' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900'
                  } focus:border-orange-500`}
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat.value || cat} value={cat.value || cat}>{cat.display || cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Question
                </label>
                <input
                  {...register('question')}
                  className={`w-full px-4 py-3 rounded-xl transition-all outline-none ${
                    darkMode 
                      ? 'bg-gray-800 border border-gray-700 text-white' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900'
                  } focus:border-orange-500`}
                  placeholder="Enter the question"
                />
                {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question.message}</p>}
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Answer
                </label>
                <textarea
                  {...register('answer')}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl transition-all outline-none resize-none ${
                    darkMode 
                      ? 'bg-gray-800 border border-gray-700 text-white' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900'
                  } focus:border-orange-500`}
                  placeholder="Enter the answer"
                />
                {errors.answer && <p className="text-red-500 text-sm mt-1">{errors.answer.message}</p>}
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 rounded accent-orange-500"
                />
                <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Active
                </label>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl font-medium ${
                    darkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium"
                >
                  {dialogMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageContent;
