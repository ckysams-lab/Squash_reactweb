// src/pages/WallOfFamePage.jsx (Version 2.1 - Better Models & Alumni Modal)

import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { X, Users, Award as AwardIcon, Star } from 'lucide-react';

// 獎盃 3D 模型 (V2.1 - 優化外觀)
const TrophyModel = ({ position, trophy, onClick }) => {
    const [hovered, setHovered] = useState(false);

    const modelShape = useMemo(() => {
        const awardText = trophy.award.toLowerCase();
        if (awardText.includes('冠軍') || awardText.includes('第一')) return 'cup';
        if (awardText.includes('亞軍') || awardText.includes('第二')) return 'plate';
        return 'plaque';
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
                <boxGeometry args={[1.5, 1, 1.5]} />
                <meshStandardMaterial color="#2d3748" metalness={0.9} roughness={0.4} />
            </mesh>
             <Text position={[0, 0.2, 0.8]} fontSize={0.25} color="white" anchorX="center" maxWidth={1.8}>
                {trophy.year}
            </Text>
            
            {/* 獎盃主體 (V2.1 - 更多細節) */}
            {modelShape === 'cup' && (
                <group position={[0, 1, 0]}>
                    <mesh position={[0, 0.2, 0]}> {/* 盃座 */}
                        <cylinderGeometry args={[0.2, 0.3, 0.4, 24]} />
                        <meshStandardMaterial color={hovered ? '#fef08a' : '#facc15'} metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 0.8, 0]}> {/* 盃身 */}
                        <cylinderGeometry args={[0.1, 0.1, 0.8, 12]} />
                        <meshStandardMaterial color={hovered ? '#fef08a' : '#facc15'} metalness={0.8} roughness={0.2} />
                    </mesh>
                    <mesh position={[0, 1.5, 0]}> {/* 盃口 */}
                        <cylinderGeometry args={[0.6, 0.5, 0.6, 32]} />
                        <meshStandardMaterial color={hovered ? '#fef08a' : '#facc15'} metalness={0.8} roughness={0.2} emissive={hovered ? '#facc15' : '#000'} emissiveIntensity={0.5}/>
                    </mesh>
                </group>
            )}
            {modelShape === 'plate' && (
                 <mesh position={[0, 1.2, 0]}>
                    <cylinderGeometry args={[0.8, 0.8, 0.1, 64]} rotation={[Math.PI / 2, 0, 0]}/>
                    <meshStandardMaterial color={hovered ? '#e2e8f0' : '#cbd5e1'} metalness={0.9} roughness={0.3} emissive={hovered ? '#e2e8f0' : '#000'} emissiveIntensity={0.3} />
                </mesh>
            )}
            {modelShape === 'plaque' && (
                <mesh position={[0, 1.7, 0]}>
                    <boxGeometry args={[1, 1.4, 0.2]} />
                    <meshStandardMaterial color={hovered ? '#fca5a5' : '#f87171'} metalness={0.7} roughness={0.4} emissive={hovered ? '#f87171' : '#000'} emissiveIntensity={0.4}/>
                </mesh>
            )}
        </group>
    );
};

// 獎盃資訊卡 (2D HTML)
const TrophyInfoCard = ({ trophy, onClose }) => { /* ... 保持不變 ... */ };

// (V2.1 - 新增) 傳奇校友彈出視窗
const AlumniModal = ({ alumni, onClose }) => {
    return (
        <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={onClose}>
            <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3"><Users className="text-indigo-500"/> 傳奇校友錄</h2>
                    <p className="text-sm text-slate-500 mt-1">感謝這些為球隊奠定輝煌基礎的前輩們</p>
                </div>
                <div className="p-8 overflow-y-auto space-y-4">
                    {alumni.map(person => (
                        <div key={person.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-6">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                                <Star className="text-indigo-400" size={32} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-800">{person.name}</p>
                                <p className="text-xs text-slate-400 font-bold mt-1">畢業年份: {person.graduationYear}</p>
                                <p className="mt-2 text-sm text-slate-600 font-semibold">"{person.achievement}"</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 text-center border-t">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200">關閉</button>
                </div>
            </div>
        </div>
    );
};


export default function WallOfFamePage({ trophies, alumni }) {
    const [selectedTrophy, setSelectedTrophy] = useState(null);
    const [showAlumni, setShowAlumni] = useState(false); // (V2.1 - 新增)
    const spacing = 5;
    const itemsPerRow = 5;

    return (
        <div className="w-full h-[80vh] bg-gray-900 rounded-3xl overflow-hidden relative animate-in fade-in duration-500 border-4 border-slate-700">
            <Canvas camera={{ position: [0, 6, 18], fov: 60 }} shadows>
                <Suspense fallback={<Html center><span className="text-white font-bold animate-pulse">載入 3D 場景中...</span></Html>}>
                    {/* ... (燈光、地板、攝影機控制器等保持不變) ... */}
                    <ambientLight intensity={0.6} />
                    <spotLight position={[20, 30, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                    <directionalLight position={[-10, 10, -5]} intensity={1} color="#ffffff" />
                    <pointLight position={[0, -10, 0]} intensity={1} color="#334155" />
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                        <planeGeometry args={[100, 100]} />
                        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.1} />
                    </mesh>
                    <OrbitControls enablePan={false} minDistance={5} maxDistance={30} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2.2}/>

                    {trophies.map((trophy, index) => {
                        const row = Math.floor(index / itemsPerRow);
                        const col = index % itemsPerRow;
                        const x = (col - (itemsPerRow - 1) / 2) * spacing;
                        const z = -row * spacing;
                        return <TrophyModel key={trophy.id} position={[x, 0, z]} trophy={trophy} onClick={setSelectedTrophy} />
                    })}
                    
                    {selectedTrophy && <TrophyInfoCard trophy={selectedTrophy} onClose={() => setSelectedTrophy(null)} />}
                </Suspense>
            </Canvas>

            {/* 左上角標題 */}
            <div className="absolute top-6 left-6 text-white p-4 rounded-xl bg-black/30 backdrop-blur-sm pointer-events-none">
                <h2 className="text-2xl font-black">榮譽殿堂</h2>
                <p className="text-xs text-slate-300">使用滑鼠拖曳、滾動來瀏覽</p>
            </div>

             {/* (V2.1 - 修改) 右下角傳奇校友區塊，現在是個按鈕 */}
             <button onClick={() => setShowAlumni(true)} className="absolute bottom-6 right-6 text-white p-4 rounded-xl bg-black/30 backdrop-blur-sm max-w-xs text-left hover:bg-black/50 transition-colors">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users size={16}/> 傳奇校友</h3>
                <p className="text-xs text-slate-300 mt-1">點擊查看歷屆傑出隊員</p>
            </button>

            {/* (V2.1 - 新增) 當 showAlumni 為 true 時，顯示彈出視窗 */}
            {showAlumni && <AlumniModal alumni={alumni} onClose={() => setShowAlumni(false)} />}
        </div>
    );
}
