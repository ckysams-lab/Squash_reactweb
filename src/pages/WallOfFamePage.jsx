// src/pages/WallOfFamePage.jsx (Version 2.2 - Realistic Model & Bug Fix)

import React, { useState, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { X, Users, Award as AwardIcon, Star } from 'lucide-react';

// --- 1. (V2.2 新增) 獎盃 3D 模型組件 ---
// 這個組件現在會載入一個外部的 .glb 模型檔案
function TrophyModel({ position, trophy, onClick }) {
  const [hovered, setHovered] = useState(false);
  
  // 從網路上載入一個預先做好的、免費的獎盃模型
  // useGLTF.preload 會在背景預先載入，提升體驗
  const { nodes, materials } = useGLTF('https://api.pmnd.rs/models/trophy.glb');

  return (
    <group 
        position={position} 
        onClick={() => onClick(trophy, position)} 
        onPointerOver={() => setHovered(true)} 
        onPointerOut={() => setHovered(false)}
        dispose={null}
        scale={0.5} // 調整模型大小以適應場景
    >
      {/* 基座 */}
      <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.2, 64]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
      </mesh>
       <Html position={[0, -0.8, 0]}>
          <div className="text-center w-40 pointer-events-none">
              <p className="text-white font-black text-lg">{trophy.year}</p>
              <p className="text-xs text-slate-400 leading-tight">{trophy.tournamentName}</p>
          </div>
       </Html>
      
      {/* 載入的獎盃模型 */}
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Trophy_1.geometry}
        material={materials.Trophy}
        // 當滑鼠懸停時，讓獎盃發出金光
        material-emissive={hovered ? '#fbbf24' : 'black'}
      />
    </group>
  );
}
// 預先載入模型
useGLTF.preload('https://api.pmnd.rs/models/trophy.glb');


// --- 2. (V2.2 修正) 資訊卡組件，現在會接收位置 ---
const TrophyInfoCard = ({ trophy, onClose }) => {
    if (!trophy) return null;

    return (
        <Html>
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


// 傳奇校友彈出視窗 (保持不變)
const AlumniModal = ({ alumni, onClose }) => { /* ... */ };


export default function WallOfFamePage({ trophies, alumni }) {
    // 3. (V2.2 修正) state 現在會儲存獎盃資料和它的位置
    const [selectedTrophy, setSelectedTrophy] = useState(null); 
    const [showAlumni, setShowAlumni] = useState(false);
    const spacing = 5;
    const itemsPerRow = 5;

    return (
        <div className="w-full h-[80vh] bg-gray-900 rounded-3xl overflow-hidden relative animate-in fade-in duration-500 border-4 border-slate-700">
            <Canvas camera={{ position: [0, 6, 18], fov: 60 }} shadows>
                <Suspense fallback={<Html center><span className="text-white font-bold animate-pulse">載入 3D 場景及模型中...</span></Html>}>
                    {/* ... (燈光、地板、攝影機控制器等保持不變) ... */}
                    <ambientLight intensity={0.7} />
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
                        return <TrophyModel key={trophy.id} position={[x, 1, z]} trophy={trophy} onClick={(data, pos) => setSelectedTrophy({ data, pos })} />
                    })}
                    
                    {/* 4. (V2.2 修正) 將資訊卡渲染在被點擊的獎盃位置上 */}
                    {selectedTrophy && (
                        <group position={selectedTrophy.pos}>
                            <TrophyInfoCard trophy={selectedTrophy.data} onClose={() => setSelectedTrophy(null)} />
                        </group>
                    )}
                </Suspense>
            </Canvas>

            {/* ... (左上角標題和右下角校友按鈕保持不變) ... */}
             <div className="absolute top-6 left-6 text-white p-4 rounded-xl bg-black/30 backdrop-blur-sm pointer-events-none">
                <h2 className="text-2xl font-black">榮譽殿堂</h2>
                <p className="text-xs text-slate-300">使用滑鼠拖曳、滾動來瀏覽</p>
            </div>
             <button onClick={() => setShowAlumni(true)} className="absolute bottom-6 right-6 text-white p-4 rounded-xl bg-black/30 backdrop-blur-sm max-w-xs text-left hover:bg-black/50 transition-colors">
                <h3 className="text-lg font-bold flex items-center gap-2"><Users size={16}/> 傳奇校友</h3>
                <p className="text-xs text-slate-300 mt-1">點擊查看歷屆傑出隊員</p>
            </button>
            {showAlumni && <AlumniModal alumni={alumni} onClose={() => setShowAlumni(false)} />}
        </div>
    );
}

// 因為 AlumniModal 內容沒有變，我把它折疊起來以節省空間
const AlumniModalFull = ({ alumni, onClose }) => (
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
AlumniModal = AlumniModalFull; // Assign the full component
