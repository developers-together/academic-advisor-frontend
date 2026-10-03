import { describe, expect, test } from 'vitest';

import { governanceNode } from '@/testing/governance-tree';

import {
  axisPropsFor,
  findNode,
  pathToNode,
  rateBand,
  scopedNodeOf,
  sortByCompletionDesc,
} from './governance-tree';

describe('rateBand', () => {
  test('bands absolute completion rates into the four quartiles', () => {
    expect(rateBand(0)).toBe(1);
    expect(rateBand(24.9)).toBe(1);
    expect(rateBand(25)).toBe(2);
    expect(rateBand(49.9)).toBe(2);
    expect(rateBand(50)).toBe(3);
    expect(rateBand(74.9)).toBe(3);
    expect(rateBand(75)).toBe(4);
    expect(rateBand(100)).toBe(4);
  });
});

describe('sortByCompletionDesc', () => {
  test('orders by completion descending and keeps nulls last', () => {
    const nodes = [
      governanceNode({
        level: 'faculty',
        nameEn: 'Null',
        metrics: { completion_rate: null },
      }),
      governanceNode({
        level: 'faculty',
        nameEn: 'Mid',
        metrics: { completion_rate: 50 },
      }),
      governanceNode({
        level: 'faculty',
        nameEn: 'Top',
        metrics: { completion_rate: 90 },
      }),
      governanceNode({
        level: 'faculty',
        nameEn: 'Low',
        metrics: { completion_rate: 20 },
      }),
      governanceNode({
        level: 'faculty',
        nameEn: 'AlsoNull',
        metrics: { completion_rate: null },
      }),
    ];

    expect(sortByCompletionDesc(nodes).map((node) => node.name_en)).toEqual([
      'Top',
      'Mid',
      'Low',
      'Null',
      'AlsoNull',
    ]);
  });

  test('does not mutate the input order', () => {
    const nodes = [
      governanceNode({
        level: 'faculty',
        nameEn: 'Low',
        metrics: { completion_rate: 20 },
      }),
      governanceNode({
        level: 'faculty',
        nameEn: 'Top',
        metrics: { completion_rate: 90 },
      }),
    ];

    sortByCompletionDesc(nodes);
    expect(nodes.map((node) => node.name_en)).toEqual(['Low', 'Top']);
  });
});

describe('findNode and pathToNode', () => {
  const tree = governanceNode({
    level: 'university',
    nameEn: 'E-JUST',
    children: [
      governanceNode({
        level: 'faculty',
        code: 'F-SCI',
        nameEn: 'Science',
        children: [
          governanceNode({
            level: 'department',
            code: 'F-SCI-D1',
            nameEn: 'Science A',
          }),
        ],
      }),
    ],
  });

  test('finds a node by code across the tree', () => {
    expect(findNode(tree, 'F-SCI-D1')?.name_en).toBe('Science A');
    expect(findNode(tree, 'missing')).toBeNull();
  });

  test('walks the ancestor trail from the root', () => {
    const leaf = findNode(tree, 'F-SCI-D1');
    expect(leaf && pathToNode(tree, leaf).map((node) => node.name_en)).toEqual([
      'E-JUST',
      'Science',
      'Science A',
    ]);
  });

  test('scoped node falls back to the root for unknown codes', () => {
    expect(scopedNodeOf(tree, 'missing')).toBe(tree);
    expect(scopedNodeOf(tree, null)).toBe(tree);
    expect(scopedNodeOf(tree, 'F-SCI')?.name_en).toBe('Science');
  });
});

describe('axisPropsFor', () => {
  test('keeps the LTR defaults', () => {
    expect(axisPropsFor('ltr')).toEqual({
      reversed: false,
      orientation: 'left',
    });
  });

  test('reverses the category axis and moves the value axis for RTL', () => {
    expect(axisPropsFor('rtl')).toEqual({
      reversed: true,
      orientation: 'right',
    });
  });
});
