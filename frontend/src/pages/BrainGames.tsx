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

export interface BrainGameDef {
  id: number;
  title: string;
  domain: "Memory" | "Speed" | "Logic" | "Math" | "Focus";
  skill: string;
  iqMultiplier: string;
  difficulty: "Novice" | "Adept" | "Master" | "Grandmaster";
  icon: string;
  description: string;
  statBonus: string;
}

export const BRAIN_GAMES_50: BrainGameDef[] = [
  // DOMAIN 1: Working Memory & Recall (1-10)
  { id: 1, title: "Sequence Memory Matrix", domain: "Memory", skill: "Working Memory Span", iqMultiplier: "+3.2 IQ Pts", difficulty: "Novice", icon: "🧠", description: "Memorize expanding sequences of glowing arcane tiles and recall them in exact order.", statBonus: "+50 XP Intellect" },
  { id: 2, title: "Dual N-Back Chamber", domain: "Memory", skill: "Fluid Intelligence", iqMultiplier: "+4.5 IQ Pts", difficulty: "Grandmaster", icon: "💠", description: "Track simultaneous audio and spatial positions N-steps back. Proven to elevate fluid IQ.", statBonus: "+75 XP Intellect" },
  { id: 3, title: "Digit Span Forward & Reverse", domain: "Memory", skill: "Short-Term Storage", iqMultiplier: "+2.8 IQ Pts", difficulty: "Adept", icon: "🔢", description: "Absorb long numeric chains and reconstruct them backwards from mental projection.", statBonus: "+45 XP Intellect" },
  { id: 4, title: "Spatial Relic Grid", domain: "Memory", skill: "Spatial Encoding", iqMultiplier: "+3.0 IQ Pts", difficulty: "Novice", icon: "🗺️", description: "Memorize item locations on a grid flashed for 1.5 seconds, then place them accurately.", statBonus: "+40 XP Intellect" },
  { id: 5, title: "Card Pair Matching", domain: "Memory", skill: "Visual Recognition", iqMultiplier: "+2.2 IQ Pts", difficulty: "Novice", icon: "🃏", description: "Flip tiles to find matching pairs under time pressure with minimal redundant moves.", statBonus: "+35 XP Intellect" },
  { id: 6, title: "Flash Rune Recall", domain: "Memory", skill: "Iconic Memory", iqMultiplier: "+3.5 IQ Pts", difficulty: "Master", icon: "✨", description: "Identify subtle differences between briefly flashed ancient runic glyphs.", statBonus: "+60 XP Intellect" },
  { id: 7, title: "Adventurer's Satchel Check", domain: "Memory", skill: "Associative Recall", iqMultiplier: "+2.6 IQ Pts", difficulty: "Novice", icon: "🎒", description: "Inspect a collection of 15 quest items, then identify the one missing item.", statBonus: "+40 XP Intellect" },
  { id: 8, title: "Dungeon Labyrinth Retrace", domain: "Memory", skill: "Mental Cartography", iqMultiplier: "+3.8 IQ Pts", difficulty: "Master", icon: "🏰", description: "Observe an illuminated path through dungeon catacombs, then re-walk it in the dark.", statBonus: "+65 XP Intellect" },
  { id: 9, title: "Semantic Word Chain", domain: "Memory", skill: "Verbal Memory", iqMultiplier: "+3.0 IQ Pts", difficulty: "Adept", icon: "📜", description: "Link sequentially presented words via vivid mental imagery to recall them in reverse.", statBonus: "+50 XP Intellect" },
  { id: 10, title: "Hero Face & Title Recall", domain: "Memory", skill: "Face-Name Association", iqMultiplier: "+2.9 IQ Pts", difficulty: "Adept", icon: "👤", description: "Memorize portraits of visiting champions paired with their heroic titles.", statBonus: "+45 XP Intellect" },

  // DOMAIN 2: Processing Speed & Reflex (11-20)
  { id: 11, title: "Stroop Color Conflict", domain: "Speed", skill: "Inhibition Control", iqMultiplier: "+3.4 IQ Pts", difficulty: "Adept", icon: "🎨", description: "Overcome cognitive interference: name the font color while ignoring the conflicting word.", statBonus: "+55 XP Discipline" },
  { id: 12, title: "Rapid Reaction Blitz", domain: "Speed", skill: "Motor Response Time", iqMultiplier: "+2.5 IQ Pts", difficulty: "Novice", icon: "⚡", description: "Test millisecond reflex speed when the arcane sigil shifts from crimson to emerald.", statBonus: "+35 XP Discipline" },
  { id: 13, title: "Odd-One-Out Scanner", domain: "Speed", skill: "Visual Discrimination", iqMultiplier: "+3.1 IQ Pts", difficulty: "Adept", icon: "🔎", description: "Spot the single outlier glyph among 36 near-identical runes in fractions of a second.", statBonus: "+50 XP Discipline" },
  { id: 14, title: "Direction Arrow Shift", domain: "Speed", skill: "Attentional Switching", iqMultiplier: "+3.6 IQ Pts", difficulty: "Master", icon: "🏹", description: "React to arrow orientations while filtering out conflicting peripheral directions.", statBonus: "+60 XP Discipline" },
  { id: 15, title: "Target Precision Tap", domain: "Speed", skill: "Hand-Eye Coordination", iqMultiplier: "+2.7 IQ Pts", difficulty: "Novice", icon: "🎯", description: "Tap rapidly shrinking mana bubbles across the screen before they evaporate.", statBonus: "+40 XP Discipline" },
  { id: 16, title: "Symbol Matching Sprint", domain: "Speed", skill: "Perceptual Speed", iqMultiplier: "+2.9 IQ Pts", difficulty: "Novice", icon: "⚡", description: "Decide whether two flashing symbols match in a high-octane 30-second sprint.", statBonus: "+45 XP Discipline" },
  { id: 17, title: "Visual Search Tracker", domain: "Speed", skill: "Scanning Efficiency", iqMultiplier: "+3.3 IQ Pts", difficulty: "Adept", icon: "👁️", description: "Locate hidden artifacts scattered across busy fantasy battlefield illustrations.", statBonus: "+50 XP Discipline" },
  { id: 18, title: "Rapid Decision Duel", domain: "Speed", skill: "Choice Reaction Time", iqMultiplier: "+3.0 IQ Pts", difficulty: "Adept", icon: "⚔️", description: "Make instant binary choices under escalating countdown timers.", statBonus: "+45 XP Discipline" },
  { id: 19, title: "Rhythm Beat Lock", domain: "Speed", skill: "Temporal Processing", iqMultiplier: "+2.8 IQ Pts", difficulty: "Novice", icon: "🥁", description: "Synchronize taps to accelerating auditory pulses without falling off tempo.", statBonus: "+40 XP Discipline" },
  { id: 20, title: "Peripheral Vision Flash", domain: "Speed", skill: "Useful Field of View", iqMultiplier: "+4.0 IQ Pts", difficulty: "Master", icon: "👀", description: "Fixate on the center while correctly identifying targets appearing in peripheral vision.", statBonus: "+65 XP Discipline" },

  // DOMAIN 3: Deductive Logic & Strategic Reasoning (21-30)
  { id: 21, title: "Syllogism Truth Engine", domain: "Logic", skill: "Deductive Reasoning", iqMultiplier: "+3.9 IQ Pts", difficulty: "Master", icon: "⚖️", description: "Evaluate complex logical premises to deduce whether conclusions are strictly valid.", statBonus: "+65 XP Intellect" },
  { id: 22, title: "Raven's Pattern Matrix", domain: "Logic", skill: "Abstract Reasoning", iqMultiplier: "+4.4 IQ Pts", difficulty: "Grandmaster", icon: "🧩", description: "Analyze 3x3 geometric matrices and deduce the missing piece using inductive logic.", statBonus: "+80 XP Intellect" },
  { id: 23, title: "Knights & Liars Dialogue", domain: "Logic", skill: "Truth Table Deduction", iqMultiplier: "+3.7 IQ Pts", difficulty: "Master", icon: "🛡️", description: "Deduce identities when Knights always tell the truth and Liars always deceive.", statBonus: "+60 XP Intellect" },
  { id: 24, title: "Tower of Hanoi Minimizer", domain: "Logic", skill: "Recursive Planning", iqMultiplier: "+3.2 IQ Pts", difficulty: "Adept", icon: "🗼", description: "Transfer stacked disks to a target peg in the absolute minimum number of moves.", statBonus: "+50 XP Intellect" },
  { id: 25, title: "Arcane Circuit Conduit", domain: "Logic", skill: "Spatial Logic", iqMultiplier: "+2.8 IQ Pts", difficulty: "Novice", icon: "⚡", description: "Rotate intersecting conduits to deliver mana from core to obelisks without leaks.", statBonus: "+40 XP Intellect" },
  { id: 26, title: "Balance Scale Riddle", domain: "Logic", skill: "Transitive Inference", iqMultiplier: "+3.5 IQ Pts", difficulty: "Adept", icon: "⚖️", description: "Compare multi-object balance scales to deduce the heaviest and lightest treasures.", statBonus: "+55 XP Intellect" },
  { id: 27, title: "Latin Square Sudoku", domain: "Logic", skill: "Constraint Satisfaction", iqMultiplier: "+3.6 IQ Pts", difficulty: "Master", icon: "▦", description: "Fill grids ensuring no symbol repeats across rows, columns, or diagonal paths.", statBonus: "+60 XP Intellect" },
  { id: 28, title: "Elemental Flow Pipeline", domain: "Logic", skill: "Systems Thinking", iqMultiplier: "+3.0 IQ Pts", difficulty: "Adept", icon: "🌊", description: "Solve intersecting valve dependencies to route water, fire, and lightning.", statBonus: "+50 XP Intellect" },
  { id: 29, title: "Cryptarithm Decipher", domain: "Logic", skill: "Symbolic Substitution", iqMultiplier: "+4.2 IQ Pts", difficulty: "Grandmaster", icon: "🔐", description: "Replace alphabet letters with single digits to make arithmetic equations hold true.", statBonus: "+75 XP Intellect" },
  { id: 30, title: "Venn Set Intersections", domain: "Logic", skill: "Set Theory Logic", iqMultiplier: "+3.1 IQ Pts", difficulty: "Adept", icon: "⭕", description: "Determine which items belong strictly in triple-circle overlapping set regions.", statBonus: "+50 XP Intellect" },

  // DOMAIN 4: Numerical Alchemy & Math Agility (31-40)
  { id: 31, title: "Mental Arithmetic Sprint", domain: "Math", skill: "Calculation Speed", iqMultiplier: "+3.3 IQ Pts", difficulty: "Novice", icon: "➕", description: "Solve fast-paced addition, subtraction, and multiplication chains against the clock.", statBonus: "+50 XP Intellect" },
  { id: 32, title: "Countdown 24 Alchemist", domain: "Math", skill: "Combinatorial Arithmetic", iqMultiplier: "+4.1 IQ Pts", difficulty: "Master", icon: "🎲", description: "Combine 4 random numbers with basic operations to equal exactly 24.", statBonus: "+70 XP Intellect" },
  { id: 33, title: "Prime Number Hunter", domain: "Math", skill: "Factorization Reflex", iqMultiplier: "+3.4 IQ Pts", difficulty: "Adept", icon: "🔢", description: "Filter prime numbers from composite decoys at breakneck speeds.", statBonus: "+55 XP Intellect" },
  { id: 34, title: "Number Sequence Formula", domain: "Math", skill: "Pattern Recognition", iqMultiplier: "+3.8 IQ Pts", difficulty: "Master", icon: "📈", description: "Uncover geometric, Fibonacci, and polynomial series patterns to find next terms.", statBonus: "+65 XP Intellect" },
  { id: 35, title: "Fraction Split Duel", domain: "Math", skill: "Proportional Reasoning", iqMultiplier: "+3.0 IQ Pts", difficulty: "Adept", icon: "🍰", description: "Quickly compare, simplify, and sum fractions under countdown pressure.", statBonus: "+50 XP Intellect" },
  { id: 36, title: "Percentage Quick Estimator", domain: "Math", skill: "Estimation Skills", iqMultiplier: "+2.7 IQ Pts", difficulty: "Novice", icon: "📊", description: "Estimate complex percentages and compound growth multipliers within 5% error margins.", statBonus: "+40 XP Intellect" },
  { id: 37, title: "Equation Balance Weight", domain: "Math", skill: "Algebraic Thinking", iqMultiplier: "+3.5 IQ Pts", difficulty: "Adept", icon: "⚖️", description: "Find the missing variable X that brings both sides of an algebraic scale into balance.", statBonus: "+55 XP Intellect" },
  { id: 38, title: "Binary Matrix Decoder", domain: "Math", skill: "Base Conversion", iqMultiplier: "+3.9 IQ Pts", difficulty: "Master", icon: "💻", description: "Convert 8-bit binary chains to decimal values and vice versa with mental shortcuts.", statBonus: "+65 XP Intellect" },
  { id: 39, title: "Roman Numeral Decipher", domain: "Math", skill: "Symbolic Counting", iqMultiplier: "+2.9 IQ Pts", difficulty: "Novice", icon: "🏛️", description: "Convert intricate Roman numerals into standard quantities in seconds.", statBonus: "+45 XP Intellect" },
  { id: 40, title: "Grid Sum Target Lock", domain: "Math", skill: "Combinatorial Summing", iqMultiplier: "+3.2 IQ Pts", difficulty: "Adept", icon: "🧮", description: "Highlight numbers on a 4x4 grid that add up exactly to the target bounty sum.", statBonus: "+50 XP Intellect" },

  // DOMAIN 5: Focus, Spatial & Executive Function (41-50)
  { id: 41, title: "3D Mental Rotation", domain: "Focus", skill: "Spatial Visualization", iqMultiplier: "+4.3 IQ Pts", difficulty: "Grandmaster", icon: "🧊", description: "Mentally rotate complex 3D polyhedra to identify identical perspectives.", statBonus: "+75 XP Discipline" },
  { id: 42, title: "Mirror Image Reflection", domain: "Focus", skill: "Spatial Symmetry", iqMultiplier: "+3.1 IQ Pts", difficulty: "Novice", icon: "🪞", description: "Distinguish between true mirror reflections and mere 2D planar rotations.", statBonus: "+45 XP Discipline" },
  { id: 43, title: "Shadow Silhouette Match", domain: "Focus", skill: "Perspective Projection", iqMultiplier: "+2.8 IQ Pts", difficulty: "Novice", icon: "👥", description: "Match 3D hero weapons with their cast shadows under varying light angles.", statBonus: "+40 XP Discipline" },
  { id: 44, title: "Maze Path Minimizer", domain: "Focus", skill: "Spatial Navigation", iqMultiplier: "+3.6 IQ Pts", difficulty: "Adept", icon: "🌀", description: "Scan labyrinthine mazes to discover the single route requiring fewest turns.", statBonus: "+55 XP Discipline" },
  { id: 45, title: "Divided Attention Chamber", domain: "Focus", skill: "Multi-Tasking Control", iqMultiplier: "+4.0 IQ Pts", difficulty: "Master", icon: "🔀", description: "Track a visual target while concurrently verifying auditory number parity.", statBonus: "+65 XP Discipline" },
  { id: 46, title: "Origami Fold & Punch", domain: "Focus", skill: "Mental Origami Simulation", iqMultiplier: "+4.2 IQ Pts", difficulty: "Grandmaster", icon: "📄", description: "Predict hole punch positions after a folded sheet of parchment is unfolded.", statBonus: "+75 XP Discipline" },
  { id: 47, title: "Clockwise Vector Tracking", domain: "Focus", skill: "Kinematic Visualization", iqMultiplier: "+3.4 IQ Pts", difficulty: "Adept", icon: "⏰", description: "Predict future positions of multi-speed rotating clock arms after N seconds.", statBonus: "+50 XP Discipline" },
  { id: 48, title: "Mandala Symmetry Scanner", domain: "Focus", skill: "Pattern Symmetry", iqMultiplier: "+3.0 IQ Pts", difficulty: "Novice", icon: "💠", description: "Determine if intricate circular mandalas maintain perfect bilateral symmetry.", statBonus: "+45 XP Discipline" },
  { id: 49, title: "Selective Audio Pitch", domain: "Focus", skill: "Auditory Filtering", iqMultiplier: "+3.5 IQ Pts", difficulty: "Adept", icon: "🎵", description: "Distinguish higher and lower frequency tones through background white noise.", statBonus: "+55 XP Discipline" },
  { id: 50, title: "Zen Sustained Focus Test", domain: "Focus", skill: "Vigilance & Mindfulness", iqMultiplier: "+3.7 IQ Pts", difficulty: "Master", icon: "🧘", description: "Maintain unbroken continuous attention on a subtle pulsating beacon for 2 minutes.", statBonus: "+60 XP Discipline" },
];

