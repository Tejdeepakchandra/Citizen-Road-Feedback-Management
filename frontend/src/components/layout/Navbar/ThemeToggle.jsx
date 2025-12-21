// components/layout/Navbar/ThemeToggle.jsx
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../../../context/ThemeContext';

const ThemeToggle = () => {
  const { toggleTheme, darkMode } = useTheme(); // ✅ Use darkMode instead of isDarkMode

  return (
    <Tooltip title={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>
      <IconButton
        onClick={toggleTheme}
        sx={{
          width: 40,
          height: 40,
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            transform: 'rotate(180deg)',
            transition: 'transform 0.3s ease',
          },
        }}
      >
        {darkMode ? ( // ✅ Use darkMode here
          <LightMode sx={{ color: '#FFD700' }} />
        ) : (
          <DarkMode sx={{ color: '#666' }} />
        )}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;