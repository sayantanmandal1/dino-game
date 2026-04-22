// Chrome offline-dino sprite sheet slicer.
// Pixel offsets taken from Chromium's trex.js (default_100_percent variant).
//
// Sprite sheet credited to The Chromium Authors (BSD-licensed).

import spriteUrl1x from '../assets/1x-offline-sprite.png';
import spriteUrl2x from '../assets/2x-offline-sprite.png';

// 1x sprite sheet layout (from Chromium source `trex.js` -> `Runner.spriteDefinition.LDPI`)
export const SPRITES = {
  CLOUD:     { x: 86,  y: 2,  w: 46, h: 14 },
  HORIZON:   { x: 2,   y: 54, w: 600, h: 12 },
  MOON:      { x: 484, y: 2,  w: 20, h: 40 }, // full moon frame (frames 0-6 step by 20px x)
  STAR:      { x: 645, y: 2,  w: 9,  h: 9 },
  CACTUS_SMALL: { x: 228, y: 2, w: 17, h: 35 }, // 3 frames (17,34,51 width)
  CACTUS_LARGE: { x: 332, y: 2, w: 25, h: 50 }, // 3 frames (25,50,75 width)
  PTERODACTYL_1: { x: 134, y: 2, w: 46, h: 40 },
  PTERODACTYL_2: { x: 180, y: 2, w: 46, h: 40 },
  TREX_IDLE:   { x: 848, y: 2,  w: 44, h: 47 }, // first idle frame
  TREX_RUN_1:  { x: 936, y: 2,  w: 44, h: 47 },
  TREX_RUN_2:  { x: 980, y: 2,  w: 44, h: 47 },
  TREX_DUCK_1: { x: 1112, y: 19, w: 59, h: 25 }, // wayou sheet: 1112
  TREX_DUCK_2: { x: 1171, y: 19, w: 59, h: 25 },
  TREX_CRASH:  { x: 1024, y: 2,  w: 44, h: 47 },
  TREX_JUMP:   { x: 848, y: 2,  w: 44, h: 47 },
  TEXT_NUMBERS: { x: 655, y: 2, w: 10, h: 13 }, // 10 digits, 10px each
  GAME_OVER: { x: 955, y: 26, w: 191, h: 11 }, // "G A M E O V E R" text
  RESTART:   { x: 2,   y: 2,  w: 36, h: 32 },
};

class SpriteSheet {
  constructor() {
    this.ready = false;
    this.image = new Image();
    this.image.src = spriteUrl1x;
    // 2x available for hi-DPI displays — loaded but unused by default
    this.image2x = new Image();
    this.image2x.src = spriteUrl2x;
    this._loadPromise = new Promise((resolve, reject) => {
      this.image.onload = () => {
        this.ready = true;
        resolve();
      };
      this.image.onerror = (e) => reject(new Error('sprite-load-failed'));
    });
  }

  load() {
    return this._loadPromise;
  }

  draw(ctx, sprite, dx, dy, dw, dh) {
    if (!this.ready) return;
    ctx.drawImage(
      this.image,
      sprite.x, sprite.y, sprite.w, sprite.h,
      Math.round(dx), Math.round(dy),
      dw ?? sprite.w, dh ?? sprite.h
    );
  }

  drawSlice(ctx, sprite, sliceX, sliceW, dx, dy, dw, dh) {
    if (!this.ready) return;
    ctx.drawImage(
      this.image,
      sprite.x + sliceX, sprite.y, sliceW, sprite.h,
      Math.round(dx), Math.round(dy),
      dw, dh
    );
  }
}

export const spriteSheet = new SpriteSheet();
