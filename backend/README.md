# AI Sales Copilot Backend

## 1. Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

在 `.env` 設定：
- `TAVILY_API_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`（fallback）
- `LLM_PROVIDER_ORDER=GEMINI,OPENAI`
- `RADAR_SOURCE_ALLOWLIST`（逗號分隔 domain 白名單，未設定則使用內建預設）

## 2. Run migrations
```bash
cd backend
alembic upgrade head
```

## 3. Seed sample data
```bash
cd backend
PYTHONPATH=. python scripts/seed.py
```

## 4. Start API
```bash
cd backend
uvicorn app.main:app --reload
```

## 4.1 CLI commands
```bash
cd backend
PYTHONPATH=. python copilot.py init-db --seed
PYTHONPATH=. python copilot.py list-accounts
PYTHONPATH=. python copilot.py create-account --company-name "Demo Co" --segment AR_VR --priority-tier T2
PYTHONPATH=. python copilot.py update-account --account 1 --priority-tier T1
PYTHONPATH=. python copilot.py delete-account --account 1
PYTHONPATH=. python copilot.py list-contacts
PYTHONPATH=. python copilot.py create-contact --account 1 --full-name "RD Manager" --role-title "RD Manager" --email rd@example.com --score 75
PYTHONPATH=. python copilot.py update-contact --contact 1 --score 85
PYTHONPATH=. python copilot.py delete-contact --contact 1
PYTHONPATH=. python copilot.py scan-signals --account 1 --lookback 90 --max-results 8
PYTHONPATH=. python copilot.py generate-pains --account 1 --personas RD,NPI --max-items 3
PYTHONPATH=. python copilot.py draft-outreach --contact 1 --channel EMAIL --intent FIRST_TOUCH
PYTHONPATH=. python copilot.py log-interaction --contact 1 --channel EMAIL --direction INBOUND --sentiment POSITIVE --summary "Budget and pilot timeline discussed"
PYTHONPATH=. python copilot.py score-bant --account 1 --lookback 60
PYTHONPATH=. python copilot.py run-e2e --account 1 --contact 1
PYTHONPATH=. python copilot.py demo-report --account 1
PYTHONPATH=. python copilot.py pipeline-board
PYTHONPATH=. python copilot.py weekly-report
```

Quick smoke flow:
```bash
cd backend
./scripts/smoke_cli.sh
```

## 4.2 Run tests
```bash
cd backend
pytest
```

If CLI shows `no such table`, initialize DB first:
```bash
cd backend
alembic upgrade head
PYTHONPATH=. python scripts/seed.py
```

## 5. Quick checks
- Health endpoint: `GET /api/v1/health`
- OpenAPI docs: `GET /docs`
- Accounts list/create: `GET /api/v1/accounts`, `POST /api/v1/accounts`
- Accounts import: `POST /api/v1/accounts/import`
- Contacts list/create: `GET /api/v1/contacts`, `POST /api/v1/contacts`
- Scan signals: `POST /api/v1/signals/scan`
- Signals by account: `GET /api/v1/signals/accounts/{account_id}`
- Generate pain profiles: `POST /api/v1/pain-profiles/generate`
- Pain profiles by account: `GET /api/v1/pain-profiles/accounts/{account_id}`
- Generate outreach draft: `POST /api/v1/outreach/generate`
- Outreach drafts by contact: `GET /api/v1/outreach/contacts/{contact_id}`
- Update outreach status: `PATCH /api/v1/outreach/{draft_id}/status`
- Log interaction: `POST /api/v1/interactions/log`
- Score BANT: `POST /api/v1/bant/score`
- BANT history: `GET /api/v1/bant/accounts/{account_id}`
- Pipeline board: `GET /api/v1/pipeline/board`
- Weekly report: `GET /api/v1/reports/weekly`

Error observability:
- Every response includes `X-Request-ID` header.
- Error responses include `error.code` and `request_id`.

LLM/Search audit fields:
- `signal_events`: `search_provider`, `search_latency_ms`, `search_fallback_used`
- `pain_profiles`: `model_provider`, `llm_latency_ms`, `llm_token_usage`, `llm_fallback_used`
- `outreach_drafts`: `model_provider`, `llm_latency_ms`, `llm_token_usage`, `llm_fallback_used`

Market Radar quality rules:
- Signals only accept sources in `RADAR_SOURCE_ALLOWLIST`.
- Snippets are cleaned to remove navigation/cookie/press-template noise.
- Top20 ordering (API/CLI): `signal_strength` -> recency -> latest fetched timestamp.

## 6. Request examples
`POST /api/v1/accounts`
```json
{
  "company_name": "Demo Optics Co",
  "segment": "AR_VR",
  "region": "TW",
  "priority_tier": "T2"
}
```

`POST /api/v1/accounts/import`
```json
{
  "items": [
    {
      "company_name": "Demo Optics Co",
      "segment": "AR_VR",
      "region": "TW",
      "priority_tier": "T2"
    }
  ]
}
```

`POST /api/v1/contacts`
```json
{
  "account_id": 1,
  "full_name": "RD Manager",
  "role_title": "RD Manager",
  "channel_email": "rd@example.com",
  "contactability_score": 75
}
```

`POST /api/v1/signals/scan`
```json
{
  "account_ids": [1, 2],
  "lookback_days": 90,
  "max_results_per_account": 8,
  "use_tavily": true
}
```

`POST /api/v1/pain-profiles/generate`
```json
{
  "account_id": 1,
  "persona_targets": ["RD", "NPI"],
  "max_items": 3
}
```

`POST /api/v1/outreach/generate`
```json
{
  "contact_id": 1,
  "channel": "EMAIL",
  "intent": "FIRST_TOUCH",
  "tone": "TECHNICAL",
  "llm_provider_preference": ["GEMINI", "OPENAI"]
}
```

`PATCH /api/v1/outreach/123/status`
```json
{
  "status": "APPROVED"
}
```

`POST /api/v1/interactions/log`
```json
{
  "contact_id": 1,
  "channel": "EMAIL",
  "direction": "INBOUND",
  "content_summary": "Customer asks for yield baseline and timing for pilot line.",
  "sentiment": "POSITIVE"
}
```

`POST /api/v1/bant/score`
```json
{
  "account_id": 1,
  "lookback_days": 60
}
```
