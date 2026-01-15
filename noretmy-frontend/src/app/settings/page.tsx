'use client';
import React, { useState } from 'react';
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Lock,
  CreditCard,
  Shield,
  Languages,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type SettingsTab =
  | 'profile'
  | 'account'
  | 'notifications'
  | 'security'
  | 'payments'
  | 'privacy'
  | 'language';

const DUMMY_USER = {
  name: 'Alex Rodriguez',
  email: 'alex.rodriguez@freelancemaster.com',
  profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg',
  professionalTitle: 'Senior Full-Stack Developer',
  bio: 'Experienced developer with 8+ years of expertise in creating scalable web applications. Passionate about clean code and innovative solutions.',
  skills: ['React', 'Node.js', 'TypeScript', 'GraphQL', 'AWS'],
  location: 'San Francisco, CA',
  memberSince: 'January 2022',
};

const SettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [notificationSettings, setNotificationSettings] = useState({
    projectInvitations: true,
    messageAlerts: true,
    paymentReminders: false,
    weeklyPerformanceSummary: true,
  });

  const renderSettingsSidebar = () => {
    const tabs: Array<{
      key: SettingsTab;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { key: 'profile', label: 'Profile', icon: User },
      { key: 'account', label: 'Account', icon: SettingsIcon },
      { key: 'notifications', label: 'Notifications', icon: Bell },
      { key: 'security', label: 'Security', icon: Lock },
      { key: 'payments', label: 'Payments', icon: CreditCard },
      { key: 'privacy', label: 'Privacy', icon: Shield },
      { key: 'language', label: 'Language', icon: Languages },
    ];

    return (
      <div className="w-72 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-gray-200 p-6 shadow-lg">
        <div className="flex items-center space-x-4 mb-10">
          <div className="relative">
            <img
              src={DUMMY_USER.profilePicture}
              alt={DUMMY_USER.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
            />
            <span className="absolute bottom-0 right-0 block h-4 w-4 rounded-full bg-orange-500 ring-2 ring-white"></span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {DUMMY_USER.name}
            </h2>
            <p className="text-sm text-slate-500">
              {DUMMY_USER.professionalTitle}
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-300
                ${
                  activeTab === tab.key
                    ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                    : 'text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <tab.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{tab.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          ))}
        </nav>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Dialog>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-between px-4 py-3 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <HelpCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Help & Support</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Help & Support</DialogTitle>
                <DialogDescription>
                  Need assistance? Our support team is here to help you with any
                  questions or concerns.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <p className="text-sm col-span-4">
                    <strong>Email:</strong> info@noretmy.com
                  </p>
                  {/* <p className="text-sm col-span-4">
                    <strong>Phone:</strong> +1 (555) 123-4567
                  </p> */}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="p-8 space-y-8">
            <div className="border-b pb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Profile Settings
              </h1>
              <p className="text-slate-500">
                Manage your professional profile and personal information
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    defaultValue={DUMMY_USER.name}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Professional Title
                  </label>
                  <input
                    type="text"
                    defaultValue={DUMMY_USER.professionalTitle}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    defaultValue={DUMMY_USER.location}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Skills
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DUMMY_USER.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Professional Bio
                </label>
                <textarea
                  rows={4}
                  defaultValue={DUMMY_USER.bio}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="p-8 space-y-8">
            <div className="border-b pb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                Notification Preferences
              </h1>
              <p className="text-slate-500">
                Customize how and when you receive notifications
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  key: 'projectInvitations',
                  label: 'New Project Invitations',
                  description:
                    'Get notified when you receive new project proposals',
                },
                {
                  key: 'messageAlerts',
                  label: 'Message Alerts',
                  description: 'Receive notifications for new client messages',
                },
                {
                  key: 'paymentReminders',
                  label: 'Payment Reminders',
                  description: 'Get alerts about upcoming or overdue payments',
                },
               
              ].map((notification) => (
                <div
                  key={notification.key}
                  className="flex justify-between items-center bg-white rounded-lg p-4 shadow-sm border border-slate-100"
                >
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {notification.label}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {notification.description}
                    </p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        notificationSettings[
                          notification.key as keyof typeof notificationSettings
                        ]
                      }
                      onChange={() =>
                        setNotificationSettings((prev) => ({
                          ...prev,
                          [notification.key]:
                            !prev[
                              notification.key as keyof typeof notificationSettings
                            ],
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div
                      className="relative w-12 h-6 bg-slate-200 rounded-full peer-checked:bg-blue-500 
                      after:content-[''] after:absolute after:top-[2px] after:left-[2px] 
                      after:bg-white after:border after:border-slate-300 after:rounded-full 
                      after:h-5 after:w-5 after:transition-all after:duration-300 
                      peer-checked:after:translate-x-full"
                    ></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8">
            <div className="border-b pb-6">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}{' '}
                Settings
              </h1>
              <p className="text-slate-500">
                This section is currently under development
              </p>
            </div>
            <div className="flex items-center justify-center h-64 bg-slate-50 rounded-lg mt-6">
              <p className="text-slate-500 text-lg">Coming soon...</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {renderSettingsSidebar()}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto bg-white shadow-sm min-h-screen">
          {renderActiveTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;
