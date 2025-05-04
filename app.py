import streamlit as st
import numpy as np
import pygame
import sys
import os
import time
import pickle
import neat
import visualize
import base64
from PIL import Image
import io
import random
import matplotlib.pyplot as plt
from concurrent.futures import ThreadPoolExecutor
import cv2

# Configure page
st.set_page_config(
    page_title="Chrome Dino Game AI",
    page_icon="🦖",
    layout="wide",
)

st.markdown("""
    <style>
    .main {
        background-color: #000000;  /* Set background color to black */
        color: white;  /* Set text color to white */
    }
    .stApp {
        color: white;  /* Ensure all other text is white */
    }
    .stButton button {
        background-color: #4CAF50;
        color: white;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 8px;
    }
    .game-container {
        background-color: #1e1e1e;  /* Darker background for the container */
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    </style>
""", unsafe_allow_html=True)



# Title
st.title("🦖 Chrome Dinosaur Game AI using NEAT")
st.markdown("Train an AI to play the Chrome Dinosaur Game using NeuroEvolution of Augmenting Topologies (NEAT)")

# Constants for the game
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 300
GROUND_HEIGHT = 250
GRAVITY = 0.8
JUMP_STRENGTH = -15

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Load sprite images (we'll use placeholders until we load actual assets)
def load_sprite_sheet():
    # Create placeholders for now - in actual implementation we'd load the Chrome dino sprites
    sprites = {
        'dino_run1': pygame.Surface((44, 47), pygame.SRCALPHA),
        'dino_run2': pygame.Surface((44, 47), pygame.SRCALPHA),
        'dino_duck1': pygame.Surface((59, 30), pygame.SRCALPHA),
        'dino_duck2': pygame.Surface((59, 30), pygame.SRCALPHA),
        'dino_jump': pygame.Surface((44, 47), pygame.SRCALPHA),
        'dino_dead': pygame.Surface((44, 47), pygame.SRCALPHA),
        'small_cactus1': pygame.Surface((17, 35), pygame.SRCALPHA),
        'small_cactus2': pygame.Surface((34, 35), pygame.SRCALPHA),
        'small_cactus3': pygame.Surface((51, 35), pygame.SRCALPHA),
        'large_cactus1': pygame.Surface((25, 50), pygame.SRCALPHA),
        'large_cactus2': pygame.Surface((50, 50), pygame.SRCALPHA),
        'large_cactus3': pygame.Surface((75, 50), pygame.SRCALPHA),
        'bird1': pygame.Surface((46, 40), pygame.SRCALPHA),
        'bird2': pygame.Surface((46, 40), pygame.SRCALPHA),
        'cloud': pygame.Surface((70, 25), pygame.SRCALPHA),
        'ground': pygame.Surface((2400, 24), pygame.SRCALPHA)
    }
    
    # Draw placeholder graphics for visual debugging
    # Dinosaur
    pygame.draw.rect(sprites['dino_run1'], (83, 83, 83), (0, 0, 44, 47))
    pygame.draw.rect(sprites['dino_run2'], (83, 83, 83), (0, 0, 44, 47))
    pygame.draw.rect(sprites['dino_jump'], (83, 83, 83), (0, 0, 44, 47))
    pygame.draw.rect(sprites['dino_dead'], (200, 0, 0), (0, 0, 44, 47))
    pygame.draw.rect(sprites['dino_duck1'], (83, 83, 83), (0, 0, 59, 30))
    pygame.draw.rect(sprites['dino_duck2'], (83, 83, 83), (0, 0, 59, 30))
    
    # Cacti
    pygame.draw.rect(sprites['small_cactus1'], (0, 100, 0), (0, 0, 17, 35))
    pygame.draw.rect(sprites['small_cactus2'], (0, 100, 0), (0, 0, 34, 35))
    pygame.draw.rect(sprites['small_cactus3'], (0, 100, 0), (0, 0, 51, 35))
    pygame.draw.rect(sprites['large_cactus1'], (0, 120, 0), (0, 0, 25, 50))
    pygame.draw.rect(sprites['large_cactus2'], (0, 120, 0), (0, 0, 50, 50))
    pygame.draw.rect(sprites['large_cactus3'], (0, 120, 0), (0, 0, 75, 50))
    
    # Bird
    pygame.draw.rect(sprites['bird1'], (0, 0, 100), (0, 0, 46, 40))
    pygame.draw.rect(sprites['bird2'], (0, 0, 120), (0, 0, 46, 40))
    
    # Cloud and ground
    pygame.draw.rect(sprites['cloud'], (230, 230, 230), (0, 0, 70, 25))
    pygame.draw.rect(sprites['ground'], (210, 210, 210), (0, 0, 2400, 24))
    
    return sprites

# Initialize Game Components
class Dinosaur:
    X_POS = 80
    Y_POS = GROUND_HEIGHT
    
    def __init__(self, sprites):
        self.sprites = sprites
        self.x = self.X_POS
        self.y = self.Y_POS
        self.vel_y = 0
        self.is_jumping = False
        self.is_ducking = False
        self.is_dead = False
        self.step_index = 0
        self.animation_count = 0
        
        # Define hitboxes for standing and ducking
        self.standing_width = 44
        self.standing_height = 47
        self.ducking_width = 59
        self.ducking_height = 30
        
        # Current dimensions (will change based on state)
        self.width = self.standing_width
        self.height = self.standing_height
    
    def jump(self):
        if not self.is_jumping and not self.is_dead:
            self.vel_y = JUMP_STRENGTH
            self.is_jumping = True
            self.is_ducking = False  # Can't duck while jumping
    
    def duck(self):
        if not self.is_jumping and not self.is_dead:
            self.is_ducking = True
            self.width = self.ducking_width
            self.height = self.ducking_height
            self.y = self.Y_POS + (self.standing_height - self.ducking_height)  # Adjust Y position for ducking
    
    def stand(self):
        self.is_ducking = False
        self.width = self.standing_width
        self.height = self.standing_height
        self.y = self.Y_POS  # Reset Y position when standing
    
    def update(self):
        # Handle jumping physics
        if self.is_jumping:
            self.vel_y += GRAVITY
            self.y += self.vel_y
            
            # Check if landed
            if self.y >= self.Y_POS:
                self.y = self.Y_POS
                self.is_jumping = False
                self.vel_y = 0
        
        # Animation counter
        self.animation_count += 1
        if self.animation_count >= 5:  # Change animation every 5 frames
            self.step_index = (self.step_index + 1) % 2  # Toggle between 0 and 1
            self.animation_count = 0
    
    def draw(self, surface):
        # Determine which sprite to display based on state
        if self.is_dead:
            surface.blit(self.sprites['dino_dead'], (self.x, self.y))
        elif self.is_jumping:
            surface.blit(self.sprites['dino_jump'], (self.x, self.y))
        elif self.is_ducking:
            if self.step_index == 0:
                surface.blit(self.sprites['dino_duck1'], (self.x, self.y))
            else:
                surface.blit(self.sprites['dino_duck2'], (self.x, self.y))
        else:  # Running
            if self.step_index == 0:
                surface.blit(self.sprites['dino_run1'], (self.x, self.y))
            else:
                surface.blit(self.sprites['dino_run2'], (self.x, self.y))
    
    def get_hitbox(self):
        # Return the current hitbox based on state
        if self.is_ducking:
            return pygame.Rect(self.x, self.y, self.ducking_width, self.ducking_height)
        else:
            return pygame.Rect(self.x, self.y, self.standing_width, self.standing_height)


class Obstacle:
    def __init__(self, sprites, x, speed, type_id):
        self.sprites = sprites
        self.x = x
        self.speed = speed
        self.type_id = type_id
        
        # Set properties based on obstacle type
        if type_id == 'small_cactus1':
            self.image = sprites['small_cactus1']
            self.y = GROUND_HEIGHT + 10  # Adjust for ground height
        elif type_id == 'small_cactus2':
            self.image = sprites['small_cactus2']
            self.y = GROUND_HEIGHT + 10
        elif type_id == 'small_cactus3':
            self.image = sprites['small_cactus3']
            self.y = GROUND_HEIGHT + 10
        elif type_id == 'large_cactus1':
            self.image = sprites['large_cactus1']
            self.y = GROUND_HEIGHT - 5
        elif type_id == 'large_cactus2':
            self.image = sprites['large_cactus2']
            self.y = GROUND_HEIGHT - 5
        elif type_id == 'large_cactus3':
            self.image = sprites['large_cactus3']
            self.y = GROUND_HEIGHT - 5
        elif type_id == 'bird_low':
            self.image = sprites['bird1']
            self.y = GROUND_HEIGHT - 15  # Low flying bird
            self.animation_count = 0
            self.step_index = 0
        elif type_id == 'bird_high':
            self.image = sprites['bird1']
            self.y = GROUND_HEIGHT - 70  # High flying bird
            self.animation_count = 0
            self.step_index = 0
        elif type_id == 'bird_mid':
            self.image = sprites['bird1']
            self.y = GROUND_HEIGHT - 40  # Mid-height bird
            self.animation_count = 0
            self.step_index = 0
        
        # Set width and height based on image
        self.width = self.image.get_width()
        self.height = self.image.get_height()
        
        # Identifier for obstacle type category
        self.is_bird = 'bird' in type_id
    
    def update(self):
        # Move obstacle to the left
        self.x -= self.speed
        
        # Handle bird animation
        if self.is_bird:
            self.animation_count += 1
            if self.animation_count >= 5:  # Change animation every 5 frames
                self.step_index = (self.step_index + 1) % 2  # Toggle between 0 and 1
                self.animation_count = 0
    
    def draw(self, surface):
        if self.is_bird:
            if self.step_index == 0:
                surface.blit(self.sprites['bird1'], (self.x, self.y))
            else:
                surface.blit(self.sprites['bird2'], (self.x, self.y))
        else:
            surface.blit(self.image, (self.x, self.y))
    
    def get_hitbox(self):
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def is_off_screen(self):
        return self.x < -self.width


class Cloud:
    def __init__(self, sprites, x):
        self.image = sprites['cloud']
        self.x = x
        self.y = random.randint(50, 150)
        self.width = self.image.get_width()
    
    def update(self, speed):
        self.x -= speed * 0.5  # Clouds move slower than obstacles
    
    def draw(self, surface):
        surface.blit(self.image, (self.x, self.y))
    
    def is_off_screen(self):
        return self.x < -self.width


class Ground:
    def __init__(self, sprites):
        self.image = sprites['ground']
        self.width = self.image.get_width()
        self.x1 = 0
        self.x2 = self.width
        self.y = GROUND_HEIGHT + 40  # Position ground at the bottom
    
    def update(self, speed):
        # Move ground pieces to simulate movement
        self.x1 -= speed
        self.x2 -= speed
        
        # Reset positions when off screen
        if self.x1 + self.width < 0:
            self.x1 = self.x2 + self.width
        
        if self.x2 + self.width < 0:
            self.x2 = self.x1 + self.width
    
    def draw(self, surface):
        surface.blit(self.image, (self.x1, self.y))
        surface.blit(self.image, (self.x2, self.y))


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont(None, 30)
        self.high_score = 0
        self.sprites = load_sprite_sheet()
        self.reset()
    
    def reset(self):
        self.dinosaur = Dinosaur(self.sprites)
        self.obstacles = []
        self.clouds = []
        self.ground = Ground(self.sprites)
        self.score = 0
        self.speed = 10  # Starting speed
        self.game_over = False
        self.frame_count = 0
        self.spawn_timer = 0
        self.obstacle_frequency = 100  # Initial frequency
        self.running = True
        
        # Initialize with a few clouds
        for i in range(3):
            self.clouds.append(Cloud(self.sprites, random.randint(SCREEN_WIDTH, SCREEN_WIDTH + 600)))
    
    def spawn_obstacle(self):
        # Choose obstacle type with weighted probabilities
        obstacle_types = [
            'small_cactus1', 'small_cactus2', 'small_cactus3',
            'large_cactus1', 'large_cactus2', 'large_cactus3',
            'bird_low', 'bird_mid', 'bird_high'
        ]
        
        # Birds are less common at lower scores
        bird_probability = min(0.3, 0.05 + (self.score / 1000))
        
        if random.random() < bird_probability:
            # Spawn a bird at various heights
            obstacle_type = random.choice(['bird_low', 'bird_mid', 'bird_high'])
        else:
            # Spawn a cactus
            obstacle_type = random.choice(obstacle_types[:6])
        
        self.obstacles.append(Obstacle(self.sprites, SCREEN_WIDTH, self.speed, obstacle_type))
    
    def check_collision(self):
        dino_hitbox = self.dinosaur.get_hitbox()
        
        for obstacle in self.obstacles:
            if dino_hitbox.colliderect(obstacle.get_hitbox()):
                self.dinosaur.is_dead = True
                return True
        
        return False
    
    def update(self):
        if self.game_over:
            return
        
        self.frame_count += 1
        
        # Increase speed based on score
        if self.frame_count % 100 == 0:
            self.speed += 0.1
            # Reduce obstacle frequency as speed increases (more challenging)
            if self.obstacle_frequency > 40:  # Don't make it too frequent
                self.obstacle_frequency -= 1
        
        # Update dinosaur
        self.dinosaur.update()
        
        # Update ground
        self.ground.update(self.speed)
        
        # Update clouds
        for cloud in self.clouds[:]:
            cloud.update(self.speed)
            if cloud.is_off_screen():
                self.clouds.remove(cloud)
                # Add a new cloud
                self.clouds.append(Cloud(self.sprites, SCREEN_WIDTH + random.randint(0, 300)))
        
        # Update obstacles
        for obstacle in self.obstacles[:]:
            obstacle.update()
            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)
                self.score += 1
        
        # Spawn new obstacles
        self.spawn_timer += 1
        if self.spawn_timer >= self.obstacle_frequency:
            self.spawn_obstacle()
            self.spawn_timer = 0
            # Randomize next spawn time
            self.obstacle_frequency = random.randint(
                max(40, int(80 - self.speed)), 
                max(80, int(120 - self.speed))
            )
        
        # Check for collision
        if self.check_collision():
            self.game_over = True
            # Update high score
            self.high_score = max(self.high_score, self.score)
    
    def draw(self):
        # Fill background with white (Chrome's background)
        self.screen.fill(WHITE)
        
        # Draw clouds
        for cloud in self.clouds:
            cloud.draw(self.screen)
        
        # Draw ground
        self.ground.draw(self.screen)
        
        # Draw obstacles
        for obstacle in self.obstacles:
            obstacle.draw(self.screen)
        
        # Draw dinosaur
        self.dinosaur.draw(self.screen)
        
        # Draw score
        score_text = self.font.render(f"Score: {self.score}", True, BLACK)
        high_score_text = self.font.render(f"HI: {self.high_score}", True, BLACK)
        self.screen.blit(score_text, (SCREEN_WIDTH - 150, 20))
        self.screen.blit(high_score_text, (SCREEN_WIDTH - 300, 20))
        
        if self.game_over:
            game_over_text = self.font.render("GAME OVER", True, (200, 0, 0))
            restart_text = self.font.render("Press R to restart", True, BLACK)
            self.screen.blit(game_over_text, (SCREEN_WIDTH // 2 - 70, SCREEN_HEIGHT // 2 - 30))
            self.screen.blit(restart_text, (SCREEN_WIDTH // 2 - 90, SCREEN_HEIGHT // 2 + 10))
    
    def get_state(self):
        """
        Get the current game state as input for the neural network
        Returns a normalized array of features
        """
        # Find closest obstacle
        closest_obstacle = None
        closest_distance = float('inf')
        next_obstacle = None
        next_distance = float('inf')
        
        for obstacle in sorted(self.obstacles, key=lambda x: x.x):
            # Only consider obstacles ahead of the dinosaur
            if obstacle.x > self.dinosaur.x:
                distance = obstacle.x - self.dinosaur.x
                if distance < closest_distance:
                    next_obstacle = closest_obstacle
                    next_distance = closest_distance
                    closest_obstacle = obstacle
                    closest_distance = distance
                elif distance < next_distance:
                    next_obstacle = obstacle
                    next_distance = distance
        
        # Default values if no obstacles
        if closest_obstacle is None:
            return [
                1.0,  # Normalized distance to next obstacle
                0.0,  # Normalized speed
                0.0,  # Is obstacle a bird
                0.0,  # Bird height (0 if not a bird)
                0.0,  # Obstacle width
                0.0,  # Obstacle height
                0.0,  # Dinosaur y position
                0.0,  # Is dinosaur jumping
                0.5,  # Multiple obstacles gap
                0.0   # Next obstacle type
            ]
        
        # Normalize values
        normalized_distance = min(1.0, closest_distance / SCREEN_WIDTH)
        normalized_speed = min(1.0, self.speed / 30)  # Assuming max speed ~= 30
        
        # Obstacle type features
        is_bird = 1.0 if closest_obstacle.is_bird else 0.0
        
        # Bird height (0 if not a bird)
        if closest_obstacle.is_bird:
            if 'high' in closest_obstacle.type_id:
                bird_height = 1.0  # High
            elif 'mid' in closest_obstacle.type_id:
                bird_height = 0.5  # Medium
            else:
                bird_height = 0.0  # Low
        else:
            bird_height = 0.0
        
        # Normalize obstacle dimensions
        obstacle_width = closest_obstacle.width / 80  # Normalize by max expected width
        obstacle_height = closest_obstacle.height / 70  # Normalize by max expected height
        
        # Dinosaur state
        normalized_dino_y = (GROUND_HEIGHT - self.dinosaur.y) / GROUND_HEIGHT
        is_jumping = 1.0 if self.dinosaur.is_jumping else 0.0
        
        # Distance to next obstacle if there is one
        if next_obstacle:
            multiple_obstacles_gap = min(1.0, (next_distance - closest_distance) / SCREEN_WIDTH)
            next_is_bird = 1.0 if next_obstacle.is_bird else 0.0
        else:
            multiple_obstacles_gap = 1.0  # Maximum gap if no second obstacle
            next_is_bird = 0.0
        
        return [
            normalized_distance,
            normalized_speed,
            is_bird,
            bird_height,
            obstacle_width,
            obstacle_height,
            normalized_dino_y,
            is_jumping,
            multiple_obstacles_gap,
            next_is_bird
        ]
    
    def play_step(self, action):
        """
        Takes an action [jump, duck, do_nothing] and advances one frame
        Returns: game_over, score, screenshot
        """
        # Process action
        if action == 0:  # Jump
            self.dinosaur.jump()
        elif action == 1:  # Duck
            self.dinosaur.duck()
        else:  # Do nothing or stand if was ducking
            self.dinosaur.stand()
        
        # Update game state
        self.update()
        
        # Draw everything
        self.draw()
        
        # Return game status
        return self.game_over, self.score, pygame.surfarray.array3d(self.screen)


# NEAT Implementation with deeper neural network
class DinoGame:
    def __init__(self):
        self.game = Game()
        
    def test_ai(self, net):
        """Test the trained AI"""
        self.game.reset()
        max_frames = 5000  # Longer test period
        frame = 0
        
        # For storing screenshots to create a GIF later
        frames = []
        
        while not self.game.game_over and frame < max_frames:
            frame += 1
            
            # Get current state
            state = self.game.get_state()
            
            # Get AI's decision
            output = net.activate(state)
            decision = output.index(max(output))
            
            # Take action
            game_over, score, screenshot = self.game.play_step(decision)
            
            # Save screenshot every 5 frames to reduce GIF size
            if frame % 5 == 0:
                frames.append(screenshot)
            
            # Limit FPS for visualization
            if frame % 5 == 0:
                self.game.clock.tick(60)
        
        return score, frames
    
    def train_ai(self, genome, config):
        """Train a single genome"""
        net = neat.nn.FeedForwardNetwork.create(genome, config)
        
        self.game.reset()
        
        # Initialize fitness
        fitness = 0
        frame = 0
        max_frames = 2000  # Extended training time per genome
        consecutive_same_action = 0
        last_action = None
        
        # Cache for storing action frequency
        action_count = {0: 0, 1: 0, 2: 0}
        
        while not self.game.game_over and frame < max_frames:
            frame += 1
            
            # Get current state
            state = self.game.get_state()
            
            # Get AI's decision
            output = net.activate(state)
            decision = output.index(max(output))
            
            # Track action frequency
            action_count[decision] += 1
            
            # Penalize for too many consecutive same actions (stuck in a pattern)
            if decision == last_action:
                consecutive_same_action += 1
                if consecutive_same_action > 50:  # If stuck in same action
                    fitness -= 0.5  # Small penalty
            else:
                consecutive_same_action = 0
            
            last_action = decision
            
            # Take action
            game_over, score, _ = self.game.play_step(decision)
            
            # Base fitness is survival time + score
            fitness = frame / 10 + score * 100
            
            # Reward for higher scores
            if score > 20:
                fitness += score * 2
            
            # Penalize for repetitive behaviors
            if action_count[0] > frame * 0.8:  # Too much jumping
                fitness -= frame * 0.2
            
            # Penalize for jumping when not necessary or ducking too much
            if decision == 0 and not any(
                o.x < self.game.dinosaur.x + 200 and
                o.x > self.game.dinosaur.x and
                o.y > GROUND_HEIGHT - 50 for o in self.game.obstacles
            ):
                fitness -= 0.1
            
            # Penalize for ducking when a bird is high
            if decision == 1 and any(
                o.x < self.game.dinosaur.x + 200 and 
                o.x > self.game.dinosaur.x and 
                o.is_bird and 'high' in o.type_id for o in self.game.obstacles
            ):
                fitness -= 0.2
        
        # Bonus for balanced action selection
        total_actions = sum(action_count.values())
        if total_actions > 0:
            action_balance = min(action_count.values()) / total_actions
            fitness += action_balance * 50  # Reward for using all actions
        
        genome.fitness = max(1, fitness)  # Ensure minimum fitness
        return fitness


# Advanced visualize module
def visualize_training(statistics, config, generation):
    """Create a comprehensive visualization of the training process"""
    plt.figure(figsize=(18, 10))
    
    # 1. Plot fitness progression
    plt.subplot(2, 2, 1)
    generations = range(len(statistics.most_fit_genomes))
    best_fitness = [c.fitness for c in statistics.most_fit_genomes]
    avg_fitness = statistics.get_fitness_mean()
    
    plt.plot(generations, best_fitness, 'r-', label="Best Fitness")
    plt.plot(generations, avg_fitness, 'b-', label="Average Fitness")
    plt.title("Fitness over Generations")
    plt.xlabel("Generation")
    plt.ylabel("Fitness")
    plt.legend(loc="best")
    plt.grid(True)
    
    # 2. Plot species distribution
    plt.subplot(2, 2, 2)
    species_sizes = statistics.get_species_sizes()
    num_generations = len(species_sizes)
    curves = np.array(list(species_sizes.values()))
    generation_range = range(num_generations)
    
    plt.stackplot(generation_range, *curves)
    plt.title("Species Distribution")
    plt.xlabel("Generation")
    plt.ylabel("Size per Species")
    plt.grid(True)
    
    # 3. Visualize best network complexity
    plt.subplot(2, 2, 3)
    best_genomes = [statistics.most_fit_genomes[i] for i in range(len(statistics.most_fit_genomes))]
    node_counts = [len(g.nodes) for g in best_genomes]
    connection_counts = [len(g.connections) for g in best_genomes]
    
    plt.plot(generations, node_counts, 'g-', label="Nodes")
    plt.plot(generations, connection_counts, 'y-', label="Connections")
    plt.title("Network Complexity")
    plt.xlabel("Generation")
    plt.ylabel("Count")
    plt.legend(loc="best")
    plt.grid(True)
    
    # 4. Draw the best network structure
    plt.subplot(2, 2, 4)
    best_genome = statistics.most_fit_genomes[-1]
    
    # Create simple visualization of neural network
    input_nodes = config.genome_config.input_keys
    output_nodes = config.genome_config.output_keys
    hidden_nodes = [k for k in best_genome.nodes.keys() 
                  if k not in input_nodes and k not in output_nodes]
    
    # Draw a simplistic neural network visualization
    # (A more detailed version would use proper graphviz, but this is a simple representation)
    num_inputs = len(input_nodes)
    num_outputs = len(output_nodes)
    num_hidden = len(hidden_nodes)
    
    plt.text(0.5, 0.5, f"Network Structure\nInputs: {num_inputs}\nHidden: {num_hidden}\nOutputs: {num_outputs}",
             horizontalalignment='center', verticalalignment='center',
             transform=plt.gca().transAxes)
    
    plt.tight_layout()
    
    # Convert plot to image for Streamlit
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)
    return buf

def run_neat(config_file):
    """Run NEAT algorithm to train a neural network to play the game"""
    config = neat.config.Config(neat.DefaultGenome, neat.DefaultReproduction,
                                neat.DefaultSpeciesSet, neat.DefaultStagnation,
                                config_file)
    
    # Create the population
    p = neat.Population(config)
    
    # Add a reporter to show progress in the terminal
    p.add_reporter(neat.StdOutReporter(True))
    stats = neat.StatisticsReporter()
    p.add_reporter(stats)
    p.add_reporter(neat.Checkpointer(5))
    
    # Create a DinoGame instance for training
    dino_game = DinoGame()
    
    # Define the evaluation function
    def eval_genomes(genomes, config):
        i = 0
        max_fitness = 0
        best_genome = None
        
        # Use ThreadPoolExecutor for parallel genome evaluation
        with ThreadPoolExecutor(max_workers=min(8, len(genomes))) as executor:
            futures = []
            
            for genome_id, genome in genomes:
                future = executor.submit(dino_game.train_ai, genome, config)
                futures.append((genome, future))
            
            # Process results as they complete
            for genome, future in futures:
                fitness = future.result()
                i += 1
                
                # Keep track of best
                if fitness > max_fitness:
                    max_fitness = fitness
                    best_genome = genome
                
                # Display progress
                if i % 5 == 0:
                    print(f"Evaluated {i}/{len(genomes)} genomes. Best fitness: {max_fitness}")
    
    # Run the NEAT algorithm for up to 50 generations
    best_genome = p.run(eval_genomes, 50)
    
    # Show final stats
    print('\nBest genome:\n{!s}'.format(best_genome))
    
    # Save the winner
    with open('best_dino.pkl', 'wb') as f:
        pickle.dump(best_genome, f)
    
    # Create visualization of the winning network
    visualize.draw_net(config, best_genome, True)
    
    # Test the best genome
    net = neat.nn.FeedForwardNetwork.create(best_genome, config)
    dino_game = DinoGame()
    score, frames = dino_game.test_ai(net)
    print(f"Best AI achieved score: {score}")
    
    return best_genome, stats, frames

# Create NEAT configuration for Chrome Dino game
def create_config():
    # Create a new config file
    config_text = """
[NEAT]
fitness_criterion     = max
fitness_threshold     = 10000
pop_size              = 50
reset_on_extinction   = False

[DefaultGenome]
# Node activation options
activation_default      = relu
activation_mutate_rate  = 0.1
activation_options      = sigmoid, tanh, relu, leaky_relu

# Node aggregation options
aggregation_default     = sum
aggregation_mutate_rate = 0.0
aggregation_options     = sum

# Node bias options
bias_init_mean          = 0.0
bias_init_stdev         = 1.0
bias_max_value          = 30.0
bias_min_value          = -30.0
bias_mutate_power       = 0.5
bias_mutate_rate        = 0.7
bias_replace_rate       = 0.1

# Connection options
conn_add_prob           = 0.5
conn_delete_prob        = 0.5
conn_init_mean          = 0.0
conn_init_stdev         = 1.0
conn_max_value          = 30.0
conn_min_value          = -30.0
conn_mutate_power       = 0.5
conn_mutate_rate        = 0.8
conn_replace_rate       = 0.1

# Connection enable options
enabled_default         = True
enabled_mutate_rate     = 0.01

# Network parameters
feed_forward            = True
initial_connection      = full_direct
max_stagnation          = 15
num_hidden              = 6
num_inputs              = 10
num_outputs             = 3

# Node add/remove rates
node_add_prob           = 0.2
node_delete_prob        = 0.2

# Connection enable options
enabled_default         = True
enabled_mutate_rate     = 0.1

# Node response options
response_init_mean      = 1.0
response_init_stdev     = 0.0
response_max_value      = 30.0
response_min_value      = -30.0
response_mutate_power   = 0.0
response_mutate_rate    = 0.0
response_replace_rate   = 0.0

# Connection weight options
weight_init_mean        = 0.0
weight_init_stdev       = 1.0
weight_max_value        = 30
weight_min_value        = -30
weight_mutate_power     = 0.5
weight_mutate_rate      = 0.8
weight_replace_rate     = 0.1

[DefaultSpeciesSet]
compatibility_threshold = 3.0

[DefaultStagnation]
species_fitness_func = max
max_stagnation       = 15
species_elitism      = 2

[DefaultReproduction]
elitism            = 2
survival_threshold = 0.2
"""
    
    # Write config to file
    with open("neat_dino_config.txt", "w") as f:
        f.write(config_text)
    
    return "neat_dino_config.txt"

# Streamlit Interface
def main():
    st.title("Chrome Dinosaur Game AI")
    
    tab1, tab2, tab3 = st.tabs(["Play Game", "Train AI", "About"])
    
    with tab1:
        st.header("Play the Chrome Dinosaur Game")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown("""
            ### Manual Controls:
            - Press **Space** or **Up Arrow** to jump
            - Press **Down Arrow** to duck
            - Press **R** to restart when game over
            """)
            
            # Create a placeholder for the game canvas
            game_canvas = st.empty()
            
            # Add a button to start the game
            if st.button("Start Game", key="start_game"):
                game = Game()
                game.reset()
                
                # Create a placeholder for the game screen
                frame_placeholder = st.empty()
                
                # Game loop
                running = True
                while running:
                    # Process pygame events
                    for event in pygame.event.get():
                        if event.type == pygame.QUIT:
                            running = False
                        elif event.type == pygame.KEYDOWN:
                            if event.key == pygame.K_SPACE or event.key == pygame.K_UP:
                                game.dinosaur.jump()
                            elif event.key == pygame.K_DOWN:
                                game.dinosaur.duck()
                            elif event.key == pygame.K_r and game.game_over:
                                game.reset()
                        elif event.type == pygame.KEYUP:
                            if event.key == pygame.K_DOWN:
                                game.dinosaur.stand()
                    
                    # Update game
                    game.update()
                    
                    # Draw everything
                    game.draw()
                    
                    # Convert pygame surface to an image that Streamlit can display
                    surface_array = pygame.surfarray.array3d(game.screen)
                    surface_array = surface_array.transpose([1, 0, 2])  # Transpose for correct orientation
                    img = Image.fromarray(surface_array)
                    
                    # Display the image
                    frame_placeholder.image(img, caption="Chrome Dino Game", use_column_width=True)
                    
                    # Control game speed
                    game.clock.tick(60)
                    
                    # Check if game should stop
                    if not st.session_state.get("game_running", True):
                        running = False
        
        with col2:
            st.markdown("### Game Stats")
            
            # Placeholder for live stats
            score_placeholder = st.empty()
            high_score_placeholder = st.empty()
            speed_placeholder = st.empty()
            
            # Update stats if game is running
            if "game" in locals():
                score_placeholder.metric("Current Score", game.score)
                high_score_placeholder.metric("High Score", game.high_score)
                speed_placeholder.metric("Game Speed", f"{game.speed:.1f}x")
    
    with tab2:
        st.header("Train an AI to Play the Game")
        
        col1, col2 = st.columns([3, 2])
        
        with col1:
            st.markdown("""
            ### NEAT Algorithm Settings
            NEAT (NeuroEvolution of Augmenting Topologies) evolves neural networks to solve tasks like playing games.
            """)
            
            # NEAT Configuration options
            population_size = st.slider("Population Size", 10, 100, 50)
            num_generations = st.slider("Number of Generations", 5, 50, 20)
            
            if st.button("Start Training", key="train_ai"):
                with st.spinner("Training AI - This may take a while..."):
                    # Create config file with selected parameters
                    config_path = create_config()
                    
                    # Modify population size in config
                    with open(config_path, "r") as f:
                        config_text = f.read()
                    
                    config_text = config_text.replace("pop_size              = 50", f"pop_size              = {population_size}")
                    
                    with open(config_path, "w") as f:
                        f.write(config_text)
                    
                    # Run NEAT algorithm
                    best_genome, stats, frames = run_neat(config_path)
                    
                    # Store results in session state
                    st.session_state.best_genome = best_genome
                    st.session_state.stats = stats
                    st.session_state.frames = frames
                    
                    # Save visualization
                    training_viz = visualize_training(stats, neat.config.Config(
                        neat.DefaultGenome, neat.DefaultReproduction,
                        neat.DefaultSpeciesSet, neat.DefaultStagnation,
                        config_path), num_generations)
                    
                    st.image(training_viz, caption="Training Statistics", use_column_width=True)
        
        with col2:
            st.markdown("### AI Performance")
            
            if "best_genome" in st.session_state:
                st.success(f"Training complete! Best fitness: {st.session_state.best_genome.fitness:.2f}")
                
                if st.button("Test Best AI", key="test_ai"):
                    with st.spinner("Testing AI..."):
                        # Load configuration
                        config_path = "neat_dino_config.txt"
                        config = neat.config.Config(
                            neat.DefaultGenome, neat.DefaultReproduction,
                            neat.DefaultSpeciesSet, neat.DefaultStagnation,
                            config_path)
                        
                        # Create neural network from best genome
                        net = neat.nn.FeedForwardNetwork.create(st.session_state.best_genome, config)
                        
                        # Test the AI
                        dino_game = DinoGame()
                        score, frames = dino_game.test_ai(net)
                        
                        st.success(f"AI achieved score: {score}")
                        
                        # Display a few frames from the AI playthrough
                        if len(frames) > 0:
                            st.subheader("AI Gameplay Highlights")
                            
                            # Display a few frames as a grid
                            num_frames = min(6, len(frames))
                            selected_frames = [frames[i * len(frames) // num_frames] for i in range(num_frames)]
                            
                            # Convert frames to images
                            images = []
                            for frame in selected_frames:
                                frame = frame.transpose([1, 0, 2])  # Transpose for correct orientation
                                img = Image.fromarray(frame)
                                images.append(img)
                            
                            # Display images in a grid
                            cols = st.columns(3)
                            for i, img in enumerate(images):
                                cols[i % 3].image(img, caption=f"Frame {i}", use_column_width=True)
    
    with tab3:
        st.header("About this Project")
        
        st.markdown("""
        ### Chrome Dinosaur Game AI

        This project demonstrates the use of NEAT (NeuroEvolution of Augmenting Topologies) 
        to train an AI agent that can play the Chrome Dinosaur Game.

        #### Features:
        - Recreation of the Chrome Dinosaur Game with Python and Pygame
        - Implementation of NEAT algorithm for training neural networks
        - Visualization of training progress and network evolution
        - Interactive testing of trained AI models

        #### How It Works:
        1. **Game Environment**: A simplified version of Chrome's Dinosaur Game with jumping, ducking, and obstacle avoidance.
        2. **NEAT Algorithm**: Evolves neural networks through a genetic algorithm approach:
           - Starts with a population of simple neural networks
           - Each network controls a dinosaur in the game
           - Networks that perform better (survive longer) are more likely to reproduce
           - Offspring may have mutations that change network structure or weights
           - Over generations, networks evolve to play the game better
        3. **Neural Network Input**: The AI receives information about:
           - Distance to obstacles
           - Type of obstacles (cactus or bird)
           - Height of obstacles
           - Current game speed
           - Dinosaur's state (jumping or not)
        4. **Neural Network Output**: Three possible actions:
           - Jump
           - Duck
           - Do nothing (run)

        #### Technologies Used:
        - Python
        - Pygame for game simulation
        - NEAT-Python for neural network evolution
        - Streamlit for the interactive web interface
        - Matplotlib for visualization
        """)

if __name__ == "__main__":
    main()