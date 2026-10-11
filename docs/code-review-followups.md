# 程式碼審查修正 — 待處理風險清單 (F1–F4)

本分支 `fix/p0-p1-code-review` 依程式碼審查報告進行 P0 / P1 修正。

- 原始審查報告：https://static.teamily.ai/sites/e0ac1a51-dfea-4a10-ad3d-1f39b9e3e590/webpages/squash-code-review/index.html
- 驗證報告（Reality Checker）：https://static.teamily.ai/sites/e0ac1a51-dfea-4a10-ad3d-1f39b9e3e590/documents/squash-reality-check/reality-check-report.md

## ✅ 本分支已完成
- **P0-3**：移除 `EditPlayerModal.jsx` 對全域 `window.prompt` 的覆寫，改為參數明確傳入密碼 `handleSetupStudentAuth(student, password)`。
- **P1**：`LeaguePage.jsx` 由 1,794 行拆分為 1,181 行（抽出至 `src/features/league/`）；CI 加入 build + test（移除自動 commit 到 main）；移除洩漏 tenant ID 的 `console.log`；`index.html` 移除 `user-scalable=no`；新增 `src/config.js`、`src/utils/logger.js`。
- **P0-1（部分）**：`.env.local` 已從版控移除，新增 `.env.example`。
- **P0-2（初始）**：新增 `firestore.rules`（tenant 隔離 + 預設拒絕）與 `scripts/set-claims.mjs`。

> ⚠️ 本分支**尚未完全關閉 P0-1 / P0-2**，以下風險必須在合併前處理或明確接受。

## 🔴 F4 — 金鑰必須輪換（P0-1 未完成）
`.env.local` 曾進入主分支歷史（commit `7c008d4`），內含真實 Firebase `apiKey`（`AIzaSy...`）。
本分支僅「取消追蹤」該檔，**金鑰本身已洩漏，取消追蹤並不等於安全**。
- 行動：Firebase Console → 專案設定 → 重新產生 / 限制 API key。
- 行動：`git log --all -- .env.local` 檢查歷史，必要時以 `filter-repo`/BFG 清理。

## 🔴 F3 — 提權風險：自簽 admin Claim
由於 `apiKey` 公開（見 F4），任何持有一般 Auth 帳號者可自行簽發含 `admin` 的 Custom Claim，進而接管該 tenant。
- 行動：Claims 僅能由伺服器端（Cloud Function 或受信任的部署腳本）設定；規則改依不可於客戶端偽造的身分來源。
- 行動：在 Google Cloud Console 為 API key 設定 HTTP referrer / API 限制。

## 🟠 F1 — 功能回歸：學生無法更新自己的 featuredBadges
`/my-dashboard` 的「勳章展示牆」在現行規則下會 `PERMISSION_DENIED`（學生無法更新自己文件的 `featuredBadges`）。
- 行動：規則加入學生僅能更新「自己」文件的 `featuredBadges` 欄位之最小權限。

## 🟠 F2 — 資料外洩：`config/finance` 讀取未受保護
財務資料實際存於 `config/finance`，但規則只保護 `col == 'financial_items'`，導致學生可讀取 `config/finance`。
- 行動：規則改為保護 `config/finance`，或將財務資料移入 `financial_items`。

## 🔵 其他待辦
- `buildSeedOrder` 輸出 `[1,8,4,5,2,7,3,6]`，與標準 bracket seeding `[1,8,5,4,3,6,7,2]` 不同 — 已於測試中記錄為**既存行為**，需先確認是否影響既有賽程資料，再另開 PR 修正。
- `scripts/set-claims.mjs` 尚未驗證（缺 Firebase Admin 憑證），且目前會把任何**非** `@bcklas.squash` 結尾的 Email 設為 admin，需收緊。
