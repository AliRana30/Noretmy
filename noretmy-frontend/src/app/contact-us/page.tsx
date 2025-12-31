'use client';

import React, { useState, FormEvent, ChangeEvent } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FormValues {
  subject: string;
  email: string;
  message: string;
  isSelected: boolean;
}

interface FormErrors {
  subject?: string;
  email?: string;
  message?: string;
  isSelected?: string;
}

const ContactPage: React.FC = () => {
//   const { t } = useTranslation();
  const user = useSelector((state: any) => state.auth.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const [formValues, setFormValues] = useState<FormValues>({
    subject: '',
    email: '',
    message: '',
    isSelected: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {};
    
    if (!formValues.subject) {
      newErrors.subject = 'Name is required';
    }
    
    if (!formValues.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formValues.email)) {
      newErrors.email =  'Invalid email';
    }
    
    if (!formValues.message) {
      newErrors.message =  'Message is required';
    }
    
    if (!formValues.isSelected) {
      newErrors.isSelected =  'You must accept the privacy policy';
    }
    
    return newErrors;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormValues(prev => ({ ...prev, [name]: checked }));
    
    // Clear error when user changes checkbox
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate the field on blur
    const fieldErrors = validateForm();
    if (fieldErrors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof FormErrors] }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      subject: true,
      email: true,
      message: true,
      isSelected: true,
    });
    
    const formErrors = validateForm();
    setErrors(formErrors);
    
    // If there are errors, don't submit
    if (Object.keys(formErrors).length > 0) {
      return;
    }

    if (!user) {
      toast.error( 'Please login first!', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post(
        `${BACKEND_URL}/contact`,
        {
          email: formValues.email,
          message: formValues.message,
          subject : formValues.subject
        },
        { withCredentials: true }
      );

      toast.success( 'Message sent successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      
      // Reset form after successful submission
      setFormValues({
        subject: '',
        email: '',
        message: '',
        isSelected: false,
      });
      setErrors({});
      setTouched({});
      
    } catch (error) {
      toast.error('Error submitting form', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <ToastContainer />
      
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-orange-500 mb-4">
          { 'Contact Us'}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {
            'We value your feedback and are here to help. Feel free to reach out with any questions, comments, or concerns.'}
        </p>
      </div>

      {/* Form Section */}
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          { 'Send Us a Message'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              { 'Subject'}
            </label>
            <input
              id="name"
              name="subject"
              type="text"
              value={formValues.subject}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              placeholder={ 'Subject'}
            />
            {touched.name && errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              placeholder="Email"
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              { 'Message'}
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formValues.message}
              onChange={handleChange}
              onBlur={handleBlur}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
              placeholder={ 'Write your message here...'}
            />
            {touched.message && errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message}</p>
            )}
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="isSelected"
                name="isSelected"
                type="checkbox"
                checked={formValues.isSelected}
                onChange={handleCheckboxChange}
                onBlur={e => setTouched({ ...touched, isSelected: true })}
                className="h-5 w-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500 cursor-pointer"
              />
            </div>
            <div className="ml-3">
              <label htmlFor="isSelected" className="text-sm text-gray-700 cursor-pointer">
                {
                 'I accept the privacy policy'}
              </label>
              {touched.isSelected && errors.isSelected && (
                <p className="mt-1 text-sm text-red-600">{errors.isSelected}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-6 rounded-lg font-medium text-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                { 'Sending...'}
              </span>
            ) : (
               'Send Message'
            )}
          </button>
        </form>
      </div>

      {/* Footer Section */}
      <div className="mt-16 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          { 'Connect With Us'}
        </h3>
        <div className="flex justify-center space-x-6">
          {/* Social media icons */}
          <a href="https://www.facebook.com/profile.php?id=100091924013151" className="text-gray-600 hover:text-orange-500 transition-colors">
            <span className="sr-only">Facebook</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
            </svg>
          </a>
          <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
            <span className="sr-only">Instagram</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
            </svg>
          </a>
          <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
            <span className="sr-only">Twitter</span>
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;