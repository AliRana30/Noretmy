import { useState, useContext, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DarkModeContext } from '../../context/darkModeContext';import { useLocalization } from '../../context/LocalizationContext';
import profileTranslations from '../../localization/profile.json';import { API_CONFIG } from '../../config/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { User, Mail, Shield, Camera, Save, Key, Loader2, Upload } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { darkMode } = useContext(DarkModeContext);
  const { getTranslation } = useLocalization();
  const fileInputRef = useRef(null);
  
  // Translation helper
  const t = (key) => getTranslation(profileTranslations, key) || key;
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t('selectImage'));
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('imageTooLarge'));
        return;
      }
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Upload immediately
      handleImageUpload(file);
    }
  };

  const handleImageUpload = async (file) => {
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      // Use 'images' as the field name to match the backend multer configuration
      formData.append('images', file);
      
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/users/profile/`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data?.profilePicture) {
        // Update the user context with new profile picture
        updateUser({ 
          profilePicture: response.data.profilePicture,
          img: response.data.profilePicture 
        });
        toast.success(t('profilePictureUpdated'));
      } else {
        // Fallback: check if any URL was returned in the response
        toast.success(t('refreshToSee'));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || t('uploadFailed'));
      setPreviewImage(null); // Reset preview on error
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Password validation helper
  const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('At least one special character');
    return errors;
  };

  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleSave = async (e) => {
    e.preventDefault();
    
    // Validate password if changing
    if (formData.newPassword) {
      const pwdErrors = validatePasswordStrength(formData.newPassword);
      if (pwdErrors.length > 0) {
        setPasswordErrors(pwdErrors);
        return;
      }
      setPasswordErrors([]);
      
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error(t('passwordsNotMatch'));
        return;
      }
      if (!formData.currentPassword) {
        toast.error(t('currentPasswordRequired'));
        return;
      }
    }
    
    setIsSaving(true);
    try {
      // Update profile information - send to backend
      const updateData = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
      };
      
      // Add password change if provided
      if (formData.newPassword && formData.currentPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // Make API call to persist changes to backend
      const response = await axios.put(
        `${API_CONFIG.BASE_URL}/api/users/profile`,
        updateData,
        { withCredentials: true }
      );
      
      // Update local user data on success
      if (response.data) {
        updateUser({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          ...response.data
        });
      }
      
      toast.success(t('profileUpdated'));
      setIsEditing(false);
      
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setPasswordErrors([]);
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || t('updateFailed');
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const currentImage = previewImage || user?.img || user?.profilePicture || 'https://via.placeholder.com/150';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {t('profileSettings')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className={`lg:col-span-1 p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <img
                src={currentImage}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover ring-4 ring-orange-500/30"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute bottom-0 right-0 p-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isUploadingImage ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            </div>
            
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {user?.fullName || t('adminUser')}
            </h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {user?.email}
            </p>
            
            <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-500 text-sm font-medium">
              <Shield className="w-4 h-4" />
              {user?.role || t('administrator')}
            </div>
          </div>
          
          <hr className={`my-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`} />
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('username')}</p>
                <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>@{user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('emailAddress')}</p>
                <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className={`lg:col-span-2 p-6 rounded-2xl ${
          darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {t('accountInformation')}
            </h3>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isEditing
                  ? 'bg-gray-500/20 text-gray-500'
                  : 'bg-orange-500/20 text-orange-500 hover:bg-orange-500/30'
              }`}
            >
              {isEditing ? t('cancel') : t('edit')}
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('fullName')}
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl transition-all ${
                    darkMode 
                      ? 'bg-white/5 border border-white/10 text-white disabled:opacity-50' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 disabled:opacity-50'
                  } focus:border-orange-500 focus:outline-none`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {t('username')}
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 rounded-xl transition-all ${
                    darkMode 
                      ? 'bg-white/5 border border-white/10 text-white disabled:opacity-50' 
                      : 'bg-gray-50 border border-gray-200 text-gray-900 disabled:opacity-50'
                  } focus:border-orange-500 focus:outline-none`}
                />
              </div>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {t('emailAddress')}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full px-4 py-3 rounded-xl transition-all ${
                  darkMode 
                    ? 'bg-white/5 border border-white/10 text-white disabled:opacity-50' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 disabled:opacity-50'
                } focus:border-orange-500 focus:outline-none`}
              />
            </div>

            {isEditing && (
              <>
                <hr className={`my-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`} />
                
                <h4 className={`text-md font-semibold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Key className="w-5 h-5" /> {t('changePassword')}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('currentPassword')}
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl transition-all ${
                        darkMode 
                          ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900'
                      } focus:border-orange-500 focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('newPassword')}
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl transition-all ${
                        darkMode 
                          ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900'
                      } focus:border-orange-500 focus:outline-none`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {t('confirmPassword')}
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full px-4 py-3 rounded-xl transition-all ${
                        darkMode 
                          ? 'bg-white/5 border border-white/10 text-white placeholder-gray-500' 
                          : 'bg-gray-50 border border-gray-200 text-gray-900'
                      } focus:border-orange-500 focus:outline-none`}
                    />
                  </div>
                </div>

                {/* Password Requirements Display */}
                {passwordErrors.length > 0 && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-100'}`}>
                    <p className={`text-sm font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                      Password Requirements:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {passwordErrors.map((error, index) => (
                        <li key={index} className={`text-xs ${darkMode ? 'text-red-300' : 'text-red-500'}`}>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {formData.newPassword && passwordErrors.length === 0 && (
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-orange-50 border border-orange-100'}`}>
                    <p className={`text-xs ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      ✓ Password meets all requirements
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-6 w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t('saveChanges')}
                    </>
                  )}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
