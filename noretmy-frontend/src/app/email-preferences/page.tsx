"use client"
import React, { useState, useEffect } from 'react';
import { CheckCircle, Mail, Bell, Layout, Users, Calendar, Settings, AlertTriangle, Loader } from 'lucide-react';
import axios from 'axios';

interface NewsletterPreferences {
  email: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'none';
  topics: string[];
  receiveSpecialOffers: boolean;
}

const frequencyOptions: Record<number, 'daily' | 'weekly' | 'monthly' | 'none'> = {
    0: 'daily',
    1: 'weekly',
    2: 'monthly',
    3: 'none',
  };
  
  const reverseFrequencyOptions: Record<'daily' | 'weekly' | 'monthly' | 'none', number> = {
    daily: 0,
    weekly: 1,
    monthly: 2,
    none: 3,
  };
  
  const topicOptions: Record<number, string> = {
    0: 'product_updates',
    1: 'industry_news',
    2: 'tips_tutorials',
    3: 'company_announcements',
    4: 'events_webinars',
  };
  
  const reverseTopicOptions: Record<string, number> = Object.fromEntries(
    Object.entries(topicOptions).map(([k, v]) => [v, Number(k)])
  );
  
const NewsletterPreferencesPage: React.FC = () => {
  const [preferences, setPreferences] = useState<NewsletterPreferences>({
    email: '',
    frequency: 'none',
    topics: [],
    
    receiveSpecialOffers: true,
  });
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL
  useEffect(() => {
    const fetchPreferences = async () => {
      setLoading(true);
      try {

        const response  = await axios.get(`${BACKEND_URL}/newsletter`,{withCredentials : true})
  
        const dataFromBackend = response.data;
  
        } catch (err) {
        setError('Failed to load your preferences. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchPreferences();
  }, []);

  const handleTopicChange = (topic: string) => {
    setPreferences(prev => {
      if (prev.topics.includes(topic)) {
        return { ...prev, topics: prev.topics.filter(t => t !== topic) };
      }
      return { ...prev, topics: [...prev.topics, topic] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {

      const payload = {
        email: preferences.email,
        frequency: reverseFrequencyOptions[preferences.frequency],
        topics: preferences.topics.map(topic => reverseTopicOptions[topic]),
        receiveSpecialOffers: preferences.receiveSpecialOffers,
      };
  

      const response = await axios.put(`${BACKEND_URL}/newsletter/edit`,payload,{withCredentials: true})
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && preferences.email === '') {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center justify-center rounded-lg bg-white p-8 shadow-lg">
          <Loader className="h-10 w-10 animate-spin text-gray-700" />
          <span className="mt-4 text-lg font-medium text-slate-700">Loading your preferences...</span>
        </div>
      </div>
    );
  }

  const topics = [
    { id: 'product_updates', label: 'Product Updates', icon: <Settings className="h-5 w-5" /> },
    { id: 'industry_news', label: 'Industry News', icon: <Layout className="h-5 w-5" /> },
    { id: 'tips_tutorials', label: 'Tips & Tutorials', icon: <Users className="h-5 w-5" /> },
    { id: 'company_announcements', label: 'Company Announcements', icon: <Bell className="h-5 w-5" /> },
    { id: 'events_webinars', label: 'Events & Webinars', icon: <Calendar className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl bg-white shadow">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-700 px-8 py-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Newsletter Preferences</h1>
                <p className="mt-2 text-gray-300">Customize how and when you receive our communications</p>
              </div>
              <Mail className="h-12 w-12 text-gray-300" />
            </div>
          </div>

          {/* Notification area */}
          {error && (
            <div className="mx-8 mt-6 flex items-center rounded-lg bg-red-50 px-4 py-3 text-red-800">
              <AlertTriangle className="mr-3 h-5 w-5 flex-shrink-0 text-red-500" />
              <p>{error}</p>
            </div>
          )}

          {saved && (
            <div className="mx-8 mt-6 flex items-center rounded-lg bg-orange-50 px-4 py-3 text-orange-800">
              <CheckCircle className="mr-3 h-5 w-5 flex-shrink-0 text-orange-500" />
              <p>Your preferences have been updated successfully!</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            <div className="space-y-8">
              {/* Email section */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    className="block w-full flex-1 rounded-none rounded-r-md border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                    value={preferences.email}
                    onChange={(e) => setPreferences({...preferences, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              {/* Frequency section */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Email Frequency</h3>
                <p className="mt-1 text-sm text-gray-500">How often would you like to hear from us?</p>
                
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
                  {['daily', 'weekly', 'monthly', 'none'].map((option) => (
                    <div 
                      key={option}
                      className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border p-4 transition-all hover:border-gray-400 hover:bg-gray-50 ${
                        preferences.frequency === option 
                          ? 'border-gray-700 bg-gray-50 ring-2 ring-gray-700' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => setPreferences({...preferences, frequency: option as any})}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                        preferences.frequency === option ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {option === 'daily' && <span>D</span>}
                        {option === 'weekly' && <span>W</span>}
                        {option === 'monthly' && <span>M</span>}
                        {option === 'none' && <span>-</span>}
                      </div>
                      <span className="mt-2 text-sm font-medium capitalize text-gray-900">
                        {option === 'none' ? 'None' : option}
                      </span>
                      <input
                        type="radio"
                        className="sr-only"
                        checked={preferences.frequency === option}
                        onChange={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Topics section */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Topics of Interest</h3>
                <p className="mt-1 text-sm text-gray-500">Select content you'd like to receive</p>
                
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {topics.map((topic) => (
                    <div 
                      key={topic.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-400 hover:bg-gray-50 ${
                        preferences.topics.includes(topic.id) 
                          ? 'border-gray-700 bg-gray-50 ring-1 ring-gray-700' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleTopicChange(topic.id)}
                    >
                      <div className="flex items-center">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-md ${
                          preferences.topics.includes(topic.id) 
                            ? 'bg-gray-700 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {topic.icon}
                        </div>
                        <div className="ml-4">
                          <label className="text-sm font-medium text-gray-900">{topic.label}</label>
                        </div>
                        <input
                            type="checkbox"
                             className="ml-auto h-5 w-5 rounded border-gray-300 text-gray-700 accent-gray-600 focus:ring-gray-500"
                            checked={preferences.topics.includes(topic.id)}
                             onChange={() => {}}
/>

                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email Format section */}
              {/* <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">Email Format</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { id: 'html', label: 'Rich HTML', description: 'Full formatting with images' },
                    { id: 'text', label: 'Plain Text', description: 'Simple, no images' }
                  ].map((format) => (
                    <div 
                      key={format.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-gray-400 hover:bg-gray-50 ${
                        preferences.format === format.id 
                          ? 'border-gray-700 bg-gray-50 ring-1 ring-gray-700' 
                          : 'border-gray-200'
                      }`}
                      onClick={() => setPreferences({...preferences, format: format.id as 'html' | 'text'})}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 border-gray-300 text-gray-700 focus:ring-gray-500"
                          checked={preferences.format === format.id}
                          onChange={() => {}}
                        />
                        <div className="ml-3">
                          <label className="text-sm font-medium text-gray-900">{format.label}</label>
                          <p className="text-xs text-gray-500">{format.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}

              {/* Special offers section */}
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    id="special-offers"
                    name="special-offers"
                    type="checkbox"
                    className="h-5 w-5 rounded accent-gray-600 border-gray-300 text-gray-700 focus:ring-gray-500 "
                    checked={preferences.receiveSpecialOffers}
                    onChange={(e) => setPreferences({...preferences, receiveSpecialOffers: e.target.checked})}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="special-offers" className="font-medium text-gray-700">Special offers and promotions</label>
                  <p className="text-gray-500">Receive occasional updates about discounts and limited-time offers</p>
                </div>
              </div>
            </div>

            {/* Form actions */}
            <div className="mt-10 flex items-center justify-between border-t border-gray-200 pt-6">
              <button
                type="button"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                onClick={() => {
                  if (window.confirm('Are you sure you want to unsubscribe from all communications?')) {
                    setPreferences({...preferences, frequency: 'none', topics: []});
                  }
                }}
              >
                Unsubscribe from all
              </button>
              
              <button
                type="submit"
                className="inline-flex items-center rounded-md border border-transparent bg-gray-800 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPreferencesPage;