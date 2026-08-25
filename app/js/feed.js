/*
 * 喂书功能（模块4核心）：上传 PDF → 解析文本 → 结构化笔记 + 思维导图
 * ------------------------------------------------------------
 * 纯前端，使用本地 vendor/pdf.min.js（pdf.js legacy）。
 * 不依赖网络；解析失败可回退「粘贴文本」。
 */
window.Feed = (function () {
  const cfg = window.APP_CONFIG || {};
  let pdfjsLib = null;
  let initialized = false;

  function ensureLib() {
    if (initialized) return pdfjsLib;
    if (typeof window.pdfjsLib !== "undefined") {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
      pdfjsLib = window.pdfjsLib;
    } else {
      // 动态加载本地 pdf.min.js
      return new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "vendor/pdf.min.js";
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = "vendor/pdf.worker.min.js";
          pdfjsLib = window.pdfjsLib;
          initialized = true;
          res(pdfjsLib);
        };
        s.onerror = () => rej(new Error("pdf.js 加载失败"));
        document.head.appendChild(s);
      });
    }
    initialized = true;
    return pdfjsLib;
  }

  // 解析 PDF 为纯文本（按页）
  async function parsePDF(file) {
    const lib = await ensureLib();
    const buf = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: buf }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map(it => it.str || "");
      text += strings.join(" ") + "\n\n";
    }
    return text;
  }

  // 轻量结构化：切分段落，识别可能的标题（短行/以数字或章节开头），提取要点
  function structure(text) {
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    const sections = [];
    let cur = null;
    // 标题识别：章节序号 / 数字编号 / 英文Chapter / 符号开头，且较短
    const headingRe = /^(第?[0-9一二三四五六七八九十]+[.、章节]?|Chapter|§|【|（?[0-9])/i;
    for (const line of lines) {
      const looksHeading = headingRe.test(line) && line.length < 40;
      if (looksHeading) {
        cur = { title: line, points: [] };
        sections.push(cur);
      } else {
        if (!cur) { cur = { title: "概述", points: [] }; sections.push(cur); }
        // 进一步把长句按句号拆成要点
        const parts = line.split(/(?<=[。！？；;])/).map(p => p.trim()).filter(p => p.length > 4);
        cur.points.push(...parts);
      }
    }
    // 限制规模，避免超大
    return sections.slice(0, 60);
  }

  // 生成思维导图数据（树结构）：顶层=文件名，二级=各 section，三级=要点(前若干)
  function toMindmap(title, sections) {
    return {
      root: title,
      children: sections.slice(0, 24).map(s => ({
        text: s.title,
        children: s.points.slice(0, 6).map(p => ({ text: p.length > 30 ? p.slice(0, 30) + "…" : p }))
      }))
    };
  }

  // 生成结构化笔记 HTML（用于存进富文本笔记）
  function toNoteHTML(title, sections) {
    let html = `<h2>${title}</h2>`;
    sections.forEach(s => {
      html += `<h3>${s.title}</h3><ul>`;
      s.points.slice(0, 12).forEach(p => { html += `<li>${p}</li>`; });
      html += `</ul>`;
    });
    return html;
  }

  // 主入口：上传文件 → 解析 → 弹窗预览 → 确认存入
  async function ingest() {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = ".pdf,.txt";
    inp.onchange = async () => {
      const file = inp.files[0]; if (!file) return;
      DB.toast("正在解析 " + file.name + " …");
      try {
        let raw = "";
        if (file.name.toLowerCase().endsWith(".txt")) {
          raw = await file.text();
        } else {
          raw = await parsePDF(file);
        }
        if (!raw.trim()) { DB.toast("未能提取到文本（可能是扫描版PDF）", "error"); fallbackPaste(file.name); return; }
        const sections = structure(raw);
        const html = toNoteHTML(file.name.replace(/\.[^.]+$/, ""), sections);
        const mindmap = toMindmap(file.name.replace(/\.[^.]+$/, ""), sections);
        showPreview(file.name, html, mindmap, sections);
      } catch (e) {
        console.error(e);
        DB.toast("解析失败：" + e.message + "（可改用粘贴文本）", "error");
        fallbackPaste(file.name);
      }
    };
    inp.click();
  }

  // 扫描版PDF或解析失败：让用户粘贴文本
  function fallbackPaste(name) {
    const m = DB.modal("喂书 · 粘贴文本", `
      <p style="font-size:12px;color:var(--muted)">PDF 未能提取文本（多为扫描版）。可手动粘贴内容，同样会生成结构化笔记与思维导图。</p>
      <div class="form-row"><label>来源名称</label><input type="text" id="fp-name" value="${name || ''}"></div>
      <div class="form-row"><label>正文</label><textarea id="fp-text" style="min-height:180px" placeholder="粘贴教材/资料文本…"></textarea></div>`,
      { okText: "生成", onOk: (ov) => {
        const t = ov.querySelector("#fp-text").value;
        const nm = ov.querySelector("#fp-name").value || "粘贴资料";
        if (!t.trim()) { DB.toast("请粘贴内容"); return; }
        const sections = structure(t);
        const html = toNoteHTML(nm, sections);
        const mindmap = toMindmap(nm, sections);
        m.close(); showPreview(nm, html, mindmap, sections);
      } });
  }

  // 预览弹窗：左侧笔记HTML，右侧思维导图，确认后存入
  function showPreview(name, html, mindmap, sections) {
    const m = DB.modal("喂书生成结果 · " + name, `
      <div class="form-row"><label>存入学科</label><select id="fp-subject">
        <option>政治</option><option>英语</option><option>数学</option><option>专业课一</option><option>专业课二</option></select></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-height:60vh;overflow:auto">
        <div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">📝 结构化笔记（可二次编辑）</div>
          <div id="fp-note-preview" style="border:1px solid var(--border);border-radius:8px;padding:10px;font-size:12px;line-height:1.6;background:var(--bg)">${html}</div></div>
        <div><div style="font-size:12px;color:var(--muted);margin-bottom:4px">🧠 思维导图</div>
          <div id="fp-mindmap" style="border:1px solid var(--border);border-radius:8px;padding:8px;background:#fff;overflow:auto"></div></div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-top:8px">共识别 ${sections.length} 个章节 / 要点块。确认后将存入「分科笔记」与「思维导图」。</div>`,
      { okText: "存入知识库", onOk: (ov) => {
        const subject = ov.querySelector("#fp-subject").value;
        // 存入笔记
        const d = DB.data();
        const noteId = DB.nextId();
        d.notes.push({ id: noteId, subject, title: name.replace(/\.[^.]+$/, ""), content: html, updated: new Date().toISOString(), links: [] });
        // 存入思维导图
        if (!d.mindmaps) d.mindmaps = [];
        d.mindmaps.push({ id: DB.nextId(), name: name.replace(/\.[^.]+$/, ""), subject, data: mindmap, created: DB.todayStr() });
        DB.autoSave();
        m.close();
        DB.toast("已生成笔记与思维导图，前往「知识笔记」查看");
        if (window.App) App.renderSidebar();
      } });
    // 渲染思维导图（简单树状SVG/缩进）
    setTimeout(() => renderMindmap(document.getElementById("fp-mindmap"), mindmap), 50);
  }

  // 极简思维导图渲染（横向缩进树，稳定无依赖）
  function renderMindmap(el, tree) {
    if (!el || !tree) return;
    let html = `<div style="font-weight:700;color:var(--accent);margin-bottom:6px">${tree.root}</div>`;
    const walk = (node, depth) => {
      (node.children || []).forEach(ch => {
        html += `<div style="margin-left:${depth * 16}px;padding:3px 6px;border-left:2px solid var(--accent);font-size:12px;color:var(--text)">${ch.text}</div>`;
        if (ch.children && ch.children.length) walk(ch, depth + 1);
      });
    };
    walk(tree, 1);
    el.innerHTML = html;
  }

  return { ingest, renderMindmap, parsePDF, structure };
})();
