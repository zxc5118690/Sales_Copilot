// Mock Data
// Mock Data
// Mock Data
const MOCK_ACCOUNTS = [
  {
    id: 1,
    company_name: "日月光半導體 (ASE Technology)",
    segment: "PACKAGING_TEST",
    region: "Taiwan",
    website: "https://www.aseglobal.com",
    source: "manual",
    priority_tier: "T1",
    created_at: "2025-01-15T10:00:00Z",
    updated_at: "2025-02-10T14:30:00Z",
  },
  {
    id: 2,
    company_name: "頎邦科技 (Powertech Technology)",
    segment: "PACKAGING_TEST",
    region: "Taiwan",
    website: "https://www.ptc.com.tw",
    source: "import",
    priority_tier: "T2",
    created_at: "2025-02-01T09:00:00Z",
    updated_at: "2025-02-12T11:20:00Z",
  },
  {
    id: 3,
    company_name: "群創光電 (Innolux Corporation)",
    segment: "DISPLAY",
    region: "Taiwan",
    website: "https://www.innolux.com",
    source: "strategy_doc",
    priority_tier: "T1",
    created_at: "2025-02-19T10:00:00Z",
    updated_at: "2025-02-19T10:00:00Z",
  },
  {
    id: 4,
    company_name: "聯華電子 (UMC)",
    segment: "WAFER_FAB",
    region: "Taiwan",
    website: "https://www.umc.com",
    source: "strategy_doc",
    priority_tier: "T1",
    created_at: "2025-02-19T10:05:00Z",
    updated_at: "2025-02-19T10:05:00Z",
  },
  {
    id: 5,
    company_name: "富鼎先進科技 (Foxsemicon)",
    segment: "FACTORY_AUTOMATION",
    region: "Taiwan",
    website: "https://www.foxsemicon.com",
    source: "strategy_doc",
    priority_tier: "T2",
    created_at: "2025-02-19T10:10:00Z",
    updated_at: "2025-02-19T10:10:00Z",
  },
  {
    id: 6,
    company_name: "美光半導體台灣 (Micron Taiwan)",
    segment: "WAFER_FAB",
    region: "USA",
    website: "https://www.micron.com",
    source: "strategy_doc",
    priority_tier: "T2",
    created_at: "2025-02-19T10:15:00Z",
    updated_at: "2025-02-19T10:15:00Z",
  },
  {
    id: 7,
    company_name: "台達電子 (Delta Electronics)",
    segment: "FACTORY_AUTOMATION",
    region: "Taiwan",
    website: "https://www.deltaww.com",
    source: "strategy_doc",
    priority_tier: "T1",
    created_at: "2025-02-19T10:20:00Z",
    updated_at: "2025-02-19T10:20:00Z",
  },
  {
    id: 8,
    company_name: "奇景光電 (Himax Technologies)",
    segment: "WAFER_FAB",
    region: "Taiwan",
    website: "https://www.himax.com.tw",
    source: "strategy_doc",
    priority_tier: "T1",
    created_at: "2025-02-19T10:25:00Z",
    updated_at: "2025-02-19T10:25:00Z",
  },
  {
    id: 9,
    company_name: "華邦電子 (Winbond Electronics)",
    segment: "WAFER_FAB",
    region: "Taiwan",
    website: "https://www.winbond.com",
    source: "strategy_doc",
    priority_tier: "T1",
    created_at: "2025-02-19T10:30:00Z",
    updated_at: "2025-02-19T10:30:00Z",
  },
  {
    id: 10,
    company_name: "友達光電 (AUO Corporation)",
    segment: "DISPLAY",
    region: "Taiwan",
    website: "https://www.auo.com",
    source: "strategy_doc",
    priority_tier: "T2",
    created_at: "2025-02-19T10:35:00Z",
    updated_at: "2025-02-19T10:35:00Z",
  },
];

