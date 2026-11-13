import React, { useState } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { OverviewTab } from './components/overview/OverviewTab';
import { HierarchyTab } from './components/hierarchy/HierarchyTab';
import { IngestTab } from './components/ingest/IngestTab';
import { RetrievalTab } from './components/retrieval/RetrievalTab';
import { KnowledgeGraphTab } from './components/graph/KnowledgeGraphTab';
import { ConflictTab } from './components/conflicts/ConflictTab';
import { AuditTab } from './components/audit/AuditTab';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [currentAgent, setCurrentAgent] = useState('antigravity-ai');
  const [hierarchyInitialLevel, setHierarchyInitialLevel] = useState<number | undefined>(undefined);

  const handleNavigateToHierarchy = (level?: number) => {
    setHierarchyInitialLevel(level);
    setActiveTab('hierarchy');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Telemetry Navigation Header */}
      <Navbar currentAgent={currentAgent} onSelectAgent={setCurrentAgent} />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={(tab) => {
          if (tab !== 'hierarchy') {
            setHierarchyInitialLevel(undefined);
          }
          setActiveTab(tab);
        }} />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/40">
          {activeTab === 'overview' && (
            <OverviewTab onNavigateToHierarchy={handleNavigateToHierarchy} />
          )}
          {activeTab === 'hierarchy' && (
            <HierarchyTab initialLevel={hierarchyInitialLevel} />
          )}
          {activeTab === 'ingest' && <IngestTab />}
          {activeTab === 'retrieval' && <RetrievalTab />}
          {activeTab === 'graph' && <KnowledgeGraphTab />}
          {activeTab === 'conflicts' && <ConflictTab />}
          {activeTab === 'audit' && <AuditTab />}
        </main>
      </div>
    </div>
  );
}

export default App;
