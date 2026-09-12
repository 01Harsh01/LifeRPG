import { motion } from "framer-motion";

export function XPBar({ current, max, height = "h-3" }: { current: number; max: number; height?: string }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div className={`relative w-full ${height} rounded-full bg-black/40 border border-white/10 overflow-hidden`}>
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-arcane via-fuchsia-400 to-arcane2 relative"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="absolute inset-0 bg-white/20 animate-shimmer bg-[length:200%_100%]" style={{
          backgroundImage: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)",
        }} />
      </motion.div>
    </div>
  );
}
