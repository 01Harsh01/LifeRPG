import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Brain,
  Zap,
  Puzzle,
  Calculator,
  Target,
  Trophy,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Search,
  Check,
  Award,
  ChevronRight,
  Eye,
  Activity,
  Compass,
} from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { fireConfetti } from "../utils/confetti";
import {
  playClickSound,
  playLevelUpSound,
  playQuestCompleteSound,
  playCoinSound,
} from "../utils/sound";

export interface PlayableGameDef {
  id: string;
  title: string;
  domain: string;
  skill: string;
  icon: string;
  difficulty: "Novice" | "Adept" | "Master" | "Grandmaster";
  description: string;
  levelsCount: number;
  statBonus: string;
  iqWeight: number;
}

export const PLAYABLE_BRAIN_GAMES: PlayableGameDef[] = [
  {
    id: "memory_matrix",
    title: "Pattern Memory Matrix",
    domain: "Spatial Working Memory",
    skill: "Visual Retention Span",
    icon: "🧠",
    difficulty: "Novice",
    description: "Memorize expanding spatial patterns flashed on arcane grids. As levels rise, the grid expands from 3×3 to 4×4 with more hidden tiles.",
    levelsCount: 5,
    statBonus: "+50 XP Intellect",
    iqWeight: 14,
  },
  {
    id: "stroop_reflex",
    title: "Stroop Color Interference",
    domain: "Cognitive Inhibition",
    skill: "Selective Attention & Focus",
    icon: "🎨",
    difficulty: "Adept",
    description: "Overcome subconscious brain reflexes: choose the font ink color while actively ignoring what the word spells under accelerating timers.",
    levelsCount: 5,
    statBonus: "+55 XP Discipline",
    iqWeight: 16,
  },
  {
    id: "speed_math",
    title: "Speed Arithmetic Matrix",
    domain: "Numerical Reasoning",
    skill: "Calculation Agility",
    icon: "🔢",
    difficulty: "Novice",
    description: "Solve rapid-fire equations under pressure. Progresses from single-digit addition to two-digit multiplication, division, and missing variables.",
    levelsCount: 5,
    statBonus: "+50 XP Intellect",
    iqWeight: 15,
  },
  {
    id: "odd_one_out",
    title: "Visual Outlier Scanner",
    domain: "Pattern Recognition",
    skill: "Visual Discrimination",
    icon: "🔎",
    difficulty: "Adept",
    description: "Spot the single outlier rune among identical glyphs. Grids grow from 3×3 to 5×5 while symbol variations become increasingly subtle.",
    levelsCount: 5,
    statBonus: "+50 XP Intellect",
    iqWeight: 15,
  },
  {
    id: "digit_span",
    title: "Digit Span Forward & Reverse",
    domain: "Working Memory Capacity",
    skill: "Information Chunking",
    icon: "🧮",
    difficulty: "Master",
    description: "Absorb sequences of digits shown one by one. In advanced levels, you must reconstruct the entire sequence completely backwards!",
    levelsCount: 6,
    statBonus: "+60 XP Intellect",
    iqWeight: 18,
  },
  {
    id: "arrow_flanker",
    title: "Arrow Flanker Direction Shift",
    domain: "Executive Focus",
    skill: "Attentional Conflict Control",
    icon: "🏹",
    difficulty: "Adept",
    description: "Identify the orientation of the CENTER arrow while surrounding flanker arrows point in misleading opposite directions at lightning speed.",
    levelsCount: 5,
    statBonus: "+55 XP Discipline",
    iqWeight: 16,
  },
  {
    id: "sequence_logic",
    title: "Number Sequence Formula",
    domain: "Inductive Logic",
    skill: "Mathematical Reasoning",
    icon: "📈",
    difficulty: "Master",
    description: "Deduce hidden mathematical formulas behind number series: arithmetic steps, Fibonacci growth, geometric doubling, and polynomial patterns.",
    levelsCount: 5,
    statBonus: "+65 XP Intellect",
    iqWeight: 17,
  },
  {
    id: "reflex_beacon",
    title: "Neural Reflex Beacon",
    domain: "Processing Speed",
    skill: "Motor Reaction Latency",
    icon: "⚡",
    difficulty: "Novice",
    description: "Test your raw neural transmission speed in milliseconds. Wait for the beacon to flare golden and strike before time runs out.",
    levelsCount: 5,
    statBonus: "+45 XP Discipline",
    iqWeight: 14,
  },
];

