import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntroSequenceProps {
  onComplete: () => void;
}

export const IntroSequence: React.FC<IntroSequenceProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Check if user has already seen the intro in this session or prefers reduced motion
    const hasSeenIntro = sessionStorage.getItem('kb_has_seen_intro');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (hasSeenIntro || prefersReducedMotion) {
      onComplete();
      return;
    }

    // Sequence stages
    const timer1 = setTimeout(() => setStep(1), 400);   // Energy ring & particle pulse
    const timer2 = setTimeout(() => setStep(2), 1100);  // Logo & brand reveal
    const timer3 = setTimeout(() => setStep(3), 1900);  // Dissolve to experience
    const timer4 = setTimeout(() => {
      sessionStorage.setItem('kb_has_seen_intro', 'true');
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  const handleSkip = () => {
    sessionStorage.setItem('kb_has_seen_intro', 'true');
    onComplete();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center select-none"
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-6 right-8 text-xs font-mono text-text-secondary hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] transition-colors"
        >
          Skip Intro [Esc]
        </button>

        {/* Central Orchestrated Visual */}
        <div className="relative flex flex-col items-center">
          {/* Faint Red Energy Ring */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0, rotate: -45 }}
            animate={{
              scale: step >= 1 ? [0.6, 1.05, 1] : 0.6,
              opacity: step >= 1 ? 0.8 : 0,
              rotate: step >= 1 ? 0 : -45,
            }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border border-crimson-500/40 shadow-[0_0_50px_rgba(230,57,70,0.35)] flex items-center justify-center"
          >
            {/* Inner pulsing orb */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{
                scale: step >= 1 ? [0.2, 1.2, 1] : 0.2,
                opacity: step >= 1 ? [0, 0.9, 0.6] : 0,
              }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-crimson-600 to-crimson-glow blur-sm"
            />
          </motion.div>

          {/* Logo Reveal */}
          <motion.div
            initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
            animate={{
              y: step >= 2 ? 0 : 20,
              opacity: step >= 2 ? 1 : 0,
              filter: step >= 2 ? 'blur(0px)' : 'blur(8px)',
            }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-crimson-500 shadow-[0_0_8px_#E63946]" />
              <span className="text-xs font-mono tracking-widest text-crimson-400 uppercase">
                Universal AI Memory Infrastructure
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              KNOWLEDGE <span className="text-crimson-500 text-glow-crimson">BRAIN</span>
            </h1>
          </motion.div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: step >= 2 ? 0.7 : 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xs text-text-secondary mt-3 font-mono"
          >
            Synchronizing agent neural state...
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

