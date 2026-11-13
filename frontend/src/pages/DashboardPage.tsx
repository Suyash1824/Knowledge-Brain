import React, { useState } from 'react';
import { DashboardLayout, DashboardTabId } from '../components/dashboard/DashboardLayout';
import { OverviewTab } from '../components/dashboard/OverviewTab';
import { MemoryExplorerTab } from '../components/dashboard/MemoryExplorerTab';
import { MemoryCompilerTab } from '../components/dashboard/MemoryCompilerTab';
import { MemoryCapsulesTab } from '../components/dashboard/MemoryCapsulesTab';
import { AiAgentsTab } from '../components/dashboard/AiAgentsTab';
import { KnowledgeGraphTab } from '../components/dashboard/KnowledgeGraphTab';
import { ConflictCenterTab } from '../components/dashboard/ConflictCenterTab';
import { SecurityAuditTab } from '../components/dashboard/SecurityAuditTab';
import { SettingsTab } from '../components/dashboard/SettingsTab';
import { MemoryDetailDrawer } from '../components/dashboard/MemoryDetailDrawer';
import { CustomCursor } from '../components/common/CustomCursor';
import { Memory } from '../types';

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTabId>('overview');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  return (
    <div className="relative min-h-screen bg-[#07070A] text-text-primary selection:bg-crimson-500/30 selection:text-white">
      {/* Global Custom Cursor */}
      <CustomCursor />

      {/* Main Dashboard Layout */}
      <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'overview' && (
          <OverviewTab
            onNavigateTab={setActiveTab}
            onSelectMemory={(m) => setSelectedMemory(m)}
          />
        )}
        {activeTab === 'explorer' && (
          <MemoryExplorerTab onSelectMemory={(m) => setSelectedMemory(m)} />
        )}
        {activeTab === 'compiler' && <MemoryCompilerTab />}
        {activeTab === 'capsules' && <MemoryCapsulesTab />}
        {activeTab === 'agents' && <AiAgentsTab />}
        {activeTab === 'graph' && <KnowledgeGraphTab />}
        {activeTab === 'conflicts' && <ConflictCenterTab />}
        {activeTab === 'security' && <SecurityAuditTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </DashboardLayout>

      {/* Slide-over Memory Detail Drawer */}
      <MemoryDetailDrawer
        memory={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        onMemoryUpdated={() => {
          // Keep drawer open or refreshed
        }}
        onMemoryDeleted={() => setSelectedMemory(null)}
      />
    </div>
  );
};

