import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';
import { notificationAPI } from '../services/api';
import { toast } from 'react-hot-toast';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket, isConnected, emitEvent } = useSocket();

  // Load initial notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Setup socket listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount(prev => prev + 1);
        
        // Show toast for important notifications
        if (notification.priority === 'high') {
          toast(notification.message, {
            icon: '🔔',
            duration: 5000,
          });
        }
      }
    };

    const handleNotificationUpdate = (updatedNotification) => {
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === updatedNotification._id ? updatedNotification : notif
        )
      );
      
      if (updatedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    const handleNotificationDelete = (deletedId) => {
      setNotifications(prev => prev.filter(notif => notif._id !== deletedId));
      // We need to check if the deleted notification was unread
      const deletedNotif = notifications.find(n => n._id === deletedId);
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    };

    // Listen for events
    socket.on('notification:new', handleNewNotification);
    socket.on('notification:update', handleNotificationUpdate);
    socket.on('notification:delete', handleNotificationDelete);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:update', handleNotificationUpdate);
      socket.off('notification:delete', handleNotificationDelete);
    };
  }, [socket, isConnected, notifications]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await notificationAPI.getNotifications();
      // API returns data.data as array and data.unreadCount at top level
      const notificationsData = response.data?.data || [];
      const unreadCountData = response.data?.unreadCount || 0;
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
      
      console.log('✅ Notifications loaded:', {
        count: notificationsData.length,
        unreadCount: unreadCountData
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications');
      console.error('❌ Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      
      // Optimistic update
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Emit socket event
      if (socket && isConnected) {
        socket.emit('notification:read', { notificationId });
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
      // Revert optimistic update
      fetchNotifications();
    }
  }, [socket, isConnected, fetchNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationAPI.markAllAsRead();
      
      // Optimistic update
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
      
      setUnreadCount(0);
      
      // Emit socket event
      if (socket && isConnected) {
        socket.emit('notification:read-all');
      }
      
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      fetchNotifications();
    }
  }, [socket, isConnected, fetchNotifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      
      // Optimistic update
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      
      if (deletedNotif && !deletedNotif.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      // Emit socket event
      if (socket && isConnected) {
        socket.emit('notification:delete', { notificationId });
      }
      
      toast.success('Notification deleted');
    } catch (err) {
      console.error('Error deleting notification:', err);
      fetchNotifications();
    }
  }, [socket, isConnected, notifications, fetchNotifications]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      // Get all notification IDs
      const notificationIds = notifications.map(n => n._id);
      
      // Delete in batches to avoid payload size issues
      for (const id of notificationIds) {
        await notificationAPI.deleteNotification(id);
      }
      
      // Clear local state
      setNotifications([]);
      setUnreadCount(0);
      
      // Emit socket event
      if (socket && isConnected) {
        socket.emit('notification:delete-all');
      }
      
      toast.success('All notifications deleted');
    } catch (err) {
      console.error('Error deleting all notifications:', err);
      fetchNotifications();
    }
  }, [socket, isConnected, notifications, fetchNotifications]);

  // Send notification (admin only)
  const sendNotification = useCallback(async (notificationData) => {
    try {
      const response = await emitEvent('notification:send', notificationData);
      return response;
    } catch (err) {
      console.error('Error sending notification:', err);
      throw err;
    }
  }, [emitEvent]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type) => {
    return notifications.filter(notif => notif.type === type);
  }, [notifications]);

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notif => !notif.read);
  }, [notifications]);

  // Get read notifications
  const getReadNotifications = useCallback(() => {
    return notifications.filter(notif => notif.read);
  }, [notifications]);

  // Get notifications by priority
  const getNotificationsByPriority = useCallback((priority) => {
    return notifications.filter(notif => notif.priority === priority);
  }, [notifications]);

  // Subscribe to notification updates for specific report
  const subscribeToReportUpdates = useCallback((reportId) => {
    if (!socket || !isConnected) return;
    
    socket.emit('notification:subscribe', { 
      type: 'report_updates', 
      targetId: reportId 
    });
    
    return () => {
      socket.emit('notification:unsubscribe', { 
        type: 'report_updates', 
        targetId: reportId 
      });
    };
  }, [socket, isConnected]);

  return {
    // State
    notifications,
    unreadCount,
    loading,
    error,
    
    // Methods
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    sendNotification,
    subscribeToReportUpdates,
    
    // Filter methods
    getNotificationsByType,
    getUnreadNotifications,
    getReadNotifications,
    getNotificationsByPriority,
    
    // Utility
    clearError: () => setError(null),
    refresh: fetchNotifications,
  };
};