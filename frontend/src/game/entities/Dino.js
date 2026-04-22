import * as P from '../physics';
import { SPRITES, spriteSheet } from '../sprites';

const RUN_ANIM_FPS = 10;

export class Dino {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = P.DINO_X;
    this.y = P.GROUND_Y - P.DINO_HEIGHT;
    this.vy = 0;
    this.w = P.DINO_WIDTH;
    this.h = P.DINO_HEIGHT;
    this.state = P.DinoState.WAITING;
    this.animFrame = 0;
    this.animTimer = 0;
    this.alive = true;
    this._duckHeld = false;
  }

  startRunning() {
    this.state = P.DinoState.RUNNING;
  }

  jump() {
    if (this.state === P.DinoState.CRASHED) return;
    const onGround = this.y >= P.GROUND_Y - P.DINO_HEIGHT - 0.01;
    if (onGround && !this._duckHeld) {
      this.vy = P.JUMP_VELOCITY;
      this.state = P.DinoState.JUMPING;
    }
  }

  setDuck(down) {
    this._duckHeld = down;
    if (this.state === P.DinoState.CRASHED) return;
    const onGround = this.y >= P.GROUND_Y - P.DINO_HEIGHT - 0.01;
    if (down) {
      if (onGround) {
        this.state = P.DinoState.DUCKING;
        this.w = P.DINO_WIDTH_DUCK;
        this.h = P.DINO_HEIGHT_DUCK;
      } else {
        // speed drop
        this.vy += P.GRAVITY * P.SPEED_DROP_COEFFICIENT;
      }
    } else if (onGround && this.state === P.DinoState.DUCKING) {
      this.state = P.DinoState.RUNNING;
      this.w = P.DINO_WIDTH;
      this.h = P.DINO_HEIGHT;
    }
  }

  crash() {
    this.state = P.DinoState.CRASHED;
    this.alive = false;
    this.vy = 0;
  }

  update(deltaMs) {
    if (this.state === P.DinoState.CRASHED || this.state === P.DinoState.WAITING) {
      return;
    }
    this.vy += P.GRAVITY;
    this.y += this.vy;

    const floorY = P.GROUND_Y - this.h;
    if (this.y >= floorY) {
      this.y = floorY;
      this.vy = 0;
      if (this.state === P.DinoState.JUMPING) {
        this.state = this._duckHeld ? P.DinoState.DUCKING : P.DinoState.RUNNING;
        if (this._duckHeld) {
          this.w = P.DINO_WIDTH_DUCK;
          this.h = P.DINO_HEIGHT_DUCK;
          this.y = P.GROUND_Y - P.DINO_HEIGHT_DUCK;
        }
      }
    }

    // animation
    this.animTimer += deltaMs;
    const frameDur = 1000 / RUN_ANIM_FPS;
    if (this.animTimer >= frameDur) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  draw(ctx) {
    let sprite = SPRITES.TREX_IDLE;
    if (this.state === P.DinoState.CRASHED) sprite = SPRITES.TREX_CRASH;
    else if (this.state === P.DinoState.JUMPING) sprite = SPRITES.TREX_JUMP;
    else if (this.state === P.DinoState.DUCKING) {
      sprite = this.animFrame === 0 ? SPRITES.TREX_DUCK_1 : SPRITES.TREX_DUCK_2;
    } else if (this.state === P.DinoState.RUNNING) {
      sprite = this.animFrame === 0 ? SPRITES.TREX_RUN_1 : SPRITES.TREX_RUN_2;
    }
    spriteSheet.draw(ctx, sprite, this.x, this.y);
  }

  getBox() {
    // Chromium uses tight sub-rect collision boxes that exclude the sprite's
    // transparent margins. Approximated here with generous insets so the game
    // feels fair (no phantom collisions at the edges of the sprite).
    const padX = 3;
    const padY = 4;
    return {
      x: this.x + padX,
      y: this.y + padY,
      w: this.w - padX * 2,
      h: this.h - padY * 2,
    };
  }
}
