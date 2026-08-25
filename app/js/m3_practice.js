/* ===== 大功能3：刷题真题与模考训练系统 ===== */
(function(w){
  const {data,autoSave,toast,modal,fmtDate,todayStr,emptyState,historySection,nextReviewDate,isDueForReview} = w.DB;

  const SUBJECTS=['政治','英语','数学','专业课一','专业课二'];
  const REASONS=['概念模糊','计算失误','审题错误','记忆遗忘'];
  const TYPES=['选择题','计算题','简答题','论述题'];
  let curTab='mistakes';

  w.App.route('practice', function(c){
    const d=data();
    const dueMistakes=d.mistakes.filter(m=>isDueForReview(m.nextReview)).length;
    const dueCards=d.flashcards.filter(f=>isDueForReview(f.nextReview)).length;
    c.innerHTML=`
      <div class="tabs">
        <div class="tab ${curTab==='mistakes'?'active':''}" onclick="M3.switch('mistakes')">❌ 错题库 ${dueMistakes?`<span class="tag tag-high" style="margin-left:4px">${dueMistakes}</span>`:''}</div>
        <div class="tab ${curTab==='pastpapers'?'active':''}" onclick="M3.switch('pastpapers')">📄 历年真题</div>
        <div class="tab ${curTab==='mock'?'active':''}" onclick="M3.switch('mock')">🎯 模考训练</div>
        <div class="tab ${curTab==='scores'?'active':''}" onclick="M3.switch('scores')">📈 分数趋势</div>
        <div class="tab ${curTab==='training'?'active':''}" onclick="M3.switch('training')">💪 专项训练</div>
        <div class="tab ${curTab==='templates'?'active':''}" onclick="M3.switch('templates')">📋 答题模板</div>
      </div>
      <div id="practice-content"></div>
    `;
    renderTab();
  });

  function renderTab(){
    const el=document.getElementById('practice-content');
    if(!el) return;
    if(curTab==='mistakes') renderMistakes(el);
    else if(curTab==='pastpapers') renderPastPapers(el);
    else if(curTab==='mock') renderMock(el);
    else if(curTab==='scores') renderScores(el);
    else if(curTab==='training') renderTraining(el);
    else if(curTab==='templates') renderTemplates(el);
  }

  // 错题库
  function renderMistakes(el){
    const d=data();
    const due=d.mistakes.filter(m=>isDueForReview(m.nextReview));
    el.innerHTML=`
      <div class="grid grid-3" style="margin-bottom:16px">
        <div class="stat-card"><div class="stat-val">${d.mistakes.length}</div><div class="stat-label">错题总数</div></div>
        <div class="stat-card" style="background:var(--red-l)"><div class="stat-val" style="color:var(--red)">${due.length}</div><div class="stat-label">待复习</div></div>
        <div class="stat-card" style="background:var(--green-l)"><div class="stat-val" style="color:var(--green)">${d.mistakes.filter(m=>m.reviewCount>=3).length}</div><div class="stat-label">已消化</div></div>
      </div>
      ${due.length?`<div class="card" style="margin-bottom:16px;border-left:4px solid var(--red)">
        <div class="card-title">🔴 今日待复习错题 (${due.length}) <button class="btn btn-primary btn-sm" onclick="M3.reviewMistake(${due[0].id})">开始复习</button></div>
        <div>${due.slice(0,5).map(m=>`<div class="task-item"><div class="ti-body"><div class="ti-title">${m.question.slice(0,50)}${m.question.length>50?'...':''}</div><div class="ti-meta"><span class="tag">${m.subject}</span><span class="tag">${m.chapter||''}</span><span class="tag tag-high">${m.reason||''}</span><span>已复习${m.reviewCount}次</span></div></div></div>`).join('')}</div>
      </div>`:''}
      <div class="card">
        <div class="card-title">❌ 错题库 <button class="btn btn-primary btn-sm" onclick="M3.addMistake()">添加错题</button></div>
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <select id="f-subject" onchange="M3.filterMistakes()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px">
            <option value="">全部学科</option>${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}
          </select>
          <select id="f-reason" onchange="M3.filterMistakes()" style="padding:5px 8px;border:1px solid var(--border);border-radius:6px">
            <option value="">全部原因</option>${REASONS.map(r=>`<option value="${r}">${r}</option>`).join('')}
          </select>
          <input type="text" id="f-search" placeholder="搜索题干/解析..." oninput="M3.filterMistakes()" style="flex:1;min-width:200px;padding:5px 8px;border:1px solid var(--border);border-radius:6px">
        </div>
        <div id="mistakes-list"></div>
      </div>
    `;
    filterMistakes();
  }

  let mistakeFilters={subject:'',reason:'',search:''};
  function filterMistakes(){
    const el=document.getElementById('mistakes-list');
    if(!el) return;
    mistakeFilters.subject=document.getElementById('f-subject')?.value||'';
    mistakeFilters.reason=document.getElementById('f-reason')?.value||'';
    mistakeFilters.search=document.getElementById('f-search')?.value||'';
    const d=data();
    let list=d.mistakes;
    if(mistakeFilters.subject) list=list.filter(m=>m.subject===mistakeFilters.subject);
    if(mistakeFilters.reason) list=list.filter(m=>m.reason===mistakeFilters.reason);
    if(mistakeFilters.search) list=list.filter(m=>(m.question||'').includes(mistakeFilters.search)||(m.analysis||'').includes(mistakeFilters.search));
    if(!list.length){el.innerHTML=emptyState('❌','暂无错题，点击右上角添加');return;}
    el.innerHTML=list.map(m=>`<div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
        <div><span class="tag tag-high">${m.subject}</span> <span class="tag">${m.chapter||'未分类'}</span> <span class="tag tag-mid">${m.reason||'未标注'}</span> <span class="diff">${'★'.repeat(m.difficulty||1)}</span></div>
        <div><button class="btn-icon" onclick="M3.reviewMistake(${m.id})">🔄</button><button class="btn-icon" onclick="M3.editMistake(${m.id})">📝</button><button class="btn-icon" onclick="M3.delMistake(${m.id})">🗑</button></div>
      </div>
      <div style="font-size:13px;margin-bottom:6px"><b>题干：</b>${m.question}</div>
      ${m.myAnswer?`<div style="font-size:12px;color:var(--red);margin-bottom:4px"><b>我的答案：</b>${m.myAnswer}</div>`:''}
      ${m.correct?`<div style="font-size:12px;color:var(--green);margin-bottom:4px"><b>正确答案：</b>${m.correct}</div>`:''}
      ${m.analysis?`<div style="font-size:12px;color:var(--muted);margin-bottom:4px"><b>解析：</b>${m.analysis}</div>`:''}
      <div style="font-size:11px;color:var(--muted)">${fmtDate(m.date)} · 已复习${m.reviewCount||0}次 · 下次复习：${m.nextReview||'待安排'}</div>
    </div>`).join('');
  }

  function addMistake(){
    editMistake(null);
  }

  function editMistake(id){
    const d=data(); const m=id?d.mistakes.find(x=>x.id===id):{id:DB.nextId(),subject:'政治',chapter:'',reason:'',difficulty:2,question:'',myAnswer:'',correct:'',analysis:'',date:todayStr(),nextReview:nextReviewDate(todayStr(),0),reviewCount:0};
    const modal2=modal(id?'编辑错题':'添加错题',`
      <div class="form-row"><label>学科</label><select id="m-subject">${SUBJECTS.map(s=>`<option value="${s}" ${m.subject===s?'selected':''}>${s}</option>`).join('')}</select></div>
      <div class="form-row"><label>对应章节</label><input type="text" id="m-chapter" value="${m.chapter||''}" placeholder="如：马原第二章"></div>
      <div class="form-row"><label>错误原因</label><select id="m-reason">${REASONS.map(r=>`<option value="${r}" ${m.reason===r?'selected':''}>${r}</option>`).join('')}</select></div>
      <div class="form-row"><label>难度</label><select id="m-diff"><option value="1" ${m.difficulty==1?'selected':''}>★</option><option value="2" ${m.difficulty==2?'selected':''}>★★</option><option value="3" ${m.difficulty==3?'selected':''}>★★★</option><option value="4" ${m.difficulty==4?'selected':''}>★★★★</option><option value="5" ${m.difficulty==5?'selected':''}>★★★★★</option></select></div>
      <div class="form-row"><label>题干</label><textarea id="m-question" placeholder="输入题目内容...">${m.question||''}</textarea></div>
      <div class="form-row"><label>我的答案（错误）</label><textarea id="m-my" placeholder="输入你当时写的答案">${m.myAnswer||''}</textarea></div>
      <div class="form-row"><label>正确答案</label><textarea id="m-correct" placeholder="输入正确答案">${m.correct||''}</textarea></div>
      <div class="form-row"><label>解析/总结</label><textarea id="m-analysis" placeholder="输入解析或自己的总结">${m.analysis||''}</textarea></div>
    `,{okText:id?'保存':'添加',onOk:ov=>{
      m.subject=ov.querySelector('#m-subject').value;
      m.chapter=ov.querySelector('#m-chapter').value;
      m.reason=ov.querySelector('#m-reason').value;
      m.difficulty=parseInt(ov.querySelector('#m-diff').value);
      m.question=ov.querySelector('#m-question').value;
      m.myAnswer=ov.querySelector('#m-my').value;
      m.correct=ov.querySelector('#m-correct').value;
      m.analysis=ov.querySelector('#m-analysis').value;
      if(!id){
        d.mistakes.push(m);
      }
      autoSave(); modal2.close(); filterMistakes(); App.renderSidebar(); toast(id?'已更新':'错题已添加');
    }});
  }

  function reviewMistake(id){
    const d=data(); const m=d.mistakes.find(x=>x.id===id);if(!m)return;
    const m2=modal('复习错题',`
      <div style="font-size:13px;margin-bottom:10px"><b>学科：</b>${m.subject} | <b>章节：</b>${m.chapter||'-'} | <b>难度：</b>${'★'.repeat(m.difficulty||1)}</div>
      <div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:10px"><b>题干：</b><br>${m.question}</div>
      ${m.myAnswer?`<div style="background:var(--red-l);border-radius:8px;padding:10px;margin-bottom:10px"><b>我的答案：</b><br>${m.myAnswer}</div>`:''}
      <div style="background:var(--green-l);border-radius:8px;padding:10px;margin-bottom:10px"><b>正确答案：</b><br>${m.correct||'未记录'}</div>
      ${m.analysis?`<div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:10px"><b>解析：</b><br>${m.analysis}</div>`:''}
      <div style="font-size:12px;color:var(--muted)">已复习${m.reviewCount||0}次，下次复习：${m.nextReview||'今天'}</div>
    `,{okText:'✅ 已掌握，更新复习',onOk:ov=>{
      m.reviewCount=(m.reviewCount||0)+1;
      m.nextReview=nextReviewDate(todayStr(),m.reviewCount);
      autoSave(); m2.close(); filterMistakes(); App.renderSidebar(); toast(`已更新复习，下次复习：${m.nextReview}`);
    }});
  }

  function delMistake(id){DB.confirm('删除此错题？',()=>{const d=data();d.mistakes=d.mistakes.filter(x=>x.id!==id);autoSave();filterMistakes();App.renderSidebar();toast('已删除');});}

  // 历年真题
  function renderPastPapers(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📄 历年真题档案库 <button class="btn btn-primary btn-sm" onclick="M3.addPaper()">添加试卷</button></div>
        ${d.pastPapers.length?d.pastPapers.map(p=>`<div style="border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div><span style="font-weight:600">${p.year}年</span> <span class="tag" style="margin-left:6px">${p.subject}</span></div>
            <div><button class="btn-icon" onclick="M3.viewPaper(${p.id})">👁</button><button class="btn-icon" onclick="M3.delPaper(${p.id})">🗑</button></div>
          </div>
          ${p.questions?`<div style="font-size:12px;color:var(--muted);margin-top:4px">${p.questions.length}题 · ${p.note||''}</div>`:''}
        </div>`).join(''):`<div class="empty"><div class="ico">📄</div>暂无真题，点击右上角添加</div>`}
      </div>
    `;
  }

  function addPaper(){
    const m=modal('添加真题',`
      <div class="form-row"><label>年份</label><input type="number" id="p-year" placeholder="如：2025" value="2025"></div>
      <div class="form-row"><label>学科</label><select id="p-subject">${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
      <div class="form-row"><label>备注</label><input type="text" id="p-note" placeholder="如：英语一/数学二"></div>
    `,{okText:'添加',onOk:ov=>{
      const year=ov.querySelector('#p-year').value;
      if(!year){toast('请输入年份');return;}
      data().pastPapers.push({id:DB.nextId(),year,subject:ov.querySelector('#p-subject').value,note:ov.querySelector('#p-note').value,questions:[]});
      autoSave(); m.close(); renderTab(); toast('真题已添加');
    }});
  }
  function viewPaper(id){
    const d=data(); const p=d.pastPapers.find(x=>x.id===id);if(!p)return;
    const el=document.getElementById('practice-content');
    if(!el) return;
    renderPaperEditor(el, p);
  }

  // 真题试卷编辑器：录入整套试卷多道题目
  function renderPaperEditor(el, p){
    const totalScore=p.questions.reduce((s,q)=>s+(q.score||0),0);
    el.innerHTML=`
      <div class="card" style="margin-bottom:16px">
        <div class="card-title">📄 ${p.year}年 ${p.subject} 真题试卷
          <button class="btn btn-ghost btn-sm" onclick="M3.switch('pastpapers')">← 返回列表</button>
          <button class="btn btn-primary btn-sm" onclick="M3.addQuestion(${p.id})">+ 录入题目</button>
        </div>
        <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${p.note||'无备注'} ｜ 共 ${p.questions.length} 题，合计 ${totalScore} 分</div>
        ${p.questions.length?`<div style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
          ${p.questions.map((q,qi)=>`<div style="padding:10px 12px;border-bottom:1px solid var(--border);display:flex;gap:10px">
            <div style="flex:1;min-width:0">
              <div style="font-size:13px"><b>第${qi+1}题</b> <span class="tag">${q.type||'题'}</span> ${q.score?`<span class="tag tag-mid">${q.score}分</span>`:''}</div>
              <div style="font-size:13px;margin-top:3px">${q.stem||''}</div>
              ${q.answer?`<div style="font-size:12px;color:var(--green);margin-top:3px"><b>答案：</b>${q.answer}</div>`:''}
              ${q.analysis?`<div style="font-size:12px;color:var(--muted);margin-top:2px"><b>解析：</b>${q.analysis}</div>`:''}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <button class="btn-icon" onclick="M3.editQuestion(${p.id},${qi})">📝</button>
              <button class="btn-icon" onclick="M3.delQuestion(${p.id},${qi})">🗑</button>
            </div>
          </div>`).join('')}
        </div>`:`<div class="empty"><div class="ico">📄</div>还没有录入题目，点右上角"录入题目"</div>`}
      </div>
    `;
  }

  function questionForm(q){
    return `<div class="form-row"><label>题型</label><select id="q-type"><option ${q.type==='选择题'?'selected':''}>选择题</option><option ${q.type==='填空题'?'selected':''}>填空题</option><option ${q.type==='计算题'?'selected':''}>计算题</option><option ${q.type==='简答题'?'selected':''}>简答题</option><option ${q.type==='论述题'?'selected':''}>论述题</option><option ${q.type==='其他'?'selected':''}>其他</option></select></div>
      <div class="form-row"><label>分值</label><input type="number" id="q-score" value="${q.score||0}" min="0"></div>
      <div class="form-row"><label>题干</label><textarea id="q-stem" placeholder="输入题目内容">${q.stem||''}</textarea></div>
      <div class="form-row"><label>答案</label><textarea id="q-answer" placeholder="输入标准答案">${q.answer||''}</textarea></div>
      <div class="form-row"><label>解析</label><textarea id="q-analysis" placeholder="输入解析">${q.analysis||''}</textarea></div>`;
  }
  function addQuestion(pid){
    const p=data().pastPapers.find(x=>x.id===pid);if(!p)return;
    const m=modal('录入题目',questionForm({}),{okText:'添加',onOk:ov=>{
      const stem=ov.querySelector('#q-stem').value.trim();if(!stem){toast('请输入题干');return;}
      p.questions.push({type:ov.querySelector('#q-type').value,score:parseInt(ov.querySelector('#q-score').value)||0,stem,answer:ov.querySelector('#q-answer').value,analysis:ov.querySelector('#q-analysis').value});
      autoSave();m.close();viewPaper(pid);App.renderSidebar();toast('题目已录入');
    }});
  }
  function editQuestion(pid,qi){
    const p=data().pastPapers.find(x=>x.id===pid);if(!p)return;const q=p.questions[qi];
    const m=modal('编辑题目',questionForm(q),{okText:'保存',onOk:ov=>{
      q.type=ov.querySelector('#q-type').value;q.score=parseInt(ov.querySelector('#q-score').value)||0;
      q.stem=ov.querySelector('#q-stem').value;q.answer=ov.querySelector('#q-answer').value;q.analysis=ov.querySelector('#q-analysis').value;
      autoSave();m.close();viewPaper(pid);toast('已保存');
    }});
  }
  function delQuestion(pid,qi){DB.confirm('删除该题？',()=>{const p=data().pastPapers.find(x=>x.id===pid);if(p)p.questions.splice(qi,1);autoSave();viewPaper(pid);toast('已删除');});}
  function delPaper(id){DB.confirm('删除此真题？',()=>{const d=data();d.pastPapers=d.pastPapers.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  // 模考训练
  let mockTimer=null;
  function renderMock(el){
    const d=data();
    el.innerHTML=`
      <div class="grid grid-2" style="margin-bottom:16px">
        <div class="card">
          <div class="card-title">⏱️ 模考计时器</div>
          <div class="pomodoro">
            <div class="pomodoro-mode" id="mock-mode">未开始</div>
            <div class="pomodoro-time" id="mock-time">03:00:00</div>
            <div class="pomodoro-controls">
              <div class="form-row" style="flex-direction:row;align-items:center;gap:8px;justify-content:center;margin:0">
                <label style="margin:0">时长(分)</label>
                <input type="number" id="mock-dur" value="180" min="1" style="width:80px" ${mockTimer?'disabled':''}>
              </div>
            </div>
            <div class="pomodoro-controls" style="margin-top:8px">
              ${mockTimer?'<button class="btn btn-danger" onclick="M3.stopMock()">⏹ 停止</button>':'<button class="btn btn-primary" onclick="M3.startMock()">▶ 开始模考</button>'}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-title">📝 模考成绩存档 <button class="btn btn-primary btn-sm" onclick="M3.addMockScore()">添加成绩</button></div>
          ${d.mockExams.length?d.mockExams.map(m=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">
            <div style="display:flex;justify-content:space-between"><span style="font-weight:600">📅 ${fmtDate(m.date)}</span>
              <span class="tag">总分：${Object.values(m.scores||{}).reduce((a,b)=>a+(b||0),0)}</span></div>
            <div style="font-size:12px;color:var(--muted);margin-top:4px">${Object.entries(m.scores||{}).map(([k,v])=>`${k}:${v}`).join(' / ')}</div>
            <button class="btn-icon" onclick="M3.delMock(${m.id})">🗑</button>
          </div>`).join(''):`<div class="empty"><div class="ico">📝</div>暂无模考成绩</div>`}
        </div>
      </div>
    `;
  }

  function startMock(){
    const dur=parseInt(document.getElementById('mock-dur').value)||180;
    const totalSec=dur*60;
    let remain=totalSec;
    const modeEl=document.getElementById('mock-mode');
    const timeEl=document.getElementById('mock-time');
    modeEl.textContent='模考中';
    mockTimer=setInterval(()=>{
      remain--;
      if(remain<=0){
        clearInterval(mockTimer);mockTimer=null;
        modeEl.textContent='已结束';
        timeEl.textContent='00:00:00';
        toast('模考时间结束！');
        return;
      }
      const h=Math.floor(remain/3600);
      const mm=Math.floor((remain%3600)/60);
      const ss=remain%60;
      timeEl.textContent=`${String(h).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
    },1000);
    toast('模考开始！');
  }

  function stopMock(){
    if(mockTimer){clearInterval(mockTimer);mockTimer=null;}
    renderTab(); toast('模考已停止');
  }

  function addMockScore(){
    const m=modal('添加模考成绩',`
      <div class="form-row"><label>日期</label><input type="date" id="ms-date" value="${todayStr()}"></div>
      <div class="form-row"><label>政治</label><input type="number" id="ms-politics" min="0" max="100" value="0"></div>
      <div class="form-row"><label>英语</label><input type="number" id="ms-english" min="0" max="100" value="0"></div>
      <div class="form-row"><label>数学</label><input type="number" id="ms-math" min="0" max="150" value="0"></div>
      <div class="form-row"><label>专业课一</label><input type="number" id="ms-major1" min="0" max="150" value="0"></div>
      <div class="form-row"><label>专业课二</label><input type="number" id="ms-major2" min="0" max="150" value="0"></div>
    `,{okText:'保存',onOk:ov=>{
      data().mockExams.push({id:DB.nextId(),date:ov.querySelector('#ms-date').value,scores:{
        politics:parseInt(ov.querySelector('#ms-politics').value)||0,
        english:parseInt(ov.querySelector('#ms-english').value)||0,
        math:parseInt(ov.querySelector('#ms-math').value)||0,
        major1:parseInt(ov.querySelector('#ms-major1').value)||0,
        major2:parseInt(ov.querySelector('#ms-major2').value)||0
      }});
      autoSave(); m.close(); renderTab(); App.renderSidebar(); toast('模考成绩已保存');
    }});
  }
  function delMock(id){DB.confirm('删除此成绩？',()=>{const d=data();d.mockExams=d.mockExams.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  // 分数趋势
  function renderScores(el){
    const d=data();
    const exams=d.mockExams.sort((a,b)=>a.date.localeCompare(b.date));
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📈 模考分数趋势</div>
        ${exams.length>=2?`<div id="score-chart" style="height:300px"></div>
        <div style="margin-top:16px"><table class="table"><thead><tr><th>日期</th><th>政治</th><th>英语</th><th>数学</th><th>专业课一</th><th>专业课二</th><th>总分</th></tr></thead>
        <tbody>${exams.map(e=>`<tr><td>${fmtDate(e.date)}</td><td>${e.scores.politics||0}</td><td>${e.scores.english||0}</td><td>${e.scores.math||0}</td><td>${e.scores.major1||0}</td><td>${e.scores.major2||0}</td><td style="font-weight:600">${Object.values(e.scores).reduce((a,b)=>a+b,0)}</td></tr>`).join('')}</tbody>
        </table></div>`:`<div class="empty"><div class="ico">📈</div>至少需要2次模考成绩才能生成趋势图</div>`}
      </div>
    `;
    if(exams.length>=2) drawScoreChart(exams);
  }

  function drawScoreChart(exams){
    const el=document.getElementById('score-chart');
    if(!el) return;
    const subjects=[['politics','政治','#ff5a6a'],['english','英语','#18b6d6'],['math','数学','#22b07d'],['major1','专业课一','#8b5cf6'],['major2','专业课二','#d63384']];
    const labels=exams.map(e=>fmtDate(e.date));
    const W=600,H=250,padT=12,padB=22,plotH=H-padT-padB;
    const n=exams.length;
    const xAt=i=> n===1?W/2:(i*(W/(n-1)));
    // 单科量程 0~150
    const subjMax=150;
    const ySubj=v=>padT+plotH-(Math.max(0,Math.min(v,subjMax))/subjMax)*plotH;
    // 总分量程 0~500
    const totMax=500;
    const yTot=v=>padT+plotH-(Math.max(0,Math.min(v,totMax))/totMax)*plotH;
    const totalLine=exams.map((e,i)=>`${xAt(i)},${yTot(Object.values(e.scores).reduce((a,b)=>a+b,0))}`).join(' ');
    const totalArea=`${xAt(0)},${padT+plotH} ${totalLine} ${xAt(n-1)},${padT+plotH}`;
    const legend=subjects.concat([['total','总分(0-500)','#4f6ef7']]).map(s=>`<span style="display:inline-flex;align-items:center;gap:5px;font-size:11.5px;margin-right:12px;color:var(--muted)"><span style="width:14px;height:4px;border-radius:3px;background:${s[2]};display:inline-block"></span>${s[1]}</span>`).join('');
    el.innerHTML=`<div style="position:relative;height:100%">
      <svg width="100%" height="100%" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="overflow:visible">
        <defs><linearGradient id="totGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4f6ef7" stop-opacity="0.22"/><stop offset="100%" stop-color="#4f6ef7" stop-opacity="0"/></linearGradient></defs>
        ${[0,0.25,0.5,0.75,1].map(p=>`<line x1="0" y1="${padT+plotH-p*plotH}" x2="${W}" y2="${padT+plotH-p*plotH}" stroke="#eef1f8" stroke-width="1"/>`).join('')}
        <polygon points="${totalArea}" fill="url(#totGrad)"/>
        ${subjects.map(([k,name,color])=>{
          const pts=exams.map((e,i)=>`${xAt(i)},${ySubj(e.scores[k]||0)}`).join(' ');
          return `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`+
            exams.map((e,i)=>`<circle cx="${xAt(i)}" cy="${ySubj(e.scores[k]||0)}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`).join('');
        }).join('')}
        <polyline points="${totalLine}" fill="none" stroke="#4f6ef7" stroke-width="3" stroke-linejoin="round" stroke-dasharray="6 4"/>
        ${exams.map((e,i)=>`<circle cx="${xAt(i)}" cy="${yTot(Object.values(e.scores).reduce((a,b)=>a+b,0))}" r="5" fill="#4f6ef7" stroke="#fff" stroke-width="2"/>`).join('')}
        ${labels.map((l,i)=>`<text x="${xAt(i)}" y="${H-6}" font-size="11" fill="#8a93a6" text-anchor="middle">${l}</text>`).join('')}
      </svg>
      <div style="margin-top:8px;display:flex;flex-wrap:wrap">${legend}</div>
    </div>`;
  }

  // 专项训练
  function renderTraining(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">💪 专项题型训练台账 <button class="btn btn-primary btn-sm" onclick="M3.addTraining()">添加</button></div>
        ${d.topicTraining.length?d.topicTraining.map(t=>{const pct=t.total?Math.round(t.done/t.total*100):0;return `<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between"><div><span style="font-weight:600">${t.type}</span> <span class="tag" style="margin-left:6px">${t.subject}</span></div><button class="btn-icon" onclick="M3.delTraining(${t.id})">🗑</button></div>
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px"><div class="progress" style="flex:1"><div class="progress-bar" style="width:${pct}%"></div></div><span style="font-size:12px">${t.done}/${t.total}</span><button class="btn btn-sm btn-ghost" onclick="M3.incTraining(${t.id})">+1</button></div>
        </div>`;}).join(''):`<div class="empty"><div class="ico">💪</div>暂无专项训练记录</div>`}
      </div>
    `;
  }
  function addTraining(){
    const m=modal('添加专项训练',`<div class="form-row"><label>学科</label><select id="tr-subject">${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div><div class="form-row"><label>题型</label><select id="tr-type">${TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div><div class="form-row"><label>目标题数</label><input type="number" id="tr-total" value="100" min="1"></div><div class="form-row"><label>已完成</label><input type="number" id="tr-done" value="0" min="0"></div>`,{okText:'添加',onOk:ov=>{data().topicTraining.push({id:DB.nextId(),subject:ov.querySelector('#tr-subject').value,type:ov.querySelector('#tr-type').value,total:parseInt(ov.querySelector('#tr-total').value)||0,done:parseInt(ov.querySelector('#tr-done').value)||0});autoSave();m.close();renderTab();toast('已添加');}});
  }
  function incTraining(id){const t=data().topicTraining.find(x=>x.id===id);if(t){t.done++;autoSave();renderTab();}}
  function delTraining(id){DB.confirm('删除？',()=>{const d=data();d.topicTraining=d.topicTraining.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  // 答题模板
  function renderTemplates(el){
    const d=data();
    el.innerHTML=`
      <div class="card">
        <div class="card-title">📋 主观题答题模板库 <button class="btn btn-primary btn-sm" onclick="M3.addTemplate()">添加模板</button></div>
        ${d.answerTemplates.length?d.answerTemplates.map(t=>`<div style="border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:6px">
          <div style="display:flex;justify-content:space-between"><div><span class="tag">${t.subject}</span> <span class="tag tag-mid">${t.type}</span> <b style="margin-left:6px">${t.title}</b></div><div><button class="btn-icon" onclick="M3.delTemplate(${t.id})">🗑</button></div></div>
          <div style="font-size:12px;color:var(--muted);margin-top:6px;white-space:pre-wrap;background:var(--bg);border-radius:6px;padding:8px">${t.content}</div>
        </div>`).join(''):`<div class="empty"><div class="ico">📋</div>暂无答题模板</div>`}
      </div>
    `;
  }
  function addTemplate(){
    const m=modal('添加答题模板',`<div class="form-row"><label>学科</label><select id="tp-subject">${SUBJECTS.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div><div class="form-row"><label>题型</label><select id="tp-type">${TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}</select></div><div class="form-row"><label>模板标题</label><input type="text" id="tp-title" placeholder="如：马原大题答题框架"></div><div class="form-row"><label>模板内容</label><textarea id="tp-content" style="min-height:120px" placeholder="输入答题框架/范式..."></textarea></div>`,{okText:'添加',onOk:ov=>{const title=ov.querySelector('#tp-title').value.trim();if(!title){toast('请输入标题');return;}data().answerTemplates.push({id:DB.nextId(),subject:ov.querySelector('#tp-subject').value,type:ov.querySelector('#tp-type').value,title,content:ov.querySelector('#tp-content').value});autoSave();m.close();renderTab();toast('已添加');}});
  }
  function delTemplate(id){DB.confirm('删除？',()=>{const d=data();d.answerTemplates=d.answerTemplates.filter(x=>x.id!==id);autoSave();renderTab();toast('已删除');});}

  function switchTab(tab){curTab=tab;App.renderContent();}
  w.M3={switch:switchTab,filterMistakes,addMistake,editMistake,reviewMistake,delMistake,addPaper,viewPaper,delPaper,renderPaperEditor,addQuestion,editQuestion,delQuestion,startMock,stopMock,addMockScore,delMock,addTraining,incTraining,delTraining,addTemplate,delTemplate};

})(window);
