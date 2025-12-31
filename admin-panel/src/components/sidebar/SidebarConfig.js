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
  },
  {
    id: '/admin/users',
    label: 'Admin Users',
    icon: Users,
    allowedRoles: ['admin'],
    requiredPermission: 'user_management',
  },
  {
    id: '/admin/orders',
    label: 'Admin Orders',
    icon: ShoppingBag,
    allowedRoles: ['admin'],
    requiredPermission: 'order_management',
  },
  {
    id: '/admin/jobs',
    label: 'Admin Jobs',
    icon: Briefcase,
    allowedRoles: ['admin'],
    requiredPermission: 'content_moderation',
  },
  {
    id: '/admin/withdrawals',
    label: 'Admin Withdrawals',
    icon: DollarSign,
    allowedRoles: ['admin'],
    requiredPermission: 'payment_management',
  },
  {
    id: '/admin/sensitive-messages',
    label: 'Admin Sensitive Messages',
    icon: AlertTriangle,
    allowedRoles: ['admin'],
    requiredPermission: 'content_moderation',
  },
  
  {
    id: '/admin/content',
    label: 'Admin Content',
    icon: Shield,
    allowedRoles: ['admin'],
    requiredPermission: 'content_moderation',
  },
  {
    id: '/admin/documents',
    label: 'Admin Documents',
    icon: FileCheck,
    allowedRoles: ['admin'],
    requiredPermission: 'user_management',
  },
  {
    id: '/notifications',
    label: 'Notifications',
    icon: Bell,
    allowedRoles: ['admin', 'user'],
  },
  {
    id: '/document-verify',
    label: 'Document Verification',
    icon: FileCheck,
    allowedRoles: ['admin', 'user'],
  },
  {
    id: '/withdrawl-requests',
    label: 'Payment Withdrawal Approval',
    icon: DollarSign,
    allowedRoles: ['admin', 'user'],
  },
];

export const SIDEBAR_SERVICE_ITEMS = [
  {
    id: 'system-health',
    label: 'System Health',
    icon: Settings,
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: FolderOpen,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
  },
];

export const SIDEBAR_USER_ITEMS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
  },
  {
    id: 'logout',
    label: 'Logout',
    icon: LogOut,
  },
];