const MOCK_SIGNALS = [
  // --- Account 1: ASE Technology (PACKAGING_TEST) ---
  {
    id: 101,
    account_id: 1,
    signal_type: "CAPEX",
    signal_strength: 95,
    event_date: "2025-02-08",
    summary: "ASE 宣布投資 50 億元擴建先進封裝產線，涵蓋 SiP 與 Fan-out 製程，預計 2025 年 Q4 完工。",
    evidence_url: "https://news.aseglobal.com/expansion",
    source_name: "ASE 新聞稿",
    fetched_at: "2025-02-09T08:00:00Z",
  },
  {
    id: 102,
    account_id: 1,
    signal_type: "HIRING",
    signal_strength: 70,
    event_date: "2025-02-10",
    summary:
      "ASE 積極招募 Process Engineer 與 Equipment Engineer，共計 45 個職缺，主要集中在高雄楠梓廠。",
    evidence_url: "https://linkedin.com/jobs/ase-technology",
    source_name: "LinkedIn",
    fetched_at: "2025-02-11T09:00:00Z",
  },
  // --- Account 2: Powertech Technology (PACKAGING_TEST) ---
  {
    id: 106,
    account_id: 2,
    signal_type: "HIRING",
    signal_strength: 78,
    event_date: "2025-02-11",
    summary:
      "Powertech 積極招募 Process Engineer 與 Equipment Engineer，共 30 個職缺，重點補強測試製程人力。",
    evidence_url: "https://linkedin.com/jobs/powertech",
    source_name: "LinkedIn",
    fetched_at: "2025-02-12T10:00:00Z",
  },
  {
    id: 107,
    account_id: 2,
    signal_type: "NPI",
    signal_strength: 72,
    event_date: "2025-02-13",
    summary:
      "Powertech 啟動 HBM (High Bandwidth Memory) 封裝測試新產線，目標 2025 Q3 量產認證完成。",
    evidence_url: "https://www.digitimes.com/powertech-hbm",
    source_name: "DigiTimes",
    fetched_at: "2025-02-14T09:00:00Z",
  },
  // --- Account 3: Innolux Corporation (DISPLAY) ---
  {
    id: 108,
    account_id: 3,
    signal_type: "NPI",
    signal_strength: 75,
    event_date: "2025-02-04",
    summary: "Innolux 啟動 OLED 面板新產線，AOI 設備採購需求浮現，預計採購規模約 8 億元。",
    evidence_url: "https://www.innolux.com/news/oled-npi",
    source_name: "Innolux 新聞稿",
    fetched_at: "2025-02-05T11:00:00Z",
  },
  {
    id: 109,
    account_id: 3,
    signal_type: "CAPEX",
    signal_strength: 82,
    event_date: "2025-02-03",
    summary: "Innolux 宣布 2025 年資本支出計畫達 120 億元，重點投資 8.6 代線面板設備升級與製程自動化。",
    evidence_url: "https://tw.stock.yahoo.com/innolux-capex",
    source_name: "Yahoo Finance",
    fetched_at: "2025-02-04T08:00:00Z",
  },
  // --- Account 4: UMC (WAFER_FAB) ---
  {
    id: 103,
    account_id: 4,
    signal_type: "CAPEX",
    signal_strength: 90,
    event_date: "2025-02-14",
    summary:
      "UMC 宣布 22nm 製程節點擴產，設備採購規模約 1.2 億美元，聚焦 CMP、蝕刻與薄膜沉積設備。",
    evidence_url: "https://news.umc.com/22nm-expansion",
    source_name: "UMC 新聞稿",
    fetched_at: "2025-02-15T10:00:00Z",
  },
  {
    id: 110,
    account_id: 4,
    signal_type: "HIRING",
    signal_strength: 68,
    event_date: "2025-02-16",
    summary:
      "UMC 大量招募製程整合工程師 (Process Integration Engineers) 與缺陷分析專家 (Defect Analysis Specialists)，合計 50 個職缺。",
    evidence_url: "https://linkedin.com/jobs/umc",
    source_name: "LinkedIn",
    fetched_at: "2025-02-17T09:00:00Z",
  },
  // --- Account 5: Foxsemicon (FACTORY_AUTOMATION) ---
  {
    id: 104,
    account_id: 5,
    signal_type: "NPI",
    signal_strength: 75,
    event_date: "2025-02-12",
    summary: "Foxsemicon 啟動半導體廠 AMR 自動搬送系統整合專案，為晶圓廠客戶提供 FOUP 自動搬運解決方案。",
    evidence_url: "https://www.foxsemicon.com/news/amr",
    source_name: "Foxsemicon 新聞稿",
    fetched_at: "2025-02-13T14:30:00Z",
  },
  {
    id: 111,
    account_id: 5,
    signal_type: "CAPEX",
    signal_strength: 68,
    event_date: "2025-02-15",
    summary: "Foxsemicon 宣布擴建台中自動化設備組裝廠，提升半導體廠務自動化產品產能，預計 2025 Q3 完工。",
    evidence_url: "https://www.foxsemicon.com/news/factory-expansion",
    source_name: "Foxsemicon 新聞稿",
    fetched_at: "2025-02-16T07:00:00Z",
  },
  // --- Account 6: Micron Taiwan (WAFER_FAB) ---
  {
    id: 112,
    account_id: 6,
    signal_type: "CAPEX",
    signal_strength: 88,
    event_date: "2025-02-14",
    summary:
      "Micron Taiwan 宣布桃園廠 1β DRAM 製程擴產，設備投資規模達 3 億美元，重點採購微影與 CMP 設備。",
    evidence_url: "https://investors.micron.com/taiwan-expansion",
    source_name: "Micron Investor Relations",
    fetched_at: "2025-02-15T08:00:00Z",
  },
  {
    id: 113,
    account_id: 6,
    signal_type: "HIRING",
    signal_strength: 74,
    event_date: "2025-02-13",
    summary:
      "Micron Taiwan 招募 Yield Enhancement Engineer 與 Equipment Process Engineer，重點補強 CMP 與蝕刻製程人力。",
    evidence_url: "https://linkedin.com/jobs/micron-taiwan",
    source_name: "LinkedIn",
    fetched_at: "2025-02-14T10:00:00Z",
  },
  // --- Account 7: Delta Electronics (FACTORY_AUTOMATION) ---
  {
    id: 114,
    account_id: 7,
    signal_type: "NPI",
    signal_strength: 80,
    event_date: "2025-02-11",
    summary:
      "Delta Electronics 導入 AMR 自動搬送系統，智慧工廠升級計畫曝光，預計為旗下製造廠導入 200 台 AMR。",
    evidence_url: "https://www.deltaww.com/news/amr-smartfactory",
    source_name: "Delta 新聞稿",
    fetched_at: "2025-02-12T09:00:00Z",
  },
  {
    id: 115,
    account_id: 7,
    signal_type: "HIRING",
    signal_strength: 65,
    event_date: "2025-02-10",
    summary: "Delta 招募工業自動化系統整合工程師與 MES 開發工程師，配合智慧製造升級計畫人力擴編。",
    evidence_url: "https://linkedin.com/jobs/delta-electronics",
    source_name: "LinkedIn",
    fetched_at: "2025-02-11T14:00:00Z",
  },
  // --- Account 8: Himax Technologies (WAFER_FAB) ---
  {
    id: 105,
    account_id: 8,
    signal_type: "NPI",
    signal_strength: 70,
    event_date: "2025-02-15",
    summary:
      "Himax 啟動車用 DDIC (Display Driver IC) 新世代製程開發，委外晶圓廠製程設備需求浮現。",
    evidence_url: "https://ir.himax.com.tw/news/ddic-npi",
    source_name: "Himax IR",
    fetched_at: "2025-02-16T08:30:00Z",
  },
  {
    id: 116,
    account_id: 8,
    signal_type: "HIRING",
    signal_strength: 62,
    event_date: "2025-02-14",
    summary:
      "Himax 招募 IC Design 與 Process Engineering 職缺，佈局下世代 LCOS 顯示晶片研發。",
    evidence_url: "https://linkedin.com/jobs/himax",
    source_name: "LinkedIn",
    fetched_at: "2025-02-15T10:00:00Z",
  },
  // --- Account 9: Winbond Electronics (WAFER_FAB) ---
  {
    id: 117,
    account_id: 9,
    signal_type: "CAPEX",
    signal_strength: 85,
    event_date: "2025-02-14",
    summary:
      "Winbond 宣布中科 12 吋晶圓廠第二期擴產，設備投資規模達 6 億美元，重點採購薄膜沉積與量測設備。",
    evidence_url: "https://www.winbond.com/news/12inch-expansion",
    source_name: "Winbond 新聞稿",
    fetched_at: "2025-02-15T08:00:00Z",
  },
  {
    id: 118,
    account_id: 9,
    signal_type: "HIRING",
    signal_strength: 76,
    event_date: "2025-02-13",
    summary:
      "Winbond 大量招募 Yield Engineer 與 CMP Process Engineer，配合 12 吋廠擴產計畫人力需求。",
    evidence_url: "https://linkedin.com/jobs/winbond",
    source_name: "LinkedIn",
    fetched_at: "2025-02-14T09:00:00Z",
  },
  // --- Account 10: AUO Corporation (DISPLAY) ---
  {
    id: 119,
    account_id: 10,
    signal_type: "NPI",
    signal_strength: 73,
    event_date: "2025-02-13",
    summary:
      "AUO 啟動車用 MicroLED 面板新產線規劃，AOI 與製程量測設備採購預算浮現，規模估計約 15 億元。",
    evidence_url: "https://www.auo.com/news/microled-npi",
    source_name: "AUO 新聞稿",
    fetched_at: "2025-02-14T08:00:00Z",
  },
  {
    id: 120,
    account_id: 10,
    signal_type: "CAPEX",
    signal_strength: 67,
    event_date: "2025-02-12",
    summary: "AUO 宣布 2025 年資本支出達 95 億元，重點投資面板製程自動化設備與廠務系統升級。",
    evidence_url: "https://tw.stock.yahoo.com/auo-capex",
    source_name: "Yahoo Finance",
    fetched_at: "2025-02-13T10:00:00Z",
  },
];

