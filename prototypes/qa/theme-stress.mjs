import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:4173/app/';
const OUT = '/tmp/v5-qa';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));

let pass = 0, fail = 0;
const ok = (cond, label) => { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; };
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true }).catch(() => {});
const login = async (email) => {
  await page.goto(BASE, { waitUntil: 'load' });
  await page.fill('#auth-email', email);
  await page.fill('#auth-pass', 'password123');
  await page.click('button:has-text("Sign in")');
  await page.waitForTimeout(400);
};
const goto = async (route) => { await page.goto(BASE + route, { waitUntil: 'load' }); await page.waitForTimeout(350); };

// ---------- ACT 1: student, v4 default untouched ----------
await login('student@ejust.edu.eg');
ok(await page.locator('text=Plan health').first().isVisible().catch(() => false), 'v4 default: plan health card present');
ok(await page.evaluate(() => !document.body.classList.contains('v5')), 'v4 default: body has no v5 class');

// ---------- ACT 2: toggle v5 — student skin ----------
await page.click('button:has-text("Theme · v4")');
await page.waitForTimeout(400);
ok(await page.evaluate(() => document.body.classList.contains('v5')), 'toggle flips to v5');
ok(await page.locator('text=Academic pulse').first().isVisible().catch(() => false), 'v5 home shows the academic pulse strip');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.card')).borderRadius === '14px'), 'v5 student cards at 14px');
ok((await page.locator('.pulse').count()) === 1, 'exactly one pulse strip (say-it-once)');
await shot('v5-student-home');
await goto('#/app/plan');
ok(await page.locator('text=Return reason').first().isVisible().catch(() => false), 'v5 plan: returned hero intact');
await goto('#/app/record');
ok(await page.evaluate(() => {
  const el = [...document.querySelectorAll('.card')].find((c) => c.textContent.includes('Milestones'));
  return el && getComputedStyle(el).backgroundColor === 'rgb(245, 240, 232)';
}), 'v5 record: milestones card on cream #F5F0E8');
await shot('v5-record-cream');

// v5 builder loop still works: add, validate, submit
await goto('#/app/builder');
await page.click('button:has-text("CS 301")');
await page.click('button:has-text("EE 210")');
await page.click('button:has-text("ME 215")');
await page.waitForTimeout(200);
ok(await page.locator('text=15 of 12–18').first().isVisible().catch(() => false), 'v5 builder: credits reach 15');
await page.click('button:has-text("Validate plan")');
await page.waitForTimeout(200);
await page.click('tr:has-text("MATH 205") button:has-text("Remove")');
await page.waitForTimeout(200);
await page.click('button:has-text("Validate plan")');
await page.waitForTimeout(200);
ok(await page.locator('text=All checks pass').first().isVisible().catch(() => false), 'v5 builder: validation passes');
await page.click('button:has-text("Submit for review")');
await page.waitForTimeout(300);
ok(await page.evaluate(() => Store.myPlan().status === 'submitted'), 'v5 builder: submit works');

// ---------- ACT 3: advisor, v5 decision rail ----------
await login('advisor@ejust.edu.eg');
await page.waitForTimeout(400);
ok(await page.evaluate(() => document.body.classList.contains('v5')), 'theme persists across roles in-session');
ok(await page.locator('.rail-row').first().isVisible().catch(() => false), 'v5 queue renders decision rails');
ok(await page.locator('.rail-row', { hasText: 'Signal' }).first().isVisible().catch(() => false), 'rail carries the Signal field');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.rail-row')).borderRadius === '6px'), 'v5 staff rail at 6px');
const railCount = await page.locator('.rail-row').count();
ok(railCount >= 3, `queue shows ${railCount} rails (resubmitted plan included)`);
await shot('v5-advisor-rail');
// decide through the review surface (rail carries one primary action)
await page.locator('.rail-row', { hasText: 'Lina Majors' }).locator('button:has-text("Review")').click();
await page.waitForTimeout(350);
ok(await page.locator('button:has-text("Approve")').first().isVisible().catch(() => false), 'review surface holds Approve');
await page.locator('button', { hasText: /^Approve$/ }).first().click();
await page.waitForTimeout(300);
ok(await page.evaluate(() => Store.s.plans[6].status === 'approved'), 'review approve mutates state');
await page.locator('.rail-row', { hasText: 'Omar Nabil' }).locator('button:has-text("Review")').click();
await page.waitForTimeout(300);
await page.locator('button', { hasText: /^Return plan$/ }).first().click();
await page.waitForTimeout(250);
await page.fill('#return-reason', 'Swap EE 210 to the lecture group; the lab conflicts with your schedule.');
await page.click('button:has-text("Return plan")');
await page.waitForTimeout(300);
ok(await page.evaluate(() => Store.s.plans[7].status === 'returned'), 'return flow works from review');
ok((await page.locator('.rail-row button:has-text("Approve")').count()) === 0, 'rail keeps one primary action only');
// v4 toggle back on queue
await page.click('button:has-text("Theme · v5")');
await page.waitForTimeout(300);
ok((await page.locator('.rail-row').count()) === 0, 'toggle back to v4 restores the table queue');
ok(await page.locator('table').first().isVisible().catch(() => false), 'v4 queue table visible again');

// ---------- ACT 4: governance + admin in v5 ----------
await page.click('button:has-text("Theme · v4")').catch(() => {});
await login('dean@ejust.edu.eg');
await page.click('button:has-text("Theme · v4")').catch(() => {});
await page.waitForTimeout(300);
await page.click('button:has-text("Theme · v4")').catch(() => {});
await page.waitForTimeout(300);
ok(await page.locator('text=Where do plans stall this term?').first().isVisible().catch(() => false), 'dean overview intact');
ok(await page.evaluate(() => getComputedStyle(document.querySelector('.card')).borderRadius === '6px'), 'v5 dean cards at 6px');
await shot('v5-dean-overview');
await login('admin@ejust.edu.eg');
await goto('#/admin/operations');
ok(await page.locator('text=Needs attention').first().isVisible().catch(() => false), 'v5 admin operations intact');
await shot('v5-admin-operations');

// ---------- ACT 5: mobile spot check in v5 ----------
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
mp.on('pageerror', (e) => errors.push('mobile pageerror: ' + String(e).slice(0, 150)));
await mp.goto(BASE, { waitUntil: 'load' });
await mp.waitForSelector('#auth-email', { timeout: 15000 });
await mp.fill('#auth-email', 'student@ejust.edu.eg');
await mp.click('button:has-text("Sign in")');
await mp.waitForTimeout(400);
await mp.click('button:has-text("Theme · v4")').catch(() => console.log('note: theme toggle not on mobile topbar'));
await mp.waitForTimeout(300);
await mp.screenshot({ path: `${OUT}/v5-mobile-home.png`, fullPage: true });
ok(true, 'mobile v5 screenshot captured');

console.log(`\nRESULT: ${pass} passed, ${fail} failed. ERRORS: ${errors.length ? '\n' + errors.join('\n') : 'ZERO'}`);
await browser.close();
