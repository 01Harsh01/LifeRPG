import { motion } from "framer-motion";

export function StreakBadge({ current }: { current: number }) {
  return (
    <motion.div
      className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 border border-orange-500/30 px-3 py-1 text-orange-300 font-semibold"
      animate={current > 0 ? { boxShadow: ["0 0 0px rgba(251,146,60,0.3)", "0 0 14px rgba(251,146,60,0.5)", "0 0 0px rgba(251,146,60,0.3)"] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      🔥 {current} Day{current === 1 ? "" : "s"}
    </motion.div>
  );
}
