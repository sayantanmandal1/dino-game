# 🦖 Dino AI Trainer

A **pixel-accurate Chrome offline dino game** paired with a **real NEAT (NeuroEvolution of Augmenting Topologies) training backend**. Train a neural network over generations in the browser, watch it learn to dodge cacti and pterodactyls, then hand it the controls and race it against a human on the leaderboard.

![FastAPI](https://img.shields.io/badge/FastAPI-0.110-green)
![React](https://img.shields.io/badge/React-19-blue)
![NEAT](https://img.shields.io/badge/NEAT-Python-orange)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)

---

## ✨ Features

- **Pixel-perfect Chrome dino replica** — official Chromium sprite sheet, canonical physics constants, day/night cycle, pterodactyls after score 450, 100-point milestone flash, procedural Web Audio sound.
- **Real NEAT training** — parallel headless fitness evaluation (`ParallelEvaluator`), live WebSocket progress stream, speciation, elitism, reproducible runs via seeded RNG.
- **AI autopilot** — a trained genome plays the game in your browser via a per-frame inference WebSocket.
- **Model registry** — SQLite-backed metadata + versioned pickle files on a Docker volume. Upload / download / delete / test.
- **Genome visualizer** — interactive SVG graph of inputs → hidden → outputs with weight polarity and magnitude.
- **Leaderboard** — separate ranks for human and AI play, persists across container restarts.
- **One-command bring-up** — `docker compose up` starts the full stack behind an nginx reverse proxy.

---

## 🚀 Quick start

```bash
git clone <this repo>
cd dino-game
cp .env.example .env   # optional; defaults work
docker compose up -d --build
```

Open **http://localhost:3000**. Done.

First container start runs DB migrations automatically; models and the leaderboard persist in the `dino-data` Docker volume.

---

## 🏗️ Architecture

```
┌──────────────────────────┐      ┌──────────────────────────────┐
│  React 19 + MUI 7        │      │  FastAPI + SQLAlchemy async  │
│  Canvas 2D game engine   │◄────►│  neat-python trainer         │
│  WebSocket: /ws/training │  WS  │  ParallelEvaluator workers   │
│  WebSocket: /ws/play     │  +   │  Headless deterministic sim  │
│  REST: /api/*            │ REST │  SQLite + pickle volume      │
└──────────────────────────┘      └──────────────────────────────┘
       nginx :3000                        uvicorn :8000
         (reverse proxy /api + /ws → backend)
```

Canonical physics constants live in **two places that must agree**:

- `backend/app/physics.py` — used by the headless simulator during NEAT fitness evaluation.
- `frontend/src/game/physics.js` — used by the in-browser game engine.

Any change to gravity, jump velocity, spawn gaps, etc. **must be mirrored** in both files so training transfers to the browser.

---

## 🗂️ Layout

```
dino-game/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py        app entry + lifespan
│       ├── physics.py     canonical constants
│       ├── simulator.py   headless dino sim
│       ├── neat/          config.ini, trainer, inference
│       ├── routers/       health, training, inference, models, leaderboard
│       └── services/      training_manager, model_store
├── frontend/
│   ├── Dockerfile         multi-stage → nginx
│   ├── nginx.conf         SPA fallback + /api /ws proxy
│   └── src/
│       ├── game/          GameEngine, entities, sprites, sound, input, physics
│       ├── components/    DinoCanvas, NetworkGraph, Layout, ErrorBoundary
│       ├── pages/         Home, PlayGame, TrainModel, VisualizeModel,
│       │                  SavedModels, Leaderboard, About
│       ├── hooks/         useTrainingSocket, useAiAutopilot
│       └── api/           client (REST), ws (WebSocket helper)
├── tests/                 Playwright E2E suite
└── .github/workflows/ci.yml
```

---

## 🧠 How training works

1. User submits parameters from **Train Model** → `POST /api/training/start`.
2. Backend spawns an `asyncio` task that drives `neat.Population` generation-by-generation.
3. Each genome is evaluated against the **same headless `DinoSimulator` physics** the browser uses, across 3 seeds averaged, using `neat.ParallelEvaluator` when multiple workers are configured (`NEAT_WORKERS=auto` by default).
4. After each generation the manager broadcasts a `TrainingUpdate` JSON event (generation, best/mean fitness, species count, elapsed) to all `/api/training/ws/training` subscribers. Clients reconnecting mid-run receive a **replay of recent events**.
5. On completion the best genome is pickled, hashed, and stored in `data/models/{uuid}.pkl` with a `Model` row in SQLite.

---

## 🎮 How the AI plays

1. **Play Game** opens `/api/ws/play/{model_id}`.
2. The frontend's `GameEngine` invokes `autopilot(sensors)` each fixed-timestep step (60 Hz). The hook sends the 6-dim sensor vector over WS, and asynchronously receives actions (`jump | duck | noop`) which are cached as the current decision.
3. If the socket drops, the browser falls back to the last action and attempts automatic reconnection with exponential backoff (`frontend/src/api/ws.js`).

---

## 🧪 Testing

**Backend unit tests** (simulator determinism, API surface):

```bash
cd backend
pip install -r requirements.txt
pytest -q
```

**End-to-end tests** (against a running stack):

```bash
docker compose up -d --build
cd tests
npm install
npx playwright install --with-deps chromium
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
```

CI runs all three jobs (backend pytest, frontend build, Dockerized E2E) on every push / PR.

---

## ⚙️ Environment

See `.env.example`:

| Var                | Default                                        | Purpose |
|--------------------|------------------------------------------------|---------|
| `FRONTEND_PORT`    | `3000`                                         | Host port mapped to the frontend container (nginx listens on 3000) |
| `BACKEND_PORT`     | `8000`                                         | Host port mapped to uvicorn |
| `NEAT_WORKERS`     | `auto`                                         | `auto` = `cpu_count - 1`; `1` forces serial (required for Windows-native dev outside Docker) |
| `ALLOWED_ORIGINS`  | `["http://localhost:3000","http://127.0.0.1:3000"]` | JSON list for CORS |
| `DATABASE_URL`     | `sqlite+aiosqlite:////app/data/dino.db`        | SQLAlchemy URL |

---

## 🖼️ Attribution

Sprite assets originate from Chromium's offline dino game and are © **The Chromium Authors** (BSD-licensed). They are redistributed here unmodified for use by this project.

All rendering, physics mirroring, NEAT integration, backend services, and platform tooling are original MIT-licensed code.

---

## 📄 License

MIT.
# 🦖 Dino AI Trainer - Advanced AI Training Platform

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green.svg)](https://fastapi.tiangolo.com/)
[![NEAT](https://img.shields.io/badge/NEAT-Python-orange.svg)](https://neat-python.readthedocs.io/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.0-blue.svg)](https://mui.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **A cutting-edge, FAANG-level AI training platform that demonstrates advanced neural network evolution using the NEAT algorithm to master the Chrome Dinosaur Game.**

## 🚀 Features

### 🧠 Advanced AI Training
- **NEAT Algorithm Implementation**: NeuroEvolution of Augmenting Topologies for neural network evolution
- **Real-time Training**: Watch AI learn and improve through generations
- **Interactive Controls**: Start, stop, and configure training parameters
- **Advanced Analytics**: Comprehensive training statistics and progress tracking

### 🎮 Interactive Game Engine
- **Chrome Dino Game**: Full implementation with physics and collision detection
- **AI vs Human Play**: Compare AI performance with human gameplay
- **Real-time Visualization**: Watch AI make decisions in real-time
- **Customizable Difficulty**: Adjust game speed and parameters

### 📊 Professional Visualizations
- **Neural Network Graphs**: Interactive visualization of network architecture
- **Training Progress Charts**: Real-time fitness and diversity tracking
- **Performance Metrics**: Accuracy, precision, recall, and F1-score analysis
- **Animated Components**: Smooth transitions and professional animations

### 💾 Model Management
- **Save/Load Models**: Persistent storage of trained neural networks
- **Version Control**: Track different model versions and performance
- **Model Testing**: Comprehensive testing and evaluation tools
- **Export/Import**: Share models across different environments

### 🎨 Professional UI/UX
- **Material-UI Design**: Modern, responsive interface
- **Dark Theme**: Eye-friendly dark mode with gradient accents
- **Smooth Animations**: Framer Motion powered transitions
- **Mobile Responsive**: Works perfectly on all devices
- **Professional Layout**: FAANG-level design standards

## 🛠️ Technology Stack

### Frontend
- **React 19.1.0** - Modern React with latest features
- **Material-UI 5** - Professional component library
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Professional data visualization
- **React Router** - Client-side routing

### Backend
- **FastAPI** - High-performance Python web framework
- **NEAT-Python** - Neural network evolution library
- **Pygame** - Game engine for simulation
- **NumPy** - Numerical computing
- **Matplotlib** - Data visualization

### AI/ML
- **NEAT Algorithm** - NeuroEvolution of Augmenting Topologies
- **Neural Networks** - Feed-forward networks with evolution
- **Genetic Algorithms** - Population-based optimization
- **Real-time Evolution** - Live training visualization

## 🏗️ Architecture

```
dino/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── assets/         # Static assets
│   └── public/             # Public files
├── backend/                 # FastAPI server
│   ├── main.py             # FastAPI application
│   ├── game_engine.py      # Game simulation engine
│   ├── neat_trainer.py     # NEAT algorithm implementation
│   └── requirements.txt    # Python dependencies
└── Assets/                 # Game sprites and assets
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dino
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Backend Dependencies**
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Start the Backend Server**
   ```bash
   cd backend
   python main.py
   ```
   The API will be available at `http://localhost:8000`

5. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   The application will open at `http://localhost:3000`

## 🎯 Usage

### Training AI Models
1. Navigate to the **Train Model** page
2. Configure training parameters (population size, generations, etc.)
3. Click **Start Training** to begin the evolution process
4. Watch real-time progress and statistics
5. Save the best performing model

### Playing the Game
1. Go to the **Play Game** page
2. Choose between manual play or AI mode
3. Use spacebar or arrow keys to control the dinosaur
4. Watch AI performance in real-time

### Visualizing Networks
1. Visit the **Visualize** page
2. Explore the neural network architecture
3. Toggle weight and activation displays
4. Animate the network to see activations

### Managing Models
1. Access the **Saved Models** page
2. View all trained models with statistics
3. Test models against the game
4. Download or delete models as needed

## 📈 Performance Metrics

The platform tracks comprehensive metrics including:
- **Fitness Scores**: Evolution progress over generations
- **Population Diversity**: Genetic diversity maintenance
- **Training Speed**: Generations per second
- **Model Accuracy**: Performance on test scenarios
- **Network Complexity**: Node and connection counts

## 🎨 Design Philosophy

This project demonstrates **FAANG-level** software engineering principles:

- **Scalable Architecture**: Modular design for easy extension
- **Professional UI/UX**: Modern, intuitive interface
- **Real-time Performance**: Optimized for live data visualization
- **Responsive Design**: Works seamlessly across devices
- **Clean Code**: Well-documented, maintainable codebase
- **Testing Ready**: Structured for comprehensive testing

## 🔬 Technical Highlights

### NEAT Algorithm Implementation
- **Innovation Tracking**: Historical marking for genetic innovation
- **Species Management**: Automatic speciation for diversity
- **Complexity Control**: Minimal topology evolution
- **Fitness Sharing**: Species-based fitness evaluation

### Real-time Visualization
- **Canvas-based Rendering**: High-performance graphics
- **WebSocket Integration**: Live data streaming
- **Smooth Animations**: 60fps transitions and effects
- **Interactive Controls**: Real-time parameter adjustment

### Professional Backend
- **FastAPI Framework**: High-performance async API
- **WebSocket Support**: Real-time bidirectional communication
- **File Management**: Secure model storage and retrieval
- **Error Handling**: Comprehensive error management

## 🎓 Learning Outcomes

This project demonstrates mastery of:
- **Full-Stack Development**: React + FastAPI integration
- **AI/ML Implementation**: Advanced genetic algorithms
- **Real-time Systems**: WebSocket and live data handling
- **Professional UI/UX**: Material-UI and animation design
- **System Architecture**: Scalable, maintainable code structure
- **Performance Optimization**: Efficient rendering and computation

## 🤝 Contributing

This is a showcase project demonstrating advanced software engineering skills. The codebase is structured to be:
- **Educational**: Well-documented for learning purposes
- **Extensible**: Easy to add new features
- **Professional**: Following industry best practices
- **Maintainable**: Clean, organized code structure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **NEAT Algorithm**: Kenneth O. Stanley and Risto Miikkulainen
- **Chrome Dino Game**: Google Chrome team
- **React Community**: For the amazing ecosystem
- **FastAPI**: For the high-performance Python framework
- **Material-UI**: For the professional component library

---

**Built with ❤️ using cutting-edge AI and modern web technologies**

*This project demonstrates professional full-stack development and advanced machine learning techniques suitable for top-tier software engineering positions.*