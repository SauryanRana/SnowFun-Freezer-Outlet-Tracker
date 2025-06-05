/**
 * Notification Context for Snowfun Nepal application
 * 
 * This context provides notification management across the application:
 * - In-app notifications (toast/alert messages)
 * - Push notifications (browser/mobile)
 * - SMS reminders for PSRs
 * - Visit reminders and pending visit alerts
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import api from '@/lib/api';

// Create the notification context
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  sendNotification: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
  registerForPushNotifications: async () => {},
  unregisterFromPushNotifications: async () => {},
  toggleSmsNotifications: async () => {},
  isSmsEnabled: false,
  isPushEnabled: false,
  isLoading: false,
  error: null,
});

/**
 * Notification Provider Component
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSmsEnabled, setIsSmsEnabled] = useState(false);
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [pushSubscription, setPushSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  /**
   * Check if push notifications are supported by the browser
   * @returns {boolean} Whether push notifications are supported
   */
  const isPushNotificationSupported = () => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  /**
   * Fetch user notifications from the API
   */
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setIsLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data);
      
      // Calculate unread count
      const unread = response.data.filter(notification => !notification.read).length;
      setUnreadCount(unread);
      
      // Get notification preferences
      const prefsResponse = await api.get('/notifications/preferences');
      setIsSmsEnabled(prefsResponse.data.smsEnabled);
      setIsPushEnabled(prefsResponse.data.pushEnabled);
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Fetch notifications on auth change or refresh trigger
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    } else {
      // Reset state when logged out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchNotifications, refreshTrigger]);

  /**
   * Set up periodic checking for new notifications
   */
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check for new notifications every 2 minutes
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 2 * 60 * 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchNotifications]);

  /**
   * Register for browser push notifications
   * @returns {Promise<boolean>} Success status
   */
  const registerForPushNotifications = async () => {
    if (!isPushNotificationSupported()) {
      toast.error('Push notifications are not supported by your browser');
      return false;
    }

    try {
      setIsLoading(true);
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Permission for notifications was denied');
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      });

      // Save subscription to server
      await api.post('/notifications/register-push', {
        subscription: JSON.stringify(subscription)
      });

      setPushSubscription(subscription);
      setIsPushEnabled(true);
      toast.success('Push notifications enabled successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to register for push notifications:', error);
      toast.error('Failed to enable push notifications');
      setError('Failed to enable push notifications. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Unregister from push notifications
   * @returns {Promise<boolean>} Success status
   */
  const unregisterFromPushNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Unsubscribe from push notifications
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
      }

      // Unregister from server
      await api.post('/notifications/unregister-push');

      setPushSubscription(null);
      setIsPushEnabled(false);
      toast.success('Push notifications disabled');
      
      return true;
    } catch (error) {
      console.error('Failed to unregister from push notifications:', error);
      toast.error('Failed to disable push notifications');
      setError('Failed to disable push notifications. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Toggle SMS notifications
   * @param {boolean} enabled - Whether to enable or disable SMS notifications
   * @returns {Promise<boolean>} Success status
   */
  const toggleSmsNotifications = async (enabled) => {
    try {
      setIsLoading(true);
      
      // Update SMS preference on server
      await api.post('/notifications/preferences', {
        smsEnabled: enabled
      });

      setIsSmsEnabled(enabled);
      
      toast.success(enabled ? 
        'SMS notifications enabled' : 
        'SMS notifications disabled'
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update SMS notification preference:', error);
      toast.error('Failed to update notification preferences');
      setError('Failed to update notification preferences. Please try again later.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send a notification to a user or group of users
   * @param {Object} notificationData - Notification data
   * @returns {Promise<Object>} Created notification
   */
  const sendNotification = async (notificationData) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/notifications', notificationData);
      
      // Refresh notifications
      setRefreshTrigger(prev => prev + 1);
      
      return response.data;
    } catch (error) {
      console.error('Failed to send notification:', error);
      setError('Failed to send notification. Please try again later.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark a notification as read
   * @param {string} notificationId - ID of the notification to mark as read
   * @returns {Promise<boolean>} Success status
   */
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  };

  /**
   * Mark all notifications as read
   * @returns {Promise<boolean>} Success status
   */
  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      setUnreadCount(0);
      
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  };

  /**
   * Delete a notification
   * @param {string} notificationId - ID of the notification to delete
   * @returns {Promise<boolean>} Success status
   */
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Update unread count if needed
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  };

  /**
   * Check for pending visits and show reminders for PSRs
   */
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'psr') return;

    const checkPendingVisits = async () => {
      try {
        const response = await api.get('/visits/pending');
        const pendingCount = response.data.count;
        
        if (pendingCount > 0) {
          // Show in-app notification
          toast(
            `You have ${pendingCount} pending shop ${pendingCount === 1 ? 'visit' : 'visits'} today`,
            {
              icon: '🔔',
              duration: 5000,
              style: {
                border: '1px solid #22c55e',
                padding: '16px',
                color: '#14532d',
              },
              onClick: () => router.push('/psr/shops')
            }
          );
        }
      } catch (error) {
        console.error('Failed to check pending visits:', error);
      }
    };

    // Check once on mount
    checkPendingVisits();
    
    // Then check every 3 hours
    const intervalId = setInterval(checkPendingVisits, 3 * 60 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user, router]);

  /**
   * Helper function to convert base64 string to Uint8Array
   * (required for push notification subscription)
   */
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    sendNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    registerForPushNotifications,
    unregisterFromPushNotifications,
    toggleSmsNotifications,
    isSmsEnabled,
    isPushEnabled,
    isLoading,
    error,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Custom hook to use the notification context
 * @returns {Object} Notification context value
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  
  return context;
};

export default NotificationContext;
