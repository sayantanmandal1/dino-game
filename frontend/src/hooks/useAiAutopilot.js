import { useEffect, useRef, useState, useCallback } from 'react';

function wsUrlFor(path) {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  if (host.startsWith('localhost:3000') || host.startsWith('127.0.0.1:3000')) {
    return `${proto}//${host.split(':')[0]}:8000${path}`;
  }
  return `${proto}//${host}${path}`;
}

export function useAiAutopilot(modelId) {
  const [connected, setConnected] = useState(false);
  const lastActionRef = useRef('noop');
  const wsRef = useRef(null);

  useEffect(() => {
    if (!modelId) { lastActionRef.current = 'noop'; setConnected(false); return undefined; }
    let closed = false;
    let retry = 0;
    const open = () => {
      const ws = new WebSocket(wsUrlFor(`/api/ws/play/${modelId}`));
      wsRef.current = ws;
      ws.onopen = () => { retry = 0; setConnected(true); };
      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        retry = Math.min(retry + 1, 6);
        setTimeout(open, 500 * 2 ** retry);
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data && data.type === 'action' && data.action) lastActionRef.current = data.action;
        } catch { /* ignore */ }
      };
      ws.onerror = () => { /* handled by onclose */ };
    };
    open();
    return () => { closed = true; if (wsRef.current) wsRef.current.close(); };
  }, [modelId]);

  const decide = useCallback((sensors) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(JSON.stringify({ sensors })); } catch { /* ignore */ }
    }
    return lastActionRef.current;
  }, []);

  return { connected, decide };
}