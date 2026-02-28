# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

General-purpose AI Sales Copilot for B2B semiconductor equipment and factory automation sales. Full-stack app with React frontend + FastAPI backend, featuring AI-driven market signal scanning, pain point extraction, and outreach automation. Target industries: wafer fab, advanced packaging, display, factory automation.

## Development Commands

### Frontend (React 19 + Vite, port 5173)
```bash
cd frontend
npm install
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint check
```

### Backend (FastAPI + SQLite, port 8000)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env              # Add Tavily, Gemini, OpenAI keys
alembic upgrade head              # Apply DB migrations
PYTHONPATH=. python scripts/seed.py  # Seed sample data
uvicorn app.main:app --reload     # Start API server
```

### Tests
```bash
cd backend
pytest                           # All tests
pytest -v tests/test_signals.py  # Single module
```

### CLI (alternative to API)
```bash
cd backend
PYTHONPATH=. python copilot.py list-accounts
PYTHONPATH=. python copilot.py scan-signals --account 1 --lookback 90
PYTHONPATH=. python copilot.py demo-report --account 1
```

## Architecture

### Frontend (`/frontend/src/`)
- **Routing**: React Router v7, 8 routes under a `<Layout>` wrapper in `App.jsx`
- **API Layer**: Proxy pattern in `services/api.js` — checks `localStorage.getItem('DATA_SOURCE_MODE')` to route calls to either `services/mockApi.js` (default) or real backend at `http://localhost:8000/api/v1`
- **State**: Local React hooks only, no Redux/Zustand
- **Styling**: Plain CSS with custom properties in `styles/variables.css`; no Tailwind

Pages: Dashboard, AccountList, AccountDetail, Signals (Market Radar), Pains, Outreach, Pipeline, Settings

### Backend (`/backend/app/`)
- **Routers** in `api/routes/`: health, accounts, contacts, signals, pain_profiles, outreach, interactions, bant, pipeline — all mounted under `/api/v1`
- **Services** in `services/`: business logic separated from routes; key services: `market_radar.py` (Tavily search), `pain_extractor.py`, `outreach_generator.py`, `bant_scorer.py`
- **LLM Provider** (`services/providers/llm.py`): Routes to Gemini first, OpenAI as fallback (configured via `.env` `LLM_PROVIDER_ORDER`)
- **Database**: SQLite (`copilot.db`) with SQLAlchemy ORM; Alembic for migrations
- **Config**: `core/config.py` reads from `.env` via Pydantic Settings

### Data Models (SQLAlchemy, `app/models.py`)
```
Account → SignalEvent, PainProfile, Contact, BANTScorecard, PipelineItem
Contact → OutreachDraft, InteractionLog
```

### Key Patterns
- **Mock-first development**: Frontend defaults to mock mode; toggle real API via Settings page or `localStorage.setItem('DATA_SOURCE_MODE', 'api')`
- **Dual access**: Every feature is accessible via both REST API and CLI (`app/cli.py` with 20+ commands)
- **Request tracing**: All requests get `X-Request-ID` header; logged in global middleware
- **LLM audit fields**: Outreach drafts and pain profiles store `model_provider` for traceability

## Environment Variables (`.env`)
```
TAVILY_API_KEY=        # Market signal search
GEMINI_API_KEY=        # Primary LLM
OPENAI_API_KEY=        # Fallback LLM
LLM_PROVIDER_ORDER=gemini,openai
DATABASE_URL=sqlite:///./copilot.db
```
