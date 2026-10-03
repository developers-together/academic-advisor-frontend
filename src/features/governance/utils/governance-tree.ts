import type { GovernanceNode } from '@/types/domain';

export type RateBand = 1 | 2 | 3 | 4;

export const rateBand = (rate: number): RateBand => {
  if (rate < 25) return 1;
  if (rate < 50) return 2;
  if (rate < 75) return 3;
  return 4;
};

export const sortByCompletionDesc = (
  nodes: GovernanceNode[],
): GovernanceNode[] =>
  [...nodes].sort((a, b) => {
    const aRate = a.metrics.completion_rate;
    const bRate = b.metrics.completion_rate;
    if (aRate === null && bRate === null) return 0;
    if (aRate === null) return 1;
    if (bRate === null) return -1;
    return bRate - aRate;
  });

export const findNode = (
  root: GovernanceNode,
  code: string,
): GovernanceNode | null => {
  if (root.code === code) return root;
  for (const child of root.children) {
    const match = findNode(child, code);
    if (match) return match;
  }
  return null;
};

export const scopedNodeOf = (
  root: GovernanceNode,
  nodeParam: string | null,
): GovernanceNode => {
  if (!nodeParam || nodeParam === root.code) return root;
  return findNode(root, nodeParam) ?? root;
};

export const pathToNode = (
  root: GovernanceNode,
  node: GovernanceNode,
): GovernanceNode[] => {
  const walk = (
    current: GovernanceNode,
    trail: GovernanceNode[],
  ): GovernanceNode[] | null => {
    const next = [...trail, current];
    if (current.code === node.code) return next;
    for (const child of current.children) {
      const found = walk(child, next);
      if (found) return found;
    }
    return null;
  };
  return walk(root, []) ?? [];
};

export type ChartAxisProps = {
  reversed: boolean;
  orientation: 'left' | 'right';
};

export const axisPropsFor = (direction: 'ltr' | 'rtl'): ChartAxisProps =>
  direction === 'rtl'
    ? { reversed: true, orientation: 'right' }
    : { reversed: false, orientation: 'left' };
