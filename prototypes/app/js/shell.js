/* Advisor full replica — shell (R-01, R-02, C-12, C-13) + router. */

const NAV = {
  student: { home: ['#/', 'home', 'Home'], items: [['#/app/plan', 'plan', 'My Plan'], ['#/app/record', 'cap', 'Academic Record'], ['#/app/chat', 'chat', 'AI Advisor'], ['#/app/advisor', 'user', 'My Advisor']], more: [['#/app/notifications', 'bell', 'Notifications'], ['#/app/account', 'settings', 'Account']] },
  advisor: { home: ['#/', 'list', 'Queue'], items: [['#/advisor/students', 'users', 'Students'], ['#/advisor/meetings', 'calendar', 'Meetings']], more: [['#/advisor/hours', 'clock', 'Office Hours'], ['#/advisor/notifications', 'bell', 'Notifications'], ['#/advisor/profile', 'user', 'Profile']] },
  dean: { home: ['#/', 'grid', 'Overview'], items: [['#/dean/advisors', 'users', 'Advisors'], ['#/dean/analytics', 'chart', 'Analytics']], more: [['#/dean/notifications', 'bell', 'Notifications']] },
  vp: { home: ['#/', 'grid', 'Overview'], items: [['#/vp/faculties', 'building', 'Faculties'], ['#/vp/trends', 'chart', 'Trends']], more: [['#/vp/notifications', 'bell', 'Notifications']] },
  admin: { home: ['#/', 'grid', 'Overview'], items: [['#/admin/students', 'user', 'Students']], more: [['#/admin/operations', 'grid', 'Operations'], ['#/admin/assignments', 'clipboard', 'Assignments'], ['#/admin/courses', 'book', 'Courses'], ['#/admin/programs', 'layers', 'Programs'], ['#/admin/rules', 'scale', 'Rules'], ['#/admin/windows', 'windows', 'Windows'], ['#/admin/ai', 'sparkles', 'AI Config'], ['#/admin/notifications', 'bell', 'Notifications'], ['#/admin/staff', 'staff', 'Staff']] },
};

const HOME = { student: '#/app', advisor: '#/advisor', dean: '#/dean', vp: '#/vp', admin: '#/admin' };

