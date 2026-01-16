'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, CheckCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import moment from 'moment';

const NotificationBell: React.FC = () => {
    const {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    const handleNotificationClick = (notification: any) => {
        if (!notification.isRead) {
            markAsRead(notification._id);
        }
        if (notification.link) {
            router.push(notification.link);
            setIsOpen(false);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'order': return '📦';
            case 'payment': return '💰';
            case 'message': return '💬';
            case 'warning': return '⚠️';
            case 'success': return '✅';
            case 'alert': return '🚨';
            default: return '🔔';
        }
    };

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                onClick={handleBellClick}
                style={{
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '9999px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                aria-label="Notifications"
            >
                <Bell style={{ width: '24px', height: '24px', color: '#374151' }} />
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        backgroundColor: '#f97316',
                        color: '#fff',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        borderRadius: '9999px',
                        minWidth: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 6px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '12px',
                    width: '384px',
                    maxWidth: 'calc(100vw - 32px)',
                    maxHeight: '500px',
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    border: '1px solid #f3f4f6',
                    overflow: 'hidden',
                    zIndex: 90
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '16px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(to right, #fff7ed, #fff)'
                    }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>Notifications</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    style={{
                                        fontSize: '12px',
                                        color: '#ea580c',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}
                                >
                                    <CheckCheck style={{ width: '12px', height: '12px' }} />
                                    Mark all read
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    padding: '4px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '9999px',
                                    cursor: 'pointer'
                                }}
                            >
                                <X style={{ width: '16px', height: '16px', color: '#6b7280' }} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding: '48px', textAlign: 'center' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '2px solid #f97316',
                                    borderTopColor: 'transparent',
                                    borderRadius: '9999px',
                                    margin: '0 auto',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                <p style={{ marginTop: '16px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    backgroundColor: '#fff7ed',
                                    borderRadius: '9999px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 16px'
                                }}>
                                    <Bell style={{ width: '32px', height: '32px', color: '#fb923c' }} />
                                </div>
                                <p style={{ fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>No notifications yet</p>
                                <p style={{ fontSize: '14px', marginTop: '4px', color: '#6b7280' }}>We'll notify you when something happens</p>
                            </div>
                        ) : (
                            <div>
                                {notifications.slice(0, 10).map((notification) => (
                                    <div
                                        key={notification._id}
                                        onClick={() => handleNotificationClick(notification)}
                                        style={{
                                            padding: '16px',
                                            cursor: 'pointer',
                                            backgroundColor: notification.isRead ? '#fff' : '#fff7ed',
                                            borderBottom: '1px solid #f9fafb',
                                            transition: 'background-color 0.2s',
                                            position: 'relative'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? '#f9fafb' : '#ffedd5'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = notification.isRead ? '#fff' : '#fff7ed'}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                            <span style={{
                                                fontSize: '20px',
                                                flexShrink: 0,
                                                backgroundColor: '#fff',
                                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '9999px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #f9fafb'
                                            }}>
                                                {getNotificationIcon(notification.type)}
                                            </span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                    {notification.title && (
                                                        <p style={{
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            color: '#000',
                                                            margin: 0,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>
                                                            {notification.title}
                                                        </p>
                                                    )}
                                                    <span style={{
                                                        fontSize: '10px',
                                                        color: '#9ca3af',
                                                        whiteSpace: 'nowrap',
                                                        marginLeft: '8px'
                                                    }}>
                                                        {moment(notification.createdAt).fromNow(true)}
                                                    </span>
                                                </div>
                                                <p style={{
                                                    fontSize: '14px',
                                                    lineHeight: '1.4',
                                                    color: '#4b5563',
                                                    margin: 0,
                                                    overflow: 'hidden',
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical'
                                                }}>
                                                    {notification.message}
                                                </p>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                {!notification.isRead && (
                                                    <span style={{
                                                        width: '8px',
                                                        height: '8px',
                                                        backgroundColor: '#f97316',
                                                        borderRadius: '9999px',
                                                        boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.2)'
                                                    }}></span>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteNotification(notification._id);
                                                    }}
                                                    style={{
                                                        padding: '6px',
                                                        backgroundColor: 'transparent',
                                                        border: 'none',
                                                        borderRadius: '9999px',
                                                        cursor: 'pointer',
                                                        opacity: 0,
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    className="delete-btn"
                                                    title="Delete"
                                                >
                                                    <Trash2 style={{ width: '14px', height: '14px', color: '#ef4444' }} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div style={{
                            padding: '12px',
                            borderTop: '1px solid #f3f4f6',
                            backgroundColor: '#fafafa'
                        }}>
                            <button
                                onClick={() => {
                                    router.push('/notifications');
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: '#fff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '12px',
                                    textAlign: 'center',
                                    fontSize: '14px',
                                    color: '#374151',
                                    fontWeight: '600',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.color = '#ea580c';
                                    e.currentTarget.style.borderColor = '#fed7aa';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.color = '#374151';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                View all notification history
                            </button>
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .delete-btn:hover {
                    opacity: 1 !important;
                    background-color: #fef2f2 !important;
                }
                [style*="cursor: pointer"]:hover .delete-btn {
                    opacity: 1 !important;
                }
            `}</style>
        </div>
    );
};

export default NotificationBell;
