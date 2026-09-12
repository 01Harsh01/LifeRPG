import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function GoldCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (value === prevRef.current) return;
    const start = prevRef.current;
    const end = value;
    const duration = 600;
    const startTime = performance.now();

    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      setDisplay(Math.round(start + (end - start) * t));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    setPulse(true);
    const timeout = setTimeout(() => setPulse(false), 500);
    prevRef.current = value;
    return () => clearTimeout(timeout);
  }, [value]);

  return (
    <motion.span
      animate={pulse ? { scale: [1, 1.15, 1] } : {}}
      className="inline-flex items-center gap-1 font-semibold text-gold"
    >
      🪙 <AnimatePresence mode="popLayout">
        <motion.span key={display} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="tabular-nums">
          {display}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}
