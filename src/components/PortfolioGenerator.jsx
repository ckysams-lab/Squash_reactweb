// src/components/PortfolioGenerator.jsx (Version 2.0 - High-DPI Print Ready)

import React, { forwardRef } from 'react';
import { Trophy, Award, Activity, Star } from 'lucide-react';
import { ACHIEVEMENT_DATA } from '../constants/data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const PortfolioGenerator = forwardRef(({ student, data, schoolLogo }, ref) => {
    if (!student || !data) return null;

    const radarData = data.radarData || [];
    const recentAwards = data.achievements.slice(0, 5) || [];

    // 嚴格使用 Hex 色碼，確保 html2canvas 渲染不報錯
    const colors = {
        bgMain: '#ffffff',
        bgBlueLight: '#f0f9ff',
        bgSlateLight: '#f8fafc',
        textBlueDark: '#0f172a', // 更深的藏青色
        textSlateDark: '#1e293b',
        textSlateMedium: '#64748b',
        textBlueMedium: '#2563eb',
        accentGold: '#fbbf24',
        accentEmerald: '#10b981',
        accentPurple: '#8b5cf6'
    };

    return (
        // 使用 1190 x 1684 (A4 比例)，在匯出時配合 scale: 3 將達到 3570 x 5052 的 300DPI 印刷畫質
        <div ref={ref} style={{ width: '1190px', height: '1684px', backgroundColor: colors.bgMain, position: 'relative', overflow: 'hidden', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
            
            {/* ✨ 升級版：動態幾何背景 (不依賴 CSS class 以確保 PDF 渲染) */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '800px', height: '800px', backgroundColor: colors.bgBlueLight, borderRadius: '50%', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '30%', background: 'linear-gradient(to top, #f1f5f9, #ffffff)', zIndex: 0 }}></div>
            
            {/* 隱藏浮水印 */}
            <div style={{ position: 'absolute', top: '45%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', fontSize: '180px', fontWeight: '900', color: 'rgba(226, 232, 240, 0.3)', whiteSpace: 'nowrap', zIndex: 0, pointerEvents: 'none' }}>
                SQUASH PRO
            </div>

            <div style={{ position: 'relative', zIndex: 10, padding: '80px', display: 'flex', flexDirection: 'column', height: '100%', boxSizing: 'border-box' }}>
                
                {/* Header 區塊 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `4px solid ${colors.textBlueDark}`, paddingBottom: '32px', marginBottom: '56px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                        {schoolLogo ? (
                            <img src={schoolLogo} alt="Logo" style={{ height: '100px', width: '100px', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ height: '100px', width: '100px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#94a3b8' }}>LOGO</div>
                        )}
                        <div>
                            <h1 style={{ fontSize: '54px', fontWeight: '900', color: colors.textBlueDark, margin: 0, letterSpacing: '-1.5px' }}>壁球運動員數據分析報告</h1>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', color: colors.textSlateMedium, textTransform: 'uppercase', letterSpacing: '4px', marginTop: '8px', margin: 0 }}>Official Player Scouting Report</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', borderLeft: '2px solid #e2e8f0', paddingLeft: '32px' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', margin: 0, textTransform: 'uppercase' }}>Report Generated</p>
                        <p style={{ fontSize: '24px', fontWeight: '900', color: colors.textBlueMedium, margin: 0 }}>{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Section 1: 個人基本資料 */}
                <div style={{ display: 'flex', gap: '48px', marginBottom: '56px', backgroundColor: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9' }}>
                    <div style={{ width: '240px', height: '280px', backgroundColor: colors.bgSlateLight, borderRadius: '24px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '4px solid #f8fafc' }}>
                        {student.photo_url ? (
                            <img src={student.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '80px', fontWeight: '900', color: '#cbd5e1' }}>{student.name[0]}</span>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                            <h2 style={{ fontSize: '64px', fontWeight: '900', color: colors.textBlueDark, margin: 0, letterSpacing: '-2px' }}>{student.name}</h2>
                            {student.badge === '金章' && <Star fill={colors.accentGold} color={colors.accentGold} size={48} />}
                        </div>
                        <p style={{ fontSize: '26px', fontWeight: 'bold', color: colors.textSlateMedium, margin: 0, marginBottom: '40px' }}>
                            Class {student.class} | No. {student.classNo}
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            <div style={{ backgroundColor: colors.bgBlueLight, padding: '24px', borderRadius: '20px' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textBlueMedium, textTransform: 'uppercase', margin: 0 }}>OVR 綜合積分</p>
                                <p style={{ fontSize: '42px', fontWeight: '900', color: '#1e3a8a', margin: '4px 0 0 0' }}>{student.totalPoints || student.points || 0}</p>
                            </div>
                            <div style={{ backgroundColor: '#ecfdf5', padding: '24px', borderRadius: '20px' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: colors.accentEmerald, textTransform: 'uppercase', margin: 0 }}>賽季勝率</p>
                                <p style={{ fontSize: '42px', fontWeight: '900', color: '#064e3b', margin: '4px 0 0 0' }}>{data.winRate}%</p>
                            </div>
                            <div style={{ backgroundColor: '#faf5ff', padding: '24px', borderRadius: '20px' }}>
                                <p style={{ fontSize: '16px', fontWeight: 'bold', color: colors.accentPurple, textTransform: 'uppercase', margin: 0 }}>級別認證</p>
                                <p style={{ fontSize: '36px', fontWeight: '900', color: '#3b0764', margin: '8px 0 0 0' }}>{student.badge || '未評級'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
                    {/* Section 2: 雷達圖分析 */}
                    <div style={{ flex: 1, backgroundColor: 'white', padding: '40px', borderRadius: '32px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }}>
                        <h3 style={{ fontSize: '28px', fontWeight: '900', color: colors.textBlueDark, display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
                            <Activity color={colors.textBlueMedium} size={32} /> 專業體測雷達分析
                        </h3>
                        <div style={{ height: '500px', width: '100%' }}>
                            {radarData && radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* 關閉動畫是為了確保 html2canvas 擷取時畫面已經渲染完畢 */}
                                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                        <PolarGrid stroke="#e2e8f0" strokeWidth={2} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 16, fontWeight: '900' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar name="能力值" dataKey="A" stroke={colors.textBlueMedium} strokeWidth={4} fill={colors.textBlueMedium} fillOpacity={0.5} isAnimationActive={false} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 'bold', fontSize: '20px', backgroundColor: colors.bgSlateLight, borderRadius: '20px' }}>
                                    等待教練輸入最新體測數據
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: 榮譽成就牆 */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ fontSize: '28px', fontWeight: '900', color: colors.textBlueDark, display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px' }}>
                            <Trophy color={colors.accentGold} size={32} /> 賽季重大成就
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            {recentAwards.length > 0 ? recentAwards.map((ach, idx) => {
                                const badge = ACHIEVEMENT_DATA[ach.badgeId];
                                if (!badge) return null;
                                const levelData = badge.levels[ach.level || 1];
                                return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '24px', backgroundColor: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                                        <div style={{ width: '80px', height: '80px', backgroundColor: '#fffbeb', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.accentGold, flexShrink: 0, border: '2px solid #fef3c7' }}>
                                            {React.cloneElement(badge.icon, { size: 40 })}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '24px', fontWeight: '900', color: colors.textBlueDark, margin: '0 0 8px 0' }}>{levelData.name}</h4>
                                            <p style={{ fontSize: '16px', fontWeight: 'bold', color: colors.textSlateMedium, margin: 0, lineHeight: 1.4 }}>{levelData.desc}</p>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSlateLight, borderRadius: '32px', color: '#94a3b8', fontWeight: 'bold', fontSize: '20px', border: '2px dashed #cbd5e1' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Award size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }}/>
                                        持續訓練，解鎖專屬徽章！
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer 認證章 */}
                <div style={{ marginTop: 'auto', paddingTop: '40px', borderTop: '4px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: '900', fontSize: '20px', color: colors.textBlueDark, margin: '0 0 4px 0' }}>BCKLAS Squash Team Management System</p>
                        <p style={{ fontWeight: 'bold', fontSize: '14px', color: colors.textSlateMedium, margin: 0 }}>Official System Data Output</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: colors.accentEmerald, backgroundColor: '#ecfdf5', padding: '12px 24px', borderRadius: '99px', border: '2px solid #a7f3d0' }}>
                        <Award size={24}/>
                        <span style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '1px' }}>CERTIFIED RECORD</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default PortfolioGenerator;
