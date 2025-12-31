import React, { useState } from 'react';
import { Filter, Calendar, DollarSign, Package } from 'lucide-react';
import { useTranslations } from '@/hooks/useTranslations';

export type StatusOption = 'All' | 'Created' | 'Pending' | 'Completed' | 'Accepted' | 'Started' | 'Delivered';
export type DateRangeOption = 'last7' | 'last30' | 'last90' | 'custom';
export type PriceRangeOption =
  | 'All'
  | '0-100'
  | '101-500'
  | '501-1000'
  | '1001-5000';
export type OrderTypeOption = 'All' | 'Standard' | 'Milestone';

export interface Filters {
  status: StatusOption;
  dateRange: DateRangeOption;
  customStartDate?: string;
  customEndDate?: string;
  priceRange: PriceRangeOption;
  orderType: OrderTypeOption;
}

interface OrderFiltersProps {
  onApply: (filters: Filters) => void;
}

const OrderFilters: React.FC<OrderFiltersProps> = ({ onApply }) => {
  const { t } = useTranslations();
  const defaultFilters: Filters = {
    status: 'All',
    dateRange: 'last7',
    priceRange: 'All',
    orderType: 'All',
  };

  const [status, setStatus] = useState<StatusOption>(defaultFilters.status);
  const [dateRange, setDateRange] = useState<DateRangeOption>(
    defaultFilters.dateRange,
  );
  const [priceRange, setPriceRange] = useState<PriceRangeOption>(
    defaultFilters.priceRange,
  );
  const [orderType, setOrderType] = useState<OrderTypeOption>(
    defaultFilters.orderType,
  );
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const handleApply = () => {
    onApply({
      status,
      dateRange,
      customStartDate,
      customEndDate,
      priceRange,
      orderType,
    });
  };

  const handleClear = () => {
    setStatus(defaultFilters.status);
    setDateRange(defaultFilters.dateRange);
    setPriceRange(defaultFilters.priceRange);
    setOrderType(defaultFilters.orderType);
    setCustomStartDate('');
    setCustomEndDate('');
    // Also apply the default filters
    onApply(defaultFilters);
  };

  return (
    <div className="w-full p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Filter className="w-4 h-4 text-orange-500 mr-2" />
          <h2 className="text-sm font-medium text-gray-800">{t('list.filter.title', { ns: 'orders', defaultValue: 'Filters' })}</h2>
        </div>
        <div className="text-xs text-gray-500">{t('list.filter.refine', { ns: 'orders', defaultValue: 'Refine your results' })}</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
            {t('details.status.title', { ns: 'orders', defaultValue: 'Status' })}
          </label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusOption)}
              className="w-full appearance-none rounded-lg bg-gray-50 border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Created">Created</option>
              <option value="Pending">Pending</option>
              <option value="Accepted">Accepted</option>
              <option value="Started">Started</option>
              <option value="Delivered">Delivered</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="space-y-1">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
            <Calendar className="w-3 h-3 text-gray-500 mr-1" />
            {t('list.filter.dateRange', { ns: 'orders', defaultValue: 'Date Range' })}
          </label>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
              className="w-full appearance-none rounded-lg bg-gray-50 border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="last90">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {dateRange === 'custom' && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full appearance-none rounded-lg bg-gray-50 border border-gray-200 py-1.5 pl-2 pr-2 text-xs text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="Start"
                />
              </div>
              <div className="relative">
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full appearance-none rounded-lg bg-gray-50 border border-gray-200 py-1.5 pl-2 pr-2 text-xs text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  placeholder="End"
                />
              </div>
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div className="space-y-1">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
            <DollarSign className="w-3 h-3 text-gray-500 mr-1" />
            {t('list.filter.priceRange', { ns: 'orders', defaultValue: 'Price Range' })}
          </label>
          <div className="relative">
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as PriceRangeOption)}
              className="w-full appearance-none rounded-lg bg-gray-50 border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="All">All Prices</option>
              <option value="0-100">$0 - $100</option>
              <option value="101-500">$101 - $500</option>
              <option value="501-1000">$501 - $1000</option>
              <option value="1001-5000">$1001 - $5000</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Order Type Filter */}
        <div className="space-y-1">
          <label className="flex items-center text-xs font-medium text-gray-700">
            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1.5"></div>
            <Package className="w-3 h-3 text-gray-500 mr-1" />
            {t('list.filter.orderType', { ns: 'orders', defaultValue: 'Order Type' })}
          </label>
          <div className="relative">
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderTypeOption)}
              className="w-full appearance-none rounded-lg bg-gray-50 border border-gray-200 py-2 pl-3 pr-8 text-sm text-gray-800 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="Standard">Standard</option>
              <option value="Milestone">Milestone</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end space-x-2">
        <button
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all"
        >
          Clear All
        </button>
        <button
          onClick={handleApply}
          className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all shadow-sm"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

export default OrderFilters;