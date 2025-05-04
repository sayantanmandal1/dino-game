# Chrome Dinosaur Game AI with NEAT

This project uses NEAT (NeuroEvolution of Augmenting Topologies) to train an AI to play the Chrome Dinosaur Game. The application includes a web interface built with Streamlit for visualizing the training process and playing the game.

![Dinosaur Game AI](https://i.imgur.com/XQJjsXK.gif)

## Features

- **AI Training**: Train an AI model using NEAT to play the dinosaur game
- **Training Visualization**: Watch the AI learn in real-time with progress charts
- **Game Playback**: See how the trained AI performs
- **Play Yourself**: Try playing the game yourself to compare with the AI

## How It Works

### NEAT Algorithm

NEAT (NeuroEvolution of Augmenting Topologies) is a genetic algorithm that evolves neural networks. It starts with simple networks and gradually adds complexity through:

1. **Mutation**: Adding nodes and connections to networks
2. **Crossover**: Combining successful networks
3. **Speciation**: Grouping similar networks to preserve innovation

### Game Environment

The game environment is a simplified version of the Chrome Dinosaur Game:
- The dinosaur can jump over cacti and duck under birds
- Obstacles move at increasing speeds
- The goal is to survive as long as possible

### Neural Network Inputs

The AI receives 5 inputs:
- Distance to the next obstacle
- Current game speed
- Type of obstacle (bird or cactus)
- Whether the dinosaur is currently jumping
- Height difference between dinosaur and obstacle

### Neural Network Outputs

The AI produces 3 outputs:
- Jump
- Duck
- Do nothing

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/dino-neat.git
cd dino-neat
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
streamlit run app.py
```

## Usage

### Training a New Model

1. Navigate to the "Train Model" page
2. Click the "Start Training" button
3. Watch as the AI learns to play through multiple generations
4. The best model will be saved automatically

### Viewing Results

1. Navigate to the "View Results" page
2. Click "Watch AI Play" to see the trained AI in action
3. View statistics about the neural network structure

### Playing Yourself

1. Navigate to the "Play Yourself" page
2. Click "Start Game" to play
3. Use Space to jump and Down Arrow to duck

## Project Structure

- **app.py**: Main Streamlit application
- **visualize.py**: NEAT visualization utilities
- **neat_config.txt**: Configuration for the NEAT algorithm

## How NEAT Learns to Play

1. **Initial Population**: The algorithm starts with a population of simple neural networks
2. **Evaluation**: Each network plays the game and receives a fitness score based on how long it survives
3. **Selection**: Networks with higher fitness are more likely to reproduce
4. **Reproduction**: New networks are created through mutation and crossover
5. **Iteration**: The process repeats for multiple generations, gradually improving performance

## Technologies Used

- **Streamlit**: Web interface
- **Pygame**: Game engine
- **NEAT-Python**: Implementation of the NEAT algorithm
- **Matplotlib**: Visualization of training progress
- **Pillow**: Image processing for GIF creation

## Future Improvements

- Add more complex obstacles and game mechanics
- Implement transfer learning to speed up training
- Add more detailed analytics of AI decision-making
- Support for saving and loading multiple models

## License

This project is licensed under the MIT License - see the LICENSE file for details.