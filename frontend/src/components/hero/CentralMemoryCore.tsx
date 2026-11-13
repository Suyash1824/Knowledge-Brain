import React from 'react';
import { OrganicParticleCore } from './OrganicParticleCore';

interface CentralMemoryCoreProps {
  onNodeClick?: (facetOrAgent?: string) => void;
}

export const CentralMemoryCore: React.FC<CentralMemoryCoreProps> = ({ onNodeClick }) => {
  return <OrganicParticleCore onNodeClick={() => onNodeClick && onNodeClick()} />;
};
