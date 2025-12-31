'use client';

import React from 'react';

/**
 * Enterprise-grade Skeleton Loader System
 * Consistent, reusable skeleton components for all loading states
 */

interface SkeletonProps {
    className?: string;
    style?: React.CSSProperties;
}

// Base skeleton component
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={style}
        />
    );
};

// Text skeleton
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 1,
    className = ''
}) => {
    return (
        <div className={className}>
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className="skeleton h-4 mb-2 last:mb-0"
                    style={{ width: i === lines - 1 && lines > 1 ? '60%' : '100%' }}
                />
            ))}
        </div>
    );
};

// Avatar skeleton
export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl' }> = ({
    size = 'md'
}) => {
    const sizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    return <div className={`skeleton rounded-full ${sizes[size]}`} />;
};

// Button skeleton
export const SkeletonButton: React.FC<{ size?: 'sm' | 'md' | 'lg'; width?: string }> = ({
    size = 'md',
    width = '120px'
}) => {
    const heights = {
        sm: 'h-8',
        md: 'h-10',
        lg: 'h-12'
    };

    return <div className={`skeleton rounded-md ${heights[size]}`} style={{ width }} />;
};

// Image skeleton
export const SkeletonImage: React.FC<{
    aspectRatio?: string;
    className?: string
}> = ({ aspectRatio = '16/9', className = '' }) => {
    return (
        <div
            className={`skeleton rounded-lg w-full ${className}`}
            style={{ aspectRatio }}
        />
    );
};

// Card skeleton (for gig cards, etc.)
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`bg-white border border-gray-200 rounded-xl overflow-hidden ${className}`}>
            <SkeletonImage aspectRatio="4/3" className="rounded-none" />
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <SkeletonAvatar size="sm" />
                    <div className="flex-1">
                        <div className="skeleton h-3 w-24 mb-1" />
                        <div className="skeleton h-2 w-16" />
                    </div>
                </div>
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-4 w-3/4 mb-4" />
                <div className="flex items-center justify-between">
                    <div className="skeleton h-3 w-20" />
                    <div className="skeleton h-5 w-16" />
                </div>
            </div>
        </div>
    );
};

// Gig card skeleton grid
export const SkeletonGigGrid: React.FC<{ count?: number }> = ({ count = 8 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
};

// Table row skeleton
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <div className="skeleton h-4" style={{ width: `${60 + Math.random() * 40}%` }} />
                </td>
            ))}
        </tr>
    );
};

// Table skeleton
export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({
    rows = 5,
    columns = 5
}) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="p-4 text-left">
                                <div className="skeleton h-3 w-20" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <SkeletonTableRow key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Stats card skeleton
export const SkeletonStatsCard: React.FC = () => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="skeleton h-3 w-24 mb-2" />
            <div className="skeleton h-8 w-20 mb-2" />
            <div className="skeleton h-2 w-16" />
        </div>
    );
};

// Stats grid skeleton
export const SkeletonStatsGrid: React.FC<{ count?: number }> = ({ count = 4 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonStatsCard key={i} />
            ))}
        </div>
    );
};

