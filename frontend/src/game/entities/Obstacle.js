import * as P from '../physics';
import { SPRITES, spriteSheet } from '../sprites';

const PTERO_ANIM_FRAME_MS = 1000 / P.PTERODACTYL_ANIM_FPS;

export class Obstacle {
  constructor(kind, speed, rng) {
    this.kind = kind;
    this.x = P.CANVAS_WIDTH;
    this.animTimer = 0;
    this.animFrame = 0;

    if (kind === 'cactus_small') {
      this.count = 1 + Math.floor(rng() * P.MAX_OBSTACLE_DUPLICATION);
      this.w = P.CACTUS_SMALL_WIDTH * this.count;
      this.h = P.CACTUS_SMALL_HEIGHT;
      this.y = P.GROUND_Y - this.h;
    } else if (kind === 'cactus_large') {
      this.count = 1 + Math.floor(rng() * P.MAX_OBSTACLE_DUPLICATION);
      this.w = P.CACTUS_LARGE_WIDTH * this.count;
      this.h = P.CACTUS_LARGE_HEIGHT;
      this.y = P.GROUND_Y - this.h;
    } else { // pterodactyl
      this.count = 1;
      this.w = P.PTERODACTYL_WIDTH;
      this.h = P.PTERODACTYL_HEIGHT;
      this.y = P.PTERODACTYL_Y_POSITIONS[Math.floor(rng() * P.PTERODACTYL_Y_POSITIONS.length)] - this.h;
    }
  }

  update(deltaMs, speed) {
    this.x -= speed * (deltaMs / (1000 / 60));
    if (this.kind === 'pterodactyl') {
      this.animTimer += deltaMs;
      if (this.animTimer >= PTERO_ANIM_FRAME_MS) {
        this.animTimer = 0;
        this.animFrame = (this.animFrame + 1) % 2;
      }
    }
  }

  draw(ctx) {
    if (this.kind === 'cactus_small') {
      // draw `count` tiled cacti from the single-cactus sprite
      for (let i = 0; i < this.count; i++) {
        spriteSheet.draw(
          ctx,
          SPRITES.CACTUS_SMALL,
          this.x + i * P.CACTUS_SMALL_WIDTH,
          this.y
        );
      }
    } else if (this.kind === 'cactus_large') {
      for (let i = 0; i < this.count; i++) {
        spriteSheet.draw(
          ctx,
          SPRITES.CACTUS_LARGE,
          this.x + i * P.CACTUS_LARGE_WIDTH,
          this.y
        );
      }
    } else {
      const sprite = this.animFrame === 0 ? SPRITES.PTERODACTYL_1 : SPRITES.PTERODACTYL_2;
      spriteSheet.draw(ctx, sprite, this.x, this.y);
    }
  }

  isGone() {
    return this.x + this.w < -5;
  }

  getBox() {
    return {
      x: this.x + P.COLLISION_PAD,
      y: this.y + P.COLLISION_PAD,
      w: this.w - P.COLLISION_PAD * 2,
      h: this.h - P.COLLISION_PAD * 2,
    };
  }
}

export function pickObstacleKind(score, rng) {
  const kinds = ['cactus_small', 'cactus_large'];
  if (score >= P.PTERODACTYL_MIN_SCORE) kinds.push('pterodactyl');
  return kinds[Math.floor(rng() * kinds.length)];
}
