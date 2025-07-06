import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  Download,
  Upload,
  Delete,
  PlayArrow,
  Storage,
  Psychology,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const SavedModels = () => {
  const [models, setModels] = useState([
    {
      id: 1,
      name: 'dino_model_20241206_143022.pkl',
      size: 24576,
      fitness: 1250,
      generations: 45,
      date: '2024-12-06 14:30:22',
      status: 'trained',
    },
    {
      id: 2,
      name: 'dino_model_20241205_091545.pkl',
      size: 18944,
      fitness: 980,
      generations: 32,
      date: '2024-12-05 09:15:45',
      status: 'trained',
    },
    {
      id: 3,
      name: 'dino_model_20241204_163012.pkl',
      size: 32768,
      fitness: 1580,
      generations: 67,
      date: '2024-12-04 16:30:12',
      status: 'training',
    },
  ]);

  const [selectedModel, setSelectedModel] = useState(null);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [testDialog, setTestDialog] = useState(false);
  const [testResults, setTestResults] = useState(null);

  const handleTestModel = (model) => {
    setSelectedModel(model);
    setTestDialog(true);
    
    // Simulate test results
    setTimeout(() => {
      setTestResults({
        score: Math.floor(Math.random() * 1000) + 500,
        obstacles: Math.floor(Math.random() * 50) + 20,
        time: Math.floor(Math.random() * 60) + 30,
        accuracy: Math.floor(Math.random() * 20) + 80,
      });
    }, 2000);
  };

  const handleDeleteModel = (modelId) => {
    setModels(prev => prev.filter(model => model.id !== modelId));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" sx={{ mb: 4, fontWeight: 700 }}>
          💾 Saved Models
        </Typography>
      </motion.div>

      <Grid container spacing={4}>
        {/* Models List */}
        <Grid xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Trained Models
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<Upload />}
                    onClick={() => setUploadDialog(true)}
                    sx={{
                      background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #0099cc, #006699)',
                      },
                    }}
                  >
                    Upload Model
                  </Button>
                </Box>

                {models.length === 0 ? (
                  <Alert severity="info">
                    No saved models found. Train a model first or upload an existing one.
                  </Alert>
                ) : (
                  <List>
                    {models.map((model, index) => (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                      >
                        <ListItem
                          sx={{
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 2,
                            mb: 2,
                            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(255, 107, 53, 0.05))',
                            '&:hover': {
                              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(255, 107, 53, 0.1))',
                            },
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {model.name}
                                </Typography>
                                <Chip
                                  label={model.status}
                                  color={model.status === 'trained' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Grid container spacing={2}>
                                  <Grid xs={6} sm={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Storage fontSize="small" />
                                      <Typography variant="body2">
                                        {formatFileSize(model.size)}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid xs={6} sm={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <TrendingUp fontSize="small" />
                                      <Typography variant="body2">
                                        Fitness: {model.fitness}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid xs={6} sm={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Psychology fontSize="small" />
                                      <Typography variant="body2">
                                        Gen: {model.generations}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid xs={6} sm={3}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Schedule fontSize="small" />
                                      <Typography variant="body2">
                                        {new Date(model.date).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </Box>
                            }
                          />
                          <ListItemSecondaryAction>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton
                                onClick={() => handleTestModel(model)}
                                sx={{ color: '#00d4ff' }}
                              >
                                <PlayArrow />
                              </IconButton>
                              <IconButton
                                sx={{ color: '#00ff88' }}
                              >
                                <Download />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDeleteModel(model.id)}
                                sx={{ color: '#ff4757' }}
                              >
                                <Delete />
                              </IconButton>
                            </Box>
                          </ListItemSecondaryAction>
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Model Statistics */}
        <Grid xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Model Statistics
                </Typography>

                <Grid container spacing={2}>
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                        {models.length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Models
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>
                        {models.filter(m => m.status === 'trained').length}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Trained
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#00ff88', fontWeight: 700 }}>
                        {Math.max(...models.map(m => m.fitness))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Best Fitness
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                        {Math.round(models.reduce((acc, m) => acc + m.size, 0) / 1024)} KB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Size
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Quick Actions
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Upload />}
                    onClick={() => setUploadDialog(true)}
                    fullWidth
                  >
                    Upload Model
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    fullWidth
                  >
                    Export All
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Delete />}
                    color="error"
                    fullWidth
                  >
                    Clear All
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Model</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Model Name"
            variant="outlined"
            sx={{ mb: 2, mt: 1 }}
          />
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<Upload />}
          >
            Choose File
            <input type="file" hidden accept=".pkl" />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setUploadDialog(false)}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Test Results Dialog */}
      <Dialog open={testDialog} onClose={() => setTestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Test Results: {selectedModel?.name}
        </DialogTitle>
        <DialogContent>
          {testResults ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                      {testResults.score}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Final Score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>
                      {testResults.obstacles}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Obstacles Avoided
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00ff88', fontWeight: 700 }}>
                      {testResults.time}s
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Survival Time
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid xs={6}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                      {testResults.accuracy}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Accuracy
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Testing model...</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedModels; 