const Shell = {
  unread() { const n = Store.notifsFor(); return n.filter((x) => !x.read).length; },

  sideLinks(active) {
    const nav = NAV[Store.me().role];
    const link = ([href, glyph, label]) =>
      `<a href="${href}" class="${href === active || (href === '#/' && active === HOME[Store.me().role]) ? 'active' : ''}">${glyph}<span>${label}</span></a>`;
    let html = link(nav.home);
    html += nav.items.map(link).join('');
    html += `<div class="side-section">More</div>`;
    html += nav.more.map(link).join('');
    html += `<div style="flex:1"></div><a href="#" onclick="Store.logout(); return false;" style="color:var(--destructive)">${icon('logout')}<span>Sign out</span></a>`;
    return html;
  },

  urgentBanner() {
    const role = Store.me().role;
    if (role === 'student') {
      const plan = Store.myPlan();
      if (plan && plan.status === 'returned')
        return UI.banner('warning', 'Your plan was returned. Read the feedback and resubmit.',
          'Amr Advisor returned it ' + (plan.returnAt || '') + '.',
          `<a class="btn primary sm" href="#/app/plan">Review plan</a>`);
      if (plan && plan.status === 'approved')
        return UI.banner('success', 'Plan approved. Register in the SIS, then tick the checklist.', '',
          `<a class="btn primary sm" href="#/app/plan">Open my plan</a>`);
    }
    if (role === 'advisor') {
      const q = Store.s.plans[6].aging ? 1 : 0;
      if (q) return UI.banner('warning', '1 plan is aging past the threshold.', 'Lina Majors waits 5 days.', `<a class="btn primary sm" href="#/">Open queue</a>`);
    }
    return '';
  },

  popoverBell() {
    const items = Store.notifsFor().slice(0, 5);
    return `<div class="popover col" id="pop-bell" data-openable style="display:none; position:absolute; top:52px; inset-inline-end:0; width:420px; z-index:60; overflow:hidden;">
      <div class="row between" style="padding:12px 16px; border-bottom:1px solid var(--border);">
        <h3>Notifications</h3><button class="btn ghost sm" onclick="Store.markAllRead()">Mark all as read</button>
      </div>
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
      <div style="padding:10px 16px; border-top:1px solid var(--border); text-align:center;">
        <a href="${NAV[Store.me().role].more.find((m) => m[2] === 'Notifications')?.[0] || '#/app/notifications'}">View all notifications</a>
      </div>
    </div>`;
  },

  popoverAvatar() {
    const me = Store.me();
    return `<div class="popover menu" id="pop-avatar" data-openable style="display:none; position:absolute; top:52px; inset-inline-end:0; z-index:60;">
      <div style="padding:10px 12px;"><p style="font-weight:600;">${UI.esc(me.name)}</p><p class="sm muted">${UI.esc(me.email || '')}</p></div>
      <div class="menu-sep"></div>
      <a href="#/app/account"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.2em;height:1.2em;vertical-align:-0.24em;" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/></svg> Account</a>
      <button onclick="Store.toast('Language switching ships with implementation; this prototype is English.', 'info')">${icon('globe')} Language · English</button>
      <button onclick="Store.toast('Theme flip ships with implementation; tokens are dark-ready.', 'info')">${icon('moon')} Theme · Light</button>
      <div class="menu-sep"></div>
      <button class="danger" onclick="Store.logout()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:1.2em;height:1.2em;vertical-align:-0.24em;" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg> Sign out</button>
    </div>`;
  },


  mobileLayout(active, crumbs, viewHtml) {
    const me = Store.me();
    const nav = NAV[me.role];
    const slots = [nav.home, nav.items[0], nav.items[1], nav.items[2]].filter(Boolean).slice(0, 4);
    const unread = this.unread();
    return `
    <div style="min-height:100vh; display:flex; flex-direction:column; background:var(--bg);">
      <div class="anchor-wrap" style="display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-bottom:1px solid var(--border); background:var(--card); position:sticky; top:0; z-index:20;">
        <div class="crumbs">${crumbs}</div>
        <div class="row gap-1">
          ${this.iconBell(unread)}
          ${this.iconAvatar()}
        </div>
        ${this.popoverBell()}
        ${this.popoverAvatar()}
      </div>
      <div style="flex:1; padding:14px 14px 90px;">
        ${this.urgentBanner()}
        ${viewHtml}
      </div>
      <nav aria-label="Primary" style="position:fixed; inset-inline:0; bottom:0; display:flex; border-top:1px solid var(--border); background:var(--card); padding-bottom:env(safe-area-inset-bottom); z-index:30;">
        ${slots.map(([href, glyph, label]) => `
          <a href="${href}" style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px 0 10px; font-size:11px; font-weight:500; color:var(--muted-fg); text-decoration:none; ${href === active ? 'color:var(--crimson-700);' : ''}">
            <span aria-hidden="true">${icon(glyph)}</span><span>${label === 'My Plan' ? 'Plan' : label === 'AI Advisor' ? 'AI' : label === 'My Advisor' ? 'Advisor' : label}</span>
          </a>`).join('')}
        <button type="button" aria-haspopup="dialog" aria-expanded="${!!Shell.moreOpen}" onclick="Shell.moreOpen = !Shell.moreOpen; App.render();"
          style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px; padding:8px 0 10px; font-size:11px; font-weight:500; color:var(--muted-fg); background:none; border:none; cursor:pointer; ${Shell.moreOpen ? 'color:var(--crimson-700);' : ''}">
          <span aria-hidden="true">${icon('more')}</span><span>More</span>
        </button>
      </nav>
      ${Shell.moreOpen ? `
      <div style="position:fixed; inset:0; background:rgb(15 23 42 / .45); z-index:40;" onclick="Shell.moreOpen = false; App.render();">
        <div class="col gap-2" style="position:absolute; inset-inline:0; bottom:0; background:var(--card); border-radius:16px 16px 0 0; padding:16px 16px 24px;" onclick="event.stopPropagation()">
          <div class="row between"><b>More</b><button class="icon-btn" aria-label="Close" onclick="Shell.moreOpen = false; App.render();">✕</button></div>
          ${nav.more.map(([href, glyph, label]) => `<a class="btn outline" style="justify-content:flex-start; height:48px;" href="${href}">${icon(glyph)} ${label}</a>`).join('')}
          <button class="btn outline" style="justify-content:flex-start; height:48px;" onclick="Store.setDark(!Store.s.dark)">${icon(Store.s.dark ? 'sun' : 'moon')} Theme · ${Store.theme() === 'v5' ? 'v5' : 'v4'} · ${Store.s.dark ? 'Dark' : 'Light'}</button>
          <button class="btn outline" style="justify-content:flex-start; height:48px; color:var(--destructive);" onclick="Store.logout()">${icon('logout')} Sign out</button>
        </div>
      </div>` : ''}
    </div>`;
  },

  layout(active, crumbs, viewHtml) {
    const me = Store.me();
    const unread = this.unread();
    document.body.className = (Store.theme() === 'v5' ? 'v5 ' : '') + (Store.s.dark ? 'dark ' : '') + 'r-' + me.role;
    if (window.innerWidth < 768) return this.mobileLayout(active, crumbs, viewHtml);
    return `<div class="shell">
      <aside class="side">${this.sideLinks(active)}</aside>
      <div class="main">
        <div class="topbar anchor-wrap">
          <div class="crumbs">${crumbs}</div>
          <div class="row gap-1">
            <button class="btn outline sm" style="height:36px;" title="Toggle the v5 theme (prototype control)" onclick="Store.setTheme(Store.theme() === 'v5' ? 'v4' : 'v5')">${icon('layers')} Theme · ${Store.theme() === 'v5' ? 'v5' : 'v4'}</button>
            <button class="icon-btn" style="width:36px; height:36px;" aria-label="Toggle dark mode" title="Toggle dark mode" onclick="Store.setDark(!Store.s.dark)">${icon(Store.s.dark ? 'sun' : 'moon')}</button>
            <button class="btn outline sm" style="height:36px;" onclick="Palette.show()">${icon('search', 'ic')}&nbsp; Search <span class="sm muted">⌘K</span></button>
            ${this.iconBell(unread)}
            ${this.iconAvatar()}
          </div>
          ${this.popoverBell()}
          ${this.popoverAvatar()}
        </div>
        <div class="content">
          ${this.urgentBanner()}
          ${viewHtml}
        </div>
      </div>
    </div>${UI.toastHtml()}`;
  },

  iconBell(unread) { return `<button class="icon-btn" data-pop="pop-bell" aria-label="Notifications${unread ? ', ' + unread + ' unread' : ''}" style="position:relative;">${icon('bell')}${unread ? `<span class="dot-count num">${unread}</span>` : ''}</button>`; },
  iconAvatar() {
    const me = Store.me();
    const initials = me.name.split(' ').map((w) => w[0]).slice(0, 2).join('');
    return `<button class="avatar" data-pop="pop-avatar">${initials}</button>`;
  },

  mobile(active) {
    const me = Store.me();
    const nav = NAV[me.role];
    const slots = [nav.home, nav.items[0], nav.items[1], nav.items[2] || null].filter(Boolean);
    return `<div class="phone" style="margin:24px auto;">
      <div class="m-top"><b>Advisor</b><div class="row gap-1">${this.iconBell(this.unread())}${this.iconAvatar()}</div></div>
      <div class="m-body">
        <div class="banner warning" style="padding:10px 12px;"><span class="b-icon">!</span>
          <div class="col gap-1"><span class="sm" style="font-weight:600;">Your plan was returned.</span>
          <a class="btn primary sm" style="align-self:flex-start;" href="#/app/plan">Review plan</a></div></div>
        <div class="card col gap-1" style="padding:14px;"><h3>Plan health</h3><p class="sm muted">6 of 12–18 credits · returned</p></div>
        <div class="card col gap-1" style="padding:14px;"><h3>Next meeting</h3><p class="sm muted">Sun 12 Oct · Building 3, Room 2140</p></div>
      </div>
      <div class="m-nav">
        ${slots.map(([href, glyph, label]) => `<a href="${href}" class="${href === active ? 'active' : ''}">${glyph}<span>${label === 'My Plan' ? 'Plan' : label === 'AI Advisor' ? 'AI' : label === 'My Advisor' ? 'Advisor' : label}</span></a>`).join('')}
        <a href="#" onclick="document.getElementById('m-sheet').style.display='flex'; return false;">⋯<span>More</span></a>
      </div>
      <div id="m-sheet" style="display:none; position:absolute; inset:0; background:rgb(15 23 42 / .45); align-items:flex-end; z-index:40;">
        <div class="col gap-2" style="background:var(--card); width:100%; border-radius:16px 16px 0 0; padding:16px 16px 24px;">
          <div class="row between"><b>More</b><button class="icon-btn" onclick="document.getElementById('m-sheet').style.display='none'">✕</button></div>
          ${nav.more.map(([href, glyph, label]) => `<a class="btn outline" style="justify-content:flex-start; height:48px;" href="${href}">${glyph} ${label}</a>`).join('')}
        </div>
      </div>
    </div>`;
  },
};

