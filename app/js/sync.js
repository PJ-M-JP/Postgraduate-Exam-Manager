/*
 * 云端同步层（Supabase，可插拔）
 * ------------------------------------------------------------
 * 设计目标：纯静态页面也能用，不依赖任何外部 JS SDK。
 * 通过 Supabase 的 REST API + Auth REST API 实现：
 *   - 邮箱/密码登录（Supabase Auth）
 *   - 通用 items 表（带 user_id）读写
 *   - 离线写本地，联网后静默补传；连接状态有清晰标识
 *
 * 如何启用：
 *   在 config.js 填入 SUPABASE_URL 和 SUPABASE_ANON_KEY 即可。
 *   留空则纯本地运行（IndexedDB + localStorage 兜底），显示「离线」标识。
 *
 * 表结构（在 Supabase SQL Editor 执行 supabase_schema.sql）：
 *   create table items (
 *     id text primary key,
 *     user_id uuid not null,
 *     type text not null,
 *     data jsonb not null,
 *     created_at bigint,
 *     updated_at bigint,
 *     deleted boolean default false
 *   );
 *   alter table items enable row level security;
 *   create policy "owner" on items for all using (auth.uid()=user_id) with check(auth.uid()=user_id);
 */
window.Sync = (function () {
  const cfg = window.APP_CONFIG || {};
  const URL = cfg.SUPABASE_URL || "";
  const KEY = cfg.SUPABASE_ANON_KEY || "";
  const ENABLED = !!(URL && KEY);

  let session = null; // {access_token, user}
  let online = false;
  let syncing = false;
  let statusEl = null;

  // ---- 本地存储：用于未登录时把数据先落到 IndexedDB，登录后上传 ----
  const LS_KEY = "kyyg_cloud_queue";
  function loadQueue() { try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); } catch (e) { return []; } }
  function saveQueue(q) { localStorage.setItem(LS_KEY, JSON.stringify(q)); }
  // queue 中保存本地数据快照（id, type, data, updatedAt），供登录后上传

  function headers(extra) {
    return Object.assign({
      "apikey": KEY,
      "Authorization": "Bearer " + (session ? session.access_token : KEY),
      "Content-Type": "application/json"
    }, extra || {});
  }

  // ---- 状态显示 ----
  function renderStatus() {
    if (!statusEl) statusEl = document.querySelector(".sync-status");
    if (!statusEl) return;
    let dot = "offline", text = "离线 · 数据保存在本地";
    if (syncing) { dot = "syncing"; text = "同步中..."; }
    else if (online && session) { dot = "online"; text = "已同步 · " + (session.user.email || "云端"); }
    else if (online && !session) { dot = "syncing"; text = "已联网 · 请登录云端"; }
    statusEl.innerHTML = `<span class="sync-dot ${dot}"></span>${text}`;
    statusEl.style.cursor = ENABLED ? "pointer" : "default";
    statusEl.onclick = ENABLED ? openAccountMenu : null;
  }
  function setOnline(v) { online = v; renderStatus(); }
  function setSyncing(v) { syncing = v; renderStatus(); }

  // ---- 账号菜单（登录/登出）----
  function openAccountMenu() {
    if (session) {
      DB.modal("云端账户", `<p style="font-size:13px">已登录：<b>${session.user.email}</b></p>
        <p style="font-size:12px;color:var(--muted)">数据会在联网时自动同步到该账户。多设备登录同一账号即可共享数据。</p>`,
        { okText: "退出登录", onOk: (ov) => { logout(); ov.close(); DB.toast("已退出云端"); } });
      return;
    }
    const m = DB.modal("登录云端（Supabase）", `
      <div class="form-row"><label>邮箱</label><input type="email" id="su-email" placeholder="you@example.com" autofocus></div>
      <div class="form-row"><label>密码</label><input type="password" id="su-pwd" placeholder="至少6位"></div>
      <div style="font-size:12px;color:var(--muted)">没有账号？直接输入邮箱+密码，将自动注册。</div>`,
      { okText: "登录/注册", onOk: (ov) => {
          const email = ov.querySelector("#su-email").value.trim();
          const pwd = ov.querySelector("#su-pwd").value;
          if (!email || pwd.length < 6) { DB.toast("请输入有效邮箱与密码(≥6位)"); return; }
          m.close(); loginOrSignup(email, pwd);
      } });
  }

  async function loginOrSignup(email, pwd) {
    setSyncing(true);
    // 先尝试登录，失败则注册
    let res = await fetch(URL + "/auth/v1/token?grant_type=password", {
      method: "POST", headers: headers(),
      body: JSON.stringify({ email, password: pwd })
    });
    if (!res.ok) {
      // 注册
      const signup = await fetch(URL + "/auth/v1/signup", {
        method: "POST", headers: headers(),
        body: JSON.stringify({ email, password: pwd })
      });
      if (!signup.ok) { setSyncing(false); DB.toast("注册失败：" + (await signup.text())); return; }
      DB.toast("注册成功，请查收确认邮件后登录（如开启邮箱验证）");
      // 部分项目关闭邮件验证可直接登录
      res = await fetch(URL + "/auth/v1/token?grant_type=password", {
        method: "POST", headers: headers(),
        body: JSON.stringify({ email, password: pwd })
      });
    }
    if (res.ok) {
      const j = await res.json();
      session = { access_token: j.access_token, user: { email, id: j.user?.id || j.id } };
      localStorage.setItem("kyyg_session", JSON.stringify(session));
      setSyncing(false); DB.toast("云端登录成功");
      pushLocalQueue(); // 把离线期间的数据上传
      pullFromCloud();
    } else {
      setSyncing(false); DB.toast("登录失败：" + (await res.text()).slice(0, 100));
    }
  }

  function logout() {
    session = null; localStorage.removeItem("kyyg_session");
    online = false; renderStatus();
  }

  // ---- 离线时：把改动暂存到 queue（由 DB.put 调用）----
  function queue(rec) {
    if (!ENABLED) return;
    if (!session) {
      // 未登录也暂存，登录后上传
      const q = loadQueue();
      const i = q.findIndex(x => x.id === rec.id);
      if (i >= 0) q[i] = snap(rec); else q.push(snap(rec));
      saveQueue(q);
      return;
    }
    pushOne(rec);
  }
  function snap(rec) { return { id: rec.id, type: rec.type, data: rec.data, updatedAt: rec.updatedAt, deleted: rec.deleted }; }

  async function pushOne(rec) {
    if (!session) return;
    setSyncing(true);
    const body = { id: rec.id, user_id: session.user.id, type: rec.type, data: rec.data, created_at: rec.createdAt, updated_at: rec.updatedAt, deleted: rec.deleted };
    const res = await fetch(URL + "/rest/v1/items?id=eq." + encodeURIComponent(rec.id), {
      method: "PUT", headers: headers({ "Prefer": "resolution=merge-duplicates" }), body: JSON.stringify(body)
    });
    setSyncing(false);
  }

  async function pushLocalQueue() {
    const q = loadQueue(); if (!q.length || !session) return;
    setSyncing(true);
    for (const rec of q) { await pushOne(rec); }
    saveQueue([]);
    setSyncing(false);
  }

  async function pullFromCloud() {
    if (!session) return;
    setSyncing(true);
    const res = await fetch(URL + "/rest/v1/items?user_id=eq." + encodeURIComponent(session.user.id) + "&select=*", { headers: headers() });
    setSyncing(false);
    if (!res.ok) { DB.toast("拉取云端失败"); return; }
    const rows = await res.json();
    // 合并到本地（以后写优先：本地 updatedAt 更新则保留本地）
    const localAll = await DB.all ? null : null;
    const local = JSON.parse(localStorage.getItem("kyyg_data_v1") || "{}");
    mergeCloudIntoLocal(local, rows);
    localStorage.setItem("kyyg_data_v1", JSON.stringify(local));
    DB.toast("已从云端同步 " + rows.length + " 条数据");
    if (window.App) { App.renderSidebar(); App.renderContent(); }
  }

  // 合并策略：遍历云端每条，本地没有则加入；本地有但 updatedAt 更旧则覆盖
  function mergeCloudIntoLocal(local, rows) {
    // 把云端行映射回本地数组（按 type 找对应数组字段）
    const arrFields = ["tasks","weekTasks","monthGoals","books","courses","pastPapers","mistakes","mockExams","topicTraining","answerTemplates","notes","flashcards","files","favorites","confusions","materials","pomodoros","habits","distractions","sleeps","dailyReviews","weekReviews","monthReviews","weaknesses","applyChecklist","interviewPrep","moods","misc","resourceIndex","faq","bookCompare"];
    rows.forEach(r => {
      const arr = local[r.type];
      if (!Array.isArray(arr)) return;
      const i = arr.findIndex(x => x.id === r.id);
      if (i < 0) arr.push(Object.assign({ id: r.id }, r.data));
      else if ((arr[i].updatedAt || 0) < (r.updated_at || 0)) arr[i] = Object.assign({ id: r.id }, r.data);
    });
  }

  // ---- 初始化 ----
  function init() {
    if (statusEl) {} else statusEl = document.querySelector(".sync-status");
    renderStatus();
    if (!ENABLED) {
      // 纯本地，标识离线
      online = false; renderStatus();
      window.addEventListener("online", () => setOnline(true));
      window.addEventListener("offline", () => setOnline(false));
      return;
    }
    // 恢复会话
    try {
      const s = localStorage.getItem("kyyg_session");
      if (s) { session = JSON.parse(s); renderStatus(); pullFromCloud(); }
    } catch (e) {}
    setOnline(navigator.onLine);
    window.addEventListener("online", () => { setOnline(true); if (session) { pushLocalQueue(); pullFromCloud(); } });
    window.addEventListener("offline", () => setOnline(false));
  }

  return { init, queue, renderStatus, ENABLED, openAccountMenu };
})();

// 启动时初始化（app.js 会在 DOMContentLoaded 调用 renderSidebar）
document.addEventListener("DOMContentLoaded", () => { Sync.init(); });
