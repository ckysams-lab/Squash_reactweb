// File: src/components/TournamentBracket.jsx
// Version 8.5: 🗺️ 引入 React Flow 引擎，將靜態賽程表升級為無限縮放、互動平移的專業 SaaS 畫布，完美支援超大型聯賽。

import React, { useMemo, useCallback } from 'react';
import ReactFlow, { MiniMap, Controls, Background, MarkerType, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import { PlayCircle, Clock, MapPin, Trophy } from 'lucide-react';

// 定義常數：節點尺寸與間距，用來計算畫布座標
const NODE_WIDTH = 220;
const NODE_HEIGHT = 110;
const X_OFFSET = 300; // 每輪之間的橫向距離
const Y_OFFSET = 140; // 每場比賽之間的縱向距離

// --- 1. 客製化賽事卡片節點 (Custom Match Node) ---
// 這個元件會取代原本的 MatchBox，並被 React Flow 渲染
const MatchNode = ({ data }) => {
    const { match, isBronze, onMatchClick, liveMatches, onStartLiveBroadcast, role } = data;

    const isDone = match.status === 'completed';
    const isBye = match.player2Id === 'BYE' || match.player1Id === 'BYE';
    
    const liveData = liveMatches?.find(l => l.leagueMatchId === match.id && l.status === 'live');
    const isLive = !!liveData;
    
    const displayScore1 = isLive ? liveData.score1 : (isDone ? match.score1 : '-');
    const displayScore2 = isLive ? liveData.score2 : (isDone ? match.score2 : (isBye ? '' : '-'));

    let detailedScores = isDone ? match.gameScoresStr : '';
    if (isLive && liveData.gameScores && liveData.gameScores.length > 0) {
        detailedScores = liveData.gameScores.map(g => `${g.p1}-${g.p2}`).join(', ');
    }

    const renderPlayerName = (name, seed, isWinner) => {
        if (!name) return <span className="text-slate-300">TBD (待定)</span>;
        return (
            <div className="flex items-center gap-1 overflow-hidden">
                {seed && <span className="text-[9px] font-mono text-slate-400 shrink-0">[{seed}]</span>}
                <span className={`text-xs font-black truncate ${isLive ? 'text-white' : (isWinner ? 'text-emerald-700' : 'text-slate-700')}`}>
                    {name}
                </span>
            </div>
        );
    };

    return (
        <div 
            className={`relative w-[220px] border-2 rounded-xl overflow-visible transition-all duration-300 group flex flex-col shadow-sm
            ${isBye ? 'opacity-50 grayscale bg-slate-50 border-slate-200 cursor-not-allowed' : 'cursor-pointer'} 
            ${isLive ? 'border-red-500 bg-slate-900 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-105 z-20' : 
              (isDone ? 'border-emerald-200 bg-white hover:border-emerald-400' : 'border-slate-200 bg-white hover:border-blue-400')}
            ${!match.player1Id && !match.player2Id ? 'border-dashed border-slate-300 bg-slate-50' : ''}
            ${isBronze ? 'border-orange-300 bg-orange-50' : ''}`}
            onClick={() => {
                if (!isBye && onMatchClick) onMatchClick(match);
            }}
        >
            {/* 標籤：總決賽或季軍戰 */}
            {!isBronze && match.isFinal && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-black px-2 py-0.5 rounded shadow-sm z-10 whitespace-nowrap flex items-center gap-1"><Trophy size={10}/> 總決賽</div>}
            {isBronze && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-700 border border-orange-200 text-[9px] font-black px-2 py-0.5 rounded shadow-sm z-10 whitespace-nowrap">季軍戰 (3rd Place)</div>}
            {isLive && <div className="absolute -top-3 right-0 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-t-lg animate-pulse flex items-center gap-1 z-30 shadow-md"><span className="w-1.5 h-1.5 bg-white rounded-full"></span> LIVE</div>}

            {/* 場地與時間 */}
            {!isBye && (
                <div className={`text-[9px] font-bold px-2 py-1.5 flex justify-between items-center border-b ${isLive ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100/50 text-slate-500 border-slate-100'}`}>
                    <span className="flex items-center gap-1"><MapPin size={10} className={isLive ? 'text-blue-400' : 'text-blue-500'}/> {match.venue || 'TBD'}</span>
                    <span className="flex items-center gap-1"><Clock size={10} className={isLive ? 'text-amber-400' : 'text-amber-600'}/> {match.time || 'TBD'}</span>
                </div>
            )}

            {/* 選手一 */}
            <div className={`px-3 py-2 flex justify-between items-center border-b ${isLive ? 'border-slate-700' : 'border-slate-100'} ${match.winnerId === match.player1Id && !isLive ? 'bg-emerald-50' : ''}`}>
                {renderPlayerName(match.player1Name, match.player1Seed, match.winnerId === match.player1Id)}
                <span className={`text-xs font-black shrink-0 ${isLive ? 'text-yellow-400 text-sm' : 'text-slate-400'}`}>{displayScore1}</span>
            </div>
            
            {/* 選手二 */}
            <div className={`px-3 py-2 flex justify-between items-center ${match.winnerId === match.player2Id && !isLive ? 'bg-emerald-50 rounded-b-lg' : ''}`}>
                {renderPlayerName(match.player2Name, match.player2Seed, match.winnerId === match.player2Id)}
                <span className={`text-xs font-black shrink-0 ${isLive ? 'text-yellow-400 text-sm' : 'text-slate-400'}`}>{displayScore2}</span>
            </div>

            {/* 詳細比分 */}
            {detailedScores && !isBye && (
                <div className={`py-1.5 text-[10px] font-mono text-center tracking-tight border-t rounded-b-lg ${isLive ? 'border-slate-800 text-slate-400 bg-slate-950' : 'border-slate-100 text-slate-500 bg-slate-50'}`}>
                    {detailedScores}
                </div>
            )}

            {/* 轉播台按鈕 (僅限管理員) */}
            {role === 'admin' && !isDone && !isBye && match.player1Id && match.player2Id && !match.isTeamMatch && (
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-40 rounded-xl">
                    <button 
                        onClick={(e) => { e.stopPropagation(); if(onStartLiveBroadcast) onStartLiveBroadcast(match); }} 
                        className="flex flex-col items-center gap-1 text-white hover:text-red-400 transition-colors hover:scale-110"
                    >
                        <PlayCircle size={28} className="fill-red-500/20 stroke-red-500" />
                        <span className="text-[10px] font-black tracking-widest uppercase">開啟轉播台</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// 註冊客製化節點類型
const nodeTypes = { matchNode: MatchNode };

// --- 2. 主組件：視覺化樹狀圖 ---
export default function TournamentBracket({ bracketMatches, students, role, onMatchClick, liveMatches = [], onStartLiveBroadcast }) {
    
    // 將平面的賽事資料轉換為 React Flow 需要的 Nodes 和 Edges 陣列
    const { initialNodes, initialEdges } = useMemo(() => {
        if (!bracketMatches || bracketMatches.length === 0) return { initialNodes: [], initialEdges: [] };
        
        const nodes = [];
        const edges = [];
        const bMatch = bracketMatches.find(m => m.isBronzeFinal);
        const mainMatches = bracketMatches.filter(m => !m.isBronzeFinal);

        // 找出最大的輪數 (例如 32籤是 5, 16籤是 4)
        let maxRound = 1;
        mainMatches.forEach(m => { if (m.bracketRound && m.bracketRound > maxRound) maxRound = m.bracketRound; });

        // 計算每一場比賽的 X, Y 座標
        // 為了讓晉級路線對齊，我們採用後序遍歷的思想，先決定最底層 (第一輪) 的座標
        const matchCoordinates = {}; // 記錄已算出的座標 { matchId: {x, y} }
        
        // 1. 處理第一輪 (最底層)
        const roundNMatches = mainMatches.filter(m => m.bracketRound === maxRound).sort((a, b) => a.bracketMatchNumber - b.bracketMatchNumber);
        roundNMatches.forEach((match, index) => {
            const x = 0; // 第一輪最左邊
            const y = index * Y_OFFSET;
            matchCoordinates[match.id] = { x, y };
        });

        // 2. 處理後續晉級輪次 (向右推進)
        for (let r = maxRound - 1; r >= 1; r--) {
            const currentRoundMatches = mainMatches.filter(m => m.bracketRound === r);
            
            currentRoundMatches.forEach(match => {
                const x = (maxRound - r) * X_OFFSET;
                
                // 找出晉級到這場比賽的兩場前置賽事
                const sourceMatches = mainMatches.filter(m => m.nextMatchId === match.id);
                
                let y = 0;
                if (sourceMatches.length === 2) {
                    // Y 座標設為兩個前置賽事的正中間
                    const y1 = matchCoordinates[sourceMatches[0].id]?.y || 0;
                    const y2 = matchCoordinates[sourceMatches[1].id]?.y || 0;
                    y = (y1 + y2) / 2;
                } else if (sourceMatches.length === 1) {
                    y = matchCoordinates[sourceMatches[0].id]?.y || 0;
                }
                
                matchCoordinates[match.id] = { x, y };
            });
        }

        // 3. 建立主賽程節點 (Nodes) 與 連線 (Edges)
        mainMatches.forEach(match => {
            const coord = matchCoordinates[match.id] || { x: 0, y: 0 };
            
            nodes.push({
                id: match.id,
                type: 'matchNode',
                position: coord,
                data: { match, isBronze: false, onMatchClick, liveMatches, onStartLiveBroadcast, role }
            });

            // 如果有下一場，畫出連線
            if (match.nextMatchId) {
                edges.push({
                    id: `e-${match.id}-${match.nextMatchId}`,
                    source: match.id,
                    target: match.nextMatchId,
                    type: 'step', // 使用直角折線，看起來最專業
                    style: { stroke: '#CBD5E1', strokeWidth: 2 },
                    animated: liveMatches?.some(l => l.leagueMatchId === match.id && l.status === 'live'), // 如果正在直播，連線會有流動動畫！
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#94A3B8' },
                });
            }
        });

        // 4. 處理季軍戰 (獨立放置於決賽下方)
        if (bMatch) {
            const finalMatch = mainMatches.find(m => m.isFinal);
            const finalCoord = finalMatch ? matchCoordinates[finalMatch.id] : { x: 0, y: 0 };
            
            nodes.push({
                id: bMatch.id,
                type: 'matchNode',
                // 將季軍戰放在決賽的下方 2 個 Y_OFFSET 處
                position: { x: finalCoord.x, y: finalCoord.y + (Y_OFFSET * 1.5) },
                data: { match: bMatch, isBronze: true, onMatchClick, liveMatches, onStartLiveBroadcast, role }
            });

            // 畫出四強落敗者連接到季軍戰的虛線
            const semiFinals = mainMatches.filter(m => m.bracketRound === 2);
            semiFinals.forEach(semi => {
                edges.push({
                    id: `e-${semi.id}-${bMatch.id}`,
                    source: semi.id,
                    target: bMatch.id,
                    type: 'step',
                    style: { stroke: '#FDBA74', strokeWidth: 2, strokeDasharray: '5,5' }, // 橘色虛線代表進入季軍戰
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#FDBA74' },
                });
            });
        }

        return { initialNodes: nodes, initialEdges: edges };
    }, [bracketMatches, liveMatches, onMatchClick, onStartLiveBroadcast, role]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // 當外部資料更新時，同步更新畫布
    useEffect(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
    }, [initialNodes, initialEdges, setNodes, setEdges]);

    if (nodes.length === 0) {
        return <div className="text-center p-10 text-slate-400 font-bold">目前無大賽賽程資料</div>;
    }

    return (
        // 外層必須給定高度，React Flow 才能正常顯示
        <div className="w-full h-[600px] border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView // 預設自動縮放以顯示整個賽程表
                minZoom={0.2} // 允許縮小到很小，應付 128 籤
                maxZoom={1.5}
                attributionPosition="bottom-right"
            >
                <Background color="#CBD5E1" gap={16} size={1} /> {/* 專業的網格背景 */}
                <Controls /> {/* 左下角的放大縮小控制器 */}
                <MiniMap 
                    nodeColor={(n) => {
                        if (n.data.isBronze) return '#FFEDD5';
                        if (n.data.match.status === 'completed') return '#D1FAE5';
                        return '#F1F5F9';
                    }}
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    className="border-2 border-slate-200 rounded-xl shadow-lg"
                /> {/* 右下角全局縮圖導航 */}
            </ReactFlow>
        </div>
    );
}
