Tokenization Server
The Tokenization Server is a FastAPI-based backend for the Zorvik AI project, hosted on Vercel. It provides next-word prediction and prompt storage capabilities, powering the predictive text feature in the Zorvik AI frontend. The server uses Firebase Firestore to store user prompts and trigram data for generating word suggestions.
Features

Next-Word Prediction: Predicts up to five subsequent words based on the last two words of input using trigram data (/predict endpoint).
Prompt Storage: Stores user prompts and their trigrams in Firebase Firestore for future predictions (/store endpoint).
CORS Support: Allows cross-origin requests, enabling integration with the Zorvik AI frontend.
Vercel Deployment: Optimized for serverless deployment with automatic routing (vercel.json).

Project Structure
tokenization-server/
├── README.md
├── requirements.txt      # Python dependencies
├── vercel.json           # Vercel configuration
├── api/
│   ├── __init__.py
│   ├── main.py           # FastAPI application with /predict and /store endpoints
│   ├── predict.py        # Logic for next-word prediction
│   ├── firebase_utils.py # Firebase Firestore integration

Prerequisites

Python 3.8+
Firebase account with Firestore enabled
Vercel account for deployment
Environment variable FIREBASE_CREDENTIALS with Firebase service account JSON

Setup Instructions

Clone the Repository:
git clone https://github.com/ItsMeVikashKumarSingh/Zorvik-AI.git    
cd tokenization-server


Install Dependencies:
pip install -r requirements.txt

The requirements.txt includes:

fastapi
uvicorn
firebase-admin

Additional dependencies (install manually if needed):
pip install pydantic python-dotenv


Configure Firebase:

Create a Firebase project and enable Firestore.
Download the service account key as JSON.
Set the FIREBASE_CREDENTIALS environment variable:export FIREBASE_CREDENTIALS='{"type": "service_account", ...}'

Alternatively, set it in a .env file or Vercel’s dashboard.


Run Locally:
uvicorn api.main:app --reload

The server will be available at http://localhost:8000. Access the root endpoint (/) for API status.

Deploy to Vercel:

Ensure vercel.json is in the root of tokenization-server.
Push the directory to a Git repository.
Run:vercel --prod


In Vercel’s dashboard, set the FIREBASE_CREDENTIALS environment variable.
The API will be available at https://your-vercel-domain/api.



Vercel Configuration
The vercel.json file configures the Vercel deployment:

Build: Uses @vercel/python to build api/main.py.
Routes:
/: Maps to api/main.py (root endpoint).
/predict: Handles next-word prediction requests.
/store: Handles prompt storage requests.
/(.*): Catch-all route for other paths.



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

Endpoints
POST /predict
Predicts the next words based on the input prompt.

Request:{"prompt": "hello world"}


Response:{"next_words": ["how", "are", "you"]}


Errors:
400: Empty or invalid prompt.
500: Server error during prediction.



POST /store
Stores the prompt and its trigrams in Firebase Firestore.

Request:{"prompt": "hello world"}


Response:{"status": "stored"}


Errors:
400: Empty prompt.
500: Storage error.



GET /
Returns API status and endpoint information.

Response:{
  "status": "OK",
  "message": "Welcome to the Banking Prediction API!",
  "endpoints": {
    "/predict": "POST - Predict the next words for a given prompt",
    "/store": "POST - Store a prompt in Firebase"
  },
  "firebase_configured": true
}



Example API Requests
# Predict next words
curl -X POST https://your-vercel-domain/api/predict \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'

# Store a prompt
curl -X POST https://your-vercel-domain/api/store \
  -H "Content-Type: application/json" \
  -d '{"prompt": "hello world"}'

# Check API status
curl https://your-vercel-domain/api

Dependencies
From requirements.txt:

fastapi: API framework.
uvicorn: ASGI server.
firebase-admin: Firebase Firestore integration.

Additional dependencies:

pydantic: Data validation for FastAPI models.
python-dotenv: Environment variable management (optional for local development).

Notes

The server is designed for the Zorvik AI frontend, accessible at https://predict-iota.vercel.app (as referenced in script.js).
The /tokenize endpoint mentioned in the original README.md is not implemented in the provided code. The current endpoints are /predict and /store.
Ensure Firebase Firestore rules allow writes to the prompts and prompts_trigrams collections.

Contributing

Fork the repository.
Create a feature branch (git checkout -b feature/your-feature).
Commit changes (git commit -m "Add your feature").
Push to the branch (git push origin feature/your-feature).
Open a pull request.

License
[Add your license here, e.g., MIT License]
Contact
For support, contact Team Zorvik at [vikashkumarsingh8352@gmail.com].
