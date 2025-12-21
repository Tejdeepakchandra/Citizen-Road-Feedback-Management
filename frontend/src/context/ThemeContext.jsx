// src/context/ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline, createTheme } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Fixed theme configuration without gradient in palette
const getGlassmorphismTheme = (mode) => {
  const isDark = mode === 'dark';
  
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#818CF8' : '#6366F1',
        light: isDark ? '#A5B4FC' : '#818CF8',
        dark: isDark ? '#6366F1' : '#4F46E5',
      },
      secondary: {
        main: isDark ? '#38BDF8' : '#0EA5E9',
        light: isDark ? '#7DD3FC' : '#38BDF8',
        dark: isDark ? '#0EA5E9' : '#0284C7',
      },
      success: { main: '#10B981' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      background: {
        default: isDark ? '#0F172A' : '#F8FAFC',
        paper: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      },
      text: {
        primary: isDark ? 'rgba(248, 250, 252, 0.95)' : 'rgba(15, 23, 42, 0.95)',
        secondary: isDark ? 'rgba(203, 213, 225, 0.85)' : 'rgba(71, 85, 105, 0.85)',
      },
      divider: isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(226, 232, 240, 0.6)',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1 },
      h2: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.2 },
      h3: { fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.3 },
      h4: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
      h5: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.5 },
      h6: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.6 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark 
              ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' 
              : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
            backgroundAttachment: 'fixed',
            minHeight: '100vh',
            margin: 0,
            padding: 0,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backdropFilter: isDark ? 'blur(20px) saturate(180%)' : 'blur(20px)',
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(226, 232, 240, 0.6)',
            boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.08)',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: isDark ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 20px 40px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.025em',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&.MuiButton-contained': {
              background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)',
              },
            },
          },
        },
      },
    },
  });
};

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    if (saved && (saved === 'light' || saved === 'dark')) {
      return saved;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const theme = getGlassmorphismTheme(themeMode);

  useEffect(() => {
    localStorage.setItem('themeMode', themeMode);
    
    document.body.classList.remove('light-mode', 'dark-mode');
    
    if (themeMode === 'dark') {
      document.body.classList.add('dark-mode');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.background = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';
    } else {
      document.body.classList.add('light-mode');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.background = 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)';
    }
    
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.minHeight = '100vh';
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeTheme = (mode) => {
    if (mode === 'light' || mode === 'dark') {
      setThemeMode(mode);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      themeMode, 
      toggleTheme, 
      changeTheme,
      darkMode: themeMode === 'dark'
    }}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;