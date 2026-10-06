/* Advisor full replica — student views. */

let selectedCourse = 'CS 301';
let chatDraft = '';

function healthStrip() {
  const plan = Store.myPlan();
  const credits = Store.creditsOf(plan);
  const tone = credits < 12 || credits > 18 ? 'warning' : 'success';
  const editable = ['draft', 'returned'].includes(plan.status);
  let state = '';
  if (plan.validation) {
    state = plan.validation.length
      ? UI.banner('destructive', `${plan.validation.length} check${plan.validation.length > 1 ? 's' : ''} fail`, plan.validation.map((e) => e.msg).join(' '), '')
      : UI.banner('success', 'All checks pass', 'Credit load, prerequisites, repeats, and program rules are satisfied.', '');
  } else {
    state = UI.banner('info', plan.validatedAt ? `Validated ${plan.validatedAt}` : 'Not validated yet',
      'Validation runs the university checks. Run it now or at submit time.', '');
  }
  return `<div class="card col gap-3">
    <div class="row between wrap gap-2">
      <h2>Plan health</h2>
      <div class="row gap-2">
        ${editable ? `<button class="btn outline sm" onclick="Store.validateNow()">Validate plan</button>
        <button class="btn ${plan.validation && !plan.validation.length ? 'primary' : 'outline'} sm" onclick="const r = Store.submitPlan(); if (!r.ok) App.render();">Submit for review</button>` : ''}
      </div>
    </div>
    <div>
      <div class="row between sm" style="margin-bottom:6px;">
        <span class="muted">Planned load</span>
        <span class="num"><b>${credits}</b> of 12–18 credits · ${plan.courses.length} courses</span>
      </div>
      ${UI.meter(credits, 12, 18, tone)}
      ${credits < 12 ? `<p class="hint" style="color:var(--warning);">Add at least ${12 - credits} more credits to reach the minimum.</p>` : ''}
    </div>
    ${state}
  </div>`;
}

function planLines(editable) {
  const plan = Store.myPlan();
  return UI.tableWrap(
    ['Course', 'Title', { label: 'Credits', right: true }, 'Group', 'Section', ''],
    plan.courses.map((c) => {
      const cat = Store.courseOf(c.code);
      const flagged = (plan.validation || []).find((e) => e.line === c.code);
      return `<tr style="${flagged ? 'background:var(--destructive-bg);' : ''}">
        <td><code>${c.code}</code></td>
        <td>${cat.title} ${flagged ? `<span class="xs" style="color:var(--destructive);">· ${UI.esc(flagged.msg)}</span>` : ''}</td>
        <td class="num">${cat.credits}</td>
        <td>${c.group}</td><td>${c.section}</td>
        <td class="num">${editable ? `<button class="btn ghost sm" onclick="Store.removeCourse('${c.code}')">Remove</button>` : ''}</td>
      </tr>`;
    }).join(''),
  );
}

App.views['/app/plan'] = function () {
  App.titles['/app/plan'] = ['My Plan', 'Term 2026F'];
  const plan = Store.myPlan();
  const editable = ['draft', 'returned'].includes(plan.status);

  const returned = plan.status === 'returned' ? `
    ${UI.banner('warning', 'Your plan was returned. Read the reason, fix the plan, resubmit.', `Amr Advisor returned this plan on ${plan.returnAt}. Editing is open again.`)}
    <div class="card col gap-2" style="border-inline-start:3px solid var(--state-returned-border);">
      <div class="row between"><h2>Return reason</h2>
        ${plan.seen ? '<span class="chip success">Seen</span>' : `<button class="btn outline sm" onclick="Store.seenReturn()">Mark as seen</button>`}</div>
      <p>“${UI.esc(plan.returnReason)}”</p>
      <p class="sm muted">Amr Advisor · ${plan.returnAt}</p>
    </div>` : '';

  const approved = plan.status === 'approved' ? `
    ${UI.banner('success', 'Approved by Amr Advisor. Register these sections in the SIS, then mark each line done.', 'Approval locks the plan. The SIS is the ledger; the checklist only tracks your progress.')}
    <div class="card col gap-2">
      <div class="row between"><h2>Registration checklist</h2>
        <span class="sm muted num">${Store.s.checklist.filter((c) => c.done).length} of ${Store.s.checklist.length} registered</span></div>
      ${Store.s.checklist.map((c, i) => `<label class="row gap-2 sm"><input type="checkbox" ${c.done ? 'checked' : ''} onchange="Store.toggleRegistered(${i})" /> ${UI.esc(c.label)}</label>`).join('')}
      <p class="hint">If a section is full in the SIS, pick another section here and ask your advisor to re-approve.</p>
    </div>` : '';

  const comments = (plan.comments || []);
  return `
    ${UI.pageHead('My Plan', 'Term 2026F · one official plan per term',
      `<span class="chip ${plan.status === 'under_review' ? 'review' : plan.status}"><span class="dot"></span>${plan.status.replace('_', ' ')}</span>
       ${editable ? `<a class="btn primary" href="#/app/builder">Open in builder</a>` : ''}`)}
    ${returned}
    ${approved}
    ${healthStrip()}
    ${planLines(editable)}
    ${plan.status === 'approved' ? '' : `<p class="sm muted">Term total: <b class="num">${Store.creditsOf(plan)}</b> credits.</p>`}
    <div class="card col gap-2">
      <h2>Advisor comments</h2>
      ${comments.length ? comments.map((c) => `
        <div class="row gap-2" style="align-items:flex-start;">
          <span class="avatar">${c.author.split(' ').map((w) => w[0]).join('')}</span>
          <div class="col gap-1 card" style="padding:12px 14px; flex:1;"><p class="sm">${UI.esc(c.body)}</p><span class="xs muted">${c.author} · ${c.at}</span></div>
        </div>`).join('')
      : `<p class="sm muted">No comments yet. Your advisor writes here when reviewing your plan.</p>`}
      ${plan.status === 'returned' && comments.length ? '' : ''}
    </div>`;
};

App.views['/app/builder'] = function () {
  App.titles['/app/builder'] = ['My Plan', 'Builder', 'Term 2026F'];
  const plan = Store.myPlan();
  const pickable = Object.keys(Store.s.catalog).filter((code) => !plan.courses.some((c) => c.code === code));
  return `
    ${UI.pageHead('Plan Builder', 'Term 2026F · edits autosave', `<span class="chip ${plan.status === 'returned' ? 'returned' : 'draft'}"><span class="dot"></span>${plan.status}</span>
      <a class="btn outline" href="#/app/plan">Back to plan</a>`)}
    <div class="row gap-2 sm muted" id="save-state"><span class="chip success">Saved · just now</span> every edit saves itself</div>
    ${healthStrip()}
    <div class="card col gap-2">
      <h2>Add a course</h2>
      <div class="row gap-2 wrap">
        ${pickable.map((code) => {
          const cat = Store.courseOf(code);
          const missing = (cat.prereq || []).filter((pre) => !Store.s.completed.includes(pre) && !plan.courses.some((c) => c.code === pre));
          const repeat = cat.repeatOf && Store.s.completed.includes(cat.repeatOf);
          const blocked = missing.length || repeat;
          return `<button class="btn ${blocked ? 'ghost' : 'outline'} sm" ${blocked ? `title="${repeat ? `Repeats ${cat.repeatOf} — blocked by the repeat rule` : `Requires ${missing.join(', ')}`}"` : ''} onclick="${blocked
            ? `Store.toast(${JSON.stringify(repeat ? `Repeats ${cat.repeatOf} — blocked by the repeat rule` : `Requires ${missing.join(', ')}`)}, 'destructive')`
            : `Store.addCourse('${code}')`}">${code} · ${cat.credits} cr${blocked ? ' · blocked' : ''}</button>`;
        }).join('')}
      </div>
      <p class="hint">Blocked courses explain themselves: hover a blocked chip for the reason (W-05). Adding removes the block automatically once its prerequisite sits in the plan.</p>
    </div>
    ${planLines(true)}
    <p class="sm muted">Term total: <b class="num">${Store.creditsOf(plan)}</b> credits.</p>`;
};

App.views['/app'] = function () {
  App.titles['/app'] = ['Home', 'Term 2026F'];
  const me = Store.me();
  const plan = Store.myPlan();
  const credits = Store.creditsOf(plan);
  const advisor = Store.user(me.advisorId);
  const nextMeeting = Store.myMeetings().find((m) => m.status === 'confirmed');
  const strip = Store.s.firstRunDismissed ? '' : `
    <div class="card col gap-2">
      <div class="row between"><h2>Three steps to your first registration</h2>
        <a class="xs" href="#" onclick="Store.s.firstRunDismissed = true; App.render(); return false;">Don't show again</a></div>
      <div class="row gap-2 wrap sm">
        <span class="chip success">1 · Check your record — done</span>
        <span class="chip info">2 · Build your plan ${plan.status === 'returned' ? '— fix and resubmit' : ''} <a href="#/app/builder">Open the Plan Builder</a></span>
        <span class="chip neutral">3 · Submit for advisor review — unlocks after step 2</span>
      </div>
    </div>`;
  return `
    ${UI.pageHead('Home', 'Term 2026F')}
    ${strip}
    ${Store.theme() === 'v5' ? `
    <div class="card col gap-3">
      <div class="row between wrap gap-2">
        <div class="row gap-2 wrap sm">
          <span class="chip ${plan.status}"><span class="dot"></span>${plan.status.replace('_', ' ')}</span>
          <span class="muted num">CGPA ${me.cgpa} · ${me.creditsEarned} earned · ${me.creditsRemaining} remaining</span>
        </div>
        <div class="row gap-2">
          ${plan.status === 'returned' ? `<a class="btn primary sm" href="#/app/plan">Fix my plan</a>` : `<a class="btn primary sm" href="#/app/plan">Open my plan</a>`}
          <a class="btn outline sm" href="#/app/chat">Ask the AI advisor</a>
        </div>
      </div>
      <div class="col gap-1">
        <div class="row between xs muted"><span>Academic pulse — plan · load · degree</span><span class="num">40% of 156 courses</span></div>
        <div class="pulse">
          <span style="flex:1 1 0; background:var(--crimson-700);" title="plan state"></span>
          <span style="flex:${Math.max(1, Math.round(credits / 3))} 1 0; background:var(--warning);" title="credit load ${credits} of 18"></span>
          <span style="flex:4 1 0; background:var(--success);" title="degree progress 40%"></span>
        </div>
        <div class="row between xs muted num">
          <span>${plan.status === 'returned' ? 'Plan returned · fix and resubmit' : 'Plan ' + plan.status.replace('_', ' ')}</span>
          <span>${credits} of 12–18 credits</span>
          <span>${me.creditsEarned} earned</span>
        </div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card col gap-1">
        <span class="eyebrow">Next meeting</span>
        ${nextMeeting ? `<p class="sm num"><b>${nextMeeting.at}</b> · ${nextMeeting.where}</p><a class="sm" href="#/app/advisor">Details in My Advisor</a>` : '<p class="sm muted">Nothing scheduled.</p>'}
      </div>
      <div class="card col gap-1">
        <span class="eyebrow">Your advisor</span>
        <p class="sm"><b>${advisor.name}</b> · ${advisor.office}</p>
        <a class="sm" href="#/app/advisor">Hours, meetings, and requests</a>
      </div>
    </div>` : `
    <div class="card col gap-2">
      <div class="row between"><h2>Plan health</h2><a class="sm" href="#/app/plan">Open my plan</a></div>
      <div class="row gap-2 wrap sm">
        <span class="chip ${plan.status}"><span class="dot"></span>${plan.status.replace('_', ' ')}</span>
        <span class="muted num"><b>${credits}</b> of 12–18 credits planned</span>
        ${plan.status === 'returned' ? `<a class="btn primary sm" href="#/app/plan">Review the feedback</a>` : ''}
      </div>
    </div>
    <div class="grid-2">
      <div class="card col gap-1">
        <span class="eyebrow">Where you stand</span>
        <p class="sm">CGPA <b class="num">${me.cgpa}</b> · <b class="num">${me.creditsEarned}</b> credits earned · <b class="num">${me.creditsRemaining}</b> remaining</p>
        <a class="sm" href="#/app/record">Full detail in Academic Record</a>
      </div>
      <div class="card col gap-1">
        <span class="eyebrow">Your advisor</span>
        <p class="sm"><b>${advisor.name}</b> · ${advisor.office}</p>
        <a class="sm" href="#/app/advisor">Hours, meetings, and requests</a>
      </div>
    </div>`}
    ${nextMeeting ? `<div class="card col gap-1">
      <div class="row between"><h2>Next meeting</h2>${UI.chip('confirmed')}</div>
      <p class="sm num">${nextMeeting.at} · ${nextMeeting.where}</p>
      <a class="sm" href="#/app/advisor">Details in My Advisor</a></div>` : ''}`;
};

App.views['/app/record'] = function () {
  App.titles['/app/record'] = ['Academic Record'];
  const me = Store.me();
  const share = Math.round((62 / me.curriculumTotal) * 100);
  const done = Store.s.completed;
  const planned = Store.myPlan().courses.map((c) => c.code);
  const node = (code) => {
    const state = done.includes(code) ? ['success', 'Completed', ''] : planned.includes(code) ? ['warning', 'Planned', ''] : ['neutral', 'locked until prerequisites', ''];
    return `<button class="chip ${state[0]}" style="cursor:pointer; padding:8px 12px;" onclick="selectedCourse='${code}'; App.render();">${state[2] ? icon('ban', 'ic') : ''} ${code}</button>`;
  };
  return `
    ${UI.pageHead('Academic Record', 'The facts behind your decisions')}
    ${UI.banner('info', `SIS data as of ${Store.s.asOf}.`, 'The SIS is the ledger for grades and credits.', `<button class="btn outline sm" onclick="Store.toast('Refreshed.')">⟳ Refresh</button>`)}
    <div class="grid-3">
      ${UI.kpi('CGPA', me.cgpa, 'on a 4.0 scale', '', '', 'from the SIS')}
      ${UI.kpi('Credits earned', me.creditsEarned, 'of 156', '', '')}
      ${UI.kpi('Credits remaining', me.creditsRemaining, 'of 156', '', '')}
    </div>
    <div class="grid-2">
      <div class="card col gap-2" style="align-items:center;">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--muted)" stroke-width="10"/>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--success)" stroke-width="10"
            stroke-dasharray="${2 * Math.PI * 50 * 0.4} ${2 * Math.PI * 50}" stroke-linecap="round" transform="rotate(-90 60 60)"/>
          <text x="60" y="58" text-anchor="middle" font-size="20" font-weight="700" fill="var(--fg)">40%</text>
          <text x="60" y="76" text-anchor="middle" font-size="10" fill="var(--muted-fg)">62 of 156 courses</text>
        </svg>
        <span class="sm muted">Degree progress</span>
      </div>
      <div class="card col gap-2${Store.theme() === 'v5' ? ' cream-card' : ''}">
        <h2>Milestones</h2>
        <div class="col gap-2 sm">
          <span class="row gap-2"><span class="chip success">✓ First plan submitted</span></span>
          <span class="row gap-2"><span class="chip success">✓ Level cleared — 2021 level complete</span></span>
          <span class="row gap-2"><span class="chip warning">Get a plan approved — submit your 2026F plan for review</span></span>
          <span class="row gap-2"><span class="chip neutral">Halfway — 17 more courses to go</span></span>
        </div>
      </div>
    </div>
    <div class="card col gap-3">
      <div class="row between wrap"><h2>Your course map</h2>
        <div class="row gap-3 wrap">
          <span class="swatch"><i style="background:var(--success);"></i> Completed</span>
          <span class="swatch"><i style="background:var(--warning);"></i> Planned this term</span>
          <span class="swatch"><i style="background:var(--border);"></i> Locked until prerequisites</span>
        </div></div>
      <p class="sm muted">62 of 156 courses completed.</p>
      <div class="row gap-2 wrap">${['CS 101', 'MATH 101', 'CS 201', 'CS 301', 'EE 210', 'ME 215'].map(node).join('<span class="muted">→</span>')}</div>
      ${(() => {
        const c = Store.courseOf(selectedCourse);
        const doneC = done.includes(selectedCourse), plannedC = planned.includes(selectedCourse);
        return `<div class="card col gap-1" style="background:var(--muted); border:none;">
          <div class="row between"><h3><code>${selectedCourse}</code> · ${c.title}</h3>
            ${doneC ? UI.chip('approved') : plannedC ? UI.chip('warning') : UI.chip('neutral')}</div>
          <p class="sm muted">Prerequisites: ${c.prereq.length ? c.prereq.map((p) => `${p} ${done.includes(p) ? '✓' : '✗'}`).join(', ') : 'none'}</p>
          <p class="sm">${c.prereq.every((p) => done.includes(p) || planned.includes(p)) ? 'Unlocked. You can add it to a plan.' : 'Locked. Complete the prerequisites first — the builder explains the exact gap.'}</p>
        </div>`;
      })()}
    </div>`;
};

App.views['/app/advisor'] = function () {
  App.titles['/app/advisor'] = ['My Advisor'];
  const me = Store.me();
  const advisor = Store.user(me.advisorId);
  const meetings = Store.myMeetings();
  const upcoming = meetings.filter((m) => ['confirmed', 'awaiting', 'requested'].includes(m.status));
  const past = meetings.filter((m) => ['completed', 'cancelled', 'declined'].includes(m.status));
  return `
    ${UI.pageHead('My Advisor', 'Hours, meetings, and requests',
      `<button class="btn primary" onclick="document.getElementById('req-mtg').style.display='block'">Request a meeting</button>`)}
    <div class="card col gap-2">
      <h2>${advisor.name}</h2>
      <p class="sm muted">${advisor.title} · ${advisor.office}</p>
      <p class="sm">Office hours: ${advisor.hours.map(([d, f, t]) => `${d} ${f}–${t}`).join(' · ')} <span class="muted">(Africa/Cairo)</span></p>
      <p class="sm">Next open slot: <b>Mon 13 Oct, 11:00</b></p>
    </div>
    <div id="req-mtg" style="display:none;">${UI.modal(`
      <div class="card col gap-3" style="max-width:480px; margin:10vh auto;">
        <h2>Request a meeting</h2>
        <div><label class="label">Reason</label>
          <select class="input" id="mtg-reason"><option>plan_review</option><option>course_selection</option><option>academic_standing</option><option>degree_progress</option><option>other</option></select></div>
        <div><label class="label">Preferred time · optional</label>
          <div class="row gap-2 wrap">${Store.s.advisorSlots.filter((s) => s.free).map((s) => `<label class="chip neutral" style="cursor:pointer;"><input type="radio" name="slot" value="${s.label}" /> ${s.label}</label>`).join('')}</div>
          <p class="hint">Your advisor sees it as a hint.</p></div>
        <div><label class="label">Note · optional</label><input class="input" id="mtg-note" placeholder="What do you want to discuss?" /></div>
        <div class="row gap-2" style="justify-content:flex-end;">
          <button class="btn outline" onclick="document.getElementById('req-mtg').style.display='none'">Cancel</button>
          <button class="btn primary" onclick="Auth.uiRequestMeeting()">Send request</button>
        </div>
      </div>`)}</div>
    <div class="card col gap-2">
      <h2>Upcoming</h2>
      ${upcoming.length ? upcoming.map((m) => `
        <div class="card col gap-2" style="border:1px solid var(--border);">
          <div class="row between wrap">${UI.chip(m.status)}<span class="sm muted">${m.direction === 'advisor' ? 'Invited by your advisor' : 'Requested by you'} · reason: ${m.reason.replace(/_/g, ' ')}</span></div>
          ${m.status === 'confirmed' ? `<p class="sm num"><b>${m.at}</b> · ${m.where}</p>
            <div class="row gap-2"><button class="btn outline sm" onclick="Store.toast('Reschedule sends a new proposal (simulated).')">Reschedule</button>
            <button class="btn ghost sm" onclick="Store.cancelMeeting(${m.id}); Store.toast('Meeting cancelled.'); ">Cancel</button></div>` : ''}
          ${m.status === 'awaiting' ? `<p class="sm muted">Your advisor proposed a time.</p>
            <div class="row gap-2 wrap">${(m.slots || []).map((s) => `<label class="chip ${s.booked ? 'destructive' : 'neutral'}" style="cursor:${s.booked ? 'not-allowed' : 'pointer'};">${s.booked ? '⊘' : '<input type="radio" name="slot-' + m.id + '" value="' + s.label + '" />'} ${s.label}${s.booked ? ' · ' + s.why : ''}</label>`).join('')}</div>
            <div class="row gap-2"><button class="btn primary sm" onclick="const el=document.querySelector('input[name=\\'slot-${m.id}\\']:checked'); if(el){Store.acceptProposal(${m.id}); Store.toast('Meeting confirmed: '+el.value);} else Store.toast('Pick a free time first.', 'destructive')">Confirm time</button>
            <button class="btn ghost sm" onclick="Store.declineMeeting(${m.id})">Decline</button></div>` : ''}
          ${m.status === 'requested' ? `<p class="sm muted">Waiting for ${advisor.name} to confirm, propose, or decline.</p>
            <div class="row gap-2"><button class="btn ghost sm" onclick="Store.cancelMeeting(${m.id}); Store.toast('Request cancelled.')">Cancel request</button></div>` : ''}
        </div>`).join('')
      : UI.empty('No meetings yet', 'Meetings with your advisor appear here once they are scheduled.', `<button class="btn primary" onclick="document.getElementById('req-mtg').style.display='block'">Request a meeting</button>`)}
    </div>
    ${past.length ? `<div class="card col gap-2"><h2>Past</h2>
      ${past.map((m) => `<div class="row between sm"><span>${m.at || m.reason} · ${m.reason.replace(/_/g, ' ')}</span>${UI.chip(m.status)}</div>`).join('')}
    </div>` : ''}`;
};

App.views['/app/chat'] = function () {
  App.titles['/app/chat'] = ['AI Advisor'];
  const chat = Store.s.chat;
  const thread = chat.openId ? (chat.messages[chat.openId] || []) : [];
  const starters = ['What should I register next semester?', 'Can I take CS 402?', 'How many credits do I have left?', 'Explain why a course is blocked', 'Help me plan next semester', 'What should I discuss with my advisor?'];
  return `
    ${UI.pageHead('AI Advisor', 'Grounded in the university rules and your record. It assists; it never decides.')}
    <div class="card col" style="padding:0; overflow:hidden; min-height:520px;">
      <div style="display:grid; grid-template-columns:240px 1fr; min-height:520px;">
        <div style="border-inline-end:1px solid var(--border); padding:12px; display:flex; flex-direction:column; gap:6px;">
          <button class="btn outline sm" onclick="Store.chatNew()">+ New conversation</button>
          <div class="side-section">Recent</div>
          ${chat.conversations.map((c) => `
            <button class="btn ${chat.openId === c.id ? 'primary' : 'ghost'} sm" style="justify-content:flex-start; height:auto; padding:8px; text-align:start; display:block;" onclick="Store.chatOpen(${c.id})">
              <b>${c.title}</b><div class="xs" style="opacity:.8;">${c.snippet}</div><div class="xs">${c.at}</div>
            </button>`).join('')}
        </div>
        <div class="col" style="min-width:0;">
          <div class="col gap-3" style="flex:1; padding:20px; overflow:auto; max-height:420px;">
            ${thread.length === 0 ? `
              <p class="sm muted">Start with one of these, or type anything:</p>
              <div class="row gap-2 wrap">
                ${starters.map((s) => `<button class="btn outline sm" onclick="Store.chatAsk('${s}')">${s}</button>`).join('')}
              </div>` : thread.map((m) => m.role === 'user'
                ? `<div class="row" style="justify-content:flex-end;"><div class="col gap-1" style="background:var(--crimson-700); color:#fff; border-radius:12px; padding:10px 14px; max-width:70%;"><span class="sm">${UI.esc(m.text)}</span></div></div>`
                : m.card ? aiCard(m.card) : `<div class="col gap-1 card" style="padding:12px 14px; max-width:80%;"><p class="sm">${UI.esc(m.text || '')}</p></div>`).join('')}
          </div>
          <div style="border-top:1px solid var(--border); padding:12px 16px;">
            <div class="row gap-2">
              <input class="input" id="chat-input" placeholder="Ask anything" value="${UI.esc(chatDraft)}" oninput="chatDraft=this.value" onkeydown="if(event.key==='Enter'){Store.chatAsk(this.value); chatDraft='';}" />
              <button class="btn primary" onclick="const i=document.getElementById('chat-input'); Store.chatAsk(i.value); chatDraft='';">Send</button>
            </div>
            <p class="xs muted" style="margin-top:6px;">Your AI advisor never submits on its own; you can always submit from the Plan Builder.</p>
          </div>
        </div>
      </div>
    </div>`;
};

function aiCard(card) {
  if (card.kind === 'summary') return `<div class="col gap-1 card" style="padding:14px; max-width:80%;"><h3>${card.title}</h3>${card.lines.map((l) => `<p class="sm">· ${l}</p>`).join('')}</div>`;
  if (card.kind === 'course') return `<div class="col gap-1 card" style="padding:14px; max-width:80%; border-inline-start:3px solid var(--destructive);">
    <div class="row between"><h3><code>${card.code}</code> · ${card.title}</h3>${UI.chip('destructive')}</div>
    <p class="sm">${card.why}</p></div>`;
  if (card.kind === 'proposal') return `<div class="col gap-2 card" style="padding:14px; max-width:80%;">
    <h3>Plan proposal · <span class="num">${card.total}</span></h3>
    ${card.courses.map((c) => `<div class="row between sm"><span><code>${c}</code> · ${Store.courseOf(c).title}</span>
      <button class="btn outline sm" onclick="Store.aiAddToPlan('${c}')">Add to plan</button></div>`).join('')}
    <p class="sm muted">${UI.esc(card.reasoning)}</p>
    ${UI.banner('info', 'Nothing has been submitted yet.', 'Review the proposal, then confirm. You can always submit from the Plan Builder yourself.',
      `<a class="btn primary sm" href="#/app/builder">Open the builder</a>`)}
  </div>`;
  if (card.kind === 'meeting') return `<div class="col gap-2 card" style="padding:14px; max-width:80%;"><p class="sm">${card.text}</p>
    <a class="btn outline sm" style="align-self:flex-start;" href="#/app/advisor">Request this meeting</a></div>`;
  return '';
}

App.views['/app/notifications'] = function () {
  App.titles['/app/notifications'] = ['Notifications'];
  return UI.notificationsView();
};

App.views['/app/account'] = function () {
  App.titles['/app/account'] = ['Account'];
  const me = Store.me();
  return `
    ${UI.pageHead('Account', 'Profile, language, theme, sign out')}
    <div class="card col gap-2" style="max-width:520px;">
      <h2>${me.name}</h2>
      <div class="row between sm"><span class="muted">Student ID</span><span class="num">${me.studentId}</span></div>
      <div class="row between sm"><span class="muted">Email</span><span>${me.email}</span></div>
      <div class="row between sm"><span class="muted">Faculty</span><span>${me.faculty}</span></div>
      <div class="menu-sep"></div>
      <div class="row between sm"><span>Language</span><button class="btn outline sm" onclick="Store.toast('Arabic ships with implementation; dictionaries are already parity-complete.', 'info')">English · العربية</button></div>
      <div class="row between sm"><span>Theme</span><button class="btn outline sm" onclick="Store.toast('Dark mode is token-ready; ships with implementation.', 'info')">Light</button></div>
      <div class="menu-sep"></div>
      <button class="btn outline" style="align-self:flex-start; color:var(--destructive);" onclick="Store.logout()">Sign out</button>
    </div>`;
};
