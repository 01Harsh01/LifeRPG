import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

export function NetworkStatus() {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      setShowRestored(true);
      const timer = setTimeout(() => setShowRestored(false), 3500);
      return () => clearTimeout(timer);
    }

    function handleOffline() {
      setOnline(false);
      setShowRestored(false);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[100] bg-amber-600/95 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm"
          role="alert"
        >
          <WifiOff size={15} />
          <span>You are currently offline. Changes will sync once connection is restored.</span>
        </motion.div>
      )}
      {showRestored && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 inset-x-0 z-[100] bg-emerald-600/95 text-white text-xs font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm"
          role="status"
        >
          <Wifi size={15} />
          <span>Connection restored. You are back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
