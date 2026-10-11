// src/features/league/model.js — 聯賽的純函式（可獨立測試，無 React / Firestore 依賴）

/** 建立空的團體賽單打（rubber）陣列 */
export const createEmptyRubbers = (size) =>
  Array.from({ length: size }).map((_, i) => ({
    id: `rubber_${i}`, p1Id: '', p1Name: '', p2Id: '', p2Name: '', score1: 0, score2: 0, status: 'pending',
  }));

/** 時間字串加分鐘，回傳 HH:MM */
export const addMins = (timeStr, mins) => {
  if (!timeStr) return '00:00';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
};

/** 找出最早可用的場地索引 */
export const getEarliestCourt = (courts) => {
  let minIdx = 0;
  let minMins = 24 * 60;
  courts.forEach((timeStr, idx) => {
    const [h, m] = timeStr.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins < minMins) { minMins = mins; minIdx = idx; }
  });
  return minIdx;
};

/** 取得所有場地中最晚的時間字串 */
export const getMaxTime = (courts) => {
  let maxMins = 0;
  let maxStr = '00:00';
  courts.forEach((timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    const mins = h * 60 + m;
    if (mins > maxMins) { maxMins = mins; maxStr = timeStr; }
  });
  return maxStr;
};

/** 依 groupName 將賽事分組 */
export const groupMatchesBy = (matches, defaultKey = '所有比賽') => {
  const groups = {};
  (matches || []).forEach((match) => {
    const key = match.groupName || defaultKey;
    if (!groups[key]) groups[key] = [];
    groups[key].push(match);
  });
  return groups;
};

/**
 * 由已完賽的賽事計算分組積分榜（勝 3 分、和 1 分、負 0 分）。
 * @returns {Object<string, Array>} 以 groupName 為 key 的排序後積分榜
 */
export const computeTournamentStandings = (matches) => {
  if (!matches || matches.length === 0) return {};
  const standingsData = {};

  const getOrCreate = (id, name, groupKey, isExternal) => {
    if (!standingsData[groupKey]) standingsData[groupKey] = {};
    if (!standingsData[groupKey][id]) {
      standingsData[groupKey][id] = {
        id, name: name || '未知', played: 0, wins: 0, losses: 0,
        pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, leaguePoints: 0, isExternal,
      };
    }
    return standingsData[groupKey][id];
  };

  matches.forEach((match) => {
    if (match.status !== 'completed') return;
    const groupKey = match.groupName || '所有比賽';
    const p1Score = parseInt(match.score1, 10) || 0;
    const p2Score = parseInt(match.score2, 10) || 0;

    const player1 = getOrCreate(match.player1Id, match.player1Name, groupKey, false);
    player1.played += 1;

    if (match.player2Id || match.player2Name) {
      const player2 = getOrCreate(match.player2Id, match.player2Name, groupKey, false);
      if (match.player1Id !== match.player2Id) player2.played += 1;

      player1.pointsFor += p1Score; player1.pointsAgainst += p2Score;
      player2.pointsFor += p2Score; player2.pointsAgainst += p1Score;

      if (p1Score > p2Score) { player1.wins += 1; player1.leaguePoints += 3; player2.losses += 1; }
      else if (p2Score > p1Score) { player2.wins += 1; player2.leaguePoints += 3; player1.losses += 1; }
      else { player1.leaguePoints += 1; player2.leaguePoints += 1; }
    } else {
      player1.wins += 1; player1.leaguePoints += 3;
    }
  });

  const result = {};
  Object.keys(standingsData).forEach((groupKey) => {
    result[groupKey] = Object.values(standingsData[groupKey])
      .map((p) => { p.pointsDiff = p.pointsFor - p.pointsAgainst; return p; })
      .sort((a, b) => {
        if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
        if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
        return b.pointsFor - a.pointsFor;
      });
  });
  return result;
};

/**
 * 由團體賽各單打結果計算總比分與勝方。
 * @returns {{ score1:number, score2:number, status:'completed'|'scheduled', winnerId:string|null }}
 */
export const computeTeamLineupResult = (rubbers, teamSize, match) => {
  let s1 = 0; let s2 = 0; let isCompleted = true;
  rubbers.forEach((r, i) => {
    if (i < teamSize) {
      if (r.score1 > r.score2) s1++;
      else if (r.score2 > r.score1) s2++;
      if (r.score1 === 0 && r.score2 === 0) isCompleted = false;
    }
  });
  const winnerId = isCompleted ? (s1 > s2 ? match.player1Id : match.player2Id) : null;
  return { score1: s1, score2: s2, status: isCompleted ? 'completed' : 'scheduled', winnerId };
};

/**
 * 產生淘汰賽種子序（標準 bracket seeding，例如 8 強 → [1,8,5,4,3,6,7,2]）。
 * @returns {number[]} 種子編號序列
 */
export const buildSeedOrder = (size) => {
  let pl = [1];
  const rounds = Math.log2(size);
  for (let i = 0; i < rounds; i++) {
    const next = [];
    const sum = Math.pow(2, i + 1) + 1;
    pl.forEach((p) => { next.push(p); next.push(sum - p); });
    pl = next;
  }
  return pl;
};

/** 依參賽人數決定 bracket 大小（4/8/16/32） */
export const bracketSizeFor = (count) => {
  if (count > 16) return 32;
  if (count > 8) return 16;
  if (count > 4) return 8;
  return 4;
};
