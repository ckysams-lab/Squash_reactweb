// src/utils/scheduler.js

// ==========================================
// 演算法一：聯賽 (單循環賽 Round-Robin)
// ==========================================
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


// ==========================================
// 演算法二：淘汰賽 (Knockout)
// ==========================================
export const generateKnockoutSchedule = (players, startDate, defaultTime) => {
    if (!players || players.length < 2) return { success: false, message: '至少需要 2 名球員才能建立淘汰賽' };

    const numPlayers = players.length;
    
    // 1. 計算下一個最接近的 2 的冪次方 (例如：13人 -> 16, 5人 -> 8)
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
    
    // 2. 計算需要多少個「輪空 (Bye)」
    const numByes = nextPowerOfTwo - numPlayers;
    
    // 3. 準備球員名單 (為了公平，我們將名單隨機打亂)
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    
    // 4. 生成第一輪 (Round of N) 的對戰組合
    let matches = [];
    let playerIndex = 0;

    // 計算第一輪總共有多少場比賽 (包含輪空的場次)
    const firstRoundMatches = nextPowerOfTwo / 2;

    for (let i = 0; i < firstRoundMatches; i++) {
        const player1 = shuffledPlayers[playerIndex++];
        
        // 如果還有「輪空」名額沒用完，這個對戰組合的 Player 2 就是 BYE
        // 如果輪空名額用完了，就從名單中挑選下一個球員作為 Player 2
        let player2 = null;
        if (i < numByes) {
            player2 = { id: 'BYE', name: '輪空 (直接晉級)' };
        } else {
            player2 = shuffledPlayers[playerIndex++];
        }

        matches.push({
            // 用來標示這是哪一個階段的比賽，例如 "16強賽", "8強賽"
            groupName: `${nextPowerOfTwo}強賽`, 
            
            date: startDate,
            time: defaultTime || '16:00',
            venue: '學校壁球場',
            
            player1Id: player1.id,
            player1Name: player1.name,
            player2Id: player2.id,
            player2Name: player2.name,
            
            matchType: 'internal',
            
            // 如果這場比賽對手是 BYE，代表 Player 1 不戰而勝，狀態直接設為 completed
            status: player2.id === 'BYE' ? 'completed' : 'scheduled',
            score1: player2.id === 'BYE' ? 3 : null, // 假設 3 局勝，給予虛擬分數
            score2: player2.id === 'BYE' ? 0 : null,
            winnerId: player2.id === 'BYE' ? player1.id : null,
        });
    }

    return {
        success: true,
        matches: matches,
        totalMatches: matches.length,
        bracketSize: nextPowerOfTwo // 回傳這是幾強賽，方便前端顯示
    };
};
