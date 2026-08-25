/* ===== 大功能6：复盘、报考与复试预备管理 ===== */
(function(w){
  const {data,autoSave,toast,modal,fmtDate,todayStr,emptyState,nextId} = w.DB;
  let curTab='dailyReview';

  w.App.route('review', function(c){
    const d=data();
    c.innerHTML=`
      <div class="tabs">
        <div class="tab ${curTab==='dailyReview'?'active':''}" onclick="M6.switch('dailyReview')">📝 每日复盘</div>
        <div class="tab ${curTab==='weekReview'?'active':''}" onclick="M6.switch('weekReview')">📅 周复盘</div>
        <div class="tab ${curTab==='monthReview'?'active':''}" onclick="M6.switch('monthReview')">🗓️ 月复盘</div>
        <div class="tab ${curTab==='weakness'?'active':''}" onclick="M6.switch('weakness')">🎯 薄弱点</div>
        <div class="tab ${curTab==='apply'?'active':''}" onclick="M6.switch('apply')">📋 报考清单</div>
        <div class="tab ${curTab==='interview'?'active':''}" onclick="M6.switch('interview')">🎤 复试储备</div>
        <div class="tab ${curTab==='mood'?'active':''}" onclick="M6.switch('mood')">💗 情绪记录</div>
        <div class="tab ${curTab==='misc'?'active':''}" onclick="M6.switch('misc')">🗃️ 杂物箱</div>
        <div class="tab ${curTab==='extra'?'active':''}" onclick="M6.switch('extra')">➕ 附加资源</div>
      </div>
      <div id="review-content"></div>
    `;
    renderTab();
  });

  function renderTab(){
    const el=document.getElementById('review-content'); if(!el) return;
    ({dailyReview:renderDailyReview,weekReview:renderWeekReview,monthReview:renderMonthReview,weakness:renderWeakness,apply:renderApply,interview:renderInterview,mood:renderMood,misc:renderMisc,extra:renderExtra}[curTab])(el);
  }

  /* --- 每日复盘 --- */
  function renderDailyReview(el){
    const d=data();
    const today=todayStr();
    let rec=d.dailyReviews.find(x=>x.date===today);
    if(!rec) rec={id:nextId(),date:today,done:false,problems:'',plan:'',gain:''};
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📝 每日复盘日志 · ${today} <button class="btn btn-primary btn-sm" onclick="M6.saveDaily()">保存今日复盘</button></div>
        <div class="form-row"><label>今日完成 / 收获</label><textarea id="dr-gain" placeholder="今天搞定了什么？">${rec.gain||''}</textarea></div>
        <div class="form-row"><label>存在问题</label><textarea id="dr-problems" placeholder="哪些没弄懂、状态如何？">${rec.problems||''}</textarea></div>
        <div class="form-row"><label>明日计划</label><textarea id="dr-plan" placeholder="明天重点做什么？">${rec.plan||''}</textarea></div>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px;cursor:pointer"><input type="checkbox" id="dr-done" ${rec.done?'checked':''}> 标记今日复盘已完成</label>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title">📜 历史复盘（按日期折叠）</div>
        ${historySectionFor(d.dailyReviews,'date',x=>`<div style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;margin-bottom:6px"><div style="font-size:13px"><b>收获：</b>${x.gain||'-'}</div><div style="font-size:12px;color:var(--muted);margin-top:3px"><b>问题：</b>${x.problems||'-'}</div><div style="font-size:12px;color:var(--muted)"><b>计划：</b>${x.plan||'-'}</div></div>`)}
      </div>
    `;
  }
  function saveDaily(){
    const d=data(); const today=todayStr();
    let rec=d.dailyReviews.find(x=>x.date===today);
    if(!rec){rec={id:nextId(),date:today};d.dailyReviews.push(rec);}
    rec.gain=document.getElementById('dr-gain').value;
    rec.problems=document.getElementById('dr-problems').value;
    rec.plan=document.getElementById('dr-plan').value;
    rec.done=document.getElementById('dr-done').checked;
    autoSave(); toast('今日复盘已保存');
  }

  // 按字段分组的历史折叠（数组 + 渲染函数）
  function historySectionFor(items, field, renderFn){
    const groups={};
    items.forEach(it=>{const k=it[field]||'未知';(groups[k]=groups[k]||[]).push(it);});
    const keys=Object.keys(groups).sort().reverse();
    if(!keys.length) return emptyState('📦','暂无记录');
    return keys.map(k=>`<div class="history-date" onclick="this.nextElementSibling.classList.toggle('open')"><span>📅 ${k}</span><span class="count">${groups[k].length} 项</span></div><div class="history-items">${groups[k].map(renderFn).join('')}</div>`).join('');
  }

  /* --- 周复盘 --- */
  function renderWeekReview(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📅 周复盘模板 <button class="btn btn-primary btn-sm" onclick="M6.addWeekReview()">+ 新建本周复盘</button></div>
        ${d.weekReviews.length?d.weekReviews.slice().reverse().map(r=>`
          <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between;align-items:center"><b>${r.week||'未命名周'}</b>
              <div><button class="btn-icon" onclick="M6.editWeekReview(${r.id})">📝</button><button class="btn-icon" onclick="M6.delWeekReview(${r.id})">🗑</button></div></div>
            <div style="font-size:12px;color:var(--muted);margin-top:6px;white-space:pre-wrap"><b>进度回顾：</b>${r.progress||'-'}\n<b>现存问题：</b>${r.problems||'-'}\n<b>改进计划：</b>${r.plan||'-'}</div>
          </div>`).join(''):emptyState('📅','暂无周复盘，点击新建')}
      </div>`;
  }
  function weekReviewForm(r){
    return `<div class="form-row"><label>周次标识</label><input type="text" id="wr-week" value="${r.week||''}" placeholder="如：第12周"></div>
      <div class="form-row"><label>进度回顾</label><textarea id="wr-progress">${r.progress||''}</textarea></div>
      <div class="form-row"><label>现存问题</label><textarea id="wr-problems">${r.problems||''}</textarea></div>
      <div class="form-row"><label>下周改进计划</label><textarea id="wr-plan">${r.plan||''}</textarea></div>`;
  }
  function addWeekReview(){const r={id:nextId(),week:'',progress:'',problems:'',plan:''};const m=modal('新建周复盘',weekReviewForm(r),{okText:'保存',onOk:ov=>{r.week=ov.querySelector('#wr-week').value;r.progress=ov.querySelector('#wr-progress').value;r.problems=ov.querySelector('#wr-problems').value;r.plan=ov.querySelector('#wr-plan').value;data().weekReviews.push(r);autoSave();m.close();renderTab();toast('已保存');}});}
  function editWeekReview(id){const r=data().weekReviews.find(x=>x.id===id);if(!r)return;const m=modal('编辑周复盘',weekReviewForm(r),{okText:'保存',onOk:ov=>{r.week=ov.querySelector('#wr-week').value;r.progress=ov.querySelector('#wr-progress').value;r.problems=ov.querySelector('#wr-problems').value;r.plan=ov.querySelector('#wr-plan').value;autoSave();m.close();renderTab();toast('已更新');}});}
  function delWeekReview(id){DB.confirm('删除？',()=>{const d=data();d.weekReviews=d.weekReviews.filter(x=>x.id!==id);autoSave();renderTab();});}

  /* --- 月复盘 --- */
  function renderMonthReview(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🗓️ 月度深度复盘 <button class="btn btn-primary btn-sm" onclick="M6.addMonthReview()">+ 新建月复盘</button></div>
        ${d.monthReviews.length?d.monthReviews.slice().reverse().map(r=>`
          <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px">
            <div style="display:flex;justify-content:space-between"><b>${r.month||'未命名月'}</b>
              <div><button class="btn-icon" onclick="M6.editMonthReview(${r.id})">📝</button><button class="btn-icon" onclick="M6.delMonthReview(${r.id})">🗑</button></div></div>
            <div style="font-size:12px;color:var(--muted);margin-top:6px;white-space:pre-wrap"><b>本月总结：</b>${r.summary||'-'}\n<b>达成情况：</b>${r.achieved||'-'}\n<b>差距分析：</b>${r.gap||'-'}\n<b>下月规划：</b>${r.next||'-'}</div>
          </div>`).join(''):emptyState('🗓️','暂无月复盘，点击新建')}
      </div>`;
  }
  function monthReviewForm(r){
    return `<div class="form-row"><label>月份</label><input type="text" id="mr-month" value="${r.month||''}" placeholder="如：2026-08"></div>
      <div class="form-row"><label>本月总结</label><textarea id="mr-summary">${r.summary||''}</textarea></div>
      <div class="form-row"><label>目标达成情况</label><textarea id="mr-achieved">${r.achieved||''}</textarea></div>
      <div class="form-row"><label>差距分析</label><textarea id="mr-gap">${r.gap||''}</textarea></div>
      <div class="form-row"><label>下月规划</label><textarea id="mr-next">${r.next||''}</textarea></div>`;
  }
  function addMonthReview(){const r={id:nextId(),month:'',summary:'',achieved:'',gap:'',next:''};const m=modal('新建月复盘',monthReviewForm(r),{okText:'保存',onOk:ov=>{r.month=ov.querySelector('#mr-month').value;r.summary=ov.querySelector('#mr-summary').value;r.achieved=ov.querySelector('#mr-achieved').value;r.gap=ov.querySelector('#mr-gap').value;r.next=ov.querySelector('#mr-next').value;data().monthReviews.push(r);autoSave();m.close();renderTab();toast('已保存');}});}
  function editMonthReview(id){const r=data().monthReviews.find(x=>x.id===id);if(!r)return;const m=modal('编辑月复盘',monthReviewForm(r),{okText:'保存',onOk:ov=>{r.month=ov.querySelector('#mr-month').value;r.summary=ov.querySelector('#mr-summary').value;r.achieved=ov.querySelector('#mr-achieved').value;r.gap=ov.querySelector('#mr-gap').value;r.next=ov.querySelector('#mr-next').value;autoSave();m.close();renderTab();toast('已更新');}});}
  function delMonthReview(id){DB.confirm('删除？',()=>{const d=data();d.monthReviews=d.monthReviews.filter(x=>x.id!==id);autoSave();renderTab();});}

  /* --- 薄弱知识点 --- */
  function renderWeakness(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🎯 薄弱知识点追踪台账 <button class="btn btn-primary btn-sm" onclick="M6.addWeakness()">+ 添加</button></div>
        ${d.weaknesses.length?d.weaknesses.filter(x=>!x.mastered).map(x=>`
          <div class="weakness-item"><div style="display:flex;justify-content:space-between"><div><b>${x.topic}</b> <span class="tag" style="margin-left:6px">${x.subject||'未分类'}</span></div>
            <div><button class="btn-icon" onclick="M6.masterWeak(${x.id})">✅已掌握</button><button class="btn-icon" onclick="M6.delWeak(${x.id})">🗑</button></div></div>
            <div class="w-meta">原因：${x.reason||'-'} ｜ 攻克计划：${x.plan||'-'}</div></div>`).join(''):emptyState('🎯','暂无未掌握薄弱点，太棒了！')}
        ${d.weaknesses.filter(x=>x.mastered).length?`<div style="margin-top:12px;font-size:12px;color:var(--green)">✅ 已攻克 ${d.weaknesses.filter(x=>x.mastered).length} 个薄弱点（折叠在下方）</div>
        <div style="margin-top:6px">${d.weaknesses.filter(x=>x.mastered).map(x=>`<div style="font-size:12px;color:var(--muted);padding:4px 0">✔ ${x.topic}</div>`).join('')}</div>`:''}
      </div>`;
  }
  function addWeakness(){
    const m=modal('添加薄弱知识点',`<div class="form-row"><label>学科</label><input type="text" id="wk-subject" placeholder="如：数学"></div><div class="form-row"><label>知识点</label><input type="text" id="wk-topic" placeholder="如：中值定理证明" autofocus></div><div class="form-row"><label>没掌握原因</label><input type="text" id="wk-reason" placeholder="如：题型不熟"></div><div class="form-row"><label>攻克计划</label><input type="text" id="wk-plan" placeholder="如：刷10道同类题"></div>`,{okText:'添加',onOk:ov=>{const topic=ov.querySelector('#wk-topic').value.trim();if(!topic){toast('请输入知识点');return;}data().weaknesses.push({id:nextId(),subject:ov.querySelector('#wk-subject').value,topic,reason:ov.querySelector('#wk-reason').value,plan:ov.querySelector('#wk-plan').value,mastered:false});autoSave();m.close();renderTab();toast('已添加');}});
  }
  function masterWeak(id){const x=data().weaknesses.find(w=>w.id===id);if(x){x.mastered=true;autoSave();renderTab();toast('标记为已掌握');}}
  function delWeak(id){DB.confirm('删除？',()=>{const d=data();d.weaknesses=d.weaknesses.filter(x=>x.id!==id);autoSave();renderTab();});}

  /* --- 报考事务清单 --- */
  function renderApply(el){
    const d=data();
    const defaultItems=['考生信息核对','学籍/学历认证','证件照采集','报名费缴纳','网上确认材料准备','准考证打印','考试用品清单','健康申报(如需)'];
    if(!d.applyChecklist.length) defaultItems.forEach(it=>d.applyChecklist.push({id:nextId(),item:it,done:false}));
    const doneCnt=d.applyChecklist.filter(x=>x.done).length;
    el.innerHTML=`
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">📋 报考事务清单 <button class="btn btn-primary btn-sm" onclick="M6.addApply()">+ 添加</button></div>
        <div style="margin-bottom:10px"><div class="progress"><div class="progress-bar" style="width:${d.applyChecklist.length?Math.round(doneCnt/d.applyChecklist.length*100):0}%"></div></div>
          <div style="font-size:12px;color:var(--muted);margin-top:4px">已完成 ${doneCnt}/${d.applyChecklist.length}</div></div>
        <ul class="check-list">
          ${d.applyChecklist.map(x=>`<li><div class="cb ${x.done?'done':''}" onclick="M6.toggleApply(${x.id})">${x.done?'✓':''}</div><span style="${x.done?'text-decoration:line-through;color:var(--muted)':''}">${x.item}</span><span style="margin-left:auto" onclick="M6.delApply(${x.id})">✕</span></li>`).join('')}
        </ul>
      </div>
      <div class="card">
        <div class="card-title">📝 模拟报名演练备忘录</div>
        <textarea id="mock-apply" style="min-height:120px" oninput="M6.saveMockApply(this.value)" placeholder="演练报名流程时记录账号、关键信息、易错项...">${d.mockApplyNotes||''}</textarea>
        <div style="font-size:11px;color:var(--muted);margin-top:4px">自动保存</div>
      </div>
    `;
  }
  function addApply(){const m=modal('添加报考事务',`<div class="form-row"><label>事项</label><input type="text" id="ap-item" autofocus></div>`,{okText:'添加',onOk:ov=>{const item=ov.querySelector('#ap-item').value.trim();if(!item){toast('请输入');return;}data().applyChecklist.push({id:nextId(),item,done:false});autoSave();m.close();renderTab();App.renderSidebar();toast('已添加');}});}
  function toggleApply(id){const x=data().applyChecklist.find(a=>a.id===id);if(x){x.done=!x.done;autoSave();renderTab();App.renderSidebar();}}
  function delApply(id){const d=data();d.applyChecklist=d.applyChecklist.filter(x=>x.id!==id);autoSave();renderTab();}
  function saveMockApply(v){data().mockApplyNotes=v;autoSave();}

  /* --- 复试素材储备 --- */
  function renderInterview(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🎤 复试素材储备区 <button class="btn btn-primary btn-sm" onclick="M6.addInterview()">+ 添加</button></div>
        ${d.interviewPrep.length?d.interviewPrep.map(it=>`
          <div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
            <div style="display:flex;justify-content:space-between"><span class="tag tag-mid">${it.type}</span>
              <div><button class="btn-icon" onclick="M6.delInterview(${it.id})">🗑</button></div></div>
            <div style="font-size:13px;margin-top:6px;white-space:pre-wrap">${it.content}</div>
          </div>`).join(''):emptyState('🎤','提前储备简历/自我介绍/面试题库')}
        <div style="font-size:12px;color:var(--muted);margin-top:8px">建议分类：个人简历 / 自我介绍 / 英文问答 / 专业面试题 / 导师研究方向</div>
      </div>`;
  }
  function addInterview(){
    const m=modal('添加复试素材',`<div class="form-row"><label>类型</label><select id="iv-type"><option>个人简历</option><option>自我介绍</option><option>英文问答</option><option>专业面试题</option><option>导师方向</option><option>其他</option></select></div><div class="form-row"><label>内容</label><textarea id="iv-content" style="min-height:120px"></textarea></div>`,{okText:'添加',onOk:ov=>{const content=ov.querySelector('#iv-content').value.trim();if(!content){toast('请输入内容');return;}data().interviewPrep.push({id:nextId(),type:ov.querySelector('#iv-type').value,content});autoSave();m.close();renderTab();toast('已添加');}});
  }
  function delInterview(id){const d=data();d.interviewPrep=d.interviewPrep.filter(x=>x.id!==id);autoSave();renderTab();}

  /* --- 情绪记录 --- */
  function renderMood(el){
    const d=data();
    const todayList=d.moods.filter(x=>x.date===todayStr());
    const moods=['😊 轻松','😐 平稳','😟 焦虑','😴 疲惫','😤 烦躁','💪 充实'];
    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">💗 记录此刻心情</div>
          <div class="seg" style="margin-bottom:8px">${moods.map((m,i)=>`<span class="seg-btn" onclick="M6.pickMood(${i})">${m}</span>`).join('')}</div>
          <div class="form-row"><label>备注</label><input type="text" id="md-note" placeholder="今天状态怎么样？"></div>
          <button class="btn btn-primary btn-sm" onclick="M6.addMood()">记录</button>
          <div style="font-size:11px;color:var(--muted);margin-top:4px">选中上面对应心情后再点记录</div>
        </div>
        <div class="card">
          <div class="card-title">📊 今日心情</div>
          ${todayList.length?todayList.map(x=>`<div style="font-size:13px;padding:6px 0;border-bottom:1px solid var(--border)">${x.mood} <span style="color:var(--muted)">${x.note||''}</span></div>`).join(''):emptyState('💗','今天还没记录心情')}
        </div>
      </div>
      <div class="card">
        <div class="card-title">📜 心情记录（按日期）</div>
        ${historySectionFor(d.moods,'date',x=>`<div style="padding:5px 0;font-size:13px">${x.mood} <span style="color:var(--muted)">${x.note||''}</span></div>`)}
      </div>
    `;
  }
  let pickedMood='';
  function pickMood(i){pickedMood=['😊 轻松','😐 平稳','😟 焦虑','😴 疲惫','😤 烦躁','💪 充实'][i];toast('已选：'+pickedMood);}
  function addMood(){
    if(!pickedMood){toast('请先选择心情');return;}
    data().moods.push({id:nextId(),date:todayStr(),mood:pickedMood,note:document.getElementById('md-note').value});
    autoSave(); renderTab(); toast('已记录');
  }

  /* --- 杂物箱 --- */
  function renderMisc(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">🗃️ 杂物收纳箱 <button class="btn btn-primary btn-sm" onclick="M6.addMisc()">+ 记一笔</button></div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">把考研期间的零碎琐事、灵感、待办记这里，释放大脑内存。</div>
        ${d.misc.length?d.misc.slice().reverse().map(x=>`<div class="misc-item"><div><div style="font-size:13px">${x.content}</div><div style="font-size:11px;color:var(--muted)">${fmtDate(x.date)}</div></div><span class="mi-del" onclick="M6.delMisc(${x.id})">✕</span></div>`).join(''):emptyState('🗃️','杂物箱是空的')}
      </div>`;
  }
  function addMisc(){
    const m=modal('记一笔',`<div class="form-row"><label>内容</label><textarea id="mc-content" placeholder="如：12月要订考场附近酒店" autofocus></textarea></div>`,{okText:'保存',onOk:ov=>{const content=ov.querySelector('#mc-content').value.trim();if(!content){toast('请输入');return;}data().misc.push({id:nextId(),content,date:todayStr()});autoSave();m.close();renderTab();toast('已记录');}});
  }
  function delMisc(id){const d=data();d.misc=d.misc.filter(x=>x.id!==id);autoSave();renderTab();}

  /* --- 附加资源（资源索引 / FAQ / 参考书对比） --- */
  function renderExtra(el){
    const d=data();
    el.innerHTML=`
      <div class="grid grid-3" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">📚 公共课/专业课资源索引 <button class="btn btn-primary btn-sm" onclick="M6.addResource()">+ 添加</button></div>
          ${d.resourceIndex.length?d.resourceIndex.map(r=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div style="font-size:13px"><b>${r.name}</b> <span class="tag">${r.cat||''}</span></div><div style="font-size:11px;color:var(--accent)">${r.url||r.note||''}</div><span class="ti-del" onclick="M6.delResource(${r.id})">✕</span></div>`).join(''):emptyState('📚','添加网课/资料链接')}
        </div>
        <div class="card">
          <div class="card-title">❓ 考研常见疑问知识库 <button class="btn btn-primary btn-sm" onclick="M6.addFaq()">+ 添加</button></div>
          ${d.faq.length?d.faq.map(f=>`<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div style="font-size:13px"><b>Q：${f.q}</b></div><div style="font-size:12px;color:var(--muted)">A：${f.a||'-'}</div><span class="ti-del" onclick="M6.delFaq(${f.id})">✕</span></div>`).join(''):emptyState('❓','记录高频疑问与答案')}
        </div>
        <div class="card">
          <div class="card-title">⚖️ 参考书对比清单 <button class="btn btn-primary btn-sm" onclick="M6.addBookCmp()">+ 添加</button></div>
          ${d.bookCompare.length?d.bookCompare.map(b=>`
            <div style="border:1px solid var(--border);border-radius:8px;padding:8px;margin-bottom:6px">
              <div style="font-size:13px;display:flex;justify-content:space-between"><b>${b.topic}</b><span class="ti-del" onclick="M6.delBookCmp(${b.id})">✕</span></div>
              <div style="font-size:11px;color:var(--muted);white-space:pre-wrap;margin-top:3px">${b.detail||''}</div>
            </div>`).join(''):emptyState('⚖️','对比同类参考书优缺点')}
        </div>
      </div>`;
  }
  function addResource(){const m=modal('添加资源',`<div class="form-row"><label>分类</label><input type="text" id="rs-cat" placeholder="如：数学网课"></div><div class="form-row"><label>名称</label><input type="text" id="rs-name" autofocus></div><div class="form-row"><label>链接/备注</label><input type="text" id="rs-url"></div>`,{okText:'添加',onOk:ov=>{const name=ov.querySelector('#rs-name').value.trim();if(!name){toast('请输入名称');return;}data().resourceIndex.push({id:nextId(),cat:ov.querySelector('#rs-cat').value,name,url:ov.querySelector('#rs-url').value});autoSave();m.close();renderTab();toast('已添加');}});}
  function delResource(id){const d=data();d.resourceIndex=d.resourceIndex.filter(x=>x.id!==id);autoSave();renderTab();}
  function addFaq(){const m=modal('添加疑问',`<div class="form-row"><label>问题</label><input type="text" id="fq-q" autofocus></div><div class="form-row"><label>解答</label><textarea id="fq-a"></textarea></div>`,{okText:'添加',onOk:ov=>{const q=ov.querySelector('#fq-q').value.trim();if(!q){toast('请输入问题');return;}data().faq.push({id:nextId(),q,a:ov.querySelector('#fq-a').value});autoSave();m.close();renderTab();toast('已添加');}});}
  function delFaq(id){const d=data();d.faq=d.faq.filter(x=>x.id!==id);autoSave();renderTab();}
  function addBookCmp(){const m=modal('添加对比',`<div class="form-row"><label>对比主题</label><input type="text" id="bc-topic" placeholder="如：高数教材 同济vs 张宇" autofocus></div><div class="form-row"><label>对比内容</label><textarea id="bc-detail" placeholder="逐条列出优缺点"></textarea></div>`,{okText:'添加',onOk:ov=>{const topic=ov.querySelector('#bc-topic').value.trim();if(!topic){toast('请输入主题');return;}data().bookCompare.push({id:nextId(),topic,detail:ov.querySelector('#bc-detail').value});autoSave();m.close();renderTab();toast('已添加');}});}
  function delBookCmp(id){const d=data();d.bookCompare=d.bookCompare.filter(x=>x.id!==id);autoSave();renderTab();}

  function switchTab(tab){curTab=tab;App.renderContent();}
  w.M6={switch:switchTab,saveDaily,addWeekReview,editWeekReview,delWeekReview,addMonthReview,editMonthReview,delMonthReview,addWeakness,masterWeak,delWeak,addApply,toggleApply,delApply,saveMockApply,addInterview,delInterview,addMood,pickMood,addMisc,delMisc,addResource,delResource,addFaq,delFaq,addBookCmp,delBookCmp};
})(window);
