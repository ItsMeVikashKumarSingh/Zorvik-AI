# Zorvik AI - Version Changelog

All notable changes to the Zorvik AI standalone microservice will be documented in this file.

## [1.0.5] - 2026-08-29
### Universal Long-Term Neural Memory Sync, Model Anonymity, & Right-Dock Voice Visualizer
- **Complete Internal Model Anonymity ([`AccountModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AccountModal.tsx))**:
  - Removed all third-party provider strings (Gemini 2.5, Groq, Cerebras) from account & quota views, branding all inference as *Zorvik Multi-Engine Neural Matrix*.
- **Universal Multi-Turn & Cross-Session Long-Term Memory ([`AccountModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AccountModal.tsx), [`api.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/routes/api.js), [`api.ts`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/lib/api.ts), [`autoMemoryExtractor.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/autoMemoryExtractor.js))**:
  - Unified memory storage across both authenticated Supabase accounts and persistent local guest sessions.
  - Automatically loads and saves custom instructions, personas, and conversational tones directly into local storage and backend Redis/pgvector stores.
  - Injects stored user facts (identity, project stack, role, preferred style) into every conversation turn's system prompt so the AI remembers details across separate threads.
  - Expanded heuristic fact extraction to capture user identity, project tech stacks, companies, and explicit memory directives.
- **Right-Aligned Microphone & Animated Waveform Equalizer ([`InputDock.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/InputDock.tsx), [`WelcomeHero.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/WelcomeHero.tsx))**:
  - Placed microphone icon on the right side of the dock next to Send/Cancel.
  - Animated audio visualizer waveform when speech recognition is active.
- **In-Place Message Rewrite & Version History Pagination ([`MessageItem.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/MessageItem.tsx), [`AppWorkspace.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AppWorkspace.tsx))**:
  - Rewriting responses regenerates in-place with `< 1 / 2 >` version pagination controls.

## [1.0.4] - 2026-08-29
### Multi-Format Thread Exporter, Header Share Controls, Blueprint Hub Dropdown & Multi-File Canvas
- **Top-Bar Thread Exporter & Share Controls ([`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx), [`ShareModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/ShareModal.tsx))**:
  - Relocated whole-conversation share and export actions to the top header bar.
  - Multi-format thread export suite: Formatted Markdown (`.md`), Standalone Styled HTML Executive Report (`.html`), Structured JSON Archive (`.json`), Copy Full Transcript, Browser Print to PDF, and Instant Shareable Snapshot Link.
- **Single-Response Granular Download ([`MessageItem.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/MessageItem.tsx))**:
  - Replaced message-level sharing with a clean 1-click single-response download action (`Save` button) alongside copy and audio readback.
- **Unified Intelligence & Mode Selector Dropdown ([`InputDock.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/InputDock.tsx), [`WelcomeHero.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/WelcomeHero.tsx))**:
  - Replaced wide button rows with a cyber-glass dropdown selector (ChatGPT / Claude style) supporting all modes (*All*, *Web Search*, *Deep Thinker*, *Code Wizard*, *Casual*) and direct access to prompt blueprints.
- **Engineering Blueprint & Prompt Hub ([`PromptLibraryModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/PromptLibraryModal.tsx))**:
  - Curated, production-tested blueprints across Architecture (high-concurrency microservices, sharding), Security (OWASP Top 10 threat audit), Database (PostgreSQL execution plan optimizer), and API Contracts (OpenAPI 3.1 specs).
  - 1-click to pre-fill prompt into dock with optimal intelligence mode pre-selected.
- **Multi-File Live Artifact Canvas & Sandbox Downloader ([`ArtifactsCanvas.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/ArtifactsCanvas.tsx))**:
  - Multi-file tab support (e.g. `index.html`, `styles.css`, `app.js`), 1-click code copying per active tab, and single-file/bundle downloading with sandboxed live preview.

## [1.0.3] - 2026-08-29
### Neural Nuance & Multidimensional Intent Classification Engine (Gen Z & Gen Alpha Intelligence)
- **Comprehensive Subculture Lexicons ([`intentEngine.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/intentEngine.js))**:
  - Expanded beyond basic keywords to full multi-layer subculture dictionaries spanning modern **Gen Z dialects** (*rizz, cap, bet, lowkey, fr, ngl, cooked, rent free, main character, delulu, crash out, locked in, unc, aura points, no diddy, looksmaxxing, npc, opps, glazing, based, cringe, chat is this real, understood the assignment, unhinged*) and **Gen Alpha brainrot neo-vernacular** (*skibidi, fanum tax, kai cenat, baby gronk, livvy dunne, rizzler, duke dennis, grimace shake, ohio, sigma male, mogged, looksmax, mewing, what the sigma, edge streak, gooning, quandale dingle, smurf cat, john pork*).
- **Multi-Factor Intent & Tone Density Separation**:
  - Distinguishes between conversational intent and task complexity. If a user asks a complex coding or architecture question using youth slang, the system executes the complete, production-grade technical solution while seamlessly matching their locked-in developer tone.
  - Automatically understands emoji subtext (💀 shock/laughter, 😭 overwhelming, 💅 slaying/confidence, 🗿 stoic sigma, 🧢 cap/falsehood, 🍳 let them cook, 🤡 foolishness) without regurgitating dictionary explanations.
- **Strict Clean Aesthetic & Emoji-Free Responses**:
  - Enforces Rule 8.4 across all responses and modals, ensuring clean, cinematic markdown with vector Lucide icons and zero emoji clutter.

