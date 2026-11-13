import React, { useEffect, useRef } from 'react';

interface AntigravityParticle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  alpha: number;
  color: string;
  driftAngle: number;
  driftSpeed: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  speed: number;
}

export const ParticleCanvas: React.FC<{ density?: number }> = ({ density = 110 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', onResize);

    // Mouse tracking with raw pointer coordinates and velocity
    let mouseX = -1000;
    let mouseY = -1000;
    let prevMouseX = -1000;
    let prevMouseY = -1000;
    let mouseVelocityX = 0;
    let mouseVelocityY = 0;

    const shockwaves: Shockwave[] = [];

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      mouseVelocityX = mouseX - prevMouseX;
      mouseVelocityY = mouseY - prevMouseY;

      // Spawn a subtle shockwave when moving rapidly
      const speed = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);
      if (speed > 28 && shockwaves.length < 3) {
        shockwaves.push({
          x: mouseX,
          y: mouseY,
          radius: 10,
          maxRadius: 180,
          alpha: 0.35,
          speed: 6.5,
        });
      }

      prevMouseX = mouseX;
      prevMouseY = mouseY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 5,
        maxRadius: 260,
        alpha: 0.65,
        speed: 8.0,
      });
    };

    const handleMouseLeave = () => {
      mouseX = -1000;
      mouseY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Color palette matching Knowledge Brain / Antigravity reference
    const colorPalette = [
      'rgba(230, 57, 70, ',   // Signature Crimson (#E63946)
      'rgba(255, 51, 79, ',   // Crimson Glow (#FF334F)
      'rgba(255, 163, 177, ', // Light Crimson highlight
      'rgba(255, 255, 255, ', // Starlight White
      'rgba(101, 123, 255, ', // Subtle Technical Blue (#657BFF)
    ];

    const particles: AntigravityParticle[] = [];
    const count = Math.min(density, Math.floor((width * height) / 11000));

    for (let i = 0; i < count; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const isRed = Math.random() > 0.3;
      const color = isRed
        ? colorPalette[Math.floor(Math.random() * 3)]
        : colorPalette[Math.floor(Math.random() * 2) + 3];

      const baseAlpha = Math.random() * 0.4 + 0.2;

      particles.push({
        x,
        y,
        originX: x,
        originY: y,
        vx: 0,
        vy: 0,
        size: Math.random() * 2.2 + 0.9,
        baseAlpha,
        alpha: baseAlpha,
        color,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: Math.random() * 0.4 + 0.15,
      });
    }

    let isVisible = true;
    const onVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const INTERACTION_RADIUS = 260; // Increased radius for impressive visible response
    const SPRING_FACTOR = 0.028;
    const DAMPING = 0.86;

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Decay mouse velocity
      mouseVelocityX *= 0.88;
      mouseVelocityY *= 0.88;

      // Update and draw Shockwaves / Ripples
      for (let w = shockwaves.length - 1; w >= 0; w--) {
        const sw = shockwaves[w];
        sw.radius += sw.speed;
        sw.alpha *= 0.94;

        ctx.strokeStyle = `rgba(255, 51, 79, ${sw.alpha * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();

        if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(w, 1);
        }
      }

      // Update & Draw Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Natural ambient drift around origin
        p.driftAngle += 0.012 * p.driftSpeed;
        const driftX = Math.cos(p.driftAngle) * 16;
        const driftY = Math.sin(p.driftAngle) * 16;
        const targetX = p.originX + driftX;
        const targetY = p.originY + driftY;

        // 2. Cursor repulsion & velocity swirl
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INTERACTION_RADIUS && dist > 0) {
          const forceRatio = 1 - dist / INTERACTION_RADIUS;
          const force = forceRatio * 9.5; // Highly visible displacement
          const angle = Math.atan2(dy, dx);

          // Repulsion + swirl from cursor velocity
          p.vx += Math.cos(angle) * force * 0.8 + mouseVelocityX * 0.14;
          p.vy += Math.sin(angle) * force * 0.8 + mouseVelocityY * 0.14;

          // Tangential swirl
          p.vx += -Math.sin(angle) * mouseVelocityY * 0.05;
          p.vy += Math.cos(angle) * mouseVelocityX * 0.05;

          // Increase brightness surge near cursor
          p.alpha = Math.min(1, p.baseAlpha + forceRatio * 0.7);
        } else {
          p.alpha += (p.baseAlpha - p.alpha) * 0.06;
        }

        // Apply shockwave displacement
        for (let w = 0; w < shockwaves.length; w++) {
          const sw = shockwaves[w];
          const swdx = p.x - sw.x;
          const swdy = p.y - sw.y;
          const swdist = Math.sqrt(swdx * swdx + swdy * swdy);
          const diff = Math.abs(swdist - sw.radius);

          if (diff < 35 && swdist > 0) {
            const push = (1 - diff / 35) * sw.alpha * 6.0;
            p.vx += (swdx / swdist) * push;
            p.vy += (swdy / swdist) * push;
          }
        }

        // 3. Spring physics: pull gently back towards ambient target
        p.vx += (targetX - p.x) * SPRING_FACTOR;
        p.vy += (targetY - p.y) * SPRING_FACTOR;

        p.vx *= DAMPING;
        p.vy *= DAMPING;

        p.x += p.vx;
        p.y += p.vy;

        // 4. Draw particle with glowing aura
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // 5. Connect nearby particles close to cursor (synaptic light strands)
        if (dist < INTERACTION_RADIUS * 1.15) {
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const p2dx = p2.x - p.x;
            const p2dy = p2.y - p.y;
            const p2dist = Math.sqrt(p2dx * p2dx + p2dy * p2dy);

            if (p2dist < 95) {
              const lineAlpha = (1 - p2dist / 95) * 0.35 * Math.min(p.alpha, p2.alpha);
              ctx.strokeStyle = `rgba(255, 51, 79, ${lineAlpha})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-85"
    />
  );
};
