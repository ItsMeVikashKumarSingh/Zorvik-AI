# Zorvik AI — How to Use & Setup Guide

This guide walks you through setting up, configuring, running, and integrating the Zorvik AI standalone microservice.

---

## 1. Quick Start (Local Development)

### Step 1: Install Dependencies
```bash
cd Zorvik-AI
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` (or edit the created `.env` file):
```bash
cp .env.example .env
```

Open `.env` and fill in your zero-cost API keys:
* **`GEMINI_API_KEY`**: Obtain for free from [Google AI Studio](https://aistudio.google.com/).
* **`GROQ_API_KEY`** (Optional fallback): Free from [Groq Console](https://console.groq.com/).
* **`OPENROUTER_API_KEY`** (Optional fallback): Free from [OpenRouter](https://openrouter.ai/).

*(Note: If you run without API keys, the built-in intelligent fallback engine will respond safely for testing).*

### Step 3: Run the Server
```bash
npm run dev
```

Visit the interactive Cyber-Elegant web UI at:
```
http://localhost:3000
```

---

## 2. Dedicated Supabase Setup (PostgreSQL + pgvector)

To enable persistent cloud conversations, user authentication, and semantic long-term memory:

1. Create a **dedicated new Supabase project** (e.g. `zorvik-ai-prod`).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open [`Zorvik-AI/db/schema.sql`](file:///c:/Users/vikas/OneDrive/Desktop/projects/zorvik-tech/Zorvik-AI/db/schema.sql) and paste its entire contents into the SQL Editor.
4. Click **Run**. This will:
   * Enable the `vector` extension.
   * Create `tbl_tenants`, `tbl_conversations`, `tbl_messages`, and `tbl_tenant_usage`.
   * Create the HNSW index and the `match_messages` semantic similarity function.
   * Seed the default tenants (`public-guest`, `zorvik-studio-prod`, `zorviktech-main`, `zconnect-service`).
5. Copy your Project URL and Anon/Service Role Keys from **Project Settings -> API** into your `.env`:
   ```env
   AI_SUPABASE_URL=https://your-project.supabase.co
   AI_SUPABASE_ANON_KEY=your-anon-key
   AI_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

---

## 3. Upstash Redis Setup (Hot Sliding Memory & Rate Limiting)

1. Create a free Redis database at [Upstash](https://console.upstash.com/).
2. Copy the REST URL and Token into `.env`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-upstash-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

---

## 4. Connecting Zorvik Studio or Zorvik-Tech

To integrate Zorvik AI into Zorvik Studio or Zorvik-Tech, simply call the Zorvik AI endpoint using `fetch`:

```typescript
// Example inside Zorvik Studio
const response = await fetch('http://localhost:3000/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'zorvik-studio-prod',
  },
  body: JSON.stringify({
    prompt: 'Help me compose a cyberpunk video edit intro description',
    mode: 'auto',
  }),
});

const result = await response.json();
console.log(result.response);
```

---

## 5. Deployment

### Deploying to Vercel (Zero-Cost Serverless)
1. Install the Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Add the environment variables from `.env` into the Vercel Project Settings.
4. Deploy to production: `vercel --prod`

### Deploying with Docker
```bash
docker-compose up -d --build
```
The microservice will be available at port `3000`.
