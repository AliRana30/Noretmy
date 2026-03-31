import React from 'react';
import { Zap, Star, TrendingUp } from 'lucide-react';

interface PromotedBadgeProps {
  promotedBadge?: {
    tier: 'ultimate' | 'premium' | 'standard' | 'basic';
    label: string;
  } | null;
  isPromoted?: boolean;
  className?: string;
}

/**
 * Component to display a promoted/sponsored badge on gigs
 * Shows different badges based on promotion tier
 */
export const PromotedBadge: React.FC<PromotedBadgeProps> = ({
  promotedBadge,
  isPromoted,
  className = ''
}) => {
  if (!promotedBadge && !isPromoted) {
    return null;
  }

  const getTierStyles = () => {
    switch (promotedBadge?.tier) {
      case 'ultimate':
        return {
          bg: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          textColor: '#000',
          icon: <Zap className="w-3 h-3" />
        };
      case 'premium':
        return {
          bg: 'linear-gradient(135deg, #FF9500 0%, #FF6B00 100%)',
          textColor: '#fff',
          icon: <Star className="w-3 h-3 fill-white" />
        };
      case 'standard':
        return {
          bg: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
          textColor: '#fff',
          icon: <TrendingUp className="w-3 h-3" />
        };
      case 'basic':
        return {
          bg: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          textColor: '#fff',
          icon: <TrendingUp className="w-3 h-3" />
        };
      default:
        return {
          bg: 'bg-orange-500',
          textColor: '#fff',
          icon: <Zap className="w-3 h-3" />
        };
    }
  };

  const styles = getTierStyles();

  return (
    <div
      className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm ${className}`}
      style={{
        background: styles.bg,
        color: styles.textColor
      }}
      title={promotedBadge?.label || 'Promoted'}
    >
      {styles.icon}
      <span>{promotedBadge?.label || 'Promoted'}</span>
    </div>
  );
};

export default PromotedBadge;
