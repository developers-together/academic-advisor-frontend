/* Advisor full replica — data store + mutations.
   Throwaway prototype. In-memory only; refresh resets the world.
   All mutations call App.render() so every surface stays truthful. */

const now = () => new Date('2026-10-06T14:00:00');

const seed = () => ({
  me: null,
  theme: (typeof localStorage !== 'undefined' && localStorage.getItem('proto-theme')) || 'v4',
  term: '2026F',
  prevTerm: '2025F',
  asOf: '05 Oct, 14:00',
  firstRunDismissed: false,

  users: [
    { id: 1, role: 'student', name: 'Sara Student', email: 'student@ejust.edu.eg', pass: 'password123', studentId: '20210432', faculty: 'Engineering', cgpa: 3.2, creditsEarned: 96, creditsRemaining: 60, curriculumTotal: 156, advisorId: 2 },
    { id: 2, role: 'advisor', name: 'Amr Advisor', email: 'advisor@ejust.edu.eg', pass: 'password123', title: 'Senior Academic Advisor · CSE', office: 'Building 3, Room 2140', hours: [['Sunday', '10:00', '12:00'], ['Tuesday', '13:00', '15:00']] },
    { id: 3, role: 'dean', name: 'Dalia Dean', email: 'dean@ejust.edu.eg', pass: 'password123', scope: 'Engineering Applied School' },
    { id: 4, role: 'vp', name: 'Victor VP', email: 'vp@ejust.edu.eg', pass: 'password123' },
    { id: 5, role: 'admin', name: 'Mona Admin', email: 'admin@ejust.edu.eg', pass: 'password123' },
    { id: 6, role: 'student', name: 'Lina Majors', studentId: '20210433', faculty: 'Engineering', cgpa: 2.9, advisorId: 2, planState: 'submitted' },
    { id: 7, role: 'student', name: 'Omar Nabil', studentId: '20210871', faculty: 'Engineering', cgpa: 3.4, advisorId: 2, planState: 'submitted' },
    { id: 8, role: 'student', name: 'Mona Fathy', studentId: '20220914', faculty: 'Engineering', cgpa: 3.1, advisorId: 2, planState: 'under_review', hasUnmetMeeting: true },
    { id: 9, role: 'student', name: 'Karim Adel', studentId: '20220560', faculty: 'Engineering', cgpa: 2.4, advisorId: 2, planState: 'submitted' },
  ],

  completed: ['CS 101', 'MATH 101', 'EE 110', 'HU 101'],

  catalog: {
    'CS 201': { title: 'Data Structures', credits: 3, prereq: ['CS 101'], sections: ['Lecture 01', 'Lecture 02'] },
    'CS 301': { title: 'Operating Systems', credits: 3, prereq: ['CS 201'], sections: ['Lecture 01', 'Lecture 02'] },
    'MATH 205': { title: 'Linear Algebra', credits: 3, prereq: [], repeatOf: 'MATH 101', sections: ['Lecture 01'] },
    'EE 210': { title: 'Circuits', credits: 3, prereq: ['EE 110'], sections: ['Lecture 01', 'Lab 11'] },
    'ME 215': { title: 'Thermodynamics', credits: 3, prereq: ['MATH 101'], sections: ['Lecture 02'] },
    'HU 205': { title: 'Technical Writing', credits: 3, prereq: ['HU 101'], sections: ['Lecture 01'] },
  },

  plans: {
    1: {
      term: '2026F', status: 'returned',
      courses: [
        { code: 'CS 201', group: 'Lecture', section: '01' },
        { code: 'MATH 205', group: 'Lecture', section: '01' },
      ],
      comments: [
        { author: 'Amr Advisor', body: 'Same as the reason: fix the load, drop the flagged repeat, resubmit. I approve same-day once the checks pass.', at: '05 Oct, 20:21' },
      ],
      returnReason: 'Drop MATH 205 this term — the repeat rule flags it against MATH 101 timing. Add courses to reach the 12-credit minimum, then resubmit.',
      returnAt: '05 Oct, 20:20', seen: false, submittedAt: '30 Sep', decidedAt: null,
    },
    6: { term: '2026F', status: 'submitted', courses: [{ code: 'CS 201', group: 'Lecture', section: '02' }, { code: 'CS 301', group: 'Lecture', section: '01' }, { code: 'EE 210', group: 'Lab', section: '11' }, { code: 'ME 215', group: 'Lecture', section: '02' }, { code: 'HU 205', group: 'Lecture', section: '01' }], comments: [], submittedAt: '01 Oct', waitingDays: 5, aging: true, lastUpdate: '2h ago', note: 'Second submission, repeat fixed' },
    7: { term: '2026F', status: 'submitted', courses: [{ code: 'CS 201', group: 'Lecture', section: '02' }, { code: 'EE 210', group: 'Lecture', section: '01' }], comments: [], submittedAt: '03 Oct', waitingDays: 3, aging: false, lastUpdate: 'Yesterday', note: 'First submission' },
    8: { term: '2026F', status: 'under_review', courses: [{ code: 'ME 215', group: 'Lecture', section: '02' }], comments: [], submittedAt: '04 Oct', waitingDays: 2, aging: false, lastUpdate: '4h ago', note: '' },
    9: { term: '2026F', status: 'submitted', courses: [{ code: 'CS 201', group: 'Lecture', section: '01' }, { code: 'HU 205', group: 'Lecture', section: '01' }], comments: [], submittedAt: '05 Oct', waitingDays: 1, aging: false, lastUpdate: '35m ago', note: 'Added CS 201 section 02' },
  },

  meetings: [
    { id: 1, studentId: 1, advisorId: 2, status: 'confirmed', reason: 'course_selection', note: '', direction: 'student', at: 'Sun 12 Oct · 10:00–10:30', where: 'Building 3, Room 2140', selected: true },
    { id: 2, studentId: 6, advisorId: 2, status: 'awaiting', reason: 'credit_overload', direction: 'student', note: 'Second submission question', slots: [{ label: 'Sun 12 Oct · 10:00', booked: false }, { label: 'Sun 12 Oct · 10:30', booked: true, why: 'Booked — CS 301 lecture' }], at: null },
    { id: 3, studentId: 8, advisorId: 2, status: 'confirmed', reason: 'academic_standing', direction: 'advisor', at: 'Sun 12 Oct · 11:00–11:30', where: 'Building 3, Room 2140' },
  ],

  advisorSlots: [
    { label: 'Sun 12 Oct · 10:00', free: false }, { label: 'Sun 12 Oct · 10:30', free: false },
    { label: 'Sun 12 Oct · 11:00', free: false }, { label: 'Mon 13 Oct · 11:00', free: true },
    { label: 'Mon 13 Oct · 11:30', free: true }, { label: 'Tue 14 Oct · 13:00', free: true },
  ],

  notifications: [
    { id: 1, to: 'student', icon: '↩', tone: 'returned', title: 'Plan returned', body: 'Amr Advisor returned your plan with feedback.', time: '05 Oct, 20:20', read: false, action: { label: 'Review plan', route: '#/app/plan' } },
    { id: 2, to: 'student', icon: '🕐', tone: 'info', title: 'Meeting proposal', body: 'Pick a time for your meeting with Amr Advisor.', time: '05 Oct, 16:02', read: false, action: { label: 'Pick a time', route: '#/app/advisor' } },
    { id: 3, to: 'student', icon: '✓', tone: 'success', title: 'Registration window opened', body: 'Registration for 2026F is open until 16 Oct.', time: '03 Oct', read: false, action: { label: 'Open my plan', route: '#/app/plan' } },
    { id: 4, to: 'student', icon: '✓', tone: 'neutral', title: 'Plan approved', body: '2025F plan approved and registered.', time: '02 Oct', read: true, action: { label: 'Open my plan', route: '#/app/plan' } },
    { id: 5, to: 'advisor', icon: '📥', tone: 'info', title: 'Plan submitted', body: 'Karim Adel submitted a plan for 2026F.', time: '35m ago', read: false, action: { label: 'Open queue', route: '#/advisor' } },
    { id: 6, to: 'advisor', icon: '⏱', tone: 'warning', title: 'Plan aging', body: 'Lina Majors waits 5 days, past the threshold.', time: '08:00', read: false, action: { label: 'Open queue', route: '#/advisor' } },
    { id: 7, to: 'advisor', icon: '📅', tone: 'info', title: 'Meeting requested', body: 'Lina Majors requests a meeting about credit load.', time: 'Yesterday', read: true, action: { label: 'Open meetings', route: '#/advisor/meetings' } },
    { id: 8, to: 'dean', icon: '⏱', tone: 'warning', title: 'Aging threshold crossed', body: 'Design & Production completion is 58%, below 60%.', time: '08:00', read: false, action: { label: 'Open advisors', route: '#/dean/advisors' } },
    { id: 9, to: 'dean', icon: '▲', tone: 'success', title: 'Completion recovered', body: 'Computer & Systems is back above 65%.', time: 'Yesterday', read: true, action: { label: 'Open overview', route: '#/dean' } },
    { id: 10, to: 'vp', icon: '▼', tone: 'warning', title: 'Faculty watchlist', body: 'Education median decision time has no data this term.', time: '08:00', read: false, action: { label: 'Open scorecard', route: '#/vp/faculties' } },
    { id: 11, to: 'admin', icon: '⚠', tone: 'warning', title: 'Pending bindings', body: '3 students await SIS binding.', time: '08:00', read: false, action: { label: 'Open users', route: '#/admin/students' } },
    { id: 12, to: 'admin', icon: '⏳', tone: 'info', title: 'Window closing soon', body: '2026F closes in 11 days.', time: '07:30', read: false, action: { label: 'Open windows', route: '#/admin/windows' } },
  ],

  checklist: [
    { label: 'Register CS 201 · Lecture 01 in the SIS', done: true },
    { label: 'Register MATH 101 · Lecture 03 in the SIS', done: true },
    { label: 'Register EE 210 · Lab 11 in the SIS', done: false },
    { label: 'Register ME 215 · Lecture 02 in the SIS', done: false },
  ],

  governance: {
    faculties: [
      { name: 'Computer & Systems', completion: 66, d: 2, median: 22, dH: -2, aging: 4, dA: -2, caseload: 620, approved: 409, spark: [58, 60, 61, 64, 66], depts: [['Intelligent Systems', 68], ['Software Engineering', 65], ['Data Science', 64]] },
      { name: 'Mechanical Power', completion: 63, d: 1, median: 25, dH: 1, aging: 6, dA: 0, caseload: 480, approved: 302, spark: [60, 61, 60, 62, 63], depts: [['Thermal Power', 64], ['Mechanical Design', 62], ['Production', 63]] },
      { name: 'Electronics', completion: 61, d: -3, median: 27, dH: 3, aging: 8, dA: 2, caseload: 450, approved: 274, spark: [66, 65, 64, 63, 61], depts: [['Microelectronics', 62], ['Communications', 60]] },
      { name: 'Architecture', completion: 59, d: -2, median: 31, dH: 4, aging: 9, dA: 1, caseload: 380, approved: 224, spark: [63, 62, 61, 61, 59], depts: [['Architectural Design', 60], ['Urban Planning', 58]] },
      { name: 'Design & Production', completion: 58, d: -4, median: 34, dH: 5, aging: 11, dA: 3, caseload: 350, approved: 203, spark: [65, 63, 62, 60, 58], depts: [['Industrial Design', 58], ['Textile', 57]] },
      { name: 'Energy Resources', completion: 64, d: 0, median: 24, dH: 0, aging: 5, dA: -1, caseload: 420, approved: 269, spark: [63, 64, 63, 64, 64], depts: [['Renewables', 65], ['Petroleum', 63]] },
      { name: 'Humanities & Management', completion: 71, d: 1, median: 18, dH: -1, aging: 2, dA: -1, caseload: 300, approved: 213, spark: [68, 69, 70, 70, 71], depts: [['Management', 72], ['Humanities', 70]] },
    ],
    alerts: [
      { rule: 'Completion drops below 60% → notify dean', tone: 'warning', breaches: ['Design & Production · 58% · today'] },
      { rule: 'Median decision time above 48h → notify dean', tone: 'neutral', breaches: [] },
      { rule: 'Faculty aging above 120 plans → notify VP', tone: 'info', breaches: ['None this term'] },
    ],
    university: { completion: 62, d: -1, median: 26, dH: 2, aging: 45, dA: 3 },
  },

  admin: {
    courses: [
      { code: 'CS 101', title: 'Intro to Computing', credits: 3, program: 'CSE', updated: '12 Sep' },
      { code: 'CS 201', title: 'Data Structures', credits: 3, program: 'CSE', updated: '12 Sep' },
      { code: 'CS 301', title: 'Operating Systems', credits: 3, program: 'CSE', updated: '01 Oct' },
      { code: 'MATH 101', title: 'Calculus I', credits: 3, program: 'Common', updated: '12 Sep' },
      { code: 'MATH 205', title: 'Linear Algebra', credits: 3, program: 'Common', updated: '12 Sep' },
      { code: 'EE 210', title: 'Circuits', credits: 3, program: 'EE', updated: '20 Sep' },
      { code: 'ME 215', title: 'Thermodynamics', credits: 3, program: 'MEP', updated: '20 Sep' },
      { code: 'HU 205', title: 'Technical Writing', credits: 3, program: 'Common', updated: '12 Sep' },
    ],
    totalCourses: 42,
    programs: [
      { code: 'CSE', title: 'Computer Science & Engineering', courses: 18 },
      { code: 'EE', title: 'Electrical Engineering', courses: 16 },
    ],
    staff: [
      { name: 'Amr Advisor', role: 'Advisor', email: 'advisor@ejust.edu.eg' },
      { name: 'Dalia Dean', role: 'Dean', email: 'dean@ejust.edu.eg' },
      { name: 'Victor VP', role: 'Vice President', email: 'vp@ejust.edu.eg' },
      { name: 'Mona Admin', role: 'Administrator', email: 'admin@ejust.edu.eg' },
    ],
    students: [
      { id: 1, name: 'Sara Student', binding: 'bound', status: 'active', assigned: true },
      { id: 6, name: 'Lina Majors', binding: 'bound', status: 'active', assigned: true },
      { id: 7, name: 'Omar Nabil', binding: 'pending', status: 'active', assigned: false },
      { id: 8, name: 'Mona Fathy', binding: 'bound', status: 'active', assigned: true },
      { id: 9, name: 'Karim Adel', binding: 'failed', status: 'suspended', assigned: false },
    ],
    windows: [
      { term: '2026F', opens: '20 Sep 2026', closes: '16 Oct 2026', active: true },
    ],
    ai: { quota: 25, enabled: true },
    rules: [
      { title: 'Credit load 12–18', body: 'Fall and spring plans carry 12 to 18 credits (REG-001).' },
      { title: 'Summer cap 6', body: 'Summer plans carry at most 6 credits (SUMM-001).' },
      { title: 'Standing limit', body: 'CGPA below 2.00 caps the load at 12 credits (PROB-001).' },
    ],
    agingDays: 3,
    unassigned: 2, pendingBindings: 2,
  },

  chat: { conversations: [{ id: 1, title: 'Maintain my level', snippet: 'A load of 12 to 15 credits…', at: '02 Oct', goal: 'maintain' }], openId: null, messages: {} },
});

