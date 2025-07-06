from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
import time
from typing import List, Dict, Any
import numpy as np
import pickle
import os
from datetime import datetime

# NEAT imports
try:
    import neat
    import neat.nn
    from neat import DefaultGenome, DefaultReproduction, DefaultSpeciesSet, DefaultStagnation
    from neat.config import Config
    from neat.parallel import ParallelEvaluator
    from neat.six_util import iteritems, itervalues
    NEAT_AVAILABLE = True
except ImportError:
    NEAT_AVAILABLE = False
    print("NEAT not available. Install with: pip install neat-python")

app = FastAPI(title="Chrome Dino Game AI Backend", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Game configuration
GAME_CONFIG = {
    "gravity": 0.6,
    "jump_strength": -12,
    "base_speed": 6,
    "max_speed": 12,
    "canvas_width": 800,
    "canvas_height": 300,
    "dino_x": 50,
    "dino_y": 210,
    "min_obstacle_distance": 200
}

class TrainingRequest(BaseModel):
    generations: int = 1000
    population_size: int = 50
    game_config: Dict[str, Any] = GAME_CONFIG

class GameState(BaseModel):
    score: int
    current_speed: float
    dino_y: float
    dino_velocity: float
    dino_state: str
    is_ducking: bool
    obstacles: List[Dict[str, Any]]
    game_over: bool

class AIDecision(BaseModel):
    action: str  # "jump", "duck", "none"
    confidence: float

# Global variables for training
training_progress = {
    "is_training": False,
    "current_generation": 0,
    "best_score": 0,
    "best_genome": None
}

# NEAT Configuration
def create_neat_config():
    config = Config(
        DefaultGenome,
        DefaultReproduction,
        DefaultSpeciesSet,
        DefaultStagnation,
        'neat_config.txt'
    )
    
    # Create config file if it doesn't exist
    if not os.path.exists('neat_config.txt'):
        config_content = """
[NEAT]
fitness_criterion     = max
fitness_threshold     = 5000
pop_size              = 50
reset_on_extinction   = False

[DefaultGenome]
# node activation options
activation_default      = tanh
activation_mutate_rate = 0.0
activation_options     = tanh

# node add/remove rates
node_add_prob           = 0.2
node_delete_prob        = 0.2

# node connection options
connection_add_prob    = 0.5
connection_delete_prob = 0.5

# network parameters
num_hidden              = 0
num_inputs              = 5
num_outputs             = 3

# node bias options
bias_init_mean          = 0.0
bias_init_stdev         = 1.0
bias_max_value          = 30.0
bias_min_value          = -30.0
bias_mutate_power       = 0.5
bias_mutate_rate        = 0.7
bias_replace_rate       = 0.1

# node response options
response_init_mean      = 1.0
response_init_stdev     = 0.0
response_max_value      = 30.0
response_min_value      = -30.0
response_mutate_power   = 0.0
response_mutate_rate    = 0.0
response_replace_rate   = 0.0

# connection weight options
weight_init_mean        = 0.0
weight_init_stdev       = 1.0
weight_max_value        = 30
weight_min_value        = -30
weight_mutate_power     = 0.5
weight_mutate_rate      = 0.8
weight_replace_rate     = 0.1

# connection enable options
enabled_default         = True
enabled_mutate_rate     = 0.01

# connection add/remove rates
conn_add_prob           = 0.5
conn_delete_prob        = 0.5

# network add/remove rates
network_add_prob        = 0.2
network_delete_prob     = 0.2

# node connection costs
node_connection_cost    = 0.0

# node bias costs
node_bias_cost          = 0.0

# node response costs
node_response_cost      = 0.0

# node activation costs
node_activation_cost    = 0.0

# node add/remove costs
node_add_cost           = 0.0
node_delete_cost        = 0.0

# connection add/remove costs
connection_add_cost     = 0.0
connection_delete_cost  = 0.0

# network add/remove costs
network_add_cost        = 0.0
network_delete_cost     = 0.0

[DefaultSpeciesSet]
compatibility_threshold = 3.0

[DefaultStagnation]
species_fitness_func = max
max_stagnation        = 20
species_elitism       = 2

[DefaultReproduction]
elitism            = 2
survival_threshold = 0.2
"""
        with open('neat_config.txt', 'w') as f:
            f.write(config_content)
    
    return config

# Custom reporter for live training updates
class LiveTrainingReporter:
    def __init__(self):
        self.generation = 0
    
    def post_evaluate(self, config, population, species, best_genome):
        self.generation += 1
        best_fitness = best_genome.fitness if best_genome else 0
        avg_fitness = sum(g.fitness for g in population.values()) / len(population)
        
        # Update global training progress
        training_progress["current_generation"] = self.generation
        training_progress["best_score"] = int(best_fitness)
        training_progress["best_genome"] = best_genome
        
        print(f"Generation {self.generation}: Best={best_fitness:.0f}, Avg={avg_fitness:.0f}")
        
        # Small delay to allow frontend to update
        time.sleep(0.1)

# Game simulation for AI training
class DinoGameSimulator:
    def __init__(self, config):
        self.config = config
        self.reset()
    
    def reset(self):
        self.score = 0
        self.current_speed = self.config["base_speed"]
        self.dino_y = 0
        self.dino_velocity = 0
        self.dino_state = "running"
        self.is_ducking = False
        self.obstacles = []
        self.last_obstacle_x = self.config["canvas_width"]
        self.game_over = False
        self.time_step = 0
    
    def get_inputs(self):
        """Get neural network inputs"""
        # Find nearest obstacle
        nearest_obstacle = None
        nearest_distance = float('inf')
        
        for obs in self.obstacles:
            if obs['x'] > self.config["dino_x"]:
                distance = obs['x'] - self.config["dino_x"]
                if distance < nearest_distance:
                    nearest_distance = distance
                    nearest_obstacle = obs
        
        if nearest_obstacle:
            return [
                nearest_distance / 800.0,  # Normalized distance
                nearest_obstacle['y'] / 300.0,  # Obstacle y position
                1.0 if nearest_obstacle['type'] == 'bird' else 0.0,  # Is bird
                self.dino_y / 100.0,  # Dino y position
                self.current_speed / self.config["max_speed"]  # Current speed
            ]
        else:
            return [1.0, 0.0, 0.0, self.dino_y / 100.0, self.current_speed / self.config["max_speed"]]
    
    def step(self, action):
        """Execute one game step"""
        if self.game_over:
            return
        
        # Apply action
        if action == "jump" and self.dino_state == "running":
            self.dino_velocity = self.config["jump_strength"]
            self.dino_state = "jumping"
        elif action == "duck":
            self.is_ducking = True
        else:
            self.is_ducking = False
        
        # Update physics
        if self.dino_state == "jumping":
            self.dino_velocity += self.config["gravity"]
            self.dino_y += self.dino_velocity
            
            if self.dino_y >= 0:
                self.dino_y = 0
                self.dino_velocity = 0
                self.dino_state = "running"
        
        # Update obstacles
        for obs in self.obstacles:
            obs['x'] -= self.current_speed
        
        # Remove off-screen obstacles
        self.obstacles = [obs for obs in self.obstacles if obs['x'] > -100]
        
        # Spawn new obstacles
        if (self.last_obstacle_x - self.config["canvas_width"] > self.config["min_obstacle_distance"] and 
            np.random.random() < 0.02):
            
            is_bird = np.random.random() < 0.3
            if is_bird:
                bird_y = np.random.choice([self.config["canvas_height"] - 120, self.config["canvas_height"] - 80])
                self.obstacles.append({
                    'x': self.config["canvas_width"],
                    'y': bird_y,
                    'width': 60,
                    'height': 40,
                    'type': 'bird'
                })
            else:
                self.obstacles.append({
                    'x': self.config["canvas_width"],
                    'y': self.config["canvas_height"] - 90,
                    'width': 30,
                    'height': 60,
                    'type': 'cactus'
                })
            self.last_obstacle_x = self.config["canvas_width"]
        
        # Check collisions
        dino_rect = {
            'x': self.config["dino_x"] + 10,
            'y': self.config["dino_y"] + self.dino_y + 5,
            'width': 40 if self.is_ducking else 50,
            'height': 20 if self.is_ducking else 50
        }
        
        for obs in self.obstacles:
            obs_rect = {
                'x': obs['x'] + 5,
                'y': obs['y'] + 5,
                'width': obs['width'] - 10,
                'height': obs['height'] - 10
            }
            
            if (dino_rect['x'] < obs_rect['x'] + obs_rect['width'] and
                dino_rect['x'] + dino_rect['width'] > obs_rect['x'] and
                dino_rect['y'] < obs_rect['y'] + obs_rect['height'] and
                dino_rect['y'] + dino_rect['height'] > obs_rect['y']):
                self.game_over = True
                return
        
        # Update score and speed
        self.score += 1
        if self.score % 100 == 0:
            self.current_speed = min(self.current_speed + 0.001, self.config["max_speed"])
        
        self.time_step += 1

def evaluate_genome(genome, config):
    """Evaluate a single genome"""
    net = neat.nn.FeedForwardNetwork.create(genome, config)
    game = DinoGameSimulator(GAME_CONFIG)
    
    max_steps = 10000  # Prevent infinite loops
    
    for _ in range(max_steps):
        if game.game_over:
            break
        
        inputs = game.get_inputs()
        outputs = net.activate(inputs)
        
        # Determine action based on outputs
        action = "none"
        if outputs[0] > 0.5:  # Jump
            action = "jump"
        elif outputs[1] > 0.5:  # Duck
            action = "duck"
        
        game.step(action)
    
    return game.score

def eval_genomes(genomes, config):
    """Evaluate all genomes in parallel"""
    for genome_id, genome in genomes:
        genome.fitness = evaluate_genome(genome, config)

async def training_stream():
    """Stream training progress"""
    global training_progress
    
    while training_progress["is_training"]:
        yield f"data: {json.dumps(training_progress)}\n\n"
        await asyncio.sleep(0.1)

@app.get("/")
async def root():
    return {"message": "Chrome Dino Game AI Backend", "status": "running"}

@app.post("/train-ai")
async def train_ai(request: TrainingRequest):
    global training_progress
    
    if not NEAT_AVAILABLE:
        raise HTTPException(status_code=500, detail="NEAT library not available")
    
    if training_progress["is_training"]:
        raise HTTPException(status_code=400, detail="Training already in progress")
    
    # Start training in background
    training_progress["is_training"] = True
    training_progress["current_generation"] = 0
    training_progress["best_score"] = 0
    
    # Run training in background
    asyncio.create_task(run_training(request))
    
    return {"message": "Training started", "generations": request.generations}

@app.get("/training-updates")
async def training_updates():
    """Server-Sent Events for training progress"""
    return StreamingResponse(
        training_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

async def run_training(request: TrainingRequest):
    """Run NEAT training"""
    global training_progress
    
    try:
        # Load NEAT configuration
        config = create_neat_config()
        
        # Create population
        pop = neat.Population(config)
        
        # Add statistics reporter
        pop.add_reporter(neat.StdOutReporter(True))
        stats = neat.StatisticsReporter()
        pop.add_reporter(stats)
        
        # Add custom reporter for live updates
        live_reporter = LiveTrainingReporter()
        pop.add_reporter(live_reporter)
        
        # Run training with more generations for gradual learning
        max_generations = max(request.generations, 100)  # At least 100 generations
        winner = pop.run(eval_genomes, max_generations)
        
        # Save best genome
        if winner:
            with open('best_dino_ai.pkl', 'wb') as f:
                pickle.dump(winner, f)
        
        # Training complete
        training_progress["is_training"] = False
        training_progress["current_generation"] = max_generations
        training_progress["best_score"] = int(winner.fitness) if winner else 0
        
    except Exception as e:
        print(f"Training error: {e}")
        training_progress["is_training"] = False

@app.post("/ai-decision")
async def get_ai_decision(game_state: GameState):
    """Get AI decision for current game state"""
    try:
        # Load trained genome
        if not os.path.exists('best_dino_ai.pkl'):
            return AIDecision(action="none", confidence=0.0)
        
        with open('best_dino_ai.pkl', 'rb') as f:
            genome = pickle.load(f)
        
        # Create neural network
        config = create_neat_config()
        net = neat.nn.FeedForwardNetwork.create(genome, config)
        
        # Get inputs from game state
        inputs = get_inputs_from_game_state(game_state)
        outputs = net.activate(inputs)
        
        # Determine action
        action = "none"
        confidence = 0.0
        
        if outputs[0] > 0.5:
            action = "jump"
            confidence = outputs[0]
        elif outputs[1] > 0.5:
            action = "duck"
            confidence = outputs[1]
        else:
            confidence = 1.0 - max(outputs[0], outputs[1])
        
        return AIDecision(action=action, confidence=float(confidence))
        
    except Exception as e:
        print(f"AI decision error: {e}")
        return AIDecision(action="none", confidence=0.0)

def get_inputs_from_game_state(game_state: GameState):
    """Convert game state to neural network inputs"""
    # Find nearest obstacle
    nearest_obstacle = None
    nearest_distance = float('inf')
    
    for obs in game_state.obstacles:
        if obs['x'] > GAME_CONFIG["dino_x"]:
            distance = obs['x'] - GAME_CONFIG["dino_x"]
            if distance < nearest_distance:
                nearest_distance = distance
                nearest_obstacle = obs
    
    if nearest_obstacle:
        return [
            nearest_distance / 800.0,
            nearest_obstacle['y'] / 300.0,
            1.0 if nearest_obstacle['type'] == 'bird' else 0.0,
            game_state.dino_y / 100.0,
            game_state.current_speed / GAME_CONFIG["max_speed"]
        ]
    else:
        return [1.0, 0.0, 0.0, game_state.dino_y / 100.0, game_state.current_speed / GAME_CONFIG["max_speed"]]

@app.get("/ai-status")
async def get_ai_status():
    """Get current AI training status"""
    return {
        "is_training": training_progress["is_training"],
        "current_generation": training_progress["current_generation"],
        "best_score": training_progress["best_score"],
        "has_trained_model": os.path.exists('best_dino_ai.pkl')
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 