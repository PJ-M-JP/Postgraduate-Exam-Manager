/* ===== 大功能5：时间、习惯与精力管理 ===== */
(function(w){
  const {data,autoSave,toast,modal,fmtDate,todayStr,emptyState,historySection} = w.DB;
  const SUBJECTS=[
    {v:'politics',name:'政治'},{v:'english',name:'英语'},{v:'math',name:'数学'},
    {v:'major1',name:'专业课一'},{v:'major2',name:'专业课二'}
  ];
  let curTab='pomodoro';
  let pomoTimer=null;

  w.App.route('time', function(c){
    const d=data();
    c.innerHTML=`
      <div class="tabs">
        <div class="tab ${curTab==='pomodoro'?'active':''}" onclick="M5.switch('pomodoro')">🍅 番茄专注</div>
        <div class="tab ${curTab==='report'?'active':''}" onclick="M5.switch('report')">📊 时长统计</div>
        <div class="tab ${curTab==='habits'?'active':''}" onclick="M5.switch('habits')">✅ 习惯打卡</div>
        <div class="tab ${curTab==='distract'?'active':''}" onclick="M5.switch('distract')">📵 分心记录</div>
        <div class="tab ${curTab==='sleep'?'active':''}" onclick="M5.switch('sleep')">😴 睡眠作息</div>
      </div>
      <div id="time-content"></div>
    `;
    renderTab();
  });

  function renderTab(){
    const el=document.getElementById('time-content'); if(!el) return;
    ({pomodoro:renderPomodoro,report:renderReport,habits:renderHabits,distract:renderDistract,sleep:renderSleep}[curTab])(el);
  }

  /* --- 番茄专注计时 --- */
  function renderPomodoro(el){
    const d=data();
    const todayPomos=d.pomodoros.filter(p=>p.date===todayStr());
    const subjectOpts=SUBJECTS.map(s=>`<option value="${s.v}">${s.name}</option>`).join('');
    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">🍅 番茄专注计时</div>
          <div class="pomodoro">
            <div class="pomodoro-mode" id="pomo-mode">${pomoTimer?'专注中':'待开始'}</div>
            <div class="pomodoro-time" id="pomo-time">25:00</div>
            <div class="pomodoro-controls">
              <div class="form-row" style="flex-direction:row;align-items:center;gap:8px;justify-content:center;margin:0">
                <label style="margin:0">时长(分)</label>
                <input type="number" id="pomo-dur" value="25" min="1" style="width:80px" ${pomoTimer?'disabled':''}>
              </div>
              <div class="form-row" style="flex-direction:row;align-items:center;gap:8px;justify-content:center;margin:0">
                <label style="margin:0">学科</label>
                <select id="pomo-subject" ${pomoTimer?'disabled':''}>${subjectOpts}</select>
              </div>
            </div>
            <div class="pomodoro-controls" style="margin-top:10px">
              ${pomoTimer?'<button class="btn btn-danger" onclick="M5.stopPomo()">⏹ 结束</button>':'<button class="btn btn-primary" onclick="M5.startPomo()">▶ 开始专注</button>'}
              <button class="btn btn-ghost" onclick="M5.restReminder()">☕ 休息提醒</button>
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📋 今日专注记录 (${todayPomos.length}段)</div>
          ${todayPomos.length?todayPomos.slice().reverse().map(p=>`<div class="task-item">
            <div class="ti-body"><div class="ti-title">${SUBJECTS.find(s=>s.v===p.subject)?.name||p.subject} · ${p.duration}分钟</div>
            <div class="ti-meta"><span>🕐 ${p.start}</span></div></div>
            <span class="ti-del" onclick="M5.delPomo(${p.id})">✕</span></div>`).join(''):`<div class="empty"><div class="ico">🍅</div>今天还没有专注记录</div>`}
          <div style="margin-top:12px;font-size:12px;color:var(--muted)">提示：专注结束自动累计到对应学科「学习时长」，并同步到首页「分科时长统计」。</div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">⏰ 疲劳休息间隔提醒</div>
        <div style="font-size:13px;color:var(--text);line-height:1.8">
          建议每 <b>25 分钟</b> 专注后休息 <b>5 分钟</b>，每 4 个番茄后长休息 15-30 分钟。<br>
          点击上方「☕ 休息提醒」可立即开始一段休息倒计时。长时间盯屏记得远眺、喝水、活动颈椎，减少内耗与摆烂。
        </div>
      </div>
    `;
  }

  function startPomo(){
    const dur=parseInt(document.getElementById('pomo-dur').value)||25;
    const subject=document.getElementById('pomo-subject').value;
    let remain=dur*60;
    const modeEl=document.getElementById('pomo-mode');
    const timeEl=document.getElementById('pomo-time');
    modeEl.textContent='专注中';
    pomoTimer=setInterval(()=>{
      remain--;
      if(remain<=0){
        clearInterval(pomoTimer); pomoTimer=null;
        modeEl.textContent='已完成';
        timeEl.textContent='25:00';
        // 保存专注记录 + 累计学科时长
        const d=data();
        d.pomodoros.push({id:DB.nextId(),date:todayStr(),start:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),duration:dur,subject});
        if(!d.studyTime[todayStr()]) d.studyTime[todayStr()]={politics:0,english:0,math:0,major1:0,major2:0};
        d.studyTime[todayStr()][subject]=(d.studyTime[todayStr()][subject]||0)+dur;
        autoSave();
        toast(`专注完成！已记录 ${dur} 分钟`);
        renderTab(); App.renderSidebar();
        return;
      }
      const mm=String(Math.floor(remain/60)).padStart(2,'0');
      const ss=String(remain%60).padStart(2,'0');
      timeEl.textContent=`${mm}:${ss}`;
    },1000);
    toast('开始专注，加油！');
  }
  function stopPomo(){
    if(pomoTimer){clearInterval(pomoTimer);pomoTimer=null;}
    const dur=parseInt(document.getElementById('pomo-dur').value)||25;
    const subject=document.getElementById('pomo-subject').value;
    const d=data();
    d.pomodoros.push({id:DB.nextId(),date:todayStr(),start:new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}),duration:dur,subject});
    if(!d.studyTime[todayStr()]) d.studyTime[todayStr()]={politics:0,english:0,math:0,major1:0,major2:0};
    d.studyTime[todayStr()][subject]=(d.studyTime[todayStr()][subject]||0)+dur;
    autoSave(); renderTab(); App.renderSidebar(); toast('已记录当前专注');
  }
  function delPomo(id){DB.confirm('删除该专注记录？',()=>{const d=data();d.pomodoros=d.pomodoros.filter(x=>x.id!==id);autoSave();renderTab();});}
  let restTimer=null;
  function restReminder(){
    if(restTimer){clearInterval(restTimer);restTimer=null;}
    let remain=5*60;
    const m=modal('☕ 休息一下',`<div style="text-align:center;font-size:42px;font-weight:800;color:var(--green)" id="rest-time">05:00</div><div style="text-align:center;color:var(--muted);font-size:12px">起身活动、远眺、喝水，5分钟后继续战斗</div>`,{footer:false});
    restTimer=setInterval(()=>{
      remain--;
      const t=document.getElementById('rest-time');
      if(remain<=0){ clearInterval(restTimer);restTimer=null; m.close(); toast('休息结束，继续加油！'); return; }
      if(t) t.textContent=`${String(Math.floor(remain/60)).padStart(2,'0')}:${String(remain%60).padStart(2,'0')}`;
    },1000);
  }

  /* --- 时长统计（日 / 周 / 月报） --- */
  function renderReport(el){
    const d=data();
    const today=todayStr();
    const todayData=d.studyTime[today]||{politics:0,english:0,math:0,major1:0,major2:0};
    const todayTotal=Object.values(todayData).reduce((a,b)=>a+b,0);
    // 近7天
    const weekData=[];
    for(let i=6;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);const ds=dt.toISOString().slice(0,10);const td=d.studyTime[ds]||{};weekData.push({date:ds,total:Object.values(td).reduce((a,b)=>a+b,0)});}
    const weekTotal=weekData.reduce((s,x)=>s+x.total,0);
    // 近30天
    let monthTotal=0;
    for(let i=29;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);const ds=dt.toISOString().slice(0,10);const td=d.studyTime[ds]||{};monthTotal+=Object.values(td).reduce((a,b)=>a+b,0);}
    el.innerHTML=`
      <div class="grid grid-4" style="margin-bottom:16px">
        <div class="stat-card"><div class="stat-val">${todayTotal}min</div><div class="stat-label">今日学习</div></div>
        <div class="stat-card"><div class="stat-val">${weekTotal}min</div><div class="stat-label">本周学习</div></div>
        <div class="stat-card"><div class="stat-val">${Math.round(weekTotal/7)}min</div><div class="stat-label">日均(周)</div></div>
        <div class="stat-card"><div class="stat-val">${monthTotal}min</div><div class="stat-label">近30天合计</div></div>
      </div>
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">📊 周报 · 近7天每日时长</div>
          <div id="week-bar" style="height:200px"></div>
        </div>
        <div class="card">
          <div class="card-title">📈 月报 · 分科累计(近30天)</div>
          <div class="grid grid-5">
            ${SUBJECTS.map(s=>{let tot=0;for(let i=29;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);const ds=dt.toISOString().slice(0,10);tot+=(d.studyTime[ds]||{})[s.v]||0;}return `<div class="stat-card"><div class="stat-val">${tot}</div><div class="stat-label">${s.name}</div></div>`;}).join('')}
          </div>
          <div style="margin-top:12px;font-size:12px;color:var(--muted)">学习时长来自「番茄计时」与手动记录的专注段，关闭页面不丢失。</div>
        </div>
      </div>
    `;
    drawWeekBar(weekData);
  }
  function drawWeekBar(weekData){
    const el=document.getElementById('week-bar'); if(!el) return;
    const max=Math.max(...weekData.map(x=>x.total),1);
    el.innerHTML=`<div style="display:flex;align-items:flex-end;gap:8px;height:100%;padding:10px 0">
      ${weekData.map(x=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:11px;color:var(--muted)">${x.total}</div>
        <div style="width:80%;height:${(x.total/max*150)}px;background:linear-gradient(180deg,var(--accent),#5c7fe8);border-radius:6px 6px 0 0;min-height:4px"></div>
        <div style="font-size:11px;color:var(--muted)">${x.date.slice(5)}</div>
      </div>`).join('')}
    </div>`;
  }

  /* --- 习惯打卡 --- */
  function renderHabits(el){
    const d=data();
    if(!d.habits.length){
      el.innerHTML=`<div class="card"><div class="card-title">✅ 备考习惯打卡 <button class="btn btn-primary btn-sm" onclick="M5.addHabit()">+ 新建习惯</button></div>${emptyState('✅','还没有打卡项，新建一个如「早起」「背单词」「复盘」')}</div>`;
      return;
    }
    const today=todayStr();
    el.innerHTML=`
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">✅ 备考习惯打卡 <button class="btn btn-primary btn-sm" onclick="M5.addHabit()">+ 新建习惯</button></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
          ${d.habits.map(h=>`
            <div style="border:1px solid var(--border);border-radius:10px;padding:12px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <b>${h.name}</b>
                <span class="ti-del" onclick="M5.delHabit(${h.id})">✕</span>
              </div>
              <div style="font-size:11px;color:var(--muted);margin-bottom:6px">本月已打卡 ${h.dates.filter(x=>x.startsWith(today.slice(0,7))).length} 天</div>
              <div class="habit-grid">
                ${lastNDates(14).map(ds=>{
                  const done=h.dates.includes(ds);
                  const isT=ds===today;
                  return `<div class="habit-cell ${done?'done':''} ${isT?'today':''}" title="${ds}" onclick="M5.toggleHabit(${h.id},'${ds}')">${parseInt(ds.slice(8))}</div>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </div>
        <div style="font-size:12px;color:var(--muted);margin-top:10px">点击日期格子即可打卡/取消（最近14天）。今天格子有高亮边框。</div>
      </div>
    `;
  }
  function lastNDates(n){
    const out=[];
    for(let i=n-1;i>=0;i--){const dt=new Date();dt.setDate(dt.getDate()-i);out.push(dt.toISOString().slice(0,10));}
    return out;
  }
  function addHabit(){
    const m=modal('新建打卡习惯',`<div class="form-row"><label>习惯名称</label><input type="text" id="h-name" placeholder="如：早起 / 背单词 / 复盘" autofocus></div>`,{okText:'创建',onOk:ov=>{const name=ov.querySelector('#h-name').value.trim();if(!name){toast('请输入名称');return;}data().habits.push({id:DB.nextId(),name,dates:[]});autoSave();m.close();renderTab();toast('已创建');}});
  }
  function toggleHabit(id,ds){
    const h=data().habits.find(x=>x.id===id); if(!h) return;
    const i=h.dates.indexOf(ds);
    if(i>=0) h.dates.splice(i,1); else h.dates.push(ds);
    autoSave(); renderTab();
  }
  function delHabit(id){DB.confirm('删除该习惯？',()=>{const d=data();d.habits=d.habits.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  /* --- 分心记录 --- */
  function renderDistract(el){
    const d=data();
    const todayList=d.distractions.filter(x=>x.date===todayStr());
    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">📵 记录今日分心</div>
          <div class="form-row"><label>分心原因</label><input type="text" id="dis-reason" placeholder="如：刷手机 / 走神 / 困"></div>
          <div class="form-row"><label>持续时长(分钟)</label><input type="number" id="dis-dur" value="5" min="0"></div>
          <button class="btn btn-primary btn-sm" onclick="M5.addDistract()">记录</button>
        </div>
        <div class="card">
          <div class="card-title">📊 今日分心统计</div>
          <div class="stat-card"><div class="stat-val">${todayList.length}</div><div class="stat-label">分心次数</div></div>
          <div class="stat-card" style="margin-top:10px"><div class="stat-val" style="color:var(--red)">${todayList.reduce((s,x)=>s+(x.duration||0),0)}min</div><div class="stat-label">浪费时长</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">📜 分心记录（按日期）</div>
        ${historySectionFor(d.distractions,'date',x=>`<div class="task-item"><div class="ti-body"><div class="ti-title">${x.reason}</div><div class="ti-meta"><span>⏱ ${x.duration||0}分钟</span></div></div><span class="ti-del" onclick="M5.delDistract(${x.id})">✕</span></div>`)}
      </div>
    `;
  }
  function addDistract(){
    const reason=document.getElementById('dis-reason').value.trim();
    const dur=parseInt(document.getElementById('dis-dur').value)||0;
    if(!reason){toast('请输入分心原因');return;}
    data().distractions.push({id:DB.nextId(),date:todayStr(),reason,duration:dur});
    autoSave(); renderTab(); toast('已记录');
  }
  function delDistract(id){const d=data();d.distractions=d.distractions.filter(x=>x.id!==id);autoSave();renderTab();}

  /* --- 睡眠作息 --- */
  function renderSleep(el){
    const d=data();
    const todayRec=d.sleeps.find(x=>x.date===todayStr());
    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">😴 登记今日睡眠</div>
          <div class="form-row"><label>入睡时间</label><input type="time" id="sl-bed" value="${todayRec?.bedTime||''}"></div>
          <div class="form-row"><label>起床时间</label><input type="time" id="sl-wake" value="${todayRec?.wakeTime||''}"></div>
          <button class="btn btn-primary btn-sm" onclick="M5.saveSleep()">保存</button>
          ${todayRec?`<div style="margin-top:10px;font-size:12px;color:var(--muted)">睡眠时长约 <b>${sleepLen(todayRec.bedTime,todayRec.wakeTime)}</b></div>`:''}
        </div>
        <div class="card">
          <div class="card-title">📈 近7天睡眠</div>
          ${lastNDates(7).reverse().map(ds=>{const r=d.sleeps.find(x=>x.date===ds);return `<div style="display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px solid var(--border)"><span>${ds.slice(5)}</span><span>${r?`${r.bedTime} ~ ${r.wakeTime}（${sleepLen(r.bedTime,r.wakeTime)}）`:'<span style="color:var(--muted)">未记录</span>'}</span></div>`;}).join('')}
        </div>
      </div>
    `;
  }
  function sleepLen(bed,wake){
    if(!bed||!wake) return '-';
    const [bh,bm]=bed.split(':').map(Number);
    const [wh,wm]=wake.split(':').map(Number);
    let mins=(wh*60+wm)-(bh*60+bm);
    if(mins<=0) mins+=24*60;
    return `${Math.floor(mins/60)}h${mins%60}m`;
  }
  function saveSleep(){
    const bed=document.getElementById('sl-bed').value;
    const wake=document.getElementById('sl-wake').value;
    const d=data();
    const today=todayStr();
    let r=d.sleeps.find(x=>x.date===today);
    if(!r){r={id:DB.nextId(),date:today};d.sleeps.push(r);}
    r.bedTime=bed; r.wakeTime=wake;
    autoSave(); renderTab(); toast('睡眠已记录');
  }

  // 历史折叠（按某字段分组）
  function historySectionFor(items, field, renderFn){
    const groups={};
    items.forEach(it=>{const k=it[field]||'未知';(groups[k]=groups[k]||[]).push(it);});
    const keys=Object.keys(groups).sort().reverse();
    if(!keys.length) return emptyState('📦','暂无记录');
    return keys.map(k=>`<div class="history-date" onclick="this.nextElementSibling.classList.toggle('open')"><span>📅 ${k}</span><span class="count">${groups[k].length} 项</span></div><div class="history-items">${groups[k].map(renderFn).join('')}</div>`).join('');
  }

  function switchTab(tab){curTab=tab;App.renderContent();}
  w.M5={switch:switchTab,startPomo,stopPomo,delPomo,restReminder,addHabit,toggleHabit,delHabit,addDistract,delDistract,saveSleep};
})(window);
