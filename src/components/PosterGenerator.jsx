// src/components/PosterGenerator.jsx
import React from 'react';
import { Trophy as TrophyIcon } from 'lucide-react';
import QRCode from 'qrcode.react';

const PosterGenerator = React.forwardRef(({ data, schoolLogo }, ref) => {
    if (!data) return null;
    
    return (
        // 1. 強制設定底色與文字色為 Hex，阻絕外層的 lab() 變數污染
        <div ref={ref} style={{ width: '827px', height: '1170px', padding: '2rem', fontFamily: 'sans-serif', position: 'relative', backgroundColor: '#ffffff', color: '#000000', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #000000', paddingBottom: '1rem' }}>
                {schoolLogo ? (
                    <img src={schoolLogo} alt="School Logo" style={{ height: '6rem', objectFit: 'contain' }} crossOrigin="anonymous"/>
                ) : (
                    <div style={{ width: '6rem', height: '6rem', backgroundColor: '#e2e8f0' }}></div>
                )}
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{ fontFamily: 'serif', fontSize: '48px', fontWeight: 'bold', margin: 0 }}>BCKLAS 壁球隊 每月之星</h1>
                    <p style={{ fontSize: '28px', fontWeight: '600', margin: 0 }}>{data.month.replace('-', ' 年 ')} 月</p>
                </div>
                <div style={{ width: '6rem', height: '6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    {/* 強制圖示使用 Hex 色碼 */}
                    <TrophyIcon size={80} color="#94a3b8" />
                </div>
            </div>
            
            <div style={{ display: 'flex', marginTop: '2rem', gap: '2rem' }}>
                {/* 男生每月之星 */}
                <div style={{ width: '50%' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8', marginBottom: '1rem', textAlign: 'center', margin: '0 0 1rem 0' }}>PLAYER OF THE MONTH (MALE)</h2>
                    <div style={{ width: '100%', height: '500px', backgroundColor: '#e2e8f0' }}>
                        {data.maleWinner.fullBodyPhotoUrl && <img src={data.maleWinner.fullBodyPhotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} crossOrigin="anonymous"/>}
                    </div>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: '1rem 0 0 0' }}>{data.maleWinner.studentName} <span style={{ fontSize: '1.5rem', color: '#64748b' }}>({data.maleWinner.studentClass})</span></h3>
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '2px solid #2563eb', display: 'inline-block', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>獲選原因</h4>
                            <p style={{ fontSize: '1.125rem', margin: 0 }}>{data.maleWinner.reason}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '2px solid #2563eb', display: 'inline-block', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>本年度目標</h4>
                            <p style={{ fontSize: '1.125rem', fontStyle: 'italic', margin: 0 }}>"{data.maleWinner.goals}"</p>
                        </div>
                    </div>
                </div>
                
                {/* 女生每月之星 */}
                <div style={{ width: '50%' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#db2777', marginBottom: '1rem', textAlign: 'center', margin: '0 0 1rem 0' }}>PLAYER OF THE MONTH (FEMALE)</h2>
                    <div style={{ width: '100%', height: '500px', backgroundColor: '#e2e8f0' }}>
                         {data.femaleWinner.fullBodyPhotoUrl && <img src={data.femaleWinner.fullBodyPhotoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} crossOrigin="anonymous"/>}
                    </div>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: 'bold', margin: '1rem 0 0 0' }}>{data.femaleWinner.studentName} <span style={{ fontSize: '1.5rem', color: '#64748b' }}>({data.femaleWinner.studentClass})</span></h3>
                     <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '2px solid #ec4899', display: 'inline-block', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>獲選原因</h4>
                            <p style={{ fontSize: '1.125rem', margin: 0 }}>{data.femaleWinner.reason}</p>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: 'bold', borderBottom: '2px solid #ec4899', display: 'inline-block', paddingBottom: '0.25rem', margin: '0 0 0.5rem 0' }}>本年度目標</h4>
                            <p style={{ fontSize: '1.125rem', fontStyle: 'italic', margin: 0 }}>"{data.femaleWinner.goals}"</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ position: 'absolute', bottom: '2rem', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <p style={{ fontSize: '1.125rem', fontWeight: '600', fontStyle: 'italic', margin: 0 }}>汗水鑄就榮耀，目標定義未來</p>
                <div style={{ textAlign: 'center' }}>
                    <QRCode value={window.location.href} size={80} />
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: '0.25rem 0 0 0' }}>線上回顧歷屆每月之星</p>
                </div>
            </div>
        </div>
    );
});

PosterGenerator.displayName = 'PosterGenerator';

export default PosterGenerator;