export default function BrainGames() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [activeGameId, setActiveGameId] = useState<string | null>("memory_matrix");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [gameScore, setGameScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // User mastered games stored in localStorage
  const [completedGameIds, setCompletedGameIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("liferpg_mastered_brain_games");
      return raw ? JSON.parse(raw) : ["memory_matrix"];
    } catch {
      return ["memory_matrix"];
    }
  });

  const baseIq = 100;
  const userIq = Math.min(160, baseIq + completedGameIds.length * 6.5);

  // --- GAME 1: Pattern Memory Matrix State ---
  const [matrixGridSize, setMatrixGridSize] = useState(3); // 3x3 or 4x4
  const [matrixTargetIndices, setMatrixTargetIndices] = useState<number[]>([]);
  const [matrixSelectedIndices, setMatrixSelectedIndices] = useState<number[]>([]);
  const [matrixShowing, setMatrixShowing] = useState(false);

  // --- GAME 2: Stroop State ---
  const [stroopWord, setStroopWord] = useState({ text: "RED", color: "text-blue-500", ink: "blue" });
  const [stroopStreak, setStroopStreak] = useState(0);
  const [stroopTimeLeft, setStroopTimeLeft] = useState(12);
  const stroopTimerRef = useRef<any>(null);

  // --- GAME 3: Speed Math State ---
  const [mathQ, setMathQ] = useState({ expr: "8 + 7", ans: 15, options: [15, 13, 16, 14] });
  const [mathStreak, setMathStreak] = useState(0);
  const [mathTimeLeft, setMathTimeLeft] = useState(15);
  const mathTimerRef = useRef<any>(null);

  // --- GAME 4: Odd-One-Out State ---
  const [oddGrid, setOddGrid] = useState<{ symbols: string[]; oddIndex: number; size: number }>({
    symbols: [],
    oddIndex: 0,
    size: 3,
  });

  // --- GAME 5: Digit Span State ---
  const [digitChain, setDigitChain] = useState<number[]>([]);
  const [digitDisplayIndex, setDigitDisplayIndex] = useState<number | null>(null);
  const [digitUserInput, setDigitUserInput] = useState("");
  const [digitIsReverse, setDigitIsReverse] = useState(false);
  const [digitAwaitingInput, setDigitAwaitingInput] = useState(false);

  // --- GAME 6: Arrow Flanker State ---
  const [flankerArrows, setFlankerArrows] = useState<{ display: string[]; targetDir: "left" | "right" }>({
    display: ["←", "←", "←", "←", "←"],
    targetDir: "left",
  });
  const [flankerStreak, setFlankerStreak] = useState(0);

  // --- GAME 7: Number Sequence Logic State ---
  const [seqProblem, setSeqProblem] = useState<{ series: string; answer: number; options: number[] }>({
    series: "2, 4, 6, 8, ?",
    answer: 10,
    options: [10, 11, 12, 9],
  });

  // --- GAME 8: Reflex Beacon State ---
  const [beaconState, setBeaconState] = useState<"waiting" | "ready" | "clicked" | "too_early">("waiting");
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const beaconStartRef = useRef<number>(0);
  const beaconTimeoutRef = useRef<any>(null);

  // Award rewards on mastering all levels of a game
  async function handleGameMastery(gameId: string) {
    playLevelUpSound();
    fireConfetti(70);

    const game = PLAYABLE_BRAIN_GAMES.find((g) => g.id === gameId);
    const title = game ? game.title : "Brain Workout";

    try {
      await api.post("/character/brain-game-complete", {
        gameTitle: title,
        score: 500,
      });
      await refreshUser();
    } catch {
      // Local fallback
    }

    if (!completedGameIds.includes(gameId)) {
      const next = [...completedGameIds, gameId];
      setCompletedGameIds(next);
      try {
        localStorage.setItem("liferpg_mastered_brain_games", JSON.stringify(next));
      } catch {}
    }

    setGameCompleted(true);
    setIsPlaying(false);
    toast.push(`🏆 Mastered all levels of ${title}! +50 XP, +20 Gold, +1 Intellect 🧠!`, "success");
  }

  // --- GAME 1: Pattern Memory Matrix Engine ---
  function startMemoryMatrixRound(lvl: number) {
    const size = lvl <= 2 ? 3 : 4; // 3x3 at lv1-2, 4x4 at lv3-5
    const totalTiles = size * size;
    const countToMemorize = Math.min(totalTiles - 2, lvl + 2); // 3, 4, 5, 6, 7

    setMatrixGridSize(size);
    setMatrixSelectedIndices([]);
    setMatrixShowing(true);

    const chosen = new Set<number>();
    while (chosen.size < countToMemorize) {
      chosen.add(Math.floor(Math.random() * totalTiles));
    }
    const targets = Array.from(chosen);
    setMatrixTargetIndices(targets);

    const flashDuration = Math.max(900, 1800 - lvl * 150);
    setTimeout(() => {
      setMatrixShowing(false);
    }, flashDuration);
  }

  function handleMatrixTileClick(idx: number) {
    if (matrixShowing || !isPlaying) return;
    if (matrixSelectedIndices.includes(idx)) return;

    playClickSound();
    const nextSelected = [...matrixSelectedIndices, idx];
    setMatrixSelectedIndices(nextSelected);

    // check if incorrect tile
    if (!matrixTargetIndices.includes(idx)) {
      playClickSound();
      toast.push("Missed a tile! Restarting round...", "error");
      setTimeout(() => startMemoryMatrixRound(currentLevel), 600);
      return;
    }

    // check if all targets selected
    if (nextSelected.length === matrixTargetIndices.length) {
      playQuestCompleteSound();
      setGameScore((s) => s + 100);

      if (currentLevel >= 5) {
        handleGameMastery("memory_matrix");
      } else {
        const nxt = currentLevel + 1;
        setCurrentLevel(nxt);
        toast.push(`Level ${currentLevel} cleared! Advancing to Level ${nxt}...`, "success");
        setTimeout(() => startMemoryMatrixRound(nxt), 800);
      }
    }
  }

  // --- GAME 2: Stroop Interference Engine ---
  const STROOP_PALETTE = [
    { name: "RED", textClass: "text-red-500", ink: "red" },
    { name: "BLUE", textClass: "text-blue-500", ink: "blue" },
    { name: "GREEN", textClass: "text-emerald-500", ink: "green" },
    { name: "YELLOW", textClass: "text-amber-400", ink: "yellow" },
    { name: "PURPLE", textClass: "text-purple-400", ink: "purple" },
    { name: "ORANGE", textClass: "text-orange-400", ink: "orange" },
  ];

  function generateStroopWord(lvl: number) {
    const poolSize = lvl <= 2 ? 4 : 6;
    const pool = STROOP_PALETTE.slice(0, poolSize);
    const textChoice = pool[Math.floor(Math.random() * pool.length)];
    const inkChoice = pool[Math.floor(Math.random() * pool.length)];

    setStroopWord({
      text: textChoice.name,
      color: inkChoice.textClass,
      ink: inkChoice.ink,
    });
  }

  function handleStroopChoice(chosenInk: string) {
    if (!isPlaying) return;

    if (chosenInk === stroopWord.ink) {
      playCoinSound();
      const nxtStreak = stroopStreak + 1;
      setStroopStreak(nxtStreak);
      setGameScore((s) => s + 50);

      if (nxtStreak >= 4 * currentLevel) {
        if (currentLevel >= 5) {
          handleGameMastery("stroop_reflex");
          return;
        } else {
          const nxt = currentLevel + 1;
          setCurrentLevel(nxt);
          toast.push(`Level ${currentLevel} conquered! Speed increasing...`, "success");
          setStroopTimeLeft(Math.max(8, 14 - nxt));
        }
      }
      generateStroopWord(currentLevel);
    } else {
      playClickSound();
      toast.push("Wrong ink color! Streak reset.", "error");
      setStroopStreak(0);
      generateStroopWord(currentLevel);
    }
  }

  // --- GAME 3: Speed Math Engine ---
  function generateMathQuestion(lvl: number) {
    let expr = "";
    let ans = 0;

    if (lvl === 1) {
      // Single digit addition
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      expr = `${a} + ${b}`;
      ans = a + b;
    } else if (lvl === 2) {
      // 2-digit addition & simple mult
      const isMult = Math.random() > 0.5;
      if (isMult) {
        const a = Math.floor(Math.random() * 8) + 3;
        const b = Math.floor(Math.random() * 8) + 3;
        expr = `${a} × ${b}`;
        ans = a * b;
      } else {
        const a = Math.floor(Math.random() * 30) + 12;
        const b = Math.floor(Math.random() * 30) + 12;
        expr = `${a} + ${b}`;
        ans = a + b;
      }
    } else if (lvl === 3) {
      // Division & Subtraction
      const b = Math.floor(Math.random() * 7) + 3;
      const a = b * (Math.floor(Math.random() * 8) + 2);
      expr = `${a} ÷ ${b}`;
      ans = a / b;
    } else if (lvl === 4) {
      // 3 terms or missing variables
      const a = Math.floor(Math.random() * 20) + 5;
      const b = Math.floor(Math.random() * 15) + 3;
      const c = Math.floor(Math.random() * 10) + 2;
      expr = `${a} + ${b} - ${c}`;
      ans = a + b - c;
    } else {
      // Advanced mental math
      const a = Math.floor(Math.random() * 12) + 6;
      const b = Math.floor(Math.random() * 12) + 6;
      const c = Math.floor(Math.random() * 25) + 10;
      expr = `${a} × ${b} + ${c}`;
      ans = a * b + c;
    }

    const options = [ans, ans + 2, ans - 3, ans + 5].sort(() => Math.random() - 0.5);
    setMathQ({ expr, ans, options });
  }

  function handleMathChoice(choice: number) {
    if (!isPlaying) return;

    if (choice === mathQ.ans) {
      playCoinSound();
      const nxt = mathStreak + 1;
      setMathStreak(nxt);
      setGameScore((s) => s + 60);

      if (nxt >= 4 * currentLevel) {
        if (currentLevel >= 5) {
          handleGameMastery("speed_math");
          return;
        } else {
          const nxtLvl = currentLevel + 1;
          setCurrentLevel(nxtLvl);
          toast.push(`Level ${currentLevel} cleared! Complex formulas unlocked...`, "success");
        }
      }
      generateMathQuestion(currentLevel);
    } else {
      playClickSound();
      toast.push(`Incorrect! Correct answer was ${mathQ.ans}`, "error");
      generateMathQuestion(currentLevel);
    }
  }

  // --- GAME 4: Odd-One-Out Engine ---
  const SYMBOL_SETS = [
    { base: "⚔️", odd: "🗡️" },
    { base: "🛡️", odd: "🔰" },
    { base: "🔮", odd: "🔮" },
    { base: "⭐", odd: "🌟" },
    { base: "👑", odd: "👒" },
    { base: "🔥", odd: "💥" },
    { base: "💎", odd: "💍" },
  ];

  function generateOddGrid(lvl: number) {
    const size = lvl <= 2 ? 3 : lvl <= 4 ? 4 : 5; // 3x3 -> 4x4 -> 5x5
    const total = size * size;
    const pair = SYMBOL_SETS[(lvl - 1) % SYMBOL_SETS.length];
    const oddIdx = Math.floor(Math.random() * total);

    const symbols = Array.from({ length: total }, (_, i) => (i === oddIdx ? pair.odd : pair.base));
    setOddGrid({ symbols, oddIndex: oddIdx, size });
  }

  function handleOddTileClick(idx: number) {
    if (!isPlaying) return;

    if (idx === oddGrid.oddIndex) {
      playCoinSound();
      setGameScore((s) => s + 80);

      if (currentLevel >= 5) {
        handleGameMastery("odd_one_out");
      } else {
        const nxt = currentLevel + 1;
        setCurrentLevel(nxt);
        toast.push(`Sharp eye! Advancing to Level ${nxt}...`, "success");
        generateOddGrid(nxt);
      }
    } else {
      playClickSound();
      toast.push("Not the outlier! Look closer.", "error");
    }
  }

  // --- GAME 5: Digit Span Forward & Reverse Engine ---
  function startDigitSpanRound(lvl: number) {
    const len = lvl <= 3 ? lvl + 2 : lvl + 1; // 3 digits up to 7 digits
    const isRev = lvl >= 4; // Levels 4, 5, 6 require REVERSE order!
    setDigitIsReverse(isRev);
    setDigitUserInput("");
    setDigitAwaitingInput(false);

    const digits: number[] = [];
    for (let i = 0; i < len; i++) {
      digits.push(Math.floor(Math.random() * 10));
    }
    setDigitChain(digits);

    // Flash digits sequentially
    let step = 0;
    setDigitDisplayIndex(digits[0]);
    playClickSound();

    const interval = setInterval(() => {
      step++;
      if (step < digits.length) {
        setDigitDisplayIndex(digits[step]);
        playClickSound();
      } else {
        clearInterval(interval);
        setDigitDisplayIndex(null);
        setDigitAwaitingInput(true);
      }
    }, 900);
  }

  function handleDigitSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!digitAwaitingInput) return;

    const expected = digitIsReverse
      ? [...digitChain].reverse().join("")
      : digitChain.join("");

    if (digitUserInput.trim() === expected) {
      playQuestCompleteSound();
      setGameScore((s) => s + 120);

      if (currentLevel >= 6) {
        handleGameMastery("digit_span");
      } else {
        const nxt = currentLevel + 1;
        setCurrentLevel(nxt);
        toast.push(`Correct! Level ${currentLevel} mastered. Advancing...`, "success");
        setTimeout(() => startDigitSpanRound(nxt), 800);
      }
    } else {
      playClickSound();
      toast.push(`Incorrect! Sequence was ${expected}. Try again.`, "error");
      setTimeout(() => startDigitSpanRound(currentLevel), 800);
    }
  }

  // --- GAME 6: Arrow Flanker Engine ---
  function generateFlanker(lvl: number) {
    const isCongruent = lvl === 1 ? true : Math.random() > 0.5;
    const centerDir: "left" | "right" = Math.random() > 0.5 ? "left" : "right";
    const flankerDir = isCongruent ? centerDir : centerDir === "left" ? "right" : "left";

    const cSymbol = centerDir === "left" ? "←" : "→";
    const fSymbol = flankerDir === "left" ? "←" : "→";

    setFlankerArrows({
      display: [fSymbol, fSymbol, cSymbol, fSymbol, fSymbol],
      targetDir: centerDir,
    });
  }

  function handleFlankerChoice(dir: "left" | "right") {
    if (!isPlaying) return;

    if (dir === flankerArrows.targetDir) {
      playCoinSound();
      const nxt = flankerStreak + 1;
      setFlankerStreak(nxt);
      setGameScore((s) => s + 40);

      if (nxt >= 5 * currentLevel) {
        if (currentLevel >= 5) {
          handleGameMastery("arrow_flanker");
          return;
        } else {
          const nxtLvl = currentLevel + 1;
          setCurrentLevel(nxtLvl);
          toast.push(`Level ${currentLevel} cleared! Distractors speeding up...`, "success");
        }
      }
      generateFlanker(currentLevel);
    } else {
      playClickSound();
      toast.push("Look at the CENTER arrow only! Streak reset.", "error");
      setFlankerStreak(0);
      generateFlanker(currentLevel);
    }
  }

  // --- GAME 7: Number Sequence Logic Engine ---
  const SEQUENCES_BY_LEVEL: Record<number, { series: string; ans: number; opts: number[] }[]> = {
    1: [
      { series: "3, 6, 9, 12, ?", ans: 15, opts: [15, 14, 16, 18] },
      { series: "5, 10, 15, 20, ?", ans: 25, opts: [25, 24, 30, 22] },
    ],
    2: [
      { series: "2, 4, 8, 16, ?", ans: 32, opts: [32, 24, 30, 64] },
      { series: "1, 4, 9, 16, ?", ans: 25, opts: [25, 24, 26, 36] },
    ],
    3: [
      { series: "1, 1, 2, 3, 5, 8, ?", ans: 13, opts: [13, 12, 14, 15] },
      { series: "21, 18, 15, 12, ?", ans: 9, opts: [9, 8, 10, 6] },
    ],
    4: [
      { series: "2, 3, 5, 9, 17, ?", ans: 33, opts: [33, 31, 35, 25] },
      { series: "4, 8, 7, 14, 13, ?", ans: 26, opts: [26, 25, 27, 28] },
    ],
    5: [
      { series: "2, 6, 12, 20, 30, ?", ans: 42, opts: [42, 40, 44, 46] },
      { series: "1, 8, 27, 64, ?", ans: 125, opts: [125, 100, 128, 216] },
    ],
  };

  function generateSeqProblem(lvl: number) {
    const list = SEQUENCES_BY_LEVEL[lvl] || SEQUENCES_BY_LEVEL[1];
    const picked = list[Math.floor(Math.random() * list.length)];
    setSeqProblem({
      series: picked.series,
      answer: picked.ans,
      options: picked.opts.sort(() => Math.random() - 0.5),
    });
  }

  function handleSeqChoice(choice: number) {
    if (!isPlaying) return;

    if (choice === seqProblem.answer) {
      playCoinSound();
      setGameScore((s) => s + 90);

      if (currentLevel >= 5) {
        handleGameMastery("sequence_logic");
      } else {
        const nxt = currentLevel + 1;
        setCurrentLevel(nxt);
        toast.push(`Formula solved! Advancing to Level ${nxt}...`, "success");
        generateSeqProblem(nxt);
      }
    } else {
      playClickSound();
      toast.push(`Incorrect! The next term was ${seqProblem.answer}.`, "error");
    }
  }

  // --- GAME 8: Neural Reflex Beacon Engine ---
  function startReflexRound(lvl: number) {
    setBeaconState("waiting");
    setReactionMs(null);

    if (beaconTimeoutRef.current) clearTimeout(beaconTimeoutRef.current);

    const delay = Math.floor(Math.random() * 2500) + 1200;
    beaconTimeoutRef.current = setTimeout(() => {
      setBeaconState("ready");
      beaconStartRef.current = Date.now();
    }, delay);
  }

  function handleBeaconClick() {
    if (!isPlaying) return;

    if (beaconState === "waiting") {
      clearTimeout(beaconTimeoutRef.current);
      setBeaconState("too_early");
      playClickSound();
      toast.push("Too early! Wait for the beacon to turn GOLD.", "error");
      return;
    }

    if (beaconState === "ready") {
      const elapsed = Date.now() - beaconStartRef.current;
      setReactionMs(elapsed);
      setBeaconState("clicked");

      // Thresholds get stricter level by level: 350ms, 300ms, 270ms, 240ms, 210ms
      const targetThreshold = Math.max(200, 380 - currentLevel * 35);

      if (elapsed <= targetThreshold) {
        playQuestCompleteSound();
        setGameScore((s) => s + 100);

        if (currentLevel >= 5) {
          handleGameMastery("reflex_beacon");
        } else {
          const nxt = currentLevel + 1;
          setCurrentLevel(nxt);
          toast.push(`Lightning reflex (${elapsed}ms)! Cleared Level ${currentLevel}.`, "success");
        }
      } else {
        playClickSound();
        toast.push(`Recorded ${elapsed}ms (Target was < ${targetThreshold}ms). Try again!`, "info");
      }
    }
  }

  // General game launcher
  function launchGame(gameId: string) {
    setActiveGameId(gameId);
    setIsPlaying(true);
    setCurrentLevel(1);
    setGameScore(0);
    setGameCompleted(false);

    if (gameId === "memory_matrix") {
      startMemoryMatrixRound(1);
    } else if (gameId === "stroop_reflex") {
      setStroopStreak(0);
      setStroopTimeLeft(14);
      generateStroopWord(1);
    } else if (gameId === "speed_math") {
      setMathStreak(0);
      setMathTimeLeft(20);
      generateMathQuestion(1);
    } else if (gameId === "odd_one_out") {
      generateOddGrid(1);
    } else if (gameId === "digit_span") {
      startDigitSpanRound(1);
    } else if (gameId === "arrow_flanker") {
      setFlankerStreak(0);
      generateFlanker(1);
    } else if (gameId === "sequence_logic") {
      generateSeqProblem(1);
    } else if (gameId === "reflex_beacon") {
      startReflexRound(1);
    }

    window.scrollTo({ top: 180, behavior: "smooth" });
  }

  const selectedGameObj = PLAYABLE_BRAIN_GAMES.find((g) => g.id === activeGameId) || PLAYABLE_BRAIN_GAMES[0];

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-indigo-950/70 via-surface to-surface border-arcane/30 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🧠</span>
              <span className="text-xs uppercase font-bold tracking-widest text-arcane">
                Arcane Mind Sanctum
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
              Cognitive Brain Forge & IQ Training
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Play 8 completely distinct, scientifically-grounded cognitive brain games that progressively increase in difficulty level-by-level.
              Master working memory, cognitive inhibition, deductive math, and reaction time to elevate your permanent character <strong>Intellect (🧠)</strong>.
            </p>
          </div>

          {/* Cognitive Stats Card */}
          <div className="card p-4 sm:p-5 bg-black/40 border-white/10 flex flex-col gap-3 min-w-[240px] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Cognitive IQ Rating</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-arcane/20 text-arcane border border-arcane/30">
                {userIq >= 140 ? "Grandmaster" : userIq >= 125 ? "Master" : userIq >= 115 ? "Adept" : "Novice"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-3xl sm:text-4xl font-black text-gold">
                {Math.round(userIq)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 160 Max</span>
            </div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-arcane via-indigo-500 to-gold h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((userIq - 100) / 60) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{completedGameIds.length} / {PLAYABLE_BRAIN_GAMES.length} Mastered</span>
              <span className="text-gold font-bold">+{completedGameIds.length * 50} Lifetime XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Game Arena */}
      <section className="card p-6 sm:p-8 border-gold/30 bg-surface/95 relative overflow-hidden shadow-2xl space-y-6">
        {/* Arena Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2.5 rounded-2xl bg-black/40 border border-white/10">
              {selectedGameObj.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                  {selectedGameObj.title}
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                  {selectedGameObj.domain}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedGameObj.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Current Difficulty</p>
              <p className="text-sm font-bold text-gold">Level {currentLevel} / {selectedGameObj.levelsCount}</p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-xl bg-arcane/20 border border-arcane/40 text-arcane font-mono font-bold">
              Score: {gameScore}
            </span>
          </div>
        </div>

        {/* Dynamic Game Canvas Area */}
        <div className="min-h-[320px] flex flex-col items-center justify-center py-4">
          {gameCompleted ? (
            /* Game Victory Screen */
            <div className="text-center py-6 space-y-4 max-w-sm mx-auto animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-3xl mx-auto shadow-goldGlow">
                👑
              </div>
              <h3 className="font-display text-2xl font-bold text-white">Challenge Conquered!</h3>
              <p className="text-xs text-slate-400">
                You successfully mastered all {selectedGameObj.levelsCount} progressive levels of {selectedGameObj.title}!
              </p>
              <div className="card p-4 bg-black/40 border-white/10 text-left space-y-1">
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> +50 XP & +20 Gold Claimed
                </p>
                <p className="text-xs text-arcane font-semibold flex items-center gap-1.5">
                  <Sparkles size={15} /> +1 Intellect (🧠) & +1 Discipline (🧘) Boosted
                </p>
              </div>
              <button
                type="button"
                onClick={() => launchGame(selectedGameObj.id)}
                className="btn-primary text-xs px-6 py-2.5 flex items-center justify-center gap-2 w-full"
              >
                <RotateCcw size={14} /> Play Again
              </button>
            </div>
          ) : !isPlaying ? (
            /* Launcher Screen */
            <div className="text-center py-8 space-y-4 max-w-md mx-auto">
              <p className="text-4xl animate-pulse">{selectedGameObj.icon}</p>
              <h3 className="font-display text-xl font-bold text-white">
                Ready for Level {currentLevel}?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                This challenge gets harder level by level. Complete all {selectedGameObj.levelsCount} levels to earn maximum attribute gains.
              </p>
              <button
                type="button"
                onClick={() => launchGame(selectedGameObj.id)}
                className="btn-primary text-xs px-8 py-3 inline-flex items-center gap-2 font-bold shadow-glow"
              >
                <Play size={15} /> Start Training Challenge
              </button>
            </div>
          ) : activeGameId === "memory_matrix" ? (
            /* --- 1. Memory Matrix Play Area --- */
            <div className="space-y-4 text-center max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-2">
                <span className="text-slate-400">Level {currentLevel} of 5</span>
                <span className="text-gold">Tiles to Memorize: {currentLevel + 2}</span>
              </div>
              <p className="text-xs text-slate-400">
                {matrixShowing ? "👀 Memorize the glowing tiles..." : "👉 Tap the tiles that flashed!"}
              </p>
              <div
                className={`grid gap-2.5 p-4 rounded-2xl bg-black/40 border border-white/10 ${
                  matrixGridSize === 3 ? "grid-cols-3 max-w-[260px]" : "grid-cols-4 max-w-[320px]"
                } mx-auto`}
              >
                {Array.from({ length: matrixGridSize * matrixGridSize }).map((_, i) => {
                  const isTarget = matrixShowing && matrixTargetIndices.includes(i);
                  const isSelected = matrixSelectedIndices.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={matrixShowing}
                      onClick={() => handleMatrixTileClick(i)}
                      className={`h-16 rounded-xl transition-all duration-150 border flex items-center justify-center text-xl font-bold ${
                        isTarget
                          ? "bg-gold text-black border-gold shadow-goldGlow scale-95"
                          : isSelected
                          ? "bg-arcane text-white border-arcane shadow-glow scale-95"
                          : "bg-surface/80 border-white/10 hover:border-arcane/50 active:scale-95"
                      }`}
                    >
                      {isTarget ? "✨" : isSelected ? "✓" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : activeGameId === "stroop_reflex" ? (
            /* --- 2. Stroop Reflex Play Area --- */
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-4">
                <span className="text-slate-400">Streak: <span className="text-gold">{stroopStreak}</span></span>
                <span className="text-slate-400">Required: {4 * currentLevel}</span>
              </div>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  Select the INK COLOR:
                </p>
                <p className={`font-display text-5xl font-black tracking-wider mt-3 ${stroopWord.color}`}>
                  {stroopWord.text}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {STROOP_PALETTE.slice(0, currentLevel <= 2 ? 4 : 6).map((c) => (
                  <button
                    key={c.ink}
                    type="button"
                    onClick={() => handleStroopChoice(c.ink)}
                    className="py-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 font-bold text-xs transition active:scale-95 text-white"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ) : activeGameId === "speed_math" ? (
            /* --- 3. Speed Math Play Area --- */
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-4">
                <span className="text-slate-400">Level {currentLevel} Formula</span>
                <span className="text-gold font-bold">Solved: {mathStreak} / {4 * currentLevel}</span>
              </div>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  Solve Mental Math:
                </p>
                <p className="font-display text-4xl sm:text-5xl font-black text-white mt-2">
                  {mathQ.expr} = ?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {mathQ.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleMathChoice(opt)}
                    className="py-3.5 rounded-xl bg-surface hover:bg-white/10 border border-white/15 hover:border-gold/40 text-white font-mono font-bold text-lg transition active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : activeGameId === "odd_one_out" ? (
            /* --- 4. Odd-One-Out Play Area --- */
            <div className="space-y-4 text-center max-w-sm mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-2">
                <span className="text-slate-400">Level {currentLevel} Grid</span>
                <span className="text-gold">Find the 1 outlier symbol</span>
              </div>
              <div
                className={`grid gap-2 p-4 rounded-2xl bg-black/40 border border-white/10 ${
                  oddGrid.size === 3 ? "grid-cols-3 max-w-[240px]" : oddGrid.size === 4 ? "grid-cols-4 max-w-[290px]" : "grid-cols-5 max-w-[340px]"
                } mx-auto`}
              >
                {oddGrid.symbols.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleOddTileClick(idx)}
                    className="h-14 rounded-xl bg-surface hover:bg-white/10 border border-white/10 hover:border-gold/50 flex items-center justify-center text-2xl transition active:scale-90"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : activeGameId === "digit_span" ? (
            /* --- 5. Digit Span Play Area --- */
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-4">
                <span className="text-slate-400">Level {currentLevel} of 6</span>
                <span className="text-gold font-bold">
                  {digitIsReverse ? "⚠️ REVERSE ORDER" : "FORWARD ORDER"}
                </span>
              </div>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center min-h-[140px]">
                {digitDisplayIndex !== null ? (
                  <p className="font-display text-6xl font-black text-gold animate-scale-up">
                    {digitDisplayIndex}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400">
                    {digitIsReverse ? "Type the digits in REVERSE order:" : "Type the digits in forward order:"}
                  </p>
                )}
              </div>
              {digitAwaitingInput && (
                <form onSubmit={handleDigitSubmit} className="flex gap-2">
                  <input
                    type="text"
                    pattern="[0-9]*"
                    autoFocus
                    value={digitUserInput}
                    onChange={(e) => setDigitUserInput(e.target.value)}
                    placeholder="Enter digits..."
                    className="flex-1 px-4 py-3 rounded-xl bg-surface border border-white/20 text-center font-mono text-xl tracking-widest text-white focus:outline-none focus:border-arcane"
                  />
                  <button type="submit" className="btn-primary text-xs px-6 font-bold">
                    Submit
                  </button>
                </form>
              )}
            </div>
          ) : activeGameId === "arrow_flanker" ? (
            /* --- 6. Arrow Flanker Play Area --- */
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-4">
                <span className="text-slate-400">Streak: {flankerStreak}</span>
                <span className="text-gold">Focus strictly on CENTER arrow!</span>
              </div>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10">
                <div className="flex justify-center items-center gap-3 text-4xl sm:text-5xl font-black text-slate-400">
                  <span>{flankerArrows.display[0]}</span>
                  <span>{flankerArrows.display[1]}</span>
                  <span className="text-gold text-5xl sm:text-6xl scale-110 drop-shadow-[0_0_12px_rgba(232,182,79,0.7)]">
                    {flankerArrows.display[2]}
                  </span>
                  <span>{flankerArrows.display[3]}</span>
                  <span>{flankerArrows.display[4]}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleFlankerChoice("left")}
                  className="py-4 rounded-xl bg-surface hover:bg-white/10 border border-white/15 hover:border-gold/40 text-2xl font-bold text-white transition active:scale-95"
                >
                  ← LEFT
                </button>
                <button
                  type="button"
                  onClick={() => handleFlankerChoice("right")}
                  className="py-4 rounded-xl bg-surface hover:bg-white/10 border border-white/15 hover:border-gold/40 text-2xl font-bold text-white transition active:scale-95"
                >
                  RIGHT →
                </button>
              </div>
            </div>
          ) : activeGameId === "sequence_logic" ? (
            /* --- 7. Sequence Logic Play Area --- */
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-4">
                <span className="text-slate-400">Level {currentLevel} Inductive Pattern</span>
                <span className="text-gold font-bold">Deduce the missing term</span>
              </div>
              <div className="p-8 rounded-2xl bg-black/40 border border-white/10">
                <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                  What number replaces ?
                </p>
                <p className="font-display text-3xl sm:text-4xl font-black text-white mt-2 tracking-wider">
                  {seqProblem.series}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {seqProblem.options.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSeqChoice(opt)}
                    className="py-3.5 rounded-xl bg-surface hover:bg-white/10 border border-white/15 hover:border-gold/40 text-white font-mono font-bold text-lg transition active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* --- 8. Reflex Beacon Play Area --- */
            <div className="space-y-6 text-center max-w-md mx-auto">
              <div className="flex items-center justify-between text-xs font-semibold px-4">
                <span className="text-slate-400">Level {currentLevel} Threshold</span>
                <span className="text-gold font-bold">&lt; {Math.max(200, 380 - currentLevel * 35)}ms Required</span>
              </div>
              <div
                onClick={handleBeaconClick}
                className={`p-12 rounded-3xl cursor-pointer border select-none transition-all duration-150 flex flex-col items-center justify-center min-h-[180px] ${
                  beaconState === "waiting"
                    ? "bg-red-500/10 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                    : beaconState === "ready"
                    ? "bg-gold text-black border-gold shadow-goldGlow scale-105"
                    : beaconState === "clicked"
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                    : "bg-black/40 border-white/10"
                }`}
              >
                {beaconState === "waiting" ? (
                  <>
                    <p className="text-3xl animate-pulse">⏳</p>
                    <p className="font-display font-bold text-lg text-red-300 mt-2">WAIT FOR GOLD...</p>
                    <p className="text-[11px] text-slate-400">Do not click yet</p>
                  </>
                ) : beaconState === "ready" ? (
                  <>
                    <p className="text-4xl animate-bounce">⚡</p>
                    <p className="font-display font-black text-2xl text-black mt-1">CLICK NOW!</p>
                  </>
                ) : beaconState === "clicked" ? (
                  <>
                    <p className="text-3xl">⏱️</p>
                    <p className="font-display font-bold text-xl text-white mt-1">{reactionMs} ms</p>
                    <p className="text-xs text-slate-300">Click to restart round</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl">⚠️</p>
                    <p className="font-display font-bold text-sm text-red-400 mt-1">Clicked Too Early!</p>
                    <p className="text-xs text-slate-400">Click to retry round</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 8 Playable Games Selector Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>⚔️</span> All 8 Progressive Cognitive Brain Games
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any game below to load it into the arena. Every game features level-by-level difficulty scaling.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAYABLE_BRAIN_GAMES.map((game) => {
            const isSelected = activeGameId === game.id;
            const isMastered = completedGameIds.includes(game.id);

            const diffStyle =
              game.difficulty === "Grandmaster"
                ? "text-red-400 bg-red-500/10 border-red-500/30"
                : game.difficulty === "Master"
                ? "text-purple-400 bg-purple-500/10 border-purple-500/30"
                : game.difficulty === "Adept"
                ? "text-blue-400 bg-blue-500/10 border-blue-500/30"
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

            return (
              <div
                key={game.id}
                onClick={() => {
                  launchGame(game.id);
                }}
                className={`card p-5 flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 border relative overflow-hidden ${
                  isSelected
                    ? "border-arcane bg-arcane/10 shadow-glow ring-2 ring-arcane/40"
                    : isMastered
                    ? "border-gold/30 bg-surface/90 hover:border-gold/50"
                    : "border-white/10 hover:border-arcane/40 bg-surface/80"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl p-2 rounded-xl bg-black/30 border border-white/10">
                    {game.icon}
                  </span>
                  {isMastered ? (
                    <span className="text-gold flex items-center gap-1 text-xs font-bold" title="Mastered">
                      <CheckCircle2 size={15} /> Mastered
                    </span>
                  ) : (
                    <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${diffStyle}`}>
                      {game.difficulty}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">
                    {game.domain}
                  </span>
                  <h3 className="font-display font-semibold text-sm sm:text-base text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                    {game.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {game.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                  <span className="text-gold font-mono font-semibold">{game.statBonus}</span>
                  <span className="text-arcane font-semibold flex items-center gap-1">
                    Play &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