/* ---------- router ---------- */

const App = {
  views: {},
  titles: {},

  go(route) { location.hash = route; },

  current() { return location.hash.replace(/^#/, '') || '/'; },

  render() {
    const root = document.getElementById('root');
    const me = Store.me();
    if (!me) {
      document.body.className = Store.s.dark ? 'dark' : '';
      root.innerHTML = Auth.view();
      Auth.after();
      return;
    }
    let route = this.current();
    const role = me.role;
    if (route === '/') route = HOME[role].slice(1);
    const roleRoot = { student: '/app', advisor: '/advisor', dean: '/dean', vp: '/vp', admin: '/admin' }[role];
    const view = this.views[route];
    if (!route.startsWith(roleRoot) && !(roleRoot === '/app' && route === '/') ) {
      // permission panel (route guard, section 7.3)
      root.innerHTML = Shell.layout(roleRoot, UI.crumb([me.name]), `
        ${UI.empty('This area is for ' + ({ student: 'students', advisor: 'advisors', dean: 'deans', vp: 'vice presidents', admin: 'administrators' }[role]) + '.',
          'Your role sees its own areas only. Nothing outside your scope is reachable.',
          `<a class="btn outline" href="${HOME[role]}">Go to your dashboard</a>`)}`);
      return;
    }
    if (!view) {
      root.innerHTML = Shell.layout(route, UI.crumb(['Not found']), `
        ${UI.empty('We could not find that page.', 'The address may be wrong or the page moved.',
        `<a class="btn outline" href="${HOME[role]}">Go to your dashboard</a>`)}`);
      return;
    }
    const html = view();
    const trail = this.titles[route] || ['Advisor'];
    root.innerHTML = Shell.layout(route, UI.crumb(trail), html) + Palette.view();
    const input = document.getElementById('palette-input');
    if (input && Palette.open) input.focus();
  },
};

window.addEventListener('hashchange', () => App.render());
