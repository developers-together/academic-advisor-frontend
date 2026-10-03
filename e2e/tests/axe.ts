import { createRequire } from 'node:module';

import type { Page } from '@playwright/test';

const require = createRequire(import.meta.url);

type AxeNode = {
  target: string[];
  failureSummary: string | null;
};

export type AxeViolation = {
  id: string;
  impact: string | null;
  help: string;
  nodes: AxeNode[];
};

type AxeResults = {
  violations: AxeViolation[];
};

declare global {
  interface Window {
    axe: {
      run: (
        context: Document,
        options: { runOnly: { type: 'tag'; values: string[] } },
      ) => Promise<AxeResults>;
    };
  }
}

export const axeScan = async (page: Page): Promise<AxeViolation[]> => {
  await page.addScriptTag({
    path: require.resolve('axe-core/axe.min.js'),
  });
  const results = await page.evaluate(() =>
    window.axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
      },
    }),
  );
  return results.violations;
};

export const formatViolations = (violations: AxeViolation[]): string =>
  violations
    .map((violation) =>
      [
        `${violation.id} (${violation.impact ?? 'unknown impact'}): ${violation.help}`,
        ...violation.nodes.map(
          (node) =>
            `  ${node.target.join(' ')}\n  ${node.failureSummary ?? ''}`,
        ),
      ].join('\n'),
    )
    .join('\n');
