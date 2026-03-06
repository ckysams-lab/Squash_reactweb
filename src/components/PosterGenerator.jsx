// src/components/PosterGenerator.jsx
import React from 'react';
import { Trophy as TrophyIcon } from 'lucide-react';
import QRCode from 'qrcode.react';

const PosterGenerator = React.forwardRef(({ data, schoolLogo }, ref) => {
    if (!data) return null;
    
    return (
        <div ref={ref} className="bg-white p-8" style={{ width: '827px', height: '1170px', fontFamily: 'sans-serif', position: 'relative' }}>
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
                {schoolLogo ? (
                    <img src={schoolLogo} alt="School Logo" className="h-24 object-contain" crossOrigin="anonymous"/>
                ) : (
                    <div className="w-24 h-24 bg-slate-200"></div>
                )}
                <div className="text-center">
                    <h1 style={{ fontFamily: 'serif', fontSize: '48px', fontWeight: 'bold' }}>BCKLAS 壁球隊 每月之星</h1>
                    <p style={{ fontSize: '28px', fontWeight: '600' }}>{data.month.replace('-', ' 年 ')} 月</p>
                </div>
                <div className="w-24 h-24 flex items-center justify-center text-slate-400">
                    <TrophyIcon size={80} />
                </div>
            </div>
            
            <div className="flex mt-8 gap-8">
                {/* 男生每月之星 */}
                <div className="w-1/2">
                    <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">PLAYER OF THE MONTH (MALE)</h2>
                    <div className="w-full bg-slate-200" style={{ height: '500px' }}>
                        {data.maleWinner.fullBodyPhotoUrl && <img src={data.maleWinner.fullBodyPhotoUrl} className="w-full h-full object-cover object-top" crossOrigin="anonymous"/>}
                    </div>
                    <h3 className="text-4xl font-bold mt-4">{data.maleWinner.studentName} <span className="text-2xl text-slate-500">({data.maleWinner.studentClass})</span></h3>
                    <div className="mt-6 space-y-4">
                        <div>
                            <h4 className="text-xl font-bold border-b-2 border-blue-600 inline-block pb-1 mb-2">獲選原因</h4>
                            <p className="text-lg">{data.maleWinner.reason}</p>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold border-b-2 border-blue-600 inline-block pb-1 mb-2">本年度目標</h4>
                            <p className="text-lg italic">"{data.maleWinner.goals}"</p>
                        </div>
                    </div>
                </div>
                
                {/* 女生每月之星 */}
                <div className="w-1/2">
                    <h2 className="text-2xl font-bold text-pink-600 mb-4 text-center">PLAYER OF THE MONTH (FEMALE)</h2>
                    <div className="w-full bg-slate-200" style={{ height: '500px' }}>
                         {data.femaleWinner.fullBodyPhotoUrl && <img src={data.femaleWinner.fullBodyPhotoUrl} className="w-full h-full object-cover object-top" crossOrigin="anonymous"/>}
                    </div>
                    <h3 className="text-4xl font-bold mt-4">{data.femaleWinner.studentName} <span className="text-2xl text-slate-500">({data.femaleWinner.studentClass})</span></h3>
                     <div className="mt-6 space-y-4">
                        <div>
                            <h4 className="text-xl font-bold border-b-2 border-pink-500 inline-block pb-1 mb-2">獲選原因</h4>
                            <p className="text-lg">{data.femaleWinner.reason}</p>
                        </div>
                        <div>
                            <h4 className="text-xl font-bold border-b-2 border-pink-500 inline-block pb-1 mb-2">本年度目標</h4>
                            <p className="text-lg italic">"{data.femaleWinner.goals}"</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                <p className="text-lg font-semibold italic">汗水鑄就榮耀，目標定義未來</p>
                <div className="text-center">
                    <QRCode value={window.location.href} size={80} />
                    <p className="text-xs font-bold mt-1">線上回顧歷屆每月之星</p>
                </div>
            </div>
        </div>
    );
});

PosterGenerator.displayName = 'PosterGenerator';

export default PosterGenerator;
