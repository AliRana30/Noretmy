import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import InputField from '../InputFeild';

type PlanType = 'basic' | 'premium' | 'pro';

interface PlanData {
  title: string;
  description: string;
  price: string;
  deliveryTime: string;
}

interface PricingPlanProps {
  selectPlan: string;
  onSelectPlan: (plan: PlanType) => void;
  pricingData: Record<PlanType, PlanData>;
  setPricingData: React.Dispatch<React.SetStateAction<Record<PlanType, PlanData>>>;
}

const PricingPlan: React.FC<PricingPlanProps> = ({
  selectPlan,
  onSelectPlan,
  pricingData,
  setPricingData

}) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | ''>('');

  const formData = pricingData;
  const setFormData = setPricingData;

  const plans = [
    {
      name: 'basic' as PlanType,
      icon: <FaStar className="text-yellow-400 text-xl" />,
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
    },
    {
      name: 'premium' as PlanType,
      icon: <FaStarHalfAlt className="text-indigo-500 text-xl" />,
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-800',
    },
    {
      name: 'pro' as PlanType,
      icon: <FaRegStar className="text-purple-600 text-xl" />,
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-800',
    },
  ];

  const handleSelectPlan = (planName: PlanType) => {
    setSelectedPlan(planName);
    onSelectPlan(planName);
  };

  const handleInputChange = (
    planName: PlanType,
    field: keyof PlanData,
    value: string,
  ) => {
    setFormData((prevData) => ({
      ...prevData,
      [planName]: {
        ...prevData[planName],
        [field]: value,
      },
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            onClick={() => handleSelectPlan(plan.name)}
            className={`
              relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg
              ${selectedPlan === plan.name ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md transform scale-105' : 'shadow-sm'}
              ${plan.bgColor} ${plan.borderColor}
            `}
          >
            <div className="p-6 cursor-pointer">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-lg">{plan.name}</span>
                <div className="p-2 rounded-full bg-white bg-opacity-70">
                  {plan.icon}
                </div>
              </div>

              {selectedPlan === plan.name && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                  Selected
                </div>
              )}

              <div className={`text-sm ${plan.textColor}`}>
                Configure your {plan.name.toLowerCase()} plan
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-6 text-gray-800">
            {selectedPlan} Plan Configuration
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <input
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black-200"
                  placeholder={`Enter ${selectedPlan} title`}
                  value={formData[selectedPlan].title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(selectedPlan, 'title', e.target.value)
                  }
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">$</span>
                    </div>
                    <input
                      type="number"
                      value={formData[selectedPlan].price}
                      onChange={(e) =>
                        handleInputChange(selectedPlan, 'price', e.target.value)
                      }
                      className="pl-7 block w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration
                  </label>
                  <select
                    value={formData[selectedPlan].deliveryTime}
                    onChange={(e) =>
                      handleInputChange(
                        selectedPlan,
                        'deliveryTime',
                        e.target.value,
                      )
                    }
                    className="block w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {[1, 7, 14, 30, 60, 90, 180, 365].map((day) => (
                      <option key={day} value={day.toString()}>
                        {day === 1
                          ? '1 Day'
                          : day === 7
                            ? '1 Week'
                            : day === 14
                              ? '2 Weeks'
                              : day === 30
                                ? '1 Month'
                                : day === 60
                                  ? '2 Months'
                                  : day === 90
                                    ? '3 Months'
                                    : day === 180
                                      ? '6 Months'
                                      : '1 Year'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData[selectedPlan].description}
                onChange={(e) =>
                  handleInputChange(selectedPlan, 'description', e.target.value)
                }
                className="block w-full py-2 px-3 border border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder={`Describe what's included in the ${selectedPlan} plan`}
                rows={3}
              />
            </div>

            {/* <div className="pt-4 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save {selectedPlan} Plan
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPlan;
