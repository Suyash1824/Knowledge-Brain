import React, { useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Brain, Cpu, Database, Layers, Share2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CustomCursor } from '../components/common/CustomCursor';
import { ParticleCanvas } from '../components/common/ParticleCanvas';
import { IntroSequence } from '../components/hero/IntroSequence';
import { OrganicParticleCore } from '../components/hero/OrganicParticleCore';
import { FloatingCard } from '../components/hero/FloatingCard';
import { HeroMetrics } from '../components/hero/HeroMetrics';

import { ProblemSection } from '../components/sections/ProblemSection';
import { HowItWorksSection } from '../components/sections/HowItWorksSection';
import { AgentEcosystemSection } from '../components/sections/AgentEcosystemSection';
import { CapabilitiesSection } from '../components/sections/CapabilitiesSection';
import { ArchitectureSection } from '../components/sections/ArchitectureSection';
import { LivePreviewSection } from '../components/sections/LivePreviewSection';
import { CtaSection } from '../components/sections/CtaSection';

export const LandingPage: React.FC = () => {
  const [introCompleted, setIntroCompleted] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const heroY = useTransform(scrollY, [0, 380], [0, -45]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-text-primary selection:bg-crimson-500/30 selection:text-white overflow-x-hidden">
      {/* Intro Animation Orchestrator */}
      {!introCompleted && <IntroSequence onComplete={() => setIntroCompleted(true)} />}

      {/* Global Interactive Custom Cursor System */}
      <CustomCursor />

      {/* Upgraded Antigravity-Inspired Interactive Background Particles */}
      <ParticleCanvas density={110} />

      {/* Top Floating Navbar */}
      <Navbar />

      {/* HERO SECTION — CINEMATIC LIVING INTELLIGENCE CORE */}
      <section
        id="hero"
        className="relative pt-16 sm:pt-20 md:pt-24 pb-6 overflow-hidden min-h-[94vh] lg:min-h-screen flex flex-col justify-between"
      >
        {/* Subtle Ambient Background Radial Glow behind Hero */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] lg:w-[1200px] h-[700px] bg-radial-crimson pointer-events-none z-0" />

        <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 flex flex-col items-center">
          {/* Hero Typography & CTAs (Floating on Top with subtle scroll transition) */}
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="text-center max-w-4xl mx-auto relative z-30 pointer-events-auto"
          >
            {/* Pill Label */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-crimson-500/10 border border-crimson-500/25 text-crimson-300 text-xs font-mono mb-3.5 shadow-crimson-subtle backdrop-blur-md"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-crimson-400 animate-pulse" />
              <span>UNIVERSAL AI MEMORY INFRASTRUCTURE</span>
            </motion.div>

            {/* Signature Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white mb-3.5 leading-[1.12]"
            >
              Your AI Agents Change. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-500 via-crimson-glow to-crimson-400 text-glow-crimson">
                Their Memory Doesn't.
              </span>
            </motion.h1>

            {/* Supporting Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xs sm:text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed mb-5"
            >
              A persistent intelligence layer that connects your AI agents, preserves important knowledge and allows work to continue across independent sessions.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5"
            >
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-crimson-600 to-crimson-glow hover:from-crimson-500 hover:to-crimson-400 transition-all duration-300 shadow-crimson-glow hover:shadow-crimson-strong group cursor-pointer"
              >
                <span>Explore Knowledge Brain</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-text-secondary hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors backdrop-blur-md"
              >
                <span>Open Dashboard</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Central 3D Volumetric Living Intelligence Core Rising Behind Heading & CTAs */}
          <div className="relative w-full max-w-[1440px] mx-auto -mt-20 sm:-mt-28 md:-mt-36 lg:-mt-44 xl:-mt-48 z-10">
            {/* Card 1: Memory Intelligence (Top-Left Flank) */}
            <FloatingCard
              title="Memory Intelligence"
              subtitle="Semantic retrieval & 5 cognitive facets"
              bullets={['Facts', 'Decisions', 'Tasks', 'Preferences', 'Experiences']}
              icon={Brain}
              badgeText="FACET CLASSIFIER"
              floatAnimation="animate-float-slow"
              positionClasses="hidden lg:block top-20 xl:top-28 left-2 lg:left-6 xl:left-12"
            />

            {/* Card 2: Agent Continuity (Bottom-Left Flank) */}
            <FloatingCard
              title="Agent Continuity"
              subtitle="Cursor & Antigravity handovers"
              bullets={['Zero-copy memory', 'Stdio JSON-RPC', 'ACL permissions']}
              icon={Cpu}
              badgeText="MCP PROTOCOL"
              floatAnimation="animate-float-delayed"
              positionClasses="hidden lg:block bottom-12 xl:bottom-16 left-2 lg:left-6 xl:left-12"
            />

            {/* Central 3D Volumetric Living Intelligence Core (Image 2 Exact Recreation) */}
            <OrganicParticleCore />

            {/* Card 3: Memory Capsules (Top-Right Flank) */}
            <FloatingCard
              title="Memory Capsules"
              subtitle="Dense, token-budgeted context"
              bullets={['<1500 Tokens/Capsule', 'Multi-factor ranking', 'Passive data wrap']}
              icon={Layers}
              badgeText="CONTEXT COMPILER"
              floatAnimation="animate-float-delayed"
              positionClasses="hidden lg:block top-20 xl:top-28 right-2 lg:right-6 xl:right-12"
            />

            {/* Card 4: Knowledge Graph (Bottom-Right Flank) */}
            <FloatingCard
              title="Knowledge Graph"
              subtitle="Memory relationships & DAG checks"
              bullets={['Strict cycle rejection', 'Updates links', 'Conflict detection']}
              icon={Share2}
              badgeText="pgvector HNSW"
              floatAnimation="animate-float-slow"
              positionClasses="hidden lg:block bottom-12 xl:bottom-16 right-2 lg:right-6 xl:right-12"
            />
          </div>

          {/* Bottom Telemetry Metrics Pill Bar */}
          <div className="w-full relative z-30 mt-1 sm:mt-2">
            <HeroMetrics />
          </div>
        </div>
      </section>

      {/* SECTION 2: THE PROBLEM */}
      <ProblemSection />

      {/* SECTION 3: HOW IT WORKS */}
      <HowItWorksSection />

      {/* SECTION 4: AGENT ECOSYSTEM */}
      <AgentEcosystemSection />

      {/* SECTION 5: CORE CAPABILITIES */}
      <CapabilitiesSection />

      {/* SECTION 6: ARCHITECTURE */}
      <ArchitectureSection />

      {/* SECTION 7: LIVE INFRASTRUCTURE PREVIEW */}
      <LivePreviewSection />

      {/* SECTION 8: FINAL CTA */}
      <CtaSection />

      {/* FOOTER */}
      <Footer />
    </div>
  );
};
