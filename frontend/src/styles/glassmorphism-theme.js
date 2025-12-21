export const glassmorphismTheme = {
  palette: {
    mode: 'light',
    primary: {
      main: '#6366F1', // Indigo (softer than purple)
      light: '#818CF8',
      dark: '#4F46E5',
      neon: 'rgba(99, 102, 241, 0.8)',
      glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    },
    secondary: {
      main: '#0EA5E9', // Sky blue
      light: '#38BDF8',
      dark: '#0284C7',
      neon: 'rgba(14, 165, 233, 0.8)',
      glow: '0 0 20px rgba(14, 165, 233, 0.3)',
    },
    success: {
      main: '#10B981', // Emerald green
      neon: 'rgba(16, 185, 129, 0.8)',
      glow: '0 0 20px rgba(16, 185, 129, 0.3)',
    },
    warning: {
      main: '#F59E0B', // Amber
      neon: 'rgba(245, 158, 11, 0.8)',
      glow: '0 0 20px rgba(245, 158, 11, 0.3)',
    },
    error: {
      main: '#EF4444', // Red
      neon: 'rgba(239, 68, 68, 0.8)',
      glow: '0 0 20px rgba(239, 68, 68, 0.3)',
    },
    info: {
      main: '#8B5CF6', // Purple (as accent)
      neon: 'rgba(139, 92, 246, 0.8)',
      glow: '0 0 20px rgba(139, 92, 246, 0.3)',
    },
    // Light mode backgrounds
    background: {
      default: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
      paper: 'rgba(255, 255, 255, 0.95)',
      glass: 'rgba(255, 255, 255, 0.85)', // More opaque for better readability
      glassDark: 'rgba(0, 0, 0, 0.05)',
    },
    // Light mode text (darker for better contrast)
    text: {
      primary: 'rgba(15, 23, 42, 0.95)', // Very dark slate
      secondary: 'rgba(71, 85, 105, 0.85)', // Darker gray
      disabled: 'rgba(148, 163, 184, 0.6)',
    },
    divider: 'rgba(226, 232, 240, 0.6)', // Softer divider
  },
  // Dark mode overrides
  dark: {
    palette: {
      primary: {
        main: '#818CF8', // Lighter indigo for dark mode
        light: '#A5B4FC',
        dark: '#6366F1',
        neon: 'rgba(129, 140, 248, 0.8)',
        glow: '0 0 20px rgba(129, 140, 248, 0.4)',
      },
      secondary: {
        main: '#38BDF8', // Lighter blue for dark mode
        light: '#7DD3FC',
        dark: '#0EA5E9',
        neon: 'rgba(56, 189, 248, 0.8)',
        glow: '0 0 20px rgba(56, 189, 248, 0.4)',
      },
      background: {
        default: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        paper: 'rgba(30, 41, 59, 0.95)', // More opaque
        glass: 'rgba(30, 41, 59, 0.85)', // More opaque for readability
        glassDark: 'rgba(0, 0, 0, 0.3)',
      },
      text: {
        primary: 'rgba(248, 250, 252, 0.95)', // Off-white
        secondary: 'rgba(203, 213, 225, 0.85)', // Light gray
        disabled: 'rgba(148, 163, 184, 0.5)',
      },
      divider: 'rgba(71, 85, 105, 0.4)',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1.1,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.7,
    },
  },
  shape: {
    borderRadius: 16,
  },
  // Add mixins here
  mixins: {
    toolbar: {
      minHeight: 64,
      '@media (min-width:0px) and (orientation: landscape)': {
        minHeight: 48,
      },
      '@media (min-width:600px)': {
        minHeight: 64,
      },
    },
    sidebarWidth: 280,
    sidebarWidthCollapsed: 80,
  },
  components: {
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
          '&.MuiButton-outlined': {
            borderWidth: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderColor: '#6366F1',
            },
          },
          '&.MuiButton-text': {
            '&:hover': {
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          '&.gradient-text': {
            background: 'linear-gradient(135deg, #6366F1 0%, #0EA5E9 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          },
          '&.neon-text': {
            textShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          backdropFilter: 'blur(10px)',
          '&.MuiChip-filled': {
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: '#6366F1',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366F1',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366F1',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.6)',
          zIndex: 1200, // Ensure navbar is above sidebar
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRight: '1px solid rgba(226, 232, 240, 0.6)',
          zIndex: 1100, // Sidebar below navbar
        },
      },
    },
    // Add z-index for stacking context
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px !important',
        },
      },
    },
  },
  // Add zIndex values if not already present
  zIndex: {
    mobileStepper: 1000,
    speedDial: 1050,
    appBar: 1200,
    drawer: 1100,
    modal: 1300,
    snackbar: 1400,
    tooltip: 1500,
  },
};