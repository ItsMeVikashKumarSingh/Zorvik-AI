# Zorvik AI — Free Multi-Model Intelligence Platform & Microservice

Zorvik AI is a standalone, production-grade AI platform and microservice featuring a ChatGPT-style web workspace, multi-model zero-cost cascade routing, GenZ and complex task intelligence, sliding-window hot memory with Upstash Redis, dedicated PostgreSQL with native `pgvector` semantic recall, and a multi-tenant API gateway where the **Tenant ID acts directly as the authenticated API key**.

---

## Key Features

* **ChatGPT-Style Instant Chat**: Zero-friction guest access with an ephemeral session UUID (no signup required) + optional dedicated account sign-up with automatic guest-to-cloud history migration.
* **Zero-Cost Multi-Model Cascade**: Automatic failover across 100% free-tier frontier models:
  * Google Gemini 2.0 Flash (Primary)
  * Groq Cloud Llama 3.3 70B & DeepSeek R1 (Fallback 1)
  * OpenRouter Free Tier (Fallback 2)
  * Real-time **Circuit Breaker** with $<50\text{ms}$ failover and $0 cost.
* **GenZ & Complex Intent Intelligence**:
  * Understands emotional nuance and subtext behind emojis (💀, 😭, 💅, 🗿, 🧢, 🍳) and GenZ slang (rizz, bet, cap, lowkey, fr, ngl), producing ultra-concise, sharp, punchy answers.
  * Detects complex engineering, programming, and mathematical queries, generating step-by-step logic, verified code blocks, and KaTeX LaTeX formulas.
* **Dual-Tier Memory Engine**:
  * **Hot Sliding-Window Context**: Powered by **Upstash Redis** for sub-2ms active session prompt assembly.
  * **Semantic Long-Term Memory**: Powered by dedicated Supabase **`pgvector`** for 768-dimensional embeddings and cosine similarity recall.
* **Tenant ID API Gateway (`x-tenant-id`)**:
  * Standalone endpoints for **Zorvik Studio**, **Zorvik-Tech**, and external integrations.
  * Enforces real-time per-call sliding-window rate limits, token quotas, and custom system prompt overrides.
* **Cyber-Elegant Web Workspace**:
  * Built adhering to AntivGravity Rule 8: Deep Obsidian (`#050510`), Neon Purple (`#9333ea`), Neon Cyan (`#22d3ee`), Glassmorphism 2.0.
  * KaTeX math rendering, Prism syntax-highlighted code blocks with Copy & Run, real-time SSE streaming, and next-word autocomplete suggestions (Tab to complete).
* **Strict Architecture & Governance**:
  * Dedicated in-repo SQL migrations in `db/schema.sql` (100% decoupled from `zorvik-db`).
  * Strict ESLint 9 Zero-Warning Policy.
  * Full Docker containerization and Vercel serverless deployment support.

---

## Quick Start

```bash
git clone https://github.com/ItsMeVikashKumarSingh/Zorvik-AI.git
cd Zorvik-AI
npm install
cp .env.example .env
npm run dev
```

Visit `http://localhost:3000` to launch the platform.

---

## Documentation

* [API Documentation (`API_DOCS.md`)](API_DOCS.md) — Endpoints, curl, JavaScript, and Python code examples.
* [How to Use & Setup (`HOW_TO_USE.md`)](HOW_TO_USE.md) — Supabase, Redis, and deployment guides.
* [Development Rules (`RULES.md`)](RULES.md) — Repository governance and engineering rules.
* [Database Schema (`db/schema.sql`)](db/schema.sql) — PostgreSQL + `pgvector` migration.
* [Changelog (`VERSION.md`)](VERSION.md) — Version 0.1.0 release details.

---

## License

MIT © Team Zorvik (Vikash Kumar Singh, Varun Singh, Shri Ram Sain).
