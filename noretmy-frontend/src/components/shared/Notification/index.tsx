// components/Notification.tsx
import React from 'react';

interface NotificationProps {
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

const Notification: React.FC<NotificationProps> = ({
  title,
  description,
  timestamp,
  isRead,
}) => {
  return (
    <div className={`p-4 border-b ${isRead ? 'bg-white' : 'bg-gray-100'}`}>
      <h2 className="font-semibold">{title}</h2>
      <p className="text-gray-600">{description}</p>
      <span className="text-sm text-gray-500">{timestamp}</span>
    </div>
  );
};

export default Notification;
