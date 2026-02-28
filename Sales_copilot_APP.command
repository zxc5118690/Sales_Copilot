#!/bin/bash

# 取得目前腳本路徑
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "🚀 Starting AI Sales Copilot..."

# 1. 啟動後端 (在背景執行)
echo "📦 Starting Backend..."
cd "$DIR/backend"
source .venv/bin/activate
# 背景執行 uvicorn，並將輸出導向日誌檔案
nohup uvicorn app.main:app --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# 2. 啟動前端
echo "🌐 Starting Frontend..."
cd "$DIR/frontend"
# 啟動前端並自動開啟瀏覽器
# 我們使用 npm run dev 並確保它是在背景啟動後通知用戶
# 或者直接讓 dev server 跑在前台
npm run dev &
FRONTEND_PID=$!

echo "✅ Services are starting up!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Browser should open automatically (default http://localhost:5173)"
echo ""
echo "Press Ctrl+C to stop both services when you're done."

# 攔截終止訊號
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

# 保持腳本運行直到被中斷
wait
