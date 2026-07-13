/* Interactive particle network — hero background */
(function () {
  const canvas = document.getElementById('hero-network');
  if (!canvas) return;

  const section = canvas.closest('.hero');
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let particles = [];
  let globeNodes = [];
  let frameId = 0;
  let globeAngle = 0;

  const mouse = { x: 0, y: 0, active: false, tx: 0, ty: 0 };

  function themeColors() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    return light
      ? {
          dot: 'rgba(37, 99, 235, 0.68)',
          line: [37, 99, 235],
          glow: 'rgba(37, 99, 235, 0.1)',
        }
      : {
          dot: 'rgba(167, 139, 250, 0.85)',
          line: [139, 92, 246],
          glow: 'rgba(139, 92, 246, 0.14)',
        };
  }

  function lineColor(rgb, alpha) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
  }

  function particleCount() {
    const base = Math.floor((width * height) / 14000);
    return Math.max(55, Math.min(110, base));
  }

  function initParticles() {
    particles = Array.from({ length: particleCount() }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.4 + 0.8,
    }));

    globeNodes = [];
  }

  function resize() {
    const rect = section.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function projectGlobe(node, cx, cy, scale) {
    const a = node.theta + globeAngle * node.speed * 60;
    const x3 = Math.cos(a) * node.radius;
    const y3 = Math.sin(a) * Math.cos(node.tilt) * node.radius;
    const z3 = Math.sin(a) * Math.sin(node.tilt) * node.radius;
    const perspective = 1 / (1.4 - z3);
    return {
      x: cx + x3 * scale * perspective,
      y: cy + y3 * scale * perspective,
      z: z3,
      r: (1.2 + perspective * 0.8) * (0.7 + (z3 + 1) * 0.25),
    };
  }

  function draw() {
    const colors = themeColors();
    const connectDist = Math.min(160, width * 0.14);
    const mouseRadius = Math.min(200, width * 0.18);
    const cx = width * 0.52;
    const cy = height * 0.46;
    const globeScale = Math.min(width, height) * 0.42;

    ctx.clearRect(0, 0, width, height);

    const glowX = mouse.active ? mouse.tx : cx;
    const glowY = mouse.active ? mouse.ty : cy * 0.9;
    const grad = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.max(width, height) * 0.65);
    grad.addColorStop(0, colors.glow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (!reduced) {
      globeAngle += 0.003;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < mouseRadius) {
            const push = ((mouseRadius - dist) / mouseRadius) * 0.04;
            p.vx += (dx / dist) * push;
            p.vy += (dy / dist) * push;
          }
        }
        p.vx *= 0.992;
        p.vy *= 0.992;
      }
    }

    const projected = globeNodes.map((n) => projectGlobe(n, cx, cy, globeScale));

    for (let i = 0; i < projected.length; i++) {
      for (let j = i + 1; j < projected.length; j++) {
        const dx = projected[i].x - projected[j].x;
        const dy = projected[i].y - projected[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < globeScale * 0.22) {
          const depth = (projected[i].z + projected[j].z) * 0.5;
          const alpha = (1 - dist / (globeScale * 0.22)) * (0.08 + (depth + 1) * 0.12);
          ctx.strokeStyle = lineColor(colors.line, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(projected[i].x, projected[i].y);
          ctx.lineTo(projected[j].x, projected[j].y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);
        if (dist < connectDist) {
          const alpha = (1 - dist / connectDist) * 0.22;
          ctx.strokeStyle = lineColor(colors.line, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    if (mouse.active) {
      for (const p of particles) {
        const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dist < mouseRadius) {
          const alpha = (1 - dist / mouseRadius) * 0.45;
          ctx.strokeStyle = lineColor(colors.line, alpha);
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
      }
      const nearGlobe = projected
        .filter((n) => Math.hypot(n.x - mouse.x, n.y - mouse.y) < mouseRadius * 0.9)
        .slice(0, 12);
      for (const n of nearGlobe) {
        const dist = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        const alpha = (1 - dist / (mouseRadius * 0.9)) * 0.55;
        ctx.strokeStyle = lineColor(colors.line, alpha);
        ctx.beginPath();
        ctx.moveTo(mouse.x, mouse.y);
        ctx.lineTo(n.x, n.y);
        ctx.stroke();
      }
    }

    for (const n of projected) {
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = lineColor(colors.line, 0.15 + (n.z + 1) * 0.25);
      ctx.fill();
    }

    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = colors.dot;
      ctx.fill();
    }

    mouse.tx += (mouse.x - mouse.tx) * 0.08;
    mouse.ty += (mouse.y - mouse.ty) * 0.08;

    frameId = requestAnimationFrame(draw);
  }

  section.addEventListener('mousemove', (e) => {
    const rect = section.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  });

  section.addEventListener('mouseleave', () => {
    mouse.active = false;
  });

  window.addEventListener('resize', resize);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frameId);
    } else {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(draw);
    }
  });

  resize();
  frameId = requestAnimationFrame(draw);
})();
