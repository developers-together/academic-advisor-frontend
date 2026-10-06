/* Advisor full replica — UI kit. Small helpers so every view renders
   the same components. All return HTML strings. */

const UI = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  iconBtn(glyph, count, pop) {
    return `<button class="icon-btn" ${pop ? `data-pop="${pop}"` : ''}>${icon(glyph)}${count ? `<span class="dot-count num">${count}</span>` : ''}</button>`;
  },

  chip(status) {
    const map = {
      draft: 'Draft', submitted: 'Submitted', review: 'Under review', returned: 'Returned',
      approved: 'Approved', closed: 'Closed',
      confirmed: 'Confirmed', completed: 'Completed', declined: 'Declined', cancelled: 'Cancelled',
      requested: 'Requested', awaiting: 'Awaiting response',
      info: 'Info', success: 'Success', warning: 'Warning', destructive: 'Action needed', neutral: '—',
    };
    const tone = { draft: 'draft', submitted: 'submitted', review: 'review', returned: 'returned', approved: 'approved', confirmed: 'success', completed: 'success', requested: 'info', awaiting: 'warning', declined: 'destructive', cancelled: 'destructive' }[status] || 'neutral';
    return `<span class="chip ${tone}"><span class="dot"></span>${map[status] || status}</span>`;
  },

  banner(kind, title, body, actionsHtml = '') {
    const glyph = icon({ info: 'info', warning: 'alertTriangle', destructive: 'alertCircle', success: 'check' }[kind] || 'info', 'ic');
    return `<div class="banner ${kind}"><span class="b-icon">${glyph}</span>
      <div class="col gap-1" style="flex:1;"><span class="b-title">${title}</span>${body ? `<p class="sm">${body}</p>` : ''}
      ${actionsHtml ? `<div class="row gap-2" style="margin-top:4px;">${actionsHtml}</div>` : ''}</div></div>`;
  },

  pageHead(title, desc, actionsHtml = '') {
    return `<div class="page-head"><div><h1>${title}</h1>${desc ? `<p class="desc">${desc}</p>` : ''}</div>
      <div class="row gap-2">${actionsHtml}</div></div>`;
  },

  kpi(label, value, unit, delta, deltaTone, ctx) {
    return `<div class="card col gap-1" style="padding:16px;">
      <span class="eyebrow">${label}</span>
      <div class="row gap-1" style="align-items:baseline;"><span style="font-size:26px; font-weight:700;" class="num">${value}</span>
      ${unit ? `<span class="sm muted">${unit}</span>` : ''}</div>
      ${delta ? `<span class="chip ${deltaTone} num" style="align-self:flex-start;">${delta}</span>` : ''}
      ${ctx ? `<span class="xs muted">${ctx}</span>` : ''}</div>`;
  },

  tableWrap(headers, rowsHtml) {
    return `<div class="table-wrap"><table><thead><tr>${headers.map((h, i) => `<th${h.right ? ' class="num"' : ''}>${h.label || h}</th>`).join('')}</tr></thead><tbody>${rowsHtml}</tbody></table></div>`;
  },

  empty(title, body, actionHtml = '') {
    return `<div class="card col gap-2" style="align-items:center; text-align:center; padding:40px;">
      <span style="color:var(--muted-fg);">${icon('inbox', 'ic-lg')}</span>
      <h2 style="font-size:16px;">${title}</h2><p class="sm muted max-prose">${body}</p>${actionHtml}</div>`;
  },

  modal(html) {
    return `<div class="overlay">${html}</div>`;
  },

  toastHtml() {
    const t = Store.s.toastMsg;
    if (!t) return '';
    return `<div class="toast toast-${t.kind}">${UI.esc(t.msg)}</div>`;
  },

  meter(value, min, max, tone) {
    const width = Math.min(100, Math.round((value / max) * 100));
    const left = Math.round((min / max) * 100);
    return `<div class="meter"><span class="zone" style="left:${left}%; right:0;"></span>
      <span class="fill" style="width:${width}%; background: var(--${tone});"></span></div>`;
  },

  spark(points, stroke = '#2563eb') {
    const w = 44, h = 20, max = Math.max(...points), min = Math.min(...points);
    const pts = points.map((p, i) => `${(i / (points.length - 1)) * w},${h - ((p - min) / (max - min || 1)) * (h - 4) - 2}`).join(' ');
    return `<svg class="spark" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" stroke="${stroke}" /></svg>`;
  },

  asOfRow(route) {
    return `<div class="row between wrap gap-2" style="margin-bottom:4px;">
      <div class="row gap-2 sm">
        <label class="row gap-1">Term
          <select class="input" style="width:auto; height:32px;" onchange="Store.setTerm(this.value)">
            <option ${Store.s.term === '2026F' ? 'selected' : ''}>2026F</option>
            <option ${Store.s.term === '2025F' ? 'selected' : ''}>2025F</option>
          </select>
        </label>
        <span class="muted">· compared with <b>${Store.s.prevTerm}</b> · Data as of ${Store.s.asOf}</span>
      </div>
      <button class="btn outline sm" onclick="Store.toast('Refreshed from the SIS mirror.')">⟳ Refresh</button>
    </div>`;
  },

  crumb(trail) {
    const HREFS = {
      'My Plan': '#/app/plan', 'Builder': '#/app/builder', 'Academic Record': '#/app/record',
      'Queue': '#/advisor', 'Review': '#/advisor', 'Return plan': '#/advisor',
      'Students': '#/advisor/students', 'Meetings': '#/advisor/meetings',
      'Overview': null, 'Advisors': '#/dean/advisors', 'Analytics': '#/dean/analytics',
      'Faculties': '#/vp/faculties', 'Trends': '#/vp/trends',
      'Operations': '#/admin/operations', 'Courses': '#/admin/courses', 'Accounts': '#/admin/students',
    };
    return trail.map((c, i) => {
      const last = i === trail.length - 1;
      const href = !last && HREFS[c] ? HREFS[c] : null;
      const inner = href ? `<a href="${href}">${c}</a>` : `<span class="${last ? 'current' : ''}">${c}</span>`;
      return i === 0 ? inner : `<span aria-hidden="true">·</span>${inner}`;
    }).join('');
  },

  fmt(n) { return Number(n).toLocaleString('en'); },
};