// Chat message skeleton
export const SkeletonChatMessage: React.FC<{ isOwn?: boolean }> = ({ isOwn = false }) => {
    return (
        <div className={`flex gap-3 mb-4 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <SkeletonAvatar size="sm" />
            <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                <div
                    className={`skeleton rounded-2xl p-3 ${isOwn ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                    style={{ width: `${150 + Math.random() * 150}px`, height: '48px' }}
                />
                <div className="skeleton h-2 w-12 mt-1" />
            </div>
        </div>
    );
};

// Chat list item skeleton
export const SkeletonChatListItem: React.FC = () => {
    return (
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <SkeletonAvatar size="md" />
            <div className="flex-1">
                <div className="skeleton h-4 w-32 mb-1" />
                <div className="skeleton h-3 w-48" />
            </div>
            <div className="skeleton h-2 w-12" />
        </div>
    );
};

// Chat skeleton
export const SkeletonChat: React.FC = () => {
    return (
        <div className="flex h-[calc(100vh-120px)] bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Chat list */}
            <div className="w-80 border-r border-gray-200 flex-shrink-0">
                <div className="p-4 border-b border-gray-200">
                    <div className="skeleton h-10 w-full rounded-lg" />
                </div>
                <div>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonChatListItem key={i} />
                    ))}
                </div>
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col">
                {/* Chat header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                    <SkeletonAvatar size="md" />
                    <div>
                        <div className="skeleton h-4 w-32 mb-1" />
                        <div className="skeleton h-2 w-20" />
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto">
                    <SkeletonChatMessage />
                    <SkeletonChatMessage isOwn />
                    <SkeletonChatMessage />
                    <SkeletonChatMessage isOwn />
                    <SkeletonChatMessage />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                    <div className="skeleton h-12 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
};

// Profile header skeleton
export const SkeletonProfileHeader: React.FC = () => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start gap-6">
                <SkeletonAvatar size="xl" />
                <div className="flex-1">
                    <div className="skeleton h-6 w-48 mb-2" />
                    <div className="skeleton h-4 w-32 mb-3" />
                    <div className="skeleton h-3 w-full max-w-md mb-2" />
                    <div className="skeleton h-3 w-3/4 max-w-md" />
                </div>
                <SkeletonButton />
            </div>
        </div>
    );
};

// Single gig page skeleton
export const SkeletonGigDetail: React.FC = () => {
    return (
        <div className="max-w-6xl mx-auto py-8 px-4">
            {/* Breadcrumb */}
            <div className="flex gap-2 mb-6">
                <div className="skeleton h-4 w-16" />
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-4" />
                <div className="skeleton h-4 w-32" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Title */}
                    <div className="skeleton h-8 w-full" />
                    <div className="skeleton h-8 w-3/4" />

                    {/* Seller info */}
                    <div className="flex items-center gap-4">
                        <SkeletonAvatar size="lg" />
                        <div>
                            <div className="skeleton h-4 w-32 mb-1" />
                            <div className="skeleton h-3 w-24" />
                        </div>
                    </div>

                    {/* Gallery */}
                    <SkeletonImage aspectRatio="16/9" />

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="skeleton h-6 w-32 mb-4" />
                        <SkeletonText lines={5} />
                    </div>
                </div>

                {/* Pricing sidebar */}
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-24">
                        <div className="flex gap-2 mb-4">
                            <div className="skeleton h-10 flex-1 rounded-md" />
                            <div className="skeleton h-10 flex-1 rounded-md" />
                            <div className="skeleton h-10 flex-1 rounded-md" />
                        </div>
                        <div className="skeleton h-6 w-24 mb-4" />
                        <SkeletonText lines={3} />
                        <div className="skeleton h-12 w-full rounded-lg mt-6" />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Search results skeleton
export const SkeletonSearchResults: React.FC = () => {
    return (
        <div>
            {/* Results count */}
            <div className="skeleton h-5 w-48 mb-6" />

            {/* Grid */}
            <SkeletonGigGrid count={12} />
        </div>
    );
};

// Dashboard skeleton
export const SkeletonDashboard: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Stats */}
            <SkeletonStatsGrid count={4} />

            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="skeleton h-5 w-32 mb-4" />
                    <div className="space-y-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <SkeletonAvatar size="sm" />
                                <div className="flex-1">
                                    <div className="skeleton h-4 w-full mb-1" />
                                    <div className="skeleton h-3 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6">
                    <div className="skeleton h-5 w-32 mb-4" />
                    <div className="skeleton h-48 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
};

// Page loading wrapper - keeps layout visible
export const PageSkeleton: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="animate-pulse">
            {children}
        </div>
    );
};

// Order card skeleton
export const SkeletonOrderCard: React.FC = () => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                    <SkeletonImage aspectRatio="1/1" className="w-20 h-20" />
                    <div>
                        <div className="skeleton h-5 w-48 mb-2" />
                        <div className="skeleton h-4 w-32 mb-1" />
                        <div className="skeleton h-3 w-24" />
                    </div>
                </div>
                <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="skeleton h-4 w-24" />
                <div className="flex gap-2">
                    <SkeletonButton size="sm" width="80px" />
                    <SkeletonButton size="sm" width="100px" />
                </div>
            </div>
        </div>
    );
};

// Orders list skeleton
export const SkeletonOrdersList: React.FC<{ count?: number }> = ({ count = 5 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonOrderCard key={i} />
            ))}
        </div>
    );
};

// Notification skeleton
export const SkeletonNotification: React.FC = () => {
    return (
        <div className="flex items-start gap-3 p-4 border-b border-gray-100">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1">
                <div className="skeleton h-4 w-full mb-2" />
                <div className="skeleton h-3 w-3/4 mb-1" />
                <div className="skeleton h-2 w-20" />
            </div>
        </div>
    );
};

export default Skeleton;
