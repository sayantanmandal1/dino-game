import { SPRITES, spriteSheet } from '../sprites';
import * as P from '../physics';

// Scrolling ground line. We draw the horizon sprite twice, offset, and shift.
export class Horizon {
  constructor() {
    this.offset = 0;
  }
  update(deltaMs, speed) {
    this.offset -= speed * (deltaMs / (1000 / 60));
    if (this.offset <= -SPRITES.HORIZON.w) this.offset += SPRITES.HORIZON.w;
  }
  draw(ctx) {
    const y = P.GROUND_Y;
    spriteSheet.draw(ctx, SPRITES.HORIZON, this.offset, y);
    spriteSheet.draw(ctx, SPRITES.HORIZON, this.offset + SPRITES.HORIZON.w, y);
  }
}
