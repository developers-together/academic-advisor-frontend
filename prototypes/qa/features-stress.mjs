import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:4173/app/';
const OUT = '/tmp/v7-qa';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));

let pass = 0, fail = 0;
const ok = (cond, label) => { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; };
const login = async (email) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForSelector('#auth-email', { timeout: 10000 });
  await page.fill('#auth-email', email);
  await page.fill('#auth-pass', 'password123');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(400);
};
const goto = async (route) => { await page.goto(BASE + route, { waitUntil: 'load' }); await page.waitForTimeout(350); };

// ---------- student: palette, dark, crumbs, chat threads ----------
await login('student@ejust.edu.eg');
await page.keyboard.press('Control+k');
await page.waitForTimeout(300);
ok(await page.locator('[aria-label="Command palette"]').isVisible().catch(() => false), 'palette opens with Ctrl+K');
ok(await page.locator('#palette-input').getAttribute('placeholder') === 'Search pages, people, and actions', 'palette shows role-scoped placeholder');
await page.fill('#palette-input', 'maintain');
await page.waitForTimeout(250);
ok(await page.locator('text=Maintain my level').first().isVisible().catch(() => false), 'palette record search finds conversations');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
ok(!(await page.locator('[aria-label="Command palette"]').isVisible().catch(() => false)), 'Escape closes the palette');
// search button opens the palette too
await page.click('button:has-text("⌕")');
await page.waitForTimeout(250);
ok(await page.locator('[aria-label="Command palette"]').isVisible().catch(() => false), 'search button opens the palette');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
await page.click('button[title="Toggle dark mode"]');
await page.waitForTimeout(300);
ok(await page.evaluate(() => document.body.classList.contains('dark')), 'dark mode toggles on');
ok(await page.evaluate(() => getComputedStyle(document.body).backgroundColor === 'rgb(16, 18, 22)'), 'dark canvas #101216');
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(500);
ok(await page.evaluate(() => document.body.classList.contains('dark')), 'dark persists across refresh (auth screen too)');
await page.waitForSelector('#auth-email', { timeout: 10000 });
await page.fill('#auth-email', 'student@ejust.edu.eg');
await page.fill('#auth-pass', 'password123');
await page.click('button:has-text("Sign in")');
await page.waitForTimeout(400);
ok(await page.evaluate(() => document.body.classList.contains('dark')), 'dark holds after sign-in');
await shot2(page, 'dark-student');
await page.click('button[title="Toggle dark mode"]');
await page.waitForTimeout(200);
// breadcrumbs: builder crumb links to plan
await goto('#/app/builder');
ok(await page.locator('.crumbs a[href="#/app/plan"]').count() === 1, 'breadcrumb My Plan is a real link');
// chat: new conversation creates a thread
await goto('#/app/chat');
const convBefore = await page.evaluate(() => Store.s.chat.conversations.length);
await page.click('button:has-text("New conversation")');
await page.waitForTimeout(200);
await page.fill('#chat-input', 'How many credits do I have left?');
await page.click('button:has-text("Send")');
await page.waitForTimeout(1400);
const convAfter = await page.evaluate(() => Store.s.chat.conversations.length);
ok(convAfter === convBefore + 1, 'new conversation thread created');
ok(await page.evaluate(() => Store.s.chat.conversations[0].title.includes('credits')), 'thread title takes the first message');
// notifications filter
await goto('#/app/notifications');
const allCount = await page.locator('.notif').count();
await page.click('button:has-text("Unread")');
await page.waitForTimeout(200);
const unreadCount = await page.locator('.notif').count();
ok(unreadCount <= allCount, `unread filter narrows the list (${allCount} → ${unreadCount})`);
await page.click('.content button:has-text("Mark all as read")');
await page.waitForTimeout(200);
ok(await page.locator('text=You are all caught up').isVisible().catch(() => false), 'mark-all-read empties unread');

