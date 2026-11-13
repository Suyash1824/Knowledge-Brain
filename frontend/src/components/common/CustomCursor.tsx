import React, { useEffect, useRef, useState } from 'react';

export const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  const [isHovered, setIsHovered] = useState(false);
  const [hoverType, setHoverType] = useState<'button' | 'card' | 'link' | 'earth' | 'interactive' | null>(null);
  const [isClicking, setIsClicking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check touch device or reduced motion
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isTouch || prefersReducedMotion) {
      setIsTouchDevice(true);
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isVisible) setIsVisible(true);

      // Dot follows immediately without lag for absolute responsiveness
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      setIsClicking(true);
      if (rippleRef.current) {
        rippleRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(0.8)`;
        rippleRef.current.style.opacity = '0.75';
        setTimeout(() => {
          if (rippleRef.current) {
            rippleRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%) scale(2.4)`;
            rippleRef.current.style.opacity = '0';
          }
        }, 15);
      }
    };

    const onMouseUp = () => {
      setIsClicking(false);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    // Smooth lerp loop for the trailing ring
    const render = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    // Dynamic hover detection for interactive elements
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest('button, a, input, textarea, select, [role="button"]');
      const card = target.closest('[data-cursor="card"], .glass-card, .interactive-card');
      const earth = target.closest('canvas, [data-cursor="earth"]');

      if (interactive) {
        setIsHovered(true);
        const tagName = interactive.tagName.toLowerCase();
        if (tagName === 'button' || interactive.getAttribute('role') === 'button') {
          setHoverType('button');
        } else if (tagName === 'a') {
          setHoverType('link');
        } else {
          setHoverType('interactive');
        }
      } else if (card) {
        setIsHovered(true);
        setHoverType('card');
      } else if (earth) {
        setIsHovered(true);
        setHoverType('earth');
      } else {
        setIsHovered(false);
        setHoverType(null);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseover', handleElementHover, { passive: true });

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseover', handleElementHover);
    };
  }, [isVisible]);

  if (isTouchDevice || !isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {/* Ripple Wave on Click */}
      <div
        ref={rippleRef}
        className="absolute top-0 left-0 w-8 h-8 rounded-full border border-crimson-glow transition-all duration-500 ease-out pointer-events-none"
        style={{ opacity: 0, transform: 'translate(-50%, -50%) scale(0)' }}
      />

      {/* Trailing Outer Ring */}
      <div
        ref={ringRef}
        className={`absolute top-0 left-0 rounded-full transition-[width,height,border-color,background-color] duration-200 ease-out will-change-transform ${
          isHovered
            ? hoverType === 'button'
              ? 'w-12 h-12 border-2 border-crimson-glow bg-crimson-500/10 shadow-[0_0_20px_rgba(230,57,70,0.4)]'
              : hoverType === 'card'
              ? 'w-16 h-16 border border-white/25 bg-white/[0.02]'
              : hoverType === 'earth'
              ? 'w-20 h-20 border border-crimson-400/50 bg-crimson-500/5 shadow-[0_0_25px_rgba(255,51,79,0.25)]'
              : 'w-10 h-10 border border-crimson-400/60 bg-crimson-500/5'
            : isClicking
            ? 'w-7 h-7 border border-crimson-500 bg-crimson-500/20'
            : 'w-8 h-8 border border-white/20'
        }`}
      />

      {/* Immediate Central Beacon Dot */}
      <div
        ref={dotRef}
        className={`absolute top-0 left-0 rounded-full transition-transform duration-100 ease-out will-change-transform ${
          isClicking
            ? 'w-1.5 h-1.5 bg-crimson-glow shadow-[0_0_8px_#FF334F]'
            : isHovered
            ? 'w-2 h-2 bg-crimson-500 shadow-[0_0_12px_#E63946]'
            : 'w-1.5 h-1.5 bg-crimson-500 shadow-[0_0_6px_#E63946]'
        }`}
      />
    </div>
  );
};