const DOMAIN_ICONS = {
  All: "✨",
  Memory: "🧠",
  Speed: "⚡",
  Logic: "🧩",
  Math: "🔢",
  Focus: "🎯",
};

export default function BrainGames() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");

  // Interactive Mini-Game State
  const [activeGameId, setActiveGameId] = useState<number | null>(null);
  const [gamePlaying, setGamePlaying] = useState(false);
  const [gameResult, setGameResult] = useState<{ score: number; maxScore: number; xp: number; iqEstimate: number } | null>(null);

  // GAME 1: Sequence Memory Matrix State
  const [seqGrid, setSeqGrid] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [showingSeq, setShowingSeq] = useState(false);
  const [seqLevel, setSeqLevel] = useState(1);
  const [activeTile, setActiveTile] = useState<number | null>(null);

  // GAME 2: Stroop Reflex State
  const [stroopWord, setStroopWord] = useState({ text: "RED", color: "text-blue-500", actual: "blue" });
  const [stroopScore, setStroopScore] = useState(0);
  const [stroopTime, setStroopTime] = useState(15);
  const stroopTimerRef = useRef<any>(null);

  // GAME 3: Speed Math State
  const [mathProblem, setMathProblem] = useState({ q: "12 + 15", a: 27, options: [27, 25, 29, 31] });
  const [mathScore, setMathScore] = useState(0);
  const [mathTime, setMathTime] = useState(20);
  const mathTimerRef = useRef<any>(null);

  // User's Brain stats stored in local storage
  const [completedGames, setCompletedGames] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem("liferpg_completed_brain_games");
      return raw ? JSON.parse(raw) : [1, 11, 31];
    } catch {
      return [1, 11, 31];
    }
  });

  const baseIq = 100;
  const userIq = baseIq + completedGames.length * 1.5;

  function filterGames() {
    return BRAIN_GAMES_50.filter((g) => {
      const matchesSearch =
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        g.skill.toLowerCase().includes(search.toLowerCase()) ||
        g.description.toLowerCase().includes(search.toLowerCase());
      const matchesDomain = selectedDomain === "All" || g.domain === selectedDomain;
      const matchesDiff = selectedDifficulty === "All" || g.difficulty === selectedDifficulty;
      return matchesSearch && matchesDomain && matchesDiff;
    });
  }

  // Award rewards on completion
  async function completeGame(gameId: number, score: number) {
    playLevelUpSound();
    fireConfetti(60);

    const game = BRAIN_GAMES_50.find((g) => g.id === gameId);
    const gameName = game ? game.title : "Brain Challenge";

    try {
      await api.post("/character/brain-game-complete", {
        gameTitle: gameName,
        score,
      });
      await refreshUser();
    } catch {
      // Fallback local tracking
    }

    if (!completedGames.includes(gameId)) {
      const next = [...completedGames, gameId];
      setCompletedGames(next);
      try {
        localStorage.setItem("liferpg_completed_brain_games", JSON.stringify(next));
      } catch {}
    }

    toast.push(`🎉 Mastered ${gameName}! Earned +50 XP, +20 Gold, and +1 Intellect 🧠!`, "success");
  }

  // --- GAME 1: Sequence Memory Logic ---
  function startSequenceGame() {
    setActiveGameId(1);
    setGamePlaying(true);
    setGameResult(null);
    setSeqLevel(1);
    startSeqRound(1);
  }

  function startSeqRound(lvl: number) {
    setPlayerSeq([]);
    setShowingSeq(true);

    // generate sequence of length lvl + 2
    const seqLength = lvl + 2;
    const newSeq: number[] = [];
    for (let i = 0; i < seqLength; i++) {
      newSeq.push(Math.floor(Math.random() * 9));
    }
    setSeqGrid(newSeq);

    // play sequence visually
    let step = 0;
    const interval = setInterval(() => {
      if (step < newSeq.length) {
        const tile = newSeq[step];
        setActiveTile(tile);
        playClickSound();
        setTimeout(() => setActiveTile(null), 350);
        step++;
      } else {
        clearInterval(interval);
        setShowingSeq(false);
      }
    }, 600);
  }

  function handleTileClick(index: number) {
    if (showingSeq || !gamePlaying) return;
    playClickSound();

    const nextPlayerSeq = [...playerSeq, index];
    setPlayerSeq(nextPlayerSeq);

    // check accuracy
    const expected = seqGrid[nextPlayerSeq.length - 1];
    if (index !== expected) {
      // Game Over
      setGamePlaying(false);
      const finalScore = (seqLevel - 1) * 100;
      setGameResult({
        score: finalScore,
        maxScore: 600,
        xp: 50,
        iqEstimate: Math.min(145, 105 + (seqLevel - 1) * 8),
      });
      completeGame(1, finalScore);
      return;
    }

    // if finished sequence
    if (nextPlayerSeq.length === seqGrid.length) {
      playQuestCompleteSound();
      if (seqLevel >= 5) {
        // Won the challenge!
        setGamePlaying(false);
        setGameResult({
          score: 500,
          maxScore: 500,
          xp: 60,
          iqEstimate: 140,
        });
        completeGame(1, 500);
      } else {
        toast.push(`Level ${seqLevel} Cleared! Next round...`, "success");
        setSeqLevel(seqLevel + 1);
        setTimeout(() => startSeqRound(seqLevel + 1), 800);
      }
    }
  }

  // --- GAME 2: Stroop Reflex Logic ---
  const STROOP_COLORS = [
    { text: "RED", color: "text-red-500", actual: "red" },
    { text: "BLUE", color: "text-blue-500", actual: "blue" },
    { text: "GREEN", color: "text-emerald-500", actual: "green" },
    { text: "YELLOW", color: "text-amber-400", actual: "yellow" },
  ];

  function nextStroopQuestion() {
    const textItem = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    const colorItem = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    setStroopWord({
      text: textItem.text,
      color: colorItem.color,
      actual: colorItem.actual,
    });
  }

  function startStroopGame() {
    setActiveGameId(11);
    setGamePlaying(true);
    setGameResult(null);
    setStroopScore(0);
    setStroopTime(15);
    nextStroopQuestion();

    if (stroopTimerRef.current) clearInterval(stroopTimerRef.current);
    stroopTimerRef.current = setInterval(() => {
      setStroopTime((prev) => {
        if (prev <= 1) {
          clearInterval(stroopTimerRef.current);
          setGamePlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (activeGameId === 11 && stroopTime === 0 && !gameResult && gamePlaying === false) {
      setGameResult({
        score: stroopScore * 50,
        maxScore: 600,
        xp: 50,
        iqEstimate: Math.min(145, 100 + stroopScore * 4),
      });
      completeGame(11, stroopScore * 50);
    }
  }, [stroopTime, activeGameId, gamePlaying]);

  function handleStroopAnswer(chosenColor: string) {
    if (!gamePlaying) return;
    if (chosenColor === stroopWord.actual) {
      playCoinSound();
      setStroopScore((s) => s + 1);
    } else {
      playClickSound();
    }
    nextStroopQuestion();
  }

  // --- GAME 3: Rapid Mental Math Logic ---
  function generateMathProblem() {
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * 20) + 5;
    const isMult = Math.random() > 0.6;
    let q = "";
    let ans = 0;

    if (isMult) {
      const m1 = Math.floor(Math.random() * 10) + 3;
      const m2 = Math.floor(Math.random() * 9) + 2;
      q = `${m1} × ${m2}`;
      ans = m1 * m2;
    } else {
      q = `${a} + ${b}`;
      ans = a + b;
    }

    const options = [ans, ans + 2, ans - 3, ans + 5].sort(() => Math.random() - 0.5);
    setMathProblem({ q, a: ans, options });
  }

  function startMathGame() {
    setActiveGameId(31);
    setGamePlaying(true);
    setGameResult(null);
    setMathScore(0);
    setMathTime(20);
    generateMathProblem();

    if (mathTimerRef.current) clearInterval(mathTimerRef.current);
    mathTimerRef.current = setInterval(() => {
      setMathTime((prev) => {
        if (prev <= 1) {
          clearInterval(mathTimerRef.current);
          setGamePlaying(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => {
    if (activeGameId === 31 && mathTime === 0 && !gameResult && gamePlaying === false) {
      setGameResult({
        score: mathScore * 40,
        maxScore: 500,
        xp: 50,
        iqEstimate: Math.min(145, 100 + mathScore * 5),
      });
      completeGame(31, mathScore * 40);
    }
  }, [mathTime, activeGameId, gamePlaying]);

  function handleMathAnswer(choice: number) {
    if (!gamePlaying) return;
    if (choice === mathProblem.a) {
      playCoinSound();
      setMathScore((s) => s + 1);
    } else {
      playClickSound();
    }
    generateMathProblem();
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (stroopTimerRef.current) clearInterval(stroopTimerRef.current);
      if (mathTimerRef.current) clearInterval(mathTimerRef.current);
    };
  }, []);

  const filteredList = filterGames();

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
              50 Brain Games for IQ & Cognitive Power
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Elevate fluid intelligence, rapid mental calculation, working memory span, and executive focus.
              Master daily mental training workouts to earn permanent character <strong>Intellect (🧠)</strong> and <strong>Discipline (🧘)</strong> boosts.
            </p>
          </div>

          {/* Cognitive Stats Card */}
          <div className="card p-4 sm:p-5 bg-black/40 border-white/10 flex flex-col gap-3 min-w-[240px] shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">Cognitive IQ Rating</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-arcane/20 text-arcane border border-arcane/30">
                {userIq >= 135 ? "Grandmaster" : userIq >= 120 ? "Master" : userIq >= 110 ? "Adept" : "Novice"}
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
              <span>{completedGames.length} / 50 Games Mastered</span>
              <span className="text-gold font-bold">+{completedGames.length * 50} Total XP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Playable Mini-Game Arena */}
      <section className="card p-6 sm:p-8 border-gold/30 bg-surface/95 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4 mb-6">
          <div>
            <span className="text-[10px] uppercase tracking-widest font-bold text-gold flex items-center gap-1.5">
              <Sparkles size={14} /> Live Interactive Arena
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white mt-1">
              Test Your Cognitive Processing in Real Time
            </h2>
            <p className="text-xs text-slate-400">
              Play directly in your browser. Completing games grants instant XP, Gold, and character Intellect attribute upgrades!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={startSequenceGame}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeGameId === 1 ? "bg-arcane text-white font-bold shadow-glow" : "btn-secondary text-slate-300"
              }`}
            >
              🧠 Memory Matrix
            </button>
            <button
              type="button"
              onClick={startStroopGame}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeGameId === 11 ? "bg-arcane text-white font-bold shadow-glow" : "btn-secondary text-slate-300"
              }`}
            >
              🎨 Stroop Reflex
            </button>
            <button
              type="button"
              onClick={startMathGame}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeGameId === 31 ? "bg-arcane text-white font-bold shadow-glow" : "btn-secondary text-slate-300"
              }`}
            >
              ➕ Math Sprint
            </button>
          </div>
        </div>

        {/* Game Arena Play Area */}
        {activeGameId === null ? (
          <div className="text-center py-12 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-arcane/15 border border-arcane/30 flex items-center justify-center text-3xl mx-auto animate-bounce">
              ⚡
            </div>
            <h3 className="font-display text-lg font-bold text-white">Choose a Challenge Above</h3>
            <p className="text-xs text-slate-400">
              Select one of the three real-time cognitive tests above (Memory Matrix, Stroop Reflex, or Math Sprint) to start training your mind right now!
            </p>
            <button
              type="button"
              onClick={startSequenceGame}
              className="btn-primary text-xs px-6 py-2.5 inline-flex items-center gap-2"
            >
              <Play size={14} /> Start Sequence Memory Test
            </button>
          </div>
        ) : gameResult ? (
          <div className="text-center py-8 space-y-4 max-w-sm mx-auto animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-3xl mx-auto shadow-goldGlow">
              🏆
            </div>
            <h3 className="font-display text-xl font-bold text-white">Cognitive Workout Complete!</h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="card p-3 bg-black/30 border-white/5">
                <p className="text-[10px] text-slate-400 uppercase">Score</p>
                <p className="text-xl font-bold text-gold">{gameResult.score} pts</p>
              </div>
              <div className="card p-3 bg-black/30 border-white/5">
                <p className="text-[10px] text-slate-400 uppercase">IQ Rating</p>
                <p className="text-xl font-bold text-arcane">{gameResult.iqEstimate}</p>
              </div>
            </div>
            <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
              <CheckCircle2 size={15} /> Rewards Deposited: +50 XP, +20 Gold, +1 Intellect 🧠
            </p>
            <button
              type="button"
              onClick={() => {
                if (activeGameId === 1) startSequenceGame();
                else if (activeGameId === 11) startStroopGame();
                else startMathGame();
              }}
              className="btn-primary text-xs px-6 py-2 flex items-center justify-center gap-2 w-full"
            >
              <RotateCcw size={14} /> Play Again
            </button>
          </div>
        ) : activeGameId === 1 ? (
          /* GAME 1: Sequence Memory Matrix */
          <div className="max-w-xs mx-auto text-center space-y-4 py-2">
            <div className="flex items-center justify-between text-xs font-semibold px-2">
              <span className="text-slate-400">Level {seqLevel} / 5</span>
              <span className="text-gold">Sequence Length: {seqLevel + 2}</span>
            </div>
            <p className="text-xs text-slate-400">
              {showingSeq ? "👀 Memorize the flashing pattern..." : "👉 Repeat the pattern!"}
            </p>

            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10">
              {Array.from({ length: 9 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={showingSeq}
                  onClick={() => handleTileClick(i)}
                  className={`h-20 rounded-xl transition-all duration-150 border flex items-center justify-center text-xl font-bold ${
                    activeTile === i
                      ? "bg-gold text-black border-gold shadow-goldGlow scale-95"
                      : "bg-surface/80 border-white/10 hover:border-arcane/50 active:scale-95"
                  }`}
                >
                  {activeTile === i ? "✨" : ""}
                </button>
              ))}
            </div>
          </div>
        ) : activeGameId === 11 ? (
          /* GAME 2: Stroop Color Conflict */
          <div className="max-w-md mx-auto text-center space-y-6 py-4">
            <div className="flex items-center justify-between text-xs font-semibold px-4">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock size={14} /> Time: <span className="text-gold font-mono">{stroopTime}s</span>
              </span>
              <span className="text-arcane font-mono font-bold">Score: {stroopScore}</span>
            </div>

            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Click the INK COLOR (Ignore what the word says!):
              </p>
              <p className={`font-display text-4xl sm:text-5xl font-extrabold tracking-wider mt-2 ${stroopWord.color}`}>
                {stroopWord.text}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleStroopAnswer("red")}
                className="py-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs transition active:scale-95"
              >
                Red
              </button>
              <button
                type="button"
                onClick={() => handleStroopAnswer("blue")}
                className="py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 font-bold text-xs transition active:scale-95"
              >
                Blue
              </button>
              <button
                type="button"
                onClick={() => handleStroopAnswer("green")}
                className="py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition active:scale-95"
              >
                Green
              </button>
              <button
                type="button"
                onClick={() => handleStroopAnswer("yellow")}
                className="py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs transition active:scale-95"
              >
                Yellow
              </button>
            </div>
          </div>
        ) : (
          /* GAME 3: Rapid Mental Math */
          <div className="max-w-md mx-auto text-center space-y-6 py-4">
            <div className="flex items-center justify-between text-xs font-semibold px-4">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock size={14} /> Time: <span className="text-gold font-mono">{mathTime}s</span>
              </span>
              <span className="text-arcane font-mono font-bold">Correct: {mathScore}</span>
            </div>

            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center gap-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Solve as fast as you can:
              </p>
              <p className="font-display text-4xl sm:text-5xl font-extrabold tracking-wider text-white mt-2">
                {mathProblem.q} = ?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {mathProblem.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleMathAnswer(opt)}
                  className="py-3.5 rounded-xl bg-surface hover:bg-white/10 border border-white/15 hover:border-gold/40 text-white font-mono font-bold text-base transition active:scale-95"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <span>📚</span> The 50 Cognitive Puzzles Catalog
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              50 distinct games across Memory, Processing Speed, Deductive Logic, Mental Math, and Executive Focus
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 50 brain games..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/20 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-arcane/60"
            />
          </div>
        </div>

        {/* Domain Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {["All", "Memory", "Speed", "Logic", "Math", "Focus"].map((dom) => {
            const isSelected = selectedDomain === dom;
            const icon = DOMAIN_ICONS[dom as keyof typeof DOMAIN_ICONS];
            const count =
              dom === "All"
                ? BRAIN_GAMES_50.length
                : BRAIN_GAMES_50.filter((g) => g.domain === dom).length;

            return (
              <button
                key={dom}
                type="button"
                onClick={() => setSelectedDomain(dom)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-arcane text-white font-bold shadow-glow"
                    : "card hover:border-arcane/40 text-slate-400 hover:text-white"
                }`}
              >
                <span>{icon}</span> {dom} ({count})
              </button>
            );
          })}

          <div className="h-4 w-px bg-white/10 mx-1 shrink-0" />

          {["All", "Novice", "Adept", "Master", "Grandmaster"].map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-gold text-black font-bold shadow-goldGlow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {diff === "All" ? "Any Tier" : diff}
              </button>
            );
          })}
        </div>
      </div>

      {/* 50 Games Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((game) => {
          const isMastered = completedGames.includes(game.id);

          const diffColor =
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
              className={`card p-4 sm:p-5 flex flex-col justify-between gap-3 border transition-all duration-300 relative overflow-hidden ${
                isMastered ? "border-gold/30 bg-surface/90" : "border-white/10 hover:border-arcane/40 bg-surface/80"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center text-xl shrink-0">
                    {game.icon}
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono font-semibold">
                      GAME #{String(game.id).padStart(2, "0")} • {game.domain}
                    </span>
                    <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                      {game.title}
                    </h3>
                  </div>
                </div>

                {isMastered && (
                  <span className="text-gold" title="Mastered">
                    <CheckCircle2 size={16} />
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {game.description}
              </p>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-black/5 dark:border-white/5">
                <span className={`px-2 py-0.5 rounded-md border font-semibold text-[10px] uppercase ${diffColor}`}>
                  {game.difficulty}
                </span>
                <span className="text-arcane font-mono font-semibold">{game.iqMultiplier}</span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-gold font-mono font-semibold">
                  {game.statBonus}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    // Open interactive arena with corresponding game or sequence
                    if (game.id <= 10) startSequenceGame();
                    else if (game.id <= 20) startStroopGame();
                    else startMathGame();
                    window.scrollTo({ top: 120, behavior: "smooth" });
                  }}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1 shrink-0"
                >
                  <Play size={12} /> Play
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