const MOCK_PAINS = [
  // --- Account 1: ASE Technology ---
  {
    id: 201,
    account_id: 1,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "先進封裝 Fan-out 製程中的 RDL (Redistribution Layer) 線寬均勻性控制不穩定，導致電性良率低於 target 8%。",
    business_impact: "良率損失每月估計影響產值約 NT$1,200 萬，NPI 時程落後 6 週。",
    technical_anchor:
      "RDL 線寬均勻性量測 (RDL CD uniformity metrology), SPC 即時監控 (In-line SPC monitoring)。",
    confidence: 0.88,
    created_at: "2025-02-12T10:00:00Z",
  },
  {
    id: 202,
    account_id: 1,
    persona: "PROCUREMENT_MGR",
    pain_statement: "先進封裝設備交期從 12 週拉長至 28 週，嚴重影響產能 ramp-up 計畫。",
    business_impact: "新產線投產時程延遲，影響對 NVIDIA 等客戶的 SiP 訂單交付承諾。",
    technical_anchor:
      "設備交期管理 (Equipment lead time management), 備品庫存策略 (Spare parts inventory strategy)。",
    confidence: 0.75,
    created_at: "2025-02-12T10:05:00Z",
  },
  // --- Account 2: Powertech Technology ---
  {
    id: 205,
    account_id: 2,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "關鍵測試設備 (ATE) MTTR 過長，計劃外停機每月損失約 NT$800 萬產值，影響 HBM 測試產能。",
    business_impact:
      "設備稼動率 (Equipment Availability) 僅 88%，低於目標 95%，影響對 SK Hynix 的出貨承諾。",
    technical_anchor:
      "ATE 設備預防保養 (PM 計畫優化), 備品即時管理 (Real-time spare parts management)。",
    confidence: 0.85,
    created_at: "2025-02-13T09:00:00Z",
  },
  {
    id: 206,
    account_id: 2,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "HBM 封裝 TSV (Through Silicon Via) 填充製程的 void 缺陷率偏高，每批次 void rate 達 2.3%。",
    business_impact:
      "TSV void 導致電性失效，封裝良率損失每月估計 NT$600 萬，且客戶要求改善報告。",
    technical_anchor:
      "TSV 缺陷檢測 (TSV void inspection), 銅填充製程優化 (Cu fill process optimization)。",
    confidence: 0.8,
    created_at: "2025-02-13T09:05:00Z",
  },
  // --- Account 3: Innolux Corporation ---
  {
    id: 207,
    account_id: 3,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "OLED 蒸鍍製程的有機薄膜厚度均勻性 (Thickness uniformity) 控制困難，批次間良率波動 ±10%。",
    business_impact: "面板色差 (Color shift) 超標，良率損失每月影響產值約 NT$2,000 萬。",
    technical_anchor:
      "有機薄膜即時厚度監控 (In-situ OLEDs thickness monitoring), 蒸鍍速率 SPC 管控。",
    confidence: 0.79,
    created_at: "2025-02-06T11:00:00Z",
  },
  {
    id: 208,
    account_id: 3,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "AOI 設備的面板邊緣缺陷 (Edge defect) 誤判率達 18%，大量人工覆檢嚴重拖累產線效率。",
    business_impact: "品保人力成本增加 35%，且人工判定一致性不佳造成客訴案件上升。",
    technical_anchor:
      "AI 自動缺陷分類 (ADC), 邊緣區域成像優化 (Edge imaging optimization)。",
    confidence: 0.72,
    created_at: "2025-02-06T11:05:00Z",
  },
  // --- Account 4: UMC ---
  {
    id: 209,
    account_id: 4,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "28nm 製程 CMP 後的 defect rate 高於 target 1.5x，影響 die yield，主因為 slurry 殘留物偵測靈敏度不足。",
    business_impact: "晶圓良率損失約 3%，每月損失產值約 NT$1.5 億，客戶要求提出改善計畫。",
    technical_anchor:
      "CMP 後表面缺陷檢測 (Post-CMP defect inspection), 奈米級粒子偵測 (Sub-20nm particle detection)。",
    confidence: 0.9,
    created_at: "2025-02-16T10:00:00Z",
  },
  {
    id: 210,
    account_id: 4,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "蝕刻機台 (Etch tool) 的腔體 (Chamber) PM 後回復時間過長，平均需 48 小時才能重新達到製程規格。",
    business_impact: "每次 PM 損失 2 天產能，年度計畫外停機成本估計 NT$5,000 萬。",
    technical_anchor:
      "Chamber conditioning 優化, 製程回復監控 (Process recovery monitoring)。",
    confidence: 0.84,
    created_at: "2025-02-16T10:05:00Z",
  },
  // --- Account 5: Foxsemicon ---
  {
    id: 203,
    account_id: 5,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "半導體廠 AMR 導航系統在無塵室環境的定位精度不足，FOUP 搬運失敗率達 1.2%，影響整線稼動率。",
    business_impact: "FOUP 搬運失敗需人工介入，每月額外人力成本 NT$120 萬，且晶圓有污染風險。",
    technical_anchor:
      "無塵室 AMR 定位精度 (Cleanroom AMR positioning accuracy), FOUP 搬運失敗率 (Transfer failure rate)。",
    confidence: 0.82,
    created_at: "2025-02-14T15:00:00Z",
  },
  {
    id: 211,
    account_id: 5,
    persona: "PROCUREMENT_MGR",
    pain_statement:
      "自動化設備的備品 (Spare parts) 庫存管理缺乏即時可視化，緊急備品補貨平均需等待 3 週以上。",
    business_impact: "備品缺料導致設備停機時間延長，每月因此損失約 NT$300 萬產值。",
    technical_anchor:
      "備品庫存即時管理 (Real-time spare parts management), 預測性補貨 (Predictive replenishment)。",
    confidence: 0.78,
    created_at: "2025-02-14T15:05:00Z",
  },
  // --- Account 6: Micron Taiwan ---
  {
    id: 212,
    account_id: 6,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "1β DRAM 製程的微影對準精度 (Overlay accuracy) 控制困難，overlay error 超出規格 3σ 導致批次報廢。",
    business_impact:
      "每批次 overlay 超規事件平均每月發生 4 次，每次報廢損失估計 $800K USD。",
    technical_anchor:
      "微影對準量測 (Overlay metrology), APC (Advanced Process Control) 整合。",
    confidence: 0.86,
    created_at: "2025-02-15T08:00:00Z",
  },
  {
    id: 213,
    account_id: 6,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "CMP 研磨液 (Slurry) 的濃度與流量異常難以即時偵測，導致研磨速率漂移造成薄膜厚度 out-of-spec。",
    business_impact:
      "每月平均 2 批晶圓因 CMP 異常報廢，損失約 $500K USD，且設備異常根本原因分析耗時 2 週以上。",
    technical_anchor:
      "CMP 製程參數即時監控 (CMP in-line process monitoring), 異常自動偵測 (Fault detection & classification)。",
    confidence: 0.81,
    created_at: "2025-02-15T08:05:00Z",
  },
  // --- Account 7: Delta Electronics ---
  {
    id: 214,
    account_id: 7,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "電源模組 SMT 產線的錫膏印刷 (Solder paste printing) 缺陷率偏高，主因為 3D SPI 量測系統精度不足。",
    business_impact: "SMT 首件不良率達 4.2%，每月重工成本約 NT$180 萬，且影響出貨準時率。",
    technical_anchor:
      "高精度 3D SPI 量測 (3D solder paste inspection), 製程參數回饋控制 (Closed-loop process control)。",
    confidence: 0.65,
    created_at: "2025-02-12T14:00:00Z",
  },
  {
    id: 215,
    account_id: 7,
    persona: "PROCUREMENT_MGR",
    pain_statement:
      "智慧工廠升級所需的工業機器人與 AMR 設備，交期從標準 16 週拉長至 32 週，影響產線改造時程。",
    business_impact: "智慧製造轉型計畫落後原定時程 4 個月，影響 KPI 達成。",
    technical_anchor:
      "設備交期管理 (Equipment lead time management), 替代供應商資格認證 (Alternative supplier qualification)。",
    confidence: 0.58,
    created_at: "2025-02-12T14:05:00Z",
  },
  // --- Account 8: Himax Technologies ---
  {
    id: 216,
    account_id: 8,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "DDIC 晶圓的金屬層 (Metal layer) 蝕刻製程 CD (Critical Dimension) 均勻性不足，批間變異 (Lot-to-lot variation) 過大。",
    business_impact:
      "CD 異常導致良率損失 5%，影響對車用客戶的出貨承諾，並增加客戶端失效回報頻率。",
    technical_anchor:
      "CD SEM 量測 (CD-SEM metrology), 蝕刻製程 APC 整合 (Etch APC integration)。",
    confidence: 0.83,
    created_at: "2025-02-16T09:00:00Z",
  },
  {
    id: 217,
    account_id: 8,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "LCOS 晶片的 Die bonding 製程良率不穩定，熱壓接合 (TCB) 後的 die tilt 超規比例達 6%。",
    business_impact: "封裝良率損失每月影響產值 NT$400 萬，且 die tilt 導致光學性能失效難以挽救。",
    technical_anchor:
      "精密 Die bonding 對準 (Precision die bonding alignment), 熱壓製程參數優化 (TCB process optimization)。",
    confidence: 0.76,
    created_at: "2025-02-16T09:05:00Z",
  },
  // --- Account 9: Winbond Electronics ---
  {
    id: 204,
    account_id: 9,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "NOR Flash 製程的閘極氧化層 (Gate oxide) 厚度量測重複性 (Repeatability) 不佳，Cpk 僅 1.1，低於目標 1.67。",
    business_impact: "製程能力不足導致每月約 2% 批次需要重工或報廢，影響對 MCU 客戶的交期。",
    technical_anchor:
      "閘極氧化層橢偏儀量測 (Gate oxide ellipsometry), 薄膜均勻性 Cpk 提升。",
    confidence: 0.91,
    created_at: "2025-02-15T11:00:00Z",
  },
  {
    id: 218,
    account_id: 9,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "12 吋晶圓廠的黃光區 (Photolithography bay) 設備稼動率偏低，計劃外停機每月損失約 NT$2,000 萬產值。",
    business_impact: "曝光機 (Scanner) 平均修復時間 (MTTR) 達 18 小時，遠高於業界標準 8 小時。",
    technical_anchor:
      "微影設備預防保養優化 (Scanner PM optimization), 備品備料管理 (Spare parts readiness)。",
    confidence: 0.87,
    created_at: "2025-02-15T11:05:00Z",
  },
  // --- Account 10: AUO Corporation ---
  {
    id: 219,
    account_id: 10,
    persona: "PROCESS_ENGINEER",
    pain_statement:
      "MicroLED 面板的 Mass Transfer 製程良率偏低，LED 晶粒 (Die) 位移 (Displacement) 超規比例達 3.5%。",
    business_impact: "Mass Transfer 良率損失嚴重影響 MicroLED 產品成本競爭力，難以達成車用客戶規格要求。",
    technical_anchor:
      "Mass Transfer 位移量測 (Mass transfer displacement metrology), 接合強度驗證 (Bond strength validation)。",
    confidence: 0.8,
    created_at: "2025-02-14T10:00:00Z",
  },
  {
    id: 220,
    account_id: 10,
    persona: "EQUIPMENT_ENGINEER",
    pain_statement:
      "面板廠 TFT Array 產線的乾蝕刻設備 (Dry etch) 腔體 (Chamber) 壽命不穩定，提前劣化頻率增加。",
    business_impact: "腔體提前更換成本每年額外增加 NT$800 萬，且緊急更換期間影響產線稼動率。",
    technical_anchor:
      "蝕刻腔體壽命預測 (Chamber lifetime prediction), 電漿製程診斷 (Plasma process diagnostics)。",
    confidence: 0.77,
    created_at: "2025-02-14T10:05:00Z",
  },
];

