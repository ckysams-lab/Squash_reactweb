import { describe, it, expect } from 'vitest';
import {
  addMins, getEarliestCourt, getMaxTime, groupMatchesBy,
  computeTournamentStandings, computeTeamLineupResult, buildSeedOrder, bracketSizeFor,
} from './model';

describe('addMins', () => {
  it('加 20 分鐘', () => expect(addMins('16:00', 20)).toBe('16:20'));
  it('跨小時', () => expect(addMins('16:50', 20)).toBe('17:10'));
  it('空值回傳 00:00', () => expect(addMins('', 20)).toBe('00:00'));
});

describe('getEarliestCourt / getMaxTime', () => {
  it('找出最早場地', () => expect(getEarliestCourt(['17:00', '15:00', '16:00'])).toBe(1));
  it('找出最晚時間', () => expect(getMaxTime(['17:00', '15:00', '16:00'])).toBe('17:00'));
});

describe('groupMatchesBy', () => {
  it('依 groupName 分組', () => {
    const g = groupMatchesBy([{ groupName: 'A' }, { groupName: 'A' }, { groupName: 'B' }]);
    expect(g.A).toHaveLength(2);
    expect(g.B).toHaveLength(1);
  });
  it('無 groupName 落入預設組', () => {
    const g = groupMatchesBy([{ id: 1 }], '所有比賽');
    expect(g['所有比賽']).toHaveLength(1);
  });
});

describe('computeTournamentStandings', () => {
  it('勝方 3 分、負方 0 分，並依積分排序', () => {
    const matches = [
      { status: 'completed', groupName: 'A', player1Id: 'a', player1Name: 'A', player2Id: 'b', player2Name: 'B', score1: 3, score2: 1 },
      { status: 'completed', groupName: 'A', player1Id: 'a', player1Name: 'A', player2Id: 'c', player2Name: 'C', score1: 3, score2: 0 },
    ];
    const s = computeTournamentStandings(matches).A;
    expect(s[0].id).toBe('a');
    expect(s[0].leaguePoints).toBe(6);
    expect(s[0].wins).toBe(2);
  });
  it('未完成賽事不計分', () => {
    const s = computeTournamentStandings([{ status: 'scheduled', groupName: 'A', player1Id: 'a', player2Id: 'b' }]);
    expect(s).toEqual({});
  });
});

describe('computeTeamLineupResult', () => {
  const match = { player1Id: 't1', player2Id: 't2' };
  it('3 場中贏 2 場 → 完成且 t1 勝', () => {
    const rubbers = [
      { score1: 3, score2: 1 }, { score1: 3, score2: 2 }, { score1: 1, score2: 3 },
    ];
    const r = computeTeamLineupResult(rubbers, 3, match);
    expect(r.status).toBe('completed');
    expect(r.score1).toBe(2);
    expect(r.winnerId).toBe('t1');
  });
  it('有 0:0 未打 → 未完成', () => {
    const rubbers = [{ score1: 3, score2: 1 }, { score1: 0, score2: 0 }, { score1: 0, score2: 0 }];
    expect(computeTeamLineupResult(rubbers, 3, match).status).toBe('scheduled');
  });
});

describe('buildSeedOrder / bracketSizeFor', () => {
  it('8 強種子序：長度與種子集合正確，1 號種子排首位', () => {
    const order = buildSeedOrder(8);
    expect(order).toHaveLength(8);
    expect(order[0]).toBe(1);
    expect([...order].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // 注意：現行演算法輸出 [1,8,4,5,2,7,3,6]，並非標準 bracket seeding
    // （標準為 [1,8,5,4,3,6,7,2]）。此為既存行為，已原樣保留並記錄為待修項目。
  });
  it('bracket 大小對應', () => {
    expect(bracketSizeFor(3)).toBe(4);
    expect(bracketSizeFor(5)).toBe(8);
    expect(bracketSizeFor(9)).toBe(16);
    expect(bracketSizeFor(17)).toBe(32);
  });
});
