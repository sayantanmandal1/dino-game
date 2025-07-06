import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Container,
  Chip,
} from '@mui/material';
import {
  SportsEsports,
  Psychology,
  Timeline,
  Storage,
  Bolt,
  TrendingUp,
  Science,
  Code,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SportsEsports sx={{ fontSize: 40 }} />,
      title: 'Play the Game',
      description: 'Experience the classic Chrome Dino game with modern AI enhancements',
      color: '#00d4ff',
      path: '/play',
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: 'Train AI Models',
      description: 'Use NEAT algorithm to evolve neural networks that master the game',
      color: '#ff6b35',
      path: '/train',
    },
    {
      icon: <Timeline sx={{ fontSize: 40 }} />,
      title: 'Visualize Training',
      description: 'Watch real-time neural network evolution with stunning visualizations',
      color: '#00ff88',
      path: '/visualize',
    },
    {
      icon: <Storage sx={{ fontSize: 40 }} />,
      title: 'Manage Models',
      description: 'Save, load, and compare different AI models and their performance',
      color: '#ffaa00',
      path: '/models',
    },
  ];

  const stats = [
    { label: 'Generations', value: '100+', icon: <TrendingUp /> },
    { label: 'Neural Networks', value: '50+', icon: <Science /> },
    { label: 'Training Speed', value: '10x', icon: <Bolt /> },
    { label: 'Success Rate', value: '95%', icon: <Code /> },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Box
          sx={{
            textAlign: 'center',
            py: { xs: 8, md: 12 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated Background */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)',
              animation: 'pulse 4s ease-in-out infinite',
            }}
          />

          <Container maxWidth="lg">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Typography
                variant="h1"
                sx={{
                  mb: 3,
                  fontSize: { xs: '2.5rem', md: '4rem', lg: '5rem' },
                  fontWeight: 900,
                  background: 'linear-gradient(45deg, #00d4ff, #ff6b35, #00ff88)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 30px rgba(0, 212, 255, 0.5)',
                }}
              >
                🦖 Dino AI Trainer
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Typography
                variant="h4"
                sx={{
                  mb: 4,
                  color: 'text.secondary',
                  fontWeight: 300,
                  maxWidth: 800,
                  mx: 'auto',
                }}
              >
                The most advanced AI training platform for the Chrome Dinosaur Game.
                Watch neural networks evolve in real-time using cutting-edge NEAT algorithms.
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/train')}
                  sx={{
                    background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #0099cc, #006699)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Start Training
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/play')}
                  sx={{
                    borderColor: '#ff6b35',
                    color: '#ff6b35',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: '#ff8f5a',
                      color: '#ff8f5a',
                      background: 'rgba(255, 107, 53, 0.1)',
                    },
                  }}
                >
                  Play Game
                </Button>
              </Box>
            </motion.div>
          </Container>
        </Box>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
              <Grid xs={6} md={3} key={stat.label}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    sx={{
                      textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1))',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ color: '#00d4ff', mb: 1 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 700,
            }}
          >
            Features
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid xs={12} sm={6} md={3} key={feature.title}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.2 + index * 0.1 }}
                  whileHover={{ y: -10 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: feature.color,
                        boxShadow: `0 8px 32px ${feature.color}40`,
                      },
                    }}
                    onClick={() => navigate(feature.path)}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Box
                        sx={{
                          color: feature.color,
                          mb: 2,
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          mb: 2,
                          fontWeight: 600,
                        }}
                      >
                        {feature.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2 }}
                      >
                        {feature.description}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                      <Chip
                        label="Explore"
                        size="small"
                        sx={{
                          background: feature.color,
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </motion.div>

      {/* Technology Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.6 }}
      >
        <Container maxWidth="lg" sx={{ mb: 8 }}>
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              mb: 6,
              fontWeight: 700,
            }}
          >
            Powered by Advanced AI
          </Typography>

          <Box
            sx={{
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1))',
              borderRadius: 4,
              p: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              NEAT Algorithm • Neural Networks • Real-time Evolution
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Our platform uses NeuroEvolution of Augmenting Topologies (NEAT) to evolve neural networks
              that can master the Chrome Dinosaur Game. Watch as AI learns and improves through generations
              of training, with real-time visualization of the evolutionary process.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/about')}
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0099cc, #cc4a1a)',
                },
              }}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </motion.div>
    </Box>
  );
};

export default Home; 