const MOCK_CONTACTS = [
  // --- Account 1: ASE Technology ---
  {
    id: 301,
    account_id: 1,
    full_name: "陳志明",
    role_title: "封裝製程技術副總",
    channel_email: "cm.chen@aseglobal.com",
    channel_linkedin: "linkedin.com/in/cmchen-ase",
  },
  {
    id: 302,
    account_id: 1,
    full_name: "林雅婷",
    role_title: "設備採購經理",
    channel_email: "yt.lin@aseglobal.com",
    channel_linkedin: "linkedin.com/in/ytlin-ase",
  },
  // --- Account 2: Powertech Technology ---
  {
    id: 305,
    account_id: 2,
    full_name: "王建宏",
    role_title: "製程整合部門主管",
    channel_email: "jh.wang@ptc.com.tw",
    channel_linkedin: "linkedin.com/in/jhwang-ptc",
  },
  {
    id: 306,
    account_id: 2,
    full_name: "許美玲",
    role_title: "設備採購課長",
    channel_email: "ml.hsu@ptc.com.tw",
    channel_linkedin: "linkedin.com/in/mlhsu-ptc",
  },
  // --- Account 3: Innolux Corporation ---
  {
    id: 307,
    account_id: 3,
    full_name: "張俊偉",
    role_title: "製程技術處長",
    channel_email: "jw.chang@innolux.com",
    channel_linkedin: "linkedin.com/in/jwchang-innolux",
  },
  {
    id: 308,
    account_id: 3,
    full_name: "劉秀蘭",
    role_title: "設備採購部協理",
    channel_email: "sl.liu@innolux.com",
    channel_linkedin: "linkedin.com/in/slliu-innolux",
  },
  // --- Account 4: UMC ---
  {
    id: 303,
    account_id: 4,
    full_name: "蔡文雄",
    role_title: "Fab 廠長",
    channel_email: "wh.tsai@umc.com",
    channel_linkedin: "linkedin.com/in/whtsai-umc",
  },
  {
    id: 309,
    account_id: 4,
    full_name: "黃淑芬",
    role_title: "製程整合技術主任",
    channel_email: "sf.huang@umc.com",
    channel_linkedin: "linkedin.com/in/sfhuang-umc",
  },
  // --- Account 5: Foxsemicon ---
  {
    id: 310,
    account_id: 5,
    full_name: "鄭家豪",
    role_title: "自動化系統整合部主管",
    channel_email: "jh.cheng@foxsemicon.com",
    channel_linkedin: "linkedin.com/in/jhcheng-fox",
  },
  {
    id: 311,
    account_id: 5,
    full_name: "吳宗翰",
    role_title: "設備採購經理",
    channel_email: "zh.wu@foxsemicon.com",
    channel_linkedin: "linkedin.com/in/zhwu-fox",
  },
  // --- Account 6: Micron Taiwan ---
  {
    id: 304,
    account_id: 6,
    full_name: "Kevin Huang",
    role_title: "Process Engineering Director",
    channel_email: "k.huang@micron.com",
    channel_linkedin: "linkedin.com/in/kevinhuang-micron",
  },
  {
    id: 312,
    account_id: 6,
    full_name: "Jessica Lin",
    role_title: "Equipment Procurement Manager",
    channel_email: "j.lin@micron.com",
    channel_linkedin: "linkedin.com/in/jessicalin-micron",
  },
  // --- Account 7: Delta Electronics ---
  {
    id: 313,
    account_id: 7,
    full_name: "楊智凱",
    role_title: "智慧製造技術總監",
    channel_email: "zk.yang@deltaww.com",
    channel_linkedin: "linkedin.com/in/zkyang-delta",
  },
  {
    id: 314,
    account_id: 7,
    full_name: "謝佳穎",
    role_title: "自動化設備採購主管",
    channel_email: "jy.hsieh@deltaww.com",
    channel_linkedin: "linkedin.com/in/jyhsieh-delta",
  },
  // --- Account 8: Himax Technologies ---
  {
    id: 315,
    account_id: 8,
    full_name: "邱建志",
    role_title: "製程技術部主任",
    channel_email: "jz.chiu@himax.com.tw",
    channel_linkedin: "linkedin.com/in/jzchiu-himax",
  },
  {
    id: 316,
    account_id: 8,
    full_name: "方淑惠",
    role_title: "設備採購協理",
    channel_email: "sh.fang@himax.com.tw",
    channel_linkedin: "linkedin.com/in/shfang-himax",
  },
  // --- Account 9: Winbond Electronics ---
  {
    id: 317,
    account_id: 9,
    full_name: "洪志豪",
    role_title: "製程整合部協理",
    channel_email: "zh.hung@winbond.com",
    channel_linkedin: "linkedin.com/in/zhhung-winbond",
  },
  {
    id: 318,
    account_id: 9,
    full_name: "蘇怡君",
    role_title: "設備採購課長",
    channel_email: "yj.su@winbond.com",
    channel_linkedin: "linkedin.com/in/yjsu-winbond",
  },
  // --- Account 10: AUO Corporation ---
  {
    id: 319,
    account_id: 10,
    full_name: "廖俊龍",
    role_title: "製程技術副總",
    channel_email: "jl.liao@auo.com",
    channel_linkedin: "linkedin.com/in/jlliao-auo",
  },
  {
    id: 320,
    account_id: 10,
    full_name: "江佩玲",
    role_title: "設備採購部經理",
    channel_email: "pl.chiang@auo.com",
    channel_linkedin: "linkedin.com/in/plchiang-auo",
  },
];

