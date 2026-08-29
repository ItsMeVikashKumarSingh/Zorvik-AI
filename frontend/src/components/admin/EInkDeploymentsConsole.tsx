import React, { useState, useEffect } from 'react';
import {
  ChevronsUpDown,
  Search,
  ArrowUpRight,
  Filter,
  RotateCw,
  Check,
} from 'lucide-react';

interface EInkDeploymentsConsoleProps {
  onSwitchTab?: (tab: string) => void;
}

// Semantic Ink Status Glyphs (Strictly Monochrome + Single Red for Failed)
const InkStatusGlyph: React.FC<{ status: 'ready' | 'building' | 'queued' | 'canceled' | 'failed' }> = ({ status }) => {
  if (status === 'ready') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Ready">
        <circle cx="6" cy="6" r="5" fill="#141310" />
      </svg>
    );
  }
  if (status === 'building') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0 animate-pulse" aria-label="Building">
        <circle cx="6" cy="6" r="4.5" stroke="#141310" strokeWidth="1.5" fill="none" />
        <path d="M 6 1.5 A 4.5 4.5 0 0 1 6 10.5 Z" fill="#141310" />
      </svg>
    );
  }
  if (status === 'queued') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Queued">
        <circle cx="6" cy="6" r="4.5" stroke="#141310" strokeWidth="1.5" fill="none" />
      </svg>
    );
  }
  if (status === 'canceled') {
    return (
      <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Canceled">
        <circle cx="6" cy="6" r="4.5" stroke="rgba(20,19,16,0.42)" strokeWidth="1.5" strokeDasharray="2.5 2" fill="none" />
      </svg>
    );
  }
  // Failed = The ONLY Chroma on the Page (#c8321e)
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0" aria-label="Failed">
      <circle cx="6" cy="6" r="5" fill="#c8321e" />
      <path d="M 4 4 L 8 8 M 8 4 L 4 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};

