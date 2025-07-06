import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Psychology,
  Speed,
  TrendingUp,
} from '@mui/icons-material';

// Import game assets
import dinoRun1 from '../assets/Dino/DinoRun1.png';
import dinoRun2 from '../assets/Dino/DinoRun2.png';
import dinoJump from '../assets/Dino/DinoJump.png';
import dinoDuck1 from '../assets/Dino/DinoDuck1.png';
import dinoDuck2 from '../assets/Dino/DinoDuck2.png';
import dinoDead from '../assets/Dino/DinoDead.png';
import dinoStart from '../assets/Dino/DinoStart.png';

import smallCactus1 from '../assets/Cactus/SmallCactus1.png';
import smallCactus2 from '../assets/Cactus/SmallCactus2.png';
import smallCactus3 from '../assets/Cactus/SmallCactus3.png';
import largeCactus1 from '../assets/Cactus/LargeCactus1.png';
import largeCactus2 from '../assets/Cactus/LargeCactus2.png';
import largeCactus3 from '../assets/Cactus/LargeCactus3.png';

import bird1 from '../assets/Bird/Bird1.png';
import bird2 from '../assets/Bird/Bird2.png';

import cloud from '../assets/Other/Cloud.png';
import ground from '../assets/Other/Track.png';

// Chrome Dino Game Constants (exact values)
const GRAVITY = 0.6;
const JUMP_STRENGTH = -12;
// const GROUND_Y = 0; // Not used
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 300;
const DINO_WIDTH = 60;
const DINO_HEIGHT = 60;
const DINO_X = 50;
const DINO_Y = CANVAS_HEIGHT - 90;
const BASE_SPEED = 6;
const SPEED_INCREMENT = 0.001;
const MAX_SPEED = 12;
const MIN_OBSTACLE_DISTANCE = 200; // Minimum distance between obstacles
const OBSTACLE_SPAWN_RATE = 0.02;
const BIRD_SPAWN_RATE = 0.3; // 30% chance for birds

