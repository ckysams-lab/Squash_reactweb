// src/utils/scheduler.js

/**
 * 單循環賽 (Round-Robin) 排程演算法
 * @param {Array} players - 參與球員的陣列 (例如 [{id: 1, name: 'A'}, ...])
 * @param {Array} dates - 可用日期的陣列 (例如 ['2023-11-01', '2023-11-08'])
 * @param {Number} courtsAvailable - 每次可以同時進行的比賽數量 (場地數)
 * @returns {Array} - 生成的賽程陣列
 */
export const generateRoundRobinSchedule = (players, dates, courtsAvailable) => {
    if (!players || players.length < 2) return [];
    if (!dates || dates.length === 0) return [];

    let pList = [...players];
    // 如果人數是奇數，加入一個「虛擬球員(Bye)」，抽到Bye的人該輪輪空
    if (pList.length % 2 !== 0) {
        pList.push({ id: 'BYE', name: '輪空 (休息)' });
    }

    const numPlayers = pList.length;
    const numRounds = numPlayers - 1; // 總共需要的輪數
    const matchesPerRound = numPlayers / 2; // 每輪的比賽場數

    let matches = [];

    // 核心演算法：固定第一個人，其他人順時針旋轉
    for (let round = 0; round < numRounds; round++) {
        for (let match = 0; match < matchesPerRound; match++) {
            const home = pList[match];
            const away = pList[numPlayers - 1 - match];

            // 只要不是對上虛擬球員(Bye)，就產生一場比賽
            if (home.id !== 'BYE' && away.id !== 'BYE') {
                matches.push({
                    player1Id: home.id,
                    player1Name: home.name,
                    player2Id: away.id,
                    player2Name: away.name,
                    // 暫時用順序標記輪數，之後會分配日期
                    roundIndex: round 
                });
            }
        }
        // 陣列旋轉：除了第一個元素外，其餘元素向右移動一位
        pList.splice(1, 0, pList.pop());
    }

    // 將產生的比賽，均勻分配到指定的日期和場地中
    let scheduledMatches = [];
    let currentMatchIndex = 0;

    // 按照提供的日期依序分配
    for (let d = 0; d < dates.length; d++) {
        // 每一天最多能排的比賽數量 = 場地數
        // 如果你需要每天排多個時段，這裡的邏輯需要再擴充
        for (let c = 0; c < courtsAvailable; c++) {
            if (currentMatchIndex < matches.length) {
                const match = matches[currentMatchIndex];
                scheduledMatches.push({
                    ...match,
                    date: dates[d],
                    // 簡單地將時間錯開，例如 16:00, 16:30... (可依需求調整)
                    time: `${16 + Math.floor(c / 2)}:${c % 2 === 0 ? '00' : '30'}`, 
                    court: `場地 ${c + 1}`
                });
                currentMatchIndex++;
            }
        }
    }

    // 如果提供的日期不夠排完所有比賽，剩下的會沒有日期
    while (currentMatchIndex < matches.length) {
         scheduledMatches.push({
            ...matches[currentMatchIndex],
            date: '未定 (日期不足)',
            time: 'N/A',
            court: 'N/A'
        });
        currentMatchIndex++;
    }

    return scheduledMatches;
};
