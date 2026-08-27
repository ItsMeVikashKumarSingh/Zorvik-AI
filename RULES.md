# ZORVIK AI — DEVELOPMENT RULES & ENGINEERING GOVERNANCE

## 1. REPOSITORY ISOLATION & SCOPE CONTROL (CRITICAL)
- **Standalone Microservice**: Zorvik AI is a completely decoupled, standalone microservice.
- **Strict Directory Boundary**: All changes, scripts, configurations, and documentation MUST strictly reside inside the `Zorvik-AI/` directory.
- **External Project Protection**: Modifying any external repository (`zorvik-db`, `Zorvik-Tech`, `studio-backend`, `studio-frontend`, `ZConnect`, `Payment-APIs`, etc.) is STRICTLY PROHIBITED without explicit user permission.
- **Dedicated Database Migrations**: Unlike other Zorvik apps that use `zorvik-db`, Zorvik AI connects to its own dedicated database. All SQL schema definitions, migrations, and seeds MUST be stored directly inside `Zorvik-AI/db/`.

## 2. VERSIONING & CHANGE CONTROL
- **Semantic Versioning**:
  - Major releases (0.1.0 -> 0.2.0): New architectural modules, new API groups, or major overhauls.
  - Patch releases (0.1.0 -> 0.1.1): Bug fixes, prompt optimizations, UI refinements.
- **Mandatory Tracking**: `VERSION.md` must be updated with the version number, date, and summary of changes.

## 3. ZERO HARDCODED SECRETS (SECURITY MANDATE)
- Hardcoding API keys, tokens, or credentials is strictly prohibited.
- All secrets (Gemini API keys, Groq API keys, OpenRouter API keys, Supabase credentials, Upstash Redis keys) MUST be loaded from environment variables (`.env`).
- Provide `.env.example` as a template for required variables.

## 4. MULTI-TENANT & API GOVERNANCE
- **Tenant ID as API Key**: External calls (Zorvik Studio, Zorvik-Tech, third-party clients) authenticate via the `x-tenant-id` header.
- **Per-Call Limit Enforcement**: Every tenant call must be validated for active status and rate limits (requests per minute and monthly token quotas) in real-time.
- **Audit Logging**: All administrative and tenant API calls must be logged with timestamp, tenant ID, model used, latency, and status.

## 5. ZERO-COST MULTI-MODEL ROUTING
- Primary routing cascade: Google Gemini 2.0 Flash (Free tier) -> Groq Cloud Llama 3.3 70B & DeepSeek R1 (Free tier) -> OpenRouter Free models.
- Automated circuit breaker: If a provider returns HTTP 429 or 5xx, failover to the next free provider must occur silently in <50ms.
- Costing must remain $0.

## 6. DESIGN & UI STANDARDS
- Theme: Cyber-Elegant / Ultra-Futuristic.
- Background: Deep Obsidian `#050510`, Primary: Purple `#9333ea`, Accent: Cyan `#22d3ee`.
- Typography: Headers in Syncopate/Orbitron, Body in Inter/Geist.
- Icons: Lucide icons exclusively (no emojis in buttons/system controls; natural emoji understanding in chat).
- Glassmorphism 2.0 with subtle glow effects and high responsiveness (mobile, tablet, desktop).

## 7. CODE QUALITY & CI/CD
- Strict ESLint 9 configuration with a Zero Warning Policy.
- Terminal hygiene: delete any temporary test/log files before completing tasks.
