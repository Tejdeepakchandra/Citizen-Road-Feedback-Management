import { createTheme, alpha } from '@mui/material/styles';

// Glassmorphism theme configuration
const glassmorphismConfig = {
  background: {
    glassLight: 'rgba(255, 255, 255, 0.15)',
    glassDark: 'rgba(30, 41, 59, 0.4)',
    glassPrimary: 'rgba(139, 92, 246, 0.1)',
    glassSecondary: 'rgba(14, 165, 233, 0.1)',
  },
  effects: {
    blur: 'blur(10px) saturate(180%)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    glowPrimary: '0 0 20px rgba(139, 92, 246, 0.4)',
    glowSecondary: '0 0 20px rgba(14, 165, 233, 0.4)',
  },
  gradients: {
    primary: 'linear-gradient(135deg, #8B5CF6 0%, #0EA5E9 100%)',
    secondary: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    accent: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
    dark: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
  }
};

// Create light theme with glassmorphism
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0EA5E9',
      light: '#38BDF8',
      dark: '#0284C7',
      contrastText: '#FFFFFF',
    },
    background: {
      default: 'rgba(248, 250, 252, 0.95)',
      paper: 'rgba(255, 255, 255, 0.8)',
      glass: glassmorphismConfig.background.glassLight,
    },
    text: {
      primary: 'rgba(15, 23, 42, 0.95)',
      secondary: 'rgba(71, 85, 105, 0.8)',
      disabled: 'rgba(148, 163, 184, 0.6)',
    },
    divider: 'rgba(148, 163, 184, 0.2)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '4.5rem',
      fontWeight: 800,
      lineHeight: 1.1,
      background: glassmorphismConfig.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    h2: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.07)',
    '0px 8px 16px rgba(0,0,0,0.09)',
    '0px 16px 32px rgba(0,0,0,0.11)',
    ...Array(20).fill('0px 32px 64px rgba(0,0,0,0.13)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: `linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backdropFilter: glassmorphismConfig.effects.blur,
          backgroundColor: glassmorphismConfig.background.glassLight,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: glassmorphismConfig.effects.shadow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.MuiButton-contained': {
            background: glassmorphismConfig.gradients.primary,
            boxShadow: glassmorphismConfig.effects.glowPrimary,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 24px rgba(139, 92, 246, 0.4)',
            },
          },
          '&.MuiButton-outlined': {
            borderWidth: 2,
            borderColor: 'rgba(139, 92, 246, 0.3)',
            '&:hover': {
              borderColor: '#8B5CF6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: glassmorphismConfig.effects.blur,
          backgroundColor: alpha('rgba(248, 250, 252, 0.95)', 0.8),
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: glassmorphismConfig.effects.blur,
          backgroundColor: alpha('rgba(255, 255, 255, 0.8)', 0.8),
          borderRight: '1px solid rgba(255, 255, 255, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backdropFilter: glassmorphismConfig.effects.blur,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
    },
  },
});

// Create dark theme with glassmorphism
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0EA5E9',
      light: '#38BDF8',
      dark: '#0284C7',
      contrastText: '#FFFFFF',
    },
    background: {
      default: 'rgba(15, 23, 42, 0.95)',
      paper: 'rgba(30, 41, 59, 0.8)',
      glass: glassmorphismConfig.background.glassDark,
    },
    text: {
      primary: 'rgba(248, 250, 252, 0.95)',
      secondary: 'rgba(203, 213, 225, 0.8)',
      disabled: 'rgba(148, 163, 184, 0.6)',
    },
    divider: 'rgba(71, 85, 105, 0.3)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '4.5rem',
      fontWeight: 800,
      lineHeight: 1.1,
      background: glassmorphismConfig.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: glassmorphismConfig.effects.glowPrimary,
    },
    h2: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.3)',
    '0px 4px 8px rgba(0,0,0,0.35)',
    '0px 8px 16px rgba(0,0,0,0.4)',
    '0px 16px 32px rgba(0,0,0,0.45)',
    ...Array(20).fill('0px 32px 64px rgba(0,0,0,0.5)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: glassmorphismConfig.gradients.dark,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backdropFilter: glassmorphismConfig.effects.blur,
          backgroundColor: glassmorphismConfig.background.glassDark,
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: glassmorphismConfig.effects.shadow,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.3)',
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
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&.MuiButton-contained': {
            background: glassmorphismConfig.gradients.primary,
            boxShadow: glassmorphismConfig.effects.glowPrimary,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 24px rgba(139, 92, 246, 0.5)',
            },
          },
          '&.MuiButton-outlined': {
            borderWidth: 2,
            borderColor: 'rgba(139, 92, 246, 0.4)',
            '&:hover': {
              borderColor: '#8B5CF6',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: glassmorphismConfig.effects.blur,
          backgroundColor: alpha('rgba(15, 23, 42, 0.95)', 0.8),
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: glassmorphismConfig.effects.blur,
          backgroundColor: alpha('rgba(30, 41, 59, 0.8)', 0.8),
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backdropFilter: glassmorphismConfig.effects.blur,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
      },
    },
  },
});

// Export glassmorphism utilities for use in components
export const glassmorphism = {
  ...glassmorphismConfig,
  mixins: {
    glassCard: {
      backdropFilter: glassmorphismConfig.effects.blur,
      backgroundColor: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      boxShadow: glassmorphismConfig.effects.shadow,
    },
    neonText: {
      background: glassmorphismConfig.gradients.primary,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: glassmorphismConfig.effects.glowPrimary,
    },
    animatedBorder: {
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: -2,
        borderRadius: 'inherit',
        padding: '2px',
        background: glassmorphismConfig.gradients.primary,
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        animation: 'rotate 3s linear infinite',
      },
    },
  },
};