UI.notificationsView = function () {
  const me = Store.me();
  const filter = Store.s.notifFilter || 'all';
  const all = Store.notifsFor();
  const items = filter === 'unread' ? all.filter((n) => !n.read) : all;
  return `
    ${UI.pageHead('Notifications', 'Everything that needs you, in one list',
      `<div class="tabs">
        <button class="tab ${filter === 'all' ? 'active' : ''}" onclick="Store.setNotifFilter('all')">All <span class="count">(${all.length})</span></button>
        <button class="tab ${filter === 'unread' ? 'active' : ''}" onclick="Store.setNotifFilter('unread')">Unread <span class="count">(${all.filter((n) => !n.read).length})</span></button>
      </div>
      <button class="btn outline sm" onclick="Store.markAllRead()">Mark all as read</button>`)}
    <div class="card col" style="padding:0; overflow:hidden;">
      ${items.length === 0 ? `<p class="sm muted" style="padding:24px; text-align:center;">${filter === 'unread' ? 'You are all caught up. Nothing unread.' : 'Nothing here yet. Events that need you appear here.'}</p>` : ''}
      ${items.map((n) => `
        <div class="notif ${n.read ? '' : 'unread'}">
          ${n.read ? '<span style="width:7px; flex:none;"></span>' : '<span class="unread-dot"></span>'}
          <span class="n-icon" style="background:var(--muted);">${icon(n.icon)}</span>
          <div class="col gap-1" style="flex:1;">
            <span class="n-title">${UI.esc(n.title)}</span>
            <span class="n-body">${UI.esc(n.body)}</span>
            ${n.action ? `<div class="row gap-2" style="margin-top:4px;"><a class="btn outline sm" href="${n.action.route}" onclick="Store.markRead(${n.id})">${n.action.label}</a></div>` : ''}
          </div>
          <span class="n-time">${n.time}</span>
        </div>`).join('')}
    </div>`;
};
