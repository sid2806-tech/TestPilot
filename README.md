# TestPilot AI
### Autonomous Software Testing & Quality Intelligence

[![Built for: Build Beyond AI Hackathon](https://img.shields.io/badge/Hackathon-Build%20Beyond%20AI-cyan)](https://buildwithgemini.dev)
[![Stack: Gemini + Firebase + Playwright](https://img.shields.io/badge/Stack-Gemini%20%7C%20Firebase%20%7C%20Playwright-blue)](https://github.com)

> **"Every Test. Every Failure. Under Control."**

TestPilot AI is a production-minded web application that transforms natural-language testing requirements into executed browser tests, captured evidence, and AI-analyzed failure reports — all secured by Firebase and powered by Google Gemini.

---

## Architecture

```
Frontend (React + Vite)          Backend (FastAPI + Python)
├── Firebase Auth (client)   →   ├── Token verification (Admin SDK)
├── Gemini test generation   →   ├── Gemini API (structured output)
├── Real-time SSE stream     ←   ├── Playwright execution engine
└── Firestore read (client)  →   └── Firestore write (Admin SDK)
                                     ↓
                              Google Cloud Run
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Recharts, GSAP |
| Backend | Python 3.12, FastAPI, Pydantic v2 |
| AI | Google Gemini 1.5 Flash |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Browser Automation | Playwright for Python (Chromium) |
| Deployment | Google Cloud Run, Docker |
| Storage | Google Cloud Storage (optional) |

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.12+
- Git
- A Firebase project ([console.firebase.google.com](https://console.firebase.google.com))
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com))

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd PromptWar

# Copy env template
cp .env.example .env
# Edit .env with your real credentials
```

### 2. Firebase setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Authentication** → Email/Password sign-in
3. Enable **Firestore Database** → Start in production mode
4. Deploy security rules: `firebase deploy --only firestore:rules`
5. Go to Project Settings → Service Accounts → Generate new private key → save as `serviceAccountKey.json`
6. Go to Project Settings → General → Your apps → Add web app → copy config to `.env`

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium

# Run
uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### 5. Demo site

```bash
cd demo-site
# Serve with any static server
npx serve . -p 3001
# OR use the docker-compose setup
```

### 6. Docker Compose (all-in-one)

```bash
# Set env vars in .env, then:
docker-compose up --build
```

---

## Google Gemini Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. Add to `.env`: `GEMINI_API_KEY=your-key-here`
4. The backend uses `gemini-1.5-flash` by default (configurable via `GEMINI_MODEL`)

**The API key is never exposed to the frontend.**

---

## Firebase Configuration

### Frontend (VITE_ vars in `.env`)
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Backend (service account)
```
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```
Or for Cloud Run, use `FIREBASE_SERVICE_ACCOUNT_JSON` with the JSON string as a secret.

---

## Deployment to Google Cloud Run

### Backend

```bash
cd backend

# Build and push image
gcloud builds submit --tag gcr.io/YOUR_PROJECT/testpilot-backend

# Deploy
gcloud run deploy testpilot-backend \
  --image gcr.io/YOUR_PROJECT/testpilot-backend \
  --platform managed \
  --region us-central1 \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest,FIREBASE_SERVICE_ACCOUNT_JSON=firebase-sa:latest" \
  --set-env-vars "ALLOWED_ORIGINS=https://your-frontend-domain.com" \
  --allow-unauthenticated
```

### Frontend

```bash
cd frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

---

## Running Tests

```bash
cd backend
pip install pytest
pytest tests/ -v
```

---

## Application Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Register |
| `/forgot-password` | Password reset |
| `/app` | Dashboard |
| `/app/projects` | Project list |
| `/app/projects/new` | Create project |
| `/app/new-test` | Configure & generate test |
| `/app/runs` | Test execution history |
| `/app/runs/:runId` | Live execution view + results |
| `/app/bugs` | Failure reports |
| `/app/analytics` | Quality analytics |
| `/app/settings` | Account + demo controls |

---

## Demo Walkthrough

1. Open `http://localhost:5173` — land on the TestPilot homepage
2. Click **Get Started** → create an account
3. Go to **Projects** → create a project with domain `localhost`
4. Go to **New Test**:
   - Select your project
   - URL: `http://localhost:3001`
   - Requirements: "Verify that a user can log in with valid credentials and is redirected to the dashboard. Verify that invalid credentials show an error."
   - Click **Generate Test Plan**
5. Review the AI-generated test cases
6. Click **Approve & Execute**
7. Watch the live execution timeline (Settings → Demo → Enable Bug = ON to trigger failure)
8. View the failure evidence and AI analysis in **Failures**
9. Go to Settings → **Disable Bug**
10. Re-run the test → verify all cases pass
11. Download the PDF/CSV/JSON report

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Auth token verification | Firebase Admin SDK — every API request |
| Resource ownership | `owner_id` checked server-side, never from request body |
| SSRF prevention | Private IP blocking, DNS resolution check, approved-domain allow-list |
| Browser sandboxing | Isolated context per test case, navigation restricted to approved domains |
| AI allow-list | Only 15 defined action types; no code execution |
| Secret management | API keys in env vars only — never in frontend code |
| Security headers | X-Content-Type-Options, X-Frame-Options, Referrer-Policy |
| Input validation | Pydantic schemas on all endpoints |
| Error handling | Generic messages to clients; detail in server logs only |
| Firestore rules | Ownership enforced at database layer too |

### Known Limitations

- Browser tests run in the same process as the API server (production should use separate workers)
- Screenshot storage uses local disk (production: Cloud Storage with signed URLs)
- No rate limiting beyond per-request timeout caps (production: add Redis-backed rate limiter)
- SSE token passed as query parameter (production: use cookie or header-based approach)
- Demo bug toggle is process-level state (not persisted across restarts)

---

## Project Structure

```
PromptWar/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route-level components
│   │   ├── components/     # Reusable UI
│   │   ├── contexts/       # AuthContext
│   │   ├── lib/            # Firebase, API client
│   │   └── index.css       # Design system
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/v1/         # FastAPI routers
│   │   ├── core/           # Config, auth, URL security
│   │   ├── schemas/        # Pydantic models
│   │   └── services/       # Gemini, Playwright, Firestore
│   ├── tests/              # pytest suite
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
├── demo-site/
│   └── index.html          # Self-contained demo app
├── firestore.rules
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## License

Built for the **"Build Beyond AI: Engineer Secure, Intelligent and Autonomous Applications"** hackathon.
