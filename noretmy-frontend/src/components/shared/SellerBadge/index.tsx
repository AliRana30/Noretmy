'use client';

import React from 'react';
import { Star, Shield, Clock, CheckCircle, Award, Zap, TrendingUp, Target } from 'lucide-react';

type BadgeLevel = 'new' | 'level_1' | 'level_2' | 'top_rated';

interface SellerBadgeProps {
    level: BadgeLevel;
    label?: string;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    showTooltip?: boolean;
}

const badgeConfig = {
    new: {
        label: 'New Seller',
        emoji: '🆕',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
        borderColor: 'border-orange-300',
        icon: Zap,
        description: 'Just getting started on the platform',
    },
    level_1: {
        label: 'Level 1',
        emoji: '🥉',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
        borderColor: 'border-amber-300',
        icon: Shield,
        description: '10+ orders, 4.7+ rating, 90%+ completion',
    },
    level_2: {
        label: 'Level 2',
        emoji: '🥈',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700',
        borderColor: 'border-slate-400',
        icon: Award,
        description: '50+ orders, 4.8+ rating, 95%+ completion',
    },
    top_rated: {
        label: 'Top Rated',
        emoji: '⭐',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-400',
        icon: Star,
        description: '100+ orders, 4.9+ rating, 98%+ completion',
    },
};

const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
};

/**
 * SellerBadge Component
 * Displays a Fiverr-style seller level badge
 */
const SellerBadge: React.FC<SellerBadgeProps> = ({
    level,
    label,
    showLabel = true,
    size = 'md',
    className = '',
    showTooltip = false,
}) => {
    const config = badgeConfig[level] || badgeConfig.new;
    const IconComponent = config.icon;
    const displayLabel = label || config.label;

    // Don't show badge for new sellers unless explicitly requested
    if (level === 'new' && !showLabel) {
        return null;
    }

    return (
        <span
            className={`
                inline-flex items-center gap-1 font-medium rounded-full border
                ${config.bgColor} ${config.textColor} ${config.borderColor}
                ${sizeClasses[size]}
                ${className}
                transition-all duration-200 hover:shadow-sm cursor-default
            `}
            title={showTooltip ? `${config.label}: ${config.description}` : undefined}
        >
            <IconComponent className={`${iconSizes[size]} ${level === 'top_rated' ? 'fill-yellow-500' : ''}`} />
            {showLabel && <span>{displayLabel}</span>}
        </span>
    );
};

/**
 * TrustScore Component
 * Displays a seller's trust score as a progress indicator
 */
