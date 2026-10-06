const dayWord = (n) => `${n} day${n === 1 ? '' : 's'}`;

/* Advisor full replica — advisor views (queue, review, return, caseload, meetings, hours). */

let queueSort = 'aging';
let queueFilter = 'all';
let caseloadSearch = '';
let caseloadFilter = 'all';
let hoursSavedAt = '';

function stateChip(status) {
  return UI.chip(status === 'under_review' ? 'review' : status);
}

function needsActionCard(m, kind) {
  const stu = Store.user(m.studentId);
  const slots = kind === 'awaiting'
    ? (m.slots || []).map((s) => s.booked
      ? `<label class="chip destructive">⊘ ${s.label}${s.why ? ` · ${UI.esc(s.why)}` : ''}</label>`
      : `<label class="chip neutral" style="cursor:pointer;"><input type="radio" name="slot-${m.id}" value="${s.label}" /> ${s.label}</label>`).join('')
    : Store.s.advisorSlots.filter((s) => s.free).map((s) => `<label class="chip neutral" style="cursor:pointer;"><input type="radio" name="slot-${m.id}" value="${s.label}" /> ${s.label}</label>`).join('');
  return `
    <div class="card col gap-2">
      <div class="row between wrap gap-2">
        <div class="row gap-2 wrap"><h3>${UI.esc(stu ? stu.name : 'Student')}</h3>${UI.chip(m.status)}</div>
        <span class="xs muted">reason: ${m.reason ? m.reason.replace(/_/g, ' ') : '—'}</span>
      </div>
      ${kind === 'awaiting' && m.note ? `<p class="sm muted">“${UI.esc(m.note)}”</p>` : ''}
      <div class="row wrap gap-2">${slots}</div>
      <div class="row gap-2 wrap">
        <button class="btn primary sm" onclick="const el=document.querySelector('input[name=\\'slot-${m.id}\\']:checked'); if(el){Store.confirmMeetingSlot(${m.id}, el.value); Store.toast('Meeting confirmed.');} else Store.toast('Pick a free time first.', 'destructive')">Confirm time</button>
        ${kind === 'requested' ? `<button class="btn outline sm" onclick="Store.proposeTime(${m.id}, 'Mon 13 Oct · 11:00'); Store.toast('Proposed Mon 13 Oct · 11:00 to the student.')">Propose another</button>` : ''}
        <button class="btn ghost sm" onclick="Store.toast('Delayed — student is asked for new times (simulated).', 'info')">Delay</button>
        <button class="btn ghost sm" onclick="Store.declineMeeting(${m.id})">Decline</button>
      </div>
    </div>`;
}

App.views['/advisor'] = function () {
  App.titles['/advisor'] = ['Queue'];
  const rows = Object.entries(Store.s.plans)
    .map(([id, plan]) => ({ id: Number(id), user: Store.user(Number(id)), plan }))
    .filter((r) => r.user && ['submitted', 'under_review'].includes(r.plan.status));
  const counts = {
    all: rows.length,
    submitted: rows.filter((r) => r.plan.status === 'submitted').length,
    review: rows.filter((r) => r.plan.status === 'under_review').length,
    returned: rows.filter((r) => r.plan.status === 'returned').length,
    aging: rows.filter((r) => r.plan.aging).length,
  };
  const tabs = [
    ['all', 'All', counts.all], ['submitted', 'Submitted', counts.submitted], ['review', 'Under review', counts.review],
    ['returned', 'Returned', counts.returned], ['aging', 'Aging', counts.aging],
  ];
  const sorted = [...rows].sort((a, b) => {
    if (queueSort === 'newest') return a.plan.waitingDays - b.plan.waitingDays;
    if (queueSort === 'oldest') return b.plan.waitingDays - a.plan.waitingDays;
    if (queueSort === 'updated') return 0;
    return (b.plan.aging - a.plan.aging) || (b.plan.waitingDays - a.plan.waitingDays);
  });
  const shown = sorted.filter((r) => {
    if (queueFilter === 'all') return true;
    if (queueFilter === 'aging') return !!r.plan.aging;
    if (queueFilter === 'review') return r.plan.status === 'under_review';
    return r.plan.status === queueFilter;
  });
  const agingRows = rows.filter((r) => r.plan.aging);
  const next = agingRows[0];
  const summary = next
    ? `<p class="sm muted">Next up: ${UI.esc(next.user.name)}, waiting ${dayWord(next.plan.waitingDays)}</p>`
    : `<p class="sm muted">No plan is aging. The queue sits inside the threshold.</p>`;
  return `
    ${UI.pageHead('Queue', 'Plans waiting on your decision',
      `<label class="row gap-2 sm muted" style="white-space:nowrap;">Sort
        <select class="input" style="width:auto; height:36px;" onchange="queueSort=this.value; App.render();">
          <option value="aging"${queueSort === 'aging' ? ' selected' : ''}>Aging first</option>
          <option value="newest"${queueSort === 'newest' ? ' selected' : ''}>Newest</option>
          <option value="updated"${queueSort === 'updated' ? ' selected' : ''}>Last updated</option>
          <option value="oldest"${queueSort === 'oldest' ? ' selected' : ''}>Oldest first</option>
        </select>
      </label>`)}
    <div class="row between wrap gap-2">
      <div class="tabs">
        ${tabs.map(([key, label, count]) => `<button class="tab ${queueFilter === key ? 'active' : ''}" onclick="queueFilter='${key}'; App.render();">${label} <span class="count">(${count})</span></button>`).join('')}
      </div>
      ${summary}
    </div>
    ${shown.length ? (Store.theme() === 'v5' ? `
    <div class="col gap-2">
      ${shown.map((r) => `
      <div class="rail-row" tabindex="0">
        <div class="col"><span class="sm" style="font-weight:600;">${UI.esc(r.user.name)}</span><span class="xs muted num">${r.user.studentId || '—'}</span></div>
        <div>${stateChip(r.plan.status)}</div>
        <div class="col"><span class="xs muted">Signal</span><span class="sm">${r.plan.note ? `“${UI.esc(r.plan.note)}”` : 'Awaiting first decision'}</span></div>
        <div class="col"><span class="xs muted">Urgency</span><span class="sm num" ${r.plan.aging ? 'style="color:var(--warning); font-weight:600;"' : ''}>${dayWord(r.plan.waitingDays)}${r.plan.aging ? ' · aging' : ''}</span></div>
        <div class="col gap-1" style="align-items:flex-end;">
          <button class="btn primary sm" onclick="App.reviewStudent = ${r.id}; App.go('#/advisor/review')">Review</button>
          <span class="xs muted">Approve and Return live in review</span>
        </div>
      </div>`).join('')}
    </div>` : UI.tableWrap(
      ['Student', 'State', { label: 'Waiting', right: true }, { label: 'Last update', right: true }, 'Note', ''],
      shown.map((r, i) => `
        <tr${i === 0 ? ' class="pinned"' : ''} tabindex="0">
          <td><b>${UI.esc(r.user.name)}</b><div class="xs muted num">${r.user.studentId || '—'}</div></td>
          <td>${stateChip(r.plan.status)}</td>
          <td class="num">${r.plan.aging ? `<b style="color:var(--warning);">${dayWord(r.plan.waitingDays)}</b> <span class="chip warning sm" style="margin-inline-start:4px;">Aging</span>` : `${dayWord(r.plan.waitingDays)}`}</td>
          <td class="num sm muted">${r.plan.lastUpdate || '—'}</td>
          <td class="sm muted">${r.plan.note ? `“${UI.esc(r.plan.note)}”` : '—'}</td>
          <td class="num"><span class="row-actions">
            <button class="btn outline sm" onclick="App.reviewStudent = ${r.id}; App.go('#/advisor/review')">Review</button>
            <button class="btn primary sm" onclick="Store.approvePlan(${r.id}); Store.toast('Plan approved.')">Approve</button>
            <button class="btn ghost sm" onclick="App.returnTarget = ${r.id}; App.go('#/advisor/return')">Return</button>
          </span></td>
        </tr>`).join(''),
    )) : UI.empty('Queue is clear', 'No plan matches this filter. New submissions land here the moment a student sends them.',
      `<button class="btn outline sm" onclick="queueFilter='all'; App.render();">Show all</button>`)}`;
};

