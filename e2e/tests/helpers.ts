import type { Page } from '@playwright/test';

export const seedScenario = async (
  page: Page,
  scenario:
    | 'happy'
    | 'empty'
    | 'error'
    | 'permission-denied'
    | 'stale-sis'
    | 'registration-closed'
    | 'quota-exhausted',
) => {
  await page.addInitScript((value) => {
    window.sessionStorage.setItem('advaisor.scenario', value);
  }, scenario);
};
