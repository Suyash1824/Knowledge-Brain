import React from 'react';
import { OrganicParticleCore } from './OrganicParticleCore';

interface HeroMemoryCoreProps {
  onNodeClick?: () => void;
}

export const HeroMemoryCore: React.FC<HeroMemoryCoreProps> = ({ onNodeClick }) => {
  return <OrganicParticleCore onNodeClick={onNodeClick} />;
};
