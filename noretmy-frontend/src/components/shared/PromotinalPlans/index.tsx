'use client';

import React, { useState, useEffect } from 'react';
import { Check, ChevronRight, Zap, AlertCircle, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface PromotionalPlan {
  id: string;
  title: string;
  description: string;
  price: number;
  features: string[];
  popular: boolean;
  badge?: string;
}

interface ActivePromotion {
  plan: string;
  startDate: string;
  endDate: string;
  remainingDays: number;
}

const PromotionalPlansScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('basic');
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const router = useRouter();
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;

  const promotionalPlans: PromotionalPlan[] = [
    {
      id: 'basic',
      title: 'Basic Boost',
      description: 'Simple visibility enhancement for new sellers',
      price: 40,
      features: [
        'Featured in category search',
        'Basic analytics',
        '30 days duration',
      ],
      popular: false,
    },
    {
      id: 'standard',
      title: 'Standard Promotion',
      description: 'Better visibility with improved placement',
      price: 50,
      features: [
        'Featured in category search',
        'Top results placement',
        'Performance tracking',
        '30 days duration',
      ],
      popular: true,
      badge: 'Popular',
    },
    {
      id: 'premium',
      title: 'Premium Spotlight',
      description: 'High visibility for experienced sellers',
      price: 60,
      features: [
        'Homepage featuring',
        'Category top placement',
        'Advanced visibility',
        'Priority support',
        '30 days duration',
      ],
      popular: false,
    },
    {
      id: 'ultimate',
      title: 'Ultimate Exposure',
      description: 'Maximum visibility across all platforms',
      price: 70,
      features: [
        'Front page spotlight',
        'Top of all relevant searches',
        'Featured in newsletter',
        'Priority customer support',
        '30 days duration',
      ],
      popular: false,
      badge: 'Best Value',
    },
  ];

  useEffect(() => {
    const checkActivePromotions = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/subscription/user/active`, {
          withCredentials: true
        });

        if (response.data?.hasActivePromotion && response.data?.activePromotion) {
          const active = response.data.activePromotion;
          setActivePromotion({
            plan: active.promotionPlan,
            startDate: active.promotionStartDate,
            endDate: active.promotionEndDate,
            remainingDays: active.remainingDays
          });
        } else {
          setActivePromotion(null);
        }
      } catch (error: any) {
        setActivePromotion(null);
      } finally {
        setLoading(false);
      }
    };

    checkActivePromotions();

    const handleFocus = () => {
      checkActivePromotions();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [BACKEND_URL]);

  const handleSelectPlan = (planId: string) => {
    if (activePromotion) {
      toast.error('You already have an active promotion. Wait for it to expire before purchasing a new one.');
      return;
    }
    setSelectedPlan(planId);
  };

  const handlePromote = async () => {
    if (activePromotion) {
      toast.error('You already have an active promotion. Wait for it to expire before purchasing a new one.');
      return;
    }

    const selectedPlanDetails = promotionalPlans.find(
      (plan) => plan.id === selectedPlan,
    );

    if (!selectedPlanDetails) {
      toast.error('Please select a valid plan');
      return;
    }

    setPurchasing(true);
    toast.success(
      `You've selected the ${selectedPlanDetails.title} plan for $${selectedPlanDetails.price}`,
    );

    const paymentType = 'monthly_promotional';
    router.push(
      `/checkout?promotionalPlan=${selectedPlanDetails.id ?? ''}&title=${encodeURIComponent(selectedPlanDetails.title ?? '')}&price=${selectedPlanDetails.price ?? ''}&payment_type=${paymentType}`,
    );
  };

  const getPlanDisplayName = (planId: string): string => {
    const plan = promotionalPlans.find(p => p.id === planId);
    return plan?.title || planId;
  };

  const isDisabled = !!activePromotion || loading;

  return (
    <div className="container mx-auto py-8 px-4 max-w-8xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Promote Your Gig
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Boost your visibility with our promotional plans. All plans run for 30
          days and help you reach more potential clients.
        </p>
      </div>

      {/* Active Promotion Banner */}
      {activePromotion && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-center gap-4 mb-10 ">
          <div className="flex items-center gap-4">
            <div className="text-right">
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-100 rounded-lg px-4 py-2">
            <AlertCircle className="h-4 w-4" />
            <span>
              You can only have one active promotion at a time. New plans can be purchased after the current one expires.
            </span>
          </div>
        </div>
      )}

      <Tabs defaultValue="card-view" className="mb-8">
        <div className="flex justify-center mb-6">
          <TabsList>
            <TabsTrigger value="card-view">Card View</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="card-view">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promotionalPlans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative ${selectedPlan === plan.id && !isDisabled ? 'border-2 border-black' : 'border border-gray-200'} 
                  ${isDisabled ? 'opacity-60' : ''} transition-all hover:shadow-md`}
              >
                {plan.badge && (
                  <Badge
                    className={`absolute right-2 top-2 ${plan.badge === 'Popular' ? 'bg-purple-500' : 'bg-blue-500'}`}
                  >
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center">
                    {plan.title}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <p className="text-3xl font-bold">${plan.price}</p>
                    <p className="text-sm text-gray-500">for 30 days</p>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <Check className="h-4 w-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={selectedPlan === plan.id && !isDisabled ? 'default' : 'outline'}
                    className={`w-full ${selectedPlan === plan.id && !isDisabled ? 'bg-black hover:bg-gray-800 text-white' : ''}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isDisabled}
                  >
                    {isDisabled
                      ? 'Currently Unavailable'
                      : selectedPlan === plan.id
                        ? 'Selected'
                        : 'Select Plan'
                    }
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison">
          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Plan</th>
                      <th className="text-left py-3 px-4">Price</th>
                      <th className="text-left py-3 px-4">Features</th>
                      <th className="text-left py-3 px-4">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {promotionalPlans.map((plan) => (
                      <tr key={plan.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div className="font-medium">{plan.title}</div>
                          <div className="text-sm text-gray-500">
                            {plan.description}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-medium">${plan.price}</td>
                        <td className="py-4 px-4">
                          <ul className="space-y-1">
                            {plan.features.slice(0, 2).map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-center text-sm"
                              >
                                <Check className="h-3 w-3 text-orange-500 mr-1" />
                                {feature}
                              </li>
                            ))}
                            {plan.features.length > 2 && (
                              <li className="text-sm text-gray-500">
                                +{plan.features.length - 2} more
                              </li>
                            )}
                          </ul>
                        </td>
                        <td className="py-4 px-4">
                          <RadioGroup
                            value={selectedPlan}
                            onValueChange={handleSelectPlan}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem
                                value={plan.id}
                                id={`radio-${plan.id}`}
                                disabled={isDisabled}
                              />
                              <Label
                                htmlFor={`radio-${plan.id}`}
                                className={`cursor-pointer ${isDisabled ? 'opacity-50' : ''}`}
                              >
                                Select
                              </Label>
                            </div>
                          </RadioGroup>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className={`p-6 rounded-lg border mt-8 ${isDisabled
        ? 'bg-gray-100 border-gray-200'
        : 'bg-gray-50 border-gray-200'
        }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium">
              {isDisabled
                ? 'Promotion Currently Active'
                : 'Ready to promote your gig?'
              }
            </h3>
            <p className="text-gray-500">
              {activePromotion
                ? `Your ${getPlanDisplayName(activePromotion.plan)} plan is active.`
                : selectedPlan && !loading
                  ? `You've selected the ${promotionalPlans.find((plan) => plan.id === selectedPlan)?.title} plan.`
                  : ""
              }
            </p>
          </div>
          <Button
            onClick={handlePromote}
            className={`${isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} text-white`}
            size="lg"
            disabled={isDisabled || purchasing}
          >
            {purchasing
              ? 'Processing...'
              : isDisabled
                ? 'Wait for Current Plan to Expire'
                : <>Promote Now <ChevronRight className="ml-2 h-4 w-4" /></>
            }
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PromotionalPlansScreen;
