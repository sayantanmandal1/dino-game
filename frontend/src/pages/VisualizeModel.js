import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Paper, FormControl, InputLabel, Select, MenuItem,
  Stack, Chip, Alert,
} from '@mui/material';
import NetworkGraph from '../components/NetworkGraph';
import { api } from '../api/client';

export default function VisualizeModel() {
  const [params, setParams] = useSearchParams();
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState(params.get('model') || '');
  const [graph, setGraph] = useState(null);
  const [model, setModel] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    api('/api/models').then((r) => setModels(Array.isArray(r) ? r : (r.models || []))).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!modelId) { setGraph(null); setModel(null); return; }
    setErr('');
    api(`/api/models/${modelId}`).then(setModel).catch((e) => setErr(e.message));
    api(`/api/models/${modelId}/graph`).then(setGraph).catch((e) => setErr(e.message));
    setParams((p) => { p.set('model', modelId); return p; }, { replace: true });
  }, [modelId, setParams]);

  return (
    <Box>
      <Typography variant="h3" sx={{ mb: 2 }}>Visualize</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 260 }}>
            <InputLabel>Model</InputLabel>
            <Select value={modelId} label="Model" onChange={(e) => setModelId(e.target.value)}>
              <MenuItem value=""><em>Select…</em></MenuItem>
              {models.map((m) => <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>)}
            </Select>
          </FormControl>
          {graph && (
            <>
              <Chip size="small" variant="outlined" label={`${graph.nodes?.length ?? 0} nodes`} />
              <Chip size="small" variant="outlined" label={`${graph.connections?.length ?? 0} conns`} />
            </>
          )}
          {model && (
            <>
              <Chip size="small" variant="outlined" label={`fitness ${Number(model.fitness || 0).toFixed(2)}`} />
              <Chip size="small" variant="outlined" label={`gen ${model.generations ?? 0}`} />
            </>
          )}
        </Stack>
      </Paper>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      <Paper sx={{ p: 2, minHeight: 480 }}>
        {graph ? <NetworkGraph graph={graph} /> : (
          <Typography sx={{ opacity: 0.7, textAlign: 'center', py: 6 }}>
            Select a model to visualize.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}