const MOCK_DRAFTS = [
  // Account 1: ASE Technology → 陳志明 (301)
  {
    id: 401,
    contact_id: 301,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "先進封裝 RDL 製程良率改善方案",
    body: "陳副總 您好，\n\n注意到 ASE 近期宣布擴建 Fan-out 先進封裝產線。RDL 線寬均勻性控制是量產良率的關鍵瓶頸，業界普遍面臨 SPC 即時監控與缺陷分類精度不足的挑戰。\n\n我們的 In-line CD 量測與 AI 缺陷分類方案已協助多家封裝廠將 RDL 良率提升 8-12%，並縮短 NPI 導入時程。\n\n不知下週是否方便進行 20 分鐘的技術交流？\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-14T14:00:00Z",
  },
  // Account 2: Powertech → 王建宏 (305)
  {
    id: 403,
    contact_id: 305,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "HBM 封裝設備稼動率優化建議",
    body: "王主管 您好，\n\n了解到 Powertech 正在積極擴建 HBM 封裝測試產線。關鍵 ATE 設備的計劃外停機是量產爬坡階段的常見痛點。\n\n我們的設備健康監控與預測性維護方案，已協助同類封裝廠將設備稼動率從 88% 提升至 95% 以上，MTTR 縮短 40%。\n\n方便安排 20 分鐘電話討論貴司目前的設備管理挑戰嗎？\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-14T15:00:00Z",
  },
  // Account 3: Innolux → 張俊偉 (307)
  {
    id: 404,
    contact_id: 307,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "OLED 面板製程良率改善提案",
    body: "張處長 您好，\n\n得知 Innolux 正在啟動 OLED 面板新產線。有機薄膜蒸鍍製程的厚度均勻性控制與 AOI 邊緣缺陷誤判，是 OLED 量產良率的兩大核心挑戰。\n\n我們的 In-situ 薄膜監控搭配 AI 自動缺陷分類方案，已協助面板廠將 OLED 良率波動縮小 60%，AOI 誤判率降低至 3% 以下。\n\n如有興趣，歡迎安排線上技術交流。\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-07T10:00:00Z",
  },
  // Account 4: UMC → 蔡文雄 (303)
  {
    id: 405,
    contact_id: 303,
    channel: "EMAIL",
    intent: "FOLLOW_UP",
    subject: "Follow-up：28nm CMP 後缺陷檢測自動化方案",
    body: "蔡廠長 您好，\n\n感謝上次會議的交流。針對貴司 22nm 擴產線的製程缺陷管控需求，整理了以下重點：\n\n1. Post-CMP Sub-20nm 微粒偵測方案可提升現有靈敏度 3 倍\n2. AI 自動缺陷分類 (ADC) 可將缺陷分類準確率從 72% 提升至 95%\n3. 與現有 MES 系統整合，提供 SPC 即時回饋\n\n附上技術白皮書供參考，期待安排下一步 Demo。\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-17T09:00:00Z",
  },
  // Account 5: Foxsemicon → 鄭家豪 (310)
  {
    id: 406,
    contact_id: 310,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "半導體廠 AMR 定位精度提升解決方案",
    body: "鄭主管 您好，\n\n注意到 Foxsemicon 正在推進半導體廠 AMR 自動搬送系統整合專案。無塵室環境的 FOUP 搬運定位精度，是 AMR 導入成敗的關鍵。\n\n我們的高精度無塵室 AMR 定位方案已在多家 12 吋晶圓廠驗證，FOUP 搬運失敗率降至 0.1% 以下，且符合 SEMI E87 標準。\n\n是否方便下週安排技術簡報？\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-15T10:00:00Z",
  },
  // Account 6: Micron Taiwan → Kevin Huang (304)
  {
    id: 402,
    contact_id: 304,
    channel: "LINKEDIN",
    intent: "FIRST_TOUCH",
    subject: "1β DRAM 製程 Overlay 量測精度討論",
    body: "嗨 Kevin，\n\n注意到 Micron Taiwan 正在積極推進 1β DRAM 製程擴產。微影 Overlay 精度控制在先進製程節點是量產良率的核心課題。\n\n我們最近協助一家 DRAM 大廠，透過 APC 整合 Overlay 量測回饋，將批次報廢率降低 70%，每月節省超過 $500K USD 的良率損失。\n\n想這可能對貴司目前的量產爬坡有所幫助。\n\nRegards,\n[Your Name]",
    status: "APPROVED",
    created_at: "2025-02-15T09:00:00Z",
  },
  // Account 7: Delta Electronics → 楊智凱 (313)
  {
    id: 407,
    contact_id: 313,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "智慧工廠 AMR 導入效益提升方案",
    body: "楊總監 您好，\n\n了解到 Delta 正在積極推動旗下製造廠的智慧工廠升級計畫，導入 AMR 自動搬送系統。\n\n我們的工廠自動化整合方案可將 AMR 部署週期縮短 40%，並提供與現有 MES/ERP 系統的標準化介面，有效降低整合風險。\n\n如有興趣進一步了解，歡迎回覆安排通話。\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-13T10:00:00Z",
  },
  // Account 8: Himax → 邱建志 (315)
  {
    id: 408,
    contact_id: 315,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "DDIC 製程 CD 均勻性改善方案",
    body: "邱主任 您好，\n\n注意到 Himax 正在開發車用 DDIC 新世代製程。金屬層蝕刻 CD 均勻性控制是 DDIC 量產良率的常見挑戰。\n\n我們的 CD-SEM 量測搭配蝕刻 APC 整合方案已在多家 IDM 與 Foundry 驗證，可將 CD lot-to-lot variation 降低 45%，良率損失減少 5 個百分點以上。\n\n方便這週安排 20 分鐘的線上討論嗎？\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-16T10:00:00Z",
  },
  // Account 9: Winbond → 洪志豪 (317)
  {
    id: 409,
    contact_id: 317,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "12 吋晶圓廠製程量測 Cpk 提升方案",
    body: "洪協理 您好，\n\n恭喜 Winbond 啟動中科 12 吋晶圓廠第二期擴產！了解到貴司正在補強製程量測與設備管理人力，閘極氧化層量測 Cpk 提升將是先進製程節點的關鍵課題。\n\n我們的橢偏儀量測搭配 SPC 即時監控方案，已協助同類 NOR Flash 廠將薄膜量測 Cpk 從 1.1 提升至 1.8 以上。\n\n附上技術簡介，期待安排技術交流。\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-16T08:00:00Z",
  },
  // Account 10: AUO → 廖俊龍 (319)
  {
    id: 410,
    contact_id: 319,
    channel: "EMAIL",
    intent: "FIRST_TOUCH",
    subject: "MicroLED Mass Transfer 良率改善方案",
    body: "廖副總 您好，\n\n留意到 AUO 正在積極推進車用 MicroLED 面板新產線規劃。Mass Transfer 製程良率與 LED 晶粒位移控制，是 MicroLED 量產化的核心挑戰。\n\n我們的 Mass Transfer 位移量測方案搭配接合品質驗證平台，已協助多個面板廠將 Mass Transfer 位移超規比例從 3.5% 降至 0.5% 以下。\n\n方便安排通話討論嗎？\n\nBest regards,\nSales Team",
    status: "DRAFT",
    created_at: "2025-02-15T09:00:00Z",
  },
];

const MOCK_BANT = [
  // Account 1: ASE Technology — A (QUALIFIED)
  {
    id: 501,
    account_id: 1,
    grade: "A",
    total_score: 85,
    budget_score: 20,
    authority_score: 25,
    need_score: 25,
    timeline_score: 15,
    recommended_next_action: "安排與製程技術副總進行技術展示 (Demo)",
    created_at: "2025-02-14T16:00:00Z",
  },
  // Account 2: Powertech — C (DISCOVERY)
  {
    id: 505,
    account_id: 2,
    grade: "C",
    total_score: 40,
    budget_score: 10,
    authority_score: 10,
    need_score: 12,
    timeline_score: 8,
    recommended_next_action: "確認設備採購決策人後重新接觸",
    created_at: "2025-02-13T10:00:00Z",
  },
  // Account 3: Innolux — B (CONTACTED)
  {
    id: 506,
    account_id: 3,
    grade: "B",
    total_score: 55,
    budget_score: 12,
    authority_score: 15,
    need_score: 18,
    timeline_score: 10,
    recommended_next_action: "提供 OLED 製程良率改善案例研究",
    created_at: "2025-02-07T11:00:00Z",
  },
  // Account 4: UMC — B (CONTACTED)
  {
    id: 507,
    account_id: 4,
    grade: "B",
    total_score: 60,
    budget_score: 15,
    authority_score: 15,
    need_score: 20,
    timeline_score: 10,
    recommended_next_action: "跟進無塵室安裝規格與 MES 整合需求",
    created_at: "2025-02-17T10:00:00Z",
  },
  // Account 5: Foxsemicon — B (ENGAGED)
  {
    id: 508,
    account_id: 5,
    grade: "B",
    total_score: 65,
    budget_score: 15,
    authority_score: 18,
    need_score: 20,
    timeline_score: 12,
    recommended_next_action: "寄送 AMR 定位精度技術報告與 ROI 試算",
    created_at: "2025-02-15T11:00:00Z",
  },
  // Account 6: Micron Taiwan — A (TECHNICAL_EVAL)
  {
    id: 502,
    account_id: 6,
    grade: "A",
    total_score: 90,
    budget_score: 25,
    authority_score: 25,
    need_score: 25,
    timeline_score: 15,
    recommended_next_action: "準備技術評估 (Technical Evaluation) 文件與報價單",
    created_at: "2025-02-15T14:00:00Z",
  },
  // Account 7: Delta Electronics — C (NURTURE)
  {
    id: 504,
    account_id: 7,
    grade: "C",
    total_score: 30,
    budget_score: 5,
    authority_score: 10,
    need_score: 10,
    timeline_score: 5,
    recommended_next_action: "加入季度電子報培養名單，追蹤智慧製造採購預算動向",
    created_at: "2025-02-12T14:00:00Z",
  },
  // Account 8: Himax — C (DISCOVERY)
  {
    id: 509,
    account_id: 8,
    grade: "C",
    total_score: 35,
    budget_score: 8,
    authority_score: 8,
    need_score: 12,
    timeline_score: 7,
    recommended_next_action: "研究製程採購關鍵決策人後再接觸",
    created_at: "2025-02-16T10:00:00Z",
  },
  // Account 9: Winbond — A (QUALIFIED)
  {
    id: 503,
    account_id: 9,
    grade: "A",
    total_score: 80,
    budget_score: 20,
    authority_score: 20,
    need_score: 25,
    timeline_score: 15,
    recommended_next_action: "寄送 ROI 計算案例研究並草擬提案",
    created_at: "2025-02-15T17:00:00Z",
  },
  // Account 10: AUO — B (ENGAGED)
  {
    id: 510,
    account_id: 10,
    grade: "B",
    total_score: 58,
    budget_score: 13,
    authority_score: 15,
    need_score: 18,
    timeline_score: 12,
    recommended_next_action: "準備 MicroLED 製程方案技術演示簡報",
    created_at: "2025-02-14T12:00:00Z",
  },
];

const MOCK_INTERACTIONS = [
  // --- Account 1: ASE Technology ---
  {
    id: 601,
    contact_id: 301,
    contact_name: "陳志明",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary:
      "已寄出先進封裝 RDL 製程良率提升方案的開發信，介紹 In-line CD 量測與 AI 缺陷分類技術優勢。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-14T15:00:00Z",
  },
  {
    id: 602,
    contact_id: 301,
    contact_name: "陳志明",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary:
      "陳副總回覆表示有興趣了解更多細節，詢問方案是否支援 Fan-out 與 SiP 製程，並希望安排下週三技術展示。",
    sentiment: "POSITIVE",
    raw_ref: null,
    occurred_at: "2025-02-15T09:30:00Z",
  },
  // --- Account 2: Powertech ---
  {
    id: 605,
    contact_id: 305,
    contact_name: "王建宏",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary:
      "寄出 HBM 封裝設備稼動率優化方案的開發信，附上設備健康監控技術簡介。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-14T16:00:00Z",
  },
  {
    id: 606,
    contact_id: 305,
    contact_name: "王建宏",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary:
      "王主管回覆表示目前正在評估多家設備供應商，希望收到更詳細的 MTTR 改善技術規格書與案例。",
    sentiment: "NEUTRAL",
    raw_ref: null,
    occurred_at: "2025-02-16T10:00:00Z",
  },
  // --- Account 3: Innolux ---
  {
    id: 607,
    contact_id: 307,
    contact_name: "張俊偉",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary: "寄出 OLED 製程良率改善提案，包含 In-situ 薄膜監控與 AI ADC 成功案例。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-07T11:00:00Z",
  },
  {
    id: 608,
    contact_id: 307,
    contact_name: "張俊偉",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary: "張處長回覆表示已轉交設備製程團隊評估，預計兩週內回覆是否安排技術交流。",
    sentiment: "NEUTRAL",
    raw_ref: null,
    occurred_at: "2025-02-10T09:00:00Z",
  },
  // --- Account 4: UMC ---
  {
    id: 604,
    contact_id: 303,
    contact_name: "蔡文雄",
    channel: "MEETING",
    direction: "OUTBOUND",
    content_summary:
      "與 Fab 廠長進行 30 分鐘線上會議，討論 22nm 擴產線的 CMP 後缺陷管控自動化需求。對方態度謹慎，表示需先與製程整合團隊內部評估。",
    sentiment: "NEUTRAL",
    raw_ref: null,
    occurred_at: "2025-02-16T10:00:00Z",
  },
  {
    id: 609,
    contact_id: 309,
    contact_name: "黃淑芬",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary: "黃主任主動來信詢問 Post-CMP Sub-20nm 微粒偵測方案的技術規格、交期與無塵室安裝需求。",
    sentiment: "POSITIVE",
    raw_ref: null,
    occurred_at: "2025-02-17T08:30:00Z",
  },
  // --- Account 5: Foxsemicon ---
  {
    id: 610,
    contact_id: 310,
    contact_name: "鄭家豪",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary:
      "寄出半導體廠 AMR 定位精度提升解決方案的介紹郵件與無塵室 AMR 技術白皮書。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-15T10:30:00Z",
  },
  {
    id: 611,
    contact_id: 310,
    contact_name: "鄭家豪",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary:
      "鄭主管回覆表示目前正在為晶圓廠客戶進行 AMR 設備選型，希望安排現場 Demo 與 SEMI E87 合規性討論。",
    sentiment: "POSITIVE",
    raw_ref: null,
    occurred_at: "2025-02-17T14:00:00Z",
  },
  // --- Account 6: Micron Taiwan ---
  {
    id: 612,
    contact_id: 304,
    contact_name: "Kevin Huang",
    channel: "LINKEDIN",
    direction: "OUTBOUND",
    content_summary:
      "透過 LinkedIn 發送 1β DRAM Overlay 量測精度改善方案的 InMail，附上 APC 整合案例。",
    sentiment: null,
    raw_ref: "https://linkedin.com/messaging/thread/456",
    occurred_at: "2025-02-15T09:00:00Z",
  },
  {
    id: 613,
    contact_id: 304,
    contact_name: "Kevin Huang",
    channel: "MEETING",
    direction: "INBOUND",
    content_summary:
      "Kevin 主動安排 45 分鐘視訊會議，深入討論 Overlay APC 整合需求與技術評估流程，態度積極，表示已進入供應商短名單評估階段。",
    sentiment: "POSITIVE",
    raw_ref: null,
    occurred_at: "2025-02-16T15:00:00Z",
  },
  // --- Account 7: Delta Electronics ---
  {
    id: 614,
    contact_id: 313,
    contact_name: "楊智凱",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary: "寄出智慧工廠 AMR 導入效益提升方案介紹信，提及 MES/ERP 標準化整合介面優勢。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-13T10:30:00Z",
  },
  {
    id: 615,
    contact_id: 313,
    contact_name: "楊智凱",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary: "楊總監回覆表示目前自動化設備採購預算已凍結至下半年，建議 Q3 再聯繫討論。",
    sentiment: "NEGATIVE",
    raw_ref: null,
    occurred_at: "2025-02-14T11:00:00Z",
  },
  // --- Account 8: Himax ---
  {
    id: 616,
    contact_id: 315,
    contact_name: "邱建志",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary: "寄出 DDIC 製程 CD 均勻性改善方案的介紹郵件。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-16T10:30:00Z",
  },
  {
    id: 617,
    contact_id: 315,
    contact_name: "邱建志",
    channel: "PHONE",
    direction: "INBOUND",
    content_summary:
      "邱主任來電詢問 CD-SEM 量測與蝕刻 APC 整合方案的技術細節，表示目前有兩條車用 DDIC 產線的 CD 異常問題需要緊急解決。",
    sentiment: "POSITIVE",
    raw_ref: null,
    occurred_at: "2025-02-17T14:00:00Z",
  },
  // --- Account 9: Winbond ---
  {
    id: 618,
    contact_id: 317,
    contact_name: "洪志豪",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary:
      "寄出 12 吋晶圓廠製程量測 Cpk 提升方案介紹信，附上 NOR Flash 廠 Cpk 改善 ROI 試算表與成功案例。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-16T08:30:00Z",
  },
  {
    id: 619,
    contact_id: 317,
    contact_name: "洪志豪",
    channel: "MEETING",
    direction: "INBOUND",
    content_summary:
      "洪協理安排製程整合技術團隊與我方進行 1 小時線上會議，深入討論橢偏儀量測 SPC 整合架構。態度非常積極，表示 12 吋廠擴產後量測 Cpk 改善是 KPI 之一。",
    sentiment: "POSITIVE",
    raw_ref: null,
    occurred_at: "2025-02-17T10:00:00Z",
  },
  // --- Account 10: AUO ---
  {
    id: 620,
    contact_id: 319,
    contact_name: "廖俊龍",
    channel: "EMAIL",
    direction: "OUTBOUND",
    content_summary: "寄出 MicroLED Mass Transfer 良率改善方案的開發信。",
    sentiment: null,
    raw_ref: null,
    occurred_at: "2025-02-15T09:30:00Z",
  },
  {
    id: 621,
    contact_id: 319,
    contact_name: "廖俊龍",
    channel: "EMAIL",
    direction: "INBOUND",
    content_summary:
      "廖副總回覆表示有興趣，但需要先通過 AUO 內部新供應商評估流程，預計需 3-4 週，並請提供公司資料與技術白皮書。",
    sentiment: "NEUTRAL",
    raw_ref: null,
    occurred_at: "2025-02-16T16:00:00Z",
  },
];

