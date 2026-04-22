import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Stack, Button, Paper, Grid } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HubIcon from '@mui/icons-material/Hub';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const features = [
  { icon: <SportsEsportsIcon fontSize="large" />, title: 'Play', desc: 'Pixel-accurate Chrome offline dino with keyboard or touch.', to: '/play' },
  { icon: <FitnessCenterIcon fontSize="large" />, title: 'Train', desc: 'Evolve a neural network with NEAT in real time.', to: '/train' },
  { icon: <HubIcon fontSize="large" />, title: 'Visualize', desc: 'Inspect every neuron, connection, and weight.', to: '/visualize' },
  { icon: <EmojiEventsIcon fontSize="large" />, title: 'Compete', desc: 'Race your AI against the world leaderboard.', to: '/leaderboard' },
];

export default function Home() {
  return (
    <Box>
      <Paper sx={{ p: { xs: 3, md: 6 }, mb: 4, textAlign: 'center' }}>
        <Typography variant="h2" sx={{
          background: 'linear-gradient(90deg,#00d4ff,#ff6b35)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          mb: 2,
        }}>
          🦖 Dino AI Trainer
        </Typography>
        <Typography variant="h5" sx={{ opacity: 0.8, mb: 4 }}>
          Pixel-perfect Chrome dino + real NEAT neuroevolution.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button component={Link} to="/play" variant="contained" size="large" startIcon={<SportsEsportsIcon />}>
            Play
          </Button>
          <Button component={Link} to="/train" variant="outlined" size="large" startIcon={<FitnessCenterIcon />}>
            Train
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={3}>
        {features.map((f) => (
          <Grid item xs={12} sm={6} md={3} key={f.title}>
            <Paper component={Link} to={f.to} sx={{
              p: 3, display: 'block', textDecoration: 'none', color: 'inherit',
              height: '100%', transition: 'transform 0.2s, border-color 0.2s',
              '&:hover': { transform: 'translateY(-4px)', borderColor: '#00d4ff' },
            }}>
              <Box sx={{ color: '#00d4ff', mb: 1 }}>{f.icon}</Box>
              <Typography variant="h6" sx={{ mb: 1 }}>{f.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>{f.desc}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}