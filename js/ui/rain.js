/** City rain behind the deck and the hub. Stops when the visitor asks for less motion. */

export function startRain(canvas) {
  if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ctx = canvas.getContext('2d');
  const drops = Array.from({ length: 110 }, () => drop());
  const windows = Array.from({ length: 28 }, () => ({
    x: Math.random(),
    w: 0.012 + Math.random() * 0.02,
    h: 0.08 + Math.random() * 0.22,
    hue: Math.random() < 0.72 ? 'rgba(20, 226, 255, 0.16)' : 'rgba(255, 43, 214, 0.14)',
    blink: 40 + Math.random() * 180
  }));

  function drop() {
    return {
      x: Math.random(),
      y: Math.random(),
      z: 0.35 + Math.random() * 0.65,
      v: 0.55 + Math.random() * 1.1
    };
  }

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function frame(t) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const ground = h - 130;
    windows.forEach((win, i) => {
      const on = Math.floor(t / win.blink + i) % 7 !== 0;
      if (!on) return;
      ctx.fillStyle = win.hue;
      ctx.fillRect(win.x * w, ground - win.h * 110, Math.max(6, win.w * w), win.h * 110);
    });

    drops.forEach((d) => {
      d.y += 0.008 * d.v * (0.45 + d.z);
      if (d.y > 1.05) {
        d.y = -0.08;
        d.x = Math.random();
      }
      const x = d.x * w;
      const y = d.y * h;
      ctx.strokeStyle = d.z > 0.78 ? 'rgba(20, 226, 255, 0.45)' : 'rgba(190, 220, 255, 0.22)';
      ctx.lineWidth = d.z > 0.8 ? 1.6 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 2 * d.z, y + 16 * d.z);
      ctx.stroke();
    });
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
}
