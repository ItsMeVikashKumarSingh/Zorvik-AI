import React, { useState } from 'react';
import {
  X,
  BookOpen,
  Search,
  Cpu,
  ShieldAlert,
  Database,
  Code,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ModelMode } from '../types';

export interface PromptBlueprint {
  id: string;
  category: 'architecture' | 'security' | 'database' | 'api' | 'frontend';
  title: string;
  description: string;
  mode: ModelMode;
  template: string;
}

const BLUEPRINTS: PromptBlueprint[] = [
  {
    id: 'arch-microservices',
    category: 'architecture',
    title: 'High-Concurrency Microservice Topology',
    description: 'Design a resilient distributed microservice architecture with Kafka message queue and Redis caching layer.',
    mode: 'deep',
    template: `Design a high-concurrency, fault-tolerant microservice architecture for [SYSTEM_NAME].
Key Requirements:
1. Expected Throughput: [e.g. 50,000 requests/sec]
2. Data Storage: Relational for core transactions, NoSQL for high-write feeds
3. Event Streaming: Apache Kafka / RabbitMQ event-driven architecture
4. Caching & Edge: Redis cluster and CDN edge caching
5. Failure Handling: Circuit breakers, idempotency keys, and retry queues

Please provide:
- High-level component topology and communication protocols (gRPC / HTTP/2)
- Data consistency strategy (Saga pattern vs 2PC)
- Scalability bottlenecks and mitigation measures`,
  },
  {
    id: 'sec-threat-model',
    category: 'security',
    title: 'OWASP Top 10 Security & Threat Audit',
    description: 'Perform a comprehensive vulnerability analysis and hardening review for an API endpoint or authentication flow.',
    mode: 'deep',
    template: `Perform a rigorous OWASP Top 10 security audit and threat modeling on the following component/flow:

[PASTE CODE / ENDPOINT LOGIC HERE]

Audit Dimensions:
1. Injection vulnerabilities (SQL, NoSQL, Command injection)
2. Broken authentication, session fixation, and JWT claim spoofing
3. Broken Object-Level Authorization (BOLA / IDOR)
4. Rate-limiting bypass and DoS attack vectors
5. Secret leakage and improper error handling

Provide a structured vulnerability ledger (Severity, Finding, Exploit Scenario, Concrete Remediation Code).`,
  },
  {
    id: 'db-query-optimizer',
    category: 'database',
    title: 'PostgreSQL Query Execution Plan & Indexing',
    description: 'Analyze slow query plans, eliminate sequential scans, and design optimal composite B-Tree/GIN indexes.',
    mode: 'code',
    template: `Analyze and optimize the following PostgreSQL query and execution plan:

SQL Query:
[PASTE QUERY HERE]

EXPLAIN (ANALYZE, BUFFERS) Output:
[PASTE EXPLAIN OUTPUT HERE]

Please identify:
1. Root cause of high cost (sequential scans, nested loop spills, buffer cache misses)
2. Indexing recommendations (Composite B-Tree, Partial, or GIN indexes with exact column order)
3. Rewritten query structure (CTE refactoring, window function optimization, or join restructuring)
4. Estimated performance improvement and disk I/O savings`,
  },
  {
    id: 'api-openapi-spec',
    category: 'api',
    title: 'OpenAPI 3.1 & Production REST Contract',
    description: 'Generate strict OpenAPI 3.1 YAML specifications with schema definitions, error responses, and rate limits.',
    mode: 'code',
    template: `Generate a production-grade OpenAPI 3.1 YAML specification for the [SERVICE_NAME] API.

Endpoints Required:
[LIST ENDPOINTS, e.g. POST /api/v1/auth/login, GET /api/v1/users/:id/analytics]

Requirements:
- Strict JSON Schema validation for request bodies and 200/201 responses
- Standardized RFC 7807 problem detail schemas for 400, 401, 403, 404, 429, and 500 errors
- Security schemes (Bearer JWT + API Key headers)
- Rate-limiting headers documentation (X-RateLimit-Limit, X-RateLimit-Remaining)
- Full example payloads with zero placeholders`,
  },
  {
    id: 'ui-glassmorphism',
    category: 'frontend',
    title: 'Glassmorphism 2.0 Tailwind & Framer Motion Component',
    description: 'Build an ultra-futuristic, responsive UI component with subtle glow effects and micro-interactions.',
    mode: 'code',
    template: `Build a production-ready React + Tailwind CSS + Framer Motion component for [UI_COMPONENT_NAME].

Design Guidelines:
- Aesthetic: Cyber-Dark / Ultra-Futuristic (Obsidian #050510, Purple #9333ea, Cyan #22d3ee)
- Glassmorphism 2.0: Subtle border glows (border-white/[0.08]), backdrop-blur-md, soft shadows
- Micro-interactions: Smooth hover states, spring transition animations, accessible keyboard focus
- Responsive: Verified across mobile, tablet, and widescreen desktop
- Zero decorative emojis: Use Lucide React vector icons exclusively

Provide full TypeScript React code with zero omitted lines.`,
  },
  {
    id: 'arch-database-sharding',
    category: 'architecture',
    title: 'Database Sharding & Partitioning Blueprint',
    description: 'Design horizontal partitioning and multi-tenant sharding keys for multi-terabyte data stores.',
    mode: 'deep',
    template: `Design a horizontal sharding and data partitioning strategy for a database scaling to [TARGET_SIZE, e.g. 10TB+].

Key Workload:
- Write-heavy vs Read-heavy characteristics: [DESCRIBE WORKLOAD]
- Entity Relationships: [e.g. Tenants -> Organizations -> Users -> Events]

Analyze:
1. Shard key candidate evaluation (Hash-based vs Range-based vs Directory-based)
2. Cross-shard query mitigation strategies
3. Dynamic shard rebalancing and zero-downtime resharding
4. Backup, replication, and disaster recovery implications`,
  },
];

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlueprint: (template: string, mode: ModelMode) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectBlueprint,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Blueprints' },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
    { id: 'security', label: 'Security & Audit', icon: ShieldAlert },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'api', label: 'API Contracts', icon: Code },
    { id: 'frontend', label: 'UI / Frontend', icon: Layers },
  ];

  const filtered = BLUEPRINTS.filter((bp) => {
    const matchesCategory = selectedCategory === 'all' || bp.category === selectedCategory;
    const matchesSearch =
      bp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bp.template.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-[#090914] border border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-2xl shadow-purple-950/30 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-iris/20 text-iris">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-medium text-white tracking-tight">
                Engineering Blueprint & Prompt Hub
              </h3>
              <p className="text-[11px] text-silver/50 font-light">
                Production-tested architecture, security, database, and API specifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-silver/40 hover:text-white hover:bg-white/[0.05] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Categories Bar */}
        <div className="py-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-silver/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blueprints by topic, stack, or keywords..."
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] focus:border-iris/50 rounded-xl text-xs text-white placeholder-silver/40 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-light whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-iris/20 text-iris border border-iris/40'
                      : 'bg-white/[0.02] border border-white/[0.06] text-silver/60 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  {Icon && <Icon size={12} />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Blueprint Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-silver/40">
              No engineering blueprints found matching your search query.
            </div>
          ) : (
            filtered.map((bp) => (
              <div
                key={bp.id}
                className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-iris/40 hover:bg-white/[0.04] transition-all flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white group-hover:text-iris transition-colors">
                      {bp.title}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/[0.04] border border-white/[0.08] text-silver/60">
                      {bp.mode} mode
                    </span>
                  </div>
                  <p className="text-xs text-silver/60 font-light leading-relaxed">
                    {bp.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                  <div className="text-[11px] font-mono text-silver/40 uppercase">
                    Category: {bp.category}
                  </div>
                  <button
                    onClick={() => {
                      onSelectBlueprint(bp.template, bp.mode);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-iris text-white hover:bg-iris/80 text-xs font-medium transition-all shadow-md shadow-iris/20"
                  >
                    <span>Use Blueprint</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
