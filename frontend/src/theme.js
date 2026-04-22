import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0a0e27',
      paper: 'rgba(20, 26, 60, 0.8)',
    },
    primary: { main: '#00d4ff' },
    secondary: { main: '#ff6b35' },
    success: { main: '#00ff88' },
    text: { primary: '#ffffff', secondary: 'rgba(255,255,255,0.72)' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: -1 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(14px)',
          backgroundImage: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
});
