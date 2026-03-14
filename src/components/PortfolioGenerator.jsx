// src/components/PortfolioGenerator.jsx (Version 1.2 - Color Compatibility Fix)

import React, { forwardRef } from 'react';
import { Trophy, Award, Activity, Calendar } from 'lucide-react';
import { ACHIEVEMENT_DATA } from '../constants/data';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

const PortfolioGenerator = forwardRef(({ student, data, schoolLogo }, ref) => {
    if (!student || !data) return null;

    const radarData = data.radarData || [];
    const recentAwards = data.achievements.slice(0, 5) || [];

    // 我們在這裡使用傳統的 Hex 顏色，避免 html2canvas 遇到 oklch 或 lab 顏色時崩潰
    const colors = {
        bgMain: '#ffffff',
        bgBlueLight: '#eff6ff',
        bgSlateLight: '#f8fafc',
        textBlueDark: '#1e3a8a',
        textSlateDark: '#1e293b',
        textSlateMedium: '#64748b',
        textBlueMedium: '#2563eb',
        textEmeraldMedium: '#059669',
        textPurpleMedium: '#7e22ce'
    };

    return (
        <div ref={ref} className="font-sans relative overflow-hidden" style={{ width: '1190px', height: '1684px', padding: '64px', backgroundColor: colors.bgMain, boxSizing: 'border-box' }}>
            
            {/* 裝飾性背景色塊 (改用 style 寫死傳統顏色) */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '600px', height: '600px', backgroundColor: colors.bgBlueLight, borderBottomLeftRadius: '9999px', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '800px', height: '400px', backgroundColor: colors.bgSlateLight, clipPath: 'polygon(0 0, 100% 100%, 0 100%)', zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `4px solid ${colors.textBlueDark}`, paddingBottom: '32px', marginBottom: '48px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {schoolLogo ? (
                            <img src={schoolLogo} alt="Logo" style={{ height: '96px', width: '96px', objectFit: 'contain' }} />
                        ) : (
                            <div style={{ height: '96px', width: '96px', backgroundColor: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#94a3b8' }}>LOGO</div>
                        )}
                        <div>
                            <h1 style={{ fontSize: '48px', fontWeight: '900', color: colors.textBlueDark, margin: 0, letterSpacing: '-1px' }}>壁球校隊 學生運動員簡歷</h1>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', color: colors.textSlateMedium, textTransform: 'uppercase', letterSpacing: '2px', marginTop: '8px' }}>Squash Team Player Portfolio</p>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#94a3b8', margin: 0 }}>Generate Date</p>
                        <p style={{ fontSize: '18px', fontWeight: '900', color: colors.textSlateDark, margin: 0 }}>{new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Section 1: 個人基本資料 */}
                <div style={{ display: 'flex', gap: '48px', marginBottom: '48px' }}>
                    <div style={{ width: '224px', height: '256px', backgroundColor: colors.bgSlateLight, borderRadius: '24px', border: '4px solid white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {student.photo_url ? (
                            <img src={student.photo_url} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <span style={{ fontSize: '72px', fontWeight: '900', color: '#cbd5e1' }}>{student.name[0]}</span>
                        )}
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <h2 style={{ fontSize: '60px', fontWeight: '900', color: colors.textSlateDark, margin: 0, marginBottom: '8px' }}>{student.name}</h2>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', color: colors.textSlateMedium, margin: 0, marginBottom: '32px' }}>Class {student.class} (No. {student.classNo})</p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            <div style={{ backgroundColor: colors.bgBlueLight, padding: '24px', borderRadius: '16px', border: '1px solid #dbeafe' }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textBlueMedium, textTransform: 'uppercase', margin: 0 }}>目前積分</p>
                                <p style={{ fontSize: '36px', fontWeight: '900', color: '#1e3a8a', margin: '4px 0 0 0' }}>{student.totalPoints || student.points || 0}</p>
                            </div>
                            <div style={{ backgroundColor: '#ecfdf5', padding: '24px', borderRadius: '16px', border: '1px solid #d1fae5' }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textEmeraldMedium, textTransform: 'uppercase', margin: 0 }}>聯賽勝率</p>
                                <p style={{ fontSize: '36px', fontWeight: '900', color: '#064e3b', margin: '4px 0 0 0' }}>{data.winRate}%</p>
                            </div>
                            <div style={{ backgroundColor: '#faf5ff', padding: '24px', borderRadius: '16px', border: '1px solid #f3e8ff' }}>
                                <p style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textPurpleMedium, textTransform: 'uppercase', margin: 0 }}>目前章別</p>
                                <p style={{ fontSize: '30px', fontWeight: '900', color: '#3b0764', margin: '4px 0 0 0' }}>{student.badge}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
                    {/* Section 2: 雷達圖 */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', color: colors.textSlateDark, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                            <Activity color="#f43f5e" /> 綜合能力評估 (Assessment)
                        </h3>
                        <div style={{ backgroundColor: colors.bgSlateLight, borderRadius: '24px', padding: '24px', height: '400px' }}>
                            {radarData && radarData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    {/* 👇 加上 isAnimationActive={false} 防呆 */}
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                        <PolarGrid stroke="#cbd5e1" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 14, fontWeight: 'bold' }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar name="能力值" dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} isAnimationActive={false} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontWeight: 'bold', fontSize: '18px' }}>尚無評估資料</div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: 榮譽與成就 */}
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', color: colors.textSlateDark, display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                            <Trophy color="#f59e0b" /> 榮譽與成就 (Achievements)
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {recentAwards.length > 0 ? recentAwards.map((ach, idx) => {
                                const badge = ACHIEVEMENT_DATA[ach.badgeId];
                                if (!badge) return null;
                                const levelData = badge.levels[ach.level || 1];
                                return (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'white', border: '2px solid #f1f5f9', padding: '16px', borderRadius: '16px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
                                        <div style={{ width: '64px', height: '64px', backgroundColor: '#fffbeb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', flexShrink: 0 }}>
                                            {React.cloneElement(badge.icon, { size: 32 })}
                                        </div>
                                        <div>
                                            <h4 style={{ fontSize: '20px', fontWeight: '900', color: colors.textSlateDark, margin: '0 0 4px 0' }}>{levelData.name}</h4>
                                            <p style={{ fontSize: '14px', fontWeight: 'bold', color: colors.textSlateMedium, margin: 0 }}>{levelData.desc}</p>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <div style={{ padding: '32px', backgroundColor: colors.bgSlateLight, borderRadius: '24px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold', fontSize: '18px' }}>持續努力，累積獎牌！</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 'auto', paddingTop: '32px', borderTop: '2px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#94a3b8' }}>
                    <p style={{ fontWeight: 'bold', margin: 0 }}>BCKLAS Squash Team Management System</p>
                    <p style={{ fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Award size={16}/> Certified Player Record</p>
                </div>
            </div>
        </div>
    );
});

export default PortfolioGenerator;
