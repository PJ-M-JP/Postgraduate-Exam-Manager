/* ===== 大功能4：知识库笔记与背诵资料管理 ===== */
(function(w){
  const {data,autoSave,toast,modal,fmtDate,todayStr,emptyState,nextReviewDate,isDueForReview} = w.DB;
  const SUBJECTS=['政治','英语','数学','专业课一','专业课二'];
  let curTab='notes';

  w.App.route('knowledge', function(c){
    const d=data();
    const dueCards=d.flashcards.filter(f=>isDueForReview(f.nextReview)).length;
    c.innerHTML=`
      <div class="tabs">
        <div class="tab ${curTab==='notes'?'active':''}" onclick="M4.switch('notes')">📝 分科笔记</div>
        <div class="tab ${curTab==='flashcards'?'active':''}" onclick="M4.switch('flashcards')">🎴 背诵闪卡 ${dueCards?`<span class="tag tag-high" style="margin-left:4px">${dueCards}</span>`:''}</div>
        <div class="tab ${curTab==='files'?'active':''}" onclick="M4.switch('files')">📁 文件资料</div>
        <div class="tab ${curTab==='favorites'?'active':''}" onclick="M4.switch('favorites')">⭐ 高频考点</div>
        <div class="tab ${curTab==='confusions'?'active':''}" onclick="M4.switch('confusions')">🔄 易混淆对比</div>
        <div class="tab ${curTab==='materials'?'active':''}" onclick="M4.switch('materials')">💎 主观题素材</div>
        <div class="tab ${curTab==='feed'?'active':''}" onclick="M4.switch('feed')">📥 喂书生成</div>
        <div class="tab ${curTab==='mindmaps'?'active':''}" onclick="M4.switch('mindmaps')">🧠 思维导图</div>
      </div>
      <div id="kb-content"></div>
    `;
    renderTab();
  });

  function renderTab(){
    const el=document.getElementById('kb-content');
    if(!el) return;
    if(curTab==='notes') renderNotes(el);
    else if(curTab==='flashcards') renderFlashcards(el);
    else if(curTab==='files') renderFiles(el);
    else if(curTab==='favorites') renderFavorites(el);
    else if(curTab==='confusions') renderConfusions(el);
    else if(curTab==='materials') renderMaterials(el);
    else if(curTab==='feed') renderFeed(el);
    else if(curTab==='mindmaps') renderMindmaps(el);
    else if(curTab==='feed') renderFeed(el);
  }

  // 分科笔记
  let curNote=null;
  function renderNotes(el){
    const d=data();
    el.innerHTML=`
      <div class="grid" style="grid-template-columns:240px 1fr;gap:16px;height:calc(100vh - 200px)">
        <div class="card" style="overflow-y:auto">
          <div class="card-title">📚 笔记列表 <button class="btn btn-primary btn-sm" onclick="M4.addNote()">+</button></div>
          ${d.notes.length?d.notes.map(n=>`<div class="task-item ${curNote===n.id?'':''}" style="cursor:pointer;background:${curNote===n.id?'var(--accent-l)':'var(--bg)'}" onclick="M4.openNote(${n.id})">
            <div class="ti-body"><div class="ti-title">${n.title||'无标题'}</div><div class="ti-meta"><span class="tag">${n.subject}</span><span>${fmtDate(n.updated)}</span></div></div>
          </div>`).join(''):`<div class="empty"><div class="ico">📝</div>暂无笔记</div>`}
        </div>
        <div class="card" style="display:flex;flex-direction:column;overflow:hidden">
          ${curNote?renderNoteEditor(d.notes.find(n=>n.id===curNote)):`<div class="empty" style="flex:1;display:flex;align-items:center;justify-content:center"><div><div class="ico">📝</div>从左侧选择或新建笔记</div></div>`}
        </div>
      </div>
    `;
  }

  function renderNoteEditor(n){
    if(!n) return '';
    return `
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <input type="text" id="note-title" value="${n.title||''}" placeholder="笔记标题" style="flex:1;padding:6px 10px;border:1px solid var(--border);border-radius:6px" oninput="M4.saveNote(this.value,'title')">
        <button class="btn-icon" onclick="M4.delNote(${n.id})">🗑</button>
      </div>
      <div class="note-toolbar">
        <button class="btn-sm" onclick="document.execCommand('bold')"><b>B</b></button>
        <button class="btn-sm" onclick="document.execCommand('italic')"><i>I</i></button>
        <button class="btn-sm" onclick="document.execCommand('underline')"><u>U</u></button>
        <button class="btn-sm" onclick="document.execCommand('insertUnorderedList')">• 列表</button>
        <button class="btn-sm" onclick="document.execCommand('insertOrderedList')">1. 列表</button>
        <button class="btn-sm" onclick="M4.insertLink()">🔗 双向链接</button>
        <button class="btn-sm" onclick="document.execCommand('formatBlock',false,'h3')">标题</button>
      </div>
      <div class="note-editor" contenteditable="true" id="note-content" oninput="M4.saveNote(this.innerHTML,'content')">${n.content||''}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">最后编辑：${fmtDate(n.updated)} · 自动保存</div>
    `;
  }

  function openNote(id){ curNote=id; renderTab(); }
  let saveT=null;
  function saveNote(val,field){
    const n=data().notes.find(x=>x.id===curNote);
    if(!n) return;
    if(saveT) clearTimeout(saveT);
    saveT=setTimeout(()=>{
      n[field]=val;
      n.updated=new Date().toISOString();
      autoSave();
    },500);
  }
  function addNote(){
    const m=modal('新建笔记',`<div class="form-row"><label>标题</label><input type="text" id="n-title" autofocus placeholder="如：马原-唯物史观"></div><div class="form-row"><label>学科</label><select id="n-subject">${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>`,{okText:'创建',onOk:ov=>{const id=DB.nextId();data().notes.push({id,subject:ov.querySelector('#n-subject').value,title:ov.querySelector('#n-title').value,content:'',updated:new Date().toISOString(),links:[]});autoSave();m.close();curNote=id;renderTab();toast('笔记已创建');}});
  }
  function delNote(id){DB.confirm('删除此笔记？',()=>{const d=data();d.notes=d.notes.filter(x=>x.id!==id);if(curNote===id)curNote=null;autoSave();renderTab();toast('已删除');});}
  function insertLink(){
    const d=data();
    const otherNotes=d.notes.filter(n=>n.id!==curNote);
    if(!otherNotes.length){toast('没有其他笔记可链接');return;}
    const m=modal('插入双向链接',`<div class="form-row"><label>选择笔记</label><select id="ln-target">${otherNotes.map(n=>`<option value="${n.id}">${n.title||'无标题'}</option>`).join('')}</select></div>`,{okText:'插入',onOk:ov=>{
      const targetId=parseInt(ov.querySelector('#ln-target').value);
      const target=d.notes.find(n=>n.id===targetId);
      const link=`<a class="bi-link" onclick="M4.openNote(${targetId})">${target.title||'无标题'}</a>`;
      document.execCommand('insertHTML',false,link);
      const n=d.notes.find(x=>x.id===curNote);
      if(n && !n.links.includes(targetId)){n.links.push(targetId);}
      if(target && !target.links.includes(curNote)){target.links.push(curNote);}
      autoSave();
      m.close();
    }});
  }

  // 背诵闪卡
  let curCardIdx=0;
  function renderFlashcards(el){
    const d=data();
    const due=d.flashcards.filter(f=>isDueForReview(f.nextReview));
    el.innerHTML=`
      <div class="grid grid-3" style="margin-bottom:16px">
        <div class="stat-card"><div class="stat-val">${d.flashcards.length}</div><div class="stat-label">闪卡总数</div></div>
        <div class="stat-card" style="background:var(--red-l)"><div class="stat-val" style="color:var(--red)">${due.length}</div><div class="stat-label">今日待复习</div></div>
        <div class="stat-card" style="background:var(--green-l)"><div class="stat-val" style="color:var(--green)">${d.flashcards.filter(f=>f.reviewCount>=3).length}</div><div class="stat-label">已掌握</div></div>
      </div>
      ${due.length?`<div class="card" style="margin-bottom:16px">
        <div class="card-title">🎴 今日复习卡片 (${due.length}张) <button class="btn btn-primary btn-sm" onclick="M4.reviewCard(${due[0].id})">开始复习</button></div>
      </div>`:''}
      <div class="card">
        <div class="card-title">🎴 闪卡库 <button class="btn btn-primary btn-sm" onclick="M4.addCard()">添加闪卡</button></div>
        <div style="display:flex;gap:8px;margin-bottom:12px">
          <select id="fc-subject" onchange="M4.renderCardList()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px"><option value="">全部学科</option>${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select>
        </div>
        <div id="card-list"></div>
      </div>
    `;
    renderCardList();
  }

  function renderCardList(){
    const el=document.getElementById('card-list');
    if(!el) return;
    const d=data();
    const subj=document.getElementById('fc-subject')?.value||'';
    let list=d.flashcards;
    if(subj) list=list.filter(f=>f.subject===subj);
    if(!list.length){el.innerHTML=emptyState('🎴','暂无闪卡，点击右上角添加');return;}
    el.innerHTML=list.map(f=>`<div class="flashcard" onclick="this.querySelector('.flashcard-inner').parentElement.classList.toggle('flipped')">
      <div class="flashcard-inner">
        <div class="flashcard-front"><div><b>问题：</b><br>${f.front}<div class="flashcard-hint">点击翻转</div></div></div>
        <div class="flashcard-back"><div><b>答案：</b><br>${f.back}<div class="flashcard-hint">已复习${f.reviewCount||0}次</div></div></div>
      </div>
    </div>`).join('');
  }

  function addCard(){
    const m=modal('添加闪卡',`<div class="form-row"><label>学科</label><select id="fc-s">${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div><div class="form-row"><label>正面（问题）</label><textarea id="fc-front" placeholder="如：实践的含义？"></textarea></div><div class="form-row"><label>背面（答案）</label><textarea id="fc-back" placeholder="输入答案"></textarea></div>`,{okText:'添加',onOk:ov=>{const front=ov.querySelector('#fc-front').value.trim();if(!front){toast('请输入问题');return;}data().flashcards.push({id:DB.nextId(),subject:ov.querySelector('#fc-s').value,front,back:ov.querySelector('#fc-back').value,nextReview:nextReviewDate(todayStr(),0),reviewCount:0});autoSave();m.close();renderTab();App.renderSidebar();toast('闪卡已添加');}});
  }

  function reviewCard(id){
    const d=data(); const f=d.flashcards.find(x=>x.id===id);if(!f)return;
    const m=modal('复习闪卡',`<div class="flashcard"><div class="flashcard-inner"><div class="flashcard-front"><div><b>问题：</b><br>${f.front}</div></div><div class="flashcard-back"><div><b>答案：</b><br>${f.back}</div></div></div></div><div style="text-align:center;margin-top:10px">点击卡片翻转查看答案</div>`,{okText:'✅ 已掌握',onOk:()=>{f.reviewCount=(f.reviewCount||0)+1;f.nextReview=nextReviewDate(todayStr(),f.reviewCount);autoSave();m.close();renderTab();App.renderSidebar();toast(`已更新，下次复习：${f.nextReview}`);}});
  }

  // 文件资料仓库
  function renderFiles(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📁 文件资料仓库 <button class="btn btn-primary btn-sm" onclick="M4.uploadFile()">上传文件</button></div>
        ${d.files.length?`<table class="table"><thead><tr><th>文件名</th><th>类型</th><th>上传日期</th><th>操作</th></tr></thead>
        <tbody>${d.files.map(f=>`<tr><td>${f.name}</td><td><span class="tag">${f.type||'文件'}</span></td><td>${fmtDate(f.date)}</td><td class="action-cell"><button class="btn-icon" onclick="M4.viewFile(${f.id})">👁</button><button class="btn-icon" onclick="M4.delFile(${f.id})">🗑</button></td></tr>`).join('')}</tbody></table>`:`<div class="empty"><div class="ico">📁</div>暂无文件</div>`}
      </div>
    `;
  }
  function uploadFile(){
    const inp=document.createElement('input');
    inp.type='file'; inp.onchange=e=>{
      const file=e.target.files[0]; if(!file) return;
      DB.filePut(file).then(rec=>{
        data().files.push({id:rec.id,name:rec.name,type:rec.type.split('/')[1]||'文件',size:rec.size,date:rec.date});
        autoSave(); renderTab(); toast('文件已上传');
      }).catch(err=>DB.toast('上传失败：'+err.message,'error'));
    }; inp.click();
  }
  function viewFile(id){
    DB.fileGet(id).then(rec=>{
      if(rec&&rec.blob){const url=URL.createObjectURL(rec.blob);window.open(url);setTimeout(()=>URL.revokeObjectURL(url),60000);}
      else DB.toast('文件不存在或已损坏');
    });
  }
  function delFile(id){DB.confirm('删除文件？',()=>{const d=data();d.files=d.files.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  // 高频考点
  function renderFavorites(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">⭐ 高频考点收藏夹 <button class="btn btn-primary btn-sm" onclick="M4.addFav()">添加</button></div>
        ${d.favorites.length?d.favorites.map(f=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px"><div style="display:flex;justify-content:space-between"><div><span class="tag tag-high">${f.subject}</span> <b style="margin-left:6px">${f.title}</b></div><button class="btn-icon" onclick="M4.delFav(${f.id})">🗑</button></div><div style="font-size:12px;color:var(--muted);margin-top:4px;white-space:pre-wrap">${f.content||''}</div></div>`).join(''):`<div class="empty"><div class="ico">⭐</div>暂无收藏</div>`}
      </div>
    `;
  }
  function addFav(){const m=modal('添加高频考点',`<div class="form-row"><label>学科</label><select id="fav-s">${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div><div class="form-row"><label>考点标题</label><input type="text" id="fav-t" placeholder="如：矛盾的普遍性与特殊性"></div><div class="form-row"><label>详细内容</label><textarea id="fav-c"></textarea></div>`,{okText:'添加',onOk:ov=>{const t=ov.querySelector('#fav-t').value.trim();if(!t){toast('请输入标题');return;}data().favorites.push({id:DB.nextId(),subject:ov.querySelector('#fav-s').value,title:t,content:ov.querySelector('#fav-c').value});autoSave();m.close();renderTab();toast('已添加');}});}
  function delFav(id){DB.confirm('删除？',()=>{const d=data();d.favorites=d.favorites.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  // 易混淆对比
  function renderConfusions(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🔄 易混淆知识点对比库 <button class="btn btn-primary btn-sm" onclick="M4.addConfusion()">添加</button></div>
        ${d.confusions.length?d.confusions.map(c=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:10px"><div style="display:flex;justify-content:space-between"><b>${c.title}</b><button class="btn-icon" onclick="M4.delConfusion(${c.id})">🗑</button></div><table class="table" style="margin-top:6px"><tbody>${c.items.map(it=>`<tr><td style="width:30%;font-weight:600">${it.label}</td><td>${it.detail}</td></tr>`).join('')}</tbody></table></div>`).join(''):`<div class="empty"><div class="ico">🔄</div>暂无对比记录</div>`}
      </div>
    `;
  }
  function addConfusion(){
    const m=modal('添加易混淆对比',`<div class="form-row"><label>对比主题</label><input type="text" id="cf-title" placeholder="如：实践 vs 认识"></div><div class="form-row"><label>对比项</label><textarea id="cf-items" style="min-height:100px" placeholder="每行一项，格式：标签 | 内容&#10;如：实践 | 改造世界的活动"></textarea></div>`,{okText:'添加',onOk:ov=>{
      const title=ov.querySelector('#cf-title').value.trim();if(!title){toast('请输入主题');return;}
      const items=ov.querySelector('#cf-items').value.split('\n').filter(l=>l.trim()).map(l=>{const [label,detail]=l.split('|');return {label:(label||'').trim(),detail:(detail||'').trim()};});
      data().confusions.push({id:DB.nextId(),title,items});autoSave();m.close();renderTab();toast('已添加');
    }});
  }
  function delConfusion(id){DB.confirm('删除？',()=>{const d=data();d.confusions=d.confusions.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  // 主观题素材
  function renderMaterials(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">💎 主观题素材库 <button class="btn btn-primary btn-sm" onclick="M4.addMaterial()">添加</button></div>
        ${d.materials.length?d.materials.map(m=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px"><div style="display:flex;justify-content:space-between"><span class="tag tag-mid">${m.type}</span><button class="btn-icon" onclick="M4.delMaterial(${m.id})">🗑</button></div><div style="font-size:13px;margin-top:4px;white-space:pre-wrap">${m.content}</div></div>`).join(''):`<div class="empty"><div class="ico">💎</div>暂无素材</div>`}
      </div>
    `;
  }
  function addMaterial(){const m=modal('添加素材',`<div class="form-row"><label>类型</label><select id="mat-type"><option>答题案例</option><option>金句</option><option>论据</option><option>其他</option></select></div><div class="form-row"><label>内容</label><textarea id="mat-content" style="min-height:100px"></textarea></div>`,{okText:'添加',onOk:ov=>{const c=ov.querySelector('#mat-content').value.trim();if(!c){toast('请输入内容');return;}data().materials.push({id:DB.nextId(),type:ov.querySelector('#mat-type').value,content:c});autoSave();m.close();renderTab();toast('已添加');}});}
  function delMaterial(id){DB.confirm('删除？',()=>{const d=data();d.materials=d.materials.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  /* --- 喂书生成（PDF/文本 → 结构化笔记 + 思维导图） --- */
  function renderFeed(el){
    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">📥 喂书 · PDF/资料一键生成</div>
          <div style="font-size:13px;line-height:1.8;color:var(--text)">
            上传 <b>PDF 课件 / 教材</b> 或粘贴文本，系统自动解析并生成：
            <ul style="margin:8px 0 0 18px;font-size:13px;color:var(--muted)">
              <li>📝 <b>结构化笔记</b>：按章节/要点自动整理，存入「分科笔记」</li>
              <li>🧠 <b>思维导图</b>：提炼知识骨架，存入「思维导图」可反复查看</li>
            </ul>
          </div>
          <button class="btn btn-primary" style="margin-top:12px" onclick="Feed.ingest()">📤 上传 PDF / 文本生成</button>
          <div style="font-size:11px;color:var(--muted);margin-top:8px">纯本地解析，不上传文件；扫描版PDF可改「粘贴文本」。</div>
        </div>
        <div class="card">
          <div class="card-title">🧠 已有思维导图 (${data().mindmaps.length})</div>
          ${data().mindmaps.length?data().mindmaps.slice().reverse().map(mm=>`
            <div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">
              <div style="display:flex;justify-content:space-between"><div><b>${mm.name}</b> <span class="tag">${mm.subject}</span></div>
                <button class="btn-icon" onclick="M4.delMindmap(${mm.id})">🗑</button></div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">${mm.data.children?mm.data.children.length:0} 个分支 · ${fmtDate(mm.created)}</div>
            </div>`).join(''):`<div class="empty"><div class="ico">🧠</div>还没有思维导图，先去喂书</div>`}
        </div>
      </div>`;
  }
  function delMindmap(id){DB.confirm('删除该思维导图？',()=>{const d=data();d.mindmaps=d.mindmaps.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  /* --- 思维导图查看 --- */
  function renderMindmaps(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🧠 思维导图库</div>
        ${d.mindmaps.length?d.mindmaps.slice().reverse().map(mm=>`
          <div style="border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px">
            <div style="font-weight:600;margin-bottom:8px">${mm.name} <span class="tag" style="margin-left:6px">${mm.subject}</span></div>
            <div id="mm-${mm.id}" style="background:var(--bg);border-radius:8px;padding:10px"></div>
          </div>`).join(''):`<div class="empty"><div class="ico">🧠</div>暂无思维导图，前往「喂书生成」上传资料</div>`}
      </div>`;
    d.mindmaps.slice().reverse().forEach(mm=>{
      const box=document.getElementById('mm-'+mm.id);
      if(box) Feed.renderMindmap(box, mm.data);
    });
  }

  function switchTab(tab){curTab=tab;App.renderContent();}
  w.M4={switch:switchTab,openNote,saveNote,addNote,delNote,insertLink,renderCardList,addCard,reviewCard,uploadFile,viewFile,delFile,addFav,delFav,addConfusion,delConfusion,addMaterial,delMaterial,delMindmap};

})(window);
