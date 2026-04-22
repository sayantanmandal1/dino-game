// WebSocket utility with auto-reconnect + exponential backoff.

function wsUrl(path) {
  const base = process.env.REACT_APP_WS_URL;
  if (base) return `${base}${path}`;
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  // In dev (CRA), proxy won't handle WS — route directly to backend port
  if (host.startsWith('localhost:3000') || host.startsWith('127.0.0.1:3000')) {
    return `${proto}//${host.split(':')[0]}:8000${path}`;
  }
  return `${proto}//${host}${path}`;
}

export function connectWs(path, { onMessage, onOpen, onClose, onError } = {}) {
  let ws;
  let closed = false;
  let retry = 0;

  const open = () => {
    ws = new WebSocket(wsUrl(path));
    ws.onopen = () => {
      retry = 0;
      onOpen && onOpen();
    };
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        onMessage && onMessage(data);
      } catch (e) {
        onError && onError(e);
      }
    };
    ws.onerror = (ev) => onError && onError(ev);
    ws.onclose = () => {
      onClose && onClose();
      if (closed) return;
      retry = Math.min(retry + 1, 6);
      setTimeout(open, 500 * 2 ** retry);
    };
  };

  open();

  return {
    send: (obj) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
      }
    },
    close: () => {
      closed = true;
      if (ws) ws.close();
    },
    isOpen: () => ws && ws.readyState === WebSocket.OPEN,
  };
}
