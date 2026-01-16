'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import DynamicForm from '../DynamicForm';
import { Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams?.get('token');

    const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
    const [isResetSuccessful, setIsResetSuccessful] = useState(false);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onChange',
    });

    const watchedValues = watch();

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsTokenValid(false);
                return;
            }

            try {
                const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
                const response = await axios.get(`${BACKEND_URL}/password-reset/verify/${token}`);
                setIsTokenValid(response.data.success);
            } catch (error) {
                setIsTokenValid(false);
            }
        };

        verifyToken();
    }, [token]);

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            toast.error('Invalid reset link');
            return;
        }

        try {
            const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
            const response = await axios.post(`${BACKEND_URL}/password-reset/reset`, {
                token,
                newPassword: data.newPassword,
            });

            if (response.data.success) {
                setIsResetSuccessful(true);
                toast.success('Password reset successfully!');
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            }
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Failed to reset password. Please try again.';
            toast.error(errorMessage);
        }
    };

    const formFields = [
        {
            id: 'newPassword',
            name: 'newPassword' as const,
            type: 'password' as const,
            placeholder: 'Enter new password',
            label: 'New Password',
            required: true,
        },
        {
            id: 'confirmPassword',
            name: 'confirmPassword' as const,
            type: 'password' as const,
            placeholder: 'Confirm new password',
            label: 'Confirm Password',
            required: true,
        },
    ];

    // Loading state
    if (isTokenValid === null) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Card className="w-full max-w-md shadow-xl border-0 rounded-xl p-8">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
                        <p className="text-gray-600">Verifying reset link...</p>
                    </div>
                </Card>
            </div>
        );
    }

    // Invalid token
    if (isTokenValid === false) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                <Card className="w-full max-w-md shadow-xl border-0 rounded-xl">
                    <CardHeader className="text-center pb-6 pt-8 bg-red-50">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-10 h-10 text-red-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                            Invalid or Expired Link
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            This password reset link is invalid or has expired.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                        <p className="text-sm text-gray-600 text-center">
                            Password reset links expire after 1 hour for security reasons.
                            Please request a new reset link.
                        </p>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-3 px-8 pb-8">
                        <Link href="/forget-password" className="w-full">
                            <Button className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium">
                                Request New Link
                            </Button>
                        </Link>
                        <Link href="/login" className="w-full">
                            <Button className="w-full h-12 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-medium">
                                Back to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Success state
    if (isResetSuccessful) {
        return (
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                <Card className="w-full max-w-md shadow-xl border-0 rounded-xl">
                    <CardHeader className="text-center pb-6 pt-8 bg-green-50">
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                            Password Reset Successful!
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Your password has been successfully reset.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 py-6">
                        <p className="text-sm text-gray-600 text-center">
                            You can now log in with your new password.
                            Redirecting you to login page...
                        </p>
                    </CardContent>

                    <CardFooter className="px-8 pb-8">
                        <Link href="/login" className="w-full">
                            <Button className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium">
                                Continue to Login
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // Reset password form
    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
            <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden rounded-xl">
                <CardHeader className="text-center pb-6 pt-8">
                    <div className="flex justify-center mb-4">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                            <Lock className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        Reset Your Password
                    </CardTitle>
                    <CardDescription className="text-gray-600">
                        Enter your new password below
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-6 px-8">
                        <DynamicForm
                            fields={formFields}
                            control={control}
                            watch={watch}
                        />

                        {errors.confirmPassword && (
                            <p className="text-sm text-red-600 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {errors.confirmPassword.message}
                            </p>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 px-8 pb-8">
                        <Button
                            type="submit"
                            disabled={isSubmitting || !watchedValues.newPassword || !watchedValues.confirmPassword}
                            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
                        </Button>

                        <Link href="/login" className="w-full">
                            <Button
                                type="button"
                                className="w-full h-12 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-900 font-medium transition-all"
                            >
                                Cancel
                            </Button>
                        </Link>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}

const ResetPasswordPage = () => {
    return (
        <Suspense fallback={
            <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
};

export default ResetPasswordPage;