const PlayGame = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gameStateRef = useRef({
    score: 0,
    currentSpeed: BASE_SPEED,
    groundX: 0,
    obstacles: [],
    clouds: [],
    dinoY: 0,
    dinoVelocity: 0,
    dinoState: 'running',
    animationFrame: 0,
    isPlaying: false,
    gameOver: false,
    isDucking: false,
    lastObstacleX: CANVAS_WIDTH,
    lastTime: 0
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isDucking, setIsDucking] = useState(false);
  const [score, setScore] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState(BASE_SPEED);
  const [aiTraining, setAiTraining] = useState(false);
  const [aiProgress, setAiProgress] = useState(0);
  const [aiGeneration, setAiGeneration] = useState(0);
  const [aiBestScore, setAiBestScore] = useState(0);
  const [aiStatus, setAiStatus] = useState('');

  // Load images
  const [images, setImages] = useState({});
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);

  // Ensure canvas is ready after component mounts
  useEffect(() => {
    if (canvasRef.current && !canvasReady) {
      setCanvasReady(true);
    }
  }, [canvasReady]);

  useEffect(() => {
    const loadImages = async () => {
      try {
        const imageList = {
          dinoRun1, dinoRun2, dinoJump, dinoDuck1, dinoDuck2, dinoDead, dinoStart,
          smallCactus1, smallCactus2, smallCactus3, largeCactus1, largeCactus2, largeCactus3,
          bird1, bird2, cloud, ground
        };

        const loadedImages = {};
        const loadPromises = Object.entries(imageList).map(([key, src]) => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              loadedImages[key] = img;
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load image: ${key}`, src);
              reject(new Error(`Failed to load ${key}`));
            };
            img.src = src;
          });
        });

        await Promise.all(loadPromises);
        console.log('All images loaded successfully');
        setImages(loadedImages);
        setImagesLoaded(true);
      } catch (error) {
        console.error('Error loading images:', error);
        setImagesLoaded(true);
      }
    };

    loadImages();
  }, []);

  // NEAT AI Training
  const startAiTraining = async () => {
    setAiTraining(true);
    setAiStatus('Starting NEAT training...');
    setAiProgress(0);
    setAiGeneration(0);
    setAiBestScore(0);

    try {
      const response = await fetch('http://localhost:8000/train-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          generations: 1000,
          population_size: 50,
          game_config: {
            gravity: GRAVITY,
            jump_strength: JUMP_STRENGTH,
            base_speed: BASE_SPEED,
            max_speed: MAX_SPEED
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start AI training');
      }

      // Start listening for training updates
      const eventSource = new EventSource('http://localhost:8000/training-updates');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          setAiProgress(data.progress);
          setAiGeneration(data.generation);
          setAiBestScore(data.best_score);
          setAiStatus(`Generation ${data.generation}: Best Score ${data.best_score}`);
        } else if (data.type === 'complete') {
          setAiTraining(false);
          setAiStatus('Training complete! AI ready to play.');
          eventSource.close();
        }
      };

      eventSource.onerror = () => {
        setAiTraining(false);
        setAiStatus('Training failed. Please try again.');
        eventSource.close();
      };

    } catch (error) {
      console.error('AI training error:', error);
      setAiTraining(false);
      setAiStatus('Training failed. Please check backend connection.');
    }
  };

  // Game loop - Chrome exact mechanics
  const gameLoop = useCallback((currentTime) => {
    const canvas = canvasRef.current;
    if (!canvas || !imagesLoaded || !canvasReady) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const gameState = gameStateRef.current;
    if (!gameState.isPlaying) return;

    // Calculate delta time for consistent speed
    const deltaTime = currentTime - gameState.lastTime;
    const frameTime = 1000 / 60; // Target 60 FPS
    const timeScale = deltaTime / frameTime;
    gameState.lastTime = currentTime;

    // Clear canvas
    ctx.fillStyle = '#f7f7f7';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw ground
    if (images.ground) {
      const groundPattern = ctx.createPattern(images.ground, 'repeat');
      ctx.fillStyle = groundPattern;
      ctx.fillRect(gameState.groundX, CANVAS_HEIGHT - 30, CANVAS_WIDTH + 100, 30);
    } else {
      ctx.fillStyle = '#535353';
      ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 30);
    }

    // Update ground position
    gameState.groundX = (gameState.groundX - gameState.currentSpeed * timeScale) % 100;

    // Update dino physics (Chrome exact)
    if (gameState.dinoState === 'jumping') {
      gameState.dinoVelocity += GRAVITY * timeScale;
      gameState.dinoY += gameState.dinoVelocity * timeScale;
      
      if (gameState.dinoY >= 0) {
        gameState.dinoY = 0;
        gameState.dinoVelocity = 0;
        gameState.dinoState = 'running';
      }
    }

    // Draw dino with proper animations and hitbox
    let dinoImage = images.dinoStart;
    let dinoHeight = DINO_HEIGHT;
    let dinoY = DINO_Y + gameState.dinoY;
    if (gameState.dinoState === 'dead') {
      dinoImage = images.dinoDead;
    } else if (gameState.dinoState === 'jumping') {
      dinoImage = images.dinoJump;
    } else if (gameState.isDucking && gameState.dinoState === 'running') {
      dinoImage = gameState.animationFrame % 20 < 10 ? images.dinoDuck1 : images.dinoDuck2;
      dinoHeight = 30;
      dinoY = DINO_Y + DINO_HEIGHT - dinoHeight + gameState.dinoY;
    } else {
      dinoImage = gameState.animationFrame % 20 < 10 ? images.dinoRun1 : images.dinoRun2;
    }

    if (dinoImage) {
      ctx.drawImage(dinoImage, DINO_X, dinoY, DINO_WIDTH, dinoHeight);
    } else {
      ctx.fillStyle = '#535353';
      ctx.fillRect(DINO_X, dinoY, DINO_WIDTH, dinoHeight);
    }

    // Update dino hitbox for collision
    const dinoRect = {
      x: DINO_X + 10,
      y: dinoY + 5,
      width: DINO_WIDTH - 20,
      height: dinoHeight - 10
    };

    // Update and draw obstacles with proper spacing
    const newObstacles = gameState.obstacles
      .map(obs => ({ ...obs, x: obs.x - gameState.currentSpeed * timeScale }))
      .filter(obs => obs.x > -100);

    // Spawn new obstacles with proper distance
    const canSpawnObstacle = gameState.lastObstacleX - CANVAS_WIDTH > MIN_OBSTACLE_DISTANCE;
    if (canSpawnObstacle && Math.random() < OBSTACLE_SPAWN_RATE) {
      const isBird = Math.random() < BIRD_SPAWN_RATE;
      
      if (isBird) {
        const birdY = Math.random() < 0.5 ? CANVAS_HEIGHT - 120 : CANVAS_HEIGHT - 80;
        newObstacles.push({
          x: CANVAS_WIDTH,
          y: birdY,
          width: 60,
          height: 40,
          type: 'bird',
          image: Math.random() < 0.5 ? images.bird1 : images.bird2,
          animationFrame: 0
        });
      } else {
        const cactusTypes = [images.smallCactus1, images.smallCactus2, images.smallCactus3, 
                           images.largeCactus1, images.largeCactus2, images.largeCactus3];
        const cactusImage = cactusTypes[Math.floor(Math.random() * cactusTypes.length)];
        newObstacles.push({
          x: CANVAS_WIDTH,
          y: CANVAS_HEIGHT - 90,
          width: 30,
          height: 60,
          type: 'cactus',
          image: cactusImage
        });
      }
      gameState.lastObstacleX = CANVAS_WIDTH;
    } else if (gameState.obstacles.length === 0 && Math.random() < 0.01) {
      // Spawn first obstacle if none exist
      const isBird = Math.random() < BIRD_SPAWN_RATE;
      if (isBird) {
        const birdY = Math.random() < 0.5 ? CANVAS_HEIGHT - 120 : CANVAS_HEIGHT - 80;
        newObstacles.push({
          x: CANVAS_WIDTH,
          y: birdY,
          width: 60,
          height: 40,
          type: 'bird',
          image: Math.random() < 0.5 ? images.bird1 : images.bird2,
          animationFrame: 0
        });
      } else {
        const cactusTypes = [images.smallCactus1, images.smallCactus2, images.smallCactus3, 
                           images.largeCactus1, images.largeCactus2, images.largeCactus3];
        const cactusImage = cactusTypes[Math.floor(Math.random() * cactusTypes.length)];
        newObstacles.push({
          x: CANVAS_WIDTH,
          y: CANVAS_HEIGHT - 90,
          width: 30,
          height: 60,
          type: 'cactus',
          image: cactusImage
        });
      }
      gameState.lastObstacleX = CANVAS_WIDTH;
    }

    gameState.obstacles = newObstacles;

    // Draw obstacles
    gameState.obstacles.forEach(obs => {
      if (obs.type === 'bird') {
        const birdImage = obs.animationFrame % 20 < 10 ? images.bird1 : images.bird2;
        if (birdImage) {
          ctx.drawImage(birdImage, obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = '#ff6b35';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
        obs.animationFrame++;
      } else {
        if (obs.image) {
          ctx.drawImage(obs.image, obs.x, obs.y, obs.width, obs.height);
        } else {
          ctx.fillStyle = '#00d4ff';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        }
      }
    });

    // Update and draw clouds
    const newClouds = gameState.clouds
      .map(cloud => ({ ...cloud, x: cloud.x - gameState.currentSpeed * 0.2 * timeScale }))
      .filter(cloud => cloud.x > -100);

    if (Math.random() < 0.005) {
      newClouds.push({
        x: CANVAS_WIDTH,
        y: Math.random() * 100 + 50,
        width: 80,
        height: 40
      });
    }

    gameState.clouds = newClouds;

    // Draw clouds
    gameState.clouds.forEach(cloud => {
      if (images.cloud) {
        ctx.drawImage(images.cloud, cloud.x, cloud.y, cloud.width, cloud.height);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
      }
    });

    // Check collisions with proper hitboxes
    const collision = gameState.obstacles.some(obs => {
      const obsRect = {
        x: obs.x + 5,
        y: obs.y + 5,
        width: obs.width - 10,
        height: obs.height - 10
      };
      
      return dinoRect.x < obsRect.x + obsRect.width &&
             dinoRect.x + dinoRect.width > obsRect.x &&
             dinoRect.y < obsRect.y + obsRect.height &&
             dinoRect.y + dinoRect.height > obsRect.y;
    });

    if (collision && gameState.dinoState !== 'dead') {
      gameState.dinoState = 'dead';
      gameState.isPlaying = false;
      setGameOver(true);
      setIsPlaying(false);
      if (gameState.score > highScore) {
        setHighScore(gameState.score);
      }
      return;
    }

    // Update score and speed (Chrome exact)
    if (!gameState.gameOver && gameState.dinoState !== 'dead') {
      gameState.score++;
      setScore(gameState.score);
      
      // Speed increases every 100 points
      if (gameState.score % 100 === 0) {
        gameState.currentSpeed = Math.min(gameState.currentSpeed + SPEED_INCREMENT, MAX_SPEED);
        setCurrentSpeed(gameState.currentSpeed);
      }
    }

    // Update animation frame
    gameState.animationFrame++;

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [images, imagesLoaded, canvasReady, highScore]);

  // Start game loop when playing
  useEffect(() => {
    if (isPlaying) {
      gameStateRef.current.isPlaying = true;
      gameStateRef.current.lastTime = performance.now();
      animationRef.current = requestAnimationFrame(gameLoop);
    } else {
      gameStateRef.current.isPlaying = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, gameLoop]);

  const handleJump = useCallback(() => {
    const gameState = gameStateRef.current;
    if (gameState.dinoState === 'running' && !gameState.gameOver) {
      gameState.dinoVelocity = JUMP_STRENGTH;
      gameState.dinoState = 'jumping';
      setIsDucking(false);
      gameState.isDucking = false;
    }
  }, []);

  const handleDuck = useCallback((ducking) => {
    const gameState = gameStateRef.current;
    if (!gameState.gameOver && gameState.dinoState === 'running') {
      gameState.isDucking = ducking;
      setIsDucking(ducking);
    }
  }, []);

  const handleStart = useCallback(() => {
    gameStateRef.current = {
      score: 0,
      currentSpeed: BASE_SPEED,
      groundX: 0,
      obstacles: [],
      clouds: [],
      dinoY: 0,
      dinoVelocity: 0,
      dinoState: 'running',
      animationFrame: 0,
      isPlaying: true,
      gameOver: false,
      isDucking: false,
      lastObstacleX: CANVAS_WIDTH,
      lastTime: 0
    };
    setScore(0);
    setCurrentSpeed(BASE_SPEED);
    setGameOver(false);
    setIsPlaying(true);
    setIsDucking(false);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleReset = () => {
    gameStateRef.current = {
      score: 0,
      currentSpeed: BASE_SPEED,
      groundX: 0,
      obstacles: [],
      clouds: [],
      dinoY: 0,
      dinoVelocity: 0,
      dinoState: 'running',
      animationFrame: 0,
      isPlaying: false,
      gameOver: false,
      isDucking: false,
      lastObstacleX: CANVAS_WIDTH,
      lastTime: 0
    };
    setScore(0);
    setCurrentSpeed(BASE_SPEED);
    setGameOver(false);
    setIsPlaying(false);
    setIsDucking(false);
  };

  // AI decision using trained model
  const getAiDecision = useCallback(async (gameState, obstacle) => {
    try {
      const response = await fetch('http://localhost:8000/ai-decision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          score: gameState.score,
          current_speed: gameState.currentSpeed,
          dino_y: gameState.dinoY,
          dino_velocity: gameState.dinoVelocity,
          dino_state: gameState.dinoState,
          is_ducking: gameState.isDucking,
          obstacles: gameState.obstacles,
          game_over: gameState.gameOver
        })
      });

      if (response.ok) {
        const decision = await response.json();
        return decision.action;
      }
    } catch (error) {
      console.error('AI decision error:', error);
    }
    
    // Fallback to simple logic
    const distance = obstacle.x - DINO_X;
    const dinoY = gameState.dinoY;
    const isDucking = gameState.isDucking;
    
    if (obstacle.type === 'bird') {
      if (obstacle.y > CANVAS_HEIGHT - 100) {
        return 'duck'; // Low bird, duck
      } else {
        return 'jump'; // High bird, jump
      }
    } else {
      // Cactus
      if (distance < 100 && dinoY === 0 && !isDucking) {
        return 'jump';
      }
    }
    
    return 'none';
  }, []);

  // AI logic with trained model
  useEffect(() => {
    if (isAIMode && isPlaying && !gameOver && !aiTraining) {
      const gameState = gameStateRef.current;
      const nearestObstacle = gameState.obstacles.find(obs => obs.x > DINO_X);
      
      if (nearestObstacle && nearestObstacle.x < DINO_X + 200) {
        // Use trained AI model to make decision
        getAiDecision(gameState, nearestObstacle).then(decision => {
          if (decision === 'jump') {
            handleJump();
          } else if (decision === 'duck') {
            handleDuck(true);
          } else {
            handleDuck(false);
          }
        });
      } else {
        handleDuck(false);
      }
    }
  }, [isAIMode, isPlaying, gameOver, aiTraining, handleJump, handleDuck, getAiDecision]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (isPlaying && !gameOver) {
          handleJump();
        }
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        if (isPlaying && !gameOver) {
          handleDuck(true);
        }
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        if (isPlaying) {
          handlePause();
        } else {
          handleStart();
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'ArrowDown') {
        if (isPlaying && !gameOver) {
          handleDuck(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleDuck, isPlaying, gameOver, handlePause, handleStart]);

  return (
    <Box sx={{ 
      p: 3, 
      minHeight: '100vh', 
      background: '#f7f7f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Typography 
        variant="h2" 
        sx={{ 
          mb: 4, 
          textAlign: 'center', 
          fontWeight: 700,
          color: '#535353',
          fontSize: { xs: '2rem', md: '3rem' }
        }}
      >
        Chrome Dinosaur Game
      </Typography>

      {/* Game Canvas - Chrome Style */}
      <Box sx={{ 
        position: 'relative', 
        border: '2px solid #535353',
        borderRadius: '4px',
        background: '#f7f7f7',
        mb: 3
      }}>
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            background: '#f7f7f7',
          }}
        />
        
        {/* Start Game Button - Chrome style */}
        {!isPlaying && !gameOver && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
            onClick={handleStart}
          >
            <Typography variant="h4" sx={{ color: '#535353', fontWeight: 600 }}>
              Press SPACE to start
            </Typography>
          </Box>
        )}

        {/* Game Over Screen - Chrome style */}
        {gameOver && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.9)',
              color: '#535353',
              padding: 3,
              borderRadius: 2,
              minWidth: 200,
            }}
          >
            <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>
              Game Over
            </Typography>
            <Typography variant="h5" sx={{ mb: 3 }}>
              Score: {score}
            </Typography>
            <Button
              variant="contained"
              onClick={handleStart}
              sx={{
                background: '#535353',
                '&:hover': {
                  background: '#333',
                },
              }}
            >
              Play Again
            </Button>
          </Box>
        )}
      </Box>

      {/* AI Training Status */}
      {aiTraining && (
        <Card sx={{ mb: 3, width: '100%', maxWidth: 800 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              <Psychology sx={{ mr: 1 }} />
              NEAT AI Learning in Progress
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {aiStatus || 'AI is learning to play the game from scratch...'}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={aiProgress} 
              sx={{ mb: 2, height: 8 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2">
                Generation: {aiGeneration}/100+
              </Typography>
              <Typography variant="body2">
                Best Score: {aiBestScore}
              </Typography>
            </Box>
            <Alert severity="info" sx={{ mt: 2 }}>
              Watch the AI learn! Each generation improves the neural network's ability to play the game.
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Controls and Stats */}
      <Grid container spacing={2} sx={{ maxWidth: '1000px' }}>
        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Controls
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                SPACE or ↑ - Jump
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ↓ - Duck
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                P - Pause
              </Typography>
              
              <Button
                variant="contained"
                onClick={isPlaying ? handlePause : handleStart}
                disabled={!imagesLoaded || !canvasReady}
                sx={{ mr: 1 }}
              >
                {isPlaying ? 'Pause' : 'Start'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleReset}
              >
                Reset
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Stats
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Score: {score}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                High Score: {highScore}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Speed: {currentSpeed.toFixed(1)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Status: {isPlaying ? 'Playing' : gameOver ? 'Game Over' : 'Ready'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                AI Mode
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={isAIMode}
                    onChange={(e) => setIsAIMode(e.target.checked)}
                    disabled={aiTraining}
                  />
                }
                label="Enable AI"
              />
              {!aiTraining && (
                <Button
                  variant="outlined"
                  onClick={startAiTraining}
                  startIcon={<TrendingUp />}
                  sx={{ mt: 2, width: '100%' }}
                >
                  Train AI (1000 epochs)
                </Button>
              )}
              <Box sx={{ mt: 2 }}>
                <Chip
                  label={`Canvas: ${canvasReady ? 'Ready' : 'Loading'}`}
                  color={canvasReady ? 'success' : 'warning'}
                  size="small"
                />
                <Chip
                  label={`Images: ${imagesLoaded ? 'Loaded' : 'Loading'}`}
                  color={imagesLoaded ? 'success' : 'warning'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Game Info
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <Speed sx={{ fontSize: 16, mr: 0.5 }} />
                Base Speed: {BASE_SPEED}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Max Speed: {MAX_SPEED}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Jump Strength: {Math.abs(JUMP_STRENGTH)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Gravity: {GRAVITY}
              </Typography>
              <Alert severity="info" sx={{ mt: 2 }}>
                Chrome-exact physics and mechanics
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PlayGame; 
