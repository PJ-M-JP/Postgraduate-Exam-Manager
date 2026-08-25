/* ===== 大功能2：分学科学习任务管理 ===== */
(function(w){
  const {data,autoSave,toast,modal,fmtDate,todayStr,emptyState,historySection} = w.DB;

  const SUBJECTS=[
    {v:'politics',name:'政治',tag:'tag-politics'},
    {v:'english',name:'英语',tag:'tag-english'},
    {v:'math',name:'数学',tag:'tag-math'},
    {v:'major1',name:'专业课一',tag:'tag-major1'},
    {v:'major2',name:'专业课二',tag:'tag-major2'}
  ];
  const PRIORITIES=[
    {v:'high',name:'高',tag:'tag-high'},
    {v:'mid',name:'中',tag:'tag-mid'},
    {v:'low',name:'低',tag:'tag-low'}
  ];
  function subjName(v){return SUBJECTS.find(s=>s.v===v)?.name||v;}
  function subjTag(v){return SUBJECTS.find(s=>s.v===v)?.tag||'';}
  function prioName(v){return PRIORITIES.find(p=>p.v===v)?.name||'';}
  function prioTag(v){return PRIORITIES.find(p=>p.v===v)?.tag||'';}

  let curTab='daily';
  let curSubjectFilter='';

  w.App.route('tasks', function(c){
    const d=data();
    c.innerHTML=`
      <div class="tabs">
        <div class="tab ${curTab==='daily'?'active':''}" onclick="M2.switch('daily')">📋 每日待办</div>
        <div class="tab ${curTab==='weekly'?'active':''}" onclick="M2.switch('weekly')">📌 周度看板</div>
        <div class="tab ${curTab==='monthly'?'active':''}" onclick="M2.switch('monthly')">📅 月度目标</div>
        <div class="tab ${curTab==='books'?'active':''}" onclick="M2.switch('books')">📖 参考书台账</div>
        <div class="tab ${curTab==='courses'?'active':''}" onclick="M2.switch('courses')">🎥 网课台账</div>
        <div class="tab ${curTab==='stats'?'active':''}" onclick="M2.switch('stats')">⏰ 学习时长</div>
      </div>
      <div id="task-content"></div>
    `;
    renderTab();
  });

  function renderTab(){
    const el=document.getElementById('task-content');
    if(!el) return;
    if(curTab==='daily') renderDaily(el);
    else if(curTab==='weekly') renderWeekly(el);
    else if(curTab==='monthly') renderMonthly(el);
    else if(curTab==='books') renderBooks(el);
    else if(curTab==='courses') renderCourses(el);
    else if(curTab==='stats') renderStats(el);
  }

  // 每日待办
  function renderDaily(el){
    const d=data();
    const todayTasks=d.tasks.filter(t=>t.date===todayStr() && !t.done);
    const overdue=d.tasks.filter(t=>t.date && t.date<todayStr() && !t.done);
    const doneToday=d.tasks.filter(t=>t.date===todayStr() && t.done);
    const histTasks=d.tasks.filter(t=>t.done).reduce((acc,t)=>{
      const dt=t.date||t.doneDate||'未知';
      if(!acc[dt]) acc[dt]=[];
      acc[dt].push(t);
      return acc;
    },{});
    const sortedDates=Object.keys(histTasks).sort().reverse();

    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">➕ 添加今日任务 <button class="btn btn-primary btn-sm" onclick="M2.addTask()">添加</button></div>
          <div class="form-row"><label>快速添加（回车提交）</label><input type="text" id="quick-add" placeholder="如：背100个单词，选学科和优先级后回车" onkeydown="if(event.key==='Enter')M2.quickAdd()"></div>
          <div class="seg" style="margin-top:4px">
            ${SUBJECTS.map(s=>`<span class="seg-btn ${curSubjectFilter===s.v?'active':''}" onclick="M2.filterSubject('${s.v}')">${s.name}</span>`).join('')}
            <span class="seg-btn ${curSubjectFilter===''?'active':''}" onclick="M2.filterSubject('')">全部</span>
          </div>
        </div>
        <div class="card">
          <div class="card-title">⏰ 延期任务提醒</div>
          ${overdue.length?overdue.map(t=>`<div class="task-item" style="background:var(--yellow-l)">
            <div class="cb" onclick="M2.toggleDone(${t.id})"></div>
            <div class="ti-body"><div class="ti-title">${t.title}</div>
              <div class="ti-meta"><span class="tag ${subjTag(t.subject)}">${subjName(t.subject)}</span><span class="tag ${prioTag(t.priority)}">${prioName(t.priority)}</span><span>📅 ${fmtDate(t.date)}</span></div>
            </div></div>`).join(''):`<div class="empty"><div class="ico">✅</div>没有延期任务</div>`}
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-title">📋 今日待办 (${todayTasks.length})</div>
        <div id="today-list">
          ${todayTasks.filter(t=>!curSubjectFilter||t.subject===curSubjectFilter).length?
            todayTasks.filter(t=>!curSubjectFilter||t.subject===curSubjectFilter).map(t=>taskItem(t)).join(''):`<div class="empty"><div class="ico">🎉</div>今日任务已清空</div>`}
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-title">✅ 今日已完成 (${doneToday.length})</div>
        <div>
          ${doneToday.length?doneToday.map(t=>`<div class="task-item done"><div class="cb done">✓</div><div class="ti-body"><div class="ti-title">${t.title}</div><div class="ti-meta"><span class="tag ${subjTag(t.subject)}">${subjName(t.subject)}</span></div></div></div>`).join(''):`<div class="empty"><div class="ico">📝</div>今天还没有完成任务</div>`}
        </div>
      </div>

      <div class="card">
        <div class="card-title">📜 历史任务（按日期折叠）</div>
        ${sortedDates.length?sortedDates.map(dt=>historySection(fmtDate(dt),histTasks[dt].length,histTasks[dt].map(t=>`<div class="task-item done"><div class="cb done">✓</div><div class="ti-body"><div class="ti-title">${t.title}</div><div class="ti-meta"><span class="tag ${subjTag(t.subject)}">${subjName(t.subject)}</span></div></div></div>`).join(''))).join(''):`<div class="empty"><div class="ico">📦</div>暂无历史任务</div>`}
      </div>
    `;
  }

  function taskItem(t){
    return `<div class="task-item">
      <div class="cb" onclick="M2.toggleDone(${t.id})"></div>
      <div class="ti-body">
        <div class="ti-title">${t.title}</div>
        <div class="ti-meta">
          <span class="tag ${subjTag(t.subject)}">${subjName(t.subject)}</span>
          <span class="tag ${prioTag(t.priority)}">${prioName(t.priority)}</span>
          ${t.note?`<span>📝 ${t.note}</span>`:''}
        </div>
      </div>
      <span class="ti-del" onclick="M2.delTask(${t.id})">✕</span>
    </div>`;
  }

  // 周度看板
  function renderWeekly(el){
    const d=data();
    const today=new Date();
    const weekStart=new Date(today);
    weekStart.setDate(today.getDate()-today.getDay()+1);
    const weekEnd=new Date(weekStart);
    weekEnd.setDate(weekStart.getDate()+6);
    const ws=weekStart.toISOString().slice(0,10), we=weekEnd.toISOString().slice(0,10);
    const weekTasks=d.tasks.filter(t=>t.date>=ws && t.date<=we);
    const cols=[
      {id:'todo',name:'待办',tasks:weekTasks.filter(t=>!t.done && t.priority!=='high')},
      {id:'high',name:'高优先级',tasks:weekTasks.filter(t=>!t.done && t.priority==='high')},
      {id:'done',name:'已完成',tasks:weekTasks.filter(t=>t.done)}
    ];
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📌 周度看板（${fmtDate(ws)} ~ ${fmtDate(we)}）</div>
        <div class="kanban">
          ${cols.map(col=>`<div class="kanban-col">
            <div class="col-head">${col.name} <span class="count">${col.tasks.length}</span></div>
            ${col.tasks.length?col.tasks.map(t=>`<div class="kanban-item" draggable="true">
              <div class="ki-title">${t.title}</div>
              <div class="ki-meta"><span class="tag ${subjTag(t.subject)}">${subjName(t.subject)}</span><span class="tag ${prioTag(t.priority)}">${prioName(t.priority)}</span><span>📅 ${fmtDate(t.date)}</span></div>
            </div>`).join(''):`<div class="empty"><div class="ico">📭</div></div>`}
          </div>`).join('')}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title">📊 本周学科分布</div>
        <div class="grid grid-5">
          ${SUBJECTS.map(s=>{const c=weekTasks.filter(t=>t.subject===s.v).length;return `<div class="stat-card"><div class="stat-val">${c}</div><div class="stat-label">${s.name}</div></div>`;}).join('')}
        </div>
      </div>
    `;
  }

  // 月度目标
  function renderMonthly(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📅 月度学习目标 <button class="btn btn-primary btn-sm" onclick="M2.addMonthGoal()">添加</button></div>
        ${d.monthGoals.length?d.monthGoals.map(g=>`<div class="task-item">
          <div class="cb ${g.done?'done':''}" onclick="M2.toggleMonthGoal(${g.id})">${g.done?'✓':''}</div>
          <div class="ti-body"><div class="ti-title">${g.done?'<s>':''}${g.title}${g.done?'</s>':''}</div>
            <div class="ti-meta"><span class="tag ${subjTag(g.subject)}">${subjName(g.subject)}</span><span>📅 ${g.month||''}</span></div>
          </div><span class="ti-del" onclick="M2.delMonthGoal(${g.id})">✕</span></div>`).join(''):`<div class="empty"><div class="ico">🎯</div>暂无月度目标，点击右上角添加</div>`}
      </div>
    `;
  }

  // 参考书台账
  function renderBooks(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📖 参考书台账 <button class="btn btn-primary btn-sm" onclick="M2.addBook()">添加</button></div>
        ${d.books.length?`<table class="table">
          <thead><tr><th>书名</th><th>学科</th><th>作者</th><th>进度</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${d.books.map(b=>{
            const pct=b.totalPages?Math.round(b.currentPage/b.totalPages*100):0;
            return `<tr>
              <td>${b.title}</td>
              <td><span class="tag ${subjTag(b.subject)}">${subjName(b.subject)}</span></td>
              <td style="color:var(--muted)">${b.author||'-'}</td>
              <td>
                <div style="display:flex;align-items:center;gap:6px">
                  <div class="progress" style="width:80px"><div class="progress-bar" style="width:${pct}%"></div></div>
                  <span style="font-size:11px;color:var(--muted)">${b.currentPage}/${b.totalPages}页</span>
                </div>
              </td>
              <td><span class="tag ${b.status==='done'?'tag-low':b.status==='doing'?'tag-mid':'tag-high'}">${b.status==='done'?'已完成':b.status==='doing'?'进行中':'待学'}</span></td>
              <td class="action-cell">
                <button class="btn-icon" onclick="M2.updateBookPage(${b.id})">📝</button>
                <button class="btn-icon" onclick="M2.delBook(${b.id})">🗑</button>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>`:`<div class="empty"><div class="ico">📖</div>暂无参考书，点击右上角添加</div>`}
      </div>
    `;
  }

  // 网课台账
  function renderCourses(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🎥 网课台账 <button class="btn btn-primary btn-sm" onclick="M2.addCourse()">添加</button></div>
        ${d.courses.length?d.courses.map(co=>{
          const pct=co.totalHours?Math.round(co.doneHours/co.totalHours*100):0;
          return `<div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div><span style="font-weight:600">${co.title}</span> <span class="tag ${subjTag(co.subject)}" style="margin-left:6px">${subjName(co.subject)}</span></div>
              <div><button class="btn-icon" onclick="M2.updateCourse(${co.id})">📝</button><button class="btn-icon" onclick="M2.delCourse(${co.id})">🗑</button></div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="progress" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div>
              <span style="font-size:12px;color:var(--muted)">${co.doneHours}/${co.totalHours}课时 · ${co.platform||''}</span>
            </div>
          </div>`;
        }).join(''):`<div class="empty"><div class="ico">🎥</div>暂无网课，点击右上角添加</div>`}
      </div>
    `;
  }

  // 学习时长统计
  function renderStats(el){
    const d=data();
    const today=todayStr();
    const weekAgo=new Date(); weekAgo.setDate(weekAgo.getDate()-7);
    const ws=weekAgo.toISOString().slice(0,10);
    const todayData=d.studyTime[today]||{};
    const todayTotal=Object.values(todayData).reduce((a,b)=>a+b,0);
    // 本周每天总时长
    const weekData=[];
    for(let i=6;i>=0;i--){
      const dt=new Date(); dt.setDate(dt.getDate()-i);
      const ds=dt.toISOString().slice(0,10);
      const td=d.studyTime[ds]||{};
      weekData.push({date:ds,total:Object.values(td).reduce((a,b)=>a+b,0),data:td});
    }
    const weekTotal=weekData.reduce((s,x)=>s+x.total,0);

    el.innerHTML=`
      <div class="grid grid-4" style="margin-bottom:16px">
        <div class="stat-card"><div class="stat-val">${todayTotal}min</div><div class="stat-label">今日学习</div></div>
        <div class="stat-card"><div class="stat-val">${Math.round(weekTotal)}min</div><div class="stat-label">本周学习</div></div>
        <div class="stat-card"><div class="stat-val">${Math.round(weekTotal/7)}min</div><div class="stat-label">日均</div></div>
        <div class="stat-card"><div class="stat-val">${d.pomodoros.filter(p=>p.date===today).length}</div><div class="stat-label">今日番茄数</div></div>
      </div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">📊 本周每日学习时长趋势</div>
        <div id="week-chart" style="height:200px"></div>
      </div>
      <div class="card">
        <div class="card-title">📈 分科学习时长统计</div>
        <div class="grid grid-5">
          ${SUBJECTS.map(s=>{
            const total=weekData.reduce((sum,x)=>sum+(x.data[s.v]||0),0);
            return `<div class="stat-card"><div class="stat-val">${total}min</div><div class="stat-label">${s.name}</div></div>`;
          }).join('')}
        </div>
      </div>
    `;
    drawWeekChart(weekData);
  }

  function drawWeekChart(weekData){
    const el=document.getElementById('week-chart');
    if(!el) return;
    const max=Math.max(...weekData.map(x=>x.total),1);
    el.innerHTML=`<div style="display:flex;align-items:flex-end;gap:8px;height:100%;padding:10px 0">
      ${weekData.map(x=>`<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
        <div style="font-size:11px;color:var(--muted)">${x.total}min</div>
        <div style="width:80%;height:${(x.total/max*150)}px;background:linear-gradient(180deg,var(--accent),#5c7fe8);border-radius:6px 6px 0 0;min-height:4px"></div>
        <div style="font-size:11px;color:var(--muted)">${x.date.slice(5)}</div>
      </div>`).join('')}
    </div>`;
  }

  // === 操作函数 ===
  function switchTab(tab){ curTab=tab; document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); App.renderContent(); setTimeout(()=>{document.querySelectorAll('.tab').forEach(t=>{if(t.textContent.includes({daily:'每日',weekly:'周度',monthly:'月度',books:'参考书',courses:'网课',stats:'学习时长'}[tab]))t.classList.add('active')})},0); }

  function filterSubject(v){ curSubjectFilter=v; renderTab(); }

  function addTask(){
    const m=modal('添加任务',`
      <div class="form-row"><label>任务标题</label><input type="text" id="t-title" placeholder="如：背100个单词" autofocus></div>
      <div class="form-row"><label>学科</label><select id="t-subject">${SUBJECTS.map(s=>`<option value="${s.v}">${s.name}</option>`).join('')}</select></div>
      <div class="form-row"><label>优先级</label><select id="t-priority">${PRIORITIES.map(p=>`<option value="${p.v}">${p.name}</option>`).join('')}</select></div>
      <div class="form-row"><label>日期</label><input type="date" id="t-date" value="${todayStr()}"></div>
      <div class="form-row"><label>备注</label><input type="text" id="t-note" placeholder="可选"></div>
    `,{okText:'添加',onOk:ov=>{
      const title=ov.querySelector('#t-title').value.trim();
      if(!title){toast('请输入任务标题');return;}
      data().tasks.push({id:DB.nextId(),title,subject:ov.querySelector('#t-subject').value,priority:ov.querySelector('#t-priority').value,date:ov.querySelector('#t-date').value,note:ov.querySelector('#t-note').value,done:false});
      autoSave(); m.close(); renderTab(); App.renderSidebar(); toast('任务已添加');
    }});
  }

  function quickAdd(){
    const inp=document.getElementById('quick-add');
    const title=inp.value.trim();
    if(!title) return;
    data().tasks.push({id:DB.nextId(),title,subject:curSubjectFilter||'politics',priority:'mid',date:todayStr(),done:false,note:''});
    inp.value='';
    autoSave(); renderTab(); App.renderSidebar();
  }

  function toggleDone(id){
    const t=data().tasks.find(x=>x.id===id);
    if(!t) return;
    t.done=!t.done;
    if(t.done) t.doneDate=todayStr();
    autoSave(); renderTab(); App.renderSidebar();
  }

  function delTask(id){
    DB.confirm('删除此任务？',()=>{
      const d=data();
      d.tasks=d.tasks.filter(t=>t.id!==id);
      autoSave(); renderTab(); App.renderSidebar(); toast('已删除');
    });
  }

  function addMonthGoal(){
    const m=modal('添加月度目标',`
      <div class="form-row"><label>目标</label><input type="text" id="g-title" autofocus></div>
      <div class="form-row"><label>学科</label><select id="g-subject">${SUBJECTS.map(s=>`<option value="${s.v}">${s.name}</option>`).join('')}</select></div>
      <div class="form-row"><label>月份</label><input type="month" id="g-month" value="${todayStr().slice(0,7)}"></div>
    `,{okText:'添加',onOk:ov=>{
      const title=ov.querySelector('#g-title').value.trim();
      if(!title){toast('请输入目标');return;}
      data().monthGoals.push({id:DB.nextId(),title,subject:ov.querySelector('#g-subject').value,month:ov.querySelector('#g-month').value,done:false});
      autoSave(); m.close(); renderTab(); toast('月度目标已添加');
    }});
  }
  function toggleMonthGoal(id){const g=data().monthGoals.find(x=>x.id===id);if(g){g.done=!g.done;autoSave();renderTab();}}
  function delMonthGoal(id){DB.confirm('删除此目标？',()=>{const d=data();d.monthGoals=d.monthGoals.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  function addBook(){
    const m=modal('添加参考书',`
      <div class="form-row"><label>书名</label><input type="text" id="b-title" autofocus></div>
      <div class="form-row"><label>学科</label><select id="b-subject">${SUBJECTS.map(s=>`<option value="${s.v}">${s.name}</option>`).join('')}</select></div>
      <div class="form-row"><label>作者</label><input type="text" id="b-author"></div>
      <div class="form-row"><label>总页数</label><input type="number" id="b-total" min="1"></div>
      <div class="form-row"><label>当前页码</label><input type="number" id="b-current" min="0" value="0"></div>
      <div class="form-row"><label>状态</label><select id="b-status"><option value="todo">待学</option><option value="doing">进行中</option><option value="done">已完成</option></select></div>
    `,{okText:'添加',onOk:ov=>{
      const title=ov.querySelector('#b-title').value.trim();
      if(!title){toast('请输入书名');return;}
      data().books.push({id:DB.nextId(),title,subject:ov.querySelector('#b-subject').value,author:ov.querySelector('#b-author').value,totalPages:parseInt(ov.querySelector('#b-total').value)||0,currentPage:parseInt(ov.querySelector('#b-current').value)||0,status:ov.querySelector('#b-status').value});
      autoSave(); m.close(); renderTab(); toast('参考书已添加');
    }});
  }
  function updateBookPage(id){
    const b=data().books.find(x=>x.id===id);if(!b)return;
    const m=modal(`更新进度：${b.title}`,`
      <div class="form-row"><label>当前页码（共${b.totalPages}页）</label><input type="number" id="bp" value="${b.currentPage}" min="0" max="${b.totalPages}"></div>
      <div class="form-row"><label>状态</label><select id="bs"><option value="todo" ${b.status==='todo'?'selected':''}>待学</option><option value="doing" ${b.status==='doing'?'selected':''}>进行中</option><option value="done" ${b.status==='done'?'selected':''}>已完成</option></select></div>
    `,{okText:'保存',onOk:ov=>{
      b.currentPage=parseInt(ov.querySelector('#bp').value)||0;
      b.status=ov.querySelector('#bs').value;
      if(b.currentPage>=b.totalPages && b.totalPages) b.status='done';
      autoSave(); m.close(); renderTab(); toast('进度已更新');
    }});
  }
  function delBook(id){DB.confirm('删除此参考书？',()=>{const d=data();d.books=d.books.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  function addCourse(){
    const m=modal('添加网课',`
      <div class="form-row"><label>课程名称</label><input type="text" id="c-title" autofocus></div>
      <div class="form-row"><label>学科</label><select id="c-subject">${SUBJECTS.map(s=>`<option value="${s.v}">${s.name}</option>`).join('')}</select></div>
      <div class="form-row"><label>平台</label><input type="text" id="c-platform" placeholder="如：B站/慕课/网易云课堂"></div>
      <div class="form-row"><label>总课时</label><input type="number" id="c-total" min="1"></div>
      <div class="form-row"><label>已完成课时</label><input type="number" id="c-done" min="0" value="0"></div>
    `,{okText:'添加',onOk:ov=>{
      const title=ov.querySelector('#c-title').value.trim();
      if(!title){toast('请输入课程名称');return;}
      data().courses.push({id:DB.nextId(),title,subject:ov.querySelector('#c-subject').value,platform:ov.querySelector('#c-platform').value,totalHours:parseInt(ov.querySelector('#c-total').value)||0,doneHours:parseInt(ov.querySelector('#c-done').value)||0});
      autoSave(); m.close(); renderTab(); toast('网课已添加');
    }});
  }
  function updateCourse(id){
    const co=data().courses.find(x=>x.id===id);if(!co)return;
    const m=modal(`更新进度：${co.title}`,`<div class="form-row"><label>已完成课时（共${co.totalHours}课时）</label><input type="number" id="cd" value="${co.doneHours}" min="0" max="${co.totalHours}"></div>`,{okText:'保存',onOk:ov=>{co.doneHours=parseInt(ov.querySelector('#cd').value)||0;autoSave();m.close();renderTab();toast('进度已更新');}});
  }
  function delCourse(id){DB.confirm('删除此网课？',()=>{const d=data();d.courses=d.courses.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  w.M2={switch:switchTab,filterSubject,addTask,quickAdd,toggleDone,delTask,addMonthGoal,toggleMonthGoal,delMonthGoal,addBook,updateBookPage,delBook,addCourse,updateCourse,delCourse};

})(window);
