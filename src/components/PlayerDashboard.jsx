import React from 'react';
import { 
    ArrowLeft, Trophy as TrophyIcon, Swords, ClipboardCheck, Award, 
    Target, Info, TrendingUp, Activity, ShieldCheck, Zap 
} from 'lucide-react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

const PlayerDashboard = ({ 
    student, 
    data, 
    onClose, 
    onBadgeClick, 
    tacticalShots, 
    ACHIEVEMENT_DATA, 
    currentUserInfo, 
    handleCheerMatch 
}) => {
    if (!student || !data) return null;

    // 找出該學生作為 A(擊球) 或 B(回球) 的所有落點數據
    const myTacticalShots = tacticalShots.filter(s => s.player === student.name);
    
    const heatMap = {
        'Front-Left': 0, 'Front-Center': 0, 'Front-Right': 0,
        'Mid-Left': 0, 'T-Zone': 0, 'Mid-Right': 0,
        'Back-Left': 0, 'Back-Center': 0, 'Back-Right': 0
    };
    
    myTacticalShots.forEach(s => {
        if (heatMap[s.zone] !== undefined) {
            heatMap[s.zone]++;
        }
    });

    return (
        <div className="animate-in fade-in duration-500 font-bold">
            <div className="flex items-center gap-6 mb-10">
                {onClose && (
                    <button onClick={onClose} className="p-4 bg-white text-slate-500 hover:text-blue-600 rounded-2xl transition-all border shadow-sm">
                        <ArrowLeft size={24}/>
                    </button>
                )}
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-4xl font-black text-slate-400 border-4 border-white shadow-inner uppercase">{student.name[0]}</div>
                <div>
                    <h3 className="text-4xl font-black text-slate-800">{student.name}</h3>
                    <p className="text-sm font-bold text-slate-400">{student.class} ({student.classNo}) - {student.squashClass}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center relative overflow-hidden group">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-3xl opacity-50 group-hover:bg-yellow-200 transition-all duration-700 pointer-events-none"></div>
                    
                    <TrophyIcon size={32} className="mx-auto text-yellow-500 mb-2 relative z-10"/>
                    <p className="text-4xl font-black text-slate-800 relative z-10">{student.totalPoints}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest relative z-10">Total Points</p>
                    
                    {(() => {
                        const pts = student.totalPoints || 0;
                        let currentRank = "見習球員";
                        let nextRank = "新晉主力";
                        let nextGoal = 100;
                        let progress = 0;

                        if (pts < 100) { currentRank = "見習球員"; nextRank = "新晉主力"; nextGoal = 100; progress = (pts / nextGoal) * 100; }
                        else if (pts < 300) { currentRank = "新晉主力"; nextRank = "球場精英"; nextGoal = 300; progress = ((pts - 100) / 200) * 100; }
                        else if (pts < 600) { currentRank = "球場精英"; nextRank = "壁球大師"; nextGoal = 600; progress = ((pts - 300) / 300) * 100; }
                        else { currentRank = "傳說級大師 🏆"; nextRank = "頂點"; nextGoal = pts; progress = 100; }

                        return (
                            <div className="mt-5 relative z-10">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{currentRank}</span>
                                    {progress < 100 && <span className="text-[9px] font-bold text-slate-400">尚差 {nextGoal - pts} 分晉升</span>}
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-1500 ease-out"
                                        style={{ width: `${Math.max(5, progress)}%` }} 
                                    ></div>
                                </div>
                                {progress < 100 && <p className="text-[8px] text-slate-400 text-right mt-1 font-bold">下一階: {nextRank}</p>}
                            </div>
                        );
                    })()}
                </div>

                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <Swords size={32} className="mx-auto text-blue-500 mb-4"/>
                    <p className="text-4xl font-black text-slate-800">{data.winRate}<span className="text-2xl">%</span></p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Win Rate ({data.wins}/{data.totalPlayed})</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <ClipboardCheck size={32} className="mx-auto text-emerald-500 mb-4"/>
                    <p className="text-4xl font-black text-slate-800">{data.attendanceRate}<span className="text-2xl">%</span></p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Attendance</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <Award size={32} className="mx-auto text-orange-500 mb-4"/>
                    <p className="text-4xl font-black text-slate-800">{data.achievements.length}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Achievements</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
                <div className="mb-10 animate-in slide-in-from-bottom-6 duration-700">
                    <div className="bg-white p-8 md:p-10 rounded-[4rem] border border-slate-100 shadow-sm max-w-4xl mx-auto h-full flex flex-col">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                            <div>
                                <h4 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Target className="text-red-500" size={32}/> 攻擊落點熱圖</h4>
                                <p className="text-sm font-bold text-slate-400 mt-2">分析 {student.name} 的擊球落點分佈 (基於 {myTacticalShots.length} 筆紀錄)</p>
                            </div>
                            {myTacticalShots.length > 0 && (
                                <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-xs font-bold text-slate-500">
                                    <span>冷區</span>
                                    <div className="w-24 h-3 rounded-full bg-gradient-to-r from-blue-100 via-yellow-200 to-red-500"></div>
                                    <span>熱區</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center items-center">
                            {myTacticalShots.length > 0 ? (
                                <>
                                    <div className="relative w-full max-w-sm aspect-[3/4] bg-[#fdf5e6] border-[8px] border-slate-800 rounded-t-sm rounded-b-sm shadow-2xl overflow-hidden">
                                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500/70"></div>
                                        <div className="absolute top-[55%] left-0 right-0 border-t-[4px] border-red-500/50"></div>
                                        <div className="absolute top-[55%] bottom-0 left-1/2 -translate-x-1/2 border-l-[4px] border-red-500/50"></div>
                                        <div className="absolute top-[55%] left-0 w-[30%] aspect-square border-[4px] border-l-0 border-red-500/50"></div>
                                        <div className="absolute top-[55%] right-0 w-[30%] aspect-square border-[4px] border-r-0 border-red-500/50"></div>
                                        <div className="absolute top-3 left-0 right-0 text-center text-xs font-black text-red-800/40 tracking-[0.4em] pointer-events-none z-10">FRONT WALL</div>

                                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-20">
                                            {['Front-Left', 'Front-Center', 'Front-Right', 'Mid-Left', 'T-Zone', 'Mid-Right', 'Back-Left', 'Back-Center', 'Back-Right'].map(zone => {
                                                const count = heatMap[zone] || 0;
                                                const maxCount = Math.max(...Object.values(heatMap), 1);
                                                const intensity = count / maxCount;
                                                const percentage = Math.round((count / myTacticalShots.length) * 100) || 0;
                                                
                                                let heatColor = 'transparent';
                                                if (intensity > 0.7) heatColor = 'rgba(239, 68, 68, 0.85)';
                                                else if (intensity > 0.4) heatColor = 'rgba(245, 158, 11, 0.7)';
                                                else if (intensity > 0.1) heatColor = 'rgba(252, 211, 77, 0.5)';
                                                else if (intensity > 0) heatColor = 'rgba(147, 197, 253, 0.3)';

                                                return (
                                                    <div key={zone} className="relative flex flex-col items-center justify-center border border-slate-800/5 transition-all group">
                                                        <div className="absolute inset-0 transition-all duration-1000" style={{ backgroundColor: heatColor, filter: 'blur(4px)', transform: 'scale(1.1)' }}></div>
                                                        {count > 0 && (
                                                            <div className="relative z-10 flex flex-col items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-white/50 group-hover:scale-110 transition-transform">
                                                                <span className={`text-sm md:text-xl font-black ${intensity > 0.7 ? 'text-red-600' : intensity > 0.4 ? 'text-amber-600' : 'text-slate-700'}`}>{percentage}%</span>
                                                                <span className="text-[8px] md:text-[10px] font-bold text-slate-400 -mt-1">{count} 球</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <div className="mt-8 bg-blue-50 p-4 rounded-2xl flex items-center justify-center gap-3 text-sm font-bold text-blue-800 w-full">
                                        <Info size={18} className="text-blue-500"/>
                                        教練提示：高水平球員的落點應集中在「後左」與「後右」角落。
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                                    <Target size={64} className="mb-4 opacity-30"/>
                                    <p className="text-lg font-black text-slate-400">目前尚無 {student.name} 的實戰落點數據</p>
                                    <p className="text-sm mt-2 font-bold">請前往「聯賽專區」的戰術板進行紀錄</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
                    <h4 className="text-2xl font-black mb-2 flex items-center gap-3"><TrendingUp className="text-blue-500"/> 積分走勢圖</h4>
                    <p className="text-xs text-slate-400 mb-6">顯示該學員參與校內比賽後的積分變化軌跡</p>
                    <div className="flex-1 min-h-[300px] w-full">
                        {data.pointsHistory && data.pointsHistory.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data.pointsHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94A3B8', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 12, fill: '#64748B', fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                                        labelStyle={{color: '#94A3B8', fontSize: '12px'}}
                                    />
                                    <Line type="monotone" dataKey="points" name="總積分" stroke="#3B82F6" strokeWidth={4} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 6}} animationDuration={1500} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <Activity size={48} className="mb-4 opacity-50"/>
                                <p>需要至少一場比賽紀錄才能繪製走勢圖</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col">
                    <h4 className="text-2xl font-black mb-2 flex items-center gap-3"><Activity className="text-emerald-500"/> 綜合能力評估</h4>
                    <p className="text-xs text-slate-400 mb-6">{data.latestAssessment ? `最後更新: ${data.latestAssessment.date}` : '尚未有評估紀錄'}</p>
                    <div className="flex-1 min-h-[300px] w-full">
                        {data.radarData && data.radarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarData}>
                                    <PolarGrid stroke="#E2E8F0" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar name={student.name} dataKey="A" stroke="#10B981" fill="#10B981" fillOpacity={0.4} animationDuration={1500} />
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}} />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <ShieldCheck size={48} className="mb-4 opacity-50"/>
                                <p>教練尚未輸入該學員的測試數據</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          
            {data.latestAssessment && (
                <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-200 shadow-inner mb-10">
                    <h4 className="text-xl font-black text-slate-700 mb-6">最新體能與技術測試詳細數據</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-indigo-600">{data.latestAssessment.situps}</p><p className="text-[10px] text-slate-400 font-bold mt-1">仰臥起坐 (次/分)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-indigo-600">{data.latestAssessment.shuttleRun}</p><p className="text-[10px] text-slate-400 font-bold mt-1">1分鐘折返跑 (次)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-indigo-600">{data.latestAssessment.enduranceRun}</p><p className="text-[10px] text-slate-400 font-bold mt-1">耐力跑 (圈/米)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-indigo-600">{data.latestAssessment.gripStrength}</p><p className="text-[10px] text-slate-400 font-bold mt-1">手握力 (kg)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-indigo-600">{data.latestAssessment.flexibility}</p><p className="text-[10px] text-slate-400 font-bold mt-1">柔軟度 (cm)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-blue-600">{data.latestAssessment.fhDrive}</p><p className="text-[10px] text-slate-400 font-bold mt-1">正手直線連續 (次)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-blue-600">{data.latestAssessment.bhDrive}</p><p className="text-[10px] text-slate-400 font-bold mt-1">反手直線連續 (次)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-blue-600">{data.latestAssessment.fhVolley}</p><p className="text-[10px] text-slate-400 font-bold mt-1">正手截擊連續 (次)</p></div>
                        <div className="bg-white p-4 rounded-3xl border shadow-sm text-center"><p className="text-2xl font-black text-blue-600">{data.latestAssessment.bhVolley}</p><p className="text-[10px] text-slate-400 font-bold mt-1">反手截擊連續 (次)</p></div>
                    </div>
                    {data.latestAssessment.notes && (
                        <div className="mt-6 p-4 bg-white rounded-2xl border text-sm text-slate-600 italic">
                            <strong>教練評語:</strong> {data.latestAssessment.notes}
                        </div>
                    )}
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm col-span-full lg:col-span-1">
                    <h4 className="text-2xl font-black mb-6">我的成就</h4>
                    <div className="grid grid-cols-3 gap-4">
                        {data.achievements.length > 0 ? (
                            data.achievements.map(ach => {
                                const badgeData = ACHIEVEMENT_DATA[ach.badgeId];
                                if (!badgeData) return null;
                                const currentLevelData = badgeData.levels?.[ach.level] || badgeData.levels?.[1] || { name: badgeData.baseName, desc: '詳細描述待補充' };

                              return (
                                 <button 
                                     key={ach.badgeId} 
                                     onClick={() => onBadgeClick && onBadgeClick(ach)}
                                     className="group relative flex flex-col items-center justify-center text-center p-2 rounded-2xl hover:bg-slate-50 transition-all focus:outline-none active:scale-95" 
                                 >
                                     <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md border group-hover:scale-110 transition-transform">
                                         {badgeData.icon}
                                     </div>
                                     <p className="text-[10px] font-bold text-slate-600 mt-2 truncate w-full">{currentLevelData.name}</p>
                                 </button>
                             );
                            })
                        ) : (
                            <p className="col-span-full text-center text-xs text-slate-400 py-4">還沒有獲得任何徽章。</p>
                        )}
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm col-span-full lg:col-span-2">
                    <h4 className="text-2xl font-black mb-6">近期比賽記錄</h4>
                    <div className="space-y-4">
                        {data.recentMatches.length > 0 ? data.recentMatches.map(match => {
                            const isWinner = match.winnerId === student.id;
                            const opponentName = match.player1Id === student.id ? match.player2Name : match.player1Name;
                            const score = match.matchType === 'external' ? match.externalMatchScore : (match.player1Id === student.id ? `${match.score1} - ${match.score2}` : `${match.score2} - ${match.score1}`);
                            const cheersCount = match.cheers?.length || 0;
                            const hasCheered = match.cheers?.includes(currentUserInfo?.id || 'admin');

                            return (
                                <div key={match.id} className={`p-6 rounded-3xl flex items-center justify-between gap-4 relative overflow-hidden transition-all hover:scale-[1.01] ${isWinner ? 'bg-emerald-50 border border-emerald-200 shadow-emerald-50' : 'bg-rose-50 border border-rose-200 shadow-rose-50'}`}>
                                    <div className="flex-1">
                                        <p className="text-xs text-slate-400 font-bold">{match.date} - {match.tournamentName}</p>
                                        <p className="font-bold text-slate-700 text-lg">vs. {opponentName}</p>
                                    </div>
                                    <div className="text-right pr-4 border-r border-slate-200/50 mr-2">
                                        <p className={`font-black text-2xl font-mono ${isWinner ? 'text-emerald-600' : 'text-rose-600'}`}>{score}</p>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${isWinner ? 'text-emerald-500' : 'text-rose-500'}`}>{isWinner ? 'WIN' : 'LOSS'}</p>
                                    </div>
                                    
                                    <div className="flex flex-col items-center justify-center min-w-[50px]">
                                        <button 
                                            onClick={(e) => handleCheerMatch(match.id, e)}
                                            className={`p-2 rounded-full transition-all active:scale-75 ${hasCheered ? 'bg-orange-100 text-orange-500 shadow-inner' : 'bg-white text-slate-300 hover:text-orange-400 shadow-sm border border-slate-100'}`}
                                            title="為這場精彩比賽打氣！"
                                        >
                                            <Zap size={20} className={hasCheered ? 'fill-orange-400' : ''} />
                                        </button>
                                        <span className={`text-[10px] font-black mt-1 ${hasCheered ? 'text-orange-500' : 'text-slate-400'}`}>
                                            {cheersCount > 0 ? cheersCount : '打氣'}
                                        </span>
                                    </div>
                                </div>
                            )
                        }) : <p className="text-center text-slate-400 py-10">暫無比賽記錄</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlayerDashboard;
