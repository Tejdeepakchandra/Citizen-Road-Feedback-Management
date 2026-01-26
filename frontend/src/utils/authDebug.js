/**
 * Authentication Debugging Utilities
 * Use these functions in browser console to diagnose auth issues
 */

export const authDebug = {
  /**
   * Check if token exists in localStorage
   */
  checkToken: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('❌ No token in localStorage');
      return false;
    }
    console.log('✅ Token found in localStorage');
    console.log('Token preview:', token.substring(0, 20) + '...');
    return true;
  },

  /**
   * Decode JWT token to check expiration
   */
  checkTokenExpiry: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('❌ No token found');
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      const isExpired = now > expiresAt;

      console.log('Token Expiration:', expiresAt.toString());
      console.log('Current Time:', now.toString());
      console.log(isExpired ? '❌ Token EXPIRED' : '✅ Token valid');

      return { payload, expiresAt, isExpired };
    } catch (err) {
      console.error('❌ Failed to decode token:', err);
      return null;
    }
  },

  /**
   * Check user data in localStorage
   */
  checkUser: () => {
    const user = localStorage.getItem('user');
    if (!user) {
      console.warn('❌ No user data in localStorage');
      return null;
    }
    const userData = JSON.parse(user);
    console.log('✅ User found:', userData);
    return userData;
  },

  /**
   * Check if Authorization header is being sent
   * Run this before making a request to dashboard
   */
  interceptorCheck: () => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('✅ Interceptor will send Authorization header');
      console.log('Header format: Authorization: Bearer ' + token.substring(0, 20) + '...');
    } else {
      console.warn('❌ No token - Authorization header will NOT be sent');
    }
  },

  /**
   * Full authentication status check
   */
  checkAll: () => {
    console.log('=== AUTHENTICATION STATUS CHECK ===');
    console.log('\n1. Token in localStorage:');
    const hasToken = authDebug.checkToken();

    console.log('\n2. Token Expiration:');
    authDebug.checkTokenExpiry();

    console.log('\n3. User Data:');
    authDebug.checkUser();

    console.log('\n4. Interceptor Status:');
    authDebug.interceptorCheck();

    console.log('\n5. API URLs:');
    console.log('Frontend API URL:', import.meta.env.VITE_API_URL || 'https://citizen-road-backend.onrender.com/api');
    
    console.log('\n=== END CHECK ===');
  },

  /**
   * Simulate a request with debug info
   */
  simulateRequest: async (endpoint = '/dashboard/citizen') => {
    const token = localStorage.getItem('token');
    const url = (import.meta.env.VITE_API_URL || 'https://citizen-road-backend.onrender.com/api') + endpoint;
    
    console.log('📤 Simulating request to:', url);
    console.log('Headers:', {
      Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'MISSING',
      'Content-Type': 'application/json'
    });

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response Status:', response.status);
      console.log('Response Headers:', {
        'content-type': response.headers.get('content-type')
      });

      const data = await response.json();
      console.log('Response Data:', data);

      return data;
    } catch (err) {
      console.error('Request failed:', err);
    }
  }
};

// Make available globally in development
if (import.meta.env.DEV) {
  window.authDebug = authDebug;
  console.log('✅ authDebug loaded. Use authDebug.checkAll() to diagnose auth issues');
}

export default authDebug;
