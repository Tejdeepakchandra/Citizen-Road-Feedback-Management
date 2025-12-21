export const ROLES = {
  CITIZEN: 'citizen',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const REPORT_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const REPORT_CATEGORIES = [
  { value: 'pothole', label: 'Pothole Repair', icon: '🕳️' },
  { value: 'drainage', label: 'Drainage Issue', icon: '🌊' },
  { value: 'lighting', label: 'Street Lighting', icon: '💡' },
  { value: 'garbage', label: 'Garbage/Sanitation', icon: '🗑️' },
  { value: 'signboard', label: 'Signboard/Signage', icon: '🪧' },
  { value: 'road_markings', label: 'Road Markings', icon: '🛣️' },
  { value: 'sidewalk', label: 'Sidewalk Damage', icon: '🚶' },
  { value: 'other', label: 'Other Issues', icon: '❓' },
];

export const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'warning' },
  { value: 'high', label: 'High', color: 'error' },
];

export const STAFF_CATEGORIES = [
  { value: 'pothole', label: 'Pothole Repair Staff' },
  { value: 'lighting', label: 'Streetlight Staff' },
  { value: 'drainage', label: 'Drainage Staff' },
  { value: 'garbage', label: 'Garbage/Sanitation Staff' },
  { value: 'signboard', label: 'Signboard/Signage Staff' },
];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  REPORTS: {
    BASE: '/reports',
    STATUS: '/reports/:id/status',
    ASSIGN: '/reports/:id/assign',
    IMAGES: '/reports/:id/images',
  },
  STAFF: {
    BASE: '/staff',
    TASKS: '/staff/tasks',
    PERFORMANCE: '/staff/performance',
  },
  DONATIONS: {
    CREATE_ORDER: '/donations/create-order',
    VERIFY: '/donations/verify',
    BASE: '/donations',
    STATS: '/donations/stats',
    DONOR_WALL: '/donations/donor-wall',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    READ_ALL: '/notifications/read-all',
    BROADCAST: '/notifications/broadcast',
  },
  DASHBOARD: {
    STATS: '/dashboard/stats',
    ANALYTICS: '/dashboard/analytics',
    ACTIVITY: '/dashboard/activity',
    CATEGORIES: '/dashboard/categories',
  },
  GALLERY: {
    BASE: '/gallery',
    APPROVE: '/gallery/:id/approve',
  },
};

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_USER_ROOM: 'join_user_room',
  JOIN_ROLE_ROOM: 'join_role_room',
  REPORT_UPDATED: 'report_updated',
  TASK_ASSIGNED: 'task_assigned',
  STATUS_CHANGED: 'status_changed',
  ADMIN_BROADCAST: 'admin_broadcast',
  NOTIFICATION: 'notification',
  SEND_NOTIFICATION: 'send_notification',
  MARK_AS_READ: 'mark_as_read',
  MARK_ALL_READ: 'mark_all_read',
  DELETE_NOTIFICATION: 'delete_notification',
};

export const LOCAL_STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  DARK_MODE: 'darkMode',
  SIDEBAR_COLLAPSED: 'sidebarCollapsed',
};