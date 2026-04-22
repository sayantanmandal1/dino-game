// Keyboard + touch input abstraction.
// Emits "jump", "duckDown", "duckUp", "restart" events.

const JUMP_KEYS  = new Set(['Space', 'ArrowUp', 'KeyW']);
const DUCK_KEYS  = new Set(['ArrowDown', 'KeyS']);
const RESTART_KEYS = new Set(['Enter', 'KeyR']);

export class Input {
  constructor(target = window) {
    this.target = target;
    this.listeners = { jump: [], duckDown: [], duckUp: [], restart: [] };
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onTouchStart = this._onTouchStart.bind(this);
    this._onTouchEnd = this._onTouchEnd.bind(this);
  }

  on(event, fn) {
    (this.listeners[event] ||= []).push(fn);
    return () => {
      this.listeners[event] = (this.listeners[event] || []).filter((f) => f !== fn);
    };
  }

  _emit(event) {
    (this.listeners[event] || []).forEach((fn) => fn());
  }

  _onKeyDown(e) {
    if (JUMP_KEYS.has(e.code))  { this._emit('jump'); e.preventDefault(); }
    if (DUCK_KEYS.has(e.code))  { this._emit('duckDown'); e.preventDefault(); }
    if (RESTART_KEYS.has(e.code)) { this._emit('restart'); }
  }

  _onKeyUp(e) {
    if (DUCK_KEYS.has(e.code)) { this._emit('duckUp'); }
  }

  _onTouchStart() { this._emit('jump'); }
  _onTouchEnd()   { this._emit('duckUp'); }

  attach() {
    this.target.addEventListener('keydown', this._onKeyDown);
    this.target.addEventListener('keyup', this._onKeyUp);
    this.target.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.target.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  detach() {
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    this.target.removeEventListener('touchstart', this._onTouchStart);
    this.target.removeEventListener('touchend', this._onTouchEnd);
  }
}