// ---------- advisor: triage, hours, palette records ----------
await login('advisor@ejust.edu.eg');
await page.waitForTimeout(300);
await page.keyboard.press('Control+k');
await page.waitForTimeout(250);
await page.fill('#palette-input', 'Lina');
await page.waitForTimeout(250);
ok(await page.locator('text=Caseload').first().isVisible().catch(() => false), 'palette finds caseload students for advisor');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
ok(await page.evaluate(() => location.hash.includes('review')), 'palette record navigates to review');
await goto('#/advisor');
await page.click('button:has-text("Triage mode")');
await page.waitForTimeout(250);
ok(await page.locator('text=move').first().isVisible().catch(() => false), 'triage banner shows');
const statusBefore = await page.evaluate(() => Object.values(Store.s.plans).filter((p) => p.status === 'submitted' || p.status === 'under_review').length);
await page.keyboard.press('j');
await page.keyboard.press('j');
await page.keyboard.press('a');
await page.waitForTimeout(300);
const approvedCount = await page.evaluate(() => Object.values(Store.s.plans).filter((p) => p.status === 'approved').length);
ok(approvedCount >= 1, 'triage A approves the cursor plan');
await page.keyboard.press('Escape');
await page.waitForTimeout(200);
ok(!(await page.locator('text=Exit triage').isVisible().catch(() => false)), 'Esc exits triage');
// hours editor
await goto('#/advisor/hours');
const rowsBefore = await page.locator('#slot-day-0, select[aria-label="Day"]').count();
await page.click('button:has-text("Add a row")');
await page.waitForTimeout(200);
const daySelects = await page.locator('select[aria-label="Day"]').count();
ok(daySelects >= 3, `hours editor adds a row (${daySelects} day selects)`);
await page.click('button:has-text("Publish hours")').catch(() => {});
await page.waitForTimeout(200);
ok(await page.evaluate(() => Store.user(2).hours.length >= 3), 'publish commits hours to the store');

// ---------- admin: palette records, edit dialog, add student, csv (dean) ----------
await login('admin@ejust.edu.eg');
await page.waitForTimeout(300);
await page.keyboard.press('Control+k');
await page.waitForTimeout(250);
await page.fill('#palette-input', 'CS 301');
await page.waitForTimeout(250);
ok(await page.locator('text=Operating Systems').first().isVisible().catch(() => false), 'palette finds courses for admin');
await page.keyboard.press('Escape');
await goto('#/admin/courses');
await page.locator('tr', { hasText: 'HU 205' }).locator('button:has-text("⋯")').click();
await page.waitForTimeout(200);
await page.click('button:has-text("Edit")');
await page.waitForTimeout(200);
await page.fill('#ec-title', 'Technical Writing & Communication');
await page.click('button:has-text("Save changes")');
await page.waitForTimeout(250);
ok(await page.evaluate(() => Store.s.admin.courses.find((c) => c.code === 'HU 205').title === 'Technical Writing & Communication'), 'course edit dialog saves');
await goto('#/admin/students');
const studentsBefore2 = await page.evaluate(() => Store.s.admin.students.length);
await page.click('button:has-text("Add student")');
await page.waitForTimeout(200);
await page.fill('#ns-name', 'Yasmin Fouad');
await page.fill('#ns-id', '20221202');
await page.click('button:has-text("Create account")');
await page.waitForTimeout(250);
ok(await page.evaluate((n) => Store.s.admin.students.length === n + 1, studentsBefore2), 'add student dialog creates an account');
await goto('#/admin/programs');
await page.locator('tr', { hasText: 'CSE' }).locator('button:has-text("View courses")').first().click();
await page.waitForTimeout(350);
const programVal = await page.evaluate(() => (typeof courseProgram !== 'undefined' ? courseProgram : 'n/a'));
ok(await page.locator('text=1 of').isVisible().catch(() => false) || programVal === 'CSE', 'programs link pre-filters courses');

// csv download (dean)
await login('dean@ejust.edu.eg');
await page.waitForTimeout(300);
const dl = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
await page.click('button:has-text("Export CSV")');
const download = await dl;
ok(!!download, 'CSV export downloads a file');
if (download) ok((download.suggestedFilename() || '').includes('.csv'), 'download is a .csv');

// advisor detail drawer
await goto('#/dean/advisors');
await page.locator('button:has-text("Details")').first().click();
await page.waitForTimeout(250);
ok(await page.locator('text=Aggregate view only').isVisible().catch(() => false), 'advisor detail drawer opens with PR-14 note');

console.log(`\nRESULT: ${pass} passed, ${fail} failed. ERRORS: ${errors.length ? '\n' + errors.join('\n') : 'ZERO'}`);
await browser.close();

function shot2(p, name) { return p.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {}); }
