import React, { useRef, useState } from 'react';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

interface FloatingCardProps {
  title: string;
  subtitle: string;
  bullets?: string[];
  icon: LucideIcon;
  positionClasses: string;
  floatAnimation?: string;
  badgeText?: string;
  onClick?: () => void;
}

export const FloatingCard: React.FC<FloatingCardProps> = ({
  title,
  subtitle,
  bullets,
  icon: Icon,
  positionClasses,
  floatAnimation = 'animate-float-slow',
  badgeText,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -8;
    const rotY = ((x - centerX) / centerX) * 8;

    setRotateX(rotX);
    setRotateY(rotY);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div className={`absolute z-20 pointer-events-auto ${positionClasses} ${floatAnimation}`}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        data-cursor="card"
        style={{
          transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
          transition: 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease-out, border-color 0.25s ease-out',
        }}
        className="w-[260px] md:w-[280px] p-4.5 rounded-2xl glass-card border border-white/10 hover:border-crimson-500/50 shadow-card-elevated hover:shadow-crimson-glow cursor-pointer group will-change-transform"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-text-primary group-hover:text-crimson-400 group-hover:border-crimson-500/40 group-hover:scale-105 transition-all duration-300">
            <Icon className="w-4.5 h-4.5" />
          </div>
          {badgeText ? (
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-crimson-500/15 border border-crimson-500/30 text-crimson-300">
              {badgeText}
            </span>
          ) : (
            <div className="w-6 h-6 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center text-text-secondary group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <h3 className="text-sm font-semibold text-text-primary tracking-tight group-hover:text-white transition-colors mb-1">
          {title}
        </h3>
        <p className="text-xs text-text-secondary leading-relaxed mb-2.5">
          {subtitle}
        </p>

        {bullets && bullets.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-1.5">
            {bullets.map((b, idx) => (
              <span
                key={idx}
                className="text-[10px] text-text-secondary/90 bg-white/[0.03] px-2 py-0.5 rounded-md border border-white/[0.04]"
              >
                • {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
