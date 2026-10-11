// scripts/set-claims.mjs
// ---------------------------------------------------------------------------
// 為所有現有帳號寫入 Custom Claims（tenantId / role）。
//
// 為什麼需要這支腳本：
//   firestore.rules 以 token 內的 tenantId / role 作為唯一授權來源。
//   若帳號沒有這些 Claims，規則會一律拒絕 —— 全站會被鎖死。
//   因此部署規則「之前」必須先執行本腳本。
//
// 使用方式（需 Firebase Admin 憑證，切勿把金鑰提交進 repo）：
//   1) 於 Firebase Console → 專案設定 → 服務帳戶 → 產生新的私密金鑰
//   2) export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
//   3) node scripts/set-claims.mjs
//
// 角色判定規則（依現有系統行為）：
//   - 教練帳號（非 @bcklas.squash 結尾）→ role: 'admin'
//   - 學生帳號（*@bcklas.squash）      → role: 'student'
//   - 全部帳號 → tenantId: TENANT_ID
// ---------------------------------------------------------------------------

import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const TENANT_ID = process.env.TENANT_ID || 'bcklas-squash-core-v1';
const STUDENT_DOMAIN = '@bcklas.squash';

const app = initializeApp({
  credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : applicationDefault(),
});

const auth = getAuth(app);

async function main() {
  let nextPageToken;
  let updated = 0;
  let failed = 0;

  do {
    const page = await auth.listUsers(1000, nextPageToken);
    for (const user of page.users) {
      const email = user.email || '';
      const role = email.endsWith(STUDENT_DOMAIN) ? 'student' : 'admin';
      try {
        await auth.setCustomUserClaims(user.uid, { tenantId: TENANT_ID, role });
        updated += 1;
        console.log(`✓ ${email || user.uid} → { tenantId: '${TENANT_ID}', role: '${role}' }`);
      } catch (err) {
        failed += 1;
        console.error(`✗ ${email || user.uid}: ${err.message}`);
      }
    }
    nextPageToken = page.pageToken;
  } while (nextPageToken);

  console.log(`\n完成：${updated} 個帳號已更新，${failed} 個失敗。`);
  console.log('提醒：使用者需重新登入（或 token 過期後）才會取得新 Claims。');
}

main().catch((err) => {
  console.error('執行失敗：', err);
  process.exit(1);
});
