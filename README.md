# PT — Promptivity

> Tell your story. We build your mission.

PT adalah AI-powered productivity web app yang mengubah cerita user menjadi mission plan terstruktur menggunakan 13 framework produktivitas.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| UI Components | shadcn/ui + custom PT components |
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

## Project Structure

See architecture documentation in `/docs/` (coming soon).

## 13 Productivity Frameworks

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

## Build Plan

30-day build plan documented in `docs/30-day-plan.md`.
