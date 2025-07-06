import neat
import numpy as np
import os
import pickle
from game_engine import DinoGame

class NeatTrainer:
    def __init__(self, config_dict):
        self.config_dict = config_dict
        self.game = DinoGame()
        self.population = None
        self.config = None
        self.stats = None
        self.best_genome = None
        
        # Create NEAT config
        self.create_config()
        
        # Initialize population
        self.population = neat.Population(self.config)
        
        # Add statistics reporter
        self.stats = neat.StatisticsReporter()
        self.population.add_reporter(self.stats)
        self.population.add_reporter(neat.StdOutReporter(True))
    
    def create_config(self):
        """Create NEAT configuration"""
        config = neat.Config(
            neat.DefaultGenome,
            neat.DefaultReproduction,
            neat.DefaultSpeciesSet,
            neat.DefaultStagnation,
            'neat_config.txt'
        )
        
        # Override config with provided parameters
        config.pop_size = self.config_dict.get('population_size', 50)
        config.fitness_threshold = self.config_dict.get('fitness_threshold', 1000)
        
        # Genome parameters
        config.genome_config.num_inputs = 5
        config.genome_config.num_outputs = 3
        config.genome_config.num_hidden = 0
        config.genome_config.initial_connection = 'full_direct'
        config.genome_config.feed_forward = True
        
        # Weight parameters
        config.genome_config.weight_init_mean = 0.0
        config.genome_config.weight_init_stdev = 1.0
        config.genome_config.weight_max_value = 30
        config.genome_config.weight_min_value = -30
        config.genome_config.weight_mutate_power = 0.5
        config.genome_config.weight_mutate_rate = self.config_dict.get('mutation_rate', 0.8)
        config.genome_config.weight_replace_rate = 0.1
        
        # Bias parameters
        config.genome_config.bias_init_mean = 0.0
        config.genome_config.bias_init_stdev = 1.0
        config.genome_config.bias_max_value = 30.0
        config.genome_config.bias_min_value = -30.0
        config.genome_config.bias_mutate_power = 0.5
        config.genome_config.bias_mutate_rate = 0.7
        config.genome_config.bias_replace_rate = 0.1
        
        # Connection parameters
        config.genome_config.conn_add_prob = 0.5
        config.genome_config.conn_delete_prob = 0.5
        config.genome_config.enabled_default = True
        config.genome_config.enabled_mutate_rate = 0.01
        
        # Node parameters
        config.genome_config.node_add_prob = 0.2
        config.genome_config.node_delete_prob = 0.2
        
        # Activation parameters
        config.genome_config.activation_default = 'sigmoid'
        config.genome_config.activation_mutate_rate = 0.0
        config.genome_config.activation_options = 'sigmoid'
        
        # Species parameters
        config.species_set_config.compatibility_threshold = 3.0
        
        # Stagnation parameters
        config.stagnation_config.species_fitness_func = 'max'
        config.stagnation_config.max_stagnation = 20
        config.stagnation_config.species_elitism = 2
        
        # Reproduction parameters
        config.reproduction_config.elitism = 2
        config.reproduction_config.survival_threshold = 0.2
        
        self.config = config
    
    def eval_genomes(self, genomes, config):
        """Evaluate all genomes in the population"""
        for genome_id, genome in genomes:
            # Create neural network
            net = neat.nn.FeedForwardNetwork.create(genome, config)
            
            # Test the genome
            result = self.game.test_ai(net)
            
            # Set fitness
            genome.fitness = result['fitness']
    
    def run_generation(self):
        """Run one generation of training"""
        if not self.population:
            return {}
        
        # Run the population for one generation
        self.population.run(self.eval_genomes, 1)
        
        # Get statistics
        generation = self.population.generation
        best_genome = max(self.population.population.values(), key=lambda x: x.fitness)
        
        # Calculate statistics
        fitnesses = [genome.fitness for genome in self.population.population.values()]
        avg_fitness = np.mean(fitnesses)
        best_fitness = best_genome.fitness
        
        # Calculate diversity (number of species)
        diversity = len(self.population.species.species)
        
        # Store best genome
        self.best_genome = best_genome
        
        return {
            'generation': generation,
            'best_fitness': best_fitness,
            'avg_fitness': avg_fitness,
            'diversity': diversity,
            'best_genome': best_genome,
            'population_size': len(self.population.population),
            'species_count': diversity
        }
    
    def get_best_genome(self):
        """Get the best genome from training"""
        return self.best_genome
    
    def save_best_genome(self, filename):
        """Save the best genome to file"""
        if self.best_genome:
            with open(filename, 'wb') as f:
                pickle.dump(self.best_genome, f)
            return True
        return False
    
    def load_genome(self, filename):
        """Load a genome from file"""
        with open(filename, 'rb') as f:
            self.best_genome = pickle.load(f)
        return self.best_genome
    
    def get_training_stats(self):
        """Get training statistics"""
        if self.stats:
            return {
                'generations': self.stats.get_fitness_stat('max'),
                'species': self.stats.get_species_sizes(),
                'best_fitness_history': self.stats.get_fitness_stat('max'),
                'avg_fitness_history': self.stats.get_fitness_stat('mean')
            }
        return {}
    
    def create_visualization_data(self):
        """Create data for neural network visualization"""
        if not self.best_genome:
            return None
        
        nodes = []
        connections = []
        
        # Add input nodes
        for i in range(self.config.genome_config.num_inputs):
            nodes.append({
                'id': f'input_{i}',
                'type': 'input',
                'x': 50,
                'y': 50 + i * 40,
                'label': f'Input {i}'
            })
        
        # Add hidden nodes
        hidden_nodes = [node for node in self.best_genome.nodes.keys() 
                       if node not in range(self.config.genome_config.num_inputs) 
                       and node not in range(self.config.genome_config.num_inputs, 
                                           self.config.genome_config.num_inputs + self.config.genome_config.num_outputs)]
        
        for i, node_id in enumerate(hidden_nodes):
            nodes.append({
                'id': f'hidden_{node_id}',
                'type': 'hidden',
                'x': 200,
                'y': 100 + i * 30,
                'label': f'Hidden {node_id}'
            })
        
        # Add output nodes
        for i in range(self.config.genome_config.num_outputs):
            nodes.append({
                'id': f'output_{i}',
                'type': 'output',
                'x': 350,
                'y': 80 + i * 50,
                'label': f'Output {i}'
            })
        
        # Add connections
        for connection in self.best_genome.connections.values():
            if connection.enabled:
                source_id = f'{"input" if connection.key[0] < self.config.genome_config.num_inputs else "hidden"}_{connection.key[0]}'
                target_id = f'{"output" if connection.key[1] >= self.config.genome_config.num_inputs else "hidden"}_{connection.key[1]}'
                
                connections.append({
                    'source': source_id,
                    'target': target_id,
                    'weight': connection.weight,
                    'enabled': connection.enabled
                })
        
        return {
            'nodes': nodes,
            'connections': connections,
            'fitness': self.best_genome.fitness
        } 