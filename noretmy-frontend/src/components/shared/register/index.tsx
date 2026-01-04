'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { registerUser } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DynamicForm from '../DynamicForm';
import { registerSchema, RegisterFormData } from '../DynamicForm/schemas/fieldSchemas';
import { UserIcon, BriefcaseIcon } from '@heroicons/react/24/outline';

const RegisterPage = () => {
  const { t } = useTranslations();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading } = useAppSelector((state) => state.auth);

  // Role selection state: 'client' or 'seller'
  const [selectedRole, setSelectedRole] = useState<'client' | 'seller' | null>(null);

  const {
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange',
  });

  // Watch form values for validation
  const watchedValues = watch();

  // Check if form is valid for button state
  const isFormValid = () => {
    const { fullName, email, password, confirmPassword } = watchedValues;
    return fullName && email && password && confirmPassword && password === confirmPassword && selectedRole !== null;
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!selectedRole) {
      toast.error('Please select whether you want to join as a Client or Seller');
      return;
    }

    try {
      await dispatch(registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        isSeller: selectedRole === 'seller',
        sellerType: selectedRole === 'seller' ? 'individual' : undefined,
      })).unwrap();
      toast.success(t('auth:register.success') || 'Account created successfully! Please check your email to verify your account.');
      router.push('/login');
    } catch (error: any) {
      const errorMessage = typeof error === 'string' ? error : (error?.response?.data?.message || error?.message || t('auth:register.error') || 'Registration failed. Please try again.');
      toast.error(errorMessage);
    }
  };

  const formFields = [
    {
      id: 'fullName',
      name: 'fullName' as const,
      type: 'text' as const,
      placeholder: t('auth:register.fullName'),
      label: t('auth:register.fullName'),
      required: true,
    },
    {
      id: 'email',
      name: 'email' as const,
      type: 'email' as const,
      placeholder: t('auth:register.email'),
      label: t('auth:register.email'),
      required: true,
    },
    {
      id: 'password',
      name: 'password' as const,
      type: 'password' as const,
      placeholder: t('auth:register.password'),
      label: t('auth:register.password'),
      required: true,
    },
    {
      id: 'confirmPassword',
      name: 'confirmPassword' as const,
      type: 'password' as const,
      placeholder: t('auth:register.confirmPassword'),
      label: t('auth:register.confirmPassword'),
      required: true,
    },
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden rounded-xl">
        <CardHeader className="text-center pb-4 pt-8">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth:register.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth:register.subtitle')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 px-8">
            {/* Role Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                I want to join as
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Client Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('client')}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedRole === 'client'
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {selectedRole === 'client' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <UserIcon className={`h-8 w-8 mb-2 ${selectedRole === 'client' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`font-semibold text-sm ${selectedRole === 'client' ? 'text-orange-600' : 'text-gray-700'}`}>
                    Client
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    I'm looking to hire
                  </span>
                </button>

                {/* Seller Option */}
                <button
                  type="button"
                  onClick={() => setSelectedRole('seller')}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${selectedRole === 'seller'
                    ? 'border-orange-500 bg-orange-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {selectedRole === 'seller' && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <BriefcaseIcon className={`h-8 w-8 mb-2 ${selectedRole === 'seller' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <span className={`font-semibold text-sm ${selectedRole === 'seller' ? 'text-orange-600' : 'text-gray-700'}`}>
                    Seller
                  </span>
                  <span className="text-xs text-gray-500 mt-1 text-center">
                    I want to offer services
                  </span>
                </button>
              </div>
              {selectedRole === null && (
                <p className="text-xs text-gray-400 text-center">
                  Please select your account type to continue
                </p>
              )}
            </div>

            {/* Form Fields */}
            <DynamicForm
              fields={formFields}
              control={control}
              watch={watch}
            />
          </CardContent>

          <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : selectedRole === 'seller' ? 'Join as Seller' : selectedRole === 'client' ? 'Join as Client' : t('auth:register.createAccount')}
            </Button>

            <div className="text-center">
              <span className="text-gray-600 text-sm">
                {t('Already have an account?')}{' '}
              </span>
              <Link
                href="/login"
                className="text-neutral-900 hover:text-neutral-700 font-medium text-sm transition-colors"
              >
                {t('auth:register.signIn')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default RegisterPage;
