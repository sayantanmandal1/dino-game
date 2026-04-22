// SPDX-License-Identifier: MIT
// Fixed-timestep Chrome-dino-compatible game engine.

import * as P from './physics';
import { Dino } from './entities/Dino';
import { Obstacle, pickObstacleKind } from './entities/Obstacle';
import { CloudLayer } from './entities/Cloud';
import { Horizon } from './entities/Horizon';
import { SPRITES, spriteSheet } from './sprites';
import { sounds } from './sound';

const FIXED_DT = 1000 / 60;  // 60 FPS logic step
const DIGITS = 5;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class GameEngine {
  constructor(canvas, { seed = null, onEvent = () => {} } = {}) {
    this.canvas = canvas;
    // Add extra vertical breathing room on top so the HI/score and game-over text
    // never clip at the top edge of the canvas element. Game physics stay identical
    // (GROUND_Y / CANVAS_HEIGHT unchanged); we just translate draws down by PAD_TOP.
    this.PAD_TOP = 40;
    this.canvas.width = P.CANVAS_WIDTH;
    this.canvas.height = P.CANVAS_HEIGHT + this.PAD_TOP;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.onEvent = onEvent;
    this.rng = seed !== null ? mulberry32(seed) : Math.random;

    this.dino = new Dino();
    this.obstacles = [];
    this.clouds = new CloudLayer(this.rng);
    this.horizon = new Horizon();

    this.speed = P.INITIAL_SPEED;
    this.score = 0;
    this.highScore = Number((typeof localStorage !== 'undefined' && localStorage.getItem('dino.hi')) || 0) || 0;
    this.night = false;
    this._lastNightFlip = 0;
    this._clearTimer = P.CLEAR_TIME;

    this._rafId = null;
    this._accum = 0;
    this._lastTs = 0;
    this._flashTimer = 0;

    this._paused = false;
    this._running = false;

    // AI autopilot hook: (sensors) => "jump"|"duck"|"noop"
    this._autopilot = null;
    this._aiDuckActive = false;
  }

  // --------------------------------------------------------------
  async load() {
    await spriteSheet.load();
  }

  setAutopilot(fn) { this._autopilot = fn; }
  clearAutopilot() {
    this._autopilot = null;
    if (this._aiDuckActive) {
      this.dino.setDuck(false);
      this._aiDuckActive = false;
    }
  }

  start() {
    if (this._running) return;
    this._running = true;
    this._paused = false;
    this.dino.startRunning();
    this._loop = this._loop.bind(this);
    this._lastTs = performance.now();
    this._rafId = requestAnimationFrame(this._loop);
    this.onEvent({ type: 'start' });
  }

  pause() { this._paused = true; }
  resume() {
    if (!this._running || !this._paused) return;
    this._paused = false;
    this._lastTs = performance.now();
    this._rafId = requestAnimationFrame(this._loop);
  }

  stop() {
    this._running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  reset(seed = null) {
    this.stop();
    this.rng = seed !== null ? mulberry32(seed) : Math.random;
    this.dino.reset();
    this.obstacles = [];
    this.clouds = new CloudLayer(this.rng);
    this.horizon = new Horizon();
    this.speed = P.INITIAL_SPEED;
    this.score = 0;
    this.night = false;
    this._lastNightFlip = 0;
    this._clearTimer = P.CLEAR_TIME;     // frames until the first obstacle may spawn
    this._paused = false;
    this._accum = 0;
    this._flashTimer = 0;
    this.render();
  }

  // --------------------------------------------------------------
  jump() {
    if (this.dino.state === P.DinoState.CRASHED) return;
    if (this.dino.y >= P.GROUND_Y - P.DINO_HEIGHT - 0.01) {
      sounds.jump();
    }
    this.dino.jump();
  }
  setDuck(down) { this.dino.setDuck(down); }

  // --------------------------------------------------------------
  // Chromium-parity gap formula: the next obstacle can spawn only when the
  // rightmost existing obstacle has travelled far enough left that the gap
  // between it and the right edge is at least `minGap`. The exact gap is a
  // random value in [minGap, minGap * MAX_GAP_COEFFICIENT].
  _requiredGap(prev) {
    const typeMin = P.OBSTACLE_MIN_GAP[prev.kind] ?? P.MIN_GAP;
    const minGap = Math.round(prev.w * this.speed + typeMin * P.GAP_COEFFICIENT);
    const maxGap = Math.round(minGap * P.MAX_GAP_COEFFICIENT);
    // Cache so `_spawnIfReady` uses a stable random gap per previous-obstacle.
    if (prev._nextGap === undefined) {
      prev._nextGap = minGap + Math.floor(this.rng() * (maxGap - minGap + 1));
    }
    return prev._nextGap;
  }

  _spawnIfReady() {
    // Initial clear period before the very first obstacle.
    if (this._clearTimer > 0) {
      this._clearTimer -= 1;
      if (this.obstacles.length === 0) return;
    }
    const prev = this.obstacles[this.obstacles.length - 1];
    if (prev) {
      const gap = this._requiredGap(prev);
      // Spawn only when there's `gap` px of open track to the right of `prev`.
      if (prev.x + prev.w > P.CANVAS_WIDTH - gap) return;
    }
    const kind = pickObstacleKind(this.score, this.rng);
    this.obstacles.push(new Obstacle(kind, this.speed, this.rng));
  }

  _collide() {
    const a = this.dino.getBox();
    for (const o of this.obstacles) {
      const b = o.getBox();
      if (a.x + a.w <= b.x || a.x >= b.x + b.w) continue;
      if (a.y + a.h <= b.y || a.y >= b.y + b.h) continue;
      return true;
    }
    return false;
  }

  _nextObstacle() {
    let best = null;
    for (const o of this.obstacles) {
      if (o.x + o.w < P.DINO_X) continue;
      if (!best || o.x < best.x) best = o;
    }
    return best;
  }

  sensors() {
    const nxt = this._nextObstacle();
    let dist = P.CANVAS_WIDTH;
    let ow = 0, oh = 0, oy = P.GROUND_Y;
    if (nxt) {
      dist = nxt.x - P.DINO_X;
      ow = nxt.w;
      oh = nxt.h;
      oy = nxt.y;
    }
    return P.normalizeSensors(dist, ow, oh, oy, this.speed, this.dino.y);
  }

  // --------------------------------------------------------------
  _step() {
    if (this.dino.state === P.DinoState.CRASHED) return;

    // AI autopilot
    if (this._autopilot) {
      const action = this._autopilot(this.sensors());
      if (action === 'jump') this.dino.jump();
      const wantDuck = action === 'duck';
      if (wantDuck !== this._aiDuckActive) {
        this.dino.setDuck(wantDuck);
        this._aiDuckActive = wantDuck;
      }
    }

    this.dino.update(FIXED_DT);
    for (const o of this.obstacles) o.update(FIXED_DT, this.speed);
    this.obstacles = this.obstacles.filter((o) => !o.isGone());
    this._spawnIfReady();
    this.clouds.update(FIXED_DT, this.speed);
    this.horizon.update(FIXED_DT, this.speed);

    if (this._collide()) {
      this.dino.crash();
      sounds.die();
      this.onEvent({ type: 'crash', score: Math.floor(this.score) });
      return;
    }

    const prevScore = Math.floor(this.score);
    // Chromium parity: score increments with distance traveled, scaled by SCORE_PER_FRAME.
    // distance per frame == speed, so the score ramps faster as the game speeds up.
    this.score += this.speed * P.SCORE_PER_FRAME;
    const nextScore = Math.floor(this.score);

    if (nextScore > prevScore &&
        Math.floor(nextScore / P.ACHIEVEMENT_DISTANCE) >
        Math.floor(prevScore / P.ACHIEVEMENT_DISTANCE)) {
      sounds.point();
      this._flashTimer = 1000;
      this.onEvent({ type: 'milestone', score: nextScore });
    }

    if (
      nextScore > 0 &&
      Math.floor(nextScore / P.NIGHT_CYCLE_DISTANCE) !==
        Math.floor(this._lastNightFlip / P.NIGHT_CYCLE_DISTANCE)
    ) {
      this.night = !this.night;
      this._lastNightFlip = nextScore;
    }

    this.speed = Math.min(P.MAX_SPEED, this.speed + P.ACCELERATION);
  }

  // --------------------------------------------------------------
  _loop(ts) {
    if (!this._running || this._paused) return;
    const delta = Math.min(100, ts - this._lastTs);
    this._lastTs = ts;
    this._accum += delta;
    while (this._accum >= FIXED_DT) {
      this._step();
      this._accum -= FIXED_DT;
      if (this.dino.state === P.DinoState.CRASHED) break;
    }
    if (this._flashTimer > 0) this._flashTimer -= delta;
    this.render();
    if (this.dino.state !== P.DinoState.CRASHED) {
      this._rafId = requestAnimationFrame(this._loop);
    } else {
      this._running = false;
      this.highScore = Math.max(this.highScore, Math.floor(this.score));
    }
  }

  // --------------------------------------------------------------
  render() {
    const ctx = this.ctx;
    // Fill FULL canvas background (including top padding area).
    ctx.fillStyle = this.night ? '#0f1033' : '#f7f7f7';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(0, this.PAD_TOP);

    // night stars
    if (this.night) {
      ctx.fillStyle = '#ffffffcc';
      for (let i = 0; i < 8; i++) {
        const sx = (i * 83 + this.horizon.offset * 0.3) % P.CANVAS_WIDTH;
        ctx.fillRect(((sx + P.CANVAS_WIDTH) % P.CANVAS_WIDTH) | 0, 20 + (i * 13) % 60, 2, 2);
      }
    }

    // optional invert for night
    if (this.night) ctx.filter = 'invert(1)';
    this.clouds.draw(ctx);
    this.horizon.draw(ctx);
    for (const o of this.obstacles) o.draw(ctx);
    this.dino.draw(ctx);
    if (this.night) ctx.filter = 'none';

    // score
    this._drawScore(ctx);

    // game over
    if (this.dino.state === P.DinoState.CRASHED) {
      this._drawGameOver(ctx);
    }

    ctx.restore();
  }

  _drawScore(ctx) {
    const score = Math.floor(this.score);
    const str = String(score).padStart(DIGITS, '0');
    const digitW = SPRITES.TEXT_NUMBERS.w;
    const spacing = digitW + 1;
    const scoreWidth = DIGITS * spacing;
    const startX = P.CANVAS_WIDTH - scoreWidth - 4;
    const flash = this._flashTimer > 0 && Math.floor(this._flashTimer / 100) % 2 === 0;
    if (flash) { ctx.globalAlpha = 0.3; }
    for (let i = 0; i < DIGITS; i++) {
      const d = str.charCodeAt(i) - 48;
      spriteSheet.drawSlice(
        ctx,
        SPRITES.TEXT_NUMBERS,
        d * digitW, digitW,
        startX + i * spacing, 8,
        digitW, SPRITES.TEXT_NUMBERS.h
      );
    }
    ctx.globalAlpha = 1.0;

    if (this.highScore > 0) {
      const hstr = String(this.highScore).padStart(DIGITS, '0');
      // HI block sits left of the current-score block with a gap of 3 * digit width.
      const hiDigitsStart = startX - scoreWidth - digitW * 2;
      const hiLabelX = hiDigitsStart - digitW * 2 - 2;
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = this.night ? '#ffffff' : '#535353';
      ctx.fillText('HI', hiLabelX, 19);
      for (let i = 0; i < DIGITS; i++) {
        const d = hstr.charCodeAt(i) - 48;
        spriteSheet.drawSlice(
          ctx,
          SPRITES.TEXT_NUMBERS,
          d * digitW, digitW,
          hiDigitsStart + i * spacing, 8,
          digitW, SPRITES.TEXT_NUMBERS.h
        );
      }
    }
  }

  _drawGameOver(ctx) {
    // Hand-rendered "GAME OVER" text (sprite atlas produced a clipped glyph).
    ctx.save();
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = this.night ? '#f7f7f7' : '#535353';
    // Letter-spacing via individual chars so it matches Chromium's wide look.
    const text = 'G A M E   O V E R';
    ctx.fillText(text, P.CANVAS_WIDTH / 2, 18);
    ctx.restore();
    // Restart icon (still a sprite; sits below the text with breathing room).
    spriteSheet.draw(
      ctx,
      SPRITES.RESTART,
      (P.CANVAS_WIDTH - SPRITES.RESTART.w) / 2,
      46
    );
  }
}
