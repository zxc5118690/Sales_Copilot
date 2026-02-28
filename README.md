# General Sales Copilot

> B2B 半導體設備與工廠自動化的 AI 業務助理系統

## 功能概覽

- **市場情報掃描**：以 Tavily API 掃描目標客戶近期財報、擴廠、招募訊號，自動分類（CAPEX / NPI / HIRING / EXPANSION）
- **AI 痛點萃取**：LLM 分析訊號 → 結構化痛點（persona / pain_statement / business_impact / technical_anchor），支持 Human-in-the-Loop
- **開發訊息生成**：根據痛點自動生成繁體中文開發信/LinkedIn InMail，含主題、正文、CTA
- **BANT 評分**：從互動記錄關鍵詞自動評分，A 級帳戶自動推進到 TECHNICAL_EVAL 階段
- **銷售漏斗管理**：視覺化 Pipeline Board（DISCOVERY → CONTACTED → ENGAGED → QUALIFIED → TECHNICAL_EVAL → NURTURE）

## 目標產業

| Segment | 說明 |
|---------|------|
| `WAFER_FAB` | 晶圓製造（CMP / CVD / PVD / etch / lithography） |
| `PACKAGING_TEST` | 先進封裝與測試（CoWoS / chiplet / ATE） |
| `INSPECTION_METROLOGY` | 量測與缺陷檢測（CD-SEM / overlay / AOI） |
| `FACTORY_AUTOMATION` | 工廠自動化（AMR / AMHS / MES / OHT） |
| `DISPLAY` | 面板（OLED / Micro LED / AOI） |

## 技術棧

**Frontend**: React 19 + Vite + React Router v7（plain CSS）
**Backend**: FastAPI + SQLite + SQLAlchemy 2.0 + Alembic
**AI/LLM**: Gemini 2.0 Flash（主）/ GPT-4o Mini（降級）
**搜尋**: Tavily API

## 快速啟動

### 後端

```bash
cd backend

# 建立虛擬環境（用 uv，避免 dylib 路徑問題）
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# 設定環境變數
cp .env.example .env   # 填入 TAVILY_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY

# 初始化資料庫
alembic upgrade head
PYTHONPATH=. python scripts/seed.py   # 植入 ASE / Powertech / Innolux 示範資料

# 啟動後端
python -m uvicorn app.main:app --reload   # http://localhost:8000（避免與全域 uvicorn 衝突）
```

> **注意**：請勿直接 `cp -r` 複製 `.venv` 資料夾，venv 內有 hardcode 絕對路徑，換目錄必須重建。

### 前端

```bash
cd frontend
rm -rf node_modules   # 若從其他專案複製過來，必須先刪除再重裝
npm install
npm run dev           # http://localhost:5173
```

> 前端支援 **Mock / Real API 切換**，可在 Settings 頁面切換（無需後端也能 demo）

## 環境變數

| 變數 | 必填 | 說明 |
|------|------|------|
| `TAVILY_API_KEY` | 是 | 市場訊號搜尋 |
| `GEMINI_API_KEY` | 是 | 主要 LLM |
| `OPENAI_API_KEY` | 否 | 降級 LLM |
| `LLM_PROVIDER_ORDER` | 否 | 預設 `GEMINI,OPENAI` |
| `DATABASE_URL` | 否 | 預設 `sqlite:///./copilot.db` |

## 示範帳號（Seed Data）

- **ASE Technology** — PACKAGING_TEST, T1
- **Powertech Technology** — PACKAGING_TEST, T1
- **Innolux Corporation** — DISPLAY, T2

## Demo 資料模式

在 Settings 頁面切換 `DATA_SOURCE_MODE = mock`，前端會使用內建的半導體行業 mock 資料（ASE / UMC / Innolux / Delta 等 10 家），無需後端與 API key 即可完整展示所有功能。
