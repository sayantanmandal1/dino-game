import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Slider,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Psychology,
  NetworkCheck,
  Analytics,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const VisualizeModel = () => {
  const canvasRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showWeights, setShowWeights] = useState(true);
  const [showActivations, setShowActivations] = useState(true);

  // Mock neural network data
  const [networkData, setNetworkData] = useState({
    nodes: [
      { id: 'input_0', type: 'input', x: 50, y: 100, activation: 0.8 },
      { id: 'input_1', type: 'input', x: 50, y: 150, activation: 0.6 },
      { id: 'input_2', type: 'input', x: 50, y: 200, activation: 0.9 },
      { id: 'input_3', type: 'input', x: 50, y: 250, activation: 0.3 },
      { id: 'input_4', type: 'input', x: 50, y: 300, activation: 0.7 },
      
      { id: 'hidden_5', type: 'hidden', x: 200, y: 120, activation: 0.75 },
      { id: 'hidden_6', type: 'hidden', x: 200, y: 180, activation: 0.45 },
      { id: 'hidden_7', type: 'hidden', x: 200, y: 240, activation: 0.82 },
      
      { id: 'output_8', type: 'output', x: 350, y: 150, activation: 0.91 },
      { id: 'output_9', type: 'output', x: 350, y: 200, activation: 0.23 },
      { id: 'output_10', type: 'output', x: 350, y: 250, activation: 0.67 },
    ],
    connections: [
      { from: 'input_0', to: 'hidden_5', weight: 0.8 },
      { from: 'input_0', to: 'hidden_6', weight: -0.3 },
      { from: 'input_1', to: 'hidden_5', weight: 0.6 },
      { from: 'input_1', to: 'hidden_7', weight: 0.9 },
      { from: 'input_2', to: 'hidden_6', weight: 0.4 },
      { from: 'input_2', to: 'hidden_7', weight: -0.2 },
      { from: 'input_3', to: 'hidden_5', weight: 0.1 },
      { from: 'input_3', to: 'hidden_6', weight: 0.7 },
      { from: 'input_4', to: 'hidden_7', weight: 0.5 },
      
      { from: 'hidden_5', to: 'output_8', weight: 0.9 },
      { from: 'hidden_5', to: 'output_9', weight: -0.4 },
      { from: 'hidden_6', to: 'output_8', weight: 0.3 },
      { from: 'hidden_6', to: 'output_10', weight: 0.8 },
      { from: 'hidden_7', to: 'output_9', weight: 0.6 },
      { from: 'hidden_7', to: 'output_10', weight: 0.2 },
    ],
  });

  const [trainingHistory] = useState([
    { generation: 1, bestFitness: 150, avgFitness: 120, diversity: 8 },
    { generation: 2, bestFitness: 180, avgFitness: 140, diversity: 7 },
    { generation: 3, bestFitness: 220, avgFitness: 160, diversity: 9 },
    { generation: 4, bestFitness: 280, avgFitness: 190, diversity: 6 },
    { generation: 5, bestFitness: 350, avgFitness: 220, diversity: 8 },
    { generation: 6, bestFitness: 420, avgFitness: 250, diversity: 7 },
    { generation: 7, bestFitness: 500, avgFitness: 280, diversity: 9 },
    { generation: 8, bestFitness: 580, avgFitness: 320, diversity: 6 },
    { generation: 9, bestFitness: 650, avgFitness: 350, diversity: 8 },
    { generation: 10, bestFitness: 720, avgFitness: 380, diversity: 7 },
  ]);

  const [performanceData] = useState([
    { metric: 'Accuracy', value: 95, color: '#00d4ff' },
    { metric: 'Precision', value: 92, color: '#ff6b35' },
    { metric: 'Recall', value: 88, color: '#00ff88' },
    { metric: 'F1-Score', value: 90, color: '#ffaa00' },
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;

    const drawNetwork = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      networkData.connections.forEach(connection => {
        const fromNode = networkData.nodes.find(n => n.id === connection.from);
        const toNode = networkData.nodes.find(n => n.id === connection.to);
        
        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          
          // Color based on weight
          const weight = connection.weight;
          const alpha = Math.abs(weight);
          const color = weight > 0 ? `rgba(0, 212, 255, ${alpha})` : `rgba(255, 107, 53, ${alpha})`;
          
          ctx.strokeStyle = color;
          ctx.lineWidth = Math.abs(weight) * 3 + 1;
          ctx.stroke();

          // Draw weight label
          if (showWeights) {
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            const midX = (fromNode.x + toNode.x) / 2;
            const midY = (fromNode.y + toNode.y) / 2;
            ctx.fillText(weight.toFixed(2), midX, midY);
          }
        }
      });

      // Draw nodes
      networkData.nodes.forEach(node => {
        // Node circle
        const radius = 20;
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        
        // Color based on type and activation
        let color;
        if (node.type === 'input') {
          color = `rgba(0, 212, 255, ${node.activation})`;
        } else if (node.type === 'hidden') {
          color = `rgba(255, 107, 53, ${node.activation})`;
        } else {
          color = `rgba(0, 255, 136, ${node.activation})`;
        }
        
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.id.split('_')[1], node.x, node.y + 4);

        // Activation value
        if (showActivations) {
          ctx.font = '10px Arial';
          ctx.fillText(node.activation.toFixed(2), node.x, node.y + 20);
        }
      });
    };

    drawNetwork();

    if (isAnimating) {
      const animate = () => {
        // Animate activations
        setNetworkData(prev => ({
          ...prev,
          nodes: prev.nodes.map(node => ({
            ...node,
            activation: Math.random() * 0.5 + 0.3,
          })),
        }));
      };

      const interval = setInterval(animate, 1000 / animationSpeed);
      return () => clearInterval(interval);
    }
  }, [networkData, isAnimating, animationSpeed, showWeights, showActivations]);

  return (
    <Box>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Typography variant="h2" sx={{ mb: 4, fontWeight: 700 }}>
          📊 Visualize Model
        </Typography>
      </motion.div>

      <Grid container spacing={4}>
        {/* Neural Network Visualization */}
        <Grid xs={12} lg={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Neural Network Architecture
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      icon={<Psychology />}
                      label="5 Inputs"
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<NetworkCheck />}
                      label="3 Hidden"
                      color="secondary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Analytics />}
                      label="3 Outputs"
                      color="success"
                      variant="outlined"
                    />
                  </Box>
                </Box>

                <Box
                  sx={{
                    border: '2px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    background: 'rgba(26, 26, 26, 0.9)',
                  }}
                >
                  <canvas
                    ref={canvasRef}
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isAnimating}
                        onChange={(e) => setIsAnimating(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Animate"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showWeights}
                        onChange={(e) => setShowWeights(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Show Weights"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={showActivations}
                        onChange={(e) => setShowActivations(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Show Activations"
                  />
                </Box>

                {isAnimating && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Animation Speed: {animationSpeed}x
                    </Typography>
                    <Slider
                      value={animationSpeed}
                      onChange={(e, value) => setAnimationSpeed(value)}
                      min={0.5}
                      max={3}
                      step={0.5}
                      sx={{
                        '& .MuiSlider-thumb': {
                          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                        },
                        '& .MuiSlider-track': {
                          background: 'linear-gradient(45deg, #00d4ff, #ff6b35)',
                        },
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Training Analytics */}
        <Grid xs={12} lg={4}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Training Analytics
                </Typography>
                
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trainingHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="generation" stroke="rgba(255, 255, 255, 0.7)" />
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
                      strokeWidth={2}
                      dot={{ fill: '#00d4ff', r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="avgFitness"
                      stroke="#ff6b35"
                      strokeWidth={2}
                      dot={{ fill: '#ff6b35', r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Metrics */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
                  Performance Metrics
                </Typography>
                
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                    <XAxis dataKey="metric" stroke="rgba(255, 255, 255, 0.7)" />
                    <YAxis stroke="rgba(255, 255, 255, 0.7)" />
                    <RechartsTooltip 
                      contentStyle={{
                        background: 'rgba(26, 26, 26, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="value" fill="#00d4ff" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>

      {/* Network Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                  {networkData.nodes.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Nodes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ff6b35', fontWeight: 700 }}>
                  {networkData.connections.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connections
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#00ff88', fontWeight: 700 }}>
                  {networkData.nodes.filter(n => n.type === 'input').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Input Nodes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ color: '#ffaa00', fontWeight: 700 }}>
                  {networkData.nodes.filter(n => n.type === 'output').length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Output Nodes
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default VisualizeModel; 
