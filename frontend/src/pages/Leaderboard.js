import React, { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Stack, ToggleButtonGroup, ToggleButton, Table,
  TableHead, TableRow, TableCell, TableBody, Chip, Alert,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { api } from '../api/client';

const medal = (rank) => {
  if (rank === 0) return '🥇';
  if (rank === 1) return '🥈';
  if (rank === 2) return '🥉';
  return `#${rank + 1}`;
};

export default function Leaderboard() {
  const [mode, setMode] = useState('all');
  const [entries, setEntries] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const qs = mode === 'all' ? '' : `?mode=${mode}`;
    api(`/api/leaderboard${qs}`)
      .then(setEntries)
      .catch((e) => setErr(e.message));
  }, [mode]);

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <EmojiEventsIcon sx={{ color: '#ffd76a', fontSize: 40 }} />
        <Typography variant="h3">Leaderboard</Typography>
      </Stack>
      {err && <Alert severity="warning" sx={{ mb: 2 }}>{err}</Alert>}

      <Paper sx={{ p: 3 }}>
        <ToggleButtonGroup
          value={mode} exclusive size="small"
          onChange={(_, v) => v && setMode(v)}
          sx={{ mb: 2 }}
        >
          <ToggleButton value="all">All</ToggleButton>
          <ToggleButton value="human">Human</ToggleButton>
          <ToggleButton value="ai">AI</ToggleButton>
        </ToggleButtonGroup>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Player</TableCell>
              <TableCell>Mode</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell>When</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4, opacity: 0.6 }}>
                  No scores yet. Go play!
                </TableCell>
              </TableRow>
            ) : entries.map((e, i) => (
              <TableRow key={e.id} hover>
                <TableCell>{medal(i)}</TableCell>
                <TableCell>{e.player_name}</TableCell>
                <TableCell>
                  <Chip size="small" label={e.mode} color={e.mode === 'ai' ? 'primary' : 'default'} />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{e.score}</TableCell>
                <TableCell>{new Date(e.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
