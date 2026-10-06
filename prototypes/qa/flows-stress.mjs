import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:4173/app/';
const OUT = '/tmp/replica-qa';
import fs from 'node:fs';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));

const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});
const expectText = async (text, label) => {
  try {
    await page.waitForSelector(`text=${text}`, { timeout: 4000 });
    console.log(`PASS ${label}`);
  } catch {
    console.log(`FAIL ${label} — missing text: ${text}`);
  }
};
const login = async (email) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.fill('#auth-email', email);
  await page.fill('#auth-pass', 'password123');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(400);
};

// 1 — student loop
await login('student@ejust.edu.eg');
await expectText('Plan health', 'student home renders');
await shot('01-student-home');
for (const r of ['#/app/plan', '#/app/builder', '#/app/record', '#/app/advisor', '#/app/chat', '#/app/notifications', '#/app/account']) {
  await page.goto(BASE + r, { waitUntil: 'load' });
  await page.waitForTimeout(250);
}
await page.goto(BASE + '#/app/plan', { waitUntil: 'load' });
await page.waitForTimeout(300);
await expectText('Return reason', 'returned hero on plan');
await shot('02-student-plan-returned');

// builder: add courses to reach 12 credits
await page.goto(BASE + '#/app/builder', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.click('button:has-text("CS 301")').catch(() => console.log('FAIL add CS 301'));
await page.click('button:has-text("EE 210")').catch(() => console.log('FAIL add EE 210'));
await page.click('button:has-text("ME 215")').catch(() => console.log('FAIL add ME 215'));
await page.waitForTimeout(200);
await page.waitForSelector('text=15 of 12–18', { timeout: 4000 }).then(() => console.log('PASS credits reach 15')).catch(() => console.log('FAIL credits reach 15'));
// validate: MATH 205 repeat must fail
await page.click('button:has-text("Validate plan")');
await page.waitForTimeout(200);
await expectText('1 check fail', 'repeat rule blocks MATH 205');
await shot('03-builder-validation-fails');
// remove flagged repeat
await page.click('tr:has-text("MATH 205") button:has-text("Remove")');
await page.click('button:has-text("Validate plan")');
await page.waitForTimeout(200);
await expectText('All checks pass', 'validation passes after fix');
await page.click('button:has-text("Submit for review")');
await page.waitForTimeout(300);
await expectText('Submitted', 'plan submitted');
await shot('04-student-plan-submitted');

// chat scripted AI
await page.goto(BASE + '#/app/chat', { waitUntil: 'load' });
await page.fill('#chat-input', 'Help me plan next semester');
await page.click('button:has-text("Send")');
await page.waitForTimeout(1300);
await expectText('Nothing has been submitted yet', 'AI proposal card renders');
await shot('05-chat-proposal');

// 2 — advisor loop
await login('advisor@ejust.edu.eg');
await expectText('Plans waiting on your decision', 'queue renders');
await shot('06-advisor-queue');
await page.locator('button', { hasText: /^Review$/ }).first().click();
await page.waitForTimeout(300);
await expectText('All checks pass', 'review shows live validation');
await shot('07-advisor-review');
await page.click('button:has-text("Approve")');
await page.waitForTimeout(300);
// return Omar
await page.goto(BASE + '#/advisor', { waitUntil: 'load' });
await page.waitForTimeout(250);
const rows = page.locator('tr', { hasText: 'Omar Nabil' });
await rows.locator('button:has-text("Return")').click();
await page.waitForTimeout(250);
await page.fill('#return-reason', 'Swap EE 210 to the lecture group; the lab conflicts with your schedule.');
await page.click('button:has-text("Return plan")');
await page.waitForTimeout(300);
await expectText('Plan returned with your reason', 'return flow toast');
await page.goto(BASE + '#/advisor/meetings', { waitUntil: 'load' });
await page.waitForTimeout(250);
await expectText('Today · Sun 12 Oct', 'meetings today strip');
await shot('08-advisor-meetings');

// 3 — student sees approval + checklist
await login('student@ejust.edu.eg');
await page.goto(BASE + '#/app/plan', { waitUntil: 'load' });
await page.waitForTimeout(300);
await expectText('Return reason', 'student sees returned plan on fresh session');
await page.goto(BASE + '#/app/notifications', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.waitForTimeout(500);
console.log('DEBUG HASH:', page.url(), '| ROLE:', await page.evaluate(() => Store.me()?.role).catch(() => '?'));
await page.locator('.content .notif .n-title', { hasText: 'Plan approved' }).first().waitFor({ timeout: 4000 })
  .then(() => console.log('PASS approval notification delivered'))
  .catch(() => console.log('FAIL approval notification delivered'));
await shot('09-student-plan-and-notifications');

// 4 — dean + vp
await login('dean@ejust.edu.eg');
await page.waitForTimeout(300);
await expectText('Where do plans stall this term?', 'dean overview');
await shot('10-dean-overview');
await page.goto(BASE + '#/vp/faculties', { waitUntil: 'load' }).catch(() => {});
await login('vp@ejust.edu.eg');
await page.goto(BASE + '#/vp/faculties', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.click('tr:has-text("Mechanical Power")').catch((e) => console.log('FAIL drill click'));
await page.waitForTimeout(250);
await expectText('Thermal Power', 'VP inline drill shows departments');
await shot('11-vp-scorecard-drill');

// 5 — admin
await login('admin@ejust.edu.eg');
await page.goto(BASE + '#/admin/operations', { waitUntil: 'load' });
await page.waitForTimeout(250);
await expectText('Needs attention', 'operations landing renders (was 404)');
await shot('12-admin-operations');
await page.goto(BASE + '#/admin/courses', { waitUntil: 'load' });
await page.waitForTimeout(250);
const courseRow = page.locator('tr', { hasText: 'HU 205' });
await courseRow.locator('button:has-text("⋯")').click();
await page.waitForTimeout(200);
await page.click('button:has-text("Delete")');
await page.waitForTimeout(200);
await expectText('Delete HU 205?', 'impact dialog opens');
await page.click('button:has-text("Delete course")');
await page.waitForTimeout(200);
await shot('13-admin-courses');
// staff self-delete guard
await page.goto(BASE + '#/admin/staff', { waitUntil: 'load' });
await page.waitForTimeout(250);
const selfRow = page.locator('tr', { hasText: 'Mona Admin' });
await selfRow.locator('button:has-text("⋯")').click();
await page.waitForTimeout(200);
await page.click('button:has-text("Delete")');
await page.waitForTimeout(200);
await expectText('You cannot delete your own account.', 'self-delete guard');

// 6 — permission guard
await login('student@ejust.edu.eg');
await page.goto(BASE + '#/advisor', { waitUntil: 'load' });
await page.waitForTimeout(300);
await expectText('This area is for', 'permission panel for cross-role hit');

await browser.close();
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'ZERO CONSOLE ERRORS');
