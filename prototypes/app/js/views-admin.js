let studentSearch = '';
let studentFilter = 'All';
let assignSearch = '';
let assignUnassignedOnly = false;
let showAddCourse = false;
let courseSearch = '';
let courseProgram = 'All';
let confirmDeleteCourse = null;
let openMenuId = null;
let confirmDeleteRule = null;
let showAddWindow = false;
let aiEnabled = null;
let aiQuota = null;
let aiDirty = false;
let staffTab = 'All';
let staffSearch = '';
let confirmDeleteStaff = null;

function adminRefocus(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus();
  try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) {}
}

function adminCap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function adminBindingChip(b) {
  const tone = b === 'bound' ? 'success' : b === 'pending' ? 'warning' : 'destructive';
  return `<span class="chip ${tone}">${adminCap(b)}</span>`;
}

function adminAssignCell(u) {
  if (u.assigned) return UI.esc(u.advisor || 'Amr Advisor');
  return `<span style="color:var(--destructive);">Unassigned</span> <button class="btn outline sm" onclick="Store.assignStudent(${u.id}, 'Amr Advisor'); Store.toast('Assigned to Amr Advisor.');">Assign</button>`;
}

function adminTaskCard(href, label, num, extra) {
  return `<a class="card col gap-1" href="${href}" style="color:inherit; text-decoration:none;">
    <span class="eyebrow">${label}</span>
    ${num === null ? '' : `<span class="num" style="font-size:26px; font-weight:700;">${num}</span>`}
    ${extra || ''}</a>`;
}

function adminTaskGrid(full) {
  const a = Store.s.admin;
  return `<div class="grid-3">
    ${adminTaskCard('#/admin/students', 'Students', a.students.length)}
    ${adminTaskCard('#/admin/assignments', 'Assignments', a.students.length, `<span class="xs" style="color:var(--destructive);">${a.unassigned} unassigned</span>`)}
    ${adminTaskCard('#/admin/courses', 'Courses', a.totalCourses)}
    ${adminTaskCard('#/admin/programs', 'Programs', a.programs.length)}
    ${adminTaskCard('#/admin/rules', 'Rules', a.rules.length)}
    ${full ? adminTaskCard('#/admin/windows', 'Windows', a.windows.length) : ''}
    ${adminTaskCard('#/admin/ai', 'AI Configuration', null, `<span class="chip info num">Quota ${a.ai.quota}/day</span>`)}
    ${full ? adminTaskCard('#/admin/staff', 'Staff', a.staff.length) : ''}
    ${adminTaskCard('#/admin/notifications', 'Notifications', null, '<span class="chip success">Configured</span>')}
  </div>`;
}

function adminCreateCourse() {
  const code = document.getElementById('nc-code').value.trim();
  if (!code) { Store.toast('A course needs a code.', 'destructive'); return; }
  Store.addCourseAdmin({
    code,
    title: document.getElementById('nc-title').value.trim() || code,
    credits: parseInt(document.getElementById('nc-credits').value, 10) || 3,
    program: document.getElementById('nc-program').value,
    updated: 'just now',
  });
  showAddCourse = false;
  Store.toast('Course ' + code + ' created.');
}

function adminCreateWindow() {
  const term = document.getElementById('nw-term').value.trim();
  if (!term) { Store.toast('A window needs a term.', 'destructive'); return; }
  const opens = document.getElementById('nw-opens').value.trim() || '—';
  const closes = document.getElementById('nw-closes').value.trim() || '—';
  Store.addWindow(term, opens, closes);
  showAddWindow = false;
  Store.toast('Window ' + term + ' created. Activate it when the SIS opens.');
}

function adminAttention() {
  const a = Store.s.admin;
  return `
    <div class="card col gap-2" style="border-color:var(--warning-border); background:var(--warning-bg);">
      <h2>Needs attention</h2>
      ${a.pendingBindings ? `<div class="row between sm"><span><b class="num">${a.pendingBindings}</b> students pending SIS binding</span><a href="#/admin/students">Open users</a></div>` : ''}
      ${a.unassigned ? `<div class="row between sm"><span><b class="num">${a.unassigned}</b> unassigned students</span><a href="#/admin/assignments">Open assignments</a></div>` : ''}
      ${!a.pendingBindings && !a.unassigned ? '<p class="sm">Nothing waits on you right now.</p>' : ''}
    </div>`;
}

App.views['/admin'] = function () {
  App.titles['/admin'] = ['Overview'];
  const a = Store.s.admin;
  const w = a.windows[0];
  const attention = adminAttention();
  return `
    ${UI.pageHead('Overview', 'The operational state of the machine')}
    ${attention}
    ${w ? `<div class="card col gap-1" style="margin-top:12px;">
      <div class="row between"><h2>Registration window</h2>${w.active ? '<span class="chip success">Active</span>' : '<span class="chip neutral">Inactive</span>'}</div>
      <p class="sm num"><b>${UI.esc(w.term)}</b> closes in 11 days</p>
      <a class="sm" href="#/admin/windows">Open windows</a>
    </div>` : ''}
    <div class="col gap-3" style="margin-top:12px;">${adminTaskGrid(false)}</div>`;
};

App.views['/admin/students'] = function () {
  App.titles['/admin/students'] = ['Overview', 'Students'];
  const q = studentSearch.trim().toLowerCase();
  let list = Store.s.admin.students.filter((u) => !q || u.name.toLowerCase().includes(q));
  if (studentFilter === 'Bound') list = list.filter((u) => u.binding === 'bound');
  if (studentFilter === 'Pending') list = list.filter((u) => u.binding === 'pending');
  if (studentFilter === 'Failed') list = list.filter((u) => u.binding === 'failed');
  if (studentFilter === 'Assigned') list = list.filter((u) => u.assigned);
  if (studentFilter === 'Unassigned') list = list.filter((u) => !u.assigned);
  const rows = list.map((u) => {
    const key = 'stu-' + u.id;
    const menu = openMenuId === key ? `
      <div class="popover menu" style="position:static; margin-top:6px;">
        <button onclick="openMenuId=null; Store.toast('Correct student ID ships with the real binding flow.', 'info')">Correct student ID</button>
        ${u.status === 'active'
          ? `<button onclick="openMenuId=null; Store.setUserStatus(${u.id}, 'suspended')">Suspend</button>`
          : `<button onclick="openMenuId=null; Store.setUserStatus(${u.id}, 'active')">Reactivate</button>`}
        <button onclick="openMenuId=null; Store.toast('Reset link sent (simulated).')">Reset password</button>
      </div>` : '';
    return `<tr>
      <td><a href="#" onclick="openMenuId = openMenuId === '${key}' ? null : '${key}'; App.render(); return false;">${UI.esc(u.name)}</a></td>
      <td>${adminBindingChip(u.binding)}</td>
      <td>${u.status === 'active' ? '<span class="chip success">Active</span>' : '<span class="chip neutral">Suspended</span>'}</td>
      <td>${adminAssignCell(u)}</td>
      <td class="num"><button class="btn ghost sm" onclick="openMenuId = openMenuId === '${key}' ? null : '${key}'; App.render();">⋯</button>${menu}</td>
    </tr>`;
  }).join('');
  return `
    ${UI.pageHead('Students', 'Accounts, binding, and assignment',
      `<button class="btn primary" onclick="Store.toast('Add-student ships with the real binding flow.', 'info')">Add student</button>`)}
    <div class="row gap-2 wrap" style="margin:4px 0 8px;">
      <input class="input" id="stu-search" style="max-width:260px;" placeholder="Search by name" value="${UI.esc(studentSearch)}" oninput="studentSearch=this.value; App.render(); adminRefocus('stu-search')" />
      <select class="input" style="width:auto;" onchange="studentFilter=this.value; App.render();">
        ${['All', 'Bound', 'Pending', 'Failed', 'Assigned', 'Unassigned'].map((o) => `<option ${studentFilter === o ? 'selected' : ''}>${o}</option>`).join('')}
      </select>
      <span class="sm muted num">${list.length} students</span>
    </div>
    ${UI.tableWrap(['Name', 'Student binding', 'Status', 'Advisor', ''], rows)}`;
};

App.views['/admin/assignments'] = function () {
  App.titles['/admin/assignments'] = ['Overview', 'Assignments'];
  const q = assignSearch.trim().toLowerCase();
  let list = Store.s.admin.students.filter((u) => !q || u.name.toLowerCase().includes(q));
  if (assignUnassignedOnly) list = list.filter((u) => !u.assigned);
  const r = Store.s.importResult;
  const report = r ? `
    <div class="card col gap-2" style="margin-bottom:12px;">
      <div class="row between wrap gap-2"><h2>Import report — assignments-v3.csv</h2>
        <div class="row gap-2">
          <span class="chip success num">Matched ${r.matched}</span>
          <span class="chip info num">Bound ${r.bound}</span>
          <span class="chip destructive num">Failed ${r.failed.length}</span>
        </div></div>
      ${UI.tableWrap(['Student ID', 'Why it failed'], r.failed.map((f) => `<tr><td class="num">${UI.esc(f.id)}</td><td>${UI.esc(f.why)}</td></tr>`).join(''))}
      <div class="row gap-2">
        <button class="btn primary" onclick="Store.commitImport(); Store.toast('${r.bound} assignments committed.')">Commit ${r.bound} assignments</button>
        <button class="btn outline" onclick="Store.s.importResult=null; App.render();">Discard</button>
      </div>
    </div>` : '';
  const rows = list.map((u) => `<tr>
    <td>${UI.esc(u.name)}</td>
    <td>${adminBindingChip(u.binding)}</td>
    <td>${adminAssignCell(u)}</td>
    <td>${UI.esc((Store.user(u.id) || {}).faculty || '—')}</td>
  </tr>`).join('');
  return `
    ${UI.pageHead('Assignments', 'Who advises whom',
      `<button class="btn outline" onclick="Store.runImport()">Import CSV</button>`)}
    ${report}
    <div class="row gap-2 wrap" style="margin:4px 0 8px;">
      <input class="input" id="asg-search" style="max-width:260px;" placeholder="Search by name" value="${UI.esc(assignSearch)}" oninput="assignSearch=this.value; App.render(); adminRefocus('asg-search')" />
      <label class="row gap-1 sm"><input type="checkbox" ${assignUnassignedOnly ? 'checked' : ''} onchange="assignUnassignedOnly=this.checked; App.render();" /> Unassigned only</label>
      <span class="sm muted num">${list.length} students</span>
    </div>
    ${UI.tableWrap(['Student', 'Binding', 'Advisor', 'Faculty'], rows)}`;
};

App.views['/admin/courses'] = function () {
  App.titles['/admin/courses'] = ['Overview', 'Courses'];
  const a = Store.s.admin;
  const q = courseSearch.trim().toLowerCase();
  let list = a.courses.filter((c) => !q || c.code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q));
  if (courseProgram !== 'All') list = list.filter((c) => c.program === courseProgram);
  const programs = [...new Set(a.courses.map((c) => c.program))];
  const addCard = showAddCourse ? `
    <div class="card col gap-2" style="margin-bottom:12px;">
      <h2>New course</h2>
      <div class="row gap-2 wrap">
        <input class="input" id="nc-code" style="max-width:150px;" placeholder="Code · CS 402" />
        <input class="input" id="nc-title" style="max-width:280px;" placeholder="Title" />
        <input class="input" id="nc-credits" type="number" min="0" style="max-width:100px;" value="3" />
        <select class="input" id="nc-program" style="width:auto;">${programs.map((p) => `<option>${UI.esc(p)}</option>`).join('')}</select>
      </div>
      <div class="row gap-2">
        <button class="btn primary" onclick="adminCreateCourse()">Create</button>
        <button class="btn outline" onclick="showAddCourse=false; App.render();">Cancel</button>
      </div>
    </div>` : '';
  const rows = list.map((c) => {
    const key = 'crs-' + c.code;
    const menu = openMenuId === key ? `
      <div class="popover menu" style="position:static; margin-top:6px;">
        <button onclick="openMenuId=null; Store.toast('Edit dialog ships with implementation.', 'info')">Edit</button>
        <button class="danger" onclick="openMenuId=null; confirmDeleteCourse='${c.code}'; App.render();">Delete</button>
      </div>` : '';
    return `<tr>
      <td><code>${UI.esc(c.code)}</code></td>
      <td>${UI.esc(c.title)}</td>
      <td class="num">${c.credits}</td>
      <td>${UI.esc(c.program)}</td>
      <td class="num">${UI.esc(c.updated)}</td>
      <td class="num"><button class="btn ghost sm" onclick="openMenuId = openMenuId === '${key}' ? null : '${key}'; App.render();">⋯</button>${menu}</td>
    </tr>`;
  }).join('');
  const modal = confirmDeleteCourse ? UI.modal(`
    <div class="card col gap-3" style="max-width:480px; margin:10vh auto;">
      <h2>Delete ${UI.esc(confirmDeleteCourse)}?</h2>
      <ul class="sm" style="margin:0; padding-inline-start:18px; display:grid; gap:6px;">
        ${Store.courseImpact(confirmDeleteCourse).map((l) => `<li>${l}</li>`).join('')}
      </ul>
      <p class="sm muted">This cannot be undone.</p>
      <div class="row gap-2" style="justify-content:flex-end;">
        <button class="btn outline" onclick="confirmDeleteCourse=null; App.render();">Cancel</button>
        <button class="btn destructive" onclick="const c=confirmDeleteCourse; confirmDeleteCourse=null; Store.deleteCourse(c); Store.toast('Course deleted.');">Delete course</button>
      </div>
    </div>`) : '';
  return `
    ${UI.pageHead('Courses', 'Metadata the rules and plans read',
      `<button class="btn primary" onclick="showAddCourse=true; App.render();">Add course</button>`)}
    ${addCard}
    <div class="row gap-2 wrap" style="margin:4px 0 8px;">
      <input class="input" id="crs-search" style="max-width:260px;" placeholder="Search code or title" value="${UI.esc(courseSearch)}" oninput="courseSearch=this.value; App.render(); adminRefocus('crs-search')" />
      <select class="input" style="width:auto;" onchange="courseProgram=this.value; App.render();">
        <option ${courseProgram === 'All' ? 'selected' : ''}>All</option>
        ${programs.map((p) => `<option ${courseProgram === p ? 'selected' : ''}>${UI.esc(p)}</option>`).join('')}
      </select>
      <span class="sm muted num">${list.length} of ${a.totalCourses} courses</span>
    </div>
    ${UI.tableWrap(['Code', 'Title', { label: 'Credits', right: true }, 'Program', { label: 'Updated', right: true }, ''], rows)}
    <div class="row between sm" style="margin-top:10px;">
      <span class="muted num">Showing 1–${list.length} of ${a.totalCourses}</span>
      <div class="row gap-2">
        <button class="btn outline sm" disabled>Previous</button>
        <button class="btn outline sm" onclick="Store.toast('Page 2 ships with the real API.', 'info')">Next</button>
      </div>
    </div>
    ${modal}`;
};

App.views['/admin/programs'] = function () {
  App.titles['/admin/programs'] = ['Overview', 'Programs'];
  const rows = Store.s.admin.programs.map((p) => {
    const key = 'prg-' + p.code;
    const menu = openMenuId === key ? `
      <div class="popover menu" style="position:static; margin-top:6px;">
        <button onclick="openMenuId=null; Store.toast('Edit dialog ships with implementation.', 'info')">Edit</button>
      </div>` : '';
    return `<tr>
      <td><code>${UI.esc(p.code)}</code></td>
      <td>${UI.esc(p.title)}</td>
      <td class="num">${p.courses}</td>
      <td class="num"><button class="btn ghost sm" onclick="openMenuId = openMenuId === '${key}' ? null : '${key}'; App.render();">⋯</button>${menu}</td>
    </tr>`;
  }).join('');
  return `
    ${UI.pageHead('Programs', 'Degree shells the plans and rules hang from')}
    ${UI.tableWrap(['Code', 'Title', { label: 'Courses', right: true }, ''], rows)}
    <p class="xs muted" style="margin-top:8px;">Delete becomes available when no course references the program.</p>`;
};

App.views['/admin/rules'] = function () {
  App.titles['/admin/rules'] = ['Overview', 'Rules'];
  const a = Store.s.admin;
  const rows = a.rules.map((r) => {
    const key = 'rls-' + r.title;
    const menu = openMenuId === key ? `
      <div class="popover menu" style="position:static; margin-top:6px;">
        <button onclick="openMenuId=null; Store.toast('Edit dialog ships with implementation.', 'info')">Edit</button>
        <button class="danger" onclick="openMenuId=null; confirmDeleteRule='${r.title}'; App.render();">Delete</button>
      </div>` : '';
    return `<tr>
      <td style="white-space:nowrap;">${UI.esc(r.title)}</td>
      <td class="sm">${UI.esc(r.body)}</td>
      <td class="num">${r.updated || '—'}</td>
      <td class="num"><button class="btn ghost sm" onclick="openMenuId = openMenuId === '${key}' ? null : '${key}'; App.render();">⋯</button>${menu}</td>
    </tr>`;
  }).join('');
  const modal = confirmDeleteRule ? UI.modal(`
    <div class="card col gap-3" style="max-width:480px; margin:10vh auto;">
      <h2>Delete ${UI.esc(confirmDeleteRule)}?</h2>
      <ul class="sm" style="margin:0; padding-inline-start:18px;"><li>Used by the AI explain capability</li></ul>
      <p class="sm muted">This cannot be undone.</p>
      <div class="row gap-2" style="justify-content:flex-end;">
        <button class="btn outline" onclick="confirmDeleteRule=null; App.render();">Cancel</button>
        <button class="btn destructive" onclick="const t=confirmDeleteRule; confirmDeleteRule=null; Store.s.admin.rules = Store.s.admin.rules.filter((x) => x.title !== t); App.render(); Store.toast('Rule deleted.');">Delete rule</button>
      </div>
    </div>`) : '';
  return `
    ${UI.pageHead('Rules', 'Texts the AI quotes; thresholds live here too',
      `<button class="btn primary" onclick="Store.toast('Rule authoring ships with implementation.', 'info')">Add rule</button>`)}
    ${UI.tableWrap(['Title', 'Body', { label: 'Updated', right: true }, ''], rows)}
    <div class="card col gap-2" style="margin-top:12px; max-width:440px;">
      <h2>Queue aging threshold</h2>
      <div>
        <label class="label" for="aging-days">Days before a plan counts as aging</label>
        <input class="input" id="aging-days" type="number" min="0" value="${a.agingDays}" style="max-width:120px;" />
      </div>
      <button class="btn primary" style="align-self:flex-start;" onclick="Store.saveAging(parseInt(document.getElementById('aging-days').value, 10) || 0); Store.toast('Aging threshold saved.');">Save</button>
    </div>
    ${modal}`;
};

App.views['/admin/windows'] = function () {
  App.titles['/admin/windows'] = ['Overview', 'Registration Windows'];
  const addCard = showAddWindow ? `
    <div class="card col gap-2" style="margin:4px 0 12px;">
      <h2>New window</h2>
      <div class="row gap-2 wrap">
        <input class="input" id="nw-term" style="max-width:130px;" placeholder="Term · 2027S" />
        <input class="input" id="nw-opens" style="max-width:180px;" placeholder="Opens · 01 Feb 2027" />
        <input class="input" id="nw-closes" style="max-width:180px;" placeholder="Closes · 15 Feb 2027" />
      </div>
      <div class="row gap-2">
        <button class="btn primary" onclick="adminCreateWindow()">Create</button>
        <button class="btn outline" onclick="showAddWindow=false; App.render();">Cancel</button>
      </div>
    </div>` : '';
  const rows = Store.s.admin.windows.map((w) => `<tr>
    <td><b>${UI.esc(w.term)}</b></td>
    <td class="num">${UI.esc(w.opens)}</td>
    <td class="num">${UI.esc(w.closes)}</td>
    <td>${w.active ? '<span class="chip success">Active</span>' : '<span class="chip neutral">Inactive</span>'}</td>
    <td class="num">${w.active
      ? `<button class="btn outline sm" onclick="Store.toggleWindow('${w.term}'); Store.toast('Registration closed for ${w.term}.');">Deactivate</button>`
      : `<button class="btn outline sm" onclick="Store.toggleWindow('${w.term}'); Store.toast('Registration opened for ${w.term}.');">Activate</button>`}</td>
  </tr>`).join('');
  return `
    ${UI.pageHead('Registration Windows', 'The academic clock plans submit inside',
      `<button class="btn primary" onclick="showAddWindow=!showAddWindow; App.render();">Add window</button>`)}
    ${addCard}
    ${UI.banner('info', `SIS mirror as of ${Store.s.asOf}`, 'Dates come from the SIS; activation is yours.')}
    <div style="margin-top:12px;">${UI.tableWrap(['Term', { label: 'Opens', right: true }, { label: 'Closes', right: true }, 'State', ''], rows)}</div>
    <p class="hint">Deactivating confirms first: students can no longer submit plans for the term.</p>`;
};

App.views['/admin/ai'] = function () {
  App.titles['/admin/ai'] = ['Overview', 'AI Configuration'];
  if (aiEnabled === null) { aiEnabled = Store.s.admin.ai.enabled; aiQuota = Store.s.admin.ai.quota; }
  const blocked = aiQuota === 0 && aiEnabled;
  return `
    ${UI.pageHead('AI Configuration', 'What students can ask, and how much')}
    ${blocked ? UI.banner('warning', 'Quota is 0: new conversations are blocked even though availability is on.', 'Both switches must allow; the quota is checked first.') : ''}
    <div class="grid-2" style="margin-top:4px;">
      <div class="card col gap-2">
        <h2>Availability</h2>
        <div class="row gap-2" style="align-items:flex-start;">
          <span role="checkbox" aria-checked="${aiEnabled}" tabindex="0" onclick="aiEnabled=!aiEnabled; aiDirty=true; App.render();" style="flex:none; width:18px; height:18px; margin-top:2px; border:1px solid var(--border); border-radius:4px; display:inline-grid; place-items:center; cursor:pointer; background:${aiEnabled ? 'var(--crimson-700)' : 'var(--card)'}; color:#fff; font-size:12px; font-weight:700;">${aiEnabled ? '✓' : ''}</span>
          <span class="sm">Students can start new conversations</span>
        </div>
        <p class="hint">Quota 0 also blocks new conversations; both must allow for a conversation to start.</p>
      </div>
      <div class="card col gap-2">
        <h2>Daily quota</h2>
        <div>
          <label class="label" for="ai-quota">Conversations per student per day</label>
          <input class="input" id="ai-quota" type="number" min="0" value="${aiQuota}" style="max-width:120px;" oninput="aiQuota=parseInt(this.value,10)||0; aiDirty=true; document.getElementById('ai-save').disabled=false;" />
        </div>
        <p class="hint">Zero disables new conversations.</p>
      </div>
    </div>
    <div class="row gap-2" style="margin-top:12px; align-items:center;">
      <button class="btn primary" id="ai-save" ${aiDirty ? '' : 'disabled'} onclick="Store.saveAI(aiQuota, aiEnabled); aiDirty=false; Store.toast('AI configuration saved.');">Save changes</button>
      ${aiDirty ? '' : '<span class="chip success">Saved · just now</span>'}
    </div>`;
};

App.views['/admin/staff'] = function () {
  App.titles['/admin/staff'] = ['Overview', 'Staff'];
  const q = staffSearch.trim().toLowerCase();
  const list = Store.s.admin.staff.filter((s) => (staffTab === 'All' || s.role === staffTab) && (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)));
  const tabs = ['All', 'Advisor', 'Dean', 'Vice President', 'Administrator'];
  const rows = list.map((s) => {
    const key = 'stf-' + s.email;
    const menu = openMenuId === key ? `
      <div class="popover menu" style="position:static; margin-top:6px;">
        <button onclick="openMenuId=null; Store.toast('Reset link sent (simulated).')">Reset password</button>
        <button class="danger" onclick="openMenuId=null; confirmDeleteStaff='${s.email}'; App.render();">Delete</button>
      </div>` : '';
    return `<tr>
      <td>${UI.esc(s.name)}</td>
      <td><span class="chip info">${UI.esc(s.role)}</span></td>
      <td class="sm">${UI.esc(s.email)}</td>
      <td class="num"><button class="btn ghost sm" onclick="openMenuId = openMenuId === '${key}' ? null : '${key}'; App.render();">⋯</button>${menu}</td>
    </tr>`;
  }).join('');
  const victim = Store.s.admin.staff.find((x) => x.email === confirmDeleteStaff);
  const selfDelete = victim && victim.name === Store.me().name;
  const modal = victim ? UI.modal(`
    <div class="card col gap-3" style="max-width:480px; margin:10vh auto;">
      ${selfDelete
        ? UI.banner('destructive', 'You cannot delete your own account.', 'Ask another administrator to do it.')
        : `<h2>Delete ${UI.esc(victim.name)}?</h2>
           <ul class="sm" style="margin:0; padding-inline-start:18px; display:grid; gap:6px;"><li>Advisor of 0 students</li><li>Sign-in revoked immediately</li></ul>
           <p class="sm muted">This cannot be undone.</p>`}
      <div class="row gap-2" style="justify-content:flex-end;">
        <button class="btn outline" onclick="confirmDeleteStaff=null; App.render();">Cancel</button>
        ${selfDelete ? '' : `<button class="btn destructive" onclick="const e=confirmDeleteStaff; confirmDeleteStaff=null; Store.s.admin.staff = Store.s.admin.staff.filter((x) => x.email !== e); App.render(); Store.toast('Staff account deleted.');">Delete staff</button>`}
      </div>
    </div>`) : '';
  return `
    ${UI.pageHead('Staff', 'The people behind the advising system')}
    <div class="row gap-2 wrap" style="margin:4px 0 8px;">
      <div class="tabs">${tabs.map((t) => `<button class="tab ${staffTab === t ? 'active' : ''}" onclick="staffTab='${t}'; App.render();">${t}</button>`).join('')}</div>
      <input class="input" id="stf-search" style="max-width:260px;" placeholder="Search name or email" value="${UI.esc(staffSearch)}" oninput="staffSearch=this.value; App.render(); adminRefocus('stf-search')" />
    </div>
    ${UI.tableWrap(['Name', 'Role', 'Email', ''], rows)}
    ${modal}`;
};

App.views['/admin/notifications'] = function () {
  App.titles['/admin/notifications'] = ['Overview', 'Notifications'];
  const items = Store.notifsFor();
  return `
    ${UI.pageHead('Notifications', 'Everything that needs you, in one list',
      `<button class="btn outline sm" onclick="Store.markAllRead()">Mark all as read</button>`)}
    <div class="card col" style="padding:0; overflow:hidden;">
      ${items.map((n) => `
        <div class="notif ${n.read ? '' : 'unread'}">
          ${n.read ? '<span style="width:7px; flex:none;"></span>' : '<span class="unread-dot"></span>'}
          <span class="n-icon" style="background:var(--muted);">${n.icon}</span>
          <div class="col gap-1" style="flex:1;">
            <span class="n-title">${UI.esc(n.title)}</span>
            <span class="n-body">${UI.esc(n.body)}</span>
            ${n.action ? `<div class="row gap-2" style="margin-top:4px;"><a class="btn outline sm" href="${n.action.route}" onclick="Store.markRead(${n.id})">${n.action.label}</a></div>` : ''}
          </div>
          <span class="n-time">${n.time}</span>
        </div>`).join('')}
    </div>`;
};

App.views['/admin/operations'] = function () {
  App.titles['/admin/operations'] = ['Overview', 'Operations'];
  return `
    ${UI.pageHead('Operations', 'Every operational task, one landing')}
    ${adminAttention()}
    ${adminTaskGrid(true)}
    <p class="xs muted" style="margin-top:8px;">This landing exists per design.md section 4.5; the old not-found route is gone.</p>`;
};
