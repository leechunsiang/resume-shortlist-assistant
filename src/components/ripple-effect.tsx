'use client';

import { useEffect, useState } from 'react';

interface Ripple {
  x: number;
  y: number;
  id: number;
}

interface RippleEffectProps {
  color?: string;
  duration?: number;
}

export function useRipple() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const addRipple = (event: React.MouseEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    // Remove ripple after animation completes
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);
  };

  return { ripples, addRipple };
}

export function RippleEffect({ ripples, color = 'rgba(255, 255, 255, 0.5)', duration = 600 }: { ripples: Ripple[] } & RippleEffectProps) {
  return (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
            background: color,
            animation: `ripple ${duration}ms ease-out`,
          }}
        />
      ))}
    </>
  );
}
