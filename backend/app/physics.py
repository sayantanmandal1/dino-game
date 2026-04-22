"""Canonical physics constants for the Chrome dino game.

These MUST match ``frontend/src/game/physics.js`` byte-for-byte semantically.
Values derived from Chromium's ``trex.js`` reference implementation.
All speeds are expressed in pixels per 60Hz frame, so one "unit of time" is
(1/60) s. The headless simulator in ``simulator.py`` steps at the same rate.
"""
from __future__ import annotations

from dataclasses import dataclass

# ---------------- Canvas / world ----------------
CANVAS_WIDTH = 600
CANVAS_HEIGHT = 150
GROUND_Y = 127  # y-coordinate of ground line (dino feet rest here)

# ---------------- Dino ----------------
DINO_WIDTH = 44
DINO_HEIGHT = 47
DINO_WIDTH_DUCK = 59
DINO_HEIGHT_DUCK = 25
DINO_X = 25  # fixed x position

GRAVITY = 0.6  # px/frame^2
JUMP_VELOCITY = -10.0  # px/frame (negative = up)
MAX_JUMP_HEIGHT = 30
MIN_JUMP_HEIGHT = 22
SPEED_DROP_COEFFICIENT = 3.0  # faster-fall when duck pressed mid-jump

# ---------------- Obstacles ----------------
# Cactus dims indexed by size variant (small, large). Chrome uses 3 width
# multipliers per size; we model that via ``width_count``.
CACTUS_SMALL_WIDTH = 17
CACTUS_SMALL_HEIGHT = 35
CACTUS_LARGE_WIDTH = 25
CACTUS_LARGE_HEIGHT = 50

PTERODACTYL_WIDTH = 46
PTERODACTYL_HEIGHT = 40
PTERODACTYL_Y_POSITIONS = (100, 75, 50)  # altitudes: low / mid / high
PTERODACTYL_MIN_SCORE = 450  # only spawn after this score
PTERODACTYL_ANIM_FPS = 6

# Obstacle spawn gap (px) scales with speed: gap = rand(min, max) * speed
GAP_COEFFICIENT = 0.6
MAX_GAP_COEFFICIENT = 1.5
MIN_GAP = 120
OBSTACLE_MIN_GAP = {
    "cactus_small": 120,
    "cactus_large": 120,
    "pterodactyl": 150,
}
MAX_OBSTACLE_DUPLICATION = 2  # up to N cacti stacked horizontally
CLEAR_TIME = 90  # frames before first obstacle

# ---------------- Game speed ----------------
INITIAL_SPEED = 6.0
MAX_SPEED = 13.0
ACCELERATION = 0.001  # speed delta per frame

# ---------------- Scoring ----------------
SCORE_PER_FRAME = 0.025  # Chromium parity; multiplied by current speed each frame
ACHIEVEMENT_DISTANCE = 100  # flash every 100 points
NIGHT_CYCLE_DISTANCE = 700  # day/night flip interval

# ---------------- Collision padding (Chrome uses tight hitbox) ----------------
COLLISION_PAD = 1


@dataclass(frozen=True)
class DinoState:
    RUNNING = "running"
    JUMPING = "jumping"
    DUCKING = "ducking"
    CRASHED = "crashed"
    WAITING = "waiting"


# ---------------- NEAT sensor inputs ----------------
# Vector passed to the neural network each frame. Keep order stable —
# the NEAT config expects exactly NUM_INPUTS.
NUM_INPUTS = 6
NUM_OUTPUTS = 3  # [jump, duck, noop]


def normalize_sensors(
    dist_next: float,
    obs_width: float,
    obs_height: float,
    obs_y: float,
    speed: float,
    dino_y: float,
) -> list[float]:
    """Return sensor vector normalized to roughly [0, 1]."""
    return [
        max(0.0, min(1.0, dist_next / CANVAS_WIDTH)),
        max(0.0, min(1.0, obs_width / 100.0)),
        max(0.0, min(1.0, obs_height / 100.0)),
        max(0.0, min(1.0, obs_y / CANVAS_HEIGHT)),
        max(0.0, min(1.0, (speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED + 1e-9))),
        max(0.0, min(1.0, (GROUND_Y - dino_y) / 100.0)),
    ]
