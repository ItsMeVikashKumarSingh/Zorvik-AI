# Zorvik AI — Frontier Multi-Model Intelligence Platform & Monetization Gateway

Zorvik AI (v1.0.1) is a production-grade, standalone AI platform and multi-tenant microservice featuring a high-speed React 19 web workspace, sub-50ms native SSE streaming, Google Search grounding, live code artifact execution, multi-modal attachments, voice conversation mode, dedicated admin control plane, and a paid monetization gateway (`x-tenant-id`).

---

## 🚀 Key Capabilities

* **⚡ Native Upstream SSE Streaming Pipeline**:
  * Direct stream piping from Google Gemini 2.5 Flash, Groq Cloud Llama 3.3 70B, Cerebras LPU (2,000+ tok/s), Mistral Codestral, and OpenRouter for sub-200ms Time-to-First-Token.
* **🌐 Real-Time Google Search Grounding**:
  * Seamless web search grounding with live domain citation pills and structured source cards.
* **🎙️ Voice Conversation Mode**:
  * **Speech-to-Text**: Hands-free microphone dictation with real-time waveform animation.
  * **Text-to-Speech**: Speech synthesis audio readout on all assistant responses.
* **🎨 Live Code Sandbox & Artifacts Canvas**:
  * Sandboxed real-time preview of HTML, SVG, React/JSX, CSS, and Python code artifacts.
* **🧠 Autonomous Neural Memory & Adaptive Tone**:
  * Asynchronously learns user preferences, project tech stacks, and stated facts into persistent PostgreSQL storage.
* **🛡️ Admin Control Plane (`/admin`)**:
  * Dedicated administrative suite with KPI metrics, tenant API key provisioning, paid pricing plan configurations (Starter $19/mo, Pro $49/mo, Enterprise $199/mo), manual circuit breaker toggles, and Rule 3.1 immutable audit logging.
* **🤖 Specialized Multi-Agent Personas**:
  * Switch between System Architect, Security Auditor, UI/UX Glassmorphism Designer, and General Polymath.
* **📊 Personal Quota & Token Meter**:
  * Real-time consumption progress bar and rate limit gauges.

---

## 🛠️ Quick Start

```bash
git clone https://github.com/ItsMeVikashKumarSingh/Zorvik-AI.git
cd Zorvik-AI
npm install
npm --prefix frontend install
cp .env.example .env
npm run dev
```

Visit `http://localhost:3000` to launch the platform or `http://localhost:3000/admin` for the admin portal.

---

## 🧪 Testing & Verification

```bash
# Run strict ESLint (Rule 5.4 Zero-Warning Policy)
npm run lint

# Run all 13 microservice and admin automated test suites
npm test

# Build production React frontend
npm run build
```

---

## 📚 API Gateway (`/api/v1`)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/chat` | `POST` | Standard single-turn JSON chat completion |
| `/api/v1/chat/stream` | `POST` | High-speed SSE token stream |
| `/api/v1/models` | `GET` | Available models and providers |
| `/api/v1/health` | `GET` | Service and cascade health check |
| `/api/v1/admin/overview` | `GET` | Administrative telemetry & KPIs |
| `/api/v1/admin/tenants` | `GET/POST` | Provision and manage tenant keys |
| `/api/v1/admin/plans` | `GET/PUT` | Manage pricing subscription tiers |
| `/api/v1/admin/circuit-breaker/toggle` | `POST` | Manual failover overrides |
| `/api/v1/admin/audit-logs` | `GET` | Retrieve immutable audit records |

---

## 📄 License

MIT © Team Zorvik (Vikash Kumar Singh, Varun Singh, Shri Ram Sain).
