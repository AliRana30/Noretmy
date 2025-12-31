'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Briefcase,
    ShoppingBag,
    DollarSign,
    CreditCard,
    MessageSquare,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    Bell,
    Star,
    FileText,
    TrendingUp,
    Menu,
    X
} from 'lucide-react';

interface SidebarItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
}

interface SidebarSection {
    title?: string;
    items: SidebarItem[];
}

interface DashboardLayoutProps {
    children: React.ReactNode;
    userType?: 'buyer' | 'seller' | 'admin';
}

// Seller sidebar configuration
const sellerSidebar: SidebarSection[] = [
    {
        items: [
            { label: 'Dashboard', href: '/seller-board', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Business',
        items: [
            { label: 'My Gigs', href: '/my-gigs', icon: Briefcase },
            { label: 'Orders', href: '/orders', icon: ShoppingBag },
            { label: 'Earnings', href: '/earnings', icon: DollarSign },
            { label: 'Withdrawals', href: '/withdraw', icon: CreditCard },
        ]
    },
    {
        title: 'Communication',
        items: [
            { label: 'Messages', href: '/inbox', icon: MessageSquare },
            { label: 'Notifications', href: '/notifications', icon: Bell },
        ]
    },
    {
        title: 'Performance',
        items: [
            { label: 'Reviews', href: '/reviews', icon: Star },
            { label: 'Analytics', href: '/analytics', icon: TrendingUp },
        ]
    },
    {
        title: 'Account',
        items: [
            { label: 'Profile', href: '/profile', icon: User },
            { label: 'Settings', href: '/settings', icon: Settings },
        ]
    }
];

// Buyer sidebar configuration
const buyerSidebar: SidebarSection[] = [
    {
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Orders',
        items: [
            { label: 'My Orders', href: '/orders', icon: ShoppingBag },
            { label: 'Custom Requests', href: '/custom-requests', icon: FileText },
        ]
    },
    {
        title: 'Communication',
        items: [
            { label: 'Messages', href: '/inbox', icon: MessageSquare },
            { label: 'Notifications', href: '/notifications', icon: Bell },
        ]
    },
    {
        title: 'Account',
        items: [
            { label: 'Profile', href: '/profile', icon: User },
            { label: 'Favorites', href: '/favorites', icon: Star },
            { label: 'Settings', href: '/settings', icon: Settings },
        ]
    }
];

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    children,
    userType = 'seller'
}) => {
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const sidebar = userType === 'seller' ? sellerSidebar : buyerSidebar;

    const isActive = (href: string) => {
        if (href === '/seller-board' || href === '/dashboard') {
            return pathname === href;
        }
        return pathname?.startsWith(href);
    };

    const SidebarContent = () => (
        <>
            {/* Logo/Brand */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                {!isCollapsed && (
                    <Link href="/" className="text-xl font-bold text-gray-900">
                        Noretmy
                    </Link>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hidden lg:flex"
                >
                    {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4">
                {sidebar.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-2">
                        {section.title && !isCollapsed && (
                            <div className="px-4 py-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {section.title}
                                </span>
                            </div>
                        )}
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg
                    transition-all duration-150
                    ${active
                                            ? 'bg-orange-50 text-orange-700 font-medium'
                                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                        }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                                    title={isCollapsed ? item.label : undefined}
                                >
                                    <Icon
                                        size={20}
                                        className={active ? 'text-orange-600' : 'text-slate-400'}
                                    />
                                    {!isCollapsed && (
                                        <>
                                            <span className="flex-1">{item.label}</span>
                                            {item.badge && (
                                                <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User section */}
            {!isCollapsed && (
                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 cursor-pointer">
                        <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">U</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Username</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{userType}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-16 left-4 z-50">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-white rounded-lg shadow-md border border-gray-200"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Mobile sidebar overlay */}
            {isMobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 h-screen bg-white border-r border-gray-200
          flex flex-col z-50 transition-all duration-300
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
                style={{ paddingTop: '64px' }}
            >
                <SidebarContent />
            </aside>

            {/* Main content */}
            <main
                className={`
          transition-all duration-300 pt-0
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
            >
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default DashboardLayout;
