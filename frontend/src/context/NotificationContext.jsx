// context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSocket } from "../hooks/useSocket";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ------------------------------
  // 🔔 LISTEN TO SOCKET EVENTS
  // ------------------------------
  useEffect(() => {
    if (!socket || !isConnected) return;

    console.log("📡 Notification socket connected.");

    // 🔥 Receive new notification
    socket.on("notification:new", (notif) => {
      console.log("📨 New notification:", notif);

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Toast for high priority notifications
      if (notif.priority === "high") {
        toast(notif.message, {
          icon: "🔔",
          duration: 4000,
        });
      }
    });

    // 🔥 Receive broadcast notifications
    socket.on("notification:broadcast", (notif) => {
      console.log("📢 Broadcast:", notif);

      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);

      toast.success(notif.message, { icon: "📢" });
    });

    // 🔥 Notification marked as read
    socket.on("notification:read", ({ notificationId }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    });

    return () => {
      socket.off("notification:new");
      socket.off("notification:broadcast");
      socket.off("notification:read");
    };
  }, [socket, isConnected]);

  // ------------------------------
  // 🔵 MARK SINGLE NOTIFICATION AS READ
  // ------------------------------
  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );

    setUnreadCount((prev) => Math.max(prev - 1, 0));

    socket?.emit("notifications:markOne", { notificationId: id });
  };

  // ------------------------------
  // 🔵 MARK ALL NOTIFICATIONS AS READ
  // ------------------------------
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    socket?.emit("notifications:markAll");
  };

  // ------------------------------
  // 🔴 DELETE NOTIFICATION
  // ------------------------------
  const deleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    socket?.emit("notifications:delete", { notificationId: id });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