## [1.0.2] - 2026-08-29
### Universal Real-Time Web Crawler, Live URL Content Scraper, & Natural Prose Polish
- **Universal Live Web Grounding & URL Scraper ([`webGrounding.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/webGrounding.js), [`modelRouter.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/modelRouter.js))**:
  - Automatically extracts domains and URLs (e.g. `zorviktech.com`, `https://...`) directly from user prompts.
  - Crawls and scrapes live website contents and search snippets in real time, injecting the fresh HTML/Markdown text into the context of **ALL** cascade engines (Gemini, Groq, Cerebras, Mistral, OpenRouter).
  - Guarantees that even if primary Gemini hits a 429 quota exhaustion, fallback LPU models have the full live webpage context.
- **Strict Anti-Disclaimer & Natural Prose Directive ([`intentEngine.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/intentEngine.js))**:
  - Strictly prohibits sterile robotic disclaimers ("I am an AI", "I don't have live web access", "I cannot browse").
  - Enforces clean, natural, human punctuation and strips unnecessary em dashes (`—` / `–`) across model output.
  - Direct decisive action: immediately performs audits, reviews, and inspections when presented with a website or codebase.

## [1.0.1] - 2026-08-29
### Voice Conversation Mode, Personal Token Quota Meter, & Specialized AI Personas
- **Voice Conversation Mode ([`InputDock.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/InputDock.tsx), [`WelcomeHero.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/WelcomeHero.tsx), [`MessageItem.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/MessageItem.tsx))**:
  - **Speech-to-Text Voice Dictation**: Integrated microphone button with live listening pulse animation, speech streaming directly into input prompt.
  - **Text-to-Speech Audio Readout**: Audio playback toggle on all assistant responses with natural syntax parsing and speech synthesis controls.
- **Personal Token Quota Meter & Plan Gauge ([`AccountModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AccountModal.tsx))**:
  - Dedicated "Quota & Plan" tab displaying active tier badge, monthly token consumption progress bar, rate limits, and quota renewal timer.
- **Specialized AI Multi-Agent Personas ([`AccountModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AccountModal.tsx))**:
  - **System Architect**: Microservice topologies, schema design, and high-concurrency scaling.
  - **Security Auditor**: OWASP risk analysis, injection defense, and secret leakage prevention.
  - **UI/UX Designer**: Glassmorphism 2.0, Tailwind CSS, and cinematic aesthetic precision.
  - **General Polymath**: Default balanced high-IQ reasoning engine.

## [1.0.0] - 2026-08-29
### Admin Control Plane, Paid Monetization Engine, & Mandatory Audit Logging
- **Admin Control Plane Workspace ([`AdminLayout.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/admin/AdminLayout.tsx))**:
  - Standalone cyber-dark administrative portal accessible at `/admin` with RBAC session validation.
  - **Overview Dashboard ([`AdminDashboard.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/admin/AdminDashboard.tsx))**: Real-time KPI metrics, active paid keys count, token burn rate, revenue estimates, and live provider health.
  - **Tenant & API Key Manager ([`TenantManager.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/admin/TenantManager.tsx))**: Instant provisioning, plan tier assignment, custom monthly token quotas, rate limit overrides, and suspend/activate toggles.
  - **Pricing Plans & Monetization Engine ([`PlanManager.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/admin/PlanManager.tsx))**: Full configuration of Starter ($19/mo), Pro ($49/mo), and Enterprise ($199/mo) plans with overage pricing.
  - **Model Circuit Breaker Controls ([`CircuitBreakerControl.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/admin/CircuitBreakerControl.tsx))**: Interactive switches to manually trip, reset, or test AI engines (Gemini, Groq, Cerebras, Mistral, OpenRouter).
  - **Mandatory Immutable Audit Log Viewer ([`AuditLogViewer.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/admin/AuditLogViewer.tsx))**: Chronological tamper-proof ledger of every administrative action, IP address, and JSON mutation payload.
- **Backend Admin Infrastructure & RBAC Middleware ([`admin.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/routes/admin.js), [`adminAuth.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/middleware/adminAuth.js))**:
  - Mounted `/api/v1/admin` with master key and JWT admin role verification.
  - Mandatory audit logger in [`auditLogger.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/auditLogger.js) enforcing Rule 3.1.
- **Database Schema Migration (`0002_zorvik_ai_admin_and_monetization.sql`)**:
  - Added `tbl_admins`, `tbl_pricing_plans`, `tbl_audit_logs`, and updated `tbl_tenants` with plan references.

## [0.9.0] - 2026-08-29
### True SSE Streaming, Google Search Grounding, Multi-Modal Vision, Live Canvas Artifacts, & Autonomous Memory
- **True Native Upstream SSE Streaming Pipeline ([`modelRouter.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/modelRouter.js), [`api.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/routes/api.js))**:
  - Replaced simulated word-split loop with native HTTP SSE chunk stream piping directly from Gemini, Groq, Cerebras, Mistral, and OpenRouter for sub-200ms Time-to-First-Token.
- **Google Gemini Search Grounding & Web Citations ([`modelRouter.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/modelRouter.js), [`MessageItem.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/MessageItem.tsx))**:
  - Activated native `googleSearch` grounding tools on Gemini 2.5 Flash during Search focus mode and fresh queries.
  - Automatically parses `groundingMetadata.groundingChunks` into structured clickable source cards with domain badges.
- **Autonomous Neural Memory Ingestion & Adaptive Tone Learning ([`autoMemoryExtractor.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/autoMemoryExtractor.js))**:
  - Automatically extracts user personal facts, project stacks, and stated preferences asynchronously in the background.
  - Dynamically infers and calibrates the user's conversational tone vibe without requiring manual input.
