'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useTranslations } from '@/hooks/useTranslations';
import toast from 'react-hot-toast';
import DynamicForm from '../DynamicForm';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage = () => {
    const { t } = useTranslations();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
        mode: 'onChange',
    });

    const watchedEmail = watch('email');

    const onSubmit = async (data: ForgotPasswordFormData) => {
        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await axios.post(`${BACKEND_URL}/password-reset/request`, {
                email: data.email,
            });

            if (response.data.success) {
                setSubmittedEmail(data.email);
                setIsSubmitted(true);
                toast.success('Password reset link has been sent to your email!');
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to send reset link. Please try again.';
            toast.error(errorMessage);
        }
    };

    const formFields = [
        {
            id: 'email',
            name: 'email' as const,
            type: 'email' as const,
            placeholder: 'Enter your email address',
            label: 'Email Address',
            required: true,
        },
    ];

    if (isSubmitted) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
                <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden rounded-xl">
                    <CardHeader className="text-center pb-6 pt-8 bg-green-50">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                            Check Your Email
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            We've sent password reset instructions to
                        </CardDescription>
                        <p className="text-sm font-semibold text-gray-900 mt-2">{submittedEmail}</p>
                    </CardHeader>

                    <CardContent className="space-y-6 px-8 py-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-gray-700">
                                    <p className="font-medium text-gray-900 mb-1">What's next?</p>
                                    <ol className="list-decimal list-inside space-y-1 text-gray-600">
                                        <li>Check your email inbox</li>
                                        <li>Click the reset link we sent you</li>
                                        <li>Set your new password</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 text-center">
                            Didn't receive the email? Check your spam folder or{' '}
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="text-orange-600 hover:text-orange-700 font-medium underline"
                            >
                                try again
                            </button>
                        </p>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                        <Link href="/login" className="w-full">
                            <Button className="w-full h-12 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-medium transition-all flex items-center justify-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
            <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden rounded-xl">
                <CardHeader className="text-center pb-6 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <Mail className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        Forgot Password?
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        No worries! Enter your email and we'll send you reset instructions.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6 px-8">
                        <DynamicForm
                            fields={formFields}
                            control={control}
                            watch={watch}
                        />
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !watchedEmail}
                            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </Button>

                        <Link href="/login" className="w-full">
                            <Button
                                type="button"
                                className="w-full h-12 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
