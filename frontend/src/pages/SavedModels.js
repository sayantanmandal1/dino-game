import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Tooltip, Alert, Stack, Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HubIcon from '@mui/icons-material/Hub';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import { api, apiBase } from '../api/client';

export default function SavedModels() {
  const [models, setModels] = useState([]);
  const [err, setErr] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');

  const refresh = () => api('/api/models').then((r) => setModels(Array.isArray(r) ? r : (r.models || []))).catch((e) => setErr(e.message));
  useEffect(() => { refresh(); }, []);

  const del = async (id) => {
    if (!window.confirm('Delete this model?')) return;
    try { await api(`/api/models/${id}`, { method: 'DELETE' }); refresh(); }
    catch (e) { setErr(e.message); }
  };

  const upload = async () => {
    setUploadMsg('');
    if (!uploadFile) { setUploadMsg('error: choose a .pkl'); return; }
    const fd = new FormData();
    fd.append('name', uploadName || uploadFile.name);
    fd.append('file', uploadFile);
    try {
      const res = await fetch(`${apiBase()}/api/models/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      setUploadMsg('uploaded'); setUploadOpen(false);
      setUploadName(''); setUploadFile(null); refresh();
    } catch (e) { setUploadMsg(`error: ${e.message}`); }
  };

  return (
    <Box>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <Typography variant="h3" sx={{ flexGrow: 1 }}>Saved Models</Typography>
        <Button variant="contained" startIcon={<UploadIcon />} onClick={() => setUploadOpen(true)}>
          Upload .pkl
        </Button>
      </Stack>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
      {uploadMsg && <Alert severity={uploadMsg.startsWith('error') ? 'error' : 'success'} sx={{ mb: 2 }}>{uploadMsg}</Alert>}

      <Paper>
        {models.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', opacity: 0.7 }}>
            <Typography>No saved models yet — train one on the <RouterLink to="/train" style={{ color: '#00d4ff' }}>Train</RouterLink> page.</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell align="right">Fitness</TableCell>
                <TableCell align="right">Nodes</TableCell>
                <TableCell align="right">Conn</TableCell>
                <TableCell align="right">Gens</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2">{m.name}</Typography>
                      {m.source && <Chip size="small" label={m.source} variant="outlined" />}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{Number(m.fitness || 0).toFixed(2)}</TableCell>
                  <TableCell align="right">{m.node_count ?? '—'}</TableCell>
                  <TableCell align="right">{m.connection_count ?? '—'}</TableCell>
                  <TableCell align="right">{m.generations ?? '—'}</TableCell>
                  <TableCell>{m.created_at ? new Date(m.created_at).toLocaleString() : '—'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Play with this AI">
                      <IconButton size="small" component={RouterLink} to={`/play?model=${m.id}`}>
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Visualize">
                      <IconButton size="small" component={RouterLink} to={`/visualize?model=${m.id}`}>
                        <HubIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download .pkl">
                      <IconButton size="small" component="a" href={`${apiBase()}/api/models/${m.id}/download`}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => del(m.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
        <DialogTitle>Upload a genome (.pkl)</DialogTitle>
        <DialogContent>
          <TextField fullWidth margin="dense" label="Model name" value={uploadName}
            onChange={(e) => setUploadName(e.target.value)} />
          <Button variant="outlined" component="label" sx={{ mt: 2 }}>
            Choose file
            <input type="file" accept=".pkl" hidden
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
          </Button>
          {uploadFile && <Typography variant="body2" sx={{ mt: 1 }}>{uploadFile.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={upload}>Upload</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}