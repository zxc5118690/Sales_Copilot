const API_PREFIX = "/api/v1";

const STAGE_ORDER = [
  "TARGET",
  "DISCOVERY",
  "SOLUTION_FIT",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
];

const state = {
  accounts: [],
  contacts: [],
  selectedAccountId: null,
  selectedContactId: null,
  demoReportMarkdown: "",
};

const els = {};

function bindElements() {
  els.healthBadge = document.getElementById("health-badge");
  els.metricWindow = document.getElementById("metric-window");
  els.metricOutbound = document.getElementById("metric-outbound");
  els.metricInbound = document.getElementById("metric-inbound");
  els.metricTouched = document.getElementById("metric-touched");
  els.metricDrafts = document.getElementById("metric-drafts");
  els.metricBant = document.getElementById("metric-bant");

  els.pipelineBoard = document.getElementById("pipeline-board");
  els.accountsBody = document.getElementById("accounts-body");
  els.contactsBody = document.getElementById("contacts-body");

  els.selectionLabel = document.getElementById("selection-label");
  els.signalsList = document.getElementById("signals-list");
  els.painList = document.getElementById("pain-list");
  els.bantList = document.getElementById("bant-list");
  els.outreachList = document.getElementById("outreach-list");
  els.activityLog = document.getElementById("activity-log");

  els.accountForm = document.getElementById("account-form");
  els.accountEditForm = document.getElementById("account-edit-form");
  els.deleteAccountBtn = document.getElementById("delete-account-btn");
  els.accountImportForm = document.getElementById("account-import-form");
  els.accountImportFile = document.getElementById("account-import-file");
  els.accountImportSource = document.getElementById("account-import-source");
  els.contactForm = document.getElementById("contact-form");
  els.contactEditForm = document.getElementById("contact-edit-form");
  els.deleteContactBtn = document.getElementById("delete-contact-btn");
  els.contactAccountId = document.getElementById("contact-account-id");

  els.signalsForm = document.getElementById("signals-form");
  els.signalsAccountIds = document.getElementById("signals-account-ids");

  els.painForm = document.getElementById("pain-form");
  els.painAccountId = document.getElementById("pain-account-id");
  els.bantForm = document.getElementById("bant-form");
  els.bantAccountId = document.getElementById("bant-account-id");

  els.outreachForm = document.getElementById("outreach-form");
  els.outreachContactId = document.getElementById("outreach-contact-id");

  els.interactionForm = document.getElementById("interaction-form");
  els.interactionContactId = document.getElementById("interaction-contact-id");

  els.e2eForm = document.getElementById("e2e-form");
  els.e2eAccountId = document.getElementById("e2e-account-id");
  els.e2eContactId = document.getElementById("e2e-contact-id");
  els.demoReportForm = document.getElementById("demo-report-form");
  els.demoReportAccountId = document.getElementById("demo-report-account-id");
  els.demoReportOutput = document.getElementById("demo-report-output");
  els.downloadDemoReportBtn = document.getElementById("download-demo-report-btn");
}

function escapeHtml(raw) {
  return String(raw ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function api(path, { method = "GET", body } = {}) {
  const headers = {};
  const options = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_PREFIX}${path}`, options);
  const text = await response.text();
  let payload = {};
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.detail || `HTTP ${response.status}`;
    const error = new Error(
      Array.isArray(detail) ? JSON.stringify(detail) : String(detail)
    );
    error.requestId = response.headers.get("X-Request-ID") || payload?.request_id || "-";
    throw error;
  }

  return payload;
}

function nowLabel() {
  return new Date().toLocaleString("zh-Hant-TW", { hour12: false });
}

function logActivity(level, message, extra) {
  const line = `[${nowLabel()}] [${level}] ${message}`;
  let append = line;
  if (extra !== undefined) {
    append += `\n${JSON.stringify(extra, null, 2)}`;
  }
  const current = els.activityLog.textContent.trim();
  els.activityLog.textContent = current ? `${append}\n\n${current}` : append;
}

function setApiHealth(online) {
  els.healthBadge.classList.toggle("offline", !online);
  els.healthBadge.textContent = online ? "API 在線" : "API 離線";
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIdList(raw) {
  const ids = String(raw || "")
    .split(/[,\s]+/)
    .map((part) => Number(part.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);
  return [...new Set(ids)];
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let idx = 0; idx < line.length; idx += 1) {
    const char = line[idx];
    if (char === '"' && line[idx + 1] === '"') {
      current += '"';
      idx += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current.trim());
  return result;
}

function parseAccountsCsv(text, source = "web_import") {
  const lines = String(text || "")
    .replaceAll("\r", "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error("CSV 至少需要標題列與一筆資料。");
  }
  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase());
  const required = ["company_name", "segment"];
  for (const field of required) {
    if (!headers.includes(field)) {
      throw new Error(`CSV 缺少必要欄位：${field}`);
    }
  }

  const records = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = (cols[idx] || "").trim();
    });
    if (!row.company_name || !row.segment) {
      continue;
    }
    records.push({
      company_name: row.company_name,
      segment: row.segment.toUpperCase(),
      region: row.region || null,
      website: row.website || null,
      source: row.source || source,
      priority_tier: row.priority_tier || "T3",
    });
  }
  if (!records.length) {
    throw new Error("CSV 沒有可匯入的有效資料。");
  }
  return records;
}

function formatDate(raw) {
  if (!raw) return "-";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("zh-Hant-TW");
}

function syncSelectionLabel() {
  const account = state.accounts.find((item) => item.id === state.selectedAccountId);
  const contact = state.contacts.find((item) => item.id === state.selectedContactId);
  const accountLabel = account ? `${account.id} ${account.company_name}` : "-";
  const contactLabel = contact ? `${contact.id} ${contact.full_name || "(未命名)"}` : "-";
  els.selectionLabel.textContent = `帳戶：${accountLabel} | 聯絡人：${contactLabel}`;
}

function syncSelectionInputs() {
  const accountId = state.selectedAccountId ? String(state.selectedAccountId) : "";
  const contactId = state.selectedContactId ? String(state.selectedContactId) : "";

  els.painAccountId.value = accountId;
  els.bantAccountId.value = accountId;
  if (!els.signalsAccountIds.value || els.signalsAccountIds.dataset.auto === "true") {
    els.signalsAccountIds.value = accountId;
    els.signalsAccountIds.dataset.auto = "true";
  }

  els.outreachContactId.value = contactId;
  els.interactionContactId.value = contactId;
  els.e2eAccountId.value = accountId;
  els.e2eContactId.value = contactId;
  els.demoReportAccountId.value = accountId;
  syncAccountEditForm();
  syncContactEditForm();
  syncSelectionLabel();
}

function syncAccountEditForm() {
  const account = state.accounts.find((item) => item.id === state.selectedAccountId);
  els.accountEditForm.elements.id.value = account?.id ? String(account.id) : "";
  els.accountEditForm.elements.company_name.value = account?.company_name || "";
  els.accountEditForm.elements.segment.value = account?.segment || "";
  els.accountEditForm.elements.region.value = account?.region || "";
  els.accountEditForm.elements.website.value = account?.website || "";
  els.accountEditForm.elements.priority_tier.value = account?.priority_tier || "";
}

function syncContactEditForm() {
  const contact = state.contacts.find((item) => item.id === state.selectedContactId);
  els.contactEditForm.elements.id.value = contact?.id ? String(contact.id) : "";
  els.contactEditForm.elements.full_name.value = contact?.full_name || "";
  els.contactEditForm.elements.role_title.value = contact?.role_title || "";
  els.contactEditForm.elements.channel_email.value = contact?.channel_email || "";
  els.contactEditForm.elements.channel_linkedin.value = contact?.channel_linkedin || "";
  els.contactEditForm.elements.contactability_score.value =
    contact?.contactability_score != null ? String(contact.contactability_score) : "";
}

function renderAccounts() {
  if (!state.accounts.length) {
    els.accountsBody.innerHTML = `<tr><td colspan="5"><p class="empty">目前沒有帳戶資料。</p></td></tr>`;
    return;
  }

  const rows = state.accounts.map((item) => {
    const selected = item.id === state.selectedAccountId ? "selected" : "";
    return `
      <tr data-account-id="${item.id}" class="${selected}">
        <td>${item.id}</td>
        <td>${escapeHtml(item.company_name)}</td>
        <td>${escapeHtml(item.segment)}</td>
        <td>${escapeHtml(item.region || "-")}</td>
        <td>${escapeHtml(item.priority_tier || "-")}</td>
      </tr>
    `;
  });
  els.accountsBody.innerHTML = rows.join("");
}

function renderContacts() {
  if (!state.contacts.length) {
    els.contactsBody.innerHTML = `<tr><td colspan="5"><p class="empty">此帳戶目前沒有聯絡人。</p></td></tr>`;
    return;
  }

  const rows = state.contacts.map((item) => {
    const selected = item.id === state.selectedContactId ? "selected" : "";
    return `
      <tr data-contact-id="${item.id}" class="${selected}">
        <td>${item.id}</td>
        <td>${item.account_id}</td>
        <td>${escapeHtml(item.full_name || "-")}</td>
        <td>${escapeHtml(item.channel_email || "-")}</td>
        <td>${item.contactability_score ?? "-"}</td>
      </tr>
    `;
  });
  els.contactsBody.innerHTML = rows.join("");
}

function renderContactAccountOptions() {
  if (!state.accounts.length) {
    els.contactAccountId.innerHTML = `<option value="">無可用帳戶</option>`;
    els.contactAccountId.disabled = true;
    return;
  }

  const options = state.accounts
    .map(
      (item) =>
        `<option value="${item.id}" ${
          item.id === state.selectedAccountId ? "selected" : ""
        }>${item.id} - ${escapeHtml(item.company_name)}</option>`
    )
    .join("");
  els.contactAccountId.disabled = false;
  els.contactAccountId.innerHTML = options;
}

function renderWeeklyMetrics(report) {
  if (!report) {
    els.metricWindow.textContent = "-";
    els.metricOutbound.textContent = "0";
    els.metricInbound.textContent = "0";
    els.metricTouched.textContent = "0";
    els.metricDrafts.textContent = "0";
    els.metricBant.textContent = "0 / 0 / 0";
    return;
  }

  els.metricWindow.textContent = `${report.start_date} ~ ${report.end_date}`;
  els.metricOutbound.textContent = String(report.outbound_count);
  els.metricInbound.textContent = String(report.inbound_count);
  els.metricTouched.textContent = String(report.accounts_touched);
  els.metricDrafts.textContent = String(report.drafts_created);
  els.metricBant.textContent = `${report.bant_a_count} / ${report.bant_b_count} / ${report.bant_c_count}`;
}

function renderPipeline(items) {
  if (!items.length) {
    els.pipelineBoard.innerHTML = `<p class="empty">目前沒有 Pipeline 資料。</p>`;
    return;
  }

  const group = new Map();
  for (const item of items) {
    if (!group.has(item.stage)) {
      group.set(item.stage, []);
    }
    group.get(item.stage).push(item);
  }

  const stages = [...group.keys()].sort((a, b) => {
    const ai = STAGE_ORDER.indexOf(a);
    const bi = STAGE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const columns = stages.map((stage) => {
    const cards = group.get(stage).map((item) => {
      const company = escapeHtml(item.company_name);
      return `
        <article class="ticket" data-account-id="${item.account_id}">
          <h4>${company}</h4>
          <p class="mini">機率 ${Math.round((item.probability || 0) * 100)}% · 到期 ${escapeHtml(item.due_date)}</p>
          <p class="mini">${escapeHtml(item.next_action)}</p>
          <p class="mini">BANT ${escapeHtml(item.latest_bant_grade || "-")} (${item.latest_bant_score ?? "-"})</p>
        </article>
      `;
    });
    return `
      <section class="stage-column">
        <p class="stage-title">${escapeHtml(stage)} (${group.get(stage).length})</p>
        ${cards.join("")}
      </section>
    `;
  });

  els.pipelineBoard.innerHTML = columns.join("");
}

function emptyState(message) {
  return `<p class="empty">${escapeHtml(message)}</p>`;
}

function renderSignals(items) {
  if (!items.length) {
    els.signalsList.innerHTML = emptyState("目前沒有 Signals。");
    return;
  }
  els.signalsList.innerHTML = items
    .map(
      (item) => `
        <article class="list-card">
          <h5>${escapeHtml(item.signal_type)} · 強度 ${item.signal_strength}</h5>
          <p>${escapeHtml(item.summary)}</p>
          <p class="mono">${formatDate(item.event_date)} · ${escapeHtml(item.source_name || "未知來源")}</p>
          <p class="mono"><a href="${escapeHtml(item.evidence_url)}" target="_blank" rel="noreferrer">來源連結</a></p>
        </article>
      `
    )
    .join("");
}

function renderPainProfiles(items) {
  if (!items.length) {
    els.painList.innerHTML = emptyState("目前沒有 Pain Profiles。");
    return;
  }
  els.painList.innerHTML = items
    .map(
      (item) => `
        <article class="list-card">
          <h5>${escapeHtml(item.persona)} · ${(item.confidence * 100).toFixed(0)}%</h5>
          <p>${escapeHtml(item.pain_statement)}</p>
          <p>${escapeHtml(item.business_impact)}</p>
          <p class="mono">${escapeHtml(item.model_provider || "-")} · ${formatDate(item.created_at)}</p>
        </article>
      `
    )
    .join("");
}

function renderBant(items) {
  if (!items.length) {
    els.bantList.innerHTML = emptyState("目前沒有 BANT 歷史。");
    return;
  }
  els.bantList.innerHTML = items
    .map(
      (item) => `
        <article class="list-card">
          <h5>分數 ${item.total_score} · 等級 ${escapeHtml(item.grade)}</h5>
          <p class="mono">B:${item.budget_score} A:${item.authority_score} N:${item.need_score} T:${item.timeline_score}</p>
          <p>${escapeHtml(item.recommended_next_action)}</p>
          <p class="mono">${formatDate(item.created_at)}</p>
        </article>
      `
    )
    .join("");
}

function renderOutreach(items) {
  if (!items.length) {
    els.outreachList.innerHTML = emptyState("目前沒有 Outreach 草稿。");
    return;
  }
  els.outreachList.innerHTML = items
    .map(
      (item) => `
        <article class="list-card" data-draft-id="${item.id}">
          <h5>${escapeHtml(item.channel)} · ${escapeHtml(item.intent)} · ${escapeHtml(item.tone)}</h5>
          <p>${escapeHtml(item.subject || "（無主旨）")}</p>
          <p>${escapeHtml(item.body)}</p>
          <p class="mono">${escapeHtml(item.model_provider)} · ${formatDate(item.created_at)}</p>
          <div class="status-row">
            <select data-status-input>
              <option value="DRAFT" ${item.status === "DRAFT" ? "selected" : ""}>DRAFT</option>
              <option value="APPROVED" ${item.status === "APPROVED" ? "selected" : ""}>APPROVED</option>
              <option value="REJECTED" ${item.status === "REJECTED" ? "selected" : ""}>REJECTED</option>
            </select>
            <button class="btn-secondary" type="button" data-update-status>更新狀態</button>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadHealth() {
  try {
    await api("/health");
    setApiHealth(true);
  } catch (error) {
    setApiHealth(false);
    logActivity("ERROR", `健康檢查失敗：${error.message}`);
  }
}

async function loadWeeklyReport() {
  try {
    const report = await api("/reports/weekly");
    renderWeeklyMetrics(report);
  } catch (error) {
    renderWeeklyMetrics(null);
    logActivity("ERROR", `週報載入失敗：${error.message}`);
  }
}

async function loadPipelineBoard() {
  try {
    const response = await api("/pipeline/board");
    renderPipeline(response.items || []);
  } catch (error) {
    els.pipelineBoard.innerHTML = emptyState(`Pipeline 載入失敗：${error.message}`);
    logActivity("ERROR", `Pipeline 看板載入失敗：${error.message}`);
  }
}

async function loadAccounts() {
  const response = await api("/accounts");
  state.accounts = response.items || [];

  if (!state.accounts.length) {
    state.selectedAccountId = null;
    state.selectedContactId = null;
  } else if (!state.accounts.some((item) => item.id === state.selectedAccountId)) {
    state.selectedAccountId = state.accounts[0].id;
  }

  renderAccounts();
  renderContactAccountOptions();
  syncSelectionInputs();
}

async function loadContacts() {
  const accountQuery = state.selectedAccountId ? `?account_id=${state.selectedAccountId}` : "";
  const response = await api(`/contacts${accountQuery}`);
  state.contacts = response.items || [];

  if (!state.contacts.length) {
    state.selectedContactId = null;
  } else if (!state.contacts.some((item) => item.id === state.selectedContactId)) {
    state.selectedContactId = state.contacts[0].id;
  }

  renderContacts();
  syncSelectionInputs();
}

async function loadAccountInsights() {
  if (!state.selectedAccountId) {
    renderSignals([]);
    renderPainProfiles([]);
    renderBant([]);
    return;
  }

  const accountId = state.selectedAccountId;
  const [signals, pains, bant] = await Promise.all([
    api(`/signals/accounts/${accountId}`).catch(() => ({ items: [] })),
    api(`/pain-profiles/accounts/${accountId}`).catch(() => ({ items: [] })),
    api(`/bant/accounts/${accountId}`).catch(() => ({ items: [] })),
  ]);

  renderSignals(signals.items || []);
  renderPainProfiles(pains.items || []);
  renderBant(bant.items || []);
}

async function loadOutreach() {
  if (!state.selectedContactId) {
    renderOutreach([]);
    return;
  }
  const response = await api(`/outreach/contacts/${state.selectedContactId}`).catch(() => ({ items: [] }));
  renderOutreach(response.items || []);
}

function toIsoDate(raw) {
  if (!raw) return "N/A";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toISOString();
}

async function fetchLatestDraftByAccount(accountId) {
  const contactsResp = await api(`/contacts?account_id=${accountId}`).catch(() => ({ items: [] }));
  const contacts = contactsResp.items || [];
  if (!contacts.length) return null;

  const draftsByContact = await Promise.all(
    contacts.map((contact) => api(`/outreach/contacts/${contact.id}`).catch(() => ({ items: [] })))
  );
  const allDrafts = draftsByContact.flatMap((row) => row.items || []);
  if (!allDrafts.length) return null;
  return allDrafts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
}

function buildDemoReportMarkdown({
  account,
  signals,
  pains,
  latestDraft,
  latestBant,
  pipelineItem,
  weekly,
}) {
  const lines = [];
  lines.push(`# AI Sales Copilot 示範報告 - ${account.company_name}`);
  lines.push("");
  lines.push("## 1. 帳戶快照 (Account Snapshot)");
  lines.push(`- 帳戶編號 Account ID: ${account.id}`);
  lines.push(`- 產品分群 Segment: ${account.segment}`);
  lines.push(`- 優先級 Priority Tier: ${account.priority_tier || "N/A"}`);
  lines.push(`- 區域 Region: ${account.region || "N/A"}`);
  lines.push("");
  lines.push("## 2. 市場雷達 (Market Radar)");
  if ((signals || []).length) {
    for (const item of signals.slice(0, 5)) {
      lines.push(
        `- [${item.signal_type}] 分數 score=${item.signal_strength} | 來源 source=${item.source_name || "unknown"} | 發布時間 published=${toIsoDate(item.source_published_at)}`
      );
      lines.push(`  摘要 summary: ${item.summary}`);
    }
  } else {
    lines.push("- 尚未找到市場訊號。");
  }
  lines.push("");
  lines.push("## 3. 客戶痛點 (Pain Profiles)");
  if ((pains || []).length) {
    for (const item of pains.slice(0, 5)) {
      lines.push(`- 對象 persona=${item.persona} | 信心值 confidence=${item.confidence.toFixed(2)}`);
      lines.push(`  痛點 pain: ${item.pain_statement}`);
      lines.push(`  影響 impact: ${item.business_impact}`);
    }
  } else {
    lines.push("- 尚未產出 pain profile。");
  }
  lines.push("");
  lines.push("## 4. 開發訊息草稿 (Outreach Draft)");
  if (latestDraft) {
    lines.push(
      `- 草稿編號 Draft ID: ${latestDraft.id} | 渠道 channel=${latestDraft.channel} | 模型 provider=${latestDraft.model_provider}`
    );
    if (latestDraft.subject) {
      lines.push(`- 主旨 Subject: ${latestDraft.subject}`);
    }
    lines.push(`- 行動呼籲 CTA: ${latestDraft.cta || "N/A"}`);
  } else {
    lines.push("- 尚未找到草稿。");
  }
  lines.push("");
  lines.push("## 5. 商機資格與管道 (Qualification & Pipeline)");
  if (latestBant) {
    lines.push(
      `- BANT 分數 Score: ${latestBant.total_score} | 等級 Grade: ${latestBant.grade} | 建議行動 Action: ${latestBant.recommended_next_action}`
    );
  } else {
    lines.push("- 尚未找到 BANT 評分。");
  }
  if (pipelineItem) {
    lines.push(
      `- Pipeline 階段 Stage: ${pipelineItem.stage} | 機率 Probability: ${pipelineItem.probability.toFixed(2)} | 到期日 Due: ${pipelineItem.due_date}`
    );
    lines.push(`- 下一步 Next Action: ${pipelineItem.next_action}`);
  } else {
    lines.push("- 尚未找到 pipeline 項目。");
  }
  lines.push("");
  lines.push("## 6. 週指標 (Weekly KPI)");
  lines.push(`- 外撥 Outbound: ${weekly.outbound_count}`);
  lines.push(`- 回覆 Inbound: ${weekly.inbound_count}`);
  lines.push(`- 觸及帳戶 Accounts Touched: ${weekly.accounts_touched}`);
  lines.push(`- 草稿數 Drafts Created: ${weekly.drafts_created}`);
  lines.push(`- BANT A/B/C 比例: ${weekly.bant_a_count}/${weekly.bant_b_count}/${weekly.bant_c_count}`);
  lines.push("");
  lines.push("## 7. 建議行動 (Recommendation)");
  lines.push("- 建議每 3-7 天更新一次該帳戶的市場訊號。");
  lines.push("- 後續訊息應綁定最高優先痛點與 NPI 時程。");
  lines.push("- 若下次互動確認 authority 與 timeline，可直接觸發 Titan handoff。");
  lines.push("");
  return lines.join("\n");
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

async function refreshData() {
  await Promise.all([loadHealth(), loadWeeklyReport(), loadPipelineBoard()]);
  await loadAccounts();
  await loadContacts();
  await Promise.all([loadAccountInsights(), loadOutreach()]);
}

async function selectAccount(accountId, reloadContacts = true) {
  state.selectedAccountId = accountId;
  renderAccounts();
  renderContactAccountOptions();
  syncSelectionInputs();
  if (reloadContacts) {
    await loadContacts();
  }
  await Promise.all([loadAccountInsights(), loadOutreach()]);
}

async function selectContact(contactId) {
  state.selectedContactId = contactId;
  renderContacts();
  syncSelectionInputs();
  await loadOutreach();
}

function formToObject(form) {
  const raw = Object.fromEntries(new FormData(form).entries());
  for (const [key, value] of Object.entries(raw)) {
    if (value === "") {
      delete raw[key];
    }
  }
  return raw;
}

function attachEventHandlers() {
  document.getElementById("refresh-all").addEventListener("click", async () => {
    try {
      await refreshData();
      logActivity("INFO", "儀表板已重新整理。");
    } catch (error) {
      logActivity("ERROR", `重新整理失敗：${error.message}`);
    }
  });

  document.getElementById("reload-pipeline").addEventListener("click", async () => {
    await loadPipelineBoard();
    logActivity("INFO", "Pipeline 看板已重新載入。");
  });

  document.getElementById("reload-accounts").addEventListener("click", async () => {
    await loadAccounts();
    await loadContacts();
    await Promise.all([loadAccountInsights(), loadOutreach()]);
    logActivity("INFO", "帳戶與聯絡人已重新載入。");
  });

  document.getElementById("reload-contacts").addEventListener("click", async () => {
    await loadContacts();
    await loadOutreach();
    logActivity("INFO", "聯絡人已重新載入。");
  });

  document.getElementById("clear-log").addEventListener("click", () => {
    els.activityLog.textContent = "";
  });

  els.signalsAccountIds.addEventListener("input", () => {
    els.signalsAccountIds.dataset.auto = "false";
  });

  els.accountsBody.addEventListener("click", async (event) => {
    const row = event.target.closest("tr[data-account-id]");
    if (!row) return;
    const accountId = Number(row.dataset.accountId);
    await selectAccount(accountId, true);
    logActivity("INFO", `已選取帳戶 ${accountId}。`);
  });

  els.contactsBody.addEventListener("click", async (event) => {
    const row = event.target.closest("tr[data-contact-id]");
    if (!row) return;
    const contactId = Number(row.dataset.contactId);
    await selectContact(contactId);
    logActivity("INFO", `已選取聯絡人 ${contactId}。`);
  });

  els.pipelineBoard.addEventListener("click", async (event) => {
    const ticket = event.target.closest(".ticket[data-account-id]");
    if (!ticket) return;
    const accountId = Number(ticket.dataset.accountId);
    await selectAccount(accountId, true);
    logActivity("INFO", `已從 Pipeline 跳轉到帳戶 ${accountId}。`);
  });

  els.accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.accountForm);
      payload.segment = String(payload.segment || "").toUpperCase();
      const created = await api("/accounts", { method: "POST", body: payload });
      await loadAccounts();
      await selectAccount(created.id, true);
      els.accountForm.reset();
      els.accountForm.elements.segment.value = "AR_VR";
      els.accountForm.elements.region.value = "TW";
      els.accountForm.elements.priority_tier.value = "T3";
      logActivity("INFO", `已建立帳戶：${created.id} ${created.company_name}`);
    } catch (error) {
      logActivity("ERROR", `建立帳戶失敗：${error.message}`);
    }
  });

  els.accountEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const accountId = toNumber(els.accountEditForm.elements.id.value);
      if (!accountId) {
        throw new Error("請先選取帳戶。");
      }
      const payload = formToObject(els.accountEditForm);
      delete payload.id;
      if (payload.segment) {
        payload.segment = String(payload.segment).toUpperCase();
      }
      if (!Object.keys(payload).length) {
        throw new Error("請至少填寫一個更新欄位。");
      }
      const updated = await api(`/accounts/${accountId}`, { method: "PATCH", body: payload });
      await loadAccounts();
      await selectAccount(updated.id, true);
      logActivity("INFO", `已更新帳戶：${updated.id} ${updated.company_name}`);
    } catch (error) {
      logActivity("ERROR", `更新帳戶失敗：${error.message}`);
    }
  });

  els.deleteAccountBtn.addEventListener("click", async () => {
    try {
      const accountId = toNumber(els.accountEditForm.elements.id.value);
      if (!accountId) {
        throw new Error("請先選取帳戶。");
      }
      if (!window.confirm(`確定要刪除帳戶 #${accountId} 嗎？`)) {
        return;
      }
      await api(`/accounts/${accountId}`, { method: "DELETE" });
      await loadAccounts();
      await loadContacts();
      await Promise.all([loadPipelineBoard(), loadWeeklyReport(), loadAccountInsights(), loadOutreach()]);
      logActivity("INFO", `已刪除帳戶：${accountId}`);
    } catch (error) {
      logActivity("ERROR", `刪除帳戶失敗：${error.message}`);
    }
  });

  els.accountImportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const file = els.accountImportFile.files?.[0];
      if (!file) {
        throw new Error("請先選擇 CSV 檔案。");
      }
      const text = await file.text();
      const source = String(els.accountImportSource.value || "web_import").trim();
      const items = parseAccountsCsv(text, source);
      const result = await api("/accounts/import", { method: "POST", body: { items } });
      await loadAccounts();
      await loadContacts();
      els.accountImportForm.reset();
      logActivity("INFO", "帳戶 CSV 匯入完成。", result);
    } catch (error) {
      logActivity("ERROR", `帳戶 CSV 匯入失敗：${error.message}`);
    }
  });

  els.contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.contactForm);
      payload.account_id = toNumber(payload.account_id);
      payload.contactability_score = toNumber(payload.contactability_score);
      const created = await api("/contacts", { method: "POST", body: payload });
      await loadContacts();
      await selectContact(created.id);
      els.contactForm.reset();
      renderContactAccountOptions();
      logActivity("INFO", `已建立聯絡人：${created.id}（帳戶 ${created.account_id}）`);
    } catch (error) {
      logActivity("ERROR", `建立聯絡人失敗：${error.message}`);
    }
  });

  els.contactEditForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const contactId = toNumber(els.contactEditForm.elements.id.value);
      if (!contactId) {
        throw new Error("請先選取聯絡人。");
      }
      const payload = formToObject(els.contactEditForm);
      delete payload.id;
      if (payload.contactability_score !== undefined) {
        payload.contactability_score = toNumber(payload.contactability_score);
      }
      if (!Object.keys(payload).length) {
        throw new Error("請至少填寫一個更新欄位。");
      }
      const updated = await api(`/contacts/${contactId}`, { method: "PATCH", body: payload });
      await loadContacts();
      await selectContact(updated.id);
      logActivity("INFO", `已更新聯絡人：${updated.id}`);
    } catch (error) {
      logActivity("ERROR", `更新聯絡人失敗：${error.message}`);
    }
  });

  els.deleteContactBtn.addEventListener("click", async () => {
    try {
      const contactId = toNumber(els.contactEditForm.elements.id.value);
      if (!contactId) {
        throw new Error("請先選取聯絡人。");
      }
      if (!window.confirm(`確定要刪除聯絡人 #${contactId} 嗎？`)) {
        return;
      }
      await api(`/contacts/${contactId}`, { method: "DELETE" });
      await loadContacts();
      await Promise.all([loadOutreach(), loadWeeklyReport()]);
      logActivity("INFO", `已刪除聯絡人：${contactId}`);
    } catch (error) {
      logActivity("ERROR", `刪除聯絡人失敗：${error.message}`);
    }
  });

  els.signalsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.signalsForm);
      payload.account_ids = parseIdList(payload.account_ids);
      payload.lookback_days = toNumber(payload.lookback_days) || 90;
      payload.max_results_per_account = toNumber(payload.max_results_per_account) || 8;
      payload.use_tavily = true;
      if (!payload.account_ids.length) {
        throw new Error("請至少輸入一個帳戶 ID。");
      }
      const result = await api("/signals/scan", { method: "POST", body: payload });
      if (state.selectedAccountId && payload.account_ids.includes(state.selectedAccountId)) {
        await loadAccountInsights();
      }
      logActivity("INFO", "Signals 掃描完成。", result);
    } catch (error) {
      logActivity("ERROR", `Signals 掃描失敗：${error.message}`);
    }
  });

  els.painForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.painForm);
      payload.account_id = toNumber(payload.account_id);
      payload.max_items = toNumber(payload.max_items) || 3;
      payload.persona_targets = String(payload.persona_targets || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (!payload.account_id) {
        throw new Error("帳戶 ID 為必填。");
      }
      const result = await api("/pain-profiles/generate", { method: "POST", body: payload });
      if (payload.account_id === state.selectedAccountId) {
        await loadAccountInsights();
      }
      logActivity("INFO", "Pain Profiles 產生完成。", result);
    } catch (error) {
      logActivity("ERROR", `Pain Profiles 產生失敗：${error.message}`);
    }
  });

  els.bantForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.bantForm);
      payload.account_id = toNumber(payload.account_id);
      payload.lookback_days = toNumber(payload.lookback_days) || 60;
      if (!payload.account_id) {
        throw new Error("帳戶 ID 為必填。");
      }
      const result = await api("/bant/score", { method: "POST", body: payload });
      await Promise.all([loadPipelineBoard(), loadAccountInsights()]);
      logActivity("INFO", "BANT 評分完成。", result);
    } catch (error) {
      logActivity("ERROR", `BANT 評分失敗：${error.message}`);
    }
  });

  els.outreachForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.outreachForm);
      payload.contact_id = toNumber(payload.contact_id);
      payload.llm_provider_preference = ["GEMINI", "OPENAI"];
      if (!payload.contact_id) {
        throw new Error("聯絡人 ID 為必填。");
      }
      const result = await api("/outreach/generate", { method: "POST", body: payload });
      if (payload.contact_id === state.selectedContactId) {
        await loadOutreach();
      }
      await loadWeeklyReport();
      logActivity("INFO", "Outreach 草稿產生完成。", result);
    } catch (error) {
      logActivity("ERROR", `Outreach 產生失敗：${error.message}`);
    }
  });

  els.interactionForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.interactionForm);
      payload.contact_id = toNumber(payload.contact_id);
      if (!payload.contact_id) {
        throw new Error("聯絡人 ID 為必填。");
      }
      const result = await api("/interactions/log", { method: "POST", body: payload });
      await Promise.all([loadPipelineBoard(), loadWeeklyReport(), loadAccountInsights()]);
      logActivity("INFO", "互動紀錄已寫入。", result);
      els.interactionForm.elements.content_summary.value = "";
    } catch (error) {
      logActivity("ERROR", `互動紀錄失敗：${error.message}`);
    }
  });

  els.outreachList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-update-status]");
    if (!button) return;

    const card = button.closest("[data-draft-id]");
    if (!card) return;
    const draftId = Number(card.dataset.draftId);
    const statusInput = card.querySelector("select[data-status-input]");
    const status = statusInput.value;

    try {
      const result = await api(`/outreach/${draftId}/status`, {
        method: "PATCH",
        body: { status },
      });
      await loadOutreach();
      logActivity("INFO", `Outreach #${draftId} 狀態已更新。`, result);
    } catch (error) {
      logActivity("ERROR", `更新 Outreach 狀態失敗：${error.message}`);
    }
  });

  els.e2eForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = formToObject(els.e2eForm);
      const accountId = toNumber(payload.account_id);
      if (!accountId) {
        throw new Error("帳戶 ID 為必填。");
      }
      let contactId = toNumber(payload.contact_id);
      if (!contactId) {
        const contactResp = await api(`/contacts?account_id=${accountId}`);
        contactId = contactResp.items?.[0]?.id || null;
      }
      if (!contactId) {
        throw new Error("找不到可用聯絡人，請先建立聯絡人或填寫聯絡人 ID。");
      }

      const lookbackDays = toNumber(payload.lookback_days) || 90;
      const maxResults = toNumber(payload.max_results_per_account) || 8;
      const maxItems = toNumber(payload.max_items) || 3;
      const lookbackBant = toNumber(payload.lookback_bant) || 60;
      const personaTargets = String(payload.persona_targets || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const signalsResult = await api("/signals/scan", {
        method: "POST",
        body: {
          account_ids: [accountId],
          lookback_days: lookbackDays,
          max_results_per_account: maxResults,
          use_tavily: true,
        },
      });

      const painResult = await api("/pain-profiles/generate", {
        method: "POST",
        body: {
          account_id: accountId,
          persona_targets: personaTargets,
          max_items: maxItems,
        },
      });

      const outreachResult = await api("/outreach/generate", {
        method: "POST",
        body: {
          contact_id: contactId,
          channel: payload.channel || "EMAIL",
          intent: payload.intent || "FIRST_TOUCH",
          tone: payload.tone || "TECHNICAL",
          llm_provider_preference: ["GEMINI", "OPENAI"],
        },
      });

      const interactionResult = await api("/interactions/log", {
        method: "POST",
        body: {
          contact_id: contactId,
          channel: payload.interaction_channel || "EMAIL",
          direction: payload.direction || "INBOUND",
          content_summary: payload.summary || "Customer follow-up recorded from web e2e flow.",
          sentiment: payload.sentiment || "POSITIVE",
        },
      });

      const bantResult = await api("/bant/score", {
        method: "POST",
        body: {
          account_id: accountId,
          lookback_days: lookbackBant,
        },
      });

      await loadAccounts();
      await selectAccount(accountId, true);
      await selectContact(contactId);
      await Promise.all([loadPipelineBoard(), loadWeeklyReport(), loadAccountInsights(), loadOutreach()]);

      logActivity("INFO", "一鍵 E2E 執行完成。", {
        account_id: accountId,
        contact_id: contactId,
        signals: signalsResult,
        pain: painResult,
        outreach: outreachResult,
        interaction: interactionResult,
        bant: bantResult,
      });
    } catch (error) {
      logActivity("ERROR", `一鍵 E2E 失敗：${error.message}`);
    }
  });

  els.demoReportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const accountId = toNumber(els.demoReportAccountId.value);
      if (!accountId) {
        throw new Error("帳戶 ID 為必填。");
      }
      const [account, signalsResp, painsResp, bantResp, pipelineResp, weeklyResp, latestDraft] = await Promise.all([
        api(`/accounts/${accountId}`),
        api(`/signals/accounts/${accountId}`).catch(() => ({ items: [] })),
        api(`/pain-profiles/accounts/${accountId}`).catch(() => ({ items: [] })),
        api(`/bant/accounts/${accountId}`).catch(() => ({ items: [] })),
        api("/pipeline/board").catch(() => ({ items: [] })),
        api("/reports/weekly"),
        fetchLatestDraftByAccount(accountId),
      ]);
      const latestBant = (bantResp.items || [])[0] || null;
      const pipelineItem = (pipelineResp.items || []).find((item) => item.account_id === accountId) || null;

      state.demoReportMarkdown = buildDemoReportMarkdown({
        account,
        signals: signalsResp.items || [],
        pains: painsResp.items || [],
        latestDraft,
        latestBant,
        pipelineItem,
        weekly: weeklyResp,
      });
      els.demoReportOutput.value = state.demoReportMarkdown;
      logActivity("INFO", `Demo Report 已產生（帳戶 ${accountId}）。`);
    } catch (error) {
      logActivity("ERROR", `產生 Demo Report 失敗：${error.message}`);
    }
  });

  els.downloadDemoReportBtn.addEventListener("click", () => {
    const accountId = toNumber(els.demoReportAccountId.value);
    if (!accountId || !state.demoReportMarkdown) {
      logActivity("ERROR", "請先產生 Demo Report，再進行下載。");
      return;
    }
    downloadText(`account_${accountId}_demo.md`, state.demoReportMarkdown);
    logActivity("INFO", `已下載 Demo Report：account_${accountId}_demo.md`);
  });
}

async function init() {
  bindElements();
  attachEventHandlers();
  try {
    await refreshData();
    logActivity("INFO", "指揮中心已就緒。");
  } catch (error) {
    logActivity("ERROR", `初始載入失敗：${error.message}`);
  }
}

window.addEventListener("DOMContentLoaded", init);
