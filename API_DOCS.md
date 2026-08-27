# Zorvik AI — API Documentation

Welcome to the Zorvik AI Microservice API. Zorvik AI provides multi-model zero-cost routing, GenZ and complex task intelligence, sliding-window memory, and multi-tenant quota management.

---

## Base URL
```
http://localhost:3000/api/v1
```
(Or your deployed Vercel / Render domain, e.g. `https://ai.zorvik.com/api/v1`)

---

## Authentication & Headers

Zorvik AI uses **Tenant ID Authentication**. Pass your registered tenant ID in the headers of every request.

| Header | Required | Description |
| :--- | :--- | :--- |
| `x-tenant-id` | **Yes** | Authenticated tenant identifier (e.g. `zorvik-studio-prod`, `zorviktech-main`, `public-guest`). Acts as the API key. |
| `x-session-id` | Optional | Custom session UUID for multi-turn conversation memory continuity. |
| `Authorization` | Optional | `Bearer <token>` for authenticated Supabase user accounts. |

---

## Endpoints

### 1. Primary Chat Completion (`POST /chat`)

Generate an AI response using the zero-cost cascade router with intent intelligence and sliding-window memory.

#### Request Body
```json
{
  "prompt": "Write a debounce function in TypeScript with unit test",
  "mode": "code",
  "session_id": "session_12345",
  "stream": false
}
```

* `prompt` (string, required): The user query.
* `mode` (string, optional): One of `"auto"` (default), `"genz"`, `"deep"`, `"code"`, or `"creative"`.
* `session_id` (string, optional): Persistent conversation thread ID.
* `stream` (boolean, optional): Set to `true` for Server-Sent Events (SSE) token streaming.

#### Response (`200 OK`)
```json
{
  "response": "Here is the production-ready debounce function in TypeScript...",
  "model": "gemini-gemini-2.0-flash",
  "provider": "google",
  "mode": "code",
  "session_id": "session_12345",
  "tokens_estimated": 320,
  "latency_ms": 340,
  "tenant": {
    "id": "zorviktech-main",
    "name": "Zorvik-Tech Primary Platform"
  }
}
```

#### Response Headers
* `X-Model-Routed`: Actual model used (`gemini-2.0-flash`, `groq-llama-3.3-70b-versatile`, etc.)
* `X-RateLimit-Limit`: Maximum requests per minute allowed for this tenant.
* `X-RateLimit-Remaining`: Remaining requests in the current window.
* `X-RateLimit-Reset`: Seconds until window reset.

---

### 2. Autocomplete Suggestions (`POST /predict`)

Sub-5ms next-word and phrase completions for real-time Tab-completion in client inputs.

#### Request Body
```json
{
  "prompt": "how to build a react"
}
```

#### Response (`200 OK`)
```json
{
  "next_words": ["application", "with", "tailwind", "css"]
}
```

---

### 3. List Available Models (`GET /models`)

Retrieve the active zero-cost models and real-time circuit breaker health.

#### Response (`200 OK`)
```json
{
  "models": [
    {
      "id": "gemini-2.0-flash",
      "name": "Google Gemini 2.0 Flash",
      "provider": "Google AI Studio",
      "tier": "free",
      "status": "CLOSED"
    },
    {
      "id": "llama-3.3-70b-versatile",
      "name": "Meta Llama 3.3 70B",
      "provider": "Groq Cloud (500+ tok/s)",
      "tier": "free",
      "status": "CLOSED"
    },
    {
      "id": "deepseek-r1:free",
      "name": "DeepSeek R1 Reasoning Free",
      "provider": "OpenRouter",
      "tier": "free",
      "status": "CLOSED"
    }
  ]
}
```

---

### 4. Health & Telemetry (`GET /health`)

Check microservice uptime, provider circuits, and tenant association.

#### Response (`200 OK`)
```json
{
  "status": "healthy",
  "service": "zorvik-ai-microservice",
  "version": "0.1.0",
  "uptime_seconds": 1284,
  "tenant": "public-guest"
}
```

---

## Code Examples

### cURL
```bash
curl -X POST http://localhost:3000/api/v1/chat \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: zorviktech-main" \
  -d '{
    "prompt": "nah bro really said that 💀",
    "mode": "genz"
  }'
```

### JavaScript / TypeScript (Fetch)
```typescript
const response = await fetch('http://localhost:3000/api/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': 'zorvik-studio-prod',
  },
  body: JSON.stringify({
    prompt: 'Derive the quadratic formula and format in LaTeX',
    mode: 'deep',
  }),
});

const data = await response.json();
console.log(data.response);
```

### Python
```python
import requests

url = "http://localhost:3000/api/v1/chat"
headers = {
    "Content-Type": "application/json",
    "x-tenant-id": "zorviktech-main"
}
payload = {
    "prompt": "Write a clean binary search in Python",
    "mode": "code"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json()["response"])
```
