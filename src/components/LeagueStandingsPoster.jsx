// src/components/LeagueStandingsPoster.jsx
import React from 'react';
import QRCode from 'qrcode.react';

// 冠軍、亞軍、季軍的圖示
const RankIcon = ({ rank }) => {
  if (rank === 1) return <span style={{ fontSize: '24px' }}>🥇</span>;
  if (rank === 2) return <span style={{ fontSize: '24px' }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: '24px' }}>🥉</span>;
  return rank;
};

const LeagueStandingsPoster = React.forwardRef(({ tournamentName, standings, upcomingMatches, schoolLogo }, ref) => {
  const topPlayers = standings.slice(0, 10); // 只顯示前 10 名
  
  // 找出下一個焦點對決
  const focusMatch = upcomingMatches
    ?.filter(m => m.status === 'scheduled')
    .sort((a,b) => (b.player1Points + b.player2Points) - (a.player1Points + a.player2Points)) // 假設有傳入球員積分
    [0];

  return (
    <div 
      ref={ref} 
      style={{
        width: '827px', // A4 寬度
        height: '1170px', // A4 高度
        padding: '40px',
        backgroundColor: '#f8fafc', // bg-slate-50
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* 頂部標題區 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #1e293b' /* bg-slate-800 */, paddingBottom: '20px' }}>
        <div>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#64748b' /* text-slate-500 */, margin: 0 }}>BCKLAS 壁球隊</p>
          <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#1e293b' /* text-slate-800 */, margin: '5px 0' }}>{tournamentName}</h1>
          <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' /* text-blue-500 */, margin: 0 }}>戰績排行榜</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {schoolLogo && <img src={schoolLogo} alt="Logo" style={{ height: '80px', objectFit: 'contain' }}/>}
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: '10px 0 0 0' }}>截至 {new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* 核心積分榜 */}
      <div style={{ flex: 1, paddingTop: '30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', fontSize: '14px', color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '15px 10px', width: '80px', textAlign: 'center' }}>排名</th>
              <th style={{ padding: '15px 10px' }}>球員</th>
              <th style={{ padding: '15px 10px' }}>班別</th>
              <th style={{ padding: '15px 10px', textAlign: 'center' }}>勝</th>
              <th style={{ padding: '15px 10px', textAlign: 'center' }}>負</th>
              <th style={{ padding: '15px 10px', textAlign: 'right' }}>總積分</th>
            </tr>
          </thead>
          <tbody>
            {topPlayers.map((p, index) => {
              const rank = index + 1;
              let bgColor = rank % 2 === 0 ? '#f8fafc' : '#ffffff';
              if (rank === 1) bgColor = '#fef3c7'; // bg-amber-100
              if (rank === 2) bgColor = '#f1f5f9'; // bg-slate-100
              if (rank === 3) bgColor = '#ffedd5'; // bg-orange-100
              
              return (
                <tr key={p.id} style={{ backgroundColor: bgColor, borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px 10px', fontWeight: '900', fontSize: '24px', textAlign: 'center' }}>
                    <RankIcon rank={rank} />
                  </td>
                  <td style={{ padding: '15px 10px', fontWeight: '900', fontSize: '22px', color: '#1e293b' }}>{p.name}</td>
                  <td style={{ padding: '15px 10px', fontWeight: 'bold', fontSize: '16px', color: '#64748b' }}>{p.class || 'N/A'}</td>
                  <td style={{ padding: '15px 10px', fontWeight: 'bold', fontSize: '20px', color: '#16a34a', textAlign: 'center' }}>{p.wins}</td>
                  <td style={{ padding: '15px 10px', fontWeight: 'bold', fontSize: '20px', color: '#e11d48', textAlign: 'center' }}>{p.losses}</td>
                  <td style={{ padding: '15px 10px', fontWeight: '900', fontSize: '28px', color: '#2563eb', textAlign: 'right', fontFamily: 'monospace' }}>{p.leaguePoints}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 底部互動區 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
        {focusMatch ? (
          <div>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', margin: 0 }}>🔥 焦點對決</p>
            <p style={{ fontSize: '28px', fontWeight: '900', color: '#1e293b', margin: '5px 0' }}>
              {focusMatch.player1Name} <span style={{ color: '#ef4444', margin: '0 10px' }}>vs</span> {focusMatch.player2Name}
            </p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#64748b', margin: 0 }}>{focusMatch.date} {focusMatch.time}</p>
          </div>
        ) : <div></div>}

        <div style={{ textAlign: 'center' }}>
          <QRCode value={window.location.href} size={100} />
          <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', margin: '5px 0 0 0' }}>掃描查看完整戰報</p>
        </div>
      </div>
    </div>
  );
});

export default LeagueStandingsPoster;
