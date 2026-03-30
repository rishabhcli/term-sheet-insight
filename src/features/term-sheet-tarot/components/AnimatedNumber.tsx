import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, useMotionValue } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  format: (n: number) => string;
  className?: string;
}

/**
 * Smoothly animates between numeric values using a spring,
 * rendering the formatted output on each frame.
 */
export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, { stiffness: 120, damping: 20, mass: 0.8 });
  const display = useTransform(spring, (v) => format(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    motionValue.set(value);
  }, [value, motionValue]);

  // Update DOM text on each frame via the motion value subscription
  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [display]);

  return (
    <motion.span ref={ref} className={className}>
      {format(value)}
    </motion.span>
  );
}
