import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Slider,
  TextField,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Settings,
  TrendingUp,
  Psychology,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const TrainModel = () => {
  const [isTraining, setIsTraining] = useState(false);
  const [trainingConfig, setTrainingConfig] = useState({
    population_size: 50,
    fitness_threshold: 1000,
    max_generations: 100,
    mutation_rate: 0.8,
    crossover_rate: 0.7,
  });
  const [trainingStats, setTrainingStats] = useState([]);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [bestFitness, setBestFitness] = useState(0);
  const [avgFitness, setAvgFitness] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Mock training data for demonstration
  useEffect(() => {
    if (isTraining) {
      const interval = setInterval(() => {
        setCurrentGeneration(prev => prev + 1);
        setBestFitness(prev => prev + Math.random() * 50);
        setAvgFitness(prev => prev + Math.random() * 30);
        
        setTrainingStats(prev => [
          ...prev,
          {
            generation: currentGeneration + 1,
            bestFitness: bestFitness + Math.random() * 50,
            avgFitness: avgFitness + Math.random() * 30,
            diversity: Math.random() * 20 + 5,
          }
        ]);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isTraining, currentGeneration, bestFitness, avgFitness]);

  const handleStartTraining = async () => {
    setIsTraining(true);
    setCurrentGeneration(0);
    setBestFitness(0);
    setAvgFitness(0);
    setTrainingStats([]);
    
    // TODO: Call backend API to start training
    console.log('Starting training with config:', trainingConfig);
  };

  const handleStopTraining = async () => {
    setIsTraining(false);
    // TODO: Call backend API to stop training
    console.log('Stopping training');
  };

  const handleResetTraining = () => {
    setIsTraining(false);
    setCurrentGeneration(0);
    setBestFitness(0);
    setAvgFitness(0);
    setTrainingStats([]);
  };

  const handleConfigChange = (field, value) => {
    setTrainingConfig(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" sx={{ mb: 4, fontWeight: 700 }}>
          🧠 Train AI Model
        </Typography>
      </motion.div>

      <Grid container spacing={4}>
        {/* Training Controls */}
        <Grid xs={12} md={4}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Training Controls
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={handleStartTraining}
                    disabled={isTraining}
                    sx={{
                      background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                      },
                    }}
                  >
                    Start
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Stop />}
                    onClick={handleStopTraining}
                    disabled={!isTraining}
                  >
                    Stop
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={handleResetTraining}
                    disabled={isTraining}
                  >
                    Reset
                  </Button>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Training Status
                  </Typography>
                  <Chip
                    label={isTraining ? 'Training Active' : 'Ready'}
                    color={isTraining ? 'success' : 'default'}
                    icon={isTraining ? <TrendingUp /> : <Psychology />}
                  />
                </Box>

                {isTraining && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(currentGeneration / trainingConfig.max_generations) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(255, 255, 255, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(45deg, #00d4ff, #00ff88)',
                        },
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Generation {currentGeneration} / {trainingConfig.max_generations}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Configuration
                  </Typography>
                  <Tooltip title="Advanced Settings">
                    <IconButton
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      sx={{ ml: 'auto' }}
                    >
                      <Settings />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Grid container spacing={2}>
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Population Size"
                      type="number"
                      value={trainingConfig.population_size}
                      onChange={(e) => handleConfigChange('population_size', parseInt(e.target.value))}
                      disabled={isTraining}
                    />
                  </Grid>
                  
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Fitness Threshold"
                      type="number"
                      value={trainingConfig.fitness_threshold}
                      onChange={(e) => handleConfigChange('fitness_threshold', parseInt(e.target.value))}
                      disabled={isTraining}
                    />
                  </Grid>
                  
                  <Grid xs={12}>
                    <TextField
                      fullWidth
                      label="Max Generations"
                      type="number"
                      value={trainingConfig.max_generations}
                      onChange={(e) => handleConfigChange('max_generations', parseInt(e.target.value))}
                      disabled={isTraining}
                    />
                  </Grid>

                  {showAdvanced && (
                    <>
                      <Grid xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Mutation Rate: {trainingConfig.mutation_rate}
                        </Typography>
                        <Slider
                          value={trainingConfig.mutation_rate}
                          onChange={(e, value) => handleConfigChange('mutation_rate', value)}
                          min={0}
                          max={1}
                          step={0.1}
                          disabled={isTraining}
                          sx={{
                            '& .MuiSlider-thumb': {
                              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                            },
                            '& .MuiSlider-track': {
                              background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Crossover Rate: {trainingConfig.crossover_rate}
                        </Typography>
                        <Slider
                          value={trainingConfig.crossover_rate}
                          onChange={(e, value) => handleConfigChange('crossover_rate', value)}
                          min={0}
                          max={1}
                          step={0.1}
                          disabled={isTraining}
                          sx={{
                            '& .MuiSlider-thumb': {
                              background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
                            },
                            '& .MuiSlider-track': {
                              background: 'linear-gradient(45deg, #00ff88, #00d4ff)',
                            },
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Training Visualization */}
        <Grid xs={12} md={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Training Progress
                </Typography>
                
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trainingStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis 
                      dataKey="generation" 
                      stroke="rgba(255, 255, 255, 0.7)"
                      label={{ value: 'Generation', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis stroke="rgba(255, 255, 255, 0.7)" />
                    <RechartsTooltip 
                      contentStyle={{
                        background: 'rgba(26, 26, 26, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 8,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="bestFitness"
                      stroke="#00d4ff"
                      strokeWidth={3}
                      dot={{ fill: '#00d4ff', strokeWidth: 2, r: 4 }}
                      name="Best Fitness"
                    />
                    <Line
                      type="monotone"
                      dataKey="avgFitness"
                      stroke="#ff6b35"
                      strokeWidth={2}
                      dot={{ fill: '#ff6b35', strokeWidth: 2, r: 3 }}
                      name="Average Fitness"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Stats */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Grid container spacing={2}>
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                      {currentGeneration}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Generation
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#00ff88', fontWeight: 700 }}>
                      {Math.round(bestFitness)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Best Fitness
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>
                      {Math.round(avgFitness)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average Fitness
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                      {trainingStats.length > 0 ? Math.round(trainingStats[trainingStats.length - 1]?.diversity || 0) : 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Diversity
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        </Grid>
      </Grid>

      {/* Training Log */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Training Log
            </Typography>
            
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {trainingStats.length === 0 ? (
                <Alert severity="info">
                  No training data available. Start training to see progress.
                </Alert>
              ) : (
                trainingStats.slice(-10).map((stat, index) => (
                  <Box key={index} sx={{ mb: 1, p: 1, borderRadius: 1, bgcolor: 'rgba(255, 255, 255, 0.05)' }}>
                    <Typography variant="body2">
                      Generation {stat.generation}: Best Fitness = {Math.round(stat.bestFitness)}, 
                      Avg Fitness = {Math.round(stat.avgFitness)}, 
                      Diversity = {Math.round(stat.diversity)}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};

export default TrainModel; 
