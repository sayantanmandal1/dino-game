import React, { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Stack, Button, Paper, Chip, FormControlLabel, Switch,
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Alert,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RefreshIcon from '@mui/icons-material/Refresh';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import DinoCanvas from '../components/DinoCanvas';
import { useAiAutopilot } from '../hooks/useAiAutopilot';
import { api } from '../api/client';

export default function PlayGame() {
  const canvasRef = useRef(null);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');

  const { connected, decide } = useAiAutopilot(aiMode ? modelId : null);

  useEffect(() => {
    api('/api/models')
      .then((r) => {
        const list = Array.isArray(r) ? r : (r.models || []);
        setModels(list);
        // Honor ?model=<id> from the Train / Models page links: pre-select
        // and auto-enable AI autopilot so the flow is one click.
        const params = new URLSearchParams(window.location.search);
        const wanted = params.get('model');
        if (wanted && list.some((m) => m.id === wanted)) {
          setModelId(wanted);
          setAiMode(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const eng = canvasRef.current;
    if (!eng) return undefined;
    const unsub = eng.onUpdate((s) => {
      setScore(s.score);
      if (s.gameOver) {
        setRunning(false);
        const prev = Number(localStorage.getItem('dino.hi') || 0);
        if (s.score > prev) localStorage.setItem('dino.hi', String(s.score));
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const eng = canvasRef.current;
    if (!eng) return;
    if (aiMode && connected) eng.setAutopilot(decide); else eng.setAutopilot(null);
  }, [aiMode, connected, decide]);

  const handleStart = () => {
    const eng = canvasRef.current; if (!eng) return;
    eng.start(); setRunning(true);
  };
  const handlePause = () => {
    const eng = canvasRef.current; if (!eng) return;
    eng.stop(); setRunning(false);
  };
  const handleReset = () => {
    const eng = canvasRef.current; if (!eng) return;
    eng.reset(); setScore(0); setRunning(false);
  };

  const submitScore = async () => {
    setSubmitMsg('');
    try {
      await api('/api/leaderboard', {
        method: 'POST',
        body: {
          player_name: playerName || 'Anonymous',
          score,
          model_id: aiMode && modelId ? modelId : null,
          mode: aiMode && modelId ? 'ai' : 'human',
        },
      });
      setSubmitMsg('submitted'); setSubmitOpen(false);
    } catch (e) { setSubmitMsg(`error: ${e.message}`); }
  };

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 2 }}>Play</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} flexWrap="wrap">
          <Stack direction="row" spacing={1}>
            {!running ? (
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleStart}>Start</Button>
            ) : (
              <Button variant="outlined" startIcon={<PauseIcon />} onClick={handlePause}>Pause</Button>
            )}
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset}>Reset</Button>
          </Stack>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>AI Model</InputLabel>
            <Select value={modelId} label="AI Model" onChange={(e) => setModelId(e.target.value)}>
              <MenuItem value=""><em>None (manual)</em></MenuItem>
              {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={aiMode} onChange={(e) => setAiMode(e.target.checked)} disabled={!modelId} />}
            label="AI autopilot"
          />
          {aiMode && <Chip label={connected ? 'AI connected' : 'connecting...'} color={connected ? 'success' : 'default'} size="small" />}
          <Box sx={{ flexGrow: 1 }} />
          {/* hidden test hook - score is rendered inside the canvas too */}
          <span data-testid="score" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
            {String(score).padStart(5, '0')}
          </span>
          <Button size="small" startIcon={<EmojiEventsIcon />} disabled={!score} onClick={() => setSubmitOpen(true)}>
            Submit score
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
        <DinoCanvas ref={canvasRef} />
      </Paper>
      <Typography variant="body2" sx={{ mt: 1, opacity: 0.6, textAlign: 'center' }}>
        Space / Up arrow to jump &middot; Down arrow to duck &middot; tap to jump &middot; current score &amp; HI shown on canvas
      </Typography>
      {submitMsg && <Alert sx={{ mt: 2 }} severity={submitMsg.startsWith('error') ? 'error' : 'success'}>{submitMsg}</Alert>}

      <Dialog open={submitOpen} onClose={() => setSubmitOpen(false)}>
        <DialogTitle>Submit score</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth margin="dense" label="Name" value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
          <Typography variant="body2" sx={{ mt: 1 }}>Score: {score}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Mode: {aiMode && modelId ? 'AI' : 'Human'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitScore}>Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}