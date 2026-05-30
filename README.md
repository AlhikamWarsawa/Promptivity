<h1 align="center">Promptivity</h1>

<p align="center">

<p align="center">
  <img src="promptivity.png" alt="Logo" width="180">
</p>

> Tell your story. We build your mission.

Promptivity adalah AI powered productivity web app yang mengubah cerita user menjadi mission plan terstruktur menggunakan 15 framework produktivitas.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| UI Components | shadcn/ui + custom Promptivity components |
| Animation | Framer Motion |
| State | Zustand |
| Backend | FastAPI (Python) |
| AI Engine | Google Gemini API |
| Storage (MVP) | localStorage |
| Deploy | Google Cloud Run |

## Getting Started

### Frontend

```bash
cd pt-frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend

```bash
cd pt-backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
# Runs on http://localhost:8000
```

## Single-Container Deployment (Cloud Run)

Promptivity now supports a single Docker image that runs:

1. `FastAPI` on internal `127.0.0.1:8000`
2. `Next.js` on internal `127.0.0.1:3000`
3. `Nginx` on public `0.0.0.0:8080`

Routing inside the container:

1. `/api/*` -> FastAPI (`127.0.0.1:8000`)
2. `/` and all app routes -> Next.js (`127.0.0.1:3000`)

Because browser requests stay same-origin (`/api/...`), no frontend CORS config or `NEXT_PUBLIC_API_URL` is required.

### Local Docker test

```bash
docker build -t promptivity-single .
docker run --rm -p 8080:8080 \
  -e GEMINI_API_KEY=your_key \
  -e SECRET_KEY=your_secret \
  -e APP_ENV=production \
  promptivity-single
```

Then open:

1. `http://localhost:8080/`
2. `http://localhost:8080/health`
3. `http://localhost:8080/docs`

### Cloud Run deploy

```bash
gcloud run deploy promptivity \
  --source . \
  --region asia-southeast2 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --set-env-vars APP_ENV=production,SECRET_KEY=your_secret,GEMINI_API_KEY=your_key
```

Recommended: move `GEMINI_API_KEY` and `SECRET_KEY` to Secret Manager and wire them through Cloud Run secret env vars.

## 15 Productivity Frameworks

1. Getting Things Done (GTD)
2. Kanban
3. Time Blocking
4. Eat the Frog
5. Pomodoro Technique
6. Eisenhower Matrix
7. Systemist
8. The Medium Method
9. OKRs
10. Weekly Review
11. Commitment Inventory
12. SMART Goals
13. PARA Method
14. Attention Management (Deep Work)
15. Impact Optimization (Pareto)
