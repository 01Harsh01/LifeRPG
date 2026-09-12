// Lightweight canvas particle/confetti system for celebratory RPG moments
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  decay: number;
  shape: "circle" | "rect" | "star";
}

const COLORS = [
  "#e8b64f", // gold
  "#8b5cf6", // arcane purple
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
  "#38bdf8", // sky
  "#f59e0b", // amber
];

export function fireConfetti(particleCount = 50) {
  if (typeof window === "undefined") return;

  let canvas = document.getElementById("rpg-confetti-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "rpg-confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);
  }

  const width = (canvas.width = window.innerWidth);
  const height = (canvas.height = window.innerHeight);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles: Particle[] = [];
  const originX = width / 2;
  const originY = height / 3;

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: originX,
      y: originY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 4 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      alpha: 1,
      decay: 0.008 + Math.random() * 0.012,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }

  let animId: number;

  function render() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeCount = 0;

    for (const p of particles) {
      if (p.alpha <= 0) continue;
      activeCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.25; // gravity
      p.vx *= 0.98; // friction
      p.rotation += p.rotationSpeed;
      p.alpha -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;

      if (p.shape === "rect") {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    if (activeCount > 0) {
      animId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animId);
    }
  }

  animId = requestAnimationFrame(render);
}
