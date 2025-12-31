import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';

interface FilterModalProps {
  onApply: (filters: {
    minBudget?: number;
    maxBudget?: number;
    deliveryTime?: number;
  }) => void;
  onClose: () => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ onApply, onClose }) => {
  const [minBudget, setMinBudget] = useState<number>();
  const [maxBudget, setMaxBudget] = useState<number>();
  const [deliveryTime, setDeliveryTime] = useState<number>();
  const { t } = useTranslations();

  const handleApply = () => {
    onApply({
      minBudget,
      maxBudget,
      deliveryTime,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('search:filters.modal.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label={t('search:filters.modal.aria.close')}
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Budget Range */}
          <div>
            <h3 className="font-medium mb-2">{t('search:filters.budget.title')}</h3>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={minBudget || ''}
                  onChange={(e) => setMinBudget(Number(e.target.value))}
                  placeholder={t('search:filters.budget.min')}
                  className="w-full p-2 border rounded"
                  aria-label={t('search:filters.budget.aria.minInput')}
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={maxBudget || ''}
                  onChange={(e) => setMaxBudget(Number(e.target.value))}
                  placeholder={t('search:filters.budget.max')}
                  className="w-full p-2 border rounded"
                  aria-label={t('search:filters.budget.aria.maxInput')}
                />
              </div>
            </div>
          </div>

          {/* Delivery Time */}
          <div>
            <h3 className="font-medium mb-2">{t('search:filters.delivery.title')}</h3>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={deliveryTime || ''}
                onChange={(e) => setDeliveryTime(Number(e.target.value))}
                className="w-full p-2 border rounded"
                aria-label={t('search:filters.delivery.aria.input')}
              />
              <span className="text-gray-500">{t('search:filters.delivery.days')}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            {t('search:filters.modal.apply')}
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 py-2 px-4 rounded hover:bg-gray-50"
          >
            {t('search:filters.modal.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
