// Animated number counter using Framer Motion spring + transform.
// Counts from 0 to target value on mount with configurable duration.

"use client";

import { useEffect, useRef, useState } from "react";
import { useSpring, useTransform, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  formatFn?: (n: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({
  value,
  formatFn = (n) => n.toLocaleString("en-US"),
  duration = 1.2,
  className,
}: AnimatedNumberProps) {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(shouldReduceMotion ? value : 0);
  const prevValue = useRef(value);

  const springValue = useSpring(shouldReduceMotion ? value : 0, {
    duration: duration * 1000,
    bounce: 0,
  });

  const rounded = useTransform(springValue, (latest) => Math.round(latest));

  useEffect(() => {
    if (shouldReduceMotion) return;

    springValue.set(value);

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest);
    });

    prevValue.current = value;
    return unsubscribe;
  }, [value, springValue, rounded, shouldReduceMotion]);

  return <span className={className}>{formatFn(displayValue)}</span>;
}
