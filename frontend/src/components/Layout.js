import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useTheme,
  useMediaQuery,
  Container,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  SportsEsports as GameIcon,
  Psychology as TrainIcon,
  Timeline as VisualizeIcon,
  Storage as ModelsIcon,
  Info as AboutIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Play Game', icon: <GameIcon />, path: '/play' },
    { text: 'Train Model', icon: <TrainIcon />, path: '/train' },
    { text: 'Visualize', icon: <VisualizeIcon />, path: '/visualize' },
    { text: 'Saved Models', icon: <ModelsIcon />, path: '/models' },
    { text: 'About', icon: <AboutIcon />, path: '/about' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Stunning Animated AppBar */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <AppBar 
          position="fixed" 
          sx={{
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  flexGrow: 1,
                  cursor: 'pointer',
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: 700,
                }}
                onClick={() => handleNavigation('/')}
              >
                🦖 Dino AI Trainer
              </Typography>
            </motion.div>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              {menuItems.map((item) => (
                <motion.div
                  key={item.text}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Chip
                    icon={item.icon}
                    label={item.text}
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      background: isActive(item.path) 
                        ? 'linear-gradient(45deg, #00d4ff, #0099cc)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: isActive(item.path) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      '&:hover': {
                        background: isActive(item.path) 
                          ? 'linear-gradient(45deg, #0099cc, #006699)' 
                          : 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  />
                </motion.div>
              ))}
            </Box>

            {/* Status Indicator */}
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
                  boxShadow: '0 0 10px rgba(0, 255, 136, 0.5)',
                  ml: 2,
                }}
              />
            </motion.div>
          </Toolbar>
        </AppBar>
      </motion.div>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            width: 280,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            Menu
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        
        <List>
          {menuItems.map((item, index) => (
            <motion.div
              key={item.text}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <ListItem
                button
                onClick={() => handleNavigation(item.path)}
                sx={{
                  background: isActive(item.path) 
                    ? 'linear-gradient(45deg, rgba(0, 212, 255, 0.2), rgba(255, 107, 53, 0.2))' 
                    : 'transparent',
                  borderLeft: isActive(item.path) ? '4px solid #00d4ff' : 'none',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: isActive(item.path) ? '#00d4ff' : 'white' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    color: isActive(item.path) ? '#00d4ff' : 'white',
                    fontWeight: isActive(item.path) ? 600 : 400,
                  }}
                />
              </ListItem>
            </motion.div>
          ))}
        </List>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: { xs: 8, md: 9 },
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
          }}
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                borderRadius: '50%',
                opacity: 0.1,
              }}
              animate={{
                x: [0, Math.random() * window.innerWidth],
                y: [0, Math.random() * window.innerHeight],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </Box>

        {/* Content Container */}
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 
