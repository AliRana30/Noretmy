/**
 * Promotion Plans - Canonical Constants
 * Single source of truth for all promotion plan details.
 * DO NOT hardcode prices, priorities, or durations elsewhere.
 */

const PROMOTION_PLANS = {
  basic: {
    key: 'basic',
    name: 'Basic Boost',
    price: 40,
    priority: 20,
    durationDays: 30,
    description: 'Get your gig noticed in category searches',
    features: [
      'Featured in category search',
      'Basic analytics',
      'Low visibility boost'
    ]
  },
  standard: {
    key: 'standard',
    name: 'Standard Promotion',
    price: 50,
    priority: 40,
    durationDays: 30,
    description: 'Stand out with enhanced visibility',
    features: [
      'Featured in category search',
      'Top results in category',
      'Performance tracking',
      'Medium visibility boost'
    ]
  },
  premium: {
    key: 'premium',
    name: 'Premium Spotlight',
    price: 60,
    priority: 70,
    durationDays: 30,
    description: 'Maximum exposure with homepage placement',
    features: [
      'Homepage featuring',
      'Category top placement',
      'Advanced visibility',
      'Priority support',
      'High visibility boost'
    ]
  },
  ultimate: {
    key: 'ultimate',
    name: 'Ultimate Exposure',
    price: 70,
    priority: 100,
    durationDays: 30,
    description: 'Dominate all searches and get featured everywhere',
    features: [
      'Front page spotlight',
      'Top of all relevant searches',
      'Featured in newsletter',
      'Priority customer support',
      'Maximum visibility boost'
    ]
  }
};

const getPlan = (planKey) => PROMOTION_PLANS[planKey] || null;

const PLAN_KEYS = Object.keys(PROMOTION_PLANS);

const isValidPlanKey = (key) => PLAN_KEYS.includes(key);

module.exports = {
  PROMOTION_PLANS,
  getPlan,
  PLAN_KEYS,
  isValidPlanKey
};
