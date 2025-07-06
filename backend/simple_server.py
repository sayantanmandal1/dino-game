from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uvicorn
import json
import random
import time
import asyncio
from datetime import datetime

app = FastAPI(
    title="Dino AI Trainer API",
    description="Advanced AI training platform for the Chrome Dinosaur Game",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock data for demonstration
class TrainingConfig(BaseModel):
    population_size: int = 50
    fitness_threshold: int = 1000
    max_generations: int = 100
    mutation_rate: float = 0.8
    crossover_rate: float = 0.7

class TrainingStatus(BaseModel):
    is_training: bool = False
    current_generation: int = 0
    best_fitness: float = 0
    avg_fitness: float = 0
    total_generations: int = 0

# Global state
training_status = TrainingStatus()
training_stats = []
connected_clients = []

@app.get("/")
async def root():
    return {
        "message": "🦖 Dino AI Trainer API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/training/status")
async def get_training_status():
    return training_status

@app.post("/api/training/start")
async def start_training(config: TrainingConfig):
    training_status.is_training = True
    training_status.current_generation = 0
    training_status.best_fitness = 0
    training_status.avg_fitness = 0
    training_stats.clear()
    
    # Start mock training simulation
    asyncio.create_task(mock_training(config))
    
    return {"message": "Training started", "config": config}

@app.post("/api/training/stop")
async def stop_training():
    training_status.is_training = False
    return {"message": "Training stopped"}

@app.get("/api/training/stats")
async def get_training_stats():
    return training_stats

@app.get("/api/models")
async def get_models():
    return [
        {
            "id": 1,
            "name": "dino_model_20241206_143022.pkl",
            "size": 24576,
            "fitness": 1250,
            "generations": 45,
            "date": "2024-12-06 14:30:22",
            "status": "trained",
        },
        {
            "id": 2,
            "name": "dino_model_20241205_091545.pkl",
            "size": 18944,
            "fitness": 980,
            "generations": 32,
            "date": "2024-12-05 09:15:45",
            "status": "trained",
        }
    ]

@app.websocket("/ws/training")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            # Send training updates
            if training_status.is_training:
                await websocket.send_text(json.dumps({
                    "type": "training_update",
                    "data": {
                        "generation": training_status.current_generation,
                        "best_fitness": training_status.best_fitness,
                        "avg_fitness": training_status.avg_fitness,
                        "is_training": training_status.is_training
                    }
                }))
            
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def mock_training(config: TrainingConfig):
    """Mock training simulation"""
    generation = 0
    
    while training_status.is_training and generation < config.max_generations:
        generation += 1
        
        # Simulate training progress
        training_status.current_generation = generation
        training_status.best_fitness += random.uniform(20, 50)
        training_status.avg_fitness += random.uniform(10, 30)
        
        # Add to stats
        training_stats.append({
            "generation": generation,
            "bestFitness": training_status.best_fitness,
            "avgFitness": training_status.avg_fitness,
            "diversity": random.uniform(5, 20)
        })
        
        # Notify connected clients
        for client in connected_clients:
            try:
                await client.send_text(json.dumps({
                    "type": "training_update",
                    "data": {
                        "generation": generation,
                        "bestFitness": training_status.best_fitness,
                        "avgFitness": training_status.avg_fitness,
                        "is_training": training_status.is_training
                    }
                }))
            except:
                pass
        
        await asyncio.sleep(2)  # Simulate training time
    
    training_status.is_training = False

if __name__ == "__main__":
    print("🚀 Starting Dino AI Trainer API Server...")
    print("📍 API will be available at: http://localhost:8000")
    print("📚 API Documentation at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000) 