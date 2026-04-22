import { useEffect, useRef, useState } from 'react';
import { connectWs } from '../api/ws';

// Subscribes to /api/training/ws/training and exposes:
//   events    - raw event list (last 200)
//   history   - generation summaries (for charts): { generation, best_fitness, mean_fitness, ... }
//   status    - latest status-ish event ({ status, best_fitness, ... }) if any
//   connected - websocket state
//   clear()   - reset accumulated state
export function useTrainingSocket(enabled = true) {
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const connRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const conn = connectWs('/api/training/ws/training', {
      onOpen: () => setConnected(true),
      onClose: () => setConnected(false),
      onMessage: (data) => {
        if (!data || data.type === 'ping') return;
        setEvents((prev) => [...prev.slice(-199), data]);
        // every non-ping event becomes the current status snapshot
        setStatus((prev) => ({ ...(prev || {}), ...data }));
        // generation summary events feed the history chart
        if (data.type === 'generation' || data.generation !== undefined) {
          setHistory((prev) => {
            const entry = {
              generation: data.generation,
              best_fitness: data.best_fitness ?? data.best ?? null,
              mean_fitness: data.mean_fitness ?? data.mean ?? null,
              species_count: data.species_count,
              elapsed_seconds: data.elapsed_seconds,
            };
            return [...prev.slice(-499), entry];
          });
        }
        // terminal events reset history for the NEXT run but keep the final snapshot visible
        if (data.type === 'start') {
          setHistory([]);
        }
      },
    });
    connRef.current = conn;
    return () => conn.close();
  }, [enabled]);

  const clear = () => { setEvents([]); setHistory([]); setStatus(null); };

  return { events, history, status, connected, clear };
}