// assets/js/particle/particle-bg.js
(() => {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationFrameId = null;
  let shouldRun = window.innerWidth >= 768;

  function initCanvas() {
    canvas.width = Math.min(window.innerWidth, 1400);
    canvas.height = window.innerHeight;
    particles = [];

    const particleCount = window.innerWidth < 768 ? 10 : 24;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.6 + 0.8,
        speedY: Math.random() * -0.35 - 0.1,
        speedX: (Math.random() - 0.5) * 0.18,
        opacity: Math.random() * 0.45 + 0.2
      });
    }
  }

  function drawParticles() {
    if (!shouldRun) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const particleColor = isDarkMode ? '0, 245, 212' : '139, 92, 246';

    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${particleColor}, ${p.opacity})`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = `rgb(${particleColor})`;
      ctx.fill();

      p.y += p.speedY;
      p.x += p.speedX;

      if (p.y < 0) {
        p.y = canvas.height;
        p.x = Math.random() * canvas.width;
      }
    });

    animationFrameId = window.requestAnimationFrame(drawParticles);
  }

  function startParticles() {
    if (!shouldRun) {
      shouldRun = true;
    }
    if (animationFrameId) return;
    initCanvas();
    drawParticles();
  }

  function stopParticles() {
    shouldRun = false;
    if (animationFrameId) {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      stopParticles();
    } else {
      startParticles();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    } else {
      if (shouldRun && !animationFrameId) {
        drawParticles();
      }
    }
  });

  if (window.innerWidth >= 768) {
    startParticles();
  }
})();
