Zorvik AI
Zorvik AI is a web-based AI chat application that merges an interactive frontend with a powerful backend. It features Gemini API-powered responses, next-word prediction, and Firebase-based prompt storage — all within a sleek, responsive UI.

🚀 Features
AI-Powered Chat: Responsive interface backed by the Gemini API.

Next-Word Prediction: Real-time suggestions via a FastAPI server (/predict endpoint).

Prompt Storage: Store prompts and trigram data in Firebase (/store endpoint).

Code & Commands: Syntax-highlighted code snippets with copy buttons.

Math Support: Render LaTeX formulas using KaTeX.

Responsive UI: Clean, dark-themed UI with Google Fonts (Poppins, Roboto).

Serverless Backend: FastAPI server deployed to Vercel with full CORS support.

📁 Project Structure
bash
Copy
Edit
Zorvik-AI/
├── README.md
├── config.js              # Gemini API configuration
├── index.html             # Frontend HTML
├── script.js              # Chat & prediction logic
├── styles.css             # UI styling
├── tokenization-server/
│   ├── README.md
│   ├── requirements.txt   # Python dependencies
│   ├── vercel.json        # Vercel config
│   └── api/
│       ├── __init__.py
│       ├── main.py        # FastAPI entry point
│       ├── predict.py     # Prediction logic
│       └── firebase_utils.py # Firebase Firestore helper
🔧 Prerequisites
Frontend
Modern web browser (Chrome, Firefox, etc.)

Internet access for CDN dependencies

Backend
Python 3.8+

Firebase project with Firestore enabled

Vercel account for deployment

Services
Gemini API key

Firebase service account JSON

⚙️ Setup Instructions
🔹 Frontend
Clone the Repository

bash
Copy
Edit
git clone https://github.com/ItsMeVikashKumarSingh/Zorvik-AI.git
cd Zorvik-AI
Update API Key
Edit config.js and replace:

js
Copy
Edit
API_KEY: 'your-gemini-api-key'
Serve Locally

bash
Copy
Edit
python -m http.server 8000
Visit: http://localhost:8000

Or deploy to Netlify/Vercel/etc.

🔹 Tokenization Server
Navigate to Directory

bash
Copy
Edit
cd tokenization-server
Install Dependencies

bash
Copy
Edit
pip install -r requirements.txt
pip install pydantic python-dotenv
Configure Firebase

Create a Firebase project, enable Firestore.

Download service account JSON.

Set the environment variable:

bash
Copy
Edit
export FIREBASE_CREDENTIALS='{"type": "service_account", ...}'
Run Locally (Optional)

bash
Copy
Edit
uvicorn api.main:app --reload
Visit: http://localhost:8000

Deploy to Vercel

Ensure vercel.json exists.

Push the tokenization-server/ folder to a Git repo.

Run:

bash
Copy
Edit
vercel --prod
Add FIREBASE_CREDENTIALS to Vercel’s Environment Variables.

🌐 Vercel Configuration
vercel.json:

json
Copy
Edit
{
  "version": 2,
  "builds": [
    {
      "src": "api/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {"src": "/", "dest": "/api/main.py"},
    {"src": "/predict", "dest": "/api/main.py"},
    {"src": "/store", "dest": "/api/main.py"},
    {"src": "/(.*)", "dest": "/api/main.py"}
  ]
}
💬 Usage
Frontend
Open in browser.

Type your message and press Enter or click Send.

Suggestions appear as you type (from /predict endpoint).

Press Tab to accept suggestions.

Response Output
Includes text, code, or LaTeX.

Code blocks and commands have copy buttons.

🧪 API Endpoints
GET /
Check API status.

json
Copy
Edit
{
  "status": "OK",
  "message": "Welcome to the Banking Prediction API!",
  "endpoints": {...},
  "firebase_configured": true
}
POST /predict
Predict next words:

json
Copy
Edit
{"prompt": "hello world"}
Response:

json
Copy
Edit
{"next_words": ["how", "are", "you"]}
POST /store
Store prompt in Firebase:

json
Copy
Edit
{"prompt": "hello world"}
Response:

json
Copy
Edit
{"status": "stored"}
📦 Example API Requests
bash
Copy
Edit
# Check status
curl https://your-vercel-domain/api

# Predict
curl -X POST https://your-vercel-domain/api/predict \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'

# Store
curl -X POST https://your-vercel-domain/api/store \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'
📚 Dependencies
Frontend
KaTeX – formula rendering (v0.16.4)

Marked – Markdown parsing

DOMPurify – HTML sanitization

Google Fonts: Poppins & Roboto

Backend
fastapi – API framework

uvicorn – ASGI server

firebase-admin – Firebase SDK

pydantic – Data validation

python-dotenv – Optional env support

📌 Notes
Tokenization server is live at:
https://predict-iota.vercel.app (referenced in script.js).

Endpoint /tokenize is not implemented; only /predict and /store are active.

Ensure Firestore rules permit writes to prompts and prompts_trigrams.

🤝 Contributing
Fork the repository.

Create a feature branch:
git checkout -b feature/your-feature

Commit changes:
git commit -m "Add your feature"

Push to GitHub:
git push origin feature/your-feature

Open a Pull Request.

📄 License
[Add your license here, e.g., MIT License]

📬 Contact
For questions or support, contact Team Zorvik
📧 [insert contact email or support link]

