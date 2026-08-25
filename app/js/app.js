/* ===== 主应用：路由 + 初始化 ===== */
(function(w){
  'use strict';
  const {data,autoSave,toast,fmtDate,daysBetween,todayStr,setSyncStatus,toggleCloud} = w.DB;

  const NAV=[
    {id:'dashboard',name:'备考总览',icon:'📊',badge:0},
    {id:'tasks',name:'学习任务',icon:'✅',badge:0},
    {id:'practice',name:'刷题模考',icon:'📝',badge:0},
    {id:'knowledge',name:'知识笔记',icon:'📚',badge:0},
    {id:'time',name:'时间精力',icon:'⏱️',badge:0},
    {id:'review',name:'复盘报考',icon:'🎯',badge:0}
  ];

  let currentRoute='dashboard';

  function renderSidebar(){
    const d=data();
    // 计算各 badge
    NAV[0].badge = d.milestones.filter(m=>!m.done && m.date && new Date(m.date)<=new Date(Date.now()+7*86400000)).length;
    NAV[1].badge = d.tasks.filter(t=>!t.done && t.date===todayStr()).length;
    NAV[2].badge = d.mistakes.filter(m=>DB.isDueForReview(m.nextReview)).length;
    NAV[3].badge = d.flashcards.filter(f=>DB.isDueForReview(f.nextReview)).length;
    NAV[5].badge = d.applyChecklist.filter(c=>!c.done).length;

    const sidebar=document.querySelector('.sidebar');
    sidebar.innerHTML=`
      <div class="logo">📚 考研管家</div>
      <nav class="nav" id="nav">
        ${NAV.map(n=>`
          <div class="nav-item ${currentRoute===n.id?'active':''}" data-route="${n.id}">
            <span class="icon">${n.icon}</span>
            <span>${n.name}</span>
            ${n.badge?`<span class="badge">${n.badge}</span>`:''}
          </div>`).join('')}
      </nav>
      <div class="sync-status" onclick="DB.toggleCloud()"><span class="sync-dot offline"></span>离线 · 数据保存于本地</div>
    `;
    sidebar.querySelectorAll('.nav-item').forEach(el=>{
      el.onclick=()=>{ currentRoute=el.dataset.route; renderSidebar(); renderContent(); };
    });
    setSyncStatus(DB.getSyncStatus());
  }

  function renderTopbar(){
    const cur=NAV.find(n=>n.id===currentRoute);
    const top=document.querySelector('.topbar');
    top.innerHTML=`
      <div class="page-title">${cur.icon} ${cur.name}</div>
      <div class="actions">
        <div class="search"><input type="text" placeholder="搜索任务/笔记/错题..." oninput="App.search(this.value)"></div>
        <button class="btn btn-ghost btn-sm" onclick="App.exportData()" title="导出全部数据">📤 导出</button>
        <button class="btn btn-ghost btn-sm" onclick="App.importData()" title="导入数据">📥 导入</button>
      </div>`;
  }

  function renderContent(){
    const c=document.querySelector('.content');
    c.innerHTML='';
    if(R[currentRoute]) R[currentRoute](c);
  }

  // 路由表（后续模块文件填充）
  const R={};

  function route(id, fn){
    R[id]=fn;
  }

  // 全局搜索
  function search(q){
    if(!q||q.length<1) return;
    const d=data();
    const results=[];
    d.tasks.filter(t=>t.title.includes(q)).forEach(t=>results.push({type:'任务',text:t.title,route:'tasks'}));
    d.mistakes.filter(m=>m.question.includes(q)||m.analysis.includes(q)).forEach(m=>results.push({type:'错题',text:m.question.slice(0,40),route:'practice'}));
    d.notes.filter(n=>n.title.includes(q)||(n.content||'').includes(q)).forEach(n=>results.push({type:'笔记',text:n.title,route:'knowledge'}));
    d.flashcards.filter(f=>f.front.includes(q)||f.back.includes(q)).forEach(f=>results.push({type:'闪卡',text:f.front.slice(0,40),route:'knowledge'}));
    if(results.length===0){ toast('未找到相关内容'); return; }
    const m=DB.modal('搜索结果',`<div style="max-height:400px;overflow-y:auto">${results.slice(0,30).map(r=>`<div style="padding:8px;border-bottom:1px solid #eee;cursor:pointer" onclick="DB.modal.last&&DB.modal.last.close()">${r.type} · ${r.text}</div>`).join('')}</div>`,{footer:false});
  }

  function exportData(){ DB.exportData(); }
  function importData(){
    const inp=document.createElement('input');
    inp.type='file'; inp.accept='.json';
    inp.onchange=e=>{ if(e.target.files[0]) DB.importData(e.target.files[0]); };
    inp.click();
  }

  w.App={ route, renderSidebar, renderContent, renderTopbar, search, exportData, importData, getR:()=>R, NAV };

  document.addEventListener('DOMContentLoaded',()=>{
    renderSidebar();
    renderTopbar();
    renderContent();
    // 每分钟更新一次侧栏 badge
    setInterval(renderSidebar, 60000);
  });

})(window);
