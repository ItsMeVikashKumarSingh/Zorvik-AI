Zorvik AI
Zorvik AI is a web-based AI chat application that combines a sleek, interactive frontend with a powerful backend. The frontend, built with HTML, CSS, and JavaScript, integrates with the Gemini API for intelligent responses. The backend, a FastAPI-based tokenization server hosted on Vercel, provides next-word prediction and prompt storage using Firebase Firestore. This project supports rich text formatting, code snippets, and LaTeX-rendered mathematical formulas, offering a seamless user experience.
Features

AI-Powered Chat: Engage with Zorvik AI via a responsive chat interface, powered by the Gemini API.
Next-Word Prediction: Real-time text suggestions using a custom tokenization server (/predict endpoint).
Prompt Storage: Store user prompts and trigram data in Firebase for improved predictions (/store endpoint).
Code and Commands: Display and copy code snippets or shell commands with syntax highlighting.
Mathematical Formulas: Render LaTeX formulas using KaTeX for technical responses.
Responsive UI: Modern, dark-themed interface with animations, built with Poppins and Roboto fonts.
Vercel-Hosted Backend: Serverless deployment of the tokenization server with CORS support.

Project Structure
├── README.md
├── config.js              # Gemini API configuration
├── index.html             # Frontend HTML
├── script.js              # Frontend logic for chat and predictions
├── styles.css             # Frontend styling
├── tokenization-server/
│   ├── README.md          # Tokenization server documentation
│   ├── requirements.txt   # Python dependencies
│   ├── vercel.json        # Vercel deployment configuration
│   ├── api/
│   │   ├── __init__.py
│   │   ├── main.py        # FastAPI server for /predict and /store
│   │   ├── predict.py     # Next-word prediction logic
│   │   ├── firebase_utils.py # Firebase Firestore integration

Prerequisites

Frontend:
Modern web browser (e.g., Chrome, Firefox)
Internet access for CDN dependencies


Backend:
Python 3.8+
Firebase account with Firestore enabled
Vercel account for hosting the tokenization server


Services:
Gemini API key for AI responses
Firebase service account JSON for prompt storage



Setup Instructions
Frontend

Clone the Repository:git clone https://github.com/ItsMeVikashKumarSingh/Zorvik-AI.git   
cd Zorvik-AI


Update API Key:
Open config.js and replace the API_KEY placeholder with your Gemini API key:API_KEY: 'your-gemini-api-key'




Serve the Frontend:
Use a local server:python -m http.server 8000


Or deploy to a hosting service (e.g., Netlify, Vercel).
Open http://localhost:8000 in a browser.



Tokenization Server

Navigate to Server Directory:cd tokenization-server


Install Dependencies:pip install -r requirements.txt

Dependencies from requirements.txt:
fastapi
uvicorn
firebase-adminAdditional dependencies:

pip install pydantic python-dotenv


Configure Firebase:
Create a Firebase project and enable Firestore.
Download the service account key as JSON.
Set the FIREBASE_CREDENTIALS environment variable:export FIREBASE_CREDENTIALS='{"type": "service_account", ...}'




Run Locally (Optional):uvicorn api.main:app --reload

Access at http://localhost:8000.
Deploy to Vercel:
Ensure vercel.json is present in tokenization-server.
Push the tokenization-server directory to a Git repository.
Run:vercel --prod


Set FIREBASE_CREDENTIALS in Vercel’s dashboard.
The API will be available at https://your-vercel-domain/api.



Vercel Configuration
The vercel.json in tokenization-server configures the serverless deployment:

Build: Uses @vercel/python to build api/main.py.
Routes:
/: API status.
/predict: Next-word prediction.
/store: Prompt storage.
/(.*): Catch-all for other paths.



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

Usage

Access the Application:
Open the frontend in a browser.
Type a question in the textarea and click "Send" or press Enter.


Next-Word Prediction:
As you type, suggestions appear (powered by https://your-vercel-domain/api/predict).
Press Tab to accept a suggestion.


View Responses:
Responses include text, code, or formulas, with copy buttons for code/commands.


API Endpoints:
GET /: API status.{
  "status": "OK",
  "message": "Welcome to the Banking Prediction API!",
  "endpoints": {...},
  "firebase_configured": true
}


POST /predict: Predict next words.{"prompt": "hello world"}

Response:{"next_words": ["how", "are", "you"]}


POST /store: Store prompt in Firebase.{"prompt": "hello world"}

Response:{"status": "stored"}





Example API Requests
# Check API status
curl https://your-vercel-domain/api

# Predict next words
curl -X POST https://your-vercel-domain/api/predict \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'

# Store a prompt
curl -X POST https://your-vercel-domain/api/store \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'

Dependencies

Frontend:
KaTeX (0.16.4) for formula rendering
Marked (latest) for Markdown parsing
DOMPurify (2.4.9) for HTML sanitization
Poppins and Roboto fonts via Google Fonts


Backend (from requirements.txt):
fastapi: API framework
uvicorn: ASGI server
firebase-admin: Firestore integration
pydantic: Data validation
python-dotenv: Environment variables (optional)



Notes

The tokenization server is accessible at https://predict-iota.vercel.app (as referenced in script.js).
The original tokenization-server/README.md mentioned a /tokenize endpoint, which is not implemented. The active endpoints are /predict and /store.
Ensure Firebase Firestore rules allow writes to prompts and prompts_trigrams collections.

Contributing

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
[Add your license here, e.g., MIT License]
Contact
For support, contact Team Zorvik at [insert contact email or link].
