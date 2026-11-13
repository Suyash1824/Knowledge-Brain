import React from 'react';
import { OrganicParticleCore } from './OrganicParticleCore';

interface IntelligenceCoreProps {
  onNodeClick?: (agentId?: string) => void;
}

export const IntelligenceCore: React.FC<IntelligenceCoreProps> = ({ onNodeClick }) => {
  return <OrganicParticleCore onNodeClick={() => onNodeClick && onNodeClick()} />;
};