- **Multi-Modal Vision & File Attachments ([`InputDock.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/InputDock.tsx), [`WelcomeHero.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/WelcomeHero.tsx))**:
  - Added paperclip file attachment, image drag-and-drop, and direct clipboard screenshot pasting (`Ctrl+V`) with visual thumbnail preview chips.
- **Live Code Artifacts / Canvas Sandbox ([`ArtifactsCanvas.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/ArtifactsCanvas.tsx))**:
  - Collapsible side-panel for live sandboxed HTML/CSS/JS execution, SVG rendering, and full code inspection with reload, fullscreen, and download.
- **Comprehensive Share & Export Dialog ([`ShareModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/ShareModal.tsx))**:
  - Shareable link generator, Markdown (`.md`) download, structured JSON export, and styled Print/Save-to-PDF.
- **Legacy & Autocomplete Codebase Purge**:
  - Removed duplicate `backend/` directory, unused Python `tokenization-server/`, static HTML prototypes, and unneeded autocomplete/predict endpoints.

## [0.8.0] - 2026-08-29
### Neural Long-Term Memories & Account Personalization Hub
- **Account & Personalization Modal ([`AccountModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AccountModal.tsx))**:
  - **Profile Management**: Displays user details, active member badge, self-service password update dialog, and instant sign out.
  - **Custom Tone & Intelligence Style**: Selectable response tone presets (Adaptive Auto, Direct & Concise, Deep Engineering, Charismatic & Witty, GenZ Culture) + custom response instructions.
  - **Neural Long-Term Memories Hub**: View remembered user facts, manually add new facts/preferences, delete individual memories, or clear all.
- **Backend Memory Persistence & Automatic Prompt Injection**:
  - Added `/api/v1/user/memories` endpoints in [`api.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/routes/api.js) backed by `memoryEngine.js`.
  - Automatically loads the logged-in user's personalized memories and custom instructions on every chat turn, injecting them into `buildSystemPrompt()` in [`intentEngine.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/intentEngine.js).
- **Drawer & Header Account Integration ([`Sidebar.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Sidebar.tsx), [`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx))**:
  - Clicking the Account pill in the sidebar or header for logged-in users directly opens the Account & Memories modal.

## [0.7.3] - 2026-08-29
### OAuth Post-Login Session Handling & Clean Address Bar Routing
- **OAuth Session Hash Auto-Routing ([`App.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/App.tsx))**:
  - Added auto-detection for `#access_token=...` and `#refresh_token=...` hash fragments on mount so OAuth logins immediately transition to `/app`.
  - Added global `supabase.auth.onAuthStateChange` listener to automatically redirect authenticated users into the app workspace.
- **Address Bar Cleanup ([`AppWorkspace.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AppWorkspace.tsx))**:
  - Automatically wipes the verbose access token hash fragment from the browser's URL using `window.history.replaceState` once the session is active.

## [0.7.2] - 2026-08-28
### Multi-Tier AI Cascade (Cerebras LPU & Mistral Reasoning) + Persona Overhaul
- **Cerebras Cloud LPU Integration (3rd Tier Fallback)**:
  - Integrated Cerebras Cloud ultra-fast inference (2,000+ tokens/sec, 1M free tokens/day) into [`modelRouter.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/modelRouter.js) with `llama-3.3-70b` and `llama-3.1-8b`.
- **Mistral & Codestral AI Integration (Deep Logic & Code Wizard)**:
  - Added specialized mode routing in [`modelRouter.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/modelRouter.js) for `codestral-latest` (code mode) and `mistral-small-latest` (deep reasoning mode).
- **Zorvik AI Charismatic Persona Directives ([`intentEngine.js`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/src/services/intentEngine.js))**:
  - Replaced generic LLM disclaimers with branded **Zorvik AI** persona (proudly built by Team Zorvik).
  - Added witty, intuitive conversational banter for hypotheticals, humor, and thought-reading prompts.
- **Unified Single `.env` Architecture**:
  - Configured Vite `envDir: '../'` and unified Supabase URL, Secret Key, Publishable Key, and AI provider configurations in a single root `.env` file.

## [0.7.1] - 2026-08-28
### Landing Page UI/UX Polish & Official Zorvik AI Icon Asset Integration
- **Official Zorvik AI Icon Asset**:
  - Integrated the official metallic gold/brass 'Z' emblem and Hallmark card (`media_1787936712720.jpg`) as the primary icon and logo mark (`logo.png`, `zorvik-logo.jpg`) across navigation headers, hero sections, and footers while preserving `favicon.png` for browser tab icons.
- **Refined Adaptive Intelligence Showcase ([`GenZSimulator.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/GenZSimulator.tsx))**:
  - Replaced raw markdown text dump with rich formatted rendering (`renderMarkdown`) supporting syntax-highlighted code fences (TypeScript, SQL) and KaTeX mathematical notation.
  - Redesigned mode selector into a sleek glassmorphic segmented control with crisp active states and smooth transitions.
  - Standardized generous section spacing (`py-24 sm:py-32`) and balanced card layout.
- **Enhanced Enterprise API Section ([`LandingPage.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/LandingPage.tsx))**:
  - Integrated Prism syntax highlighting for the developer terminal across cURL, Node.js, and Python tabs.
  - Added enterprise value highlights (Edge Streaming, Zero Data Retention, Dedicated Endpoints & SLA) in a balanced two-column layout.
  - Polished copy-to-clipboard interactions and section padding.

## [0.7.0] - 2026-08-28
### Comprehensive Authentication System (Sign In, Sign Up, Password Reset, & Session Hub)
- **Multi-Tab Auth Workflows ([`AuthModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AuthModal.tsx))**:
  - **Sign In**: Secure email & password authentication, show/hide password toggle, and direct "Forgot password?" recovery trigger.
  - **Sign Up**: Account creation with real-time password strength validation checklist (length, numbers, symbols) and confirm password matching.
  - **Forgot / Reset Password**: Self-service recovery flow with instant email link dispatch and secure new password creation dialog.
  - **OAuth Providers**: Google & GitHub one-click authentication support via Supabase.
- **Account Popover & Session Management ([`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx))**:
  - Replaced static pill with an interactive user profile popover when signed in.
  - Displays user email, "Change Password" modal trigger, and one-click "Sign Out".
- **Real-Time Session Synchronization ([`AppWorkspace.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AppWorkspace.tsx), [`supabase.ts`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/lib/supabase.ts))**:
  - Integrated Supabase `onAuthStateChange` listener to persist active sessions across page reloads and automatically intercept password recovery deep links (`PASSWORD_RECOVERY`).

## [0.6.8] - 2026-08-28
### Global Favicon & Zorvik AI Emblem Icon Integration
- **Universal Favicon**: Integrated high-resolution metallic 'Z' emblem as the official browser favicon in [`index.html`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/index.html) and `public/favicon.png`.

- **Cross-View Logo Integration**: Deployed the official logo emblem mark across:
  - [`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx) (in the top brand pill)
  - [`Sidebar.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Sidebar.tsx) (in the top header lockup)
  - [`WelcomeHero.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/WelcomeHero.tsx) (as the central hero hallmark emblem)
  - [`AuthModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AuthModal.tsx) (in the authentication header)
  - [`LandingPage.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/LandingPage.tsx) & [`LegalPage.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/LegalPage.tsx) (in floating island navigation bars).

## [0.6.7] - 2026-08-28
### Single Context-Aware Sidebar Toggle
- **Eliminated Duplicate Collapse Buttons**: Contextually rendered the top navigation `PanelLeft` button in [`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx) only when the sidebar is collapsed (`!sidebarOpen`), guaranteeing exactly one toggle control visible on screen at any time.


## [0.6.6] - 2026-08-28
### Eliminated Synthetic Status Box & Block Cursor
- **Purged Synthetic Monospace Box Banners**: Removed the artificial `SYNTHESIZING VERIFIED KNOWLEDGE...` / `Thought Process` accordion box in [`MessageItem.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/MessageItem.tsx).

- **Streamlined Typography**: Replaced the chunky block cursor with a subtle streaming state for a distraction-free, editorial reading flow matching native Perplexity.

## [0.6.5] - 2026-08-28
### Synchronous Route Initialization & Zero-Flash Loading
- **Eliminated Initial Route Flash**: Replaced asynchronous `useEffect`-only route detection in [`App.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/App.tsx) with a synchronous initial state initializer (`getInitialView()`). Direct visits to `/app` render the workspace on the very first frame without any momentary flash of the landing page.


## [0.6.4] - 2026-08-28
### Brand Title Standardization: Zorvik AI
- **Unified Zorvik AI Branding**: Standardized the product name across [`Sidebar.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Sidebar.tsx), [`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx), and [`AuthModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/AuthModal.tsx) to **Zorvik AI**.


## [0.6.3] - 2026-08-28
### Collapsable Left Drawer & UI Refinement
- **Collapsable Left Drawer**: Implemented full sidebar expand/collapse functionality on all screen sizes (desktop, tablet, and mobile) with dedicated `PanelLeft` toggle in `Header.tsx` and `PanelLeftClose` button in `Sidebar.tsx`.


## [0.6.2] - 2026-08-28
### Brand Harmonization & Static Refinement
- **Brand Uniformity**: Replaced all instances of "Zorvik 2.0" with the official brand name **"Zorvik AI"** across `Header.tsx` and fallback streaming metadata in `AppWorkspace.tsx`.
- **Eliminated Distracting Animations**: Removed the pulsing blinking dot in `Header.tsx` and pulsing icon effects in `MessageItem.tsx` for a cleaner, high-contrast, premium aesthetic.


## [0.6.1] - 2026-08-28
### Text Selection Restoration & Interface De-Duplication
- **Unrestricted Text Selection**: Removed all blocking `select-none` utility classes across workspace containers and message wrappers, enabling fluid text selection and copy across responses.
- **Removed Redundant Overview & External Links**: Removed unnecessary "Overview" buttons and redundant external links from `Header.tsx` and `Sidebar.tsx`.
- **Streamlined Visual Hierarchy**: Eliminated repetitive brand banners and duplicate "Answer" section labels in `MessageItem.tsx` and `WelcomeHero.tsx` for a distraction-free reading experience.


## [0.6.0] - 2026-08-28
### Ultra-Minimalist Perplexity-Style Knowledge Synthesis & Search Hub (`/app`)
- **Minimalist Search Hero ([`WelcomeHero.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/WelcomeHero.tsx))**:
  - Centered commanding query box with focus selectors (`All`, `Deep Thinker`, `Code`, `Casual`), predictive autocomplete pill, and autofocus textarea.
  - Curated text-only topic explorations with Lucide icons (Quantum Computing, TypeScript Circuit Breaker, AI Architecture 2026, GenZ Cultural Subtext) with zero bulky card borders.
- **Perplexity-Style Answer Thread Structure ([`MessageItem.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/MessageItem.tsx))**:
  - **User Query Heading**: Monumental high-contrast heading at the top of the thread.
  - **Sources Deck**: Compact horizontal source pills with favicon badges, domain indicators, and citation index markers (`[1]`, `[2]`, `[3]`).
  - **Collapsible Reasoning Steps**: Step-by-step thinking indicator accordion (*"Thought Process · 3 verification steps"*).
  - **Verified Synthesized Response**: Crisp markdown rendering with KaTeX math equations, Prism code blocks, and copy/share/regenerate actions.
  - **Dynamic Related Follow-ups**: "+ Related" interactive follow-up query suggestions at the bottom of each answer for instant 1-click continuation.
- **Sticky Minimalist Follow-up Dock ([`InputDock.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/InputDock.tsx))**:
  - Streamlined follow-up bar appearing during active threads with focus chips and responsive send trigger.
- **Modern Library Sidebar ([`Sidebar.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Sidebar.tsx))**:
  - Date-grouped conversation history (*Today, Yesterday, Previous 7 Days, Earlier*), library search filtering, thread deletion, and account status.
- **Top Navigation Bar ([`Header.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/Header.tsx))**:
  - Minimal model indicator (`Zorvik 2.0`), dynamic active thread title, and account button.


### 6-Stage 3D Particle Morph Architecture, Organic Brain & Monumental 1-Line Headline
- **Monumental 1-Line Headline & Layout Optimization ([`LandingPage.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/LandingPage.tsx))**:
  - Implemented single commanding 1-line headline: *"The intelligence that speaks your language."*
  - Harmonized subtext covering creators & enterprise without clutter.
  - Expanded hero grid to 8/4 ratio (`max-w-[1440px]`), eliminating excess midline space.
  - Fixed font descender letter clipping by increasing line-height and adding bottom padding to the line-reveal mask.
  - Updated Gen Z Simulator conversation with the viral 11:55 PM emergency assignment finesse protocol and removed redundant card top bars.
  - Overhauled landing page footer to liquid-glass theme with brand identity, circular social buttons, direct contact details (+918409792083, hello@zorviktech.com, Sherpur Bahori, Mahua, Vaishali, Bihar), and live operational status indicator.
  - Built standalone independent governance pages & routes (`/privacy`, `/terms`, `/security`) with dedicated [`LegalPage.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/LegalPage.tsx) and [`LegalModal.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/LegalModal.tsx).
  - Configured 1-Project unified full-stack monorepo deployment pipeline in `vercel.json`, `package.json`, and `server.js` with zero CORS friction and automatic Edge CDN routing.
  - Fine-tuned Stage 1 (Hero) position to `58%` width and Stage 2 (Capabilities) to `9%` width for generous breathing room and zero text overlap across all desktop zoom factors.
  - Upgraded transition trigger between Section 2 and Section 3 to start morphing earlier at `30%` scroll for immediate fluid responsiveness.
  - Enlarged and centered all 3D objects for post-Stage-2 sections (3D Brain at scale `1.70`, Quantum Gyroscope at scale `1.75`, Zorvik Monolith at `1.85`).
- **6-Stage 3D Particle Morph System ([`ConstellationCanvas.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/ConstellationCanvas.tsx))**:
  - **Stage 1 (Hero)**: 3D Cyber Human positioned comfortably alongside headline at 58% width, pointing left with dynamic cyan laser beam.
  - **Stage 2 (Capabilities)**: 3D Cyber Human positioned at 9% far-left width, rotated 180° pointing right across capability cards.
  - **Stage 3 (Deep Memory)**: Monumental centered Organic 3D Anatomical Human Brain (scale `1.70`) with continuous Fibonacci cortical topology and golden synaptic firing arcs.
  - **Stage 4 (Adaptive Intelligence)**: Monumental centered 3D Quantum Multi-Model Gyroscope (scale `1.75`) with 3 orthogonal rotating concentric rings.
  - **Stage 5 (Enterprise API)**: 3D High-Throughput Stream Pipeline with 8-column server node cylinder and inner double-helix data stream strand.
  - **Stage 6 (Cathedral CTA)**: Monumental 3D Circuit-Traced Zorvik Monolith Shield (scale `1.85`) hovering directly above the sculptural **ZORVIK ΛI** logo.
- **Atmospheric Background Engine**:
  - Ambient multi-chromatic micro-stardust with gentle pulsing opacity and dynamic radial nebula aura.
- **Clean Synaptic Rendering**:
  - Clean luminous circular synaptic spheres with depth attenuation (zero square/diamond artifacts in non-human stages).

---

## [0.5.8] - 2026-08-27
### Landing Page Overhaul & 3D Volumetric Handshake / Neural Mind
- **Floating Island Glassmorphic Header**:
  - Implemented floating island pill header with official Zorvik AI logo mark (`zorvik-logo.jpg`), high-contrast dark CTA (`Launch Workspace ↗`), and clean navigation links.
- **Minimalist De-cluttering**:
  - Removed all yellow kicker mono tags, highlight chips, repetitive checklists, and pulsing visual dots across the landing page.
- **Adaptive Intelligence Component Overhaul ([`GenZSimulator.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/GenZSimulator.tsx))**:
  - Built 4-mode interactive playground: *To The Point*, *Gen Z Slang & Emojis*, *Complex Engineering*, and *Combined Hybrid Synthesis*.
- **Photorealistic 3D Volumetric Handshake ([`ConstellationCanvas.tsx`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/frontend/src/components/ConstellationCanvas.tsx))**:
  - Completely replaced artificial rings/cuffs with solid 3D point-cloud forearms, anatomical palm body, upright 3-joint thumbs, and 4 cylindrical fingers wrapping in depth with natural rhythmic handshake pumping.
- **Stage 5 3D Volumetric Neural Mind**:
  - Replaced logo particle stage with an intricate 3D Cybernetic Neural Mind featuring dual cerebral hemispheres, cortical gyri folds, and inter-hemispheric firing synapses.

---

## [0.5.7] - 2026-08-27
### Authentic Horizontal LiDAR Scanline Hologram Rendering
- **Horizontal Light Slice Engine**:
  - Replaced triangular glyph particles with continuous **horizontal glowing scanline laser slices** (`ctx.stroke()` on horizontal segment arrays) matching the reference image.
  - Sliced across 85 vertical layers mapping head tilt, neck, chest volume, natural arm bend at side, pelvic contour, and walking stride with bent knee and heel push-off.
  - Saffron Amber (`#ffb829`) and Neon Cyan (`#22d3ee`) spark nodes positioned on the perimeter edges.
- **Dynamic 4-Stage Transitions**:
  - Hero (Scanlines facing Left) → Capabilities (180° Turn to Right) → Deep Memory (3D Handshake) → Cathedral CTA (3D Zorvik Logo).









### Copy Cleanup & Direct Feature Communication
- **Eliminated Backend Plumbing Jargon**:
  - Removed all database and infrastructure references (e.g. Upstash Redis, pgvector, circuit breaker, failover cascade).
  - Replaced with direct, customer-centric value propositions: **Sub-50ms Instant Streaming**, **Cross-Session Deep Memory**, **Nuance & Tone Intelligence**, and **3-Line Developer API**.
- **Purged Filler & AI Tropes**:
  - Removed AI buzzwords, verbose explanations, and placeholder captions across the landing page, GenZ playground, and workspace headers.
  - Streamlined disclaimer and model indicators for razor-sharp clarity.

## [0.4.2] - 2026-08-27
### Flagship Dala Style Reference Transformation
- **Pure Dala Landing Page Architecture**:
  - Two-column asymmetric hero: Left-aligned monolithic **78px–113px** weight-400 headline with `-0.04em` tracking, paired with **18px weight 200 (ultra-light)** body text.
  - Saffron Spark (`#ffb829`) kicker labels and single filled **Electric Iris (`#8052ff`)** 24px pill action CTA.
  - Signature Dala particle constellation brain visualization featuring hundreds of tiny outlined chromatic triangular particles drifting on a pure black void (`#000000`).
  - Strict zero-box design: content floats on void with generous whitespace and 2-column zigzag rhythm.

## [0.4.1] - 2026-08-27
### Bespoke Human Pointer & Swipe-to-Erase Physics + GenZ Intelligence Simulator
- **Interactive Cyber Human Pointer**:
  - Replaced generic sphere animation with an ultra-sleek, cyber-minimalist human silhouette pointing directly at the hero headline (*"Universal intelligence. Zero compromise."*).
  - **Swipe-to-Erase Particle Physics**: Swiping, dragging, or brushing over the figure physically erases the human into a cascading cloud of chromatic particles (Electric Iris, Neon Cyan, Saffron) that scatter and dissolve into the void with realistic velocity, gravity, and fade.
  - Added real-time erase percentage readout and instant re-manifestation controls.
- **Interactive GenZ Cultural Intelligence Simulator**:
  - Added live interactive playground on the landing page testing viral GenZ scenarios (*"Bro am I cooked?", "Quantum physics in GenZ", "Zero-cap career audit", "Rizz vs Logic game theory proof"*).
  - Demonstrates Zorvik AI's multi-layered subtext detection, slang synthesis, and KaTeX math formatting.
- **Enhanced `/app` Starter Prompts**:
  - Added one-click GenZ vibe audits and production API client generators directly in the `/app` workspace.

## [0.4.0] - 2026-08-27
### Architecture Decoupling & Flagship React Rebuild
- **Frontend/Backend Decoupling**:
  - Re-architected `Zorvik-AI` into dedicated decoupled `frontend/` (React + Vite + TypeScript + Tailwind) and `backend/` (Node.js Express microservice API).
  - Physical isolation of backend secrets from client bundles.
  - Express server in `backend/` serves API routes and seamlessly hosts production frontend builds from `frontend/dist/`.
- **Dala + ThoughtLab + Auros Editorial Design System**:
  - **Void Canvas (`#000000`)**: Complete elimination of boxy cards, drop-shadow elevation, and fake container borders.
  - **Sculptural Monolithic Typography**: Integrated `Inter` at weight 400 with aggressive negative tracking (`-0.04em`) for monumental display scale paired with ultra-light `300` body text on black.
  - **Chromatic Action Restraint**: Saturated Electric Iris (`#8052ff`) reserved exclusively for the primary CTA and send trigger.
  - **Removed Generic Captions**: Removed `"Interactive Neural Mesh · Move cursor to manipulate gravity"` and all AI-generated filler copy, letting the 3D particle constellation float on pure black velvet.
- **Enhanced `/app` Chat Workspace**:
  - **Weightless Sidebar**: Clean session management, live active indicators, and guest/account state management.
  - **Sculptural Welcome Hero**: Monolithic *"What shall we explore?"* header with 4 editorial starter prompts.
  - **Streamlined Message Stream**: Clean left-aligned assistant stream, inline KaTeX LaTeX math rendering, syntax-highlighted code blocks with live Copy functionality, and predictive autocomplete pill.
  - **Floating Hairline Input Dock**: Streamlined capsule with Auto, Casual, Deep Thinker, and Code mode selectors.

## [0.3.1] - 2026-08-27
### Fixed & Elevated
- **Chat Editor Stability (`/app`)**:
  - Fixed message input editor crash by restoring `#autocompleteHint` element and adding complete defensive null-guards across `script.js` (`handleSend`, `fetchAutocompleteThrottled`, `keydown`).
  - Added autofocus on textarea input upon message completion for fluid keyboard-first interaction.
- **3D Neural Constellation Elevation**:
  - Re-architected `initConstellationCanvas` to precisely match the user's uploaded signature visual (`media_1787828378219.png`).
  - Increased node density to 620+ dual-lobe brain/sphere Fibonacci particles with multi-chromatic palette (Electric Iris, Neon Cyan, Warm Saffron Amber, Hot Magenta, Sky Blue).
  - Implemented precomputed 3D spatial neighbor connectivity for smooth 60fps intricate synaptic wireframe mesh.
  - Added 38 outer ambient space dust particles and soft depth-of-field bokeh motes drifting in the deep void.
- **Scroll-Reveal Engine**:
  - Implemented high-performance `IntersectionObserver` scroll-reveal engine across all sections with subtle staggered transitions (`data-anim="fade-up"`).
- **Monumental Copywriting**:
  - Upgraded flagship landing hero headline to *"Universal intelligence. Zero compromise."* with refined subtext on pure black.

## [0.3.0] - 2026-08-27
### Changed & Overhauled
- **Complete `/app` UI Architectural Overhaul**:
  - **Zero-AI Sparkles Mandate**: Completely removed the purple sparkles AI badge and all Lucide sparkles icons across the entire platform (sidebar, welcome hero, message feed, and auth modals), replacing them with clean typographic brand lockups (`ZORVIK · AI`) and minimal monospace tags.
  - **6-Style Synthesis (Dala, ThoughtLab, Auros, Wispr Flow, Air, Aaru)**:
    - **Dala**: Monolithic weight-400 typography, pure black void canvas (`#000000`/`#04040a`), ultra-light body text (`#cccccc`), zero-shadow floating elements.
    - **ThoughtLab**: Strict zero-elevation architecture (eliminated chunky drop shadows, neon blur halos, and opaque containers). Primary action trigger uses Electric Iris (`#8052ff`) sparingly against the void.
    - **Auros**: Abyssal technical terminal feel with uppercase tracked monospace labels (`0.08em`–`0.12em`), telemetry indicators, and deep recessed carbon surfaces (`#080812`).
    - **Wispr Flow**: Editorial polish, clean rounded chambers (`border-radius: 16px–24px`), subtle live reasoning indicator dot, and clean flat borders.
    - **Air**: Minimalist glass-and-sky lightness, hairline borders (`1px solid rgba(255, 255, 255, 0.08)`), and typographic consistency.
    - **Aaru**: Scientific observatory precision, numbered annotations (`01 //`, `02 //`), and anti-decorative discipline.
  - **Sculptural Welcome Screen**: Replaced the chunky 2×2 icon grid with 4 sleek prompt chips featuring numbered indicators (`01`, `02`, `03`, `04`), categorical eyebrows (`SYNTHESIS`, `ENGINEERING`, `STRATEGY`, `COMMUNICATION`), and crisp typography.
  - **Minimalist Floating Input Area**: Streamlined into a floating capsule with hairline border, compact text-only mode chips (`Auto`, `Casual`, `Deep Thinker`, `Code`), and circular send button.
  - **Clean Message Bubbles**: Replaced clunky gradient avatar boxes with clean monospace identity badges (`Z·AI` in Iris, `YOU` in Frost) and weightless message surfaces.

## [0.2.2] - 2026-08-27
### Added & Synthesized
- **ThoughtLab Architectural Aesthetic**:
  - **Monumental Display Typography**: Increased hero and section title presence (`clamp(3rem, 5.8vw, 5.6rem)` with tight `0.96` leading and `-0.04em` negative letter-spacing).
  - **Ash (`#cccccc`) Body Text**: Glare-free soft optical copy tone across all body descriptions, cards, and subtexts on pure black canvas.
  - **Zero-Box Restraint Principle**: Converted feature and memory cards into transparent architectural frames with hairline borders and spatial breathing room instead of opaque container boxes.
  - **ThoughtLab Crimson Signal Switcher**: Integrated dual aesthetic switcher (`IRIS` vs `CRIMSON`) in the navigation bar. When toggled to Crimson, the primary action CTAs, brand glyph, live waveform bars, and 3D particle core dynamically ignite with `#fc1c46` (Crimson Signal) on pure black void.
  - **Dynamic 3D Particle Mesh**: Canvas particle engine dynamically updates its chromatic core in real time when toggling between Electric Iris and Crimson Signal modes.

## [0.2.1] - 2026-08-27
### Changed & Enhanced
- **Root Landing Architecture**: Guaranteed `index.html` as the default Flagship Landing Page for `/` and static hosts, with `app.html` serving `/app` and `/chat`.
- **Simplified Clean Chat Interface for Normal Users**: Redesigned `/app` into a clean, distraction-free conversational workspace (ChatGPT/Claude style) with friendly starter prompts, clean model pill, and zero internal telemetry clutter.
- **Customer-Facing Feature Focus**: Replaced internal infrastructure references with customer-centric features (Adaptive Reasoning, Sub-50ms Streaming, High-Dimensional Deep Memory).
- **Zorvik Enterprise API**: Replaced developer tenant jargon with the Zorvik Enterprise API showcase pointing to `https://zorviktech.com/contact`.
- **Interactive Animations**: Added pulsing reasoning waveform visualizer, hand-drawn SVG animated underline on display headlines, and background drifting ambient star dust.
- **Brand Ecosystem URL**: Updated all Zorvik Tech links and CORS origins to `https://zorviktech.com`.

## [0.2.0] - 2026-08-27
### Added
- **Flagship Landing Page**: Designed and deployed the official Zorvik AI landing page inspired by Dala, Auros, and Aaru design aesthetics.
  - **Void & Obsidian Architecture**: Deep Obsidian (`#050510`) and Void Black (`#000000`) flat canvas, bone white typography, Electric Iris (`#8052ff`) pill CTAs, Saffron Spark (`#ffb829`), and Neon Cyan (`#22d3ee`) telemetry accents.
  - **Living Neural Particle Constellation**: 60fps HTML5 Canvas particle system rendering 380+ 3D chromatic triangular nodes and synaptic filaments forming an organic neural brain with interactive cursor rotation, perspective projection, and elastic deflection.
  - **Interactive Circuit-Breaker Simulator**: Real-time visual playground demonstrating automated `<50ms` failover across Gemini 2.0 Flash, Groq Cloud (Llama 3.3 70B & DeepSeek R1), and OpenRouter with zero dropped context and $0 cost.
  - **Dual-Tier Memory Showcase**: Visual architecture breakdown of Upstash Redis sub-2ms hot sliding-window context and PostgreSQL `pgvector` 768-dimensional semantic recall.
  - **Dual-Intent Interactive Switcher**: Live playground demonstrating dynamic handling of GenZ cultural slang/emojis versus complex TypeScript engineering and mathematical proofs.
  - **Developer API Gateway Showcase**: Interactive multi-tenant code switcher with `cURL`, `JavaScript (Fetch)`, and `Python (requests)` tabs with one-click clipboard copying.
  - **Seamless Bi-Directional Routing**: Express routing serving `landing.html` at `/` and preserving full backward compatibility for the chat workspace at `/app` and `/chat`.
  - **Performance Benchmarks**: Shadowless instrument readout matrix with live health ping integration.

## [0.1.0] - 2026-08-27
### Added
- Initial release of the Zorvik AI standalone microservice and AI chat platform.
- **Standalone Microservice Architecture**: Decoupled Express/Node.js API gateway with dedicated endpoints (`/api/v1/chat`, `/api/v1/predict`, `/api/v1/models`, `/api/v1/health`, `/api/v1/tenants/verify`).
- **Dedicated Supabase Database Schema**: In-repo SQL migrations in `db/schema.sql` enabling `pgvector` for 768-dimensional semantic embeddings, `tbl_tenants`, `tbl_conversations`, and `tbl_messages`.
- **Hot Sliding Context & Rate Limiting**: Upstash Redis integration (`@upstash/redis`) for sub-2ms active session turn caching and edge sliding-window tenant rate-limiting.
- **Zero-Cost Multi-Model Cascade & Circuit Breaker**: Primary routing to Google Gemini 2.0 Flash with automatic $<50\text{ms}$ failover to Groq Cloud (Llama 3.3 70B, DeepSeek R1) and OpenRouter Free tier on rate limits or errors.
- **GenZ & Complex Reasoning Intelligence**:
  - GenZ slang and emoji nuance interpretation (💀, 😭, 💅, 🗿, rizz, cap, bet, lowkey, fr, ngl) delivering ultra-concise, punchy responses.
  - Complex engineering & logic directives generating verified syntax-highlighted code blocks and KaTeX formulas.
- **Tenant ID as API Key (`x-tenant-id`)**: Direct tenant authentication, per-call quota tracking, and custom system prompt overrides for Zorvik Studio, Zorvik-Tech, and external apps.
- **Cyber-Elegant Web Platform**:
  - Deep Obsidian (`#050510`), Neon Purple (`#9333ea`), Neon Cyan (`#22d3ee`) Glassmorphism 2.0 interface.
  - Frictionless guest access (ephemeral session UUID) + dedicated Supabase account login/signup.
  - Real-time Server-Sent Events (SSE) streaming, KaTeX math rendering, Prism code syntax highlighting with copy & run buttons, next-word autocomplete suggestions (Tab to complete).
  - Mode switcher (`⚡ Auto Router`, `🎯 Short & GenZ`, `🧠 Deep Thinker`, `💻 Code Wizard`).
- **DevOps & Governance**:
  - Strict ESLint 9 Flat Config (`eslint.config.js`) adhering to zero-warning policy.
  - Docker containerization (`Dockerfile`, `docker-compose.yml`) and Vercel serverless deployment (`vercel.json`).
  - Comprehensive documentation (`API_DOCS.md`, `HOW_TO_USE.md`, `RULES.md`, `README.md`).
