'use client';
import { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';

type Phase = 'idle' | 'converging' | 'holding' | 'diverging';
const cloudUrl = '/assets/cloud.jpg';

const CloudCtx = createContext<(cb: () => void) => void>(cb => cb());

export function useCloudTransition() {
  return useContext(CloudCtx);
}

function animateIris(from: number, to: number, dur: number, onFrame: (v: number) => void, onDone: () => void) {
  const start = performance.now();
  function tick(now: number) {
    const t = Math.min((now - start) / dur, 1);
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    onFrame(from + (to - from) * e);
    if (t < 1) requestAnimationFrame(tick); else onDone();
  }
  requestAnimationFrame(tick);
}

export function CloudProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [iris, setIris] = useState(80);
  const navRef = useRef<(() => void) | null>(null);
  const [tick, setTick] = useState(0);

  const trigger = useCallback((navigate: () => void) => {
    navRef.current = navigate;
    setTick(t => t + 1);
  }, []);

  useEffect(() => {
    if (tick === 0 || !navRef.current) return;
    const nav = navRef.current;
    navRef.current = null;

    // Converge: clouds from beyond screen edges → center (r: 80vmax → 0)
    setPhase('converging');
    animateIris(80, 0, 1400, setIris, () => {
      setPhase('holding');
      nav();
    });

    // Diverge: clouds from center → beyond screen edges (r: 0 → 80vmax)
    setTimeout(() => {
      setPhase('diverging');
      animateIris(0, 80, 1400, setIris, () => setPhase('idle'));
    }, 1600);
  }, [tick]);

  if (phase === 'idle') return <CloudCtx.Provider value={trigger}>{children}</CloudCtx.Provider>;

  // Mask: circle in vmax units (relative to larger viewport dimension)
  // r=80vmax → circle larger than screen → no clouds visible
  // r=0 → no transparent area → fully clouded
  const r = iris;
  const mask = `radial-gradient(circle ${r}vmax at center, transparent ${r}vmax, rgba(0,0,0,0.3) ${r + 2}vmax, black ${r + 6}vmax)`;

  return (
    <CloudCtx.Provider value={trigger}>
      {children}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        <div className="absolute inset-0" style={{
          backgroundImage: `url(${cloudUrl})`, backgroundSize: 'cover', backgroundPosition: 'center',
          WebkitMaskImage: mask, maskImage: mask,
        }} />
      </div>
    </CloudCtx.Provider>
  );
}
