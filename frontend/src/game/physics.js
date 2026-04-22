// SPDX-License-Identifier: MIT
// Canonical game physics constants — MUST mirror backend/app/physics.py.
// Values derived from Chromium's trex.js reference implementation.

export const CANVAS_WIDTH = 600;
export const CANVAS_HEIGHT = 150;
export const GROUND_Y = 127;

export const DINO_WIDTH = 44;
export const DINO_HEIGHT = 47;
export const DINO_WIDTH_DUCK = 59;
export const DINO_HEIGHT_DUCK = 25;
export const DINO_X = 25;

export const GRAVITY = 0.6;
export const JUMP_VELOCITY = -10.0;
export const MAX_JUMP_HEIGHT = 30;
export const MIN_JUMP_HEIGHT = 22;
export const SPEED_DROP_COEFFICIENT = 3.0;

export const CACTUS_SMALL_WIDTH = 17;
export const CACTUS_SMALL_HEIGHT = 35;
export const CACTUS_LARGE_WIDTH = 25;
export const CACTUS_LARGE_HEIGHT = 50;

export const PTERODACTYL_WIDTH = 46;
export const PTERODACTYL_HEIGHT = 40;
export const PTERODACTYL_Y_POSITIONS = [100, 75, 50];
export const PTERODACTYL_MIN_SCORE = 450;
export const PTERODACTYL_ANIM_FPS = 6;

export const GAP_COEFFICIENT = 0.6;
export const MAX_GAP_COEFFICIENT = 1.5;
// Per-obstacle-type minimum-gap contribution (Chromium parity):
//   SMALL_CACTUS, LARGE_CACTUS -> 120, PTERODACTYL -> 150
export const OBSTACLE_MIN_GAP = {
  cactus_small: 120,
  cactus_large: 120,
  pterodactyl: 150,
};
export const MIN_GAP = 120;
export const MAX_OBSTACLE_DUPLICATION = 2;
// First obstacle cannot appear until the dino has run this many frames.
// Gives the player a moment to see the track start (Chromium shows the
// starting "press space" overlay; we skip the overlay but keep the delay).
export const CLEAR_TIME = 90;  // frames (~1.5 s at 60fps)

export const INITIAL_SPEED = 6.0;
export const MAX_SPEED = 13.0;
export const ACCELERATION = 0.001;

export const SCORE_PER_FRAME = 0.025;
export const ACHIEVEMENT_DISTANCE = 100;
export const NIGHT_CYCLE_DISTANCE = 700;

export const COLLISION_PAD = 1;

export const NUM_INPUTS = 6;
export const NUM_OUTPUTS = 3;

export const DinoState = Object.freeze({
  WAITING: 'waiting',
  RUNNING: 'running',
  JUMPING: 'jumping',
  DUCKING: 'ducking',
  CRASHED: 'crashed',
});

export function normalizeSensors(distNext, obsWidth, obsHeight, obsY, speed, dinoY) {
  const clamp = (v) => Math.max(0, Math.min(1, v));
  return [
    clamp(distNext / CANVAS_WIDTH),
    clamp(obsWidth / 100.0),
    clamp(obsHeight / 100.0),
    clamp(obsY / CANVAS_HEIGHT),
    clamp((speed - INITIAL_SPEED) / (MAX_SPEED - INITIAL_SPEED + 1e-9)),
    clamp((GROUND_Y - dinoY) / 100.0),
  ];
}
