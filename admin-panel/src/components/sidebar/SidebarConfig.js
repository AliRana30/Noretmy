import {
  Home,
  Package,
  Calendar,
  FolderOpen,
  Settings,
  Users,
  ShoppingBag,
  Briefcase,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  Shield,
  FileCheck,
  Bell,
  Globe,
  LogOut,
  User,
} from 'lucide-react';

export const SIDEBAR_NAV_LIST = [
  {
    id: '/',
    label: 'Dashboard',
    icon: Home,
    allowedRoles: ['admin', 'user'],
    translationKey: 'dashboard'
  },
  {
    id: '/admin/users',
    label: 'Users',
    icon: Users,
    allowedRoles: ['admin'],
    requiredPermission: 'user_management',
    translationKey: 'users'
  },
  {
    id: '/admin/orders',
    label: 'Orders',
    icon: ShoppingBag,
    allowedRoles: ['admin'],
    requiredPermission: 'order_management',
    translationKey: 'orders'
  },
  {
    id: '/admin/jobs',
    label: 'Jobs',
    icon: Briefcase,
    allowedRoles: ['admin'],
    requiredPermission: 'content_moderation',
    translationKey: 'adminJobs'
  },
  {
    id: '/admin/sensitive-messages',
    label: 'Sensitive Messages',
    icon: AlertTriangle,
    allowedRoles: ['admin'],
    requiredPermission: 'content_moderation',
    translationKey: 'adminSensitiveMessages'
  },
  {
    id: '/notifications',
    label: 'Notifications',
    icon: Bell,
    allowedRoles: ['admin', 'user'],
    translationKey: 'notifications'
  },
  {
    id: '/admin/documents',
    label: 'Document Verification',
    icon: FileCheck,
    allowedRoles: ['admin'],
    requiredPermission: 'user_management',
    translationKey: 'adminDocuments'
  },
  {
    id: '/admin/withdrawals',
    label: 'Withdrawal Requests',
    icon: DollarSign,
    allowedRoles: ['admin'],
    requiredPermission: 'payment_management',
    translationKey: 'adminWithdrawals'
  },
];

export const SIDEBAR_SERVICE_ITEMS = [
  {
    id: 'system-health',
    label: 'System Health',
    icon: Settings,
    translationKey: 'systemHealth'
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: FolderOpen,
    translationKey: 'logs'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    translationKey: 'settings'
  },
];

export const SIDEBAR_USER_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    translationKey: 'profile'
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
    translationKey: 'logout'
  },
];
