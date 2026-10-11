import { describe, it, expect } from 'vitest';
import { generateRoundRobinSchedule, generateKnockoutSchedule } from './scheduler';

describe('generateRoundRobinSchedule', () => {
  const players = [
    { id: 'a', name: 'A' }, { id: 'b', name: 'B' },
    { id: 'c', name: 'C' }, { id: 'd', name: 'D' },
  ];

  it('4 名球員產生 6 場單循環賽', () => {
    const res = generateRoundRobinSchedule(players, '2026-10-01', '2026-10-10', '16:00');
    expect(res.success).toBe(true);
    expect(res.totalMatches).toBe(6);
  });

  it('少於 2 名球員回傳失敗', () => {
    const res = generateRoundRobinSchedule([{ id: 'a', name: 'A' }], '2026-10-01', '2026-10-10');
    expect(res.success).toBe(false);
  });

  it('結束日期早於開始日期回傳失敗', () => {
    const res = generateRoundRobinSchedule(players, '2026-10-10', '2026-10-01');
    expect(res.success).toBe(false);
  });
});

describe('generateKnockoutSchedule', () => {
  it('5 名球員 → 8 強賽（含 3 個輪空）', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id.toUpperCase() }));
    const res = generateKnockoutSchedule(players, '2026-10-01', '16:00');
    expect(res.success).toBe(true);
    expect(res.bracketSize).toBe(8);
    expect(res.totalMatches).toBe(4);
  });

  it('少於 2 名球員回傳失敗', () => {
    const res = generateKnockoutSchedule([{ id: 'a', name: 'A' }], '2026-10-01');
    expect(res.success).toBe(false);
  });
});
