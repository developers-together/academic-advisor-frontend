/* Advisor full replica — command palette (DS-N-04/05: role-scoped, keyboard-first). */

const Palette = {
  open: false,
  query: '',
  index: 0,
  items: [],

  groups() {
    const me = Store.me();
    if (!me) return [];
    const nav = NAV[me.role];
    const pages = [nav.home, ...nav.items, ...nav.more].map(([href, glyph, label]) => ({
      group: 'Pages', icon: glyph, label, hint: 'Page', run: () => { location.hash = href; },
    }));
    const records = [];
    if (me.role === 'advisor') {
      Object.keys(Store.s.plans).forEach((id) => {
        const u = Store.user(Number(id));
        if (u) records.push({ group: 'People', icon: '👤', label: u.name, hint: 'Caseload · ' + (u.studentId || ''), run: () => { App.reviewStudent = u.id; location.hash = '#/advisor/review'; } });
      });
    }
    if (me.role === 'student') {
      Store.s.chat.conversations.forEach((c) => records.push({ group: 'Conversations', icon: '💬', label: c.title, hint: c.at, run: () => Store.chatOpen(c.id) }));
    }
    if (me.role === 'dean' || me.role === 'vp') {
      Store.s.governance.faculties.forEach((f) => records.push({ group: 'Faculties', icon: '🏛', label: f.name, hint: f.completion + '% completion', run: () => { location.hash = '#/vp/faculties'; } }));
    }
    if (me.role === 'admin') {
      Store.s.admin.students.forEach((u) => records.push({ group: 'People', icon: '👤', label: u.name, hint: 'Account · ' + u.binding, run: () => { location.hash = '#/admin/students'; } }));
      Store.s.admin.courses.forEach((c) => records.push({ group: 'Courses', icon: '📚', label: c.code + ' · ' + c.title, hint: c.program, run: () => { location.hash = '#/admin/courses'; } }));
      Store.s.admin.staff.forEach((p) => records.push({ group: 'Staff', icon: '🧑‍💼', label: p.name, hint: p.role, run: () => { location.hash = '#/admin/staff'; } }));
    }
    const actions = {
      student: [{ label: 'Open the Plan Builder', run: () => { location.hash = '#/app/builder'; } }, { label: 'Ask the AI Advisor', run: () => { location.hash = '#/app/chat'; } }, { label: 'Request a meeting', run: () => { location.hash = '#/app/advisor'; } }],
      advisor: [{ label: 'Open the queue', run: () => { location.hash = '#/advisor'; } }, { label: 'Set availability', run: () => { location.hash = '#/advisor/hours'; } }, { label: 'Invite a student', run: () => { location.hash = '#/advisor/meetings'; } }],
      dean: [{ label: 'Export CSV', run: () => App.exportCsv && App.exportCsv() }, { label: 'Open advisor workload', run: () => { location.hash = '#/dean/advisors'; } }],
      vp: [{ label: 'Export CSV', run: () => App.exportCsv && App.exportCsv() }, { label: 'Open the scorecard', run: () => { location.hash = '#/vp/faculties'; } }],
      admin: [{ label: 'Add a course', run: () => { location.hash = '#/admin/courses'; } }, { label: 'Open registration windows', run: () => { location.hash = '#/admin/windows'; } }, { label: 'Run the assignments import', run: () => { location.hash = '#/admin/assignments'; } }],
    }[me.role].map((a) => ({ group: 'Actions', icon: '⚡', label: a.label, hint: 'Action', run: a.run }));
    const theme = [
      { group: 'Actions', icon: '◑', label: Store.s.dark ? 'Switch to light mode' : 'Switch to dark mode', hint: 'Theme', run: () => Store.setDark(!Store.s.dark) },
      { group: 'Actions', icon: '◑', label: Store.theme() === 'v5' ? 'Switch to v4 skin' : 'Switch to v5 skin', hint: 'Theme', run: () => Store.setTheme(Store.theme() === 'v5' ? 'v4' : 'v5') },
    ];
    return [...pages, ...records, ...actions, ...theme];
  },

  filtered() {
    const q = this.query.trim().toLowerCase();
    const items = this.groups();
    this.items = q ? items.filter((i) => (i.label + ' ' + i.hint).toLowerCase().includes(q)) : items;
    if (this.index >= this.items.length) this.index = 0;
    return this.items;
  },

  toggle() { this.open ? this.close() : this.show(); },
  show() { this.open = true; this.query = ''; this.index = 0; App.render(); },
  close() { this.open = false; App.render(); },
  move(d) { const n = this.items.length; if (n) { this.index = (this.index + d + n) % n; App.render(); } },
  run(i) { const item = this.items[i ?? this.index]; if (item) { this.open = false; item.run(); App.render(); } },

  view() {
    if (!this.open || !Store.me()) return '';
    const items = this.filtered();
    let idx = -1;
    return `
    <div class="overlay" style="align-items:flex-start;" onclick="Palette.close()">
      <div class="popover" role="dialog" aria-label="Command palette" style="width:560px; margin:12vh auto 0; overflow:hidden;" onclick="event.stopPropagation()">
        <div class="row gap-2" style="padding:12px 14px; border-bottom:1px solid var(--border);">
          <span class="muted">⌕</span>
          <input id="palette-input" class="input" style="border:none; box-shadow:none; padding:0; height:auto; font-size:15px;"
            placeholder="Search pages, people, and actions" value="${UI.esc(this.query)}"
            oninput="Palette.query=this.value; Palette.index=0; App.render(); setTimeout(()=>{const i=document.getElementById('palette-input'); i&&i.focus(); i&&i.setSelectionRange(i.value.length,i.value.length);},0);"
            onkeydown="if(event.key==='ArrowDown'){event.preventDefault();Palette.move(1);} if(event.key==='ArrowUp'){event.preventDefault();Palette.move(-1);} if(event.key==='Enter'){event.preventDefault();Palette.run();} if(event.key==='Escape'){Palette.close();}" />
          <span class="chip neutral sm">esc</span>
        </div>
        <div style="max-height:380px; overflow:auto; padding:6px;">
          ${items.length === 0 ? `<p class="sm muted" style="padding:16px;">No results for “${UI.esc(this.query)}”</p>` : ''}
          ${items.map((item) => {
            idx++;
            const active = idx === this.index;
            return `<button class="row gap-2" style="display:flex; width:100%; text-align:start; padding:9px 10px; border:none; background:${active ? 'var(--muted)' : 'transparent'}; border-radius:6px; font:inherit; font-size:13px; cursor:pointer;"
              onmouseenter="Palette.index=${idx}" onclick="Palette.run(${idx})">
              <span style="width:20px; text-align:center;">${item.icon}</span>
              <span style="font-weight:500; flex:1;">${UI.esc(item.label)}</span>
              <span class="xs muted">${UI.esc(item.hint)}</span>
              <span class="xs muted" style="width:70px; text-align:end;">${item.group}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="row gap-3 xs muted" style="padding:8px 14px; border-top:1px solid var(--border);">
          <span>↑↓ navigate</span><span>↵ select</span><span>esc close</span>
          <span style="margin-inline-start:auto;">role-scoped · only what you can reach</span>
        </div>
      </div>
    </div>`;
  },

  wire() {
    if (this._wired) return;
    this._wired = true;
    window.addEventListener('keydown', (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        if (Store.me()) this.toggle();
      }
    });
  },
};
Palette.wire();
