export function burstConfetti(x = window.innerWidth / 2, y = window.innerHeight / 3) {
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d")!;
  const colors = ["#D4AF37", "#F5D77A", "#0F172A", "#22C55E", "#38BDF8"];
  const parts = Array.from({ length: 90 }, () => ({
    x, y,
    vx: (Math.random() - 0.5) * 10,
    vy: Math.random() * -12 - 2,
    g: 0.35,
    r: Math.random() * 4 + 2,
    c: colors[Math.floor(Math.random() * colors.length)],
    a: 1,
  }));
  let t = 0;
  const tick = () => {
    t++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    parts.forEach((p) => {
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.a = Math.max(0, 1 - t / 70);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (t < 80) requestAnimationFrame(tick);
    else canvas.remove();
  };
  tick();
}
