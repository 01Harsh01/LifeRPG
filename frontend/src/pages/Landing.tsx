import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { XPBar } from "../components/XPBar";

const FEATURES = [
  { icon: "⚔️", title: "Complete Quests", desc: "Turn your to-dos into quests with real rewards." },
  { icon: "✨", title: "Gain XP", desc: "Every quest earns XP on a real progression curve." },
  { icon: "💪", title: "Build Attributes", desc: "Your actions shape six core character stats." },
  { icon: "🔥", title: "Maintain Streaks", desc: "Stay consistent and watch your streak grow." },
  { icon: "🏆", title: "Unlock Rewards", desc: "Spend gold in the shop and earn achievements." },
];

export default function Landing() {
  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-display font-bold text-lg">
          <span>⚔️</span> LIFE RPG
        </div>
        <div className="flex gap-3">
          <Link to="/login" className="btn-secondary text-sm">Login</Link>
          <Link to="/signup" className="btn-primary text-sm">Start Your Journey</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="grid lg:grid-cols-2 gap-12 items-center py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
              Turn Your Real Life Into an <span className="text-arcane">RPG.</span>
            </h1>
            <p className="text-slate-400 mt-5 text-lg max-w-lg">
              Complete real-world quests. Earn XP. Build your character. Level up your life.
            </p>
            <div className="flex gap-4 mt-8">
              <Link to="/signup" className="btn-primary">Start Your Journey</Link>
              <Link to="/login" className="btn-secondary">Login</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="card-glow p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-display font-semibold text-gold">LEVEL 12</span>
              <span className="text-sm text-slate-400">🔥 12 &nbsp; 🪙 450</span>
            </div>
            <XPBar current={720} max={1000} />
            <p className="text-xs text-slate-500 mt-1 mb-4">720 / 1000 XP</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs mb-4">
              <div className="card p-2"><p className="text-lg">💪</p><p className="font-semibold">84</p></div>
              <div className="card p-2"><p className="text-lg">🧠</p><p className="font-semibold">112</p></div>
              <div className="card p-2"><p className="text-lg">🔥</p><p className="font-semibold">91</p></div>
            </div>
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Today's Quests</p>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between card px-3 py-2"><span>⚔️ Complete DSA</span><span className="text-arcane">+50 XP</span></li>
              <li className="flex justify-between card px-3 py-2"><span>🏋️ Workout</span><span className="text-arcane">+40 XP</span></li>
              <li className="flex justify-between card px-3 py-2"><span>📚 Read 20 pages</span><span className="text-arcane">+25 XP</span></li>
            </ul>
          </motion.div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 pb-24">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="card p-5 text-center"
            >
              <p className="text-3xl mb-2">{f.icon}</p>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-xs text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="text-center text-xs text-slate-600 pb-8">
        © {new Date().getFullYear()} Life RPG. Built for adventurers.
      </footer>
    </div>
  );
}