export const EInkDeploymentsConsole: React.FC<EInkDeploymentsConsoleProps> = ({ onSwitchTab }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'production' | 'preview'>('all');
  const [buildingSeconds, setBuildingSeconds] = useState(68); // 1m 08s
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Live timer tick for active building item
  useEffect(() => {
    const timer = setInterval(() => {
      setBuildingSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins}m ${remainder < 10 ? '0' : ''}${remainder}s`;
  };

  const DEPLOYMENTS = [
    {
      id: 'dpl_c71a09e',
      status: 'building' as const,
      branch: 'feat/e-ink-console',
      commitMsg: 'feat: add e-ink monochrome telemetry & deployment view',
      commitHash: 'b91c84f',
      env: 'Preview',
      duration: formatElapsed(buildingSeconds),
      age: 'Just now',
      author: 'TM',
      authorName: 'Tim Marsh',
    },
    {
      id: 'dpl_9f2c41a',
      status: 'ready' as const,
      branch: 'main',
      commitMsg: 'fix: canvas zoom-to-fit on nested frames',
      commitHash: 'a41f9e2',
      env: 'Production',
      duration: '2m 41s',
      age: '18m ago',
      author: 'TM',
      authorName: 'Tim Marsh',
    },
    {
      id: 'dpl_4b7d90e',
      status: 'failed' as const,
      branch: 'fix/svg-export',
      commitMsg: 'fix(export): resolve missing viewBox bounding box',
      commitHash: '8e192f1',
      env: 'Preview',
      duration: '1m 14s',
      age: '1h ago',
      author: 'bot',
      authorName: 'bot',
      errorNote: 'exit 1 - build',
    },
    {
      id: 'dpl_3a91b2c',
      status: 'ready' as const,
      branch: 'main',
      commitMsg: 'perf: debounce live sandbox iframe re-renders',
      commitHash: '72ca910',
      env: 'Production',
      duration: '2m 38s',
      age: '3h ago',
      author: 'TM',
      authorName: 'Tim Marsh',
    },
    {
      id: 'dpl_88b1f41',
      status: 'ready' as const,
      branch: 'feat/prompt-search',
      commitMsg: 'feat: add fuzzy search filter to blueprint library',
      commitHash: '5e09aa1',
      env: 'Preview',
      duration: '1m 55s',
      age: '5h ago',
      author: 'TM',
      authorName: 'Tim Marsh',
    },
    {
      id: 'dpl_1190c8a',
      status: 'queued' as const,
      branch: 'refactor/token-meter',
      commitMsg: 'refactor: streamline model token counter hook',
      commitHash: '31f008e',
      env: 'Preview',
      duration: '--',
      age: '6h ago',
      author: 'TM',
      authorName: 'Tim Marsh',
    },
    {
      id: 'dpl_07f339d',
      status: 'canceled' as const,
      branch: 'exp/wasm-compiler',
      commitMsg: 'exp: test clang wasm compiler memory threshold',
      commitHash: '20c19b4',
      env: 'Preview',
      duration: '42s',
      age: '1d ago',
      author: 'TM',
      authorName: 'Tim Marsh',
    },
    {
      id: 'dpl_6c029aa',
      status: 'ready' as const,
      branch: 'main',
      commitMsg: 'chore: bump runtime deps & update security rules',
      commitHash: '11e400a',
      env: 'Production',
      duration: '2m 29s',
      age: '2d ago',
      author: 'bot',
      authorName: 'bot',
    },
  ];

  const filteredDeployments = DEPLOYMENTS.filter((d) => {
    if (filterMode === 'production' && d.env !== 'Production') return false;
    if (filterMode === 'preview' && d.env !== 'Preview') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.id.toLowerCase().includes(q) ||
        d.branch.toLowerCase().includes(q) ||
        d.commitMsg.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const copyDeployId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#141310] font-['IBM_Plex_Sans',sans-serif] flex flex-col lg:flex-row antialiased selection:bg-[#141310] selection:text-[#f4f1ea]">
      {/* ========================================================================= */}
      {/* 1. FIXED ~240px PAPER SIDEBAR                                              */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-[240px] bg-[#faf8f3] border-b lg:border-b-0 lg:border-r border-[rgba(20,19,16,0.14)] flex flex-col justify-between shrink-0 select-none">
        <div>
          {/* Workspace Switcher */}
          <div className="p-3 border-b border-[rgba(20,19,16,0.14)]">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-[rgba(20,19,16,0.04)] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded border border-[#141310] flex items-center justify-center font-['IBM_Plex_Mono',monospace] text-[11px] font-semibold text-[#141310] shrink-0">
                  SD
                </div>
                <div className="truncate">
                  <div className="text-xs font-semibold text-[#141310] truncate">Superdesign</div>
                  <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] truncate">
                    canvas-app
                  </div>
                </div>
              </div>
              <ChevronsUpDown size={14} className="text-[rgba(20,19,16,0.42)] shrink-0 ml-1" />
            </div>
          </div>

          {/* Search Row */}
          <div className="px-3 pt-3 pb-2">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-[rgba(20,19,16,0.42)]" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] rounded pl-8 pr-12 py-1.5 text-xs text-[#141310] placeholder-[rgba(20,19,16,0.42)] outline-none focus:border-[#141310] transition-colors"
              />
              <span className="absolute right-2 text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] border border-[rgba(20,19,16,0.14)] px-1 rounded bg-[#faf8f3]">
                ⌘K
              </span>
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="py-2 space-y-0.5">
            <button
              onClick={() => onSwitchTab && onSwitchTab('overview')}
              className="w-full relative flex items-center px-4 py-2 text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] text-left transition-colors"
            >
              <span>Overview</span>
            </button>

            <button
              className="w-full relative flex items-center px-4 py-2 text-xs font-semibold text-[#141310] bg-[rgba(20,19,16,0.04)] text-left transition-colors"
            >
              {/* 3px Solid-Ink Left Rule */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#141310]" />
              <span>Deployments</span>
            </button>

            <button
              onClick={() => onSwitchTab && onSwitchTab('openrouter')}
              className="w-full relative flex items-center px-4 py-2 text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] text-left transition-colors"
            >
              <span>OpenRouter Matrix</span>
            </button>

            <button
              onClick={() => onSwitchTab && onSwitchTab('keys')}
              className="w-full relative flex items-center px-4 py-2 text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] text-left transition-colors"
            >
              <span>Key Vault & Engines</span>
            </button>

            <button
              onClick={() => onSwitchTab && onSwitchTab('circuit')}
              className="w-full relative flex items-center px-4 py-2 text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] text-left transition-colors"
            >
              <span>Circuit Breaker</span>
            </button>

            <button
              onClick={() => onSwitchTab && onSwitchTab('audit')}
              className="w-full relative flex items-center px-4 py-2 text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] text-left transition-colors"
            >
              <span>Audit Logs</span>
            </button>
          </nav>

          {/* Environments Section */}
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] mb-2 font-['IBM_Plex_Sans',sans-serif]">
              ENVIRONMENTS
            </div>
            <div className="space-y-1.5">
              <div
                onClick={() => setFilterMode('production')}
                className="flex items-center justify-between text-xs py-1 text-[rgba(20,19,16,0.62)] hover:text-[#141310] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <InkStatusGlyph status="ready" />
                  <span className={filterMode === 'production' ? 'font-semibold text-[#141310]' : ''}>Production</span>
                </div>
                <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">main</span>
              </div>

              <div
                onClick={() => setFilterMode('preview')}
                className="flex items-center justify-between text-xs py-1 text-[rgba(20,19,16,0.62)] hover:text-[#141310] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <InkStatusGlyph status="building" />
                  <span className={filterMode === 'preview' ? 'font-semibold text-[#141310]' : ''}>Preview</span>
                </div>
                <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">6 active</span>
              </div>

              <div
                onClick={() => setFilterMode('all')}
                className="flex items-center justify-between text-xs py-1 text-[rgba(20,19,16,0.62)] hover:text-[#141310] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <InkStatusGlyph status="queued" />
                  <span className={filterMode === 'all' ? 'font-semibold text-[#141310]' : ''}>dev</span>
                </div>
                <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">local</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pinned Bottom Block: Build Minutes Usage & User Row */}
        <div className="p-3 border-t border-[rgba(20,19,16,0.14)] space-y-3">
          {/* Usage Meter Card */}
          <div className="p-2.5 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-xs font-medium text-[#141310]">Build minutes</span>
              <span className="text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">412/600</span>
            </div>
            {/* 4px-tall solid-ink progress bar */}
            <div className="w-full h-1 rounded-full bg-[rgba(20,19,16,0.14)] overflow-hidden">
              <div className="h-full bg-[#141310]" style={{ width: '68.6%' }} />
            </div>
          </div>

          {/* User Row */}
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 rounded border border-[rgba(20,19,16,0.25)] bg-[#faf8f3] flex items-center justify-center font-['IBM_Plex_Mono',monospace] text-[10px] font-semibold text-[#141310]">
              TM
            </div>
            <div className="min-w-0 flex-1 truncate">
              <div className="text-xs font-medium text-[#141310] leading-none">Tim Marsh</div>
              <div className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] mt-0.5">
                @tim
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT STACK                                                     */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Header Bar (~52px) */}
        <header className="min-h-[52px] px-6 border-b border-[rgba(20,19,16,0.14)] bg-[#faf8f3] flex flex-wrap items-center justify-between gap-4 select-none">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)]">canvas-app</span>
            <span className="text-[rgba(20,19,16,0.25)]">/</span>
            <span className="font-semibold text-[#141310]">Deployments</span>
          </div>

          {/* Joined Segmented Control */}
          <div className="inline-flex rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
                filterMode === 'all'
                  ? 'bg-[#141310] text-[#faf8f3]'
                  : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('production')}
              className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
                filterMode === 'production'
                  ? 'bg-[#141310] text-[#faf8f3]'
                  : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
              }`}
            >
              Production
            </button>
            <button
              onClick={() => setFilterMode('preview')}
              className={`px-3 py-1 rounded text-xs transition-colors font-medium ${
                filterMode === 'preview'
                  ? 'bg-[#141310] text-[#faf8f3]'
                  : 'text-[rgba(20,19,16,0.62)] hover:text-[#141310]'
              }`}
            >
              Preview
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] hover:bg-[rgba(20,19,16,0.03)] transition-colors font-medium"
            >
              <Filter size={12} />
              <span>Filter</span>
            </button>

            <button
              type="button"
              className="px-4 py-1.5 rounded bg-[#141310] text-[#faf8f3] text-xs font-medium hover:bg-[rgba(20,19,16,0.85)] active:scale-[0.98] transition-all shadow-none"
            >
              Deploy
            </button>
          </div>
        </header>

        {/* Content Container */}
        <div className="p-6 max-w-7xl w-full mx-auto space-y-6">
          {/* ========================================================================= */}
          {/* 3. CURRENT PRODUCTION HERO CARD WITH PIPELINE STRIP                       */}
          {/* ========================================================================= */}
          <div
            className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] p-6 relative overflow-hidden"
            style={{
              backgroundImage: 'radial-gradient(rgba(20,19,16,0.05) 0.5px, transparent 0.5px)',
              backgroundSize: '4px 4px',
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Left Block */}
              <div className="lg:col-span-6 space-y-3">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  CURRENT PRODUCTION
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <InkStatusGlyph status="ready" />
                    <span className="text-sm font-semibold text-[#141310]">Ready</span>
                  </div>
                  <span className="text-[rgba(20,19,16,0.25)]">|</span>
                  <button
                    onClick={() => copyDeployId('dpl_9f2c41a')}
                    className="font-['IBM_Plex_Mono',monospace] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors"
                  >
                    dpl_9f2c41a
                  </button>
                  {copiedId === 'dpl_9f2c41a' && (
                    <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[#141310] flex items-center gap-0.5">
                      <Check size={10} /> Copied
                    </span>
                  )}
                </div>

                <div>
                  <a
                    href="https://canvas.superdesign.dev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-['IBM_Plex_Mono',monospace] text-sm text-[#141310] underline underline-offset-4 decoration-[rgba(20,19,16,0.3)] hover:decoration-[#141310] transition-all font-medium"
                  >
                    <span>canvas.superdesign.dev</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] text-xs font-['IBM_Plex_Mono',monospace] text-[#141310]">
                  <span>a41f9e2 - fix: canvas zoom-to-fit on nested frames</span>
                </div>

                <div className="text-xs font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                  main · 2m 41s · 18 min ago by tim
                </div>
              </div>

              {/* Right Block: 4-Stage Pipeline Strip */}
              <div className="lg:col-span-6 bg-[#faf8f3]/80 p-4 rounded border border-[rgba(20,19,16,0.10)] space-y-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                  PIPELINE EXECUTION
                </div>

                {/* Pipeline Rail with 4 Stages */}
                <div className="relative pt-2 pb-1">
                  {/* Centerline Rail */}
                  <div className="absolute top-[14px] left-4 right-4 h-[1px] bg-[rgba(20,19,16,0.14)]" />

                  <div className="grid grid-cols-4 gap-2 relative z-10 text-center">
                    {/* Stage 1: Build */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#141310] ring-4 ring-[#faf8f3]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#141310] mt-2">
                        BUILD
                      </span>
                      <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] mt-0.5">
                        48s
                      </span>
                    </div>

                    {/* Stage 2: Test */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#141310] ring-4 ring-[#faf8f3]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#141310] mt-2">
                        TEST
                      </span>
                      <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] mt-0.5">
                        1m 12s
                      </span>
                    </div>

                    {/* Stage 3: Bundle */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#141310] ring-4 ring-[#faf8f3]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#141310] mt-2">
                        BUNDLE
                      </span>
                      <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] mt-0.5">
                        22s
                      </span>
                    </div>

                    {/* Stage 4: Deploy */}
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[#141310] ring-4 ring-[#faf8f3]" />
                      <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#141310] mt-2">
                        DEPLOY
                      </span>
                      <span className="text-[10px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] mt-0.5">
                        19s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right text-xs font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.62)] pt-1 border-t border-[rgba(20,19,16,0.08)]">
                  4/4 stages · total 2m 41s
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. DENSE DEPLOYMENTS TABLE                                                */}
          {/* ========================================================================= */}
          <div className="rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] overflow-hidden">
            <div className="overflow-x-auto min-w-[850px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[rgba(20,19,16,0.14)] bg-[#f4f1ea]/60">
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] w-20">
                      STATUS
                    </th>
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                      DEPLOYMENT
                    </th>
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                      BRANCH · COMMIT
                    </th>
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                      ENVIRONMENT
                    </th>
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] text-right">
                      DURATION
                    </th>
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] font-['IBM_Plex_Mono',monospace] text-right">
                      AGE
                    </th>
                    <th className="py-2.5 px-4 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] text-right">
                      AUTHOR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(20,19,16,0.14)] text-xs">
                  {filteredDeployments.map((d) => {
                    const isFailed = d.status === 'failed';
                    return (
                      <tr
                        key={d.id}
                        className={`hover:bg-[rgba(20,19,16,0.02)] transition-colors h-[44px] ${
                          isFailed ? 'bg-[#c8321e]/[0.02]' : ''
                        }`}
                      >
                        {/* Status */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <InkStatusGlyph status={d.status} />
                            <span className={`capitalize ${isFailed ? 'text-[#c8321e] font-medium' : 'text-[#141310]'}`}>
                              {d.status}
                            </span>
                          </div>
                        </td>

                        {/* Deployment ID & Link */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyDeployId(d.id)}
                              className={`font-['IBM_Plex_Mono',monospace] hover:underline ${
                                isFailed ? 'text-[#c8321e] font-medium' : 'text-[#141310]'
                              }`}
                            >
                              {d.id}
                            </button>
                            {isFailed && (
                              <span className="font-['IBM_Plex_Mono',monospace] text-[10.5px] text-[#c8321e] font-semibold px-1.5 py-0.5 rounded border border-[#c8321e]/30 bg-[#c8321e]/10">
                                {d.errorNote}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Branch & Commit */}
                        <td className="py-2.5 px-4 min-w-[260px]">
                          <div className="flex items-center gap-2">
                            <span className="font-['IBM_Plex_Mono',monospace] text-[11px] px-1.5 py-0.5 rounded border border-[rgba(20,19,16,0.14)] bg-[#f4f1ea] shrink-0">
                              {d.branch}
                            </span>
                            <span className="truncate max-w-[240px] text-[rgba(20,19,16,0.75)]">
                              {d.commitMsg}
                            </span>
                          </div>
                        </td>

                        {/* Environment */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-[rgba(20,19,16,0.62)]">
                          {d.env}
                        </td>

                        {/* Duration */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.75)]">
                          {d.duration}
                        </td>

                        {/* Age */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-right font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                          {d.age}
                        </td>

                        {/* Author */}
                        <td className="py-2.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isFailed && (
                              <button
                                type="button"
                                className="text-xs text-[#c8321e] font-semibold hover:underline mr-1"
                              >
                                Redeploy
                              </button>
                            )}
                            <div className="w-5 h-5 rounded border border-[rgba(20,19,16,0.20)] bg-[#f4f1ea] flex items-center justify-center font-['IBM_Plex_Mono',monospace] text-[9.5px] font-semibold text-[#141310]">
                              {d.author === 'bot' ? <em>b</em> : d.author}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. BOTTOM SPLIT: LAST FAILED BUILD LOG & 14-DAY BAR CHART                 */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Card 1: Last Failed Build Log Excerpt */}
            <div className="lg:col-span-7 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[rgba(20,19,16,0.14)]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)]">
                      LAST FAILED BUILD
                    </span>
                    <span className="text-[rgba(20,19,16,0.25)]">|</span>
                    <span className="font-['IBM_Plex_Mono',monospace] text-xs text-[#c8321e] font-medium">
                      dpl_4b7d90e
                    </span>
                  </div>

                  <button
                    type="button"
                    className="flex items-center gap-1 px-2 py-0.5 rounded border border-[rgba(20,19,16,0.14)] text-xs text-[rgba(20,19,16,0.62)] hover:text-[#141310] transition-colors"
                  >
                    <RotateCw size={11} />
                    <span>Re-run</span>
                  </button>
                </div>

                {/* Log Terminal Block on #f4f1ea with red error lines */}
                <div className="p-3.5 rounded bg-[#f4f1ea] border border-[rgba(20,19,16,0.14)] font-['IBM_Plex_Mono',monospace] text-[11.5px] leading-[1.6] overflow-x-auto whitespace-pre">
                  <div className="text-[rgba(20,19,16,0.42)]">[10:41:02] info  cloning repository git@github.com:superdesign/canvas-app.git</div>
                  <div className="text-[rgba(20,19,16,0.42)]">[10:41:04] info  checked out commit 8e192f1 (branch fix/svg-export)</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[10:41:08] info  restoring dependency cache from 14 modules</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[10:41:22] info  running build script (tsc && vite build)</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[10:41:35] info  transforming 2,048 modules...</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[10:41:58] info  typecheck passed across 89 files</div>
                  <div className="text-[rgba(20,19,16,0.62)]">[10:42:10] info  bundling static canvas assets</div>
                  {/* Last Two Lines in Signal Red */}
                  <div className="text-[#c8321e] font-semibold">[10:42:15] error Cannot find module &#39;@superdesign/svg-bbox-engine&#39;</div>
                  <div className="text-[#c8321e] font-semibold">[10:42:16] error build failed with exit code 1</div>
                </div>
              </div>

              <div className="mt-3 pt-2 text-right text-[11px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)]">
                duration 1m 14s · exit code 1
              </div>
            </div>

            {/* Card 2: Deploys Last 14 Days Stepped Ink Bar Chart */}
            <div className="lg:col-span-5 rounded-lg bg-[#faf8f3] border border-[rgba(20,19,16,0.14)] p-5 flex flex-col justify-between">
              <div>
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[rgba(20,19,16,0.42)] pb-3 mb-3 border-b border-[rgba(20,19,16,0.14)]">
                  DEPLOYS · LAST 14 DAYS
                </div>

                {/* 14 Vertical Solid-Ink Bars */}
                <div className="h-[120px] flex items-end justify-between gap-1.5 px-2 pt-4">
                  {[42, 28, 55, 70, 35, 80, 65, 48, 92, 74, 60, 85, 30, 95].map((heightPct, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                      <div
                        className="w-full max-w-[10px] bg-[#141310] rounded-t-sm transition-all group-hover:opacity-75"
                        style={{ height: `${heightPct}%` }}
                        title={`Day ${idx + 1}: ${Math.round(heightPct / 10)} deploys`}
                      />
                    </div>
                  ))}
                </div>

                {/* 1px Hairline Baseline */}
                <div className="w-full h-[1px] bg-[rgba(20,19,16,0.14)] mt-1" />

                {/* Axis Labels */}
                <div className="flex items-center justify-between text-[10.5px] font-['IBM_Plex_Mono',monospace] text-[rgba(20,19,16,0.42)] mt-2 px-1">
                  <span>14d ago</span>
                  <span>7d ago</span>
                  <span>Today</span>
                </div>
              </div>

              {/* Mono Stat Line in plain ink */}
              <div className="mt-4 pt-3 border-t border-[rgba(20,19,16,0.14)] text-xs font-['IBM_Plex_Mono',monospace] text-[#141310] flex items-center justify-between">
                <span>38 deploys</span>
                <span className="text-[rgba(20,19,16,0.25)]">·</span>
                <span>median 2m 12s</span>
                <span className="text-[rgba(20,19,16,0.25)]">·</span>
                <span className="font-semibold text-[#141310]">97% success</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