const MOCK_PIPELINE = [
  {
    account_id: 1,
    company_name: "日月光半導體 (ASE Technology)",
    stage: "QUALIFIED",
    probability: 0.6,
    due_date: "2025-03-01",
    owner: "Sales Rep A",
    next_action: "安排製程技術展示 (Technical Demo)",
    blocker: null,
    latest_bant_grade: "A",
    latest_bant_score: 85,
  },
  {
    account_id: 2,
    company_name: "頎邦科技 (Powertech Technology)",
    stage: "DISCOVERY",
    probability: 0.2,
    due_date: "2025-03-15",
    owner: "Sales Rep B",
    next_action: "確認設備採購決策人並寄送技術規格書",
    blocker: "採購決策人待確認 (Decision Maker TBD)",
    latest_bant_grade: "C",
    latest_bant_score: 40,
  },
  {
    account_id: 3,
    company_name: "群創光電 (Innolux Corporation)",
    stage: "CONTACTED",
    probability: 0.25,
    due_date: "2025-03-20",
    owner: "Sales Rep C",
    next_action: "等待製程設備團隊評估回覆",
    blocker: null,
    latest_bant_grade: "B",
    latest_bant_score: 55,
  },
  {
    account_id: 4,
    company_name: "聯華電子 (UMC)",
    stage: "CONTACTED",
    probability: 0.3,
    due_date: "2025-03-20",
    owner: "Sales Rep A",
    next_action: "跟進無塵室安裝規格與 MES 整合需求",
    blocker: null,
    latest_bant_grade: "B",
    latest_bant_score: 60,
  },
  {
    account_id: 5,
    company_name: "富鼎先進科技 (Foxsemicon)",
    stage: "ENGAGED",
    probability: 0.5,
    due_date: "2025-04-01",
    owner: "Sales Rep C",
    next_action: "安排現場 Demo 與 SEMI E87 合規性討論",
    blocker: "現場 Demo 時程待確認 (Demo Schedule TBD)",
    latest_bant_grade: "B",
    latest_bant_score: 65,
  },
  {
    account_id: 6,
    company_name: "美光半導體台灣 (Micron Taiwan)",
    stage: "TECHNICAL_EVAL",
    probability: 0.8,
    due_date: "2025-02-28",
    owner: "Sales Manager",
    next_action: "提交技術評估文件並準備報價單",
    blocker: null,
    latest_bant_grade: "A",
    latest_bant_score: 90,
  },
  {
    account_id: 7,
    company_name: "台達電子 (Delta Electronics)",
    stage: "NURTURE",
    probability: 0.1,
    due_date: "2025-06-30",
    owner: "Sales Rep B",
    next_action: "Q3 重新確認採購預算狀況",
    blocker: "採購預算凍結至下半年 (Budget Frozen until H2)",
    latest_bant_grade: "C",
    latest_bant_score: 30,
  },
  {
    account_id: 8,
    company_name: "奇景光電 (Himax Technologies)",
    stage: "DISCOVERY",
    probability: 0.15,
    due_date: "2025-03-10",
    owner: "Sales Rep C",
    next_action: "跟進 DDIC 產線 CD 異常緊急需求",
    blocker: null,
    latest_bant_grade: "C",
    latest_bant_score: 35,
  },
  {
    account_id: 9,
    company_name: "華邦電子 (Winbond Electronics)",
    stage: "QUALIFIED",
    probability: 0.7,
    due_date: "2025-03-05",
    owner: "Sales Rep A",
    next_action: "草擬 12 吋廠量測方案提案 (Draft Proposal)",
    blocker: null,
    latest_bant_grade: "A",
    latest_bant_score: 80,
  },
  {
    account_id: 10,
    company_name: "友達光電 (AUO Corporation)",
    stage: "ENGAGED",
    probability: 0.45,
    due_date: "2025-03-25",
    owner: "Sales Rep B",
    next_action: "準備 MicroLED 方案技術演示簡報與供應商資料",
    blocker: "新供應商評估流程進行中 (Supplier Qualification in Progress)",
    latest_bant_grade: "B",
    latest_bant_score: 58,
  },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  accounts: {
    list: async () => {
      await delay(500);
      return { items: MOCK_ACCOUNTS };
    },
    get: async (id) => {
      await delay(300);
      const acc = MOCK_ACCOUNTS.find((a) => a.id === parseInt(id));
      if (!acc) throw { detail: "Account not found" };
      return acc;
    },
    create: async (data) => {
      await delay(500);
      const newAcc = {
        ...data,
        id: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      MOCK_ACCOUNTS.push(newAcc);
      return newAcc;
    },
    update: async (id, data) => {
      await delay(500);
      const acc = MOCK_ACCOUNTS.find((a) => a.id === parseInt(id));
      if (!acc) throw new Error("Account not found");
      Object.assign(acc, data, { updated_at: new Date().toISOString() });
      return acc;
    },
    delete: async (id) => {
      await delay(300);
      const idx = MOCK_ACCOUNTS.findIndex((a) => a.id === parseInt(id));
      if (idx !== -1) MOCK_ACCOUNTS.splice(idx, 1);
      return { status: "deleted" };
    },
    import: async (items) => {
      await delay(1000);
      return { status: "ok", inserted: items.length, updated: 0 };
    },
  },
  signals: {
    list: async (accountId) => {
      await delay(600);
      return {
        items: MOCK_SIGNALS.filter((s) => s.account_id === parseInt(accountId)),
      };
    },
    listGlobal: async () => {
      await delay(600);
      return {
        items: MOCK_SIGNALS.map((s) => ({
          ...s,
          account_name:
            MOCK_ACCOUNTS.find((a) => a.id === s.account_id)?.company_name ||
            "—",
        })),
      };
    },
    scan: async () => {
      await delay(2000);
      return { status: "completed", events_created: 2 };
    },
    delete: async (id) => {
      await delay(300);
      const idx = MOCK_SIGNALS.findIndex((s) => s.id === parseInt(id));
      if (idx !== -1) MOCK_SIGNALS.splice(idx, 1);
      return { status: "deleted" };
    },
  },
  pains: {
    list: async (accountId) => {
      await delay(600);
      return {
        items: MOCK_PAINS.filter((p) => p.account_id === parseInt(accountId)),
      };
    },
    listGlobal: async () => {
      await delay(600);
      return {
        items: MOCK_PAINS.map((p) => ({
          ...p,
          account_name:
            MOCK_ACCOUNTS.find((a) => a.id === p.account_id)?.company_name ||
            "—",
        })),
      };
    },
    generate: async () => {
      await delay(3000);
      return { status: "completed", generated: 2 };
    },
    update: async (painId, data) => {
      await delay(400);
      const pain = MOCK_PAINS.find((p) => p.id === parseInt(painId));
      if (!pain) throw new Error("Pain profile not found");
      Object.assign(pain, data);
      return pain;
    },
    delete: async (painId) => {
      await delay(300);
      const idx = MOCK_PAINS.findIndex((p) => p.id === parseInt(painId));
      if (idx !== -1) MOCK_PAINS.splice(idx, 1);
      return { status: "deleted" };
    },
  },
  contacts: {
    list: async (accountId) => {
      await delay(400);
      return {
        items: MOCK_CONTACTS.filter(
          (c) => c.account_id === parseInt(accountId),
        ),
      };
    },
    create: async (data) => {
      await delay(400);
      const newContact = {
        ...data,
        id: Date.now(),
        created_at: new Date().toISOString(),
      };
      MOCK_CONTACTS.push(newContact);
      return newContact;
    },
    delete: async (id) => {
      await delay(300);
      const idx = MOCK_CONTACTS.findIndex((c) => c.id === parseInt(id));
      if (idx !== -1) MOCK_CONTACTS.splice(idx, 1);
      return { status: "deleted" };
    },
  },
  outreach: {
    listByContact: async (contactId) => {
      await delay(500);
      return {
        items: MOCK_DRAFTS.filter((d) => d.contact_id === parseInt(contactId)),
      };
    },
    listGlobal: async () => {
      await delay(500);
      return {
        items: MOCK_DRAFTS.map((d) => {
          const contact = MOCK_CONTACTS.find((c) => c.id === d.contact_id);
          const account = contact
            ? MOCK_ACCOUNTS.find((a) => a.id === contact.account_id)
            : null;
          return {
            ...d,
            account_id: contact?.account_id,
            account_name: account?.company_name || "—",
          };
        }),
      };
    },
    generate: async (contactId, options = {}) => {
      await delay(3000);
      const newDraft = {
        id: Date.now(),
        contact_id: contactId,
        channel: options.channel || "EMAIL",
        intent: options.intent || "FIRST_TOUCH",
        subject: "AI Generated Outreach Draft",
        body: "Dear Contact,\n\nBased on our analysis, we believe our solution can help address your challenges.\n\nLooking forward to connecting.\n\nBest regards,\nSales Team",
        cta: "Schedule a call",
        tone: options.tone || "TECHNICAL",
        status: "DRAFT",
        created_at: new Date().toISOString(),
      };
      MOCK_DRAFTS.push(newDraft);
      return { draft_id: newDraft.id, status: "DRAFT" };
    },
    updateStatus: async (draftId, status) => {
      await delay(300);
      const draft = MOCK_DRAFTS.find((d) => d.id === parseInt(draftId));
      if (draft) draft.status = status;
      return draft || { status };
    },
  },
  bant: {
    list: async (accountId) => {
      await delay(400);
      return {
        items: MOCK_BANT.filter((b) => b.account_id === parseInt(accountId)),
      };
    },
    score: async () => {
      await delay(2000);
      return { status: "completed" };
    },
  },
  interactions: {
    list: async (accountId) => {
      await delay(400);
      const contactIds = MOCK_CONTACTS.filter(
        (c) => c.account_id === parseInt(accountId),
      ).map((c) => c.id);
      return {
        items: MOCK_INTERACTIONS.filter((i) =>
          contactIds.includes(i.contact_id),
        ),
      };
    },
    log: async (data) => {
      await delay(500);
      const contact = MOCK_CONTACTS.find((c) => c.id === data.contact_id);
      const newLog = {
        ...data,
        id: Date.now(),
        contact_name: contact?.full_name || "Unknown",
        occurred_at: data.occurred_at || new Date().toISOString(),
      };
      MOCK_INTERACTIONS.push(newLog);
      return {
        interaction_id: newLog.id,
        account_id: contact?.account_id,
        pipeline_stage:
          data.direction === "OUTBOUND"
            ? "CONTACTED"
            : data.sentiment === "POSITIVE"
              ? "ENGAGED"
              : "ENGAGED",
        status: "logged",
      };
    },
  },
  pipeline: {
    getBoard: async () => {
      await delay(800);
      return { items: MOCK_PIPELINE };
    },
  },
  knowledgeDocs: {
    list: async (params = {}) => {
      await delay(400);
      let items = [...MOCK_KNOWLEDGE_DOCS];
      if (params.account_id != null) {
        items = items.filter((d) => d.account_id === parseInt(params.account_id));
      }
      if (params.scope != null) {
        items = items.filter((d) => d.scope === params.scope);
      }
      return { items, total: items.length };
    },
    listByAccount: async (accountId) => {
      await delay(400);
      const items = MOCK_KNOWLEDGE_DOCS.filter(
        (d) => d.account_id === parseInt(accountId) || d.scope === 'global'
      );
      return { items, total: items.length };
    },
    create: async (data) => {
      await delay(500);
      const now = new Date().toISOString();
      const newDoc = {
        id: Date.now(),
        account_id: data.account_id || null,
        scope: data.scope || 'global',
        doc_type: data.doc_type,
        title: data.title,
        content: data.content,
        source_url: data.source_url || null,
        tags: data.tags || null,
        created_by: data.created_by || null,
        created_at: now,
        updated_at: now,
      };
      MOCK_KNOWLEDGE_DOCS.push(newDoc);
      return newDoc;
    },
    update: async (docId, data) => {
      await delay(400);
      const doc = MOCK_KNOWLEDGE_DOCS.find((d) => d.id === parseInt(docId));
      if (!doc) throw new Error('Document not found');
      Object.assign(doc, data, { updated_at: new Date().toISOString() });
      return doc;
    },
    delete: async (docId) => {
      await delay(300);
      const idx = MOCK_KNOWLEDGE_DOCS.findIndex((d) => d.id === parseInt(docId));
      if (idx !== -1) MOCK_KNOWLEDGE_DOCS.splice(idx, 1);
      return { status: 'deleted', doc_id: docId };
    },
  },
};

const MOCK_KNOWLEDGE_DOCS = [
  {
    id: 1,
    account_id: null,
    scope: 'global',
    doc_type: 'market_intel',
    title: '2026 台灣半導體設備市場情報摘要',
    content: '根據 SEMI 2026 Q1 報告，台灣半導體設備市場規模預計 2026-2028 年 CAGR 達 12%。主要驅動因素：先進封裝（CoWoS、Fan-out）需求爆發、台灣 Fab 擴產潮（UMC 22nm、Winbond 12 吋廠二期）、AI 晶片帶動 HBM 封裝測試設備需求激增。\n\n關鍵採購痛點：\n1. 關鍵設備交期從 12 週拉長至 28 週，產能 ramp-up 受限\n2. 良率損失是優先改善項目，尤其 CMP 後缺陷與封裝 TSV void\n3. 設備稼動率 (Equipment Availability) 目標普遍提升至 95% 以上\n4. AI 自動缺陷分類 (ADC) 導入需求快速成長，取代人工覆檢',
    source_url: 'https://example.com/semi-taiwan-2026',
    tags: 'semiconductor,equipment,taiwan,market,2026',
    created_by: 'sales_team',
    created_at: '2026-02-20T08:00:00Z',
    updated_at: '2026-02-20T08:00:00Z',
  },
  {
    id: 2,
    account_id: null,
    scope: 'global',
    doc_type: 'analyst_report',
    title: '先進封裝製程量測技術白皮書',
    content: '先進封裝製程（Fan-out、CoWoS、SiP）帶來新的量測挑戰：\n- RDL 線寬均勻性要求 CD 3σ < 5nm\n- TSV 深寬比 (Aspect ratio) 增加，電子束量測精度挑戰升高\n- 多層 RDL 疊層後的 Overlay 累積誤差控制\n\n現行業界主流方案：\n1. CD-SEM：精度高但速度慢（30s/點）\n2. OCD (Optical CD)：速度快但模型準確度受限\n3. 複合型方案（推薦）：OCD 即時監控 + CD-SEM 定期校驗 + AI 缺陷分類\n\n主要客戶痛點：\n先進封裝 NPI 時程壓縮（晶圓廠與封裝廠協作目標從 12 個月縮短至 6 個月），但製程量測驗證往往佔據 30-40% 的 NPI 時程。',
    source_url: null,
    tags: 'advanced_packaging,metrology,fan-out,cowos',
    created_by: 'tech_team',
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 3,
    account_id: 1,
    scope: 'account',
    doc_type: 'earnings_call',
    title: 'ASE Technology 2025 Q4 法說會重點摘要',
    content: 'ASE Technology 2025 Q4 法說會（2026-01-30）重點：\n\nCEO 表示：「我們的 Fan-out 先進封裝良率已從 Q3 的 82% 提升至 Q4 的 87%，但仍低於量產目標 93%。主要瓶頸在於 RDL 製程均勻性檢測速度，目前每條產線日產能 500 片，檢測瓶頸導致實際產出只有 420 片。」\n\nCFO：「2026 年資本支出計劃 50 億台幣，其中 35% 用於封裝製程線升級，重點項目包括 In-line 量測系統替換與 MES 製程追溯平台建置。」\n\n技術長：「我們正在評估 4 家供應商的新型製程量測方案，要求：1) 與現有 MES 系統整合 2) 量測速度提升 60% 3) 支援 SPC 即時監控與 APC 回饋。預計 Q1 完成評估、Q2 導入。」',
    source_url: null,
    tags: 'earnings_call,2025Q4,capex,ase',
    created_by: 'sales_rep',
    created_at: '2026-02-01T14:00:00Z',
    updated_at: '2026-02-01T14:00:00Z',
  },
];
