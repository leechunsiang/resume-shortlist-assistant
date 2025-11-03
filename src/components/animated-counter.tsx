'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedProgressBarProps {
  value: number;
  color: string;
  className?: string;
  delay?: number;
}

export function AnimatedProgressBar({ value, color, className = '', delay = 0 }: AnimatedProgressBarProps) {
  const progress = useMotionValue(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      const timer = setTimeout(() => {
        const controls = animate(progress, value, {
          duration: 1.5,
          ease: [0.25, 0.1, 0.25, 1], // Custom easing for smooth fill
        });
        
        setHasAnimated(true);
        
        return () => controls.stop();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [value, delay, hasAnimated, progress]);

  return (
    <div className={`h-full ${color} transition-all`}>
      <motion.div
        className="h-full"
        style={{
          width: useTransform(progress, (v) => `${v}%`),
        }}
      />
    </div>
  );
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({ value, duration = 1.5, delay = 0, suffix = '', className = '' }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(count, value, {
        duration,
        ease: 'easeOut',
        onUpdate: (v) => setDisplayValue(Math.round(v))
      });
      
      return () => controls.stop();
    }, delay);
    
    return () => clearTimeout(timer);
  }, [value, duration, delay, count]);

  return (
    <span className={className}>
      {displayValue}{suffix}
    </span>
  );
}

interface PulseStatusBadgeProps {
  children: React.ReactNode;
  className?: string;
  pulseColor?: string;
}

export function PulseStatusBadge({ children, className = '', pulseColor = 'emerald' }: PulseStatusBadgeProps) {
  const pulseColors: Record<string, string> = {
    emerald: 'shadow-emerald-500/50',
    blue: 'shadow-blue-500/50',
    yellow: 'shadow-yellow-500/50',
    red: 'shadow-red-500/50',
    purple: 'shadow-purple-500/50',
  };

  return (
    <motion.span
      className={`${className} relative`}
      animate={{
        boxShadow: [
          `0 0 0 0 rgba(16, 185, 129, 0)`,
          `0 0 0 4px rgba(16, 185, 129, 0.1)`,
          `0 0 0 0 rgba(16, 185, 129, 0)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.span>
  );
}
