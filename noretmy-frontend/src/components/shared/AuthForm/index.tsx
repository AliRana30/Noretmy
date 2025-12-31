'use client';

import React from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Lock, User, Mail, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

interface AuthFormProps {
  title: string;
  fields: {
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: string;
    icon?: React.ReactNode;
  }[];
  buttonText: string;
  onSubmit: () => void;
  footerText?: string;
  onFooterLinkPress?: () => void;
  passwordStrength?: number;
  isSeller?: boolean;
  setIsSeller?: (value: boolean) => void;
  sellerType?: string;
  setSellerType?: (value: string) => void;
  loginFailed?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({
  title,
  fields,
  buttonText,
  onSubmit,
  footerText,
  onFooterLinkPress,
  passwordStrength,
  isSeller,
  setIsSeller,
  sellerType,
  setSellerType,
  loginFailed,
}) => {
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = React.useState<{
    [key: string]: boolean;
  }>({});

  const togglePasswordVisibility = (index: number) => {
    setShowPassword((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Add appropriate icons for common field types
  const getFieldIcon = (placeholder: string) => {
    const lowerPlaceholder = placeholder.toLowerCase();
    if (lowerPlaceholder.includes('email'))
      return <Mail size={18} className="text-gray-500" />;
    if (lowerPlaceholder.includes('password'))
      return <Lock size={18} className="text-gray-500" />;
    return <User size={18} className="text-gray-500" />;
  };

  const getStrengthLabel = (strength: number) => {
    return t(`common:passwordStrength.${
      strength === 0
        ? 'weak'
      : strength === 1
        ? 'fair'
        : strength === 2
        ? 'good'
          : strength === 3
        ? 'strong'
        : 'veryStrong'
    }`);
  };

  const getStrengthColor = (index: number, strength: number) => {
    if (index >= strength) return 'bg-gray-200';

    return index === 0
      ? 'bg-red-500'
      : index === 1
        ? 'bg-orange-500'
        : index === 2
          ? 'bg-blue-500'
          : 'bg-orange-500';
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-sans">
      <Card className="w-full max-w-md shadow-xl border-0 overflow-hidden rounded-xl">
        <div className="h-1 bg-neutral-900"></div>

        <CardHeader className="pt-8 pb-4">
          <div className="text-center mb-4">
           <div className="inline-flex items-center justify-center w-14 h-14 rounded-full  text-white text-2xl font-bold shadow-md mb-4 overflow-hidden">
  <img src="/logo/noretmy_logo.png" alt="Logo" className="w-full h-full object-contain" />
</div>

          </div>
          <h2 className="text-2xl font-semibold text-center text-gray-800">
            {title}
          </h2>
          <p className="text-center text-gray-500 text-sm mt-2">
            {title === t('auth:register.title')
              ? t('auth:register.subtitle')
              : t('auth:login.subtitle')}
          </p>
        </CardHeader>

        <CardContent className="space-y-6 px-8">
          {/* Input Fields */}
          <div className="space-y-5">
            {fields.map((field, index) => (
              <div key={index} className="space-y-1.5">
                <Label
                  htmlFor={`field-${index}`}
                  className="text-sm font-medium text-gray-700 ml-1"
                >
                  {field.placeholder}
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {field.icon || getFieldIcon(field.placeholder)}
                  </div>
                  <Input
                    id={`field-${index}`}
                    className="w-full h-12 pl-11 pr-10 rounded-xl border border-gray-200 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition-all text-gray-800 placeholder-gray-400 shadow-sm"
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChangeText(e.target.value)}
                    type={
                      field.secureTextEntry
                        ? showPassword[index]
                          ? 'text'
                          : 'password'
                        : 'text'
                    }
                  />
                  {field.secureTextEntry && (
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => togglePasswordVisibility(index)}
                    >
                      {showPassword[index] ? (
                        <EyeOff
                          size={18}
                          className="text-gray-500 hover:text-gray-700"
                        />
                      ) : (
                        <Eye
                          size={18}
                          className="text-gray-500 hover:text-gray-700"
                        />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Login Failed - Forgot Password Option */}
          {loginFailed && (
  <div className="flex justify-end mt-2">
    <Link
      href="/forget-password"
      className="text-sm text-neutral-900 hover:text-neutral-700 font-medium transition-colors"
    >
                {t('auth:login.forgotPassword')}
    </Link>
  </div>
)}

          {/* Password Strength Indicator */}
          {passwordStrength !== undefined && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-gray-500">
                  {t('common:passwordStrength.label')}
                </Label>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength === 0
                      ? 'text-red-600'
                      : passwordStrength === 1
                        ? 'text-orange-600'
                        : passwordStrength === 2
                          ? 'text-blue-600'
                          : 'text-orange-600'
                  }`}
                >
                  {getStrengthLabel(passwordStrength)}
                </span>
              </div>
              <div className="flex gap-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-1/4 rounded-full transition-colors ${getStrengthColor(
                      index,
                      passwordStrength
                    )}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Seller Toggle for Sign Up */}
          {title === t('auth:register.title') && (
            <div className="space-y-5 pt-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="seller-mode"
                  checked={isSeller}
                  onCheckedChange={setIsSeller}
                />
                <Label htmlFor="seller-mode">{t('auth:register.sellerMode')}</Label>
              </div>

              {/* Seller Type Selection */}
              {isSeller && (
                <div className="space-y-3 animate-fadeIn">
                  <Label className="text-sm font-medium text-gray-700 ml-1">
                    {t('auth:register.sellerType')}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      variant={
                        sellerType === 'Freelancer' ? 'default' : 'outline'
                      }
                      onClick={() =>
                        setSellerType && setSellerType('Freelancer')
                      }
                      className={`rounded-xl h-12 transition-all ${
                        sellerType === 'Freelancer'
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                          : 'text-gray-700 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('auth:register.freelancer')}
                    </Button>
                    <Button
                      variant={sellerType === 'Company' ? 'default' : 'outline'}
                      onClick={() => setSellerType && setSellerType('Company')}
                      className={`rounded-xl h-12 transition-all ${
                        sellerType === 'Company'
                          ? 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-md'
                          : 'text-gray-700 bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {t('auth:register.company')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col space-y-6 px-8 pb-8">
          <Button
            onClick={onSubmit}
            className="w-full h-12 bg-neutral-900 hover:bg-neutral-800 rounded-xl text-white font-medium shadow-md transition-all"
          >
            {buttonText}
          </Button>

          <p className="text-sm text-center text-gray-600">
            {footerText}{' '}
            <button
              onClick={onFooterLinkPress}
              className="text-neutral-900 hover:text-neutral-700 font-medium transition-colors"
            >
              {t('common:buttons.next')}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AuthForm;