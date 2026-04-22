import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { GameEngine } from '../game/GameEngine';
import { Input } from '../game/input';

/**
 * React wrapper around the imperative GameEngine.
 * Exposes start/stop/reset/jump/setAutopilot via ref.
 */
const DinoCanvas = forwardRef(function DinoCanvas(
  { seed = null, onEvent, disableInput = false, autoStart = false, width = 600, height = 150, scale = 2 },
  ref,
) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const inputRef = useRef(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const engine = new GameEngine(canvas, { seed, onEvent });
    engineRef.current = engine;
    let cancelled = false;

    engine.load().then(() => {
      if (cancelled) return;
      engine.render();
      if (autoStart) { setStarted(true); engine.start(); }
    }).catch(() => {/* sprite load error; already logged */});

    if (!disableInput) {
      const input = new Input(window);
      input.on('jump', () => {
        const e = engineRef.current;
        if (!e) return;
        if (e.dino.state === 'crashed') {
          e.reset(seed);
          setStarted(true);
          e.start();
          return;
        }
        if (!e._running) { setStarted(true); e.start(); }
        e.jump();
      });
      input.on('duckDown', () => engineRef.current && engineRef.current.setDuck(true));
      input.on('duckUp', () => engineRef.current && engineRef.current.setDuck(false));
      input.on('restart', () => {
        const e = engineRef.current;
        if (!e) return;
        e.reset(seed);
        setStarted(true);
        e.start();
      });
      input.attach();
      inputRef.current = input;
    }

    return () => {
      cancelled = true;
      if (inputRef.current) inputRef.current.detach();
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    start: () => { setStarted(true); engineRef.current && engineRef.current.start(); },
    stop: () => engineRef.current && engineRef.current.stop(),
    reset: (s = seed) => engineRef.current && engineRef.current.reset(s),
    jump: () => engineRef.current && engineRef.current.jump(),
    setDuck: (d) => engineRef.current && engineRef.current.setDuck(d),
    setAutopilot: (fn) => engineRef.current && engineRef.current.setAutopilot(fn),
    clearAutopilot: () => engineRef.current && engineRef.current.clearAutopilot(),
    getEngine: () => engineRef.current,
    // Subscribe to per-frame engine state. Returns an unsubscribe fn.
    onUpdate: (cb) => {
      let rafId = 0;
      let stopped = false;
      const tick = () => {
        if (stopped) return;
        const e = engineRef.current;
        if (e) {
          try {
            cb({
              score: Math.floor(e.score || 0),
              gameOver: e.dino && e.dino.state === 'crashed',
              running: !!e._running,
              speed: e.speed || 0,
            });
          } catch { /* swallow */ }
        }
        rafId = window.requestAnimationFrame(tick);
      };
      rafId = window.requestAnimationFrame(tick);
      return () => { stopped = true; if (rafId) window.cancelAnimationFrame(rafId); };
    },
  }));

  const handlePlay = () => {
    const e = engineRef.current;
    if (!e) return;
    if (e.dino && e.dino.state === 'crashed') e.reset(seed);
    setStarted(true);
    e.start();
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: width * scale,
        margin: '0 auto',
      }}
    >
      <canvas
        ref={canvasRef}
        className="dino-canvas-frame"
        width={width}
        height={height}
        style={{
          width: '100%',
          height: 'auto',
          imageRendering: 'pixelated',
          display: 'block',
        }}
        aria-label="Dino game canvas"
        data-testid="dino-canvas"
      />
      {!started && !autoStart && !disableInput && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label="Play"
          style={{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            width: 96,
            height: 96,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: 'rgba(0, 212, 255, 0.92)',
            color: '#0a0e27',
            fontSize: 42,
            fontWeight: 700,
            boxShadow: '0 8px 30px rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}
    </div>
  );
});

export default DinoCanvas;
