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

# Configure page
st.set_page_config(
    page_title="Dino Game AI",
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
SCREEN_WIDTH = 600
SCREEN_HEIGHT = 200
GROUND_HEIGHT = 150
GRAVITY = 0.6
JUMP_STRENGTH = -10

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

# Initialize Game Components
class Dinosaur:
    def __init__(self):
        self.x = 50
        self.y = GROUND_HEIGHT
        self.width = 40
        self.height = 40
        self.velocity = 0
        self.is_jumping = False
        self.is_ducking = False
        self.color = (100, 100, 100)  # Gray dinosaur
    
    def jump(self):
        if not self.is_jumping:
            self.velocity = JUMP_STRENGTH
            self.is_jumping = True
    
    def duck(self):
        self.is_ducking = True
        # When ducking, reduce height
        self.height = 20
    
    def stand(self):
        self.is_ducking = False
        self.height = 40
    
    def update(self):
        # Apply gravity
        self.velocity += GRAVITY
        self.y += self.velocity
        
        # Ground check
        if self.y >= GROUND_HEIGHT:
            self.y = GROUND_HEIGHT
            self.is_jumping = False
            self.velocity = 0
    
    def draw(self, surface):
        if self.is_ducking:
            pygame.draw.rect(surface, self.color, (self.x, self.y + 20, self.width, self.height))
        else:
            pygame.draw.rect(surface, self.color, (self.x, self.y, self.width, self.height))


class Obstacle:
    def __init__(self, x, speed, obstacle_type="cactus"):
        self.x = x
        self.y = GROUND_HEIGHT
        self.speed = speed
        self.type = obstacle_type
        
        if obstacle_type == "cactus":
            self.width = 20
            self.height = 40
            self.y = GROUND_HEIGHT
            self.color = (0, 100, 0)  # Green cactus
        else:  # bird
            self.width = 30
            self.height = 20
            self.y = GROUND_HEIGHT - 40  # Birds fly higher
            self.color = (0, 0, 100)  # Blue bird
    
    def update(self):
        self.x -= self.speed
    
    def draw(self, surface):
        pygame.draw.rect(surface, self.color, (self.x, self.y, self.width, self.height))
    
    def is_off_screen(self):
        return self.x < -self.width


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.Surface((SCREEN_WIDTH, SCREEN_HEIGHT))
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont(None, 30)
        self.reset()
    
    def reset(self):
        self.dinosaur = Dinosaur()
        self.obstacles = []
        self.score = 0
        self.speed = 5
        self.game_over = False
        self.frame_count = 0
        self.spawn_timer = 0
        self.running = True
    
    def spawn_obstacle(self):
        # Randomly choose between cactus and bird
        obstacle_type = "cactus" if random.random() < 0.7 else "bird"
        self.obstacles.append(Obstacle(SCREEN_WIDTH, self.speed, obstacle_type))
    
    def check_collision(self):
        dino = self.dinosaur
        
        for obstacle in self.obstacles:
            # Adjust hitbox based on whether dinosaur is ducking
            dino_y = dino.y + 20 if dino.is_ducking else dino.y
            dino_height = dino.height
            
            # Simple rectangle collision detection
            if (dino.x < obstacle.x + obstacle.width and
                dino.x + dino.width > obstacle.x and
                dino_y < obstacle.y + obstacle.height and
                dino_y + dino_height > obstacle.y):
                return True
        
        return False
    
    def update(self):
        if self.game_over:
            return
        
        self.frame_count += 1
        
        # Increase speed over time
        if self.frame_count % 500 == 0:
            self.speed += 0.5
        
        # Update dinosaur
        self.dinosaur.update()
        
        # Update obstacles
        for obstacle in self.obstacles[:]:
            obstacle.update()
            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)
                self.score += 1
        
        # Spawn new obstacles
        self.spawn_timer += 1
        if self.spawn_timer >= random.randint(60, 100):  # Random timing for obstacles
            self.spawn_obstacle()
            self.spawn_timer = 0
        
        # Check for collision
        if self.check_collision():
            self.game_over = True
    
    def draw(self):
        self.screen.fill(WHITE)
        
        # Draw ground
        pygame.draw.line(self.screen, BLACK, (0, GROUND_HEIGHT + 40), (SCREEN_WIDTH, GROUND_HEIGHT + 40), 2)
        
        # Draw dinosaur
        self.dinosaur.draw(self.screen)
        
        # Draw obstacles
        for obstacle in self.obstacles:
            obstacle.draw(self.screen)
        
        # Draw score
        score_text = self.font.render(f"Score: {self.score}", True, BLACK)
        self.screen.blit(score_text, (10, 10))
        
        if self.game_over:
            game_over_text = self.font.render("GAME OVER", True, (255, 0, 0))
            self.screen.blit(game_over_text, (SCREEN_WIDTH // 2 - 60, SCREEN_HEIGHT // 2 - 15))
    
    def get_state(self):
        # Get the closest obstacle
        closest_obstacle = None
        closest_distance = float('inf')
        
        for obstacle in self.obstacles:
            distance = obstacle.x - self.dinosaur.x
            if distance > 0 and distance < closest_distance:
                closest_obstacle = obstacle
                closest_distance = distance
        
        if closest_obstacle is None:
            # If no obstacles, return default state
            return [1.0, 0.0, 0.0, 0.0, 0.0]
        
        # Normalize values between 0 and 1
        normalized_distance = closest_distance / SCREEN_WIDTH
        normalized_speed = self.speed / 20  # Assuming max speed is around 20
        
        # Is obstacle a bird (requires ducking) or cactus (requires jumping)
        is_bird = 1.0 if closest_obstacle.type == "bird" else 0.0
        
        # Dinosaur's current state
        is_jumping = 1.0 if self.dinosaur.is_jumping else 0.0
        
        # Height difference
        height_diff = (closest_obstacle.y - self.dinosaur.y) / SCREEN_HEIGHT
        
        return [normalized_distance, normalized_speed, is_bird, is_jumping, height_diff]
    
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


# NEAT Implementation
class DinoGame:
    def __init__(self):
        self.game = Game()
        
    def test_ai(self, net):
        """Test the trained AI"""
        self.game.reset()
        max_frames = 2000
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
            frames.append(screenshot)
            
            if frame % 10 == 0:  # Limit to 10 FPS for visualization
                self.game.clock.tick(10)
        
        return score, frames
    
    def train_ai(self, genome, config):
        """Train a single genome"""
        net = neat.nn.FeedForwardNetwork.create(genome, config)
        
        self.game.reset()
        
        # Initialize fitness
        fitness = 0
        frame = 0
        max_frames = 1000  # Prevent infinite loops
        
        while not self.game.game_over and frame < max_frames:
            frame += 1
            
            # Get current state
            state = self.game.get_state()
            
            # Get AI's decision
            output = net.activate(state)
            decision = output.index(max(output))
            
            # Take action
            game_over, score, _ = self.game.play_step(decision)
            
            # Update fitness: reward for staying alive and extra for passing obstacles
            fitness = frame + score * 10
            
            # Penalize for jumping too much
            if decision == 0 and self.game.dinosaur.is_jumping:
                fitness -= 0.1
        
        genome.fitness = fitness
        return fitness


# Visualization module for NEAT
def visualize_stats(statistics, filename):
    """Visualize the statistics of the evolution process."""
    generation = range(len(statistics.most_fit_genomes))
    best_fitness = [c.fitness for c in statistics.most_fit_genomes]
    avg_fitness = statistics.get_fitness_mean()
    
    plt.figure(figsize=(10, 6))
    
    plt.plot(generation, best_fitness, 'r-', label="Best Fitness")
    plt.plot(generation, avg_fitness, 'b-', label="Average Fitness")
    
    plt.title("Fitness over Generations")
    plt.xlabel("Generation")
    plt.ylabel("Fitness")
    plt.legend(loc="best")
    
    buf = io.BytesIO()
    plt.savefig(buf, format="png")
    buf.seek(0)
    return buf


def visualize(config_path):
    config = neat.Config(neat.DefaultGenome, neat.DefaultReproduction,
                         neat.DefaultSpeciesSet, neat.DefaultStagnation,
                         config_path)

    p = neat.Population(config)

    p.add_reporter(neat.StdOutReporter(True))
    stats = neat.StatisticsReporter()
    p.add_reporter(stats)

    game = DinoGame()

    def eval_genomes(genomes, config):
        for genome_id, genome in genomes:
            genome.fitness = game.train_ai(genome, config)

    with st.spinner('Training in progress...'):
        progress_bar = st.progress(0)
        best_genome = None
        generations = 30

        for i in range(generations):
            best_genome = p.run(eval_genomes, 1)
            progress_bar.progress((i + 1) / generations)

            if i % 5 == 0 or i == generations - 1:
                stats_image = visualize_stats(stats, f"stats_gen_{i}.png")
                st.image(stats_image, caption=f"Training Statistics - Generation {i+1}")

    with open("best_dino.pkl", "wb") as f:
        pickle.dump(best_genome, f)

    return best_genome, config



def play_game():
    game = Game()
    game.reset()
    
    # Set up Streamlit components
    game_col, stats_col = st.columns([3, 1])
    
    with game_col:
        game_display = st.empty()
    
    with stats_col:
        score_display = st.empty()
        controls_info = st.markdown("""
        **Controls:**
        - Press Space to Jump
        - Press Down Arrow to Duck
        """)
    
    # Game loop
    game_over = False
    
    while not game_over:
        # Handle keyboard input
        keys = pygame.key.get_pressed()
        
        if keys[pygame.K_SPACE]:
            game.dinosaur.jump()
        elif keys[pygame.K_DOWN]:
            game.dinosaur.duck()
        else:
            game.dinosaur.stand()
        
        # Update game state
        game.update()
        
        # Check if game is over
        if game.game_over:
            game_over = True
        
        # Draw game
        game.draw()
        
        # Update display
        game_display.image(pygame.surfarray.array3d(game.screen), caption="Dinosaur Game", channels="RGB")
        score_display.text(f"Score: {game.score}")
        
        # Control game speed
        game.clock.tick(30)


def create_gif(frames, filename="dino_game.gif", fps=10):
    """Create a GIF from a list of numpy arrays."""
    images = []
    for frame in frames:
        # Convert from numpy array to PIL Image
        img = Image.fromarray(frame)
        images.append(img)
    
    # Save as GIF
    images[0].save(
        filename,
        save_all=True,
        append_images=images[1:],
        optimize=False,
        duration=1000//fps,
        loop=0
    )
    return filename


# Configuration for NEAT
def create_config():
    """Create NEAT configuration file"""
    config_text = """
[NEAT]
fitness_criterion     = max
fitness_threshold     = 1000
pop_size              = 50
reset_on_extinction   = False

[DefaultGenome]
# node activation options
activation_default      = sigmoid
activation_mutate_rate  = 0.0
activation_options      = sigmoid

# node aggregation options
aggregation_default     = sum
aggregation_mutate_rate = 0.0
aggregation_options     = sum

# node bias options
bias_init_mean          = 0.0
bias_init_stdev         = 1.0
bias_max_value          = 30.0
bias_min_value          = -30.0
bias_mutate_power       = 0.5
bias_mutate_rate        = 0.7
bias_replace_rate       = 0.1

# genome compatibility options
compatibility_disjoint_coefficient = 1.0
compatibility_weight_coefficient   = 0.5

# connection add/remove rates
conn_add_prob           = 0.5
conn_delete_prob        = 0.5

# connection enable options
enabled_default         = True
enabled_mutate_rate     = 0.01

feed_forward            = True
initial_connection      = full_direct

# node add/remove rates
node_add_prob           = 0.2
node_delete_prob        = 0.2

# network parameters
num_hidden              = 0
num_inputs              = 5
num_outputs             = 3

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

[DefaultSpeciesSet]
compatibility_threshold = 3.0

[DefaultStagnation]
species_fitness_func = max
max_stagnation       = 20
species_elitism      = 2

[DefaultReproduction]
elitism            = 2
survival_threshold = 0.2
    """
    
    with open("neat_config.txt", "w") as f:
        f.write(config_text)
    
    return "neat_config.txt"


# Main App
def main():
    # Sidebar for navigation
    st.sidebar.title("Navigation")
    page = st.sidebar.radio("Go to", ["Home", "Train Model", "View Results", "Play Yourself"])
    
    if page == "Home":
        st.markdown("""
        # Welcome to the Dinosaur Game AI Project
        
        This application uses NEAT (NeuroEvolution of Augmenting Topologies) to train an AI that learns to play the famous Chrome Dinosaur Game.
        
        ## How it Works
        
        1. **NEAT Algorithm**: Evolves neural networks through genetic algorithms
        2. **Training**: The AI learns through multiple generations of evolution
        3. **Play**: Watch the trained AI play or try playing yourself
        
        ## Features
        
        - Train your own AI model
        - Visualize the training process
        - Test the trained AI
        - Play the game yourself
        
        Choose an option from the sidebar to get started!
        """)
        
        st.image("https://cdn.dribbble.com/users/1156079/screenshots/4952250/dino.gif", caption="Chrome Dinosaur Game")
    
    elif page == "Train Model":
        st.header("Train Dinosaur Game AI")
        
        st.markdown("""
        The training process uses NEAT to evolve neural networks that learn to play the game.
        
        - **Population Size**: 50 genomes
        - **Generations**: 30
        - **Inputs**: Distance to obstacle, game speed, obstacle type, jumping state, height difference
        - **Outputs**: Jump, duck, do nothing
        
        Click the button below to start training. This may take a few minutes.
        """)
        
        if st.button("Start Training"):
            # Create config file
            config_path = create_config()
            
            # Run training
            best_genome, config = visualize(config_path)
            
            # Save the best genome
            with open("best_dino.pkl", "wb") as f:
                pickle.dump(best_genome, f)
            
            # Test the best AI
            game = DinoGame()
            score, frames = game.test_ai(neat.nn.FeedForwardNetwork.create(best_genome, config))
            
            # Create GIF
            gif_path = create_gif(frames[:300])  # Limit to 300 frames
            
            st.success(f"Training complete! Best AI achieved score: {score}")
            
            # Show GIF of the AI playing
            with open(gif_path, "rb") as f:
                gif_bytes = f.read()
                encoded = base64.b64encode(gif_bytes).decode()
                st.markdown(f"""
                <div style="display: flex; justify-content: center;">
                    <img src="data:image/gif;base64,{encoded}" alt="AI playing" width="600">
                </div>
                """, unsafe_allow_html=True)
    
    elif page == "View Results":
        st.header("View Trained AI Results")
        
        # Check if trained model exists
        if os.path.exists("best_dino.pkl"):
            with open("best_dino.pkl", "rb") as f:
                best_genome = pickle.load(f)
            
            config_path = create_config()
            config = neat.Config(neat.DefaultGenome, neat.DefaultReproduction,
                                neat.DefaultSpeciesSet, neat.DefaultStagnation,
                                config_path)
            
            st.markdown("### Trained AI Performance")
            
            if st.button("Watch AI Play"):
                game = DinoGame()
                score, frames = game.test_ai(neat.nn.FeedForwardNetwork.create(best_genome, config))
                
                # Create GIF of gameplay
                gif_path = create_gif(frames[:300])  # Limit to 300 frames for performance
                
                st.success(f"AI achieved score: {score}")
                
                # Show GIF
                with open(gif_path, "rb") as f:
                    gif_bytes = f.read()
                    encoded = base64.b64encode(gif_bytes).decode()
                    st.markdown(f"""
                    <div style="display: flex; justify-content: center;">
                        <img src="data:image/gif;base64,{encoded}" alt="AI playing" width="600">
                    </div>
                    """, unsafe_allow_html=True)
                
                # Display neural network structure
                st.subheader("Neural Network Structure")
                st.text("Inputs: Distance to obstacle, game speed, obstacle type, jumping state, height difference")
                st.text("Outputs: Jump, Duck, Do Nothing")
                
                # Calculate network stats
                nodes = len(best_genome.nodes)
                connections = len(best_genome.connections)
                
                st.text(f"Network has {nodes} nodes and {connections} connections")
        else:
            st.warning("No trained model found. Please go to the 'Train Model' page to train a model first.")
    
    elif page == "Play Yourself":
        st.header("Play the Dinosaur Game")
        
        st.markdown("""
        Try playing the game yourself! Use the following controls:
        
        - **Space**: Jump
        - **Down Arrow**: Duck
        
        Click the button below to start playing.
        """)
        
        if st.button("Start Game"):
            play_game()


if __name__ == "__main__":
    main()