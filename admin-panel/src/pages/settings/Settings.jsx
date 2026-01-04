import { useState, useContext, useEffect } from 'react';
import { DarkModeContext } from '../../context/darkModeContext';
import { Moon, Sun, Globe, Bell, Shield, Database, Save, Check, Download, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import settingsTranslations from '../../localization/settings.json';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Settings = () => {
  const { darkMode, dispatch } = useContext(DarkModeContext);
  const { user } = useAuth();
  const { getTranslation } = useLocalization();
  const [exporting, setExporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  
  // Translation helper
  const t = (key) => getTranslation(settingsTranslations, key) || key;
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: false,
    twoFactorAuth: false,
    language: 'en',
  });
  
  const [saved, setSaved] = useState(false);

  const handleToggle = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSave = () => {
    // Save settings to localStorage
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('adminSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
  }, []);

  // Export all platform data
  const handleExportData = async () => {
    setExporting(true);
    try {
      // Collect all available data
      const exportData = {
        exportDate: new Date().toISOString(),
        exportedBy: user?.email || 'admin',
        users: [],
        orders: [],
        jobs: [],
        reviews: [],
        contacts: [],
        settings: settings
      };

      // Try to fetch data from API
      try {
        const [usersRes, ordersRes, jobsRes] = await Promise.all([
          axios.get(`${API_CONFIG.BASE_URL}/api/admin/users`, { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get(`${API_CONFIG.BASE_URL}/api/admin/orders`, { withCredentials: true }).catch(() => ({ data: [] })),
          axios.get(`${API_CONFIG.BASE_URL}/api/admin/jobs`, { withCredentials: true }).catch(() => ({ data: [] })),
        ]);
        
        exportData.users = usersRes.data?.users || usersRes.data || [];
        exportData.orders = ordersRes.data?.orders || ordersRes.data || [];
        exportData.jobs = jobsRes.data?.jobs || jobsRes.data || [];
      } catch (apiError) {
        }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `noretmy-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Clear cache
  const handleClearCache = () => {
    setClearing(true);
    try {
      // Clear localStorage cache (except essential items)
      const essentialKeys = ['userData', 'adminSettings'];
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!essentialKeys.includes(key)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear session storage
      sessionStorage.clear();
      
      setTimeout(() => {
        setClearing(false);
        alert(t('cacheCleared'));
      }, 1000);
    } catch (error) {
      setClearing(false);
      console.error('Clear cache error:', error);
    }
  };

  const Toggle = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-orange-500' : darkMode ? 'bg-gray-700' : 'bg-gray-300'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform shadow ${
        enabled ? 'translate-x-7' : 'translate-x-1'
      }`} />
    </button>
  );

  const SettingSection = ({ icon: Icon, title, children }) => (
    <div className={`p-6 rounded-2xl ${
      darkMode ? 'bg-[#1a1a2e]/80 border border-white/10' : 'bg-white border border-gray-100 shadow-lg'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-orange-500/20 text-orange-500">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h3>
      </div>
      {children}
    </div>
  );

  const SettingRow = ({ label, description, children }) => (
    <div className={`flex items-center justify-between py-4 border-b last:border-b-0 ${
      darkMode ? 'border-white/10' : 'border-gray-100'
    }`}>
      <div className="flex-1 mr-4">
        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{label}</p>
        {description && (
          <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );

  const SelectField = ({ value, onChange, options }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-4 py-2 rounded-lg transition-all outline-none ${
        darkMode 
          ? 'bg-gray-800 border border-gray-700 text-white' 
          : 'bg-gray-50 border border-gray-200 text-gray-900'
      } focus:border-orange-500`}
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {t('settings')}
      </h1>

      <div className="space-y-6">
        {/* Appearance */}
        <SettingSection icon={darkMode ? Moon : Sun} title={t('appearance')}>
          <SettingRow 
            label={t('darkMode')} 
            description={t('darkModeDesc')}
          >
            <Toggle 
              enabled={darkMode} 
              onToggle={() => dispatch({ type: 'TOGGLE' })} 
            />
          </SettingRow>
        </SettingSection>

        {/* Notifications */}
        <SettingSection icon={Bell} title={t('notifications')}>
          <SettingRow 
            label={t('emailNotifications')} 
            description={t('emailNotificationsDesc')}
          >
            <Toggle 
              enabled={settings.emailNotifications} 
              onToggle={() => handleToggle('emailNotifications')} 
            />
          </SettingRow>
          <SettingRow 
            label="Push Notifications" 
            description={t('pushNotificationsDesc')}
          >
            <Toggle 
              enabled={settings.pushNotifications} 
              onToggle={() => handleToggle('pushNotifications')} 
            />
          </SettingRow>
          <SettingRow 
            label={t('weeklyDigest')} 
            description={t('weeklyDigestDesc')}
          >
            <Toggle 
              enabled={settings.weeklyDigest} 
              onToggle={() => handleToggle('weeklyDigest')} 
            />
          </SettingRow>
        </SettingSection>

        {/* Security */}
        <SettingSection icon={Shield} title={t('security')}>
          <SettingRow 
            label={t('twoFactorAuth')} 
            description={t('twoFactorAuthDesc')}
          >
            <Toggle 
              enabled={settings.twoFactorAuth} 
              onToggle={() => handleToggle('twoFactorAuth')} 
            />
          </SettingRow>
        </SettingSection>

        {/* Localization */}
        <SettingSection icon={Globe} title={t('localization')}>
          <SettingRow 
            label={t('language')} 
            description={t('languageDesc')}
          >
            <SelectField
              value={settings.language}
              onChange={(val) => handleChange('language', val)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' },
              ]}
            />
          </SettingRow>
        </SettingSection>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          className={`w-full md:w-auto px-6 py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            saved 
              ? 'bg-slate-600 text-white' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
          }`}
        >
          {saved ? (
            <>
              <Check className="w-5 h-5" />
              {t('saved')}
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {t('saveAllSettings')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;
