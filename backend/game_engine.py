import pygame
import numpy as np
import random
import os

# Initialize pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 300
GROUND_HEIGHT = 250
GRAVITY = 0.8
JUMP_STRENGTH = -15

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)

def load_sprite_sheet():
    """Load sprite images from assets"""
    sprites = {}
    
    # Try to load actual sprites, fallback to placeholders
    try:
        sprites['dino_run1'] = pygame.image.load(os.path.join("Assets", "Dino", "DinoRun1.png"))
        sprites['dino_run2'] = pygame.image.load(os.path.join("Assets", "Dino", "DinoRun2.png"))
        sprites['dino_duck1'] = pygame.image.load(os.path.join("Assets", "Dino", "DinoDuck1.png"))
        sprites['dino_duck2'] = pygame.image.load(os.path.join("Assets", "Dino", "DinoDuck2.png"))
        sprites['dino_jump'] = pygame.image.load(os.path.join("Assets", "Dino", "DinoJump.png"))
        sprites['dino_dead'] = pygame.image.load(os.path.join("Assets", "Dino", "DinoDead.png"))
        
        sprites['small_cactus1'] = pygame.image.load(os.path.join("Assets", "Cactus", "SmallCactus1.png"))
        sprites['small_cactus2'] = pygame.image.load(os.path.join("Assets", "Cactus", "SmallCactus2.png"))
        sprites['small_cactus3'] = pygame.image.load(os.path.join("Assets", "Cactus", "SmallCactus3.png"))
        sprites['large_cactus1'] = pygame.image.load(os.path.join("Assets", "Cactus", "LargeCactus1.png"))
        sprites['large_cactus2'] = pygame.image.load(os.path.join("Assets", "Cactus", "LargeCactus2.png"))
        sprites['large_cactus3'] = pygame.image.load(os.path.join("Assets", "Cactus", "LargeCactus3.png"))
        
        sprites['bird1'] = pygame.image.load(os.path.join("Assets", "Bird", "Bird1.png"))
        sprites['bird2'] = pygame.image.load(os.path.join("Assets", "Bird", "Bird2.png"))
        
        sprites['cloud'] = pygame.image.load(os.path.join("Assets", "Other", "Cloud.png"))
        sprites['ground'] = pygame.image.load(os.path.join("Assets", "Other", "Track.png"))
        
    except:
        # Create placeholders if assets not found
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
        
        # Draw placeholder graphics
        pygame.draw.rect(sprites['dino_run1'], (83, 83, 83), (0, 0, 44, 47))
        pygame.draw.rect(sprites['dino_run2'], (83, 83, 83), (0, 0, 44, 47))
        pygame.draw.rect(sprites['dino_jump'], (83, 83, 83), (0, 0, 44, 47))
        pygame.draw.rect(sprites['dino_dead'], (200, 0, 0), (0, 0, 44, 47))
        pygame.draw.rect(sprites['dino_duck1'], (83, 83, 83), (0, 0, 59, 30))
        pygame.draw.rect(sprites['dino_duck2'], (83, 83, 83), (0, 0, 59, 30))
        
        pygame.draw.rect(sprites['small_cactus1'], (0, 100, 0), (0, 0, 17, 35))
        pygame.draw.rect(sprites['small_cactus2'], (0, 100, 0), (0, 0, 34, 35))
        pygame.draw.rect(sprites['small_cactus3'], (0, 100, 0), (0, 0, 51, 35))
        pygame.draw.rect(sprites['large_cactus1'], (0, 120, 0), (0, 0, 25, 50))
        pygame.draw.rect(sprites['large_cactus2'], (0, 120, 0), (0, 0, 50, 50))
        pygame.draw.rect(sprites['large_cactus3'], (0, 120, 0), (0, 0, 75, 50))
        
        pygame.draw.rect(sprites['bird1'], (0, 0, 100), (0, 0, 46, 40))
        pygame.draw.rect(sprites['bird2'], (0, 0, 120), (0, 0, 46, 40))
        
        pygame.draw.rect(sprites['cloud'], (230, 230, 230), (0, 0, 70, 25))
        pygame.draw.rect(sprites['ground'], (210, 210, 210), (0, 0, 2400, 24))
    
    return sprites

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
        
        # Define hitboxes
        self.standing_width = 44
        self.standing_height = 47
        self.ducking_width = 59
        self.ducking_height = 30
        
        self.width = self.standing_width
        self.height = self.standing_height
    
    def jump(self):
        if not self.is_jumping and not self.is_dead:
            self.vel_y = JUMP_STRENGTH
            self.is_jumping = True
            self.is_ducking = False
    
    def duck(self):
        if not self.is_jumping and not self.is_dead:
            self.is_ducking = True
            self.width = self.ducking_width
            self.height = self.ducking_height
            self.y = self.Y_POS + (self.standing_height - self.ducking_height)
    
    def stand(self):
        self.is_ducking = False
        self.width = self.standing_width
        self.height = self.standing_height
        self.y = self.Y_POS
    
    def update(self):
        if self.is_jumping:
            self.vel_y += GRAVITY
            self.y += self.vel_y
            
            if self.y >= self.Y_POS:
                self.y = self.Y_POS
                self.is_jumping = False
                self.vel_y = 0
        
        self.animation_count += 1
        if self.animation_count >= 5:
            self.step_index = (self.step_index + 1) % 2
            self.animation_count = 0
    
    def draw(self, surface):
        if self.is_dead:
            surface.blit(self.sprites['dino_dead'], (self.x, self.y))
        elif self.is_jumping:
            surface.blit(self.sprites['dino_jump'], (self.x, self.y))
        elif self.is_ducking:
            if self.step_index == 0:
                surface.blit(self.sprites['dino_duck1'], (self.x, self.y))
            else:
                surface.blit(self.sprites['dino_duck2'], (self.x, self.y))
        else:
            if self.step_index == 0:
                surface.blit(self.sprites['dino_run1'], (self.x, self.y))
            else:
                surface.blit(self.sprites['dino_run2'], (self.x, self.y))
    
    def get_hitbox(self):
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
        
        # Define obstacle types
        self.types = {
            0: ('small_cactus1', 17, 35),
            1: ('small_cactus2', 34, 35),
            2: ('small_cactus3', 51, 35),
            3: ('large_cactus1', 25, 50),
            4: ('large_cactus2', 50, 50),
            5: ('large_cactus3', 75, 50),
            6: ('bird1', 46, 40),
            7: ('bird2', 46, 40)
        }
        
        self.sprite_name, self.width, self.height = self.types[type_id]
        self.y = GROUND_HEIGHT - self.height if type_id < 6 else GROUND_HEIGHT - 60
        self.animation_count = 0
    
    def update(self):
        self.x -= self.speed
        self.animation_count += 1
    
    def draw(self, surface):
        if self.type_id >= 6:  # Bird
            sprite_name = 'bird1' if (self.animation_count // 5) % 2 == 0 else 'bird2'
            surface.blit(self.sprites[sprite_name], (self.x, self.y))
        else:
            surface.blit(self.sprites[self.sprite_name], (self.x, self.y))
    
    def get_hitbox(self):
        return pygame.Rect(self.x, self.y, self.width, self.height)
    
    def is_off_screen(self):
        return self.x < -self.width

class Cloud:
    def __init__(self, sprites, x):
        self.sprites = sprites
        self.x = x
        self.y = random.randint(50, 100)
        self.speed = 1
    
    def update(self, speed):
        self.x -= speed * 0.5
    
    def draw(self, surface):
        surface.blit(self.sprites['cloud'], (self.x, self.y))
    
    def is_off_screen(self):
        return self.x < -70

class Ground:
    def __init__(self, sprites):
        self.sprites = sprites
        self.x1 = 0
        self.x2 = 2400
        self.y = GROUND_HEIGHT + 47
    
    def update(self, speed):
        self.x1 -= speed
        self.x2 -= speed
        
        if self.x1 <= -2400:
            self.x1 = self.x2 + 2400
        if self.x2 <= -2400:
            self.x2 = self.x1 + 2400
    
    def draw(self, surface):
        surface.blit(self.sprites['ground'], (self.x1, self.y))
        surface.blit(self.sprites['ground'], (self.x2, self.y))

class Game:
    def __init__(self):
        self.sprites = load_sprite_sheet()
        self.reset()
    
    def reset(self):
        self.dino = Dinosaur(self.sprites)
        self.obstacles = []
        self.clouds = [Cloud(self.sprites, SCREEN_WIDTH + i * 300) for i in range(3)]
        self.ground = Ground(self.sprites)
        self.score = 0
        self.game_speed = 20
        self.game_over = False
        self.max_distance = 0
        self.obstacle_spawn_timer = 0
        self.obstacle_spawn_delay = 150
    
    def spawn_obstacle(self):
        if self.obstacle_spawn_timer <= 0:
            # Choose obstacle type
            if random.random() < 0.3:  # 30% chance for bird
                obstacle_type = random.choice([6, 7])
            else:
                obstacle_type = random.choice([0, 1, 2, 3, 4, 5])
            
            obstacle = Obstacle(self.sprites, SCREEN_WIDTH, self.game_speed, obstacle_type)
            self.obstacles.append(obstacle)
            self.obstacle_spawn_timer = self.obstacle_spawn_delay
        
        self.obstacle_spawn_timer -= 1
    
    def check_collision(self):
        dino_hitbox = self.dino.get_hitbox()
        
        for obstacle in self.obstacles:
            if dino_hitbox.colliderect(obstacle.get_hitbox()):
                self.game_over = True
                return True
        
        return False
    
    def update(self):
        if self.game_over:
            return
        
        # Update dino
        self.dino.update()
        
        # Spawn obstacles
        self.spawn_obstacle()
        
        # Update obstacles
        for obstacle in self.obstacles[:]:
            obstacle.update()
            if obstacle.is_off_screen():
                self.obstacles.remove(obstacle)
        
        # Update clouds
        for cloud in self.clouds:
            cloud.update(self.game_speed)
            if cloud.is_off_screen():
                cloud.x = SCREEN_WIDTH + random.randint(800, 1200)
                cloud.y = random.randint(50, 100)
        
        # Update ground
        self.ground.update(self.game_speed)
        
        # Update score and speed
        self.score += 1
        self.max_distance = max(self.max_distance, self.score)
        
        if self.score % 100 == 0:
            self.game_speed += 1
            self.obstacle_spawn_delay = max(50, self.obstacle_spawn_delay - 5)
        
        # Check collision
        self.check_collision()
    
    def draw(self, surface):
        # Fill background
        surface.fill(WHITE)
        
        # Draw clouds
        for cloud in self.clouds:
            cloud.draw(surface)
        
        # Draw ground
        self.ground.draw(surface)
        
        # Draw obstacles
        for obstacle in self.obstacles:
            obstacle.draw(surface)
        
        # Draw dino
        self.dino.draw(surface)
        
        # Draw score
        font = pygame.font.Font(None, 36)
        score_text = font.render(f'Score: {self.score}', True, BLACK)
        surface.blit(score_text, (10, 10))
        
        speed_text = font.render(f'Speed: {self.game_speed}', True, BLACK)
        surface.blit(speed_text, (10, 50))
    
    def get_state(self):
        """Get current game state for AI input"""
        state = {
            'dino_y': self.dino.y,
            'dino_vel_y': self.dino.vel_y,
            'dino_is_jumping': self.dino.is_jumping,
            'dino_is_ducking': self.dino.is_ducking,
            'game_speed': self.game_speed,
            'score': self.score
        }
        
        # Find nearest obstacle
        nearest_obstacle = None
        min_distance = float('inf')
        
        for obstacle in self.obstacles:
            distance = obstacle.x - self.dino.x
            if 0 < distance < min_distance:
                min_distance = distance
                nearest_obstacle = obstacle
        
        if nearest_obstacle:
            state.update({
                'obstacle_distance': nearest_obstacle.x - self.dino.x,
                'obstacle_height': nearest_obstacle.height,
                'obstacle_width': nearest_obstacle.width,
                'obstacle_type': nearest_obstacle.type_id
            })
        else:
            state.update({
                'obstacle_distance': 1000,
                'obstacle_height': 0,
                'obstacle_width': 0,
                'obstacle_type': -1
            })
        
        return state
    
    def play_step(self, action):
        """Execute one game step with given action"""
        # Action: 0 = do nothing, 1 = jump, 2 = duck
        
        if action == 1:
            self.dino.jump()
        elif action == 2:
            self.dino.duck()
        else:
            self.dino.stand()
        
        self.update()
        
        return {
            'game_over': self.game_over,
            'score': self.score,
            'reward': 1 if not self.game_over else -100
        }

class DinoGame:
    def __init__(self):
        self.game = Game()
    
    def test_ai(self, net):
        """Test AI with given neural network"""
        self.game.reset()
        total_reward = 0
        steps = 0
        max_steps = 2000
        
        while not self.game.game_over and steps < max_steps:
            state = self.game.get_state()
            
            # Prepare input for neural network
            inputs = [
                state['dino_y'] / SCREEN_HEIGHT,
                state['dino_vel_y'] / 20.0,
                state['obstacle_distance'] / SCREEN_WIDTH,
                state['obstacle_height'] / 100.0,
                state['game_speed'] / 50.0
            ]
            
            # Get neural network output
            output = net.activate(inputs)
            action = np.argmax(output)
            
            # Execute action
            result = self.game.play_step(action)
            total_reward += result['reward']
            steps += 1
        
        return {
            'fitness': total_reward + self.game.score * 10,
            'score': self.game.score,
            'steps': steps,
            'game_over': self.game.game_over
        }
    
    def train_ai(self, genome, config):
        """Train AI with given genome"""
        net = neat.nn.FeedForwardNetwork.create(genome, config)
        return self.test_ai(net) 