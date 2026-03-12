// src/pages/WallOfFamePage.jsx (Version 2.0 - 3D Trophy Room)

import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { X, Users, Award as AwardIcon } from 'lucide-react';

// 獎盃 3D 模型組件
const TrophyModel = ({ position, trophy, onClick }) => {
    const [hovered, setHovered] = useState(false);

    // 根據獎項名稱，決定獎盃的形狀
    const modelShape = useMemo(() => {
        const awardText = trophy.award.toLowerCase();
        if (awardText.includes('冠軍') || awardText.includes('第一')) return 'cup';
        if (awardText.includes('亞軍') || awardText.includes('第二')) return 'plate';
        return 'plaque'; // 其他獎項使用牌匾狀
    }, [trophy.award]);

    return (
        <group 
            position={position} 
            onClick={() => onClick(trophy)} 
            onPointerOver={() => setHovered(true)} 
            onPointerOut={() => setHovered(false)}
            title={`${trophy.year} - ${trophy.tournamentName}`}
        >
            {/* 基座 */}
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2, 1, 2]} />
                <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.4} />
            </mesh>
             <Text position={[0, 0.2, 1.05]} fontSize={0.25} color="white" anchorX="center" maxWidth={1.8}>
                {trophy.year}
            </Text>
            
            {/* 獎盃主體 */}
            <mesh position={[0, 1.8, 0]}>
                {modelShape === 'cup' && <cylinderGeometry args={[0.6, 0.4, 1.2, 32]} />}
                {modelShape === 'plate' && <cylinderGeometry args={[0.8, 0.8, 0.1, 64]} rotation={[Math.PI / 2, 0, 0]}/>}
                {modelShape === 'plaque' && <boxGeometry args={[1, 1.2, 0.2]} />}
                <meshStandardMaterial color={hovered ? '#fef08a' : '#facc15'} metalness={0.8} roughness={0.2} emissive={hovered ? '#facc15' : '#000'} emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
};

// 獎盃資訊卡 (2D HTML)
const TrophyInfoCard = ({ trophy, onClose }) => {
    if (!trophy) return null;

    return (
        <Html center>
            <div className="bg-slate-800/80 backdrop-blur-md text-white p-6 rounded-2xl w-72 shadow-2xl animate-in fade-in zoom-in-95" >
                <button onClick={onClose} className="absolute top-2 right-2 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
                <p className="text-xs text-slate-300 font-bold">{trophy.year}</p>
                <h3 className="text-lg font-black text-amber-300 mt-1">{trophy.tournamentName}</h3>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full">
                    <AwardIcon size={14} />
                    <span className="font-bold text-sm">{trophy.award}</span>
                </div>
                {trophy.roster && trophy.roster.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-600">
                        <h4 className="text-xs uppercase font-bold text-slate-400 mb-2 flex items-center gap-2"><Users size={14}/> 獲獎隊員</h4>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                            {trophy.roster.map((player, index) => (
                                <span key={index} className="px-2 py-0.5 bg-slate-700 text-slate-200 rounded text-xs font-bold">{player}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Html>
    );
};

export default function WallOfFamePage({ trophies }) {
    const [selectedTrophy, setSelectedTrophy] = useState(null);
    const spacing = 5; // 每個獎盃之間的間距
    const itemsPerRow = 5; // 每行多少個獎盃

    return (
        <div className="w-full h-[80vh] bg-gray-900 rounded-3xl overflow-hidden relative animate-in fade-in duration-500 border-4 border-slate-700">
            <Canvas camera={{ position: [0, 6, 18], fov: 60 }} shadows>
                <Suspense fallback={<Html center><span className="text-white font-bold animate-pulse">載入 3D 場景中...</span></Html>}>
                    {/* 燈光 */}
                    <ambientLight intensity={0.6} />
                    <spotLight position={[20, 30, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                    <directionalLight position={[-10, 10, -5]} intensity={1} color="#ffffff" />
                    <pointLight position={[0, -10, 0]} intensity={1} color="#334155" />

                    {/* 地板，帶一點反射效果 */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.1} />
                    </mesh>

                    {/* 獎盃陳列 */}
                    {trophies.map((trophy, index) => {
                        const row = Math.floor(index / itemsPerRow);
                        const col = index % itemsPerRow;
                        const x = (col - (itemsPerRow - 1) / 2) * spacing;
                        const z = -row * spacing;
                        return <TrophyModel key={trophy.id} position={[x, 0, z]} trophy={trophy} onClick={setSelectedTrophy} />
                    })}
                    
                    {/* 資訊卡 */}
                    {selectedTrophy && <TrophyInfoCard trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />}

                    {/* 攝影機控制器 */}
                    <OrbitControls 
                        enablePan={false} 
                        minDistance={5} 
                        maxDistance={30} 
                        minPolarAngle={Math.PI / 4} 
                        maxPolarAngle={Math.PI / 2.2}
                    />
                </Suspense>
            </Canvas>
            <div className="absolute top-6 left-6 text-white p-4 rounded-xl bg-black/30 backdrop-blur-sm pointer-events-none">
                <h2 className="text-2xl font-black">榮譽殿堂</h2>
                <p className="text-xs text-slate-300">使用滑鼠拖曳、滾動來瀏覽</p>
            </div>
             {/* 我們也可以把傳奇校友顯示在 2D 介面，作為補充 */}
             <div className="absolute bottom-6 right-6 text-white p-4 rounded-xl bg-black/30 backdrop-blur-sm max-w-xs">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users size={16}/> 傳奇校友</h3>
                <div className="text-xs text-slate-300 mt-2 space-y-1">
                     {/* alumni prop to be added */}
                </div>
            </div>
        </div>
    );
}

