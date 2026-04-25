import { createTheme, ThemeOptions } from '@mui/material/styles';

// Typography configuration to be shared across themes
const typography: ThemeOptions['typography'] = {
  fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, letterSpacing: '-0.02em' },
  h2: { fontWeight: 700, letterSpacing: '-0.01em' },
  h3: { fontWeight: 600, letterSpacing: '-0.01em' },
  h4: { fontWeight: 600 },
  h5: { fontWeight: 500 },
  h6: { fontWeight: 500 },
  button: { textTransform: 'none', fontWeight: 600 },
};

// Common component overrides for a premium feel
const commonComponents: ThemeOptions['components'] = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 24px',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          transform: 'translateY(-1px)',
        },
        transition: 'all 0.2s ease-in-out',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        backgroundImage: 'none',
        transition: 'all 0.3s ease-in-out',
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
    },
  },
};

export type ThemeName = 'arctic' | 'midnight' | 'solar' | 'forest' | 'cyberpunk';

const themes: Record<ThemeName, ThemeOptions> = {
  arctic: {
    palette: {
      mode: 'light',
      primary: { main: '#0F172A' }, // Slate 900
      secondary: { main: '#38BDF8' }, // Light Blue 400
      background: { default: '#F8FAFC', paper: '#FFFFFF' },
      text: { primary: '#0F172A', secondary: '#64748B' },
    },
    shape: { borderRadius: 12 },
    components: {
      ...commonComponents,
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
            border: '1px solid #E2E8F0',
          },
        },
      },
    },
  },
  
  midnight: {
    palette: {
      mode: 'dark',
      primary: { main: '#818CF8' }, // Indigo 400
      secondary: { main: '#C084FC' }, // Purple 400
      background: { default: '#0B0F19', paper: '#111827' },
      text: { primary: '#F9FAFB', secondary: '#9CA3AF' },
      divider: 'rgba(255,255,255,0.08)',
    },
    shape: { borderRadius: 16 },
    components: {
      ...commonComponents,
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: 'rgba(17, 24, 39, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
          },
        },
      },
    },
  },

  solar: {
    palette: {
      mode: 'dark',
      primary: { main: '#F97316' }, // Orange 500
      secondary: { main: '#EAB308' }, // Yellow 500
      background: { default: '#1C1917', paper: '#292524' }, // Warm Grays
      text: { primary: '#FFF7ED', secondary: '#D6D3D1' },
      divider: 'rgba(249, 115, 22, 0.2)',
    },
    shape: { borderRadius: 20 },
    components: {
      ...commonComponents,
      MuiPaper: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(249, 115, 22, 0.15)',
            boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.1)',
          },
        },
      },
    },
  },

  forest: {
    palette: {
      mode: 'light',
      primary: { main: '#2F5233' }, // Deep Forest Green
      secondary: { main: '#94C973' }, // Sage
      background: { default: '#F4F6F0', paper: '#FFFFFF' },
      text: { primary: '#1A2A1A', secondary: '#5A6F5A' },
      divider: '#DDE5D8',
    },
    shape: { borderRadius: 16 },
    components: {
      ...commonComponents,
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: '0 10px 30px -5px rgba(47, 82, 51, 0.08)',
            border: '1px solid rgba(148, 201, 115, 0.2)',
          },
        },
      },
    },
  },

  cyberpunk: {
    palette: {
      mode: 'dark',
      primary: { main: '#F000FF' }, // Neon Pink
      secondary: { main: '#00F0FF' }, // Neon Cyan
      background: { default: '#050510', paper: '#0A0A1A' },
      text: { primary: '#E0E0FF', secondary: '#8080B0' },
      divider: 'rgba(240, 0, 255, 0.3)',
      error: { main: '#FF003C' },
      warning: { main: '#FCE205' },
      success: { main: '#00FF41' },
    },
    shape: { borderRadius: 0 }, // Sharp edges
    components: {
      ...commonComponents,
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            textTransform: 'uppercase',
            letterSpacing: '2px',
            border: '1px solid rgba(0, 240, 255, 0.5)',
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)',
            '&:hover': {
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.6)',
              backgroundColor: 'rgba(0, 240, 255, 0.1)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            border: '1px solid rgba(240, 0, 255, 0.3)',
            boxShadow: '0 0 15px rgba(240, 0, 255, 0.15)',
            position: 'relative',
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderBottom: '2px solid #00F0FF',
              borderRight: '2px solid #00F0FF',
            }
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#00F0FF',
              borderWidth: '2px',
            },
          },
        },
      },
    },
  },
};

// Combine base options with specific themes
export const getTheme = (name: ThemeName) => {
  return createTheme({
    ...themes[name],
    typography,
  });
};
