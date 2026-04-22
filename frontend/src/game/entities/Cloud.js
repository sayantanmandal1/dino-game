import { SPRITES, spriteSheet } from '../sprites';
import * as P from '../physics';

const CLOUD_SPEED = 0.2;
const MIN_CLOUDS = 1;
const MAX_CLOUDS = 4;
const CLOUD_MIN_GAP = 100;
const CLOUD_MAX_GAP = 400;

export class Cloud {
  constructor(rng) {
    this.x = P.CANVAS_WIDTH;
    this.y = 10 + Math.floor(rng() * 40);
    this.w = SPRITES.CLOUD.w;
    this.h = SPRITES.CLOUD.h;
  }
  update(deltaMs, speed) {
    this.x -= CLOUD_SPEED * speed * (deltaMs / (1000 / 60));
  }
  draw(ctx) {
    spriteSheet.draw(ctx, SPRITES.CLOUD, this.x, this.y);
  }
  isGone() { return this.x + this.w < -5; }
}

export class CloudLayer {
  constructor(rng) {
    this.rng = rng;
    this.clouds = [];
    this.nextSpawn = 0;
  }
  update(deltaMs, speed) {
    this.nextSpawn -= deltaMs;
    if (this.clouds.length < MAX_CLOUDS && this.nextSpawn <= 0) {
      this.clouds.push(new Cloud(this.rng));
      const gap = CLOUD_MIN_GAP + this.rng() * (CLOUD_MAX_GAP - CLOUD_MIN_GAP);
      this.nextSpawn = (gap / speed) * (1000 / 60);
    }
    for (const c of this.clouds) c.update(deltaMs, speed);
    this.clouds = this.clouds.filter((c) => !c.isGone());
    if (this.clouds.length < MIN_CLOUDS) this.nextSpawn = 0;
  }
  draw(ctx) {
    for (const c of this.clouds) c.draw(ctx);
  }
}
