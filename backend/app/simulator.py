"""Headless deterministic dino-game simulator for NEAT fitness evaluation.

Mirrors the frontend `GameEngine` physics exactly. Pure Python (no pygame),
fully seedable, returns a sensor vector each step compatible with
``physics.NUM_INPUTS``.
"""
from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from typing import Callable, List, Optional

from . import physics as P


@dataclass
class Obstacle:
    x: float
    y: float
    width: float
    height: float
    kind: str  # "cactus_small" | "cactus_large" | "pterodactyl"
    next_gap: int = 0  # distance-based gap before the next obstacle may spawn


@dataclass
class SimState:
    dino_y: float = P.GROUND_Y - P.DINO_HEIGHT
    dino_vy: float = 0.0
    dino_w: float = P.DINO_WIDTH
    dino_h: float = P.DINO_HEIGHT
    is_ducking: bool = False
    speed: float = P.INITIAL_SPEED
    score: float = 0.0
    frames: int = 0
    obstacles: List[Obstacle] = field(default_factory=list)
    alive: bool = True
    clear_timer: int = P.CLEAR_TIME


class DinoSimulator:
    """Deterministic, seedable headless simulator."""

    def __init__(self, seed: Optional[int] = None, max_frames: int = 60 * 60 * 3):
        self.rng = random.Random(seed if seed is not None else 0)
        self.max_frames = max_frames
        self.state = SimState()

    # ------------------------------------------------------------------
    def _required_gap(self, prev: Obstacle) -> int:
        """Chromium-parity: gap is chosen once per previous-obstacle, in
        [min_gap, min_gap * MAX_GAP_COEFFICIENT] where
        min_gap = round(prev.width * speed + type_min * GAP_COEFFICIENT)."""
        if prev.next_gap > 0:
            return prev.next_gap
        type_min = P.OBSTACLE_MIN_GAP.get(prev.kind, P.MIN_GAP)
        min_gap = round(prev.width * self.state.speed + type_min * P.GAP_COEFFICIENT)
        max_gap = round(min_gap * P.MAX_GAP_COEFFICIENT)
        prev.next_gap = self.rng.randint(min_gap, max_gap)
        return prev.next_gap

    def _maybe_spawn(self) -> None:
        s = self.state
        # Initial clear period.
        if s.clear_timer > 0:
            s.clear_timer -= 1
            if not s.obstacles:
                return
        if s.obstacles:
            prev = s.obstacles[-1]
            gap = self._required_gap(prev)
            if prev.x + prev.width > P.CANVAS_WIDTH - gap:
                return

        kinds = ["cactus_small", "cactus_large"]
        if s.score >= P.PTERODACTYL_MIN_SCORE:
            kinds.append("pterodactyl")
        kind = self.rng.choice(kinds)

        if kind == "cactus_small":
            count = self.rng.randint(1, P.MAX_OBSTACLE_DUPLICATION)
            w = P.CACTUS_SMALL_WIDTH * count
            h = P.CACTUS_SMALL_HEIGHT
            y = P.GROUND_Y - h
        elif kind == "cactus_large":
            count = self.rng.randint(1, P.MAX_OBSTACLE_DUPLICATION)
            w = P.CACTUS_LARGE_WIDTH * count
            h = P.CACTUS_LARGE_HEIGHT
            y = P.GROUND_Y - h
        else:  # pterodactyl
            w = P.PTERODACTYL_WIDTH
            h = P.PTERODACTYL_HEIGHT
            y = self.rng.choice(P.PTERODACTYL_Y_POSITIONS) - h

        s.obstacles.append(Obstacle(
            x=float(P.CANVAS_WIDTH), y=float(y),
            width=float(w), height=float(h), kind=kind,
        ))

    # ------------------------------------------------------------------
    def _update_dino(self, action: str) -> None:
        s = self.state
        on_ground = s.dino_y >= P.GROUND_Y - P.DINO_HEIGHT - 0.001

        if action == "jump" and on_ground and not s.is_ducking:
            s.dino_vy = P.JUMP_VELOCITY
        if action == "duck":
            if on_ground:
                s.is_ducking = True
                s.dino_w = P.DINO_WIDTH_DUCK
                s.dino_h = P.DINO_HEIGHT_DUCK
            else:
                # fast-fall when ducking mid-jump
                s.dino_vy += P.GRAVITY * P.SPEED_DROP_COEFFICIENT
        else:
            if on_ground:
                s.is_ducking = False
                s.dino_w = P.DINO_WIDTH
                s.dino_h = P.DINO_HEIGHT

        # Apply gravity
        s.dino_vy += P.GRAVITY
        s.dino_y += s.dino_vy

        # Floor clamp
        floor_y = P.GROUND_Y - s.dino_h
        if s.dino_y > floor_y:
            s.dino_y = floor_y
            s.dino_vy = 0.0

    def _update_obstacles(self) -> None:
        s = self.state
        for o in s.obstacles:
            o.x -= s.speed
        s.obstacles = [o for o in s.obstacles if o.x + o.width > -5]

    def _check_collision(self) -> bool:
        s = self.state
        # Tight sub-rect hitbox matches frontend Dino.getBox() insets.
        pad_x = 3
        pad_y = 4
        dx1 = P.DINO_X + pad_x
        dy1 = s.dino_y + pad_y
        dx2 = P.DINO_X + s.dino_w - pad_x
        dy2 = s.dino_y + s.dino_h - pad_y
        for o in s.obstacles:
            if dx2 < o.x or dx1 > o.x + o.width:
                continue
            if dy2 < o.y or dy1 > o.y + o.height:
                continue
            return True
        return False

    # ------------------------------------------------------------------
    def next_obstacle(self) -> Optional[Obstacle]:
        s = self.state
        ahead = [o for o in s.obstacles if o.x + o.width >= P.DINO_X]
        if not ahead:
            return None
        return min(ahead, key=lambda o: o.x)

    def sensors(self) -> List[float]:
        s = self.state
        nxt = self.next_obstacle()
        if nxt is None:
            dist = float(P.CANVAS_WIDTH)
            ow = oh = 0.0
            oy = float(P.GROUND_Y)
        else:
            dist = nxt.x - P.DINO_X
            ow = nxt.width
            oh = nxt.height
            oy = nxt.y
        return P.normalize_sensors(dist, ow, oh, oy, s.speed, s.dino_y)

    # ------------------------------------------------------------------
    def step(self, action: str) -> bool:
        s = self.state
        if not s.alive:
            return False

        self._update_dino(action)
        self._update_obstacles()
        self._maybe_spawn()

        if self._check_collision():
            s.alive = False
            return False

        s.score += s.speed * P.SCORE_PER_FRAME
        s.speed = min(P.MAX_SPEED, s.speed + P.ACCELERATION)
        s.frames += 1
        if s.frames >= self.max_frames:
            s.alive = False
            return False
        return True

    def run(self, policy: Callable[[List[float]], str]) -> float:
        """Run a full episode with the given policy, return fitness."""
        while self.state.alive:
            action = policy(self.sensors())
            self.step(action)
        # fitness = score + small survival bonus
        return float(self.state.score) + self.state.frames * 0.01
