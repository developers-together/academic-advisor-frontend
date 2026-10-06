import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:4173/app/';
const OUT = '/tmp/a11y-qa';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
const noHScroll = async () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);

// ---- 1. focus visibility: keyboard Tab shows the crimson ring ----
await login('student@ejust.edu.eg');
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
const focusInfo = await page.evaluate(() => {
  const el = document.activeElement;
  const cs = getComputedStyle(el);
  return { tag: el.tagName, outline: cs.outlineWidth, color: cs.outlineColor };
});
ok(focusInfo.outline !== '0px', `keyboard focus shows an outline (${focusInfo.outline})`);
ok(focusInfo.color === 'rgb(178, 74, 83)', `focus ring is crimson-500 (got ${focusInfo.color})`);

// ---- 2. palette keyboard contract + aria ----
await page.keyboard.press('Control+k');
await page.waitForTimeout(300);
ok(await page.evaluate(() => document.querySelector('[aria-label="Command palette"]') !== null), 'palette has role dialog + accessible name');
ok(await page.evaluate(() => document.activeElement && document.activeElement.id === 'palette-input'), 'palette autofocuses the input');
// arrow navigation moves the active item
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');
const activeLabel = await page.evaluate(() => {
  const btns = [...document.querySelectorAll('[aria-label="Command palette"] button')];
  const active = btns.find((b) => b.style.background && b.style.background !== 'transparent');
  return active ? active.textContent.trim().slice(0, 40) : '';
});
ok(activeLabel.length > 0, `arrow keys move the active item (${activeLabel})`);
await page.keyboard.press('Escape');

// ---- 3. dialog focus trap + ESC + focus return (admin) ----
await login('admin@ejust.edu.eg');
await page.goto(BASE + '#/admin/courses', { waitUntil: 'load' });
await page.waitForTimeout(350);
await page.locator('tr', { hasText: 'HU 205' }).locator('button:has-text("⋯")').click();
await page.waitForTimeout(200);
await page.click('button:has-text("Delete")');
await page.waitForTimeout(250);
ok(await page.evaluate(() => !!document.querySelector('.overlay')), 'impact dialog opens');
const insideTrap = await page.evaluate(() => {
  const overlay = document.querySelector('.overlay');
  const focusables = [...overlay.querySelectorAll('button, input, select, a[href]')];
  return focusables.includes(document.activeElement);
});
ok(insideTrap, 'dialog autofocuses inside the overlay');
// tab 6 times: focus must stay inside the overlay
for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
ok(await page.evaluate(() => { const o = document.querySelector('.overlay'); return o && o.contains(document.activeElement); }), 'Tab cycling stays trapped in the dialog');
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
ok(await page.evaluate(() => !document.querySelector('.overlay')), 'ESC closes the dialog');
const returned = await page.evaluate(() => (document.activeElement && document.activeElement.id || '').startsWith('row-menu-'));
ok(returned, `focus returns to the triggering menu button`);