/* ---------- Store ---------- */

const Store = {
  s: seed(),
  listeners: [],

  onChange(fn) { this.listeners.push(fn); },
  emit() { this.listeners.forEach((fn) => fn()); },

  /* auth */
  login(email, pass) {
    const u = this.s.users.find((x) => x.email === email && x.pass === pass);
    if (!u) return false;
    this.s.me = u.id;
    this.emit();
    return true;
  },
  me() { return this.s.users.find((x) => x.id === this.s.me) || null; },
  logout() { this.s.me = null; this.emit(); },
  user(id) { return this.s.users.find((x) => x.id === id) || null; },

  /* plan (student) */
  myPlan() { const me = this.me(); return me ? this.s.plans[me.id] : null; },
  courseOf(code) { return this.s.catalog[code]; },
  creditsOf(plan) { return plan.courses.reduce((sum, c) => sum + (this.courseOf(c.code)?.credits || 0), 0); },

  validatePlan(plan) {
    const errors = [];
    const credits = this.creditsOf(plan);
    if (credits < 12) errors.push({ line: null, msg: `Credit load is ${credits}. The minimum for a fall or spring term is 12.` });
    if (credits > 18) errors.push({ line: null, msg: `Credit load is ${credits}. The maximum is 18.` });
    for (const line of plan.courses) {
      const cat = this.courseOf(line.code);
      for (const pre of cat.prereq || []) {
        const done = this.s.completed.includes(pre);
        const planned = plan.courses.some((c) => c.code === pre);
        if (!done && !planned) errors.push({ line: line.code, msg: `${line.code} requires ${pre} first.` });
      }
      if (cat.repeatOf && this.s.completed.includes(cat.repeatOf) && plan.courses.some((c) => c.code === line.code)) {
        errors.push({ line: line.code, msg: `${line.code} repeats ${cat.repeatOf}. The repeat rule blocks it this term.` });
      }
    }
    return errors;
  },

  addCourse(code) {
    const plan = this.myPlan();
    if (!plan || !['draft', 'returned'].includes(plan.status)) return { ok: false, msg: 'The plan is locked while under review.' };
    if (plan.courses.some((c) => c.code === code)) return { ok: false, msg: `${code} is already in the plan.` };
    const cat = this.courseOf(code);
    if (!cat) return { ok: false, msg: 'Unknown course.' };
    const missing = (cat.prereq || []).filter((pre) => !this.s.completed.includes(pre) && !plan.courses.some((c) => c.code === pre));
    if (missing.length) return { ok: false, msg: `${code} cannot be added: complete ${missing.join(', ')} first.`, why: true };
    plan.courses.push({ code, group: (cat.sections[0] || 'Lecture').split(' ')[0], section: (cat.sections[0] || 'Lecture 01').split(' ').pop() });
    this.emit();
    return { ok: true };
  },

  removeCourse(code) {
    const plan = this.myPlan();
    if (!plan) return;
    plan.courses = plan.courses.filter((c) => c.code !== code);
    this.emit();
  },

  validateNow() {
    const plan = this.myPlan();
    plan.validation = this.validatePlan(plan);
    plan.validatedAt = 'just now';
    this.emit();
    return plan.validation;
  },

  submitPlan() {
    const plan = this.myPlan();
    const errors = this.validatePlan(plan);
    if (errors.length) { plan.validation = errors; this.emit(); return { ok: false, errors }; }
    plan.status = 'submitted';
    plan.submittedAt = 'today';
    plan.waitingDays = 0; plan.aging = false; plan.lastUpdate = 'just now'; plan.note = 'Resubmitted after fixes';
    this.pushNotif('advisor', '📥', 'info', 'Plan submitted', `${this.me().name} resubmitted the 2026F plan.`, { label: 'Open queue', route: '#/advisor' });
    this.emit();
    return { ok: true };
  },

  approvePlan(studentId) {
    const plan = this.s.plans[studentId];
    plan.status = 'approved';
    plan.decidedAt = 'today';
    this.pushNotif('student', '✓', 'success', 'Plan approved', 'Your 2026F plan is approved. Register in the SIS, then tick the checklist.', { label: 'Open my plan', route: '#/app/plan' });
    this.emit();
  },

  returnPlan(studentId, reason) {
    const plan = this.s.plans[studentId];
    plan.status = 'returned';
    plan.returnReason = reason;
    plan.returnAt = 'just now';
    plan.seen = false;
    if (plan.comments) plan.comments.push({ author: 'Amr Advisor', body: reason, at: 'just now' });
    this.pushNotif('student', '↩', 'returned', 'Plan returned', 'Your plan was returned with feedback.', { label: 'Review plan', route: '#/app/plan' });
    this.emit();
  },

  seenReturn() { const p = this.myPlan(); if (p) { p.seen = true; this.emit(); } },
  addComment(body) {
    const p = this.s.plans[this.s.me];
    if (p) { (p.comments = p.comments || []).push({ author: 'You', body, at: 'just now' }); this.emit(); }
  },
  toggleRegistered(i) { this.s.checklist[i].done = !this.s.checklist[i].done; this.emit(); },

  /* meetings */
  myMeetings() { const me = this.me(); return this.s.meetings.filter((m) => (me.role === 'student' && m.studentId === me.id) || (me.role === 'advisor' && m.advisorId === me.id)); },
  requestMeeting(reason, note, slot) {
    const me = this.me();
    this.s.meetings.push({ id: Date.now(), studentId: me.id, advisorId: me.advisorId, status: 'requested', reason, note, direction: 'student', requestedSlot: slot, at: null });
    this.pushNotif('advisor', '📅', 'info', 'Meeting requested', `${me.name} requests a meeting (${reason}).`, { label: 'Open meetings', route: '#/advisor/meetings' });
    this.emit();
  },
  confirmMeetingSlot(id, slotLabel) {
    const m = this.s.meetings.find((x) => x.id === id);
    m.status = 'confirmed'; m.at = slotLabel.replace(' · ', ' · ') + '–' + '30 min later'; m.where = 'Building 3, Room 2140';
    this.pushNotif('student', '✓', 'success', 'Meeting confirmed', `${m.at}.`, { label: 'Open My Advisor', route: '#/app/advisor' });
    this.emit();
  },
  proposeTime(id, label) { const m = this.s.meetings.find((x) => x.id === id); m.status = 'awaiting'; m.proposed = label; this.emit(); },
  declineMeeting(id) { const m = this.s.meetings.find((x) => x.id === id); m.status = 'declined'; this.emit(); },
  cancelMeeting(id) { const m = this.s.meetings.find((x) => x.id === id); m.status = 'cancelled'; this.emit(); },
  completeMeeting(id) { const m = this.s.meetings.find((x) => x.id === id); m.status = 'completed'; this.emit(); },
  acceptProposal(id) { const m = this.s.meetings.find((x) => x.id === id); m.status = 'confirmed'; m.at = m.proposed || m.slots[0].label; this.emit(); },

  /* notifications */
  notifsFor() { const me = this.me(); return this.s.notifications.filter((n) => n.to === me.role); },
  markRead(id) { const n = this.s.notifications.find((x) => x.id === id); if (n) n.read = true; this.emit(); },
  markAllRead() { const me = this.me(); this.s.notifications.filter((n) => n.to === me.role).forEach((n) => (n.read = true)); this.emit(); },
  pushNotif(to, icon, tone, title, body, action) { this.s.notifications.unshift({ id: Date.now(), to, icon, tone, title, body, time: 'just now', read: false, action }); },

  /* admin */
  addCourseAdmin(c) { this.s.admin.courses.unshift(c); this.s.admin.totalCourses += 1; this.emit(); },
  courseImpact(code) {
    return ['Used in 2 programs (CSE, Common)', 'Referenced by 14 plans this term', '3 rules mention it'];
  },
  deleteCourse(code) { this.s.admin.courses = this.s.admin.courses.filter((c) => c.code !== code); this.s.admin.totalCourses -= 1; this.emit(); },
  toggleWindow(term) { const w = this.s.admin.windows.find((x) => x.term === term); w.active = !w.active; this.emit(); },
  addWindow(term, opens, closes) { this.s.admin.windows.push({ term, opens, closes, active: false }); this.emit(); },
  saveAI(quota, enabled) { this.s.admin.ai = { quota, enabled }; this.emit(); },
  saveAging(days) { this.s.admin.agingDays = days; this.emit(); },
  setUserStatus(id, status) { const u = this.s.admin.students.find((x) => x.id === id); u.status = status; this.emit(); },
  assignStudent(id, advisor) { const u = this.s.admin.students.find((x) => x.id === id); u.assigned = true; u.advisor = advisor; this.emit(); },
  importResult: null,
  runImport() { this.s.importResult = { matched: 28, bound: 25, failed: [{ id: '20221202', why: 'No SIS record' }, { id: '20220311', why: 'Duplicate row' }, { id: '20220487', why: 'Unknown program' }] }; this.emit(); },
  commitImport() { this.s.importResult = null; this.emit(); },

  /* chat (scripted AI) */
  chatAsk(text) {
    const me = this.me();
    const id = this.s.chat.openId || (this.s.chat.openId = Date.now());
    const thread = (this.s.chat.messages[id] = this.s.chat.messages[id] || []);
    thread.push({ role: 'user', text });
    this.emit();
    const reply = this.aiReply(text);
    setTimeout(() => { thread.push(reply); this.emit(); }, 900);
  },
  aiReply(text) {
    const t = text.toLowerCase();
    if (t.includes('credit')) return { role: 'ai', card: { kind: 'summary', title: 'Your progress', lines: ['CGPA 3.2 on a 4.0 scale', '96 credits earned · 60 remaining of 156', '40% of your curriculum is complete'] } };
    if (t.includes('cs 402') || t.includes('blocked')) return { role: 'ai', card: { kind: 'course', code: 'CS 402', title: 'Advanced Algorithms', status: 'Locked', why: 'CS 402 requires CS 301 first. Add CS 301 to a plan and pass it, then CS 402 unlocks.', action: null } };
    if (t.includes('plan') || t.includes('register') || t.includes('next')) return { role: 'ai', card: { kind: 'proposal', courses: ['CS 301', 'EE 210', 'ME 215'], reasoning: 'These three with CS 201 reach 12 credits, satisfy CS 301’s prerequisite chain, and avoid the MATH 205 repeat conflict.', total: '12 of 12–18 credits' } };
    if (t.includes('advisor') || t.includes('discuss')) return { role: 'ai', card: { kind: 'meeting', text: 'Ask Amr Advisor about your repeat options for MATH 205. Your next open slot is Mon 13 Oct, 11:00.' } };
    return { role: 'ai', text: 'Here is what I can do: explain rules, explain requirements, recommend courses, draft a plan, explain a blocked line, and summarise your standing. The university rules and your record are my source; your advisor owns every decision.' };
  },
  aiAddToPlan(code) { const r = this.addCourse(code); if (!r.ok) this.toast(r.msg, 'destructive'); },
  chatOpen(id) { this.s.chat.openId = id; this.emit(); },
  chatNew() { this.s.chat.openId = null; this.emit(); },

  toastMsg: null,
  toast(msg, kind = 'success') { this.s.toastMsg = { msg, kind, at: Date.now() }; this.emit(); setTimeout(() => { this.s.toastMsg = null; this.emit(); }, 2600); },
  setTerm(t) { this.s.term = t; this.emit(); },
  setTheme(t) { this.s.theme = t; try { localStorage.setItem('proto-theme', t); } catch {} this.emit(); },
  theme() { return this.s.theme || 'v4'; },
};
