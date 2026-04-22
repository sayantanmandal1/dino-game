import React, { useMemo } from 'react';
import { Box } from '@mui/material';

// Layered left-to-right layout: inputs | hidden | outputs.
// Weights drawn with color (blue=positive, red=negative) and thickness by magnitude.
export default function NetworkGraph({ graph, width = 640, height = 320, activations = null }) {
  const { nodes, connections } = graph || { nodes: [], connections: [] };

  const layout = useMemo(() => {
    if (!nodes) return { positioned: [], edges: [] };
    const inputs = nodes.filter((n) => n.type === 'input');
    const outputs = nodes.filter((n) => n.type === 'output');
    const hidden = nodes.filter((n) => n.type === 'hidden');

    const place = (arr, x) =>
      arr.map((n, i) => ({
        ...n,
        x,
        y: (height / (arr.length + 1)) * (i + 1),
      }));

    const positioned = [
      ...place(inputs, 60),
      ...place(hidden, width / 2),
      ...place(outputs, width - 60),
    ];
    const byId = new Map(positioned.map((n) => [n.id, n]));
    const edges = (connections || [])
      .map((c) => ({ ...c, src: byId.get(c.source), dst: byId.get(c.target) }))
      .filter((e) => e.src && e.dst);
    return { positioned, edges };
  }, [nodes, connections, width, height]);

  const maxW = useMemo(
    () => Math.max(0.5, ...(connections || []).map((c) => Math.abs(c.weight))),
    [connections],
  );

  if (!nodes || nodes.length === 0) {
    return (
      <Box sx={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 }}>
        No network loaded
      </Box>
    );
  }

  return (
    <svg width={width} height={height} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 12 }}>
      {layout.edges.map((e, i) => {
        const color = e.weight >= 0 ? '#00d4ff' : '#ff6b35';
        const sw = 0.5 + (Math.abs(e.weight) / maxW) * 3.2;
        return (
          <line
            key={i}
            x1={e.src.x} y1={e.src.y} x2={e.dst.x} y2={e.dst.y}
            stroke={color} strokeOpacity={0.55} strokeWidth={sw}
          />
        );
      })}
      {layout.positioned.map((n) => {
        const act = activations && activations[n.id];
        const fill = n.type === 'input' ? '#00d4ff' : n.type === 'output' ? '#ff6b35' : '#00ff88';
        const r = 12 + (act ? Math.min(8, Math.abs(act) * 8) : 0);
        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={r} fill={fill} opacity={0.9} />
            <text x={n.x} y={n.y + 4} fontSize={10} textAnchor="middle" fill="#0a0e27" fontWeight={700}>
              {n.label || n.id}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
