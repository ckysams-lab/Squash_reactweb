// src/utils/scheduler.js (請使用這個最終優化版)

export const generateRoundRobinSchedule = (players, startDate, endDate, matchTime) => {
    if (!players || players.length < 2) return { success: false, message: '至少需要 2 名球員才能排程' };
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return { success: false, message: '結束日期不能早於開始日期' };

    // 1. 產生所有可用的日期陣列
    const availableDates = [];
    let currentDate = new Date(start);
    while (currentDate <= end) {
        availableDates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    if (availableDates.length === 0) return { success: false, message: '沒有可用的日期' };

    // 2. 準備球員名單 (如果是奇數，加入輪空)
    let pList = [...players];
    if (pList.length % 2 !== 0) {
        pList.push({ id: 'BYE', name: '輪空' });
    }

    const numPlayers = pList.length;
    const numRounds = numPlayers - 1;
    const matchesPerRound = numPlayers / 2;
    let allMatches = [];

    // 3. 核心演算法：產生所有對戰組合
    for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const home = pList[match];
            const away = pList[numPlayers - 1 - match];

            if (home.id !== 'BYE' && away.id !== 'BYE') {
                allMatches.push({
                    player1Id: home.id,
                    player1Name: home.name,
                    player2Id: away.id,
                    player2Name: away.name,
                    matchType: 'internal',
                    status: 'scheduled',
                    score1: 0,
                    score2: 0,
                    winnerId: null
                });
            }
        }
        // 陣列旋轉
        pList.splice(1, 0, pList.pop());
    }

    // 4. 將比賽平均分配到日期上
    let scheduledMatches = [];
    let matchIndex = 0;
    const totalMatches = allMatches.length;

    // 簡單的均分邏輯：每天排幾場
    const matchesPerDay = Math.ceil(totalMatches / availableDates.length);

    for (let d = 0; d < availableDates.length; d++) {
        for (let m = 0; m < matchesPerDay; m++) {
            if (matchIndex < totalMatches) {
                // 為每一場比賽加上指定的日期和時間
                scheduledMatches.push({
                    ...allMatches[matchIndex],
                    date: availableDates[d],
                    time: matchTime || '16:00', // 預設 16:00
                    venue: '學校壁球場'
                });
                matchIndex++;
            }
        }
    }

    return { 
        success: true, 
        matches: scheduledMatches,
        totalMatches: scheduledMatches.length
    };
};