interface TrustScoreProps {
    score: number;
    showLabel?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export const TrustScore: React.FC<TrustScoreProps> = ({
    score,
    showLabel = true,
    size = 'md',
}) => {
    // Determine color based on score
    const getColor = (score: number) => {
        if (score >= 90) return 'bg-orange-500';
        if (score >= 70) return 'bg-yellow-500';
        if (score >= 50) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const barWidth = size === 'sm' ? 'w-12' : size === 'md' ? 'w-16' : 'w-20';
    const barHeight = size === 'sm' ? 'h-1' : size === 'md' ? 'h-1.5' : 'h-2';

    return (
        <div className="flex items-center gap-2">
            <div className={`${barWidth} ${barHeight} bg-gray-200 rounded-full overflow-hidden`}>
                <div
                    className={`${barHeight} ${getColor(score)} transition-all duration-300`}
                    style={{ width: `${score}%` }}
                />
            </div>
            {showLabel && (
                <span className="text-xs text-gray-600 font-medium">{score}%</span>
            )}
        </div>
    );
};

/**
 * ReliabilityIndicators Component
 * Shows on-time delivery, response time, etc.
 */
interface ReliabilityIndicatorsProps {
    onTimeRate?: number;
    responseTime?: string;
    completionRate?: number;
    className?: string;
}

export const ReliabilityIndicators: React.FC<ReliabilityIndicatorsProps> = ({
    onTimeRate,
    responseTime,
    completionRate,
    className = '',
}) => {
    return (
        <div className={`flex flex-wrap gap-3 text-sm text-gray-600 ${className}`}>
            {onTimeRate !== undefined && (
                <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span>{onTimeRate}% On-time</span>
                </div>
            )}
            {responseTime && (
                <div className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span>{responseTime} response</span>
                </div>
            )}
            {completionRate !== undefined && (
                <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-purple-500" />
                    <span>{completionRate}% Completed</span>
                </div>
            )}
        </div>
    );
};

/**
 * AchievementBadge Component
 * Displays milestone achievements
 */
interface AchievementBadgeProps {
    type: string;
    earnedAt?: Date;
}

const achievementConfig: Record<string, { label: string; emoji: string; color: string }> = {
    first_order: { label: 'First Sale', emoji: '🎉', color: 'bg-pink-100 text-pink-700' },
    fast_responder: { label: 'Fast Responder', emoji: '⚡', color: 'bg-blue-100 text-blue-700' },
    perfect_rating: { label: 'Perfect Rating', emoji: '💯', color: 'bg-yellow-100 text-yellow-700' },
    '100_orders': { label: '100 Orders', emoji: '🔥', color: 'bg-orange-100 text-orange-700' },
    super_seller: { label: 'Super Seller', emoji: '🚀', color: 'bg-purple-100 text-purple-700' },
    veteran: { label: 'Veteran', emoji: '👴', color: 'bg-gray-100 text-gray-700' },
    top_earner: { label: 'Top Earner', emoji: '💰', color: 'bg-orange-100 text-orange-700' },
    trending: { label: 'Trending', emoji: '📈', color: 'bg-red-100 text-red-700' },
    client_favorite: { label: 'Client Favorite', emoji: '❤️', color: 'bg-rose-100 text-rose-700' },
};

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({ type }) => {
    const config = achievementConfig[type];
    if (!config) return null;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
            <span>{config.emoji}</span>
            <span>{config.label}</span>
        </span>
    );
};

/**
 * SellerBadgeCard Component
 * Displays a comprehensive badge card with metrics for seller profiles
 */
interface SellerBadgeCardProps {
    level: BadgeLevel;
    trustScore: number;
    metrics: {
        completedOrders: number;
        averageRating: number;
        completionRate: number;
        onTimeDeliveryRate: number;
        responseRate?: number;
    };
    achievements?: Array<{ type: string; earnedAt?: Date }>;
    className?: string;
}

export const SellerBadgeCard: React.FC<SellerBadgeCardProps> = ({
    level,
    trustScore,
    metrics,
    achievements = [],
    className = '',
}) => {
    const config = badgeConfig[level] || badgeConfig.new;

    return (
        <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
            {/* Badge Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${config.bgColor} flex items-center justify-center`}>
                        <span className="text-2xl">{config.emoji}</span>
                    </div>
                    <div>
                        <h3 className={`font-bold ${config.textColor}`}>{config.label}</h3>
                        <p className="text-xs text-gray-500">{config.description}</p>
                    </div>
                </div>
                <TrustScore score={trustScore} size="lg" />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600">{metrics.completedOrders} orders</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-gray-600">{metrics.averageRating.toFixed(1)} rating</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600">{metrics.onTimeDeliveryRate}% on-time</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600">{metrics.completionRate}% complete</span>
                </div>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
                <div>
                    <p className="text-xs text-gray-500 mb-2">Achievements</p>
                    <div className="flex flex-wrap gap-1">
                        {achievements.slice(0, 4).map((achievement, index) => (
                            <AchievementBadge key={index} type={achievement.type} />
                        ))}
                        {achievements.length > 4 && (
                            <span className="text-xs text-gray-400 px-2 py-1">
                                +{achievements.length - 4} more
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * SellerLevelProgress Component
 * Shows progress toward next badge level
 */
interface SellerLevelProgressProps {
    currentLevel: BadgeLevel;
    nextLevel?: {
        target: BadgeLevel;
        label: string;
        requirements: {
            orders: number;
            rating: number;
            completion: number;
            earnings: number;
        };
        progress: {
            orders: number;
            rating: number;
            completion: number;
            earnings: number;
        };
    } | null;
}

export const SellerLevelProgress: React.FC<SellerLevelProgressProps> = ({
    currentLevel,
    nextLevel,
}) => {
    if (!nextLevel) {
        return (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-yellow-800">Top Rated Seller</h4>
                        <p className="text-sm text-yellow-600">You've reached the highest level! 🎉</p>
                    </div>
                </div>
            </div>
        );
    }

    const overallProgress = Math.round(
        (nextLevel.progress.orders + nextLevel.progress.rating +
            nextLevel.progress.completion + nextLevel.progress.earnings) / 4
    );

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h4 className="font-semibold text-gray-800">Progress to {nextLevel.label}</h4>
                    <p className="text-sm text-gray-500">Keep up the great work!</p>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-bold text-orange-500">{overallProgress}%</span>
                    <p className="text-xs text-gray-400">Overall</p>
                </div>
            </div>

            <div className="space-y-3">
                <ProgressItem
                    icon={<CheckCircle className="w-4 h-4" />}
                    label="Completed Orders"
                    current={nextLevel.progress.orders}
                    requirement={nextLevel.requirements.orders}
                />
                <ProgressItem
                    icon={<Star className="w-4 h-4" />}
                    label="Average Rating"
                    current={nextLevel.progress.rating}
                    requirement={nextLevel.requirements.rating}
                />
                <ProgressItem
                    icon={<Target className="w-4 h-4" />}
                    label="Completion Rate"
                    current={nextLevel.progress.completion}
                    requirement={nextLevel.requirements.completion}
                />
                <ProgressItem
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Total Earnings"
                    current={nextLevel.progress.earnings}
                    requirement={nextLevel.requirements.earnings}
                />
            </div>
        </div>
    );
};

const ProgressItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    current: number;
    requirement: number;
}> = ({ icon, label, current, requirement }) => {
    const percentage = Math.min(100, current);
    const isComplete = current >= 100;

    return (
        <div className="flex items-center gap-3">
            <div className={`${isComplete ? 'text-orange-500' : 'text-gray-400'}`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{label}</span>
                    <span className={isComplete ? 'text-orange-600 font-medium' : 'text-gray-500'}>
                        {isComplete ? '✓ Complete' : `${percentage}%`}
                    </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${isComplete ? 'bg-orange-500' : 'bg-orange-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

/**
 * CompactSellerInfo Component
 * For use in search results and listings
 */
interface CompactSellerInfoProps {
    level: BadgeLevel;
    rating: number;
    reviewCount: number;
    onTimeRate?: number;
    className?: string;
}

export const CompactSellerInfo: React.FC<CompactSellerInfoProps> = ({
    level,
    rating,
    reviewCount,
    onTimeRate,
    className = '',
}) => {
    return (
        <div className={`flex items-center gap-2 flex-wrap ${className}`}>
            <SellerBadge level={level} size="sm" showTooltip />
            <div className="flex items-center gap-1 text-sm">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{rating.toFixed(1)}</span>
                <span className="text-gray-400">({reviewCount})</span>
            </div>
            {onTimeRate !== undefined && onTimeRate < 100 && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{onTimeRate}% on-time</span>
                </div>
            )}
        </div>
    );
};

export default SellerBadge;
