/* ===== 大功能1：备考总览与择校目标规划 ===== */
(function(w){
  const {data,autoSave,toast,modal,fmtDate,daysBetween,todayStr,emptyState} = w.DB;

  w.App.route('dashboard', function(c){
    const d=data();
    c.innerHTML=`
      <div class="grid grid-3" style="margin-bottom:16px">
        <div class="card countdown-box">
          <div class="card-title">⏳ 考研倒计时</div>
          <div class="countdown-num" id="cd-num">--</div>
          <div class="countdown-label" id="cd-label">设置考试日期</div>
          <button class="btn btn-ghost btn-sm" style="margin-top:8px" onclick="M1.setExamDate()">设置日期</button>
        </div>
        <div class="card" style="grid-column:span 2">
          <div class="card-title">🎯 目标院校 & 专业 <button class="btn btn-ghost btn-sm" onclick="M1.editTarget()">编辑</button></div>
          <div class="grid grid-2" id="target-grid">
            ${d.target.school?`
              <div><span style="color:var(--muted);font-size:12px">院校</span><div style="font-weight:600;margin-top:2px">${d.target.school||'未设置'}</div></div>
              <div><span style="color:var(--muted);font-size:12px">专业</span><div style="font-weight:600;margin-top:2px">${d.target.major||'未设置'}</div></div>
              <div><span style="color:var(--muted);font-size:12px">考试科目</span><div style="font-size:13px;margin-top:2px">${d.target.examSubjects||'未设置'}</div></div>
              <div><span style="color:var(--muted);font-size:12px">学制</span><div style="font-size:13px;margin-top:2px">${d.target.studyYears||'未设置'}</div></div>
              <div style="grid-column:span 2"><span style="color:var(--muted);font-size:12px">近三年复试线</span><div style="font-size:13px;margin-top:2px;white-space:pre-wrap">${d.target.past3yLines||'未设置'}</div></div>
              <div style="grid-column:span 2"><span style="color:var(--muted);font-size:12px">报录比</span><div style="font-size:13px;margin-top:2px">${d.target.admitRatio||'未设置'}</div></div>
            `:`<div style="grid-column:span 2">${emptyState('🎯','请编辑目标院校信息')}</div>`}
          </div>
        </div>
      </div>

      <div class="card" style="margin-bottom:16px">
        <div class="card-title">📊 总分 & 单科分数目标拆解 <button class="btn btn-ghost btn-sm" onclick="M1.editTargets()">编辑目标</button></div>
        <div class="grid grid-4">
          ${d.target.subjects.map((s,i)=>`
            <div class="stat-card">
              <div class="stat-val">${s.target}</div>
              <div class="stat-label">${s.name} 目标分</div>
            </div>`).join('')}
          <div class="stat-card" style="background:var(--accent-l);border-color:var(--accent)">
            <div class="stat-val" style="color:var(--accent)">${d.target.subjects.reduce((s,x)=>s+x.target,0)}</div>
            <div class="stat-label">总分目标</div>
          </div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">📈 备考四阶段进度 <button class="btn btn-ghost btn-sm" onclick="M1.editStages()">编辑阶段</button></div>
          <div id="stages-progress">
            ${renderStages(d)}
          </div>
        </div>
        <div class="card">
          <div class="card-title">🗓️ 全周期进度仪表盘</div>
          <div id="overall-progress">
            ${renderOverall(d)}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📌 考研关键节点日历 <button class="btn btn-ghost btn-sm" onclick="M1.editMilestones()">编辑节点</button></div>
        <div class="timeline" id="milestones-timeline">
          ${renderMilestones(d)}
        </div>
      </div>
    `;
    updateCountdown();
  });

  function renderStages(d){
    if(!d.stages.length) return emptyState('📈','请添加备考阶段');
    return d.stages.map(s=>{
      let pct=0;
      if(s.start && s.end){
        const total=daysBetween(s.start,s.end);
        const passed=daysBetween(s.start,todayStr());
        pct=Math.max(0,Math.min(100,Math.round(passed/total*100)));
      }
      return `<div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:13px">
          <span style="font-weight:500;color:${s.color}">● ${s.name}</span>
          <span style="color:var(--muted);font-size:12px">${s.start||'未设置'} ~ ${s.end||'未设置'} · ${pct}%</span>
        </div>
        <div class="progress"><div class="progress-bar" style="width:${pct}%;background:${s.color}"></div></div>
        <div style="font-size:11px;color:var(--muted);margin-top:2px">${s.desc||''}</div>
      </div>`;
    }).join('');
  }

  function renderOverall(d){
    const tasks=d.tasks;
    const totalTasks=tasks.length;
    const doneTasks=tasks.filter(t=>t.done).length;
    const taskPct=totalTasks?Math.round(doneTasks/totalTasks*100):0;
    const books=d.books;
    const bookPct=books.length?Math.round(books.filter(b=>b.status==='done').length/books.length*100):0;
    const mistakes=d.mistakes;
    const reviewedMistakes=mistakes.filter(m=>m.reviewCount>=3).length;
    const mistakePct=mistakes.length?Math.round(reviewedMistakes/mistakes.length*100):0;
    return `
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>任务完成度</span><span style="color:var(--muted)">${doneTasks}/${totalTasks} · ${taskPct}%</span></div>
        <div class="progress"><div class="progress-bar" style="width:${taskPct}%"></div></div>
      </div>
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>教材完成度</span><span style="color:var(--muted)">${bookPct}%</span></div>
        <div class="progress"><div class="progress-bar" style="width:${bookPct}%;background:var(--green)"></div></div>
      </div>
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px"><span>错题消化率</span><span style="color:var(--muted)">${reviewedMistakes}/${mistakes.length} · ${mistakePct}%</span></div>
        <div class="progress"><div class="progress-bar" style="width:${mistakePct}%;background:var(--purple)"></div></div>
      </div>
      <div class="grid grid-4" style="margin-top:14px">
        <div class="stat-card"><div class="stat-val">${d.tasks.filter(t=>t.done).length}</div><div class="stat-label">已完成任务</div></div>
        <div class="stat-card"><div class="stat-val">${d.mistakes.length}</div><div class="stat-label">错题总数</div></div>
        <div class="stat-card"><div class="stat-val">${d.flashcards.length}</div><div class="stat-label">背诵闪卡</div></div>
        <div class="stat-card"><div class="stat-val">${d.mockExams.length}</div><div class="stat-label">模考次数</div></div>
      </div>
    `;
  }

  function renderMilestones(d){
    if(!d.milestones.length) return emptyState('📌','请添加关键节点');
    return d.milestones.map(m=>{
      const daysLeft = m.date?daysBetween(todayStr(),m.date):null;
      let badge='';
      if(daysLeft!==null && !m.done){
        if(daysLeft<0) badge=`<span class="tag tag-high" style="margin-left:6px">已逾期</span>`;
        else if(daysLeft<=7) badge=`<span class="tag tag-high" style="margin-left:6px">还有${daysLeft}天</span>`;
        else badge=`<span class="tag" style="margin-left:6px">还有${daysLeft}天</span>`;
      }
      return `<div class="timeline-item ${m.done?'done':''}">
        <div class="ti-date">${m.date||'未设置日期'}</div>
        <div class="ti-name">${m.name} ${badge}</div>
      </div>`;
    }).join('');
  }

  function updateCountdown(){
    const d=data();
    const el=document.getElementById('cd-num');
    const lb=document.getElementById('cd-label');
    if(!el) return;
    if(d.meta.examDate){
      const days=daysBetween(todayStr(),d.meta.examDate);
      el.textContent=days>=0?days:0;
      lb.textContent=days>=0?`距离 ${fmtDate(d.meta.examDate)} 考研初试`:`考试已结束`;
    }else{
      el.textContent='--';
      lb.textContent='点击下方设置考试日期';
    }
  }

  function setExamDate(){
    const d=data();
    const m=modal('设置考试日期',`
      <div class="form-row"><label>考研初试日期</label><input type="date" id="exam-date" value="${d.meta.examDate||''}"></div>
    `,{okText:'保存',onOk:ov=>{
      d.meta.examDate=ov.querySelector('#exam-date').value;
      autoSave(); m.close(); App.renderSidebar(); App.renderContent(); toast('考试日期已保存');
    }});
  }

  function editTarget(){
    const d=data(); const t=d.target;
    const m=modal('编辑目标院校信息',`
      <div class="form-row"><label>目标院校</label><input type="text" id="t-school" value="${t.school||''}" placeholder="如：清华大学"></div>
      <div class="form-row"><label>目标专业</label><input type="text" id="t-major" value="${t.major||''}" placeholder="如：计算机科学与技术"></div>
      <div class="form-row"><label>考试科目</label><input type="text" id="t-subjects" value="${t.examSubjects||''}" placeholder="如：政治/英语一/数学一/408"></div>
      <div class="form-row"><label>学制</label><input type="text" id="t-years" value="${t.studyYears||''}" placeholder="如：3年"></div>
      <div class="form-row"><label>近三年复试线</label><textarea id="t-lines" placeholder="如：2024: 350 / 2023: 340 / 2022: 330">${t.past3yLines||''}</textarea></div>
      <div class="form-row"><label>报录比</label><input type="text" id="t-ratio" value="${t.admitRatio||''}" placeholder="如：8:1"></div>
    `,{okText:'保存',onOk:ov=>{
      t.school=ov.querySelector('#t-school').value;
      t.major=ov.querySelector('#t-major').value;
      t.examSubjects=ov.querySelector('#t-subjects').value;
      t.studyYears=ov.querySelector('#t-years').value;
      t.past3yLines=ov.querySelector('#t-lines').value;
      t.admitRatio=ov.querySelector('#t-ratio').value;
      autoSave(); m.close(); App.renderContent(); toast('目标信息已保存');
    }});
  }

  function editTargets(){
    const d=data();
    const m=modal('编辑各科目标分数',`
      ${d.target.subjects.map((s,i)=>`<div class="form-row"><label>${s.name}</label><input type="number" id="t-${i}" value="${s.target}" min="0" max="150"></div>`).join('')}
    `,{okText:'保存',onOk:ov=>{
      d.target.subjects.forEach((s,i)=>{ s.target=parseInt(ov.querySelector('#t-'+i).value)||0; });
      autoSave(); m.close(); App.renderContent(); toast('目标分数已保存');
    }});
  }

  function editStages(){
    const d=data();
    const m=modal('编辑备考四阶段',`
      ${d.stages.map((s,i)=>`
        <div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:10px">
          <div style="font-weight:600;margin-bottom:6px;color:${s.color}">● ${s.name}</div>
          <div class="form-row"><label>开始日期</label><input type="date" id="s-${i}-start" value="${s.start||''}"></div>
          <div class="form-row"><label>结束日期</label><input type="date" id="s-${i}-end" value="${s.end||''}"></div>
          <div class="form-row"><label>阶段描述</label><input type="text" id="s-${i}-desc" value="${s.desc||''}"></div>
        </div>`).join('')}
    `,{okText:'保存',onOk:ov=>{
      d.stages.forEach((s,i)=>{
        s.start=ov.querySelector(`#s-${i}-start`).value;
        s.end=ov.querySelector(`#s-${i}-end`).value;
        s.desc=ov.querySelector(`#s-${i}-desc`).value;
      });
      autoSave(); m.close(); App.renderContent(); toast('阶段信息已保存');
    }});
  }

  function editMilestones(){
    const d=data();
    const m=modal('编辑考研关键节点',`
      ${d.milestones.map((ms,i)=>`
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
          <input type="text" value="${ms.name}" id="m-${i}-name" style="flex:1;padding:6px;border:1px solid var(--border);border-radius:6px">
          <input type="date" value="${ms.date||''}" id="m-${i}-date" style="width:150px;padding:6px;border:1px solid var(--border);border-radius:6px">
          <button class="btn-icon" onclick="this.parentElement.remove()">🗑</button>
        </div>`).join('')}
      <button class="btn btn-ghost btn-sm" onclick="M1.addMilestoneRow(this)">+ 添加节点</button>
    `,{okText:'保存',onOk:ov=>{
      const rows=ov.querySelectorAll('[id^="m-"]');
      const newMs=[];
      for(let i=0;i<d.milestones.length;i++){
        const nameEl=ov.querySelector(`#m-${i}-name`);
        const dateEl=ov.querySelector(`#m-${i}-date`);
        if(nameEl && nameEl.value) newMs.push({...d.milestones[i],name:nameEl.value,date:dateEl?dateEl.value:''});
      }
      // 处理新增行
      ov.querySelectorAll('[id^="m-new-"]').forEach(el=>{
        const idx=el.id.match(/m-new-(\d+)/)[1];
        const nameEl=ov.querySelector(`#m-new-${idx}-name`);
        const dateEl=ov.querySelector(`#m-new-${idx}-date`);
        if(nameEl && nameEl.value) newMs.push({id:DB.nextId(),name:nameEl.value,date:dateEl?dateEl.value:'',done:false});
      });
      d.milestones=newMs;
      autoSave(); m.close(); App.renderSidebar(); App.renderContent(); toast('关键节点已保存');
    }});
  }

  let newMsCounter=0;
  function addMilestoneRow(btn){
    const idx=newMsCounter++;
    const div=document.createElement('div');
    div.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:8px';
    div.innerHTML=`<input type="text" id="m-new-${idx}-name" placeholder="节点名称" style="flex:1;padding:6px;border:1px solid var(--border);border-radius:6px">
      <input type="date" id="m-new-${idx}-date" style="width:150px;padding:6px;border:1px solid var(--border);border-radius:6px">
      <button class="btn-icon" onclick="this.parentElement.remove()">🗑</button>`;
    btn.parentElement.insertBefore(div,btn);
  }

  w.M1={ setExamDate,editTarget,editTargets,editStages,editMilestones,addMilestoneRow };

})(window);
