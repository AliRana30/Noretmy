'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { loginUser } from '@/store/authSlice';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import DynamicForm from '../DynamicForm';
import { loginSchema, LoginFormData } from '../DynamicForm/schemas/fieldSchemas';

const LoginPage = () => {
  const { t } = useTranslations();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, loading } = useAppSelector((state) => state.auth);
  const [randomSum, setRandomSum] = useState({ num1: 0, num2: 0 });

  const {
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      userSum: '',
    },
    mode: 'onChange',
  });

  // Watch form values for validation
  const watchedValues = watch();


  // Generate random sum for captcha
  useEffect(() => {
    setRandomSum({
      num1: Math.floor(Math.random() * 10) + 1,
      num2: Math.floor(Math.random() * 10) + 1,
    });
  }, []);

  // Check if form is valid for button state
  const isFormValid = () => {
    const { email, password, userSum } = watchedValues;
    return email && password && userSum && Number(userSum) === randomSum.num1 + randomSum.num2;
  };

  const onSubmit = async (data: LoginFormData) => {
    // Validate captcha
    if (Number(data.userSum) !== randomSum.num1 + randomSum.num2) {
      toast.error(t('auth:login.captchaError') || 'Incorrect captcha answer');
      return;
    }

    try {
      await dispatch(loginUser({ email: data.email, password: data.password })).unwrap();
      toast.success(t('auth:login.success') || 'Login successful!');
      router.push('/');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || t('auth:login.error') || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
    }
  };

  const formFields = [
    {
      id: 'email',
      name: 'email' as const,
      type: 'email' as const,
      placeholder: t('auth:login.email'),
      label: t('auth:login.email'),
      required: true,
    },
    {
      id: 'password',
      name: 'password' as const,
      type: 'password' as const,
      placeholder: t('auth:login.password'),
      label: t('auth:login.password'),
      required: true,
    },
    {
      id: 'userSum',
      name: 'userSum' as const,
      type: 'number' as const,
      placeholder: t('auth:login.captcha', { num1: randomSum.num1, num2: randomSum.num2 }),
      label: t('auth:login.captcha', { num1: randomSum.num1, num2: randomSum.num2 }),
      required: true,
    },
  ];

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden rounded-xl">
        <CardHeader className="text-center pb-6 pt-8">
          <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
            {t('auth:login.title')}
          </CardTitle>
          <CardDescription className="text-gray-600">
            {t('auth:login.subtitle')}
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 px-8">
            <DynamicForm
              fields={formFields}
              control={control}
              watch={watch}
            />

            <div className="text-right">
              <Link
                href="/forget-password"
                className="text-sm text-neutral-900 hover:text-neutral-700 font-medium transition-colors"
              >
                {t('auth:login.forgotPassword')}
              </Link>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
            <Button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : t('auth:login.signIn')}
            </Button>

            <div className="text-center">
              <Link
                href="/register"
                className="text-neutral-900 hover:text-neutral-700 font-medium text-sm transition-colors"
              >
                {t('auth:login.noAccount')}{' '}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
