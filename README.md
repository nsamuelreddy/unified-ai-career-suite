# Unified AI Career Suite

A modern full-stack web application that provides AI-powered career coaching, resume analysis, and mock interview preparation using FastAPI (Python) backend and React (Vite) + Tailwind CSS frontend.

## Features

- **AI Career Coach**: Chat with an AI expert for career guidance, resume tips, and job search strategies
- **Resume Analyzer**: Upload PDFs or TXT files to get instant AI feedback on ATS compatibility, keywords, and impact
- **Mock Interviewer**: Practice interviews with structured feedback
- **Modern UI**: Sleek SaaS-style dashboard with floating chat widget

## Tech Stack

### Backend
- FastAPI (Python)
- Google Gemini 2.5 Flash AI
- Pydantic for validation
- Uvicorn ASGI server

### Frontend
- React 18
- Vite
- Tailwind CSS
- PDF.js for client-side PDF extraction

## Local Development

### Prerequisites
- Python 3.9+
- Node.js 16+
- Gemini API Key from [Google AI Studio](https://aistudio.google.com)

### Backend Setup

```bash
cd c:\Users\nsamuelreddy\Downloads\chatgpt
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
$env:GEMINI_API_KEY="your-key-here"
python main.py
```

Backend runs on `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

## Environment Variables

**Backend (.env):**
```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=8000
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

**Frontend (.env.local):**
```
VITE_API_BASE_URL=http://localhost:8000
```

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Go to [Render.com](https://render.com)
3. Create new Web Service
4. Select repository
5. Settings:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port 8000`
   - Environment: Add `GEMINI_API_KEY`
6. Deploy

### Frontend (Vercel)

1. Go to [Vercel.com](https://vercel.com)
2. Import GitHub repository
3. Framework: Vite
4. Root Directory: `frontend`
5. Environment: Add `VITE_API_BASE_URL` = your Render backend URL
6. Deploy

## Project Structure

```
chatgpt/
├── main.py                 # FastAPI backend
├── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── ResumeAnalyzer.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
└── README.md
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/chat` - Chat with AI Career Coach
- `POST /api/analyze-resume` - Analyze resume with Gemini

## Security Notes

⚠️ **Important**: Never commit your API keys to Git.

- Use environment variables for all secrets
- Rotate API keys after exposure
- Keep `.env` files in `.gitignore`

## License

MIT