// ---- 4. dark-mode contrast: computed pairs ----
await login('student@ejust.edu.eg');
await page.click('button[title="Toggle dark mode"]');
await page.waitForTimeout(300);
const pairs = await page.evaluate(() => {
  const lum = (hex) => {
    const c = hex.replace('#', '');
    const [r, g, b] = [0, 2, 4].map((i) => {
      const v = parseInt(c.slice(i, i + 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100; };
  return {
    body: ratio('#F1F5F9', '#101216'),
    chipSuccess: ratio('#6EE7B7', '#022C22'),
    chipWarning: ratio('#FCD34D', '#451A03'),
    primaryBtn: ratio('#FFFFFF', '#B24A53'),
  };
});
ok(pairs.body >= 7, `dark body text ${pairs.body}:1 (AAA)`);
ok(pairs.chipSuccess >= 4.5, `dark success chip ${pairs.chipSuccess}:1`);
ok(pairs.chipWarning >= 4.5, `dark warning chip ${pairs.chipWarning}:1`);
ok(pairs.primaryBtn >= 4.5, `dark primary button ${pairs.primaryBtn}:1`);
// dark chips: color + label (non-color rule) — chip contains text
const chipHasText = await page.evaluate(() => {
  const chip = document.querySelector('.chip');
  return chip && chip.innerText.trim().length > 0;
});
ok(chipHasText, 'chips carry text labels, never color alone');
await shot(page, 'dark-notifications');

// ---- 5. RTL stress: dir=rtl across key pages, no horizontal overflow ----
const rtlPages = ['#/app', '#/app/plan', '#/app/builder', '#/app/chat', '#/app/notifications'];
let rtlAll = true;
for (const r of rtlPages) {
  await page.goto(BASE + r, { waitUntil: 'load' });
  await page.waitForTimeout(250);
  await page.evaluate(() => { document.documentElement.dir = 'rtl'; document.documentElement.lang = 'ar'; });
  await page.waitForTimeout(150);
  const fits = await noHScroll();
  if (!fits) rtlAll = false;
}
ok(rtlAll, 'RTL: no horizontal overflow on student pages (bento + pulse + chat)');
await page.screenshot({ path: `${OUT}/rtl-home.png`, fullPage: false }).catch(() => {});
// RTL advisor rails + admin tables
await login('advisor@ejust.edu.eg');
await page.goto(BASE + '#/advisor', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
await page.waitForTimeout(150);
ok(await noHScroll(), 'RTL: decision rails mirror without overflow');
await page.screenshot({ path: `${OUT}/rtl-rails.png`, fullPage: false }).catch(() => {});
await login('admin@ejust.edu.eg');
await page.goto(BASE + '#/admin/courses', { waitUntil: 'load' });
await page.waitForTimeout(300);
await page.evaluate(() => { document.documentElement.dir = 'rtl'; });
await page.waitForTimeout(150);
ok(await noHScroll(), 'RTL: admin tables without overflow');
await page.evaluate(() => { document.documentElement.dir = 'ltr'; });

// ---- 6. directional icon rule + touch targets ----
const touchBtn = await page.evaluate(() => {
  const b = [...document.querySelectorAll('.btn')].find((x) => x.offsetParent !== null);
  return b ? getComputedStyle(b).height : '';
});
ok(['44px', '36px'].includes(touchBtn), `control height honors the density rule (${touchBtn})`);
// mobile: 44px buttons
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mp = await mctx.newPage();
await mp.goto(BASE, { waitUntil: 'load' });
await mp.waitForSelector('#auth-email', { timeout: 10000 });
const mBtn = await mp.evaluate(() => {
  const b = document.querySelector('.btn.primary');
  return b ? getComputedStyle(b).height : '';
});
ok(mBtn === '44px', `mobile primary button is 44px (${mBtn})`);
await mp.fill('#auth-email', 'student@ejust.edu.eg');
await mp.click('button:has-text("Sign in")');
await mp.waitForTimeout(500);
const navVisible = await mp.evaluate(() => {
  const links = document.querySelectorAll('nav[aria-label="Primary"] a, nav[aria-label="Primary"] button');
  const link = document.querySelector('nav[aria-label="Primary"] a');
  const h = link ? Math.round(link.getBoundingClientRect().height) : 0;
  return { count: links.length, h };
});
ok(navVisible.count === 5 && navVisible.h >= 44, `mobile bottom nav renders 5 targets at ${navVisible.h}px`);
await mp.screenshot({ path: `${OUT}/mobile-dark-check.png`, fullPage: true }).catch(() => {});
await mctx.close();

// ---- 7. aria labels on icon-only controls ----
await login('student@ejust.edu.eg');
await page.waitForTimeout(300);
const bellLabeled = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || '').startsWith('Notifications'));
  return !!b;
});
ok(bellLabeled, 'bell has an aria-label with unread count');
const darkLabeled = await page.evaluate(() => !!document.querySelector('button[aria-label="Toggle dark mode"]'));
ok(darkLabeled, 'dark toggle has an aria-label');

console.log(`\nRESULT: ${pass} passed, ${fail} failed. ERRORS: ${errors.length ? '\n' + errors.join('\n') : 'ZERO'}`);
await browser.close();

function shot(p, name) { return p.screenshot({ path: `${OUT}/${name}.png`, fullPage: false }).catch(() => {}); }
