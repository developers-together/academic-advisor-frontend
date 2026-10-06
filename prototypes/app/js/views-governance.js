/* Advisor full replica — governance views: dean (C-05, C-06) and VP (C-07).
   Same conventions as views-student.js: template literals, UI helpers,
   inline handlers, and module-level state for tabs, filters, and drills. */

const PALETTE = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#64748b'];
const TERMS = ['2024S', '2024F', '2025S', '2025F', '2026F'];

let analyticsMetric = 'Completion';
let analyticsDepts = new Set(['Computer & Systems', 'Design & Production']);
let drilledFaculty = null;
let trendsMetric = 'Completion';
let isolatedFaculty = null;

/* ---------- shared helpers ---------- */

const gov = () => Store.s.governance;
const prevTerm = () => Store.s.term === '2025F';
/* deltas compare with prevTerm; the 2025F view has no earlier term */
const dl = (txt, tone) => (prevTerm() ? ['—', 'neutral'] : [txt, tone]);
const sign = (v, unit = '') => `${v > 0 ? '▲' : v < 0 ? '▼' : '±'} ${Math.abs(v)}${unit ? ' ' + unit : ''}`;
const compTone = (c) => (c >= 65 ? 'success' : c >= 58 ? 'warning' : 'destructive');
const dirTone = (v) => (v > 0 ? 'success' : v < 0 ? 'destructive' : 'neutral');
const badTone = (v) => (v > 0 ? 'warning' : v < 0 ? 'success' : 'neutral');
const shortName = (name) => name.split(' ')[0];

/* series per metric; only completion sparks exist, so the other two
   shift the same shape onto the faculty's real median / aging anchor */
function facultySeries(f, metric) {
  if (metric === 'Completion') return f.spark.slice();
  if (metric === 'Median decision time') return f.spark.map((v) => Math.max(0, Math.round(f.median + (v - f.completion))));
  return f.spark.map((v) => Math.max(0, Math.round(f.aging + (f.completion - v))));
}

function metricTabs(current, varName) {
  const opts = ['Completion', 'Median decision time', 'Aging'];
  return `<div class="tabs">${opts.map((o) => `<button class="tab ${o === current ? 'active' : ''}" onclick="${varName} = '${o}'; App.render();">${o}</button>`).join('')}</div>`;
}

