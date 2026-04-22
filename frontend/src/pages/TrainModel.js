import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, Stack, Grid, Slider, TextField, Button, Chip, Alert, Divider,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import DownloadIcon from '@mui/icons-material/Download';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import HubIcon from '@mui/icons-material/Hub';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DinoCanvas from '../components/DinoCanvas';
import { useTrainingSocket } from '../hooks/useTrainingSocket';
import { useAiAutopilot } from '../hooks/useAiAutopilot';
import { api, apiBase } from '../api/client';

// Six local population-preview canvases run in parallel so the user sees the "swarm" training.
// Their seeds differ; they restart automatically on crash for the visual effect.
function PopulationPreview({ aiModelId }) {
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const { connected, decide } = useAiAutopilot(aiModelId || null);

  useEffect(() => {
    const timers = [];
    refs.forEach((r, i) => {
      const start = () => {
        const eng = r.current; if (!eng) return;
        eng.reset(1000 + i * 37); eng.start();
        // Install a heuristic autopilot so the dinos visibly jump (fake "evolving"
        // population). Each dino gets a different reaction distance + duck bias
        // so they die at different times; this is replaced by the real NN once
        // training finishes (see second effect).
        if (!aiModelId) {
          const threshold = 0.18 + (i / refs.length) * 0.22; // 0.18 .. 0.40
          const duckBias = (i % 3 === 2); // two of the six also duck
          const pilot = (sensors) => {
            // sensors: [dist, ow, oh, oy, speed, dinoY] all in [0,1]
            const [dist, , oh, oy] = sensors;
            const isHighBird = duckBias && oy < 0.55 && oh < 0.3;
            if (isHighBird && dist < 0.30) return 'duck';
            if (dist < threshold) return 'jump';
            return 'noop';
          };
          const eng2 = r.current;
          if (eng2) eng2.setAutopilot(pilot);
        }
      };
      // Stagger start
      const t = setTimeout(start, 120 * i);
      timers.push(t);
      const unsub = r.current && r.current.onUpdate((s) => {
        if (s.gameOver) {
          // auto-restart with a fresh seed for variety
          const t2 = setTimeout(() => {
            const eng = r.current; if (!eng) return;
            eng.reset(Math.floor(Math.random() * 1e6));
            eng.start();
          }, 450);
          timers.push(t2);
        }
      });
      if (unsub) timers.push({ _unsub: unsub });
    });
    return () => {
      timers.forEach((t) => {
        if (t && t._unsub) t._unsub();
        else clearTimeout(t);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    refs.forEach((r) => {
      const eng = r.current; if (!eng) return;
      if (aiModelId && connected) eng.setAutopilot(decide);
      // when model disconnects or clears, fall back to idle noop (no autopilot)
    });
  }, [aiModelId, connected, decide]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
        <Typography variant="subtitle2">Population preview</Typography>
        {aiModelId && (
          <Chip size="small" color={connected ? 'success' : 'default'}
            label={connected ? `AI ${aiModelId.slice(0, 6)}` : 'connecting...'} />
        )}
      </Stack>
      <Grid container spacing={1}>
        {refs.map((r, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <DinoCanvas ref={r} scale={1} disableInput width={600} height={150} />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default function TrainModel() {
  const [populationSize, setPopulationSize] = useState(150);
  const [maxGenerations, setMaxGenerations] = useState(50);
  const [mutationRate, setMutationRate] = useState(0.8);
  const [survivalThreshold, setSurvivalThreshold] = useState(0.2);
  const [compatibilityThreshold, setCompatibilityThreshold] = useState(3.0);
  const [runName, setRunName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [finishedModelId, setFinishedModelId] = useState(null);

  const { connected, status, history, events } = useTrainingSocket(true);

  // Detect finished event from the event stream
  useEffect(() => {
    const last = events[events.length - 1];
    if (last && (last.type === 'finished' || last.type === 'stopped') && last.model_id) {
      setFinishedModelId(last.model_id);
      setOk(`Training complete. Saved model ${last.model_id.slice(0, 8)}`);
    }
  }, [events]);

  const chartData = useMemo(() => history.map((h, i) => ({
    gen: h.generation ?? i,
    best: Number(h.best_fitness ?? 0),
    mean: Number(h.mean_fitness ?? 0),
  })), [history]);

  const start = async () => {
    setErr(''); setOk(''); setSubmitting(true); setFinishedModelId(null);
    try {
      await api('/api/training/start', {
        method: 'POST',
        body: {
          run_name: runName || `run-${new Date().toISOString().replace(/[:.]/g, '-')}`,
          population_size: populationSize,
          max_generations: maxGenerations,
          mutation_rate: mutationRate,
          survival_threshold: survivalThreshold,
          compatibility_threshold: compatibilityThreshold,
        },
      });
      setOk('Training started');
    } catch (e) { setErr(e.message); }
    finally { setSubmitting(false); }
  };

  const stop = async () => {
    try { await api('/api/training/stop', { method: 'POST' }); }
    catch (e) { setErr(e.message); }
  };

  const isRunning = status && (status.type === 'start' || status.type === 'generation');
  const latest = history[history.length - 1];
  const bestFit = latest ? Number(latest.best_fitness || 0).toFixed(2) : '-';
  const meanFit = latest ? Number(latest.mean_fitness || 0).toFixed(2) : '-';

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 2 }}>Train</Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Hyperparameters</Typography>

            <TextField fullWidth size="small" label="Run name" value={runName}
              onChange={(e) => setRunName(e.target.value)} sx={{ mb: 2 }} placeholder="auto-generated" />

            <Typography gutterBottom>Population: {populationSize}</Typography>
            <Slider min={20} max={500} step={10} value={populationSize} onChange={(_, v) => setPopulationSize(v)} />

            <Typography gutterBottom>Generations: {maxGenerations}</Typography>
            <Slider min={5} max={300} step={5} value={maxGenerations} onChange={(_, v) => setMaxGenerations(v)} />

            <Typography gutterBottom>Mutation rate: {mutationRate.toFixed(2)}</Typography>
            <Slider min={0.1} max={1.0} step={0.05} value={mutationRate} onChange={(_, v) => setMutationRate(v)} />

            <Typography gutterBottom>Survival threshold: {survivalThreshold.toFixed(2)}</Typography>
            <Slider min={0.05} max={0.6} step={0.05} value={survivalThreshold} onChange={(_, v) => setSurvivalThreshold(v)} />

            <Typography gutterBottom>Compatibility: {compatibilityThreshold.toFixed(1)}</Typography>
            <Slider min={0.5} max={6.0} step={0.1} value={compatibilityThreshold} onChange={(_, v) => setCompatibilityThreshold(v)} />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={start}
                disabled={submitting || isRunning}>Start</Button>
              <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={stop}
                disabled={!isRunning}>Stop</Button>
            </Stack>
            {err && <Alert severity="error" sx={{ mt: 2 }}>{err}</Alert>}
            {ok && <Alert severity="success" sx={{ mt: 2 }}>{ok}</Alert>}

            {finishedModelId && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Latest model</Typography>
                <Stack direction="column" spacing={1}>
                  <Button size="small" variant="contained" startIcon={<DownloadIcon />}
                    href={`${apiBase()}/api/models/${finishedModelId}/download`}
                    component="a">Download .pkl</Button>
                  <Button size="small" variant="outlined" startIcon={<SportsEsportsIcon />}
                    component={RouterLink} to={`/play?model=${finishedModelId}`}>Play with it</Button>
                  <Button size="small" variant="outlined" startIcon={<HubIcon />}
                    component={RouterLink} to={`/visualize?model=${finishedModelId}`}>Visualize</Button>
                  <Button size="small" variant="text" component={RouterLink} to="/models">All saved models -&gt;</Button>
                </Stack>
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, mb: 2 }}>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" alignItems="center">
              <Chip label={isRunning ? 'Training' : (status?.type || 'idle')}
                color={isRunning ? 'primary' : 'default'} />
              <Chip label={connected ? 'WS connected' : 'WS disconnected'}
                color={connected ? 'success' : 'default'} size="small" />
              <Chip label={`${history.length} gens`} variant="outlined" size="small" />
              <Chip label={`best ${bestFit}`} variant="outlined" size="small" />
              <Chip label={`mean ${meanFit}`} variant="outlined" size="small" />
              {latest && latest.species_count != null && (
                <Chip label={`${latest.species_count} species`} variant="outlined" size="small" />
              )}
            </Stack>

            <Typography variant="h6" sx={{ mb: 1 }}>Fitness over generations</Typography>
            <Box sx={{ width: '100%', height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="gen" stroke="#aaa" />
                  <YAxis stroke="#aaa" />
                  <Tooltip contentStyle={{ background: '#0a0e27', border: '1px solid #333' }} />
                  <Legend />
                  <Line type="monotone" dataKey="best" stroke="#00d4ff" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mean" stroke="#ff6b35" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          <Paper sx={{ p: 2 }}>
            <PopulationPreview aiModelId={finishedModelId} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}