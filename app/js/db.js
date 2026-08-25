/* ===== 数据层与通用工具 ===== */
(function(w){
  'use strict';

  // --- 存储 key ---
  const KEY = 'kyyg_data_v1';

  // --- 默认数据结构 ---
  function defaultData(){
    return {
      meta:{ examDate:'', createdAt:'', version:1 },
      target:{ school:'', major:'', subjects:[{name:'政治',target:75},{name:'英语',target:75},{name:'数学',target:110},{name:'专业课',target:120}], examSubjects:'', studyYears:'', past3yLines:'', admitRatio:'' },
      stages:[
        {id:'base',name:'基础阶段',start:'',end:'',color:'#3b5bdb',desc:'全面通读教材，建立知识框架'},
        {id:'enhance',name:'强化阶段',start:'',end:'',color:'#7048e8',desc:'攻克重难点，章节练习'},
        {id:'pastpapers',name:'真题阶段',start:'',end:'',color:'#f59f00',desc:'近10年真题精做精研'},
        {id:'sprint',name:'冲刺模考阶段',start:'',end:'',color:'#e5484d',desc:'模考查漏补缺，背诵冲刺'}
      ],
      milestones:[
        {id:1,name:'预报名',date:'',done:false},
        {id:2,name:'正式报名',date:'',done:false},
        {id:3,name:'网上确认',date:'',done:false},
        {id:4,name:'初试考试',date:'',done:false},
        {id:5,name:'成绩公布',date:'',done:false},
        {id:6,name:'复试/调剂',date:'',done:false}
      ],
      tasks:[],          // {id,subject,title,priority,done,date,status,note}
      weekTasks:[],       // 周度看板
      monthGoals:[],      // 月度目标
      books:[],           // {id,subject,title,author,status,totalPages,currentPage}
      courses:[],         // {id,subject,title,totalHours,doneHours,platform}
      studyTime:{},       // {date:{politics:0,english:0,math:0,major1:0,major2:0}}
      pastPapers:[],      // {id,year,subject,questions:[...]}
      mistakes:[],        // {id,subject,chapter,type,reason,difficulty,question,myAnswer,correct,analysis,date,nextReview,reviewCount}
      mockExams:[],        // {id,date,duration,scores:{politics,english,math,major1,major2}}
      topicTraining:[],   // {id,subject,type,done,total,count}
      answerTemplates:[], // {id,subject,type,title,content}
      notes:[],           // {id,subject,title,content,links:[],updated}
      flashcards:[],      // {id,subject,front,back,nextReview,reviewCount}
      files:[],           // {id,name,type,size,dataUrl,date}
      favorites:[],       // 高频考点 {id,subject,title,content}
      confusions:[],      // 易混淆 {id,subject,title,items:[{label,detail}]}
      materials:[],       // 主观题素材 {id,type,content}
      mindmaps:[],            // 思维导图（喂书生成）{id,name,subject,data,created}
      pomodoros:[],       // {id,date,start,duration,subject}
      habits:[],          // {id,name,dates:[]}
      distractions:[],   // {id,date,reason,duration}
      sleeps:[],           // {id,date,bedTime,wakeTime}
      dailyReviews:[],    // 每日复盘 {id,date,done,problems,plan}
      weekReviews:[],     // 周复盘
      monthReviews:[],    // 月复盘
      weaknesses:[],      // 薄弱知识点 {id,subject,topic,reason,plan}
      applyChecklist:[],  // 报考事务 {id,item,done}
      interviewPrep:[],   // 复试素材 {id,type,content}
      moods:[],            // 情绪 {id,date,mood,note}
      misc:[],             // 杂物箱 {id,content,date}
      // 附加
      resourceIndex:[],   // 资源索引
      mockApplyNotes:'',   // 模拟报名演练
      faq:[],              // 常见疑问
      bookCompare:[],      // 参考书对比
      _id:1
    };
  }

  // 确保数据完整（迁移用）
  function ensure(d){
    const t = defaultData();
    for(const k in t){
      if(d[k]===undefined) d[k]=t[k];
    }
    if(!d.meta) d.meta={examDate:'',createdAt:'',version:1};
    if(!d.target) d.target=t.target;
    if(!d.stages) d.stages=t.stages;
    if(!d.milestones) d.milestones=t.milestones;
    return d;
  }

  let data = null;
  let saveTimer = null;
  let cloudSync = { status:'offline', lastSync:null };

  // --- 加载 ---
  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(raw){
        data = ensure(JSON.parse(raw));
      } else {
        data = defaultData();
        data.meta.createdAt = new Date().toISOString();
        save();
      }
    }catch(e){
      console.error('Load error:',e);
      data = defaultData();
    }
    return data;
  }

  // --- 保存（自动防抖） ---
  function save(){
    if(!data) return;
    try{
      localStorage.setItem(KEY, JSON.stringify(data));
    }catch(e){
      console.error('Save error:',e);
      DB.toast('保存失败：'+e.message,'error');
    }
  }

  // --- 防抖保存 ---
  function autoSave(){
    if(saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 800);
  }

  // --- 生成 ID ---
  function nextId(){
    if(!data) return 1;
    return ++data._id;
  }

  // --- 工具函数 ---
  function todayStr(){
    const d=new Date();
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  }
  function fmtDate(d){
    if(!d) return '';
    const dt=new Date(d);
    if(isNaN(dt)) return d;
    return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0');
  }
  function daysBetween(d1,d2){
    const a=new Date(d1), b=new Date(d2);
    return Math.ceil((b-a)/(1000*60*60*24));
  }
  function uid(prefix){
    return (prefix||'id')+'_'+Date.now()+'_'+Math.random().toString(36).substr(2,5);
  }

  // --- Toast ---
  let toastEl=null,toastTimer=null;
  function toast(msg,type){
    if(!toastEl){
      toastEl=document.createElement('div');
      toastEl.className='toast';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent=msg;
    toastEl.className='toast show '+(type||'');
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{toastEl.classList.remove('show')},2500);
  }

  // --- 模态框 ---
  function modal(title, bodyHTML, opts){
    opts=opts||{};
    const ov=document.createElement('div');
    ov.className='modal-overlay';
    ov.innerHTML=`<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="btn-icon close-x">✕</button></div><div class="modal-body">${bodyHTML}</div>${opts.footer!==false?`<div class="modal-foot"><button class="btn btn-ghost cancel">取消</button><button class="btn btn-primary ok">${opts.okText||'确定'}</button></div>`:''}</div>`;
    document.body.appendChild(ov);
    requestAnimationFrame(()=>ov.classList.add('show'));
    function close(){ov.classList.remove('show');setTimeout(()=>ov.remove(),300)}
    ov.querySelector('.close-x').onclick=close;
    if(opts.footer!==false){
      ov.querySelector('.cancel').onclick=close;
      ov.querySelector('.ok').onclick=()=>{ if(opts.onOk) opts.onOk(ov); else close(); };
    }
    return {el:ov, close};
  }

  // --- 确认框 ---
  function confirm(msg, onYes){
    const m=modal('确认',`<p style="font-size:14px;line-height:1.6">${msg}</p>`,{okText:'确认',onOk:()=>{m.close();onYes();}});
    return m;
  }

  // --- 艾宾浩斯复习间隔（天） ---
  const ebIntervals=[1,2,4,7,15,30];
  function nextReviewDate(lastReview, count){
    const idx=Math.min(count, ebIntervals.length-1);
    const d=new Date(lastReview);
    d.setDate(d.getDate()+ebIntervals[idx]);
    return d.toISOString().slice(0,10);
  }
  function isDueForReview(nextReview){
    if(!nextReview) return true;
    return new Date(nextReview) <= new Date();
  }

  // --- 云端同步（Supabase 预留） ---
  // 如果已加载真实同步层 Sync，点击状态条交由其处理；否则提示未配置
  function checkOnline(){
    return navigator.onLine;
  }
  function toggleCloud(){
    if(window.Sync && window.Sync.ENABLED){
      // 交给真实同步层处理（登录/登出）
      Sync.openAccountMenu && Sync.openAccountMenu();
      return;
    }
    DB.toast('尚未配置云端：在 config.js 填入 Supabase 凭据即可启用同步', 'error');
  }
  function getSyncStatus(){ return cloudSync; }
  function setSyncStatus(s){
    // 若真实同步层已启用，状态条由 Sync 接管，这里不再覆盖
    if(window.Sync && window.Sync.ENABLED) return;
    cloudSync=s;
    const el=document.querySelector('.sync-status');
    if(el){
      const dot = cloudSync.status==='online'?'online':(cloudSync.status==='syncing'?'syncing':'offline');
      const text = cloudSync.status==='online'?`已同步 · ${cloudSync.lastSync||''}`:(cloudSync.status==='syncing'?'同步中...':'离线 · 数据保存在本地');
      el.innerHTML=`<span class="sync-dot ${dot}"></span>${text}`;
    }
  }

  // --- 导出/导入 ---
  function exportData(){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download='考研备考数据_'+todayStr()+'.json';
    a.click();
    toast('数据已导出');
  }
  function importData(file){
    const r=new FileReader();
    r.onload=()=>{
      try{
        const d=JSON.parse(r.result);
        data=ensure(d);
        save();
        toast('数据导入成功，刷新页面...');
        setTimeout(()=>location.reload(),1000);
      }catch(e){ toast('导入失败：'+e.message); }
    };
    r.readAsText(file);
  }

  // --- 通用渲染：空状态 ---
  function emptyState(icon,msg){
    return `<div class="empty"><div class="ico">${icon||'📋'}</div>${msg||'暂无数据'}</div>`;
  }

  // --- 历史折叠组件 ---
  function historySection(dateStr, count, itemsHTML, type){
    return `<div class="history-date" onclick="this.nextElementSibling.classList.toggle('open')">
      <span>📅 ${dateStr}</span><span class="count">${count} 项</span>
    </div><div class="history-items">${itemsHTML}</div>`;
  }

  // --- 暴露 ---
  w.DB={
    load,save,autoSave,nextId,
    data:()=>data,
    todayStr,fmtDate,daysBetween,uid,
    toast,modal,confirm,
    nextReviewDate,isDueForReview,
    checkOnline,getSyncStatus,setSyncStatus,toggleCloud,
    exportData,importData,
    emptyState,historySection,
    ebIntervals,
    filePut,fileGet
  };

  // --- 文件仓库（独立 IndexedDB，避免 localStorage 配额爆掉）---
  // 只存元数据在 localStorage(data.files)，文件二进制存这里
  let _fdb=null;
  function fdbOpen(){
    if(_fdb) return Promise.resolve(_fdb);
    return new Promise((res,rej)=>{
      const r=indexedDB.open('kyyg_files',1);
      r.onupgradeneeded=e=>{const db=e.target.result;if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'id'});};
      r.onsuccess=e=>{_fdb=e.target.result;res(_fdb);};
      r.onerror=e=>rej(e.target.error);
    });
  }
  function filePut(file){
    return fdbOpen().then(db=>new Promise((res,rej)=>{
      const tx=db.transaction('files','readwrite').objectStore('files');
      const rec={id:'f_'+Date.now()+'_'+Math.random().toString(36).slice(2,6),name:file.name,type:file.type,size:file.size,blob:file,date:todayStr()};
      const r=tx.put(rec); r.onsuccess=()=>res(rec); r.onerror=()=>rej(r.error);
    }));
  }
  function fileGet(id){
    return fdbOpen().then(db=>new Promise((res,rej)=>{
      const r=db.transaction('files','readonly').objectStore('files').get(id);
      r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
    }));
  }

  // 初始加载
  load();

})(window);