function govLineChart(seriesList, label) {
  const w = 640, h = 220, padL = 40, padR = 90, padT = 20, padB = 28;
  const all = seriesList.flatMap((s) => s.values);
  const max = Math.max(...all), min = Math.min(...all);
  const span = max - min || 1;
  const x = (i) => padL + (i / (TERMS.length - 1)) * (w - padL - padR);
  const y = (v) => padT + ((max - v) / span) * (h - padT - padB);
  const gridLines = [0, 0.5, 1].map((t) => {
    const v = min + t * span;
    return `<line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${w - padR}" y2="${y(v).toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>
      <text x="${padL - 6}" y="${(y(v) + 3).toFixed(1)}" text-anchor="end" font-size="10" fill="#64748b">${Math.round(v)}</text>`;
  }).join('');
  const xLabels = TERMS.map((t, i) => `<text x="${x(i).toFixed(1)}" y="${h - 8}" text-anchor="middle" font-size="10" fill="#64748b">${t}</text>`).join('');
  const partial = `<line x1="${x(TERMS.length - 1).toFixed(1)}" y1="${padT}" x2="${x(TERMS.length - 1).toFixed(1)}" y2="${h - padB}" stroke="#64748b" stroke-width="1" stroke-dasharray="3 3"/>
    <text x="${x(TERMS.length - 1).toFixed(1)}" y="${padT - 7}" text-anchor="middle" font-size="10" fill="#64748b">2026F · partial term</text>`;
  const lines = seriesList.map((s) => {
    const pts = s.values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const dash = s.dashed ? ' stroke-dasharray="6 4"' : '';
    const op = ` opacity="${s.opacity ?? 1}"`;
    let out = `<polyline points="${pts}" fill="none" stroke="${s.color}" stroke-width="2"${dash}${op}/>`;
    if (s.hollow) out += `<circle cx="${x(TERMS.length - 1).toFixed(1)}" cy="${y(s.values[s.values.length - 1]).toFixed(1)}" r="3.5" fill="#ffffff" stroke="${s.color}" stroke-width="2"${op}/>`;
    return out;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${UI.esc(label)}">${gridLines}${xLabels}${partial}${lines}</svg>`;
}

/* ---------- dean ---------- */

App.views['/dean'] = function () {
  App.titles['/dean'] = ['Overview'];
  const fs = gov().faculties;
  const worst = fs.reduce((m, f) => (f.completion < m.completion ? f : m));
  const [cD, cT] = dl('▼ 3 pts', 'destructive');
  const [mD, mT] = dl('▲ 2 h', 'warning');
  const [aD, aT] = dl('▼ 3', 'success');
  const [lD, lT] = dl('▲ 40', 'neutral');
  const [pD, pT] = dl('▲ 25', 'success');
  const funnel = [['Draft', 980], ['Submitted', 640], ['Under review', 210], ['Approved', 610], ['Closed', 610]];
  const near = [...fs].sort((a, b) => a.completion - b.completion).slice(0, 4);
  return `
    ${UI.pageHead('Overview', 'Completion, speed, and load for your school', `<button class="btn outline sm" onclick="App.exportCsv()">Export CSV</button>`)}
    ${UI.asOfRow()}
    <div class="grid-5">
      ${UI.kpi('Completion', 62, '%', cD, cT, `vs 65% in ${Store.s.prevTerm}`)}
      ${UI.kpi('Median decision', 26, 'h', mD, mT, `vs 24 h in ${Store.s.prevTerm}`)}
      ${UI.kpi('Aging', 29, 'plans', aD, aT, `vs 32 in ${Store.s.prevTerm}`)}
      ${UI.kpi('Caseload', 980, 'plans', lD, lT, `vs 940 in ${Store.s.prevTerm}`)}
      ${UI.kpi('Approved', 610, 'plans', pD, pT, `vs 585 in ${Store.s.prevTerm}`)}
    </div>
    ${UI.banner('warning',
      `${worst.name} is the bottleneck this term — completion ${worst.completion}% (${dl(sign(worst.d) + ' pts', 'destructive')[0]})`,
      `Median decision ${worst.median} h · ${worst.aging} aging plans. It drags the school average down.`,
      `<a class="btn outline sm" href="#/dean/advisors">Open its advisors</a>`)}
    <div class="card col gap-2">
      <h2>Where do plans stall this term?</h2>
      ${funnel.map(([label, v]) => `
        <div class="row gap-3" style="align-items:center;">
          <span class="sm" style="width:110px; flex:none;">${label}</span>
          <div class="meter" style="flex:1;"><span class="fill" style="width:${Math.round((v / 980) * 100)}%; background:var(--crimson-700);"></span></div>
          <span class="sm num" style="width:44px; text-align:end;">${v}</span>
        </div>`).join('')}
      <p class="xs muted">Draft and Submitted are term totals. Under review is a live count. Approved and Closed are cumulative.</p>
    </div>
    <div class="col gap-2">
      <h2>Sub-units closest to the line</h2>
      <div class="grid-2">
        ${near.map((f) => `
          <div class="card col gap-2">
            <h3>${f.name}</h3>
            <div class="row gap-2" style="align-items:baseline;">
              <span style="font-size:24px; font-weight:700;" class="num">${f.completion}%</span>
              <span class="chip ${dirTone(f.d)} num">${dl(sign(f.d) + ' pts', dirTone(f.d))[0]}</span>
            </div>
            <span class="sm muted num">${f.aging} aging plans</span>
            <a class="sm" href="#/dean/advisors">Open advisors</a>
          </div>`).join('')}
      </div>
    </div>`;
};

let advisorDetail = null;

App.exportCsv = function () {
  const rows = [['Faculty', 'Caseload', 'Approved', 'Completion %', 'Median decision h', 'Aging']];
  Store.s.governance.faculties.forEach((f) => rows.push([f.name, f.caseload, f.approved, f.completion, f.median, f.aging]));
  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `advisor-governance-${Store.s.term}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  Store.toast('CSV exported.');
};

function advisorDetailModal() {
  if (!advisorDetail) return '';
  const d = advisorDetail;
  return UI.modal(`
    <div class="card col gap-3" style="max-width:520px; margin:10vh auto;">
      <div class="row between"><h2>${UI.esc(d.name)}</h2><button class="icon-btn" onclick="advisorDetail=null; App.render()">✕</button></div>
      <p class="sm muted">Aggregate view only. Student rows never appear here (PR-14).</p>
      <div class="grid-3">
        ${UI.kpi('Caseload', d.caseload, 'students')}
        ${UI.kpi('Queue', d.queue, 'plans')}
        ${UI.kpi('Median decision', d.median + ' h', '')}
      </div>
      <div class="grid-2">
        ${UI.kpi('Aging', d.aging, 'plans')}
        ${UI.kpi('Completion', d.completion + '%', '', '', '', UI.spark(d.spark))}
      </div>
      <button class="btn outline sm" style="align-self:flex-start;" onclick="advisorDetail=null; App.render()">Close</button>
    </div>`);
}

App.views['/dean/advisors'] = function () {
  App.titles['/dean/advisors'] = ['Overview', 'Advisors'];
  const advisors = [];
  const rows = gov().faculties.map((f) => {
    const short = shortName(f.name);
    const half = (n) => Math.ceil(n / 2);
    const defs = [
      { suffix: 'A', caseload: half(f.caseload), completion: Math.min(100, f.completion + 2), median: f.median - 1, aging: half(f.aging) },
      { suffix: 'B', caseload: f.caseload - half(f.caseload), completion: Math.max(0, f.completion - 2), median: f.median + 1, aging: f.aging - half(f.aging) },
    ];
    const trs = defs.map((a) => {
      const queue = Math.max(0, Math.round(a.caseload * (1 - f.completion / 100)));
      advisors.push({ ...a, queue });
      return `<tr>
        <td style="font-weight:500;">Advisor ${a.suffix} of ${short}</td>
        <td class="num">${a.caseload}</td>
        <td class="num">${queue}</td>
        <td class="num">${a.median} h</td>
        <td class="num">${a.aging}</td>
        <td class="num"><span class="chip ${compTone(a.completion)} num">${a.completion}%</span></td>
        <td class="num"><button class="btn ghost sm" onclick='advisorDetail = { name: "Advisor ${a.suffix} of ${short}", caseload: ${a.caseload}, queue: ${queue}, median: ${a.median}, aging: ${a.aging}, completion: ${a.completion}, spark: ${JSON.stringify(f.spark)} }; App.render();'>Details</button></td>
      </tr>`;
    }).join('');
    return `<tr class="dept-row"><td colspan="7">${f.name}</td></tr>${trs}`;
  }).join('');
  const avg = (k) => Math.round(advisors.reduce((s, a) => s + a[k], 0) / advisors.length);
  const compAvg = Math.round(advisors.reduce((s, a) => s + a.completion, 0) / advisors.length);
  const footer = `<tr style="font-weight:700; background:var(--muted);">
    <td>Team average</td>
    <td class="num">${avg('caseload')}</td>
    <td class="num">${avg('queue')}</td>
    <td class="num">${avg('median')} h</td>
    <td class="num">${avg('aging')}</td>
    <td class="num"><span class="chip ${compTone(compAvg)} num">${compAvg}%</span></td>
    <td></td>
  </tr>`;
  return `
    ${UI.pageHead('Advisors', 'Advisor-level completion, speed, and load in your school')}
    ${UI.asOfRow()}
    <p class="sm muted">Completion = approved ÷ caseload this term. Median in hours.</p>
    ${advisorDetailModal()}
    ${UI.tableWrap(
      ['Advisor', { label: 'Caseload', right: true }, { label: 'Queue', right: true }, { label: 'Median (h)', right: true }, { label: 'Aging', right: true }, { label: 'Completion', right: true }, ''],
      rows + footer,
    )}`;
};

App.views['/dean/analytics'] = function () {
  App.titles['/dean/analytics'] = ['Overview', 'Analytics'];
  const fs = gov().faculties;
  const series = fs.filter((f) => analyticsDepts.has(f.name)).map((f, i) => ({
    name: f.name, values: facultySeries(f, analyticsMetric), color: PALETTE[i % PALETTE.length],
  }));
  return `
    ${UI.pageHead('Analytics', 'Completion, speed, and aging across your faculty')}
    ${UI.asOfRow()}
    <div class="card col gap-3">
      <div class="row between wrap gap-2">
        ${metricTabs(analyticsMetric, 'analyticsMetric')}
        <div class="row gap-1 wrap">
          <span class="xs muted" style="margin-inline-end:4px;">Faculties:</span>
          ${fs.map((f) => {
            const on = analyticsDepts.has(f.name);
            const e = UI.esc(f.name);
            return `<button class="chip ${on ? 'info' : 'neutral'}" style="cursor:pointer; font:inherit;" onclick="analyticsDepts.has('${e}') ? analyticsDepts.delete('${e}') : analyticsDepts.add('${e}'); App.render();">${on ? '✓ ' : ''}${UI.esc(f.name)}</button>`;
          }).join('')}
        </div>
      </div>
      <h2>${analyticsMetric} · ${Store.s.term}</h2>
      ${series.length ? govLineChart(series, `${analyticsMetric} by faculty`) : '<p class="sm muted">Select at least one faculty to plot.</p>'}
      ${series.length ? `<div class="row gap-3 wrap">${series.map((s) => `<span class="swatch"><i style="background:${s.color}"></i> ${UI.esc(s.name)}</span>`).join('')}</div>` : ''}
      ${series.length ? `<p class="xs muted">Table alternative: ${series.map((s) => `${s.name}: ${s.values.join(', ')}`).join(' · ')}</p>` : ''}
    </div>`;
};

/* ---------- VP ---------- */

App.views['/vp'] = function () {
  App.titles['/vp'] = ['Overview'];
  const u = gov().university;
  const [d1, t1] = dl('▼ 1', 'destructive');
  const [d2, t2] = dl('▲ 2 h', 'warning');
  const [d3, t3] = dl('▲ 3', 'warning');
  return `
    ${UI.pageHead('Overview', 'University-wide direction', `<button class="btn outline sm" onclick="App.exportCsv()">Export CSV</button>`)}
    ${UI.asOfRow()}
    <div class="grid-3">
      ${UI.kpi('Completion', u.completion, '%', d1, t1, `vs ${u.completion - u.d}% in ${Store.s.prevTerm}`)}
      ${UI.kpi('Median decision', u.median, 'h', d2, t2, `vs ${u.median - u.dH} h in ${Store.s.prevTerm}`)}
      ${UI.kpi('Aging plans', u.aging, 'plans', d3, t3, `vs ${u.aging - u.dA} in ${Store.s.prevTerm}`)}
    </div>
    <div class="card col gap-2">
      <div class="row between wrap gap-2"><h2>Faculty watchlist (W-02)</h2>
        <a class="sm" href="#/vp/faculties">Open the scorecard</a></div>
      ${gov().alerts.map((a) => `
        <div class="row between wrap gap-2" style="border-top:1px solid var(--border); padding:12px 0; align-items:flex-start;">
          <div class="col gap-1" style="flex:1; min-width:260px;">
            <span class="sm" style="font-weight:600;">${UI.esc(a.rule)}</span>
            ${(a.breaches.length ? a.breaches : ['None this term']).map((b) => `<span class="sm muted">· ${UI.esc(b)}</span>`).join('')}
          </div>
          ${UI.chip(a.tone)}
          <button class="btn ghost sm" onclick="Store.toast('Watchlist rule editing ships with implementation (W-02).', 'info')">Edit</button>
        </div>`).join('')}
      <p class="sm muted">Aggregates live on Faculties; this page only shows direction and alerts.</p>
    </div>`;
};

function vpFacultyRow(f) {
  const e = UI.esc(f.name);
  const open = drilledFaculty === f.name;
  const comp = dl(sign(f.d), dirTone(f.d));
  const med = dl(sign(f.dH, 'h'), badTone(f.dH));
  const ag = dl(sign(f.dA), badTone(f.dA));
  return `<tr class="clickable" onclick="drilledFaculty = drilledFaculty === '${e}' ? null : '${e}'; App.render();">
    <td style="font-weight:500;">${UI.esc(f.name)}</td>
    <td class="num">${UI.fmt(f.caseload)}</td>
    <td class="num">${UI.fmt(f.approved)}</td>
    <td class="num">${f.completion}% <span class="chip ${comp[1]} num">${comp[0]}</span></td>
    <td class="num">${f.median} h <span class="chip ${med[1]} num">${med[0]}</span></td>
    <td class="num">${f.aging} <span class="chip ${ag[1]} num">${ag[0]}</span></td>
    <td>${UI.spark(f.spark, '#2563eb')}</td>
    <td class="num">${open ? '▾' : '▸'}</td>
  </tr>`;
}

function vpDeptRows(f) {
  return f.depts.map(([name, c], i) => `
    <tr>
      <td class="sm" style="padding-inline-start:36px;">↳ ${UI.esc(name)}</td>
      <td></td><td></td>
      <td class="num">${c}%</td>
      <td></td>
      <td class="num">${Math.max(0, f.aging - i)}</td>
      <td></td><td></td>
    </tr>`).join('');
}

App.views['/vp/faculties'] = function () {
  App.titles['/vp/faculties'] = ['Overview', 'Faculties'];
  const body = gov().faculties.flatMap((f) => {
    const rows = [vpFacultyRow(f)];
    if (drilledFaculty === f.name) rows.push(vpDeptRows(f));
    return rows;
  }).join('');
  return `
    ${UI.pageHead('Faculties', 'How faculties compare, which way they move')}
    ${UI.asOfRow()}
    ${drilledFaculty ? `<p class="sm muted"><a href="#" onclick="drilledFaculty = null; App.render(); return false;">University</a> › <b>${UI.esc(drilledFaculty)}</b></p>` : ''}
    ${UI.tableWrap(
      ['Faculty', { label: 'Caseload', right: true }, { label: 'Approved', right: true }, { label: 'Completion', right: true }, { label: 'Median', right: true }, { label: 'Aging', right: true }, 'Trend', ''],
      body,
    )}
    <p class="hint">Click a faculty to drill to its departments. Stops at Department (PR-15).</p>`;
};

App.views['/vp/trends'] = function () {
  App.titles['/vp/trends'] = ['Overview', 'Trends'];
  const fs = gov().faculties;
  const series = fs.map((f, i) => ({
    name: f.name, values: facultySeries(f, trendsMetric), color: PALETTE[i % PALETTE.length],
    opacity: isolatedFaculty && isolatedFaculty !== f.name ? 0.2 : 1, hollow: true,
  }));
  const uni = series[0].values.map((_, i) => {
    const vals = series.map((s) => s.values[i]);
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  });
  const chartSeries = series.concat([{ name: 'University average', values: uni, color: '#8b0000', dashed: true }]);
  return `
    ${UI.pageHead('Trends', 'Direction of travel for every faculty')}
    ${UI.asOfRow()}
    <div class="card col gap-3">
      <div class="row between wrap gap-2">
        ${metricTabs(trendsMetric, 'trendsMetric')}
        <span class="xs muted">2026F · partial term</span>
      </div>
      <h2>${trendsMetric} across faculties · ${Store.s.term}</h2>
      ${govLineChart(chartSeries, `${trendsMetric} across all faculties`)}
      <div class="col gap-1">
        ${fs.map((f, i) => {
          const e = UI.esc(f.name);
          const c = PALETTE[i % PALETTE.length];
          return `<span class="swatch"><i style="background:${c}"></i> ${UI.esc(f.name)}
            <button class="btn ghost sm" style="height:22px; padding:0 8px; font-size:11px;" onclick="isolatedFaculty = isolatedFaculty === '${e}' ? null : '${e}'; App.render();">${isolatedFaculty === f.name ? 'Show all' : 'Isolate'}</button></span>`;
        }).join('')}
        <span class="swatch"><i style="background:#8b0000"></i> University average (crimson = the institution)</span>
      </div>
      <p class="xs muted">Table alternative: ${chartSeries.map((s) => `${s.name}: ${s.values.join(', ')}`).join(' · ')}</p>
    </div>`;
};

/* ---------- notifications (shared anatomy with /app/notifications) ---------- */

function govNotifications() {
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
}

App.views['/dean/notifications'] = function () {
  App.titles['/dean/notifications'] = ['Notifications'];
  return UI.notificationsView();
};

App.views['/vp/notifications'] = function () {
  App.titles['/vp/notifications'] = ['Notifications'];
  return UI.notificationsView();
};
