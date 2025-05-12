# Zorvik AI

Zorvik AI is a web-based AI chat application that combines a sleek, interactive frontend with a powerful backend. The frontend, built with HTML, CSS, and JavaScript, integrates with the Gemini API for intelligent responses. The backend, a FastAPI-based tokenization server hosted on Vercel, provides next-word prediction and prompt storage using Firebase Firestore. This project supports rich text formatting, code snippets, and LaTeX-rendered mathematical formulas, offering a seamless user experience.

## Features

* **AI-Powered Chat**: Engage with Zorvik AI via a responsive chat interface, powered by the Gemini API.
* **Next-Word Prediction**: Real-time text suggestions using a custom tokenization server (`/predict` endpoint).
* **Prompt Storage**: Store user prompts and trigram data in Firebase for improved predictions (`/store` endpoint).
* **Code and Commands**: Display and copy code snippets or shell commands with syntax highlighting.
* **Mathematical Formulas**: Render LaTeX formulas using KaTeX for technical responses.
* **Responsive UI**: Modern, dark-themed interface with animations, built with Poppins and Roboto fonts.
* **Vercel-Hosted Backend**: Serverless deployment of the tokenization server with CORS support.

## Project Structure

```
Zorvik-AI/
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
```

## Prerequisites

### Frontend:

* Modern web browser (e.g., Chrome, Firefox)
* Internet access for CDN dependencies

### Backend:

* Python 3.8+
* Firebase account with Firestore enabled
* Vercel account for hosting the tokenization server

### Services:

* Gemini API key for AI responses
* Firebase service account JSON for prompt storage

## Setup Instructions

### Frontend

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/ItsMeVikashKumarSingh/Zorvik-AI.git
   cd Zorvik-AI
   ```

2. **Update API Key:**
   Open `config.js` and replace the API\_KEY placeholder:

   ```javascript
   API_KEY: 'your-gemini-api-key'
   ```

3. **Serve the Frontend:**

   ```bash
   python -m http.server 8000
   ```

   Or deploy to a hosting service (e.g., Netlify, Vercel).

   Open [http://localhost:8000](http://localhost:8000) in a browser.

### Tokenization Server

1. **Navigate to Server Directory:**

   ```bash
   cd tokenization-server
   ```

2. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   pip install pydantic python-dotenv
   ```

3. **Configure Firebase:**

   * Create a Firebase project and enable Firestore.
   * Download the service account key as JSON.
   * Set the environment variable:

     ```bash
     export FIREBASE_CREDENTIALS='{"type": "service_account", ...}'
     ```

4. **Run Locally (Optional):**

   ```bash
   uvicorn api.main:app --reload
   ```

   Access at [http://localhost:8000](http://localhost:8000)

5. **Deploy to Vercel:**

   * Ensure `vercel.json` is present in `tokenization-server`.
   * Push the `tokenization-server` directory to a Git repository.
   * Deploy:

     ```bash
     vercel --prod
     ```
   * Set `FIREBASE_CREDENTIALS` in Vercel’s dashboard.

## Vercel Configuration

The `vercel.json` in `tokenization-server/` configures the serverless deployment:

```json
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
```

## Usage

### Access the Application

* Open the frontend in a browser.
* Type a question in the textarea and click "Send" or press Enter.

### Next-Word Prediction

* As you type, suggestions appear (powered by `https://your-vercel-domain/api/predict`).
* Press Tab to accept a suggestion.

### View Responses

* Responses may include text, code, or formulas.
* Copy buttons are available for code/commands.

### API Endpoints

#### GET /

Check API status:

```json
{
  "status": "OK",
  "message": "Welcome to the Banking Prediction API!",
  "endpoints": { ... },
  "firebase_configured": true
}
```

#### POST /predict

Request:

```json
{"prompt": "hello world"}
```

Response:

```json
{"next_words": ["how", "are", "you"]}
```

#### POST /store

Request:

```json
{"prompt": "hello world"}
```

Response:

```json
{"status": "stored"}
```

## Example API Requests

```bash
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
```

## Dependencies

### Frontend:

* KaTeX (0.16.4) for formula rendering
* Marked (latest) for Markdown parsing
* DOMPurify (2.4.9) for HTML sanitization
* Poppins and Roboto fonts via Google Fonts

### Backend:

* `fastapi`: API framework
* `uvicorn`: ASGI server
* `firebase-admin`: Firestore integration
* `pydantic`: Data validation
* `python-dotenv`: Environment variables (optional)

## Notes

* The tokenization server is accessible at `https://predict-iota.vercel.app` (as referenced in `script.js`).
* The original `tokenization-server/README.md` mentioned a `/tokenize` endpoint, which is not implemented. The active endpoints are `/predict` and `/store`.
* Ensure Firebase Firestore rules allow writes to `prompts` and `prompts_trigrams` collections.

## Contributing

1. Fork the repository
2. Create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```
3. Commit changes:

   ```bash
   git commit -m "Add your feature"
   ```
4. Push to the branch:

   ```bash
   git push origin feature/your-feature
   ```
5. Open a pull request

## License

\[Add your license here, e.g., MIT License]

## Contact

For support, contact Team Zorvik at \[insert contact email or link].
