import { useEffect, useMemo, useRef, useState } from 'react';
import { TRACKING_STAGES, stageIndex } from '../../config/tracking.js';
import StageIcon from './StageIcon.jsx';

// El viaje dibujado: el arco EE. UU. → Colombia del logo, y después la bajada a
// la bodega en Armenia y a la puerta del cliente. La ruta pasa exactamente por
// los seis puntos, y un marcador recorre el camino hasta la etapa actual.
const VIEW = { w: 1000, h: 400 };
const POINTS = {
  usa: [95, 300],
  transit: [330, 70],
  colombia: [600, 170],
  warehouse: [700, 300],
  dispatched: [830, 250],
  delivered: [925, 322]
};
const SEGMENTS = [
  'M 95 300 C 150 150, 245 70, 330 70',
  'M 330 70 C 420 70, 540 90, 600 170',
  'M 600 170 C 640 224, 650 300, 700 300',
  'M 700 300 C 750 300, 780 250, 830 250',
  'M 830 250 C 875 250, 890 322, 925 322'
];
const FULL_PATH = SEGMENTS.map((d, i) => (i === 0 ? d : d.replace(/^M [\d.]+ [\d.]+ /, ''))).join(' ');

const NS = 'http://www.w3.org/2000/svg';
const measure = (d) => {
  if (typeof document === 'undefined') return 100;
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  return path.getTotalLength();
};

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function JourneyMap({ stage = null, cancelled = false, demo = false }) {
  const pathRef = useRef(null);
  const frame = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1 del largo total
  const reduced =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Largo de cada tramo → fracción exacta del camino donde cae cada etapa
  const geometry = useMemo(() => {
    const lengths = SEGMENTS.map(measure);
    const total = lengths.reduce((a, b) => a + b, 0);
    const cumulative = [0];
    for (const len of lengths) cumulative.push(cumulative.at(-1) + len);
    return { total, marks: cumulative.map((len) => len / total) };
  }, []);

  const targetIndex = demo ? TRACKING_STAGES.length - 1 : Math.max(0, stageIndex(stage));
  const target = geometry.marks[targetIndex];

  // Animación del marcador hasta la etapa actual (o en bucle en modo demo)
  useEffect(() => {
    cancelAnimationFrame(frame.current);
    if (reduced && !demo) {
      setProgress(target);
      return undefined;
    }
    let start = null;
    let from = 0;
    setProgress((current) => {
      from = current;
      return current;
    });
    const duration = demo ? 7000 : 1500 + Math.abs(target - from) * 900;
    const tick = (now) => {
      if (start === null) start = now;
      const elapsed = now - start;
      if (demo) {
        const cycle = duration + 1600;
        const t = (elapsed % cycle) / duration;
        setProgress(t >= 1 ? 1 : easeInOut(t));
        frame.current = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, elapsed / duration);
      setProgress(from + (target - from) * easeOutCubic(t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, demo, reduced]);

  // Posición y rumbo del marcador sobre la ruta real
  const marker = useMemo(() => {
    const path = pathRef.current;
    if (!path) return { x: POINTS.usa[0], y: POINTS.usa[1], angle: 0 };
    const total = path.getTotalLength();
    const at = Math.min(total, Math.max(0, progress * total));
    const p = path.getPointAtLength(at);
    const q = path.getPointAtLength(Math.min(total, at + 2));
    return { x: p.x, y: p.y, angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI };
    // pathRef.current existe desde el primer render efectivo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, pathRef.current]);

  const reachedIndex = geometry.marks.filter((mark) => mark <= progress + 0.002).length - 1;
  // El icono del marcador cambia según el tramo: avión en vuelo, camión en reparto
  const movingStage =
    demo || progress < target - 0.001
      ? reachedIndex >= 3
        ? 'dispatched'
        : 'transit'
      : stage ?? 'usa';
  const settled = !demo && progress >= target - 0.001;

  return (
    <div className={`journey ${cancelled ? 'is-cancelled' : ''} ${demo ? 'is-demo' : ''}`} aria-hidden={demo}>
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid meet" className="journey-svg" role="img" aria-label="Recorrido del pedido">
        <defs>
          <linearGradient id="jm-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#968abe" />
            <stop offset="0.55" stopColor="#7e9a88" />
            <stop offset="1" stopColor="#6f927c" />
          </linearGradient>
          <radialGradient id="jm-land-us" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(150,138,190,0.32)" />
            <stop offset="1" stopColor="rgba(150,138,190,0)" />
          </radialGradient>
          <radialGradient id="jm-land-co" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgba(111,146,124,0.32)" />
            <stop offset="1" stopColor="rgba(111,146,124,0)" />
          </radialGradient>
          <filter id="jm-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Tierra: dos manchas suaves, EE. UU. a la izquierda y Colombia a la derecha */}
        <ellipse cx="150" cy="320" rx="190" ry="80" fill="url(#jm-land-us)" />
        <ellipse cx="790" cy="310" rx="260" ry="100" fill="url(#jm-land-co)" />

        {/* Ruta punteada completa (como el trazo del logo) y el tramo recorrido */}
        <path d={FULL_PATH} className="jm-route" strokeDasharray="1 11" />
        <path
          ref={pathRef}
          d={FULL_PATH}
          className="jm-route-done"
          stroke="url(#jm-grad)"
          strokeDasharray={geometry.total}
          strokeDashoffset={geometry.total * (1 - progress)}
          pathLength={geometry.total}
        />

        {/* Nodos de las etapas */}
        {TRACKING_STAGES.map((item, i) => {
          const [x, y] = POINTS[item.key];
          const state = i < reachedIndex || (i === reachedIndex && (settled ? i !== targetIndex : true)) ? 'done' : i === reachedIndex ? 'current' : 'todo';
          const isCurrent = settled && i === targetIndex;
          return (
            <g key={item.key} className={`jm-node is-${isCurrent ? 'current' : state}`} transform={`translate(${x} ${y})`} style={{ '--i': i }}>
              {isCurrent && <circle r="26" className="jm-node-pulse" />}
              <circle r="14" className="jm-node-bg" />
              <StageIcon stage={item.key} size={16} x={-8} y={-8} className="jm-node-icon" />
            </g>
          );
        })}

        {/* Marcador en movimiento */}
        {!cancelled && (
          <g className="jm-marker" transform={`translate(${marker.x} ${marker.y})`}>
            <circle r="18" className="jm-marker-glow" filter="url(#jm-glow)" />
            <circle r="13" className="jm-marker-bg" />
            <g transform={movingStage === 'transit' ? `rotate(${marker.angle + 45})` : undefined}>
              <StageIcon stage={movingStage} size={16} x={-8} y={-8} className="jm-marker-icon" />
            </g>
          </g>
        )}
      </svg>

      {/* Etiquetas en HTML para que la tipografía no se encoja con el SVG */}
      <div className="jm-labels">
        {TRACKING_STAGES.map((item, i) => {
          const [x, y] = POINTS[item.key];
          const isCurrent = settled && i === targetIndex;
          const done = i <= reachedIndex;
          return (
            <div
              key={item.key}
              className={`jm-label ${isCurrent ? 'is-current' : done ? 'is-done' : 'is-todo'} ${item.key === 'transit' ? 'is-above' : ''}`}
              style={{ left: `${(x / VIEW.w) * 100}%`, top: `${(y / VIEW.h) * 100}%` }}
            >
              <span className="jm-label-title">
                {item.key === 'usa' && <span className="flag-us jm-flag" />}
                {item.key === 'colombia' && <span className="flag-co jm-flag" />}
                {item.short}
              </span>
              <span className="jm-label-place">{item.place}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
