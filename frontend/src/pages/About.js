import React from 'react';
import { Box, Paper, Typography, Stack, Chip, Link as MuiLink } from '@mui/material';

export default function About() {
  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 2 }}>About</Typography>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>🦖 Dino AI Trainer</Typography>
        <Typography variant="body1" sx={{ opacity: 0.85 }}>
          A pixel-perfect Chrome offline dino game paired with a real NEAT (NeuroEvolution of Augmenting
          Topologies) training backend. Train, visualize, play — all live.
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Stack</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          <Chip label="React 19" /><Chip label="MUI 7" /><Chip label="Canvas 2D" />
          <Chip label="FastAPI" /><Chip label="SQLAlchemy async" /><Chip label="neat-python" />
          <Chip label="Docker" /><Chip label="nginx" /><Chip label="Playwright" />
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Attribution</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Sprite assets originate from Chromium's offline dino game and are © The Chromium Authors,
          redistributed under BSD. Rendering, physics mirroring, NEAT integration, services, and
          platform tooling are original MIT-licensed code.
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
          Source: <MuiLink href="https://chromium.googlesource.com/chromium/src" target="_blank" rel="noreferrer">chromium.googlesource.com</MuiLink>
        </Typography>
      </Paper>
    </Box>
  );
}