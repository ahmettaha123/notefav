'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNotificationsFromStorage } from '../../lib/notifications';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification, 
  clearAllNotifications,
  createTestNotifications
} from '@/lib/notifications';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = () => {
    setLoading(true);
    // İlk yükleme için test bildirimleri oluştur
    let notifs = getNotificationsFromStorage();
    if (notifs.length === 0) {
      notifs = createTestNotifications();
    }
    setNotifications(notifs);
    setLoading(false);
  };

  const handleMarkAsRead = (id) => {
    const updatedNotifications = markNotificationAsRead(id);
    setNotifications(updatedNotifications);
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = markAllNotificationsAsRead();
    setNotifications(updatedNotifications);
  };

  const handleDelete = (id) => {
    const updatedNotifications = deleteNotification(id);
    setNotifications(updatedNotifications);
  };

  const handleClearAll = () => {
    clearAllNotifications();
    setNotifications([]);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.data && notification.data.url) {
      router.push(notification.data.url);
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-blue-500';
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: tr });
    } catch (error) {
      return 'bilinmeyen zaman';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-orange-500">Bildirimler</h1>
        <div className="flex space-x-2">
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllAsRead} 
              className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition"
            >
              Tümünü Okundu İşaretle
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={handleClearAll} 
              className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Tümünü Temizle
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Bildiriminiz yok</h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Yeni bildirimler burada görünecek.</p>
          <button 
            onClick={createTestNotifications} 
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition"
          >
            Test Bildirimleri Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <li key={notification.id} className={`relative ${!notification.read ? 'bg-orange-50 dark:bg-gray-700/40' : ''}`}>
                <div 
                  className="px-4 py-4 sm:px-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/60 transition"
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 h-3 w-3 rounded-full mt-1.5 ${getPriorityClass(notification.priority)}`}></div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(notification.timestamp)}
                          </p>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </div>
                {!notification.read && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1">
                    <span className="h-2 w-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-gray-800"></span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage; 