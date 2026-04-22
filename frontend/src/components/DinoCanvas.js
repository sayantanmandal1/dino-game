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
  const [crashed, setCrashed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const engine = new GameEngine(canvas, { seed, onEvent });
    engineRef.current = engine;
    let cancelled = false;

    engine.load().then(() => {
      if (cancelled) return;
      engine.render();
      if (autoStart) { setStarted(true); setCrashed(false); engine.start(); }
    }).catch(() => {/* sprite load error; already logged */});

    // Poll crashed state so the overlay can react to deaths (keyboard-triggered
    // or from the engine itself on collision). Cheap: one comparison per frame.
    let rafId = 0;
    const pollCrashed = () => {
      const e = engineRef.current;
      if (e && e.dino) {
        const dead = e.dino.state === 'crashed';
        setCrashed((prev) => (prev !== dead ? dead : prev));
      }
      rafId = window.requestAnimationFrame(pollCrashed);
    };
    rafId = window.requestAnimationFrame(pollCrashed);

    if (!disableInput) {
      const input = new Input(window);
      input.on('jump', () => {
        const e = engineRef.current;
        if (!e) return;
        if (e.dino.state === 'crashed') {
          e.reset(seed);
          setStarted(true); setCrashed(false);
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
        setStarted(true); setCrashed(false);
        e.start();
      });
      input.attach();
      inputRef.current = input;
    }

    return () => {
      cancelled = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      if (inputRef.current) inputRef.current.detach();
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    start: () => { setStarted(true); setCrashed(false); engineRef.current && engineRef.current.start(); },
    stop: () => engineRef.current && engineRef.current.stop(),
    reset: (s = seed) => { setCrashed(false); engineRef.current && engineRef.current.reset(s); },
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
    setStarted(true); setCrashed(false);
    e.start();
  };

  // When crashed, clicking anywhere on the canvas itself (including the
  // in-canvas restart sprite) restarts the game.
  const handleCanvasClick = () => {
    if (disableInput) return;
    const e = engineRef.current;
    if (!e) return;
    if (e.dino && e.dino.state === 'crashed') {
      handlePlay();
    } else if (!e._running) {
      handlePlay();
    }
  };

  const showOverlay = !disableInput && !started && !autoStart && !crashed;
  const overlayLabel = 'PRESS PLAY';

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
        onClick={handleCanvasClick}
        style={{
          width: '100%',
          height: 'auto',
          imageRendering: 'pixelated',
          display: 'block',
          cursor: crashed ? 'pointer' : 'default',
        }}
        aria-label="Dino game canvas"
        data-testid="dino-canvas"
      />
      {showOverlay && (
        <button
          type="button"
          onClick={handlePlay}
          aria-label={crashed ? 'Restart game' : 'Start game'}
          style={{
            position: 'absolute',
            left: '50%',
            // Sit low (around the ground line) to match Chromium's native "press
            // space to start" placement. Aspect is 4:1 so 58% is near the ground.
            top: crashed ? '62%' : '58%',
            transform: 'translate(-50%, -50%)',
            padding: '8px 18px',
            background: '#f7f7f7',
            color: '#535353',
            border: '2px solid #535353',
            borderRadius: 0,
            cursor: 'pointer',
            fontFamily: '"Courier New", ui-monospace, monospace',
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: '0.18em',
            imageRendering: 'pixelated',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: 'none',
            WebkitFontSmoothing: 'none',
            textRendering: 'geometricPrecision',
          }}
        >
          {crashed ? null : (
            /* Pixelated triangle "play" glyph. */
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" shapeRendering="crispEdges">
              <path d="M7 5v14l11-7z" />
            </svg>
          )}
          {overlayLabel}
        </button>
      )}
    </div>
  );
});

export default DinoCanvas;