App.views['/advisor/review'] = function () {
  const target = App.reviewStudent || 6;
  const user = Store.user(target);
  const plan = Store.s.plans[target];
  App.titles['/advisor/review'] = ['Queue', 'Review', user ? user.name : 'Student'];
  if (!user || !plan) return UI.empty('No plan to review', 'Open the queue and pick a student row first.', `<a class="btn outline" href="#/">Back to queue</a>`);
  const errors = Store.validatePlan(plan);
  const comments = plan.comments || [];
  const stuMeetings = Store.s.meetings.filter((m) => m.studentId === target);
  return `
    ${UI.pageHead(user.name, `Term ${plan.term} · plan review`,
      `${stateChip(plan.status)} <a class="btn outline" href="#/">Back to queue</a>`)}
    ${plan.returnReason ? `
    <div class="card col gap-2" style="border-inline-start:3px solid var(--state-returned-border);">
      <div class="row between wrap gap-2"><h2>Return reason</h2>${plan.seen ? '<span class="chip success">Seen</span>' : '<span class="chip warning">Not seen yet</span>'}</div>
      <p>“${UI.esc(plan.returnReason)}”</p>
      <p class="sm muted">Returned ${plan.returnAt || 'earlier'}</p>
    </div>` : ''}
    <div class="grid-2">
      <div class="card col gap-1">
        <span class="eyebrow">Academic summary</span>
        <p class="sm">CGPA <b class="num">${user.cgpa}</b> · ${UI.esc(user.faculty || 'Faculty n/a')}</p>
        <p class="sm"><b class="num">${plan.courses.length}</b> courses · <b class="num">${Store.creditsOf(plan)}</b> credits planned</p>
      </div>
      <div class="card col gap-1">
        <span class="eyebrow">Waiting</span>
        <p class="sm">Submitted ${plan.submittedAt || '—'} · <b class="num">${dayWord(plan.waitingDays || 0)}</b> in the queue${plan.aging ? ' · <b style="color:var(--warning);">aging</b>' : ''}</p>
        <p class="sm muted">Last update ${plan.lastUpdate || '—'}</p>
      </div>
    </div>
    <div class="card col gap-2">
      <div class="row between wrap gap-2"><h2>Validation</h2><span class="sm muted">Runs live against the university rules</span></div>
      ${errors.length
        ? UI.banner('destructive', `${errors.length} check${errors.length > 1 ? 's' : ''} fail`,
          `<span class="col gap-1" style="display:inline-flex;">${errors.map((e) => `<span>· ${UI.esc(e.msg)}</span>`).join('')}</span>`)
        : UI.banner('success', 'All checks pass', 'Credit load, prerequisites, repeats, and program rules are satisfied.')}
    </div>
    ${plan.note ? UI.banner('warning', 'Student note', `“${UI.esc(plan.note)}”`) : ''}
    ${UI.tableWrap(
      ['Course', 'Title', { label: 'Credits', right: true }, 'Group', 'Section'],
      plan.courses.map((c) => {
        const cat = Store.courseOf(c.code);
        const flagged = errors.find((e) => e.line === c.code);
        return `<tr style="${flagged ? 'background:var(--destructive-bg);' : ''}">
          <td><code>${c.code}</code></td>
          <td>${cat ? cat.title : 'Unknown'} ${flagged ? `<span class="xs" style="color:var(--destructive);">· ${UI.esc(flagged.msg)}</span>` : ''}</td>
          <td class="num">${cat ? cat.credits : '—'}</td>
          <td>${c.group}</td><td>${c.section}</td>
        </tr>`;
      }).join(''),
    )}
    <div class="card col gap-2">
      <h2>Meetings with ${UI.esc(user.name.split(' ')[0])}</h2>
      ${stuMeetings.length ? stuMeetings.map((m) => `
        <div class="row between wrap gap-2 sm">
          <span class="row gap-2">${UI.chip(m.status)}
            ${m.at ? `<span class="num">${m.at}</span>` : `<span class="muted">No time yet · ${m.reason ? m.reason.replace(/_/g, ' ') : 'request'}</span>`}</span>
          ${m.where ? `<span class="muted">${m.where}</span>` : ''}
        </div>`).join('') : '<p class="sm muted">No meetings with this student.</p>'}
      <a class="sm" href="#/advisor/meetings">Open Meetings</a>
    </div>
    <div class="card col gap-2">
      <h2>Comments</h2>
      ${comments.length ? comments.map((c) => `
        <div class="row gap-2" style="align-items:flex-start;">
          <span class="avatar">${UI.esc(c.author.split(' ').map((w) => w[0]).join(''))}</span>
          <div class="col gap-1 card" style="padding:12px 14px; flex:1;"><p class="sm">${UI.esc(c.body)}</p><span class="xs muted">${UI.esc(c.author)} · ${c.at}</span></div>
        </div>`).join('') : '<p class="sm muted">No comments yet. Write the first one below.</p>'}
      <div class="row gap-2">
        <input class="input" id="review-comment" placeholder="Write to the student" onkeydown="if(event.key==='Enter'){document.getElementById('review-send').click();}" />
        <button class="btn primary sm" id="review-send" onclick="const i=document.getElementById('review-comment'); const v=i.value.trim(); if(!v) return; const p=Store.s.plans[${target}]; const before=(p.comments || []).length; Store.addComment(v); if((p.comments || []).length === before) (p.comments = p.comments || []).push({ author: 'Amr Advisor', body: v, at: 'just now' }); i.value=''; App.render();">Send</button>
      </div>
      <p class="hint">Comments reach the student on their plan page.</p>
    </div>
    <div class="card col gap-2">
      <h2>Decision</h2>
      <p class="sm muted">One primary per decision. Approval locks the plan and notifies the student.</p>
      <div class="row gap-2 wrap">
        <button class="btn primary" onclick="Store.approvePlan(${target}); Store.toast('Plan approved.'); App.go('#/')">Approve</button>
        <button class="btn outline" onclick="App.returnTarget = ${target}; App.go('#/advisor/return')">Return plan</button>
        <button class="btn outline" onclick="App.go('#/advisor/meetings')">Request meeting</button>
      </div>
    </div>`;
};

App.views['/advisor/return'] = function () {
  const target = App.returnTarget || 6;
  const user = Store.user(target);
  App.titles['/advisor/return'] = ['Queue', 'Return plan'];
  return `
    ${UI.pageHead('Return plan', user ? `${UI.esc(user.name)} · the plan goes back to the student` : 'The plan goes back to the student')}
    <div class="card col gap-2" style="max-width:560px;">
      <label class="label" for="return-reason">Return reason</label>
      <textarea class="input" id="return-reason" rows="4" style="height:auto; padding:10px 12px; resize:vertical;" oninput="document.getElementById('return-go').disabled = !this.value.trim()"></textarea>
      <p class="hint">The reason goes to the student. They press Seen before they can edit and resubmit.</p>
      <div class="row gap-2">
        <button class="btn primary" id="return-go" disabled onclick="const v=document.getElementById('return-reason').value.trim(); if(v){Store.returnPlan(App.returnTarget, v); Store.toast('Plan returned with your reason.'); App.go('#/');}">Return plan</button>
        <a class="btn outline" href="#/">Cancel</a>
      </div>
    </div>`;
};

App.views['/advisor/students'] = function () {
  App.titles['/advisor/students'] = ['Students'];
  const q = caseloadSearch.trim().toLowerCase();
  const all = Store.s.users
    .filter((u) => u.role === 'student' && u.advisorId === Store.me().id)
    .map((u) => ({ u, plan: Store.s.plans[u.id] || null }));
  const counts = {
    all: all.length,
    meeting: all.filter((r) => r.u.hasUnmetMeeting).length,
    aging: all.filter((r) => r.plan && r.plan.aging).length,
  };
  const tabs = [['all', 'All', counts.all], ['meeting', 'Unmet meeting', counts.meeting], ['aging', 'Aging', counts.aging]];
  const shown = all.filter((r) => {
    const hit = !q || r.u.name.toLowerCase().includes(q) || String(r.u.studentId || r.u.email || '').toLowerCase().includes(q);
    if (!hit) return false;
    if (caseloadFilter === 'meeting') return !!r.u.hasUnmetMeeting;
    if (caseloadFilter === 'aging') return !!(r.plan && r.plan.aging);
    return true;
  });
  return `
    ${UI.pageHead('Students', 'Your caseload in one table')}
    <div class="row between wrap gap-2">
      <input class="input" id="caseload-search" style="max-width:280px;" placeholder="Search name or ID" value="${UI.esc(caseloadSearch)}"
        oninput="caseloadSearch=this.value; App.render(); const s=document.getElementById('caseload-search'); s.focus(); s.setSelectionRange(s.value.length, s.value.length);" />
      <div class="tabs">
        ${tabs.map(([key, label, count]) => `<button class="tab ${caseloadFilter === key ? 'active' : ''}" onclick="caseloadFilter='${key}'; App.render();">${label} <span class="count">(${count})</span></button>`).join('')}
      </div>
    </div>
    ${shown.length ? UI.tableWrap(
      ['Student', 'ID', 'Plan state', { label: 'Waiting', right: true }, { label: 'CGPA', right: true }, 'Meeting'],
      shown.map((r) => `
        <tr class="clickable" onclick="App.reviewStudent = ${r.u.id}; App.go('#/advisor/review')">
          <td><b>${UI.esc(r.u.name)}</b></td>
          <td class="xs muted num">${r.u.studentId || r.u.email || '—'}</td>
          <td>${r.plan ? stateChip(r.plan.status) : '<span class="chip neutral">No plan</span>'}</td>
          <td class="num">${r.plan && r.plan.waitingDays != null ? `${dayWord(r.plan.waitingDays)}` : '—'}</td>
          <td class="num">${r.u.cgpa != null ? r.u.cgpa : '—'}</td>
          <td>${r.u.hasUnmetMeeting ? '<span class="sm muted">Meeting due</span>' : ''}</td>
        </tr>`).join(''),
    ) : UI.empty('No students match', 'Adjust the search or the filter to see your caseload.',
      `<button class="btn outline sm" onclick="caseloadSearch=''; caseloadFilter='all'; App.render();">Clear filter</button>`)}`;
};

App.views['/advisor/meetings'] = function () {
  App.titles['/advisor/meetings'] = ['Meetings'];
  const meetings = Store.myMeetings();
  const today = meetings.filter((m) => m.status === 'confirmed');
  const needs = [...meetings.filter((m) => m.status === 'awaiting'), ...meetings.filter((m) => m.status === 'requested')];
  const past = meetings.filter((m) => ['completed', 'cancelled', 'declined'].includes(m.status));
  return `
    ${UI.pageHead('Meetings', 'Both directions, one list',
      `<button class="btn outline" onclick="Store.toast('Invites ship with the real flow (simulated).', 'info')">Invite student</button>`)}
    <div class="card col gap-3">
      <div class="row between wrap gap-2"><h2>Today · Sun 12 Oct</h2><span class="chip neutral num">${today.length} confirmed</span></div>
      <div class="col gap-2">
        ${today.length ? today.map((m) => {
          const stu = Store.user(m.studentId);
          return `<div class="row between wrap gap-2" style="border:1px solid var(--border); border-radius:var(--radius-sm); padding:10px 14px;">
            <span class="sm"><b>${UI.esc(stu ? stu.name : 'Student')}</b>${m.at ? ` · <span class="num">${m.at}</span>` : ''}${m.where ? ` · ${m.where}` : ''}</span>
            <button class="btn outline sm" onclick="Store.completeMeeting(${m.id}); Store.toast('Meeting marked completed.')">Mark completed</button>
          </div>`;
        }).join('') : '<p class="sm muted">Nothing confirmed for today.</p>'}
      </div>
    </div>
    <div class="col gap-3">
      <h2>Needs action <span class="muted num" style="font-weight:400;">(${needs.length})</span></h2>
      ${needs.length ? needs.map((m) => needsActionCard(m, m.status)).join('') : '<p class="sm muted">Nothing waits on you. Student requests appear here.</p>'}
    </div>
    ${past.length ? `
    <div class="card col gap-2">
      <h2>Past</h2>
      ${past.map((m) => {
        const stu = Store.user(m.studentId);
        return `<div class="row between sm"><span>${UI.esc(stu ? stu.name : 'Student')}${m.at ? ` · <span class="num">${m.at}</span>` : ''}</span><span class="chip neutral">${m.status}</span></div>`;
      }).join('')}
    </div>` : ''}`;
};

App.views['/advisor/hours'] = function () {
  App.titles['/advisor/hours'] = ['Office Hours'];
  const me = Store.me();
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hourRow = ([d, f, t]) => `<div class="row gap-2 wrap">
    <select class="input" style="width:130px;" aria-label="Day">${days.map((x) => `<option${x === d ? ' selected' : ''}>${x}</option>`).join('')}</select>
    <input class="input" type="time" style="width:110px;" value="${f}" aria-label="From" />
    <input class="input" type="time" style="width:110px;" value="${t}" aria-label="To" />
    <button class="btn ghost sm" type="button" onclick="Store.toast('Remove applies when you publish (simulated).', 'info')">Remove</button>
  </div>`;
  return `
    ${UI.pageHead('Office Hours', 'Availability and profile · where students find you, and when they can book')}
    <div class="banner warning" id="dirty-bar" style="display:none;">
      <span class="b-icon">!</span>
      <div class="row between" style="flex:1; gap:8px; flex-wrap:wrap;">
        <span class="b-title">You have unsaved changes</span>
        <div class="row gap-2">
          <button class="btn ghost sm" onclick="App.render()">Discard</button>
          <button class="btn primary sm" onclick="hoursSavedAt = 'just now'; Store.toast('Published. Students see these hours from tomorrow.');">Save now</button>
        </div>
      </div>
    </div>
    <div class="card col gap-2" style="max-width:560px;">
      <div class="row between wrap gap-2">
        <h2>Office location</h2>
        ${hoursSavedAt ? `<span class="chip success">Saved · ${hoursSavedAt}</span>` : ''}
      </div>
      <div>
        <label class="label" for="advisor-office">Office</label>
        <input class="input" id="advisor-office" value="${UI.esc(me.office || '')}" />
        <p class="hint">How students find you.</p>
      </div>
      <button class="btn outline sm" style="align-self:flex-start;" onclick="hoursSavedAt = 'just now'; Store.toast('Saved · just now');">Save</button>
    </div>
    <div class="card col gap-3">
      <div class="row between wrap gap-2"><h2>Weekly hours</h2><span class="chip neutral">30-minute slots</span></div>
      <form data-dirty="dirty-bar" oninput="document.getElementById('dirty-bar').style.display='flex'" onsubmit="return false;">
        <div class="col gap-2">
          ${me.hours.map(hourRow).join('')}
          <div class="row gap-2 wrap" style="background:var(--destructive-bg); border:1px solid var(--destructive-border); border-radius:var(--radius-sm); padding:8px;">
            <select class="input" style="width:130px; background:var(--card);" aria-label="Day"><option>Wednesday</option></select>
            <input class="input" type="time" style="width:110px; background:var(--card);" value="16:00" aria-label="From" />
            <input class="input" type="time" style="width:110px; background:var(--card);" value="14:00" aria-label="To" />
            <button class="btn ghost sm" type="button" onclick="Store.toast('Fix the row, then publish (simulated).', 'info')">Remove</button>
          </div>
          <p class="xs" style="color:var(--destructive);">End time must be after the start time.</p>
        </div>
      </form>
      ${UI.banner('info', 'Slot preview', 'Students can book 30-minute slots between 10:00 and 12:00. 2 slots already booked this week.')}
    </div>
    <div class="card col gap-2" style="max-width:560px;">
      <h2>Publish</h2>
      <div class="row wrap gap-2">
        <button class="btn primary" onclick="hoursSavedAt = 'just now'; Store.toast('Published. Students see these hours from tomorrow.');">Publish hours</button>
        <button class="btn outline" onclick="Store.toast('Confirm dialog: Clear hours? This prototype skips the dialog.', 'info')">Clear hours</button>
      </div>
      <p class="hint">Confirm dialog: Clear hours?</p>
    </div>`;
};

App.views['/advisor/profile'] = function () {
  App.titles['/advisor/profile'] = ['Profile'];
  return `
    <div class="card col gap-2" style="max-width:520px;">
      <h2>Profile</h2>
      <p class="sm muted">This page merged into Office Hours.</p>
      <a class="btn outline" style="align-self:flex-start;" href="#/advisor/hours">Open Office Hours</a>
    </div>`;
};

App.views['/advisor/notifications'] = function () {
  App.titles['/advisor/notifications'] = ['Notifications'];
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
