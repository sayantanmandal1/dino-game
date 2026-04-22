import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, IconButton, Drawer, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Box, useMediaQuery, useTheme,
  Container,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HubIcon from '@mui/icons-material/Hub';
import SaveIcon from '@mui/icons-material/Save';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import InfoIcon from '@mui/icons-material/Info';

const navItems = [
  { to: '/', label: 'Home', icon: <HomeIcon /> },
  { to: '/play', label: 'Play Game', icon: <SportsEsportsIcon /> },
  { to: '/train', label: 'Train Model', icon: <FitnessCenterIcon /> },
  { to: '/visualize', label: 'Visualize', icon: <HubIcon /> },
  { to: '/models', label: 'Saved Models', icon: <SaveIcon /> },
  { to: '/leaderboard', label: 'Leaderboard', icon: <EmojiEventsIcon /> },
  { to: '/about', label: 'About', icon: <InfoIcon /> },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();

  const drawerContent = (
    <Box sx={{ width: 260, py: 2, height: '100%' }}>
      <Box sx={{ px: 2, mb: 2 }}>
        <Typography variant="h6" sx={{
          background: 'linear-gradient(90deg,#00d4ff,#ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          🦖 Dino AI
        </Typography>
      </Box>
      <List>
        {navItems.map((item) => {
          const active = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <ListItem key={item.to} disablePadding>
              <ListItemButton
                component={NavLink}
                to={item.to}
                onClick={() => setOpen(false)}
                sx={{
                  mx: 1, borderRadius: 2,
                  bgcolor: active ? 'rgba(0,212,255,0.12)' : 'transparent',
                  '&:hover': { bgcolor: 'rgba(0,212,255,0.08)' },
                }}
              >
                <ListItemIcon sx={{ color: active ? '#00d4ff' : 'inherit', minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{
        bgcolor: 'rgba(10,14,39,0.7)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Toolbar>
          {!isDesktop && (
            <IconButton color="inherit" onClick={() => setOpen(true)} sx={{ mr: 1 }} aria-label="open drawer">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{
            flexGrow: 1,
            background: 'linear-gradient(90deg,#00d4ff,#ff6b35)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            🦖 Dino AI Trainer
          </Typography>
        </Toolbar>
      </AppBar>

      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: 260, flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 260, boxSizing: 'border-box',
              bgcolor: 'rgba(10,14,39,0.6)', backdropFilter: 'blur(16px)',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              mt: '64px', height: 'calc(100% - 64px)',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer anchor="left" open={open} onClose={() => setOpen(false)}>
          {drawerContent}
        </Drawer>
      )}

      <Box component="main" sx={{ flexGrow: 1, mt: 8, p: { xs: 2, md: 3 } }}>
        <Container maxWidth="xl" disableGutters>
          {children}
        </Container>
      </Box>
    </Box>
  );
}