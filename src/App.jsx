import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, ClipboardCheck, DollarSign, Plus, Trash2, 
  UserCheck, Calendar as CalendarIcon, ShieldCheck, Menu, X, Loader2,
  Trophy, Megaphone, Upload, LogIn, LogOut, Lock, User, MinusCircle, PlusCircle, 
  Save, FileSpreadsheet, Download, FileText, Info, Link as LinkIcon, Settings2,
  ChevronRight, Search, Filter, History, Clock, MapPin, Layers, Award,
  Trophy as TrophyIcon, Star, Target, TrendingUp, ChevronDown, CheckCircle2,
  FileBarChart, Crown, ListChecks, Image as ImageIcon, Video, PlayCircle, Camera,
  Hourglass, Medal, Folder, ArrowLeft, Bookmark, BookOpen, Swords, Globe, Cake, ExternalLink, Key, Mail,
  Zap, Shield as ShieldIcon, Sun, Sparkles, Heart, Rocket, Coffee,
  Pencil, Percent, UserPlus, Printer, Eye, Columns, BookMarked, Activity
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, deleteDoc, query, orderBy, serverTimestamp, updateDoc, writeBatch, increment, where
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode.react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

// --- 版本控制 ---
const CURRENT_VERSION = "11.2";

// --- Firebase 初始化 ---
let firebaseConfig;
let app = null;
let auth = null;
let db = null;

try {
  const envConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
  if (envConfig) {
    firebaseConfig = JSON.parse(envConfig);
  } 
  else if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
  } 
  else {
    throw new Error("Firebase config not found. Please set VITE_FIREBASE_CONFIG in your .env.local file or define __firebase_config globally.");
  }

  if (firebaseConfig) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    throw new Error("firebaseConfig object is empty or invalid after parsing.");
  }

} catch (e) {
  console.error("Firebase Initialization Failed:", e.message);
  if (import.meta.env.DEV) {
    document.body.innerHTML = `<div style="padding: 2rem; font-family: sans-serif; background-color: #FFFBEB; color: #92400E; height: 100vh;"><h1 style="font-size: 1.5rem; font-weight: bold;">Firebase 初始化失敗</h1><p>系統找不到 Firebase 的設定檔。請檢查以下步驟：</p><ol style="list-style-type: decimal; padding-left: 2rem;"><li>確認專案根目錄下有名為 <code>.env.local</code> 的檔案。</li><li>確認 <code>.env.local</code> 檔案中已設定 <code>VITE_FIREBASE_CONFIG</code> 變數。</li><li>在修改 <code>.env.local</code> 檔案後，您可能需要<strong>重新啟動開發伺服器</strong>。</li></ol><p>錯誤詳情: ${e.message}</p></div>`;
  }
  else {
     document.body.innerText = "Application failed to load. Please contact the administrator.";
  }
}

// Calendar Localizer
const localizer = momentLocalizer(moment);

const appId = 'bcklas-squash-core-v1'; 
// --- 版本 12.0: 勳章系統重構 ---
// --- 完整更新版：勳章系統重構 (依據最新清單) ---
const ACHIEVEMENT_DATA = {
  // ================= 賽事實踐類 =================
  'first-participation': {
    baseName: '賽場新星',
    rarity: '普通', // 最高稀有度標示
    icon: <Star size={24} className="text-blue-400" />,
    levels: { 
      1: { name: '賽場新星 (銅)', desc: '首次代表學校參加校外賽' },
      2: { name: '經驗老手 (銀)', desc: '累積參加 5 場校外賽' },
      3: { name: '習慣成自然 (金)', desc: '累積參加 20 場校外賽' }
    }
  },
  'first-win-ext': {
    baseName: '首戰告捷',
    rarity: '史詩',
    icon: <Rocket size={24} className="text-indigo-500" />,
    levels: {
      1: { name: '首戰告捷 (銅)', desc: '首次在校外賽中勝出一場' },
      2: { name: '連戰連捷 (銀)', desc: '在校外賽中累積勝出 5 場' },
      3: { name: '百戰強者 (金)', desc: '在校外賽中累積勝出 15 場' }
    }
  },
  'giant-killer': {
    baseName: '巨人殺手',
    rarity: '稀有',
    icon: <ShieldIcon size={24} className="text-red-500" />,
    levels: { 1: { name: '巨人殺手', desc: '戰勝比自己排名高 10 位以上的對手' } }
  },
  'ice-breaker': { 
    baseName: '破蛋者', 
    rarity: '普通', 
    icon: <Zap size={24} className="text-yellow-400" />, 
    levels: { 1: { name: '破蛋者', desc: '首次在內部聯賽中獲勝' } } 
  },
  'emerging-talent': {
    baseName: '鋒芒漸露',
    rarity: '稀有',
    icon: <Swords size={24} className="text-emerald-500" />,
    levels: { 1: { name: '鋒芒漸露', desc: '內部聯賽勝出 3 場' } }
  },
  'elite-master': {
    baseName: '精英大師',
    rarity: '史詩',
    icon: <Crown size={24} className="text-purple-500" />,
    levels: { 1: { name: '精英大師', desc: '內部聯賽勝出 10 場' } }
  },
  'momentum': {
    baseName: '一鼓作氣',
    rarity: '史詩',
    icon: <TrendingUp size={24} className="text-rose-500" />,
    levels: { 1: { name: '一鼓作氣', desc: '內部聯賽連續勝出 3 場' } }
  },
  'tension-master': {
    baseName: '緊張大師',
    rarity: '史詩',
    icon: <Activity size={24} className="text-orange-500" />,
    levels: { 1: { name: '緊張大師', desc: '勝出一場 3：2 的比賽' } }
  },
  'never-give-up': {
    baseName: '愛拚才會贏',
    rarity: '傳說',
    icon: <Heart size={24} className="text-red-600 fill-red-600" />,
    levels: { 1: { name: '愛拚才會贏', desc: '落後 2 局下，反勝 3:2' } }
  },
  'persistent-effort': {
    baseName: '參與壁球班',
    rarity: '傳說',
    icon: <Clock size={24} className="text-teal-600" />,
    levels: {
      1: { name: '努力不懈', desc: '參與了 3 年壁球班' },
      2: { name: '壁球愛好者', desc: '參與了 5 年壁球班' },
      3: { name: '中流砥柱', desc: '參與了 6 年壁球班' }
    }
  },

  // ================= 榮譽類 =================
  'bronze-honor': { 
    baseName: '銅級榮譽', rarity: '稀有', 
    icon: <Medal size={24} className="text-orange-400" />, 
    levels: { 1: { name: '銅級榮譽', desc: '首次贏得校外賽季軍或殿軍' } } 
  },
  'silver-honor': { 
    baseName: '銀級榮譽', rarity: '史詩', 
    icon: <Medal size={24} className="text-slate-400" />, 
    levels: { 1: { name: '銀級榮譽', desc: '首次贏得校外賽亞軍' } } 
  },
  'gold-honor': { 
    baseName: '金級榮譽', rarity: '史詩', 
    icon: <Medal size={24} className="text-yellow-500" />, 
    levels: { 1: { name: '金級榮譽', desc: '首次贏得校外賽冠軍' } } 
  },
  'bcklas-number-one': {
    baseName: '正覺一',
    rarity: '傳說',
    icon: <TrophyIcon size={24} className="text-amber-500 fill-amber-500" />,
    levels: { 1: { name: '正覺一', desc: '贏得內部聯賽冠軍' } }
  },
  'mvp': { 
    baseName: '年度 MVP', rarity: '傳說', 
    icon: <Crown size={24} className="text-yellow-600 fill-yellow-500" />, 
    levels: { 1: { name: '年度 MVP', desc: '賽季積分榜第一名' } } 
  },
  'top-three': { 
    baseName: '年度三甲', rarity: '史詩', 
    icon: <TrophyIcon size={24} className="text-slate-700" />, 
    levels: { 1: { name: '年度三甲', desc: '賽季積分榜前三名' } } 
  },
  'elite-player': { 
    baseName: '年度壁球精英', rarity: '稀有', 
    icon: <Sparkles size={24} className="text-blue-500" />, 
    levels: { 1: { name: '年度壁球精英', desc: '賽季積分榜前八名' } } 
  },

  // ================= 訓練態度類 =================
  'perfect-attendance': { 
    baseName: '全勤小蜜蜂', rarity: '普通', 
    icon: <Sun size={24} className="text-orange-400 fill-orange-200" />, 
    levels: { 1: { name: '全勤小蜜蜂', desc: '單月訓練全勤，風雨不改' } } 
  },
  'diligent-practice': { 
    baseName: '勤奮練習', rarity: '普通', 
    icon: <Coffee size={24} className="text-amber-700" />, 
    levels: { 1: { name: '勤奮練習', desc: '訓練態度認真，值得嘉許' } } 
  },
  'team-spirit': { 
    baseName: '團隊精神', rarity: '普通', 
    icon: <Users size={24} className="text-sky-500" />, 
    levels: { 1: { name: '團隊精神', desc: '具備體育精神，樂於助人' } } 
  },
  'little-teacher': {
    baseName: '小老師',
    rarity: '稀有',
    icon: <BookOpen size={24} className="text-emerald-600" />,
    levels: { 1: { name: '小老師', desc: '壁球比賽或練習時，會主動教導其他同學' } }
  },

  // ================= 隱藏/特殊類 =================
  'squash-new-force': {
    baseName: '壁球生力軍',
    rarity: '稀有',
    icon: <Zap size={24} className="text-blue-600 fill-blue-600" />,
    levels: { 1: { name: '壁球生力軍', desc: '參加了壁球總會的生力軍計劃' } }
  },
  'district-training': {
    baseName: '地區訓練班',
    rarity: '史詩',
    icon: <MapPin size={24} className="text-purple-600" />,
    levels: { 1: { name: '地區訓練班', desc: '獲參加壁球總會的青苗訓練計劃' } }
  },
  'district-elite': {
    baseName: '地區精英隊',
    rarity: '傳說',
    icon: <Target size={24} className="text-rose-600" />,
    levels: { 1: { name: '地區精英隊', desc: '獲挑選成為壁球總會的地區精英隊' } }
  },
  'world-view': {
    baseName: '世界觀，觀世界',
    rarity: '稀有',
    icon: <Globe size={24} className="text-sky-400" />,
    levels: { 1: { name: '世界觀，觀世界', desc: '參加國際級壁球賽事' } }
  },
  'out-of-hk': {
    baseName: '衝出香港',
    rarity: '傳說',
    icon: <Globe size={24} className="text-indigo-600 fill-indigo-200" />,
    levels: { 1: { name: '衝出香港', desc: '贏得國際級壁球賽事獎項' } }
  }
};


// --- Helper function ---
const toDataURL = (url) => {
    return new Promise((resolve) => {
        if (!url || url.startsWith('data:image')) { resolve(url); return; }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            try {
              const dataURL = canvas.toDataURL('image/png');
              resolve(dataURL);
            } catch (e) { console.error("Canvas toDataURL failed:", e); resolve(null); }
        };
        img.onerror = () => { console.error("Image toDataURL failed to load:", url); resolve(null); };
        img.src = url;
    });
};

const getAcademicYear = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    if (month >= 8) { // Sept (8) to Dec (11)
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { // Jan (0) to Aug (7)
        return `${year - 1}-${year.toString().slice(-2)}`;
    }
};

const PosterTemplate = React.forwardRef(({ data, schoolLogo }, ref) => {
    if (!data) return null;
    return (
        <div ref={ref} className="bg-white p-8" style={{ width: '827px', height: '1170px', fontFamily: 'sans-serif', position: 'relative' }}>
            <div className="flex justify-between items-center border-b-4 border-black pb-4">
                {schoolLogo ? <img src={schoolLogo} alt="School Logo" className="h-24 object-contain" crossOrigin="anonymous"/> : <div className="w-24 h-24 bg-slate-200"></div>}
                <div className="text-center">
                    <h1 style={{ fontFamily: 'serif', fontSize: '48px', fontWeight: 'bold' }}>BCKLAS 壁球隊 每月之星</h1>
                    <p style={{ fontSize: '28px', fontWeight: '600' }}>{data.month.replace('-', ' 年 ')} 月</p>
                </div>
                <div className="w-24 h-24 flex items-center justify-center text-slate-400"><TrophyIcon size={80}/></div>
            </div>
            <div className="flex mt-8 gap-8">
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
    )
  });
PosterTemplate.displayName = 'PosterTemplate';

export default function App() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]); 
  const [competitions, setCompetitions] = useState([]);
  const [schedules, setSchedules] = useState([]); 
  const [galleryItems, setGalleryItems] = useState([]); 
  const [awards, setAwards] = useState([]); 
  const [achievements, setAchievements] = useState([]); 
  const [leagueMatches, setLeagueMatches] = useState([]);
  const [externalTournaments, setExternalTournaments] = useState([]);
  const [assessments, setAssessments] = useState([]); // <- 新增
  const [newAssessment, setNewAssessment] = useState({  // <- 新增
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    situps: '',
    shuttleRun: '',
    enduranceRun: '',
    gripStrength: '',
    flexibility: '',
    fhDrive: '',
    bhDrive: '',
    fhVolley: '',
    bhVolley: '',
    notes: ''
  });

  const [downloadFiles, setDownloadFiles] = useState([]);
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [viewingStudent, setViewingStudent] = useState(null); 
  const [showPlayerCard, setShowPlayerCard] = useState(null);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [newTournamentName, setNewTournamentName] = useState('');
  const [tournamentPlayers, setTournamentPlayers] = useState([]);
  const [numGroups, setNumGroups] = useState(1);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [awardsViewMode, setAwardsViewMode] = useState('grid'); 
  const [showcaseEditorOpen, setShowcaseEditorOpen] = useState(false);
  const [selectedFeaturedBadges, setSelectedFeaturedBadges] = useState([]);
  const [viewingBadge, setViewingBadge] = useState(null); 
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [studentToAward, setStudentToAward] = useState(null);


  {/* --- START: 版本 12.6 修正 - 補上遺漏的函式 --- */}
const handleSaveFeaturedBadges = async () => {
    if (!currentUserInfo) return;
    
    // 確保從最新的 students 陣列中抓取到正確的學生文檔 ID
    const studentData = students.find(s => s.authEmail === currentUserInfo.authEmail || s.id === currentUserInfo.id);
    
    if (!studentData || !studentData.id) {
        alert("找不到你的帳號資料，請嘗試重新登入再試一次！");
        return;
    }

    setIsUpdating(true);
    try {
        const studentRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentData.id);
        await updateDoc(studentRef, {
            featuredBadges: selectedFeaturedBadges,
            lastUpdated: serverTimestamp() // 順便更新最後修改時間
        });
        
        // 更新當前的 currentUserInfo 狀態，讓畫面能即時反應
        setCurrentUserInfo(prev => ({ ...prev, featuredBadges: selectedFeaturedBadges }));
        
        alert('✅ 你的勳章展示牆已成功更新！');
        setShowcaseEditorOpen(false);
    } catch (e) {
        console.error("Failed to save featured badges:", e);
        alert(`儲存失敗 (${e.code || '未知錯誤'})，請聯絡教練或檢查網絡。`);
    }
    setIsUpdating(false);
};



  const [systemConfig, setSystemConfig] = useState({ 
    adminPassword: 'admin', 
    announcements: [],
    theme: 'default',
    schoolLogo: null 
  });
  
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginClass, setLoginClass] = useState('');
  const [loginClassNo, setLoginClassNo] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginTab, setLoginTab] = useState('student');

  const [importEncoding, setImportEncoding] = useState('AUTO');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('ALL');
  
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const galleryInputRef = useRef(null);
  
  const [financeConfig, setFinanceConfig] = useState({
    nTeam: 1, costTeam: 2750,
    nTrain: 3, costTrain: 1350,
    nHobby: 4, costHobby: 1200,
    totalStudents: 50, feePerStudent: 250
  });

  const [monthlyStars, setMonthlyStars] = useState([]);
  const [selectedMonthForAdmin, setSelectedMonthForAdmin] = useState(new Date().toISOString().slice(0, 7));
  const [monthlyStarEditData, setMonthlyStarEditData] = useState({
      month: new Date().toISOString().slice(0, 7),
      maleWinner: { studentId: '', studentName: '', studentClass: '', reason: '', goals: '', fullBodyPhotoUrl: null },
      femaleWinner: { studentId: '', studentName: '', studentClass: '', reason: '', goals: '', fullBodyPhotoUrl: null },
  });
  const [malePhotoPreview, setMalePhotoPreview] = useState(null);
  const [femalePhotoPreview, setFemalePhotoPreview] = useState(null);
  const posterRef = useRef(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterData, setPosterData] = useState(null);

    const [showAddAwardModal, setShowAddAwardModal] = useState(false);
  const [newAwardData, setNewAwardData] = useState({
    title: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    rank: '',
    description: '',
    photoUrl: null, // 將用來儲存 Base64 圖片
  });
  const [awardPhotoPreview, setAwardPhotoPreview] = useState(null);
  
  const [newExternalMatch, setNewExternalMatch] = useState({
    tournamentName: '',
    date: new Date().toISOString().split('T')[0],
    player1Id: '',
    opponentSchool: '',
    opponentPlayerName: '',
    externalMatchScore: '',
    isWin: null,
  });
  
  useEffect(() => {
    const storedVersion = localStorage.getItem('app_version');
    if (storedVersion !== CURRENT_VERSION) {
      console.log(`[System] Detected new version: ${CURRENT_VERSION}. Cleaning cache...`);
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('app_version', CURRENT_VERSION);
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const theme = systemConfig?.theme || 'default';
    document.body.className = `theme-${theme}`; // 移除舊的，設置新的
  }, [systemConfig?.theme]);
  
  useEffect(() => {
    if (!user) return;
    
    try {
      const listeners = [];
      // 版本 11.4: 修正因遺漏 `assessments` 集合定義而導致的 Firestore 初始化錯誤
      const collections = {
        students: collection(db, 'artifacts', appId, 'public', 'data', 'students'),
        attendance_logs: collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs'),
        competitions: collection(db, 'artifacts', appId, 'public', 'data', 'competitions'),
        schedules: collection(db, 'artifacts', appId, 'public', 'data', 'schedules'),
        downloadFiles: collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles'),
        gallery: collection(db, 'artifacts', appId, 'public', 'data', 'gallery'),
        awards: collection(db, 'artifacts', appId, 'public', 'data', 'awards'),
        achievements: collection(db, 'artifacts', appId, 'public', 'data', 'achievements'),
        league_matches: collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'),
        external_tournaments: collection(db, 'artifacts', appId, 'public', 'data', 'external_tournaments'),
        monthly_stars: collection(db, 'artifacts', appId, 'public', 'data', 'monthly_stars'),
        assessments: collection(db, 'artifacts', appId, 'public', 'data', 'assessments') // <-- 在此新增
      };


      const systemConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');
      const financeConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'finance');

      listeners.push(onSnapshot(systemConfigRef, (docSnap) => {
        if (docSnap.exists()) setSystemConfig(docSnap.data());
        else setDoc(systemConfigRef, { adminPassword: 'admin', announcements: [], seasonalTheme: 'default', schoolLogo: null });
      }, (e) => console.error("Config err", e)));

      listeners.push(onSnapshot(financeConfigRef, (docSnap) => {
        if (docSnap.exists()) setFinanceConfig(prev => ({...prev, ...docSnap.data()}));
        else setDoc(financeConfigRef, financeConfig);
      }, (e) => console.error("Finance err", e)));
      
      listeners.push(onSnapshot(collections.students, (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.attendance_logs, (snap) => setAttendanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.competitions, (snap) => setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.schedules, (snap) => setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.downloadFiles, (snap) => setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.gallery, (snap) => setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.awards, orderBy("date", "desc")), (snap) => setAwards(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.achievements, orderBy("timestamp", "desc")), (snap) => setAchievements(snap.docs.map(d => ({ id: d.id, ...d.data() }))))); 
      listeners.push(onSnapshot(query(collections.league_matches, orderBy("date", "desc")), (snap) => setLeagueMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.external_tournaments, orderBy("name", "asc")), (snap) => setExternalTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.monthly_stars, orderBy("month", "desc")), (snap) => setMonthlyStars(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.assessments, orderBy("date", "desc")), (snap) => { // <- 新增
        setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }));


            return () => listeners.forEach(unsub => unsub());

    } catch (e) {
      console.error("Firestore Init Error:", e);
    }
  }, [user]);

  const awardAchievement = async (badgeId, studentId, level = 1) => {
    if (!badgeId || !studentId) return;
    
    const existingBadge = achievements.find(ach => ach.studentId === studentId && ach.badgeId === badgeId);
    
    try {
        if (existingBadge) {
            if (existingBadge.level !== level) {
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'achievements', existingBadge.id);
                await updateDoc(docRef, { level: level, timestamp: serverTimestamp() });
                const badgeName = ACHIEVEMENT_DATA[badgeId].levels[level].name;
                alert(`✅ 成功將學員徽章更新為「${badgeName}」！`);
            } else {
                alert("該學員已擁有此等級的徽章，無需重複授予。");
            }
            return;
        }

        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'achievements'), {
            studentId,
            badgeId,
            level: level,
            timestamp: serverTimestamp()
        });
        const badgeName = ACHIEVEMENT_DATA[badgeId].levels[level].name;
        alert(`✅ 成功授予學員「${badgeName}」徽章！`);
    } catch (e) {
        console.error("Failed to award achievement:", e);
        alert("授予失敗，請檢查網絡連線。");
    }
  };

  const handleManualAward = (student) => {
      setStudentToAward(student);
      setShowAwardModal(true);
  };

        const selectedIndex = parseInt(choice, 10) - 1;
        if (selectedIndex >= 0 && selectedIndex < allBadges.length) {
            const [badgeId, badgeData] = allBadges[selectedIndex];
            
            // 修正：從 levels[1].name 讀取 Lv.1 的實際名稱
            const level1Name = badgeData.levels?.['1']?.name || badgeData.baseName;

            if (confirm(`確定要授予 ${student.name} 「${level1Name}」徽章嗎？`)) {
                awardAchievement(badgeId, student.id);
            }
        } else {
            alert("無效的選擇。");
        }
    }
};
{/* --- END: 版本 12.4 修正 --- */}


  const togglePendingAttendance = (studentId) => {
    setPendingAttendance(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const savePendingAttendance = async () => {
    if (pendingAttendance.length === 0) {
      alert('沒有需要儲存的點名紀錄。');
      return;
    }
    
    let scheduleToUse = todaySchedule;
    if (!scheduleToUse) {
      scheduleToUse = {
        trainingClass: '一般練習',
        date: new Date().toISOString().split('T')[0],
        location: '學校壁球場',
      };
    }

    setIsUpdating(true);
    try {
      const batch = writeBatch(db);
      const attendanceCollection = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs');
      
      pendingAttendance.forEach(studentId => {
        const student = students.find(s => s.id === studentId);
        if (student) {
          const newLogRef = doc(attendanceCollection);
          batch.set(newLogRef, {
            studentId: student.id,
            name: student.name,
            class: student.class,
            classNo: student.classNo,
            trainingClass: scheduleToUse.trainingClass,
            date: scheduleToUse.date,
            location: scheduleToUse.location,
            timestamp: serverTimestamp()
          });
        }
      });
      
      await batch.commit();
      alert(`✅ 成功儲存 ${pendingAttendance.length} 筆點名紀錄！`);
      setPendingAttendance([]);
    } catch (e) {
      console.error("Batch attendance save failed:", e);
      alert("儲存失敗，請檢查網絡或聯絡管理員。");
    }
    setIsUpdating(false);
  };

  const financialSummary = useMemo(() => {
    if (!financeConfig) return { revenue: 0, expense: 0, profit: 0 };
    const revenue = (Number(financeConfig.totalStudents) || 0) * (Number(financeConfig.feePerStudent) || 0);
    const expense = ((Number(financeConfig.nTeam) || 0) * (Number(financeConfig.costTeam) || 0)) + 
                    ((Number(financeConfig.nTrain) || 0) * (Number(financeConfig.costTrain) || 0)) + 
                    ((Number(financeConfig.nHobby) || 0) * (Number(financeConfig.costHobby) || 0));
    return { revenue, expense, profit: revenue - expense };
  }, [financeConfig]);

  const dashboardStats = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.setHours(0,0,0,0));
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const safeSchedules = Array.isArray(schedules) ? schedules : [];
    const safeCompetitions = Array.isArray(competitions) ? competitions : [];
    const safeAwards = Array.isArray(awards) ? awards : [];
    const thisMonthTrainings = safeSchedules.filter(s => {
      if (!s.date) return false;
      const d = new Date(s.date);
      return !isNaN(d) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
    const futureCompetitions = safeCompetitions
      .filter(c => c.date && new Date(c.date) >= todayZero)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
    
    let daysToNextMatch = "-";
    if (futureCompetitions.length > 0) {
      const nextMatchDate = new Date(futureCompetitions[0].date);
      if (!isNaN(nextMatchDate)) {
        const diffTime = Math.abs(nextMatchDate - todayZero);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        daysToNextMatch = diffDays === 0 ? "Today!" : `${diffDays}`;
      }
    }
    const awardsThisYear = safeAwards.filter(a => {
      if (!a.date) return false;
      const d = new Date(a.date);
      const isThisYear = !isNaN(d) && d.getFullYear() === currentYear;
      return isThisYear;
    }).length;
    return {
      thisMonthTrainings,
      daysToNextMatch,
      awardsThisYear
    };
  }, [schedules, competitions, awards]);

  const galleryAlbums = useMemo(() => {
    const albums = {};
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    safeGallery.forEach(item => {
      const title = item.title || "未分類";
      if (!albums[title]) {
        albums[title] = {
          title,
          cover: item.url, 
          count: 0,
          items: [],
          type: item.type,
          lastUpdated: item.timestamp
        };
      }
      albums[title].count += 1;
      albums[title].items.push(item);
      if (item.timestamp && albums[title].lastUpdated && item.timestamp > albums[title].lastUpdated) {
         albums[title].cover = item.url;
         albums[title].lastUpdated = item.timestamp;
      }
    });
    return Object.values(albums).sort((a,b) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));
  }, [galleryItems]);

  const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 400, level: 4, desc: "最高榮譽" },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-50", icon: "🥇", border: "border-yellow-200", shadow: "shadow-yellow-100", basePoints: 200, level: 3, desc: "卓越表現" },
    "銀章": { color: "text-slate-500", bg: "bg-slate-100", icon: "🥈", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 100, level: 2, desc: "進步神速" },
    "銅章": { color: "text-orange-600", bg: "bg-orange-50", icon: "🥉", border: "border-orange-200", shadow: "shadow-orange-100", basePoints: 30, level: 1, desc: "初露鋒芒" },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", border: "border-slate-100", shadow: "shadow-transparent", basePoints: 0, level: 0, desc: "努力中" }
  };

  useEffect(() => {
    const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
    const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;
    try {
      const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = logoUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
      document.title = "BCKLAS 壁球校隊系統";
    } catch(e) { console.error("Favicon error", e); }
  }, [systemConfig?.schoolLogo]);

  const readCSVFile = (file, encoding) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const buffer = event.target.result;
        const decoder = new TextDecoder(encoding === 'BIG5' ? 'big5' : 'utf-8');
        const text = decoder.decode(new Uint8Array(buffer));
        resolve(text);
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleCSVImportExternalTournaments = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'external_tournaments');
      let count = 0;
      rows.forEach(row => {
        const name = row.split(',')[0]?.trim();
        if (name) {
          batch.set(doc(colRef), { name, timestamp: serverTimestamp() });
          count++;
        }
      });
      await batch.commit();
      alert(`✅ 成功匯入 ${count} 個校外賽事名稱！`);
    } catch (err) {
      console.error("External tournament import failed:", err);
      alert('匯入失敗，請確認 CSV 格式 (單欄，第一行為標題)。');
    }
    setIsUpdating(false);
    e.target.value = null;
  };

    const handleSaveAssessment = async () => {
    const { studentId, date, situps, shuttleRun, enduranceRun, gripStrength, flexibility, fhDrive, bhDrive, fhVolley, bhVolley } = newAssessment;
    if (!studentId || !date) {
      alert("請選擇學員並填寫評估日期！"); return;
    }
    setIsUpdating(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), {
        ...newAssessment,
        situps: Number(situps) || 0,
        shuttleRun: Number(shuttleRun) || 0,
        enduranceRun: Number(enduranceRun) || 0,
        gripStrength: Number(gripStrength) || 0,
        flexibility: Number(flexibility) || 0,
        fhDrive: Number(fhDrive) || 0,
        bhDrive: Number(bhDrive) || 0,
        fhVolley: Number(fhVolley) || 0,
        bhVolley: Number(bhVolley) || 0,
        timestamp: serverTimestamp()
      });
      alert('✅ 綜合能力評估儲存成功！');
      setNewAssessment({
        studentId: '', date: new Date().toISOString().split('T')[0], situps: '', shuttleRun: '', enduranceRun: '', gripStrength: '', flexibility: '', fhDrive: '', bhDrive: '', fhVolley: '', bhVolley: '', notes: ''
      });
    } catch (e) {
      console.error("Failed to save assessment", e);
      alert('儲存失敗，請檢查網絡連線。');
    }
    setIsUpdating(false);
  };

  const handleAwardPhotoUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setIsUpdating(true);
  try {
    const compressedUrl = await compressImage(file, 0.8); // 使用現有的壓縮函式
    setNewAwardData(prev => ({ ...prev, photoUrl: compressedUrl }));
    setAwardPhotoPreview(URL.createObjectURL(file)); // 建立本地預覽
  } catch (err) {
    console.error("Award photo upload failed:", err);
    alert("照片上傳或壓縮失敗。");
  }
  setIsUpdating(false);
};
    // ===== START: 版本 12.4 - 儲存新獎項數據 =====
    const handleSaveAward = async () => {
      const { title, studentName, date, rank } = newAwardData;
      if (!title || !studentName || !date || !rank) {
        alert("請填寫所有必填欄位：獎項名稱、名次、獲獎學生和日期。");
        return;
      }
      setIsUpdating(true);
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'awards'), {
          ...newAwardData,
          timestamp: serverTimestamp()
        });
        alert('🏆 獎項新增成功！');
        setShowAddAwardModal(false); // 關閉 Modal
      } catch (e) {
        console.error("Failed to save award:", e);
        alert('新增失敗，請檢查網絡連線。');
      }
      setIsUpdating(false);
    };
    // ===== END: 版本 12.4 =====
  
  const handleSaveExternalMatch = async () => {
    const { player1Id, tournamentName, date, isWin, externalMatchScore, opponentSchool, opponentPlayerName } = newExternalMatch;
    if (!player1Id || !tournamentName || !date || isWin === null) {
      alert('請填寫所有必填欄位：賽事、日期、我方隊員及本場結果。');
      return;
    }

    const player = students.find(s => s.id === player1Id);
    if (!player) {
      alert('找不到指定的學生資料！');
      return;
    }

    setIsUpdating(true);
    try {
      const matchData = {
        tournamentName,
        date,
        player1Id,
        isWin,
        externalMatchScore,
        opponentSchool,
        opponentPlayerName,
        matchType: 'external',
        player1Name: player.name,
        player2Id: null, 
        player2Name: opponentPlayerName || 'N/A', 
        winnerId: isWin ? player1Id : null,
        status: 'completed',
        timestamp: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'league_matches'), matchData);
      
      alert('✅ 校外賽記錄已成功儲存！');
      setNewExternalMatch({
        tournamentName: '',
        date: new Date().toISOString().split('T')[0],
        player1Id: '',
        opponentSchool: '',
        opponentPlayerName: '',
        externalMatchScore: '',
        isWin: null,
      });

    } catch (e) {
      console.error("Failed to save external match:", e);
      alert('儲存失敗，請檢查網絡連線。');
    }
    setIsUpdating(false);
  };
    
  const deleteItem = async (col, id) => {
    if (role !== 'admin') return;
    if (window.confirm('確定要永久刪除這個項目嗎？')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    }
  };

  const handleLogin = async (type) => {
    if (type === 'admin') {
      if (!loginEmail || !loginPassword) {
        alert('請輸入教練電郵和密碼');
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
        setRole('admin'); 
        setShowLoginModal(false); 
        setActiveTab('dashboard');
      } catch (error) {
        console.error("Admin Login failed", error);
        alert('登入失敗：' + error.message + '\n(請確認教練帳號密碼是否正確)');
        return;
      }
    } else {
      if (!loginClass || !loginClassNo || !loginPassword) {
        alert('請輸入班別、班號和密碼');
        return;
      }
      
      const studentAuthEmail = `${loginClass.toLowerCase().trim()}${loginClassNo.trim()}@bcklas.squash`;

      try {
        await signInWithEmailAndPassword(auth, studentAuthEmail, loginPassword);
        const matchedStudent = students.find(s => s.authEmail === studentAuthEmail);
        
        if (matchedStudent) {
            setCurrentUserInfo(matchedStudent);
        } else {
            setCurrentUserInfo({ name: '同學', authEmail: studentAuthEmail });
        }
        setRole('student'); 
        setShowLoginModal(false); 
        setActiveTab('myDashboard');
      } catch (error) {
        console.error("Student Login failed", error);
        alert('登入失敗：\n(請確認班別、班號和密碼是否正確)');
        return;
      }
    }

    setLoginEmail('');
    setLoginClass('');
    setLoginClassNo('');
    setLoginPassword('');
  };
    
  const handleLogout = async () => { 
    try {
      await signOut(auth);
      setRole(null); 
      setCurrentUserInfo(null); 
      setShowLoginModal(true); 
      setSidebarOpen(false);
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  const rankedStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    const uniqueMap = new Map();
    students.forEach(s => {
      const key = `${s.class}-${s.classNo}`;
      const currentPoints = Number(s.points) || 0;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, s);
      } else {
        const existing = uniqueMap.get(key);
        const existingPoints = Number(existing.points) || 0;
        if (currentPoints > existingPoints) uniqueMap.set(key, s);
      }
    });
    return Array.from(uniqueMap.values()).map(s => ({ 
      ...s, 
      totalPoints: Number(s.points) || 0 
    })).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      const timeA = a.lastUpdated?.seconds || 0;
      const timeB = b.lastUpdated?.seconds || 0;
      return timeB - timeA;
    });
  }, [students]);

  const birthYearStats = useMemo(() => {
    const stats = {};
    if (Array.isArray(rankedStudents)) {
        rankedStudents.forEach(s => {
            if (s.dob) {
                const year = s.dob.split('-')[0];
                if (year) {
                    stats[year] = (stats[year] || 0) + 1;
                } else {
                    stats['未知'] = (stats['未知'] || 0) + 1;
                }
            } else {
                stats['未知'] = (stats['未知'] || 0) + 1;
            }
        });
    }
    return stats;
  }, [rankedStudents]);

  const filteredStudents = useMemo(() => {
    return rankedStudents
      .filter(s => {
        const matchSearch = searchTerm === '' || s.name.includes(searchTerm) || s.class.includes(searchTerm.toUpperCase());
        const matchYear = selectedYearFilter === 'ALL' || (s.dob && s.dob.startsWith(selectedYearFilter)) || (selectedYearFilter === '未知' && !s.dob);
        return matchSearch && matchYear;
      })
      .sort((a, b) => {
        const rankA = rankedStudents.findIndex(rs => rs.id === a.id);
        const rankB = rankedStudents.findIndex(rs => rs.id === b.id);
        return rankA - rankB;
      });
  }, [rankedStudents, searchTerm, selectedYearFilter]);

  const saveFinanceConfig = async () => {
    setIsUpdating(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'finance'), financeConfig);
      alert('財務設定已儲存！');
    } catch (e) {
      console.error(e);
      alert('儲存失敗');
    }
    setIsUpdating(false);
  };

  const adjustPoints = async (id, amount, reason = "教練調整") => {
    if (role !== 'admin' || !user) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', id), { 
        points: increment(amount),
        lastUpdated: serverTimestamp() 
      });
    } catch (e) { console.error(e); }
    setIsUpdating(false);
  };

    const handleUpdateDOB = async (student) => {
    const currentDob = student.dob || "";
    const newDob = prompt(`請輸入 ${student.name} 的出生日期 (YYYY-MM-DD):`, currentDob);
    
    if (newDob !== null) { 
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDob) && newDob !== "") {
            alert("格式錯誤！請使用 YYYY-MM-DD 格式 (例如: 2012-05-20)");
            return;
        }
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), {
                dob: newDob,
                lastUpdated: serverTimestamp()
            });
        } catch (e) { console.error("Update DOB failed", e); alert("更新失敗"); }
    }
  };

  const handleUpdateSquashClass = async (student) => {
    const currentClass = student.squashClass || "";
    const newClass = prompt(`請輸入 ${student.name} 的壁球班別 (例如: A班、B班、進階班):\n(若要清除請直接清空並按確定)`, currentClass);
    
    if (newClass !== null) { 
        setIsUpdating(true);
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), {
                squashClass: newClass.trim(),
                lastUpdated: serverTimestamp()
            });
            alert(`✅ 已將 ${student.name} 的班別更新為「${newClass.trim() || '無'}」！`);
        } catch (e) { 
            console.error("Update Squash Class failed", e); 
            alert("更新失敗，請檢查網絡連線。"); 
        }
        setIsUpdating(false);
    }
  };

  const handleExternalComp = (student) => {
    const option = prompt(
        `請為 ${student.name} 選擇校外賽成績 (輸入代號):\n\n` +
        `1. 🔵 代表學校參賽 (+20)\n` +
        `2. ⚔️ 單場勝出 (+20)\n` +
        `3. 🥇 冠軍 (+100)\n` +
        `4. 🥈 亞軍 (+50)\n` +
        `5. 🥉 季軍/殿軍 (+30)`
    );
    let points = 0;
    let reason = "";
    switch(option) {
        case '1': points = 20; reason = "校外賽參與"; break;
        case '2': points = 20; reason = "校外賽勝場"; break;
        case '3': points = 100; reason = "校外賽冠軍"; break;
        case '4': points = 50; reason = "校外賽亞軍"; break;
        case '5': points = 30; reason = "校外賽季殿軍"; break;
        default: return; 
    }
    if(confirm(`確認給予 ${student.name} 「${reason}」獎勵 (總分 +${points})?`)) {
        adjustPoints(student.id, points);
    }
  };

  const handleSeasonReset = async () => {
    const confirmText = prompt("⚠️ 警告：這將重置所有學員的積分！\n\n系統將根據學員的「章別」重新賦予底分：\n金章: 200, 銀章: 100, 銅章: 30, 無章: 0\n\n請輸入 'RESET' 確認執行：");
    if (confirmText !== 'RESET') return;
    setIsUpdating(true);
    try {
        const batch = writeBatch(db);
        students.forEach(s => {
            const ref = doc(db, 'artifacts', appId, 'public', 'data', 'students', s.id);
            const basePoints = BADGE_DATA[s.badge]?.basePoints || 0;
            batch.update(ref, { 
                points: basePoints,
                lastUpdated: serverTimestamp()
            });
        });
        await batch.commit();
        alert("✅ 新賽季已開啟！所有積分已重置。");
    } catch(e) {
        console.error(e);
        alert("重置失敗");
    }
    setIsUpdating(false);
  };

  const generateCompetitionRoster = () => {
    const topStudents = rankedStudents.slice(0, 5);
    if (topStudents.length === 0) {
      alert('目前沒有學員資料可生成名單。');
      return;
    }
    let rosterText = "🏆 BCKLAS 壁球校隊 - 推薦出賽名單 🏆\n\n";
    topStudents.forEach((s, i) => {
      rosterText += `${i+1}. ${s.name} (${s.class} ${s.classNo}) - 積分: ${s.totalPoints}\n`;
    });
    rosterText += "\n(由系統自動依據積分生成)";
    navigator.clipboard.writeText(rosterText).then(() => {
      alert('✅ 推薦名單已生成並複製到剪貼簿！\n\n你可以直接貼上到 Word 或 WhatsApp。');
    }).catch(err => {
      console.error('複製失敗', err);
      alert('複製失敗，請手動選取：\n\n' + rosterText);
    });
  };

  const exportMatrixAttendanceCSV = (targetClass) => {
      if (!targetClass || targetClass === 'ALL') {
          alert('請先從篩選器選擇一個特定的班別以匯出報表。');
          return;
      }

      const classStudents = students.filter(s => s.squashClass && s.squashClass.includes(targetClass));
      if (classStudents.length === 0) {
          alert(`「${targetClass}」沒有找到任何學員。`);
          return;
      }
      const classLogs = attendanceLogs.filter(log => log.trainingClass === targetClass);

      const uniqueDates = [...new Set(classLogs.map(log => log.date))].sort((a, b) => a.localeCompare(b));
      if (uniqueDates.length === 0) {
        alert(`「${targetClass}」沒有任何點名紀錄可供匯出。`);
        return;
      }

      const scheduleInfo = schedules.find(s => s.trainingClass === targetClass) || {};

      let csvContent = "\uFEFF"; 

      csvContent += `${targetClass},,${scheduleInfo.day || ' '},${scheduleInfo.time || ' '},${','.repeat(uniqueDates.length)}\n`;
      csvContent += `${scheduleInfo.location || ' '},,,,${uniqueDates.join(',')}\n`;

      classStudents.sort((a,b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo)).forEach(student => {
          let row = `${student.class},${student.classNo},${student.name},${student.phone || ''},`;
          uniqueDates.forEach(date => {
              const attended = classLogs.some(log => log.studentId === student.id && log.date === date);
              row += attended ? 'v,' : ',';
          });
          csvContent += row.slice(0, -1) + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${targetClass}_點名總表_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
  };

  const compressImage = (file, quality = 0.7) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1280;
          const MAX_HEIGHT = 1280;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleAddMedia = async () => {
      const type = prompt("請選擇類型 (輸入 1 或 2):\n1. 上傳照片 (自動建立相簿)\n2. YouTube 影片連結");
      
      if (type === '1') {
        if (galleryInputRef.current) {
          galleryInputRef.current.value = "";
          galleryInputRef.current.click();
        }
      } else if (type === '2') {
        const url = prompt("請輸入 YouTube 影片網址:");
        if (!url) return;
        const title = prompt("請輸入影片標題 (這將作為相簿名稱):");
        const desc = prompt("輸入描述 (可選):") || "";
        
        try {
           await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), {
              type: 'video',
              url,
              title: title || '未命名影片',
              description: desc,
              timestamp: serverTimestamp()
           });
           alert('影片新增成功！');
        } catch (e) {
           console.error(e);
           alert('新增失敗');
        }
      }
  };

  const handleGalleryImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const title = prompt(`您選擇了 ${files.length} 張照片。\n請輸入這些照片的「相簿名稱」(例如：校際比賽花絮):`);
    if (!title) return;
    const desc = prompt("輸入統一描述 (可選):") || "";
    
    setIsUploading(true);
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            const compressedBase64 = await compressImage(file);
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), {
                type: 'image',
                url: compressedBase64,
                title: title,
                description: desc,
                timestamp: serverTimestamp()
            });
            successCount++;
        } catch (err) {
            console.error("Upload failed for one image", err);
        }
    }
    
    setIsUploading(false);
    alert(`成功上傳 ${successCount} 張照片至「${title}」相簿！`);
    setCurrentAlbum(null);
  };

  const getYouTubeEmbedUrl = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  };

  const handleCSVImportSchedules = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
      
      rows.forEach(row => {
        const [className, date, location, coach, notes] = row.split(',').map(s => s?.trim().replace(/^"|"$/g, ''));
        if (date && date !== "日期") {
          batch.set(doc(colRef), { 
            trainingClass: className || '通用訓練班',
            date, 
            location: location || '學校壁球場', 
            coach: coach || '待定', 
            notes: notes || '', 
            createdAt: serverTimestamp() 
          });
        }
      });
      await batch.commit();
      alert('訓練班日程匯入成功！');
    } catch (err) { alert('匯入失敗，請確認 CSV 格式'); }
    setIsUpdating(false);
    e.target.value = null;
  };

  const handleCSVImportStudents = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      
      rows.forEach(row => {
        const cols = row.split(',').map(s => s?.trim().replace(/^"|"$/g, ''));
        const [name, cls, no, badge, initPoints, squashClass, phone] = cols;
        if (name && name !== "姓名") {
          batch.set(doc(colRef), { 
            name, 
            class: (cls || '1A').toUpperCase(), 
            classNo: no || '0', 
            badge: badge || '無', 
            points: Number(initPoints) || 100, 
            squashClass: squashClass || '', 
            phone: phone || '',
            createdAt: serverTimestamp() 
          });
        }
      });
      await batch.commit();
      alert('隊員名單更新成功！');
    } catch (err) { alert('匯入失敗'); }
    setIsUpdating(false);
    e.target.value = null;
  };
  
  const todaySchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find(s => s.date === today);
  }, [schedules]);

  const uniqueTrainingClasses = useMemo(() => {
    const classes = schedules.map(s => s.trainingClass).filter(Boolean);
    return ['ALL', ...new Set(classes)];
  }, [schedules]);

  const calendarEvents = useMemo(() => {
    const filtered = selectedClassFilter === 'ALL' 
      ? schedules 
      : schedules.filter(s => s.trainingClass === selectedClassFilter);
    
    return filtered.map(s => {
      const [year, month, day] = s.date.split('-').map(Number);
      const startTime = s.time ? s.time.split(':').map(Number) : [16, 0];
      const endTime = s.time ? [startTime[0] + 2, startTime[1]] : [18, 0];
      return {
        title: `[${s.trainingClass}] ${s.time || ''}`,
        start: new Date(year, month - 1, day, startTime[0], startTime[1]),
        end: new Date(year, month - 1, day, endTime[0], endTime[1]),
        resource: s,
      };
    });
  }, [schedules, selectedClassFilter]);

  const studentsInSelectedAttendanceClass = useMemo(() => {
    const sorted = [...students].sort((a,b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo));
    if (attendanceClassFilter === 'ALL') return sorted;
    return sorted.filter(s => {
      if (!s.squashClass) return false;
      return s.squashClass.includes(attendanceClassFilter);
    });
  }, [students, attendanceClassFilter]);

  const downloadTemplate = (type) => {
    let csvContent = "\uFEFF";
    let fileName = '';

    if (type === 'students') {
      csvContent += '姓名,班別,班號,章別,初始積分,壁球班,電話\n';
      csvContent += '陳小明,6A,1,銅章,120,A班,\n';
      fileName = 'student_template.csv';
    } else if (type === 'schedule') {
      csvContent += '訓練班名稱,日期,時間,地點,教練,備註\n';
      csvContent += 'A班,2024-09-05,16:00,學校壁球場,徐教練,請準時出席\n';
      fileName = 'schedule_template.csv';
    } else {
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

    const tournamentList = useMemo(() => {
      if (leagueMatches.length === 0) return [];
      const uniqueNames = [...new Set(leagueMatches.map(m => m.tournamentName).filter(Boolean))];
      return uniqueNames.sort((a, b) => b.localeCompare(a));
    }, [leagueMatches]);
    
    const filteredMatches = useMemo(() => {
      if (!selectedTournament) {
        if (tournamentList.length > 0) {
          setSelectedTournament(tournamentList[0]);
        }
        return [];
      }
      return leagueMatches.filter(m => m.tournamentName === selectedTournament);
    }, [leagueMatches, selectedTournament, tournamentList]);

  const groupedMatches = useMemo(() => {
    const groups = {}; // 先宣告
    if (filteredMatches.length > 0) { // 將邏輯包在條件內
        filteredMatches.forEach(match => {
            const groupKey = match.groupName || '所有比賽';
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(match);
        });
    }

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        if (a === '所有比賽') return -1;
        if (b === '所有比賽') return 1;
        return a.localeCompare(b);
    });

    const result = {};
    sortedGroupKeys.forEach(key => {
        result[key] = groups[key];
    });

    return result; // 最後返回結果
  }, [filteredMatches]);

    const handleUpdateLeagueMatchScore = async (match) => {
        const score1_str = prompt(`請輸入 ${match.player1Name} 的分數:`);
        if (score1_str === null) return;
        const score2_str = prompt(`請輸入 ${match.player2Name} 的分數:`);
        if (score2_str === null) return;
        
        const score1 = parseInt(score1_str, 10);
        const score2 = parseInt(score2_str, 10);

        if (isNaN(score1) || isNaN(score2)) {
            alert("分數必須是數字！");
            return;
        }

        if (score1 === score2) {
            alert("比分不能相同，必須有勝負之分。");
            return;
        }

        const winnerId = score1 > score2 ? match.player1Id : match.player2Id;
        const winner = students.find(s => s.id === winnerId);
        const loser = students.find(s => s.id === (winnerId === match.player1Id ? match.player2Id : match.player1Id));
        
        if (!winner || !loser) {
            alert("找不到球員資料，無法更新積分。");
            return;
        }

        const winnerRank = rankedStudents.findIndex(s => s.id === winner.id) + 1;
        const loserRank = rankedStudents.findIndex(s => s.id === loser.id) + 1;
        const winnerBadgeLevel = BADGE_DATA[winner.badge]?.level || 0;
        const loserBadgeLevel = BADGE_DATA[loser.badge]?.level || 0;
        const isRankGiantKiller = winnerRank > 0 && loserRank > 0 && (winnerRank - loserRank) >= 5;
        const isBadgeGiantKiller = winnerBadgeLevel < loserBadgeLevel;
        const isGiantKiller = isRankGiantKiller || isBadgeGiantKiller;
        const pointsToAdd = isGiantKiller ? 20 : 10;
        
        const confirmMsg = `✍️ 確認賽果？\n\n` +
                         `${match.player1Name} vs ${match.player2Name}\n` +
                         `比分: ${score1} - ${score2}\n\n` +
                         `🏆 勝方: ${winner.name} (+${pointsToAdd} 分 ${isGiantKiller ? '🔥巨人殺手' : ''})\n` +
                         `負方: ${loser.name} (+0 分)`;

        if (confirm(confirmMsg)) {
            setIsUpdating(true);
            try {
                const batch = writeBatch(db);
                
                const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.id);
                batch.update(matchRef, {
                    score1,
                    score2,
                    winnerId,
                    status: 'completed',
                    updatedAt: serverTimestamp()
                });

                const winnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', winner.id);
                batch.update(winnerRef, {
                    points: increment(pointsToAdd),
                    lastUpdated: serverTimestamp()
                });
                
                await batch.commit();
                alert("✅ 賽果已成功儲存並更新積分！");
            } catch (e) {
                console.error("Update match score failed", e);
                alert("儲存失敗，請檢查網絡連線。");
            }
            setIsUpdating(false);
        }
    };
    
    const handleGenerateRoundRobinMatches = async () => {
        if (newTournamentName.trim() === '') {
            alert('請輸入賽事名稱。');
            return;
        }
        if (tournamentPlayers.length < 2) {
            alert('請至少選擇兩位參賽球員。');
            return;
        }
        if (numGroups < 1) {
            alert('分組數量至少為 1。');
            return;
        }
        if (tournamentPlayers.length < numGroups * 2) {
            alert('球員數量不足以分成這麼多組，請減少分組數量或增加球員。');
            return;
        }

        setIsUpdating(true);
        try {
            const groups = Array.from({ length: numGroups }, () => []);
            const shuffledPlayers = [...tournamentPlayers].sort(() => 0.5 - Math.random());
            shuffledPlayers.forEach((playerId, index) => {
                groups[index % numGroups].push(playerId);
            });

            const batch = writeBatch(db);
            const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');
            let matchCount = 0;

            groups.forEach((groupPlayers, groupIndex) => {
                const groupName = `${String.fromCharCode(65 + groupIndex)}組`; 

                for (let i = 0; i < groupPlayers.length; i++) {
                    for (let j = i + 1; j < groupPlayers.length; j++) {
                        const player1 = students.find(s => s.id === groupPlayers[i]);
                        const player2 = students.find(s => s.id === groupPlayers[j]);

                        if (player1 && player2) {
                            batch.set(doc(colRef), {
                                tournamentName: newTournamentName.trim(),
                                groupName: numGroups > 1 ? groupName : null,
                                date: new Date().toISOString().split('T')[0],
                                time: 'N/A',
                                venue: '待定',
                                player1Id: player1.id,
                                player1Name: player1.name,
                                player2Id: player2.id,
                                player2Name: player2.name,
                                score1: null,
                                score2: null,
                                winnerId: null,
                                status: 'scheduled',
                                createdAt: serverTimestamp()
                            });
                            matchCount++;
                        }
                    }
                }
            });
            
            await batch.commit();
            alert(`✅ 成功生成 ${newTournamentName.trim()} 賽事！\n\n共 ${numGroups} 個分組，${matchCount} 場比賽已創建。`);
            
            setShowTournamentModal(false);
            setNewTournamentName('');
            setTournamentPlayers([]);
            setNumGroups(1);
            setSelectedTournament(newTournamentName.trim());


        } catch (e) {
            console.error("Failed to generate matches:", e);
            alert("生成比賽失敗，請稍後再試。");
        }
        setIsUpdating(false);
    };

    const handleEditLeagueMatch = async (match) => {
        const newDate = prompt(`請輸入新的比賽日期 (YYYY-MM-DD):`, match.date);
        if (newDate === null) return;
        
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(newDate)) {
            alert("日期格式錯誤！請使用 YYYY-MM-DD 格式。");
            return;
        }

        const newTime = prompt(`請輸入新的比賽時間 (HH:MM):`, match.time);
        if (newTime === null) return;
        
        const timeRegex = /^\d{2}:\d{2}$/;
        if (!timeRegex.test(newTime) && newTime !== 'N/A') {
            alert("時間格式錯誤！請使用 HH:MM 格式。");
            return;
        }
        
        setIsUpdating(true);
        try {
            const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.id);
            await updateDoc(matchRef, {
                date: newDate,
                time: newTime,
            });
            alert('比賽時間已更新！');
        } catch (e) {
            console.error("Failed to update match time:", e);
            alert("更新失敗，請稍後再試。");
        }
        setIsUpdating(false);
    };

  const tournamentStandings = useMemo(() => {
    if (filteredMatches.length === 0) return {};
    
    const standings = {};

    const playerIdsInTournament = new Set();
    filteredMatches.forEach(match => {
        playerIdsInTournament.add(match.player1Id);
        if (match.player2Id) playerIdsInTournament.add(match.player2Id);
    });

    playerIdsInTournament.forEach(playerId => {
        const student = students.find(s => s.id === playerId);
        if(student) {
          const matchWithGroup = filteredMatches.find(m => m.player1Id === playerId || m.player2Id === playerId);
          const groupKey = matchWithGroup?.groupName || '所有比賽';
          if (!standings[groupKey]) {
            standings[groupKey] = {};
          }
          standings[groupKey][playerId] = {
              id: playerId,
              name: student.name,
              played: 0,
              wins: 0,
              losses: 0,
              pointsFor: 0,
              pointsAgainst: 0,
              pointsDiff: 0,
              leaguePoints: 0
          };
        }
    });

    filteredMatches.filter(m => m.status === 'completed' && m.matchType !== 'external').forEach(match => {
        const groupKey = match.groupName || '所有比賽';
        const p1Stats = standings[groupKey]?.[match.player1Id];
        const p2Stats = standings[groupKey]?.[match.player2Id];

        if (p1Stats && p2Stats) {
            p1Stats.played += 1;
            p2Stats.played += 1;
            p1Stats.pointsFor += match.score1 || 0;
            p1Stats.pointsAgainst += match.score2 || 0;
            p2Stats.pointsFor += match.score2 || 0;
            p2Stats.pointsAgainst += match.score1 || 0;

            if (match.winnerId === match.player1Id) {
                p1Stats.wins += 1;
                p1Stats.leaguePoints += 3;
                p2Stats.losses += 1;
            } else if (match.winnerId === match.player2Id) {
                p2Stats.wins += 1;
                p2Stats.leaguePoints += 3;
                p1Stats.losses += 1;
            }
        }
    });

    for (const group in standings) {
        standings[group] = Object.values(standings[group]).map(stat => ({
            ...stat,
            pointsDiff: stat.pointsFor - stat.pointsAgainst
        })).sort((a, b) => {
            if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            return b.pointsFor - a.pointsFor;
        });
    }

    return standings;
  }, [filteredMatches, students]);

  const myUpcomingMatches = useMemo(() => {
    if (role !== 'student' || !currentUserInfo) return [];
    return filteredMatches.filter(m => m.status === 'scheduled' && (m.player1Id === currentUserInfo.id || m.player2Id === currentUserInfo.id))
      .sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [filteredMatches, currentUserInfo, role]);

  const myTournamentStats = useMemo(() => {
    if (role !== 'student' || !currentUserInfo || !selectedTournament) return null;
    for(const group in tournamentStandings){
      const playerStat = tournamentStandings[group].find(p => p.id === currentUserInfo.id);
      if(playerStat) return playerStat;
    }
    return { played: 0, wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, leaguePoints: 0 };
  }, [tournamentStandings, currentUserInfo, role, selectedTournament]);

// 版本 11.8: 修正 playerDashboardData 和 myDashboardData 程式碼合併錯誤

// ========================================================================
// Hook 1: playerDashboardData (供教練點擊查看任一學生)
// ========================================================================
const playerDashboardData = useMemo(() => {
    // 原始邏輯：依賴 viewingStudent
    if (!viewingStudent) return null;

    const studentMatches = leagueMatches.filter(m => m.player1Id === viewingStudent.id || m.player2Id === viewingStudent.id);
    const completedMatches = studentMatches.filter(m => m.status === 'completed');
    const studentAttendance = attendanceLogs.filter(log => log.studentId === viewingStudent.id);
    const studentAchievements = achievements.filter(ach => ach.studentId === viewingStudent.id);
    const studentAssessments = assessments.filter(a => a.studentId === viewingStudent.id).sort((a, b) => b.date.localeCompare(a.date));

    const wins = completedMatches.filter(m => m.winnerId === viewingStudent.id).length;
    const totalPlayed = completedMatches.length;
    const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;

    const totalScheduledSessions = schedules.filter(s => viewingStudent.squashClass && s.trainingClass === viewingStudent.squashClass).length;
    const attendedSessions = new Set(studentAttendance.map(log => log.date)).size;
    const attendanceRate = totalScheduledSessions > 0 ? Math.round((attendedSessions / totalScheduledSessions) * 100) : 0;

    const dynamicPointsHistory = [
        { date: '初始積分', points: BADGE_DATA[viewingStudent.badge]?.basePoints || 0 },
        { date: '目前', points: viewingStudent.totalPoints }
    ];

    const latestAssessment = studentAssessments.length > 0 ? studentAssessments[0] : null;
    
    let radarData = [];
    if (latestAssessment) {
        const calcScore = (val, max) => Math.min(10, Math.max(1, Math.round((val / max) * 10)));
        radarData = [
            { subject: '體能 (折返跑)', A: calcScore(latestAssessment.shuttleRun, 25), fullMark: 10 }, 
            { subject: '力量 (仰臥/握力)', A: calcScore(((latestAssessment.situps || 0) + (latestAssessment.gripStrength || 0))/2, 50), fullMark: 10 },
            { subject: '柔軟度', A: calcScore(latestAssessment.flexibility, 40), fullMark: 10 },
            { subject: '正手技術', A: calcScore(((latestAssessment.fhDrive || 0) + (latestAssessment.fhVolley || 0))/2, 50), fullMark: 10 },
            { subject: '反手技術', A: calcScore(((latestAssessment.bhDrive || 0) + (latestAssessment.bhVolley || 0))/2, 50), fullMark: 10 },
        ];
    }

    const recentMatches = studentMatches.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return {
        winRate, wins, totalPlayed,
        attendanceRate, attendedSessions, totalScheduledSessions,
        pointsHistory: dynamicPointsHistory,
        recentMatches, latestAssessment, radarData,
        achievements: studentAchievements.map(ach => ({ badgeId: ach.badgeId, level: ach.level || 1 }))
    };
}, [viewingStudent, leagueMatches, attendanceLogs, schedules, achievements, rankedStudents, assessments]);

// ========================================================================
// Hook 2: myDashboardData (供學生登入後查看自己)
// ========================================================================
const myDashboardData = useMemo(() => {
    // 新邏輯：依賴 currentUserInfo
    if (role !== 'student' || !currentUserInfo) return null;
    
    const studentData = rankedStudents.find(s => s.id === currentUserInfo.id);
    if (!studentData) return null;

    const studentMatches = leagueMatches.filter(m => m.player1Id === studentData.id || m.player2Id === studentData.id);
    const completedMatches = studentMatches.filter(m => m.status === 'completed');
    const studentAttendance = attendanceLogs.filter(log => log.studentId === studentData.id);
    const studentAchievements = achievements.filter(ach => ach.studentId === studentData.id);
    const studentAssessments = assessments.filter(a => a.studentId === studentData.id).sort((a, b) => b.date.localeCompare(a.date));

    const wins = completedMatches.filter(m => m.winnerId === studentData.id).length;
    const totalPlayed = completedMatches.length;
    const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;

    const totalScheduledSessions = schedules.filter(s => studentData.squashClass && s.trainingClass === studentData.squashClass).length;
    const attendedSessions = new Set(studentAttendance.map(log => log.date)).size;
    const attendanceRate = totalScheduledSessions > 0 ? Math.round((attendedSessions / totalScheduledSessions) * 100) : 0;

    const dynamicPointsHistory = [
        { date: '初始積分', points: BADGE_DATA[studentData.badge]?.basePoints || 0 },
        { date: '目前', points: studentData.totalPoints }
    ];

    const latestAssessment = studentAssessments.length > 0 ? studentAssessments[0] : null;
    
    let radarData = [];
    if (latestAssessment) {
        const calcScore = (val, max) => Math.min(10, Math.max(1, Math.round((val / max) * 10)));
        radarData = [
            { subject: '體能 (折返跑)', A: calcScore(latestAssessment.shuttleRun, 25), fullMark: 10 },
            { subject: '力量 (仰臥/握力)', A: calcScore(((latestAssessment.situps || 0) + (latestAssessment.gripStrength || 0))/2, 50), fullMark: 10 },
            { subject: '柔軟度', A: calcScore(latestAssessment.flexibility, 30), fullMark: 10 },
            { subject: '正手技術', A: calcScore(((latestAssessment.fhDrive || 0) + (latestAssessment.fhVolley || 0))/2, 10), fullMark: 10 },
            { subject: '反手技術', A: calcScore(((latestAssessment.bhDrive || 0) + (latestAssessment.bhVolley || 0))/2, 10), fullMark: 10 },
        ];
    }

   const recentMatches = studentMatches.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

    return {
        winRate, wins, totalPlayed,
        attendanceRate, attendedSessions, totalScheduledSessions,
        pointsHistory: dynamicPointsHistory,
        recentMatches, latestAssessment, radarData,
        achievements: studentAchievements.map(ach => ({ badgeId: ach.badgeId, level: ach.level || 1 }))
    };
}, [currentUserInfo, role, rankedStudents, leagueMatches, attendanceLogs, schedules, achievements, assessments, students]);






  const SchoolLogo = ({ size = 48, className = "" }) => {
    const [error, setError] = useState(false);
    const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
    const logoUrl = systemConfig?.schoolLogo || defaultLogoUrl;
    if (error) {
      return <ShieldCheck className={`${className}`} size={size} />;
    }
    return (
      <img 
        src={logoUrl} 
        alt="BCKLAS Logo" 
        className={`object-contain ${className}`}
        style={{ width: size * 2, height: size * 2 }}
        loading="eager"
        crossOrigin="anonymous" 
        onError={(e) => {
          console.error("Logo load failed", e);
          setError(true);
        }}
      />
    );
  };

  const handleAddAward = () => {
  // 重置表單數據
  setNewAwardData({
    title: '',
    studentName: '',
    date: new Date().toISOString().split('T')[0],
    rank: '',
    description: '',
    photoUrl: null,
  });
  setAwardPhotoPreview(null);
  // 打開 Modal
  setShowAddAwardModal(true);
};

  const handleMonthlyStarFieldChange = (gender, field, value) => {
    setMonthlyStarEditData(prev => ({
        ...prev,
        [gender]: { ...prev[gender], [field]: value }
    }));
  };

  const handleMonthlyStarStudentSelect = (gender, studentId) => {
    const student = students.find(s => s.id === studentId);
    if (student) {
        setMonthlyStarEditData(prev => ({
            ...prev,
            [gender]: {
                ...prev[gender],
                studentId: student.id,
                studentName: student.name,
                studentClass: student.class,
            }
        }));
    }
  };
  
  const handleMonthlyStarPhotoUpload = async (gender, file) => {
    if (!file) return;
    setIsUpdating(true);
    try {
        const compressedUrl = await compressImage(file, 0.8);
        handleMonthlyStarFieldChange(gender, 'fullBodyPhotoUrl', compressedUrl);
        if (gender === 'maleWinner') setMalePhotoPreview(compressedUrl);
        if (gender === 'femaleWinner') setFemalePhotoPreview(compressedUrl);
    } catch (e) {
        console.error("Photo upload failed:", e);
        alert("照片上傳失敗。");
    }
    setIsUpdating(false);
  };

  const handleSaveMonthlyStar = async () => {
      if (!monthlyStarEditData.maleWinner.studentId || !monthlyStarEditData.femaleWinner.studentId) {
          alert("請同時選擇一位男生和一位女生作為每月之星。");
          return;
      }
      setIsUpdating(true);
      try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'monthly_stars', selectedMonthForAdmin);
          await setDoc(docRef, {
              ...monthlyStarEditData,
              month: selectedMonthForAdmin,
              publishedAt: serverTimestamp()
          });
          alert(`✅ 成功發佈/更新 ${selectedMonthForAdmin} 的每月之星！`);
      } catch (e) {
          console.error("Failed to save monthly star:", e);
          alert("儲存失敗，請檢查網絡連線。");
      }
      setIsUpdating(false);
  };

  useEffect(() => {
    if(activeTab === 'monthlyStarsAdmin') {
      const dataForMonth = monthlyStars.find(ms => ms.id === selectedMonthForAdmin);
      const emptyData = {
          month: selectedMonthForAdmin,
          maleWinner: { studentId: '', studentName: '', studentClass: '', reason: '', goals: '', fullBodyPhotoUrl: null },
          femaleWinner: { studentId: '', studentName: '', studentClass: '', reason: '', goals: '', fullBodyPhotoUrl: null },
      };
      setMonthlyStarEditData(dataForMonth || emptyData);
      setMalePhotoPreview(dataForMonth?.maleWinner?.fullBodyPhotoUrl || null);
      setFemalePhotoPreview(dataForMonth?.femaleWinner?.fullBodyPhotoUrl || null);
    }
  }, [selectedMonthForAdmin, monthlyStars, activeTab]);

  const handleGeneratePoster = async () => {
    setIsGeneratingPoster(true);
    const dataToRender = JSON.parse(JSON.stringify(monthlyStarEditData));

    try {
        const [malePhotoData, femalePhotoData, logoData] = await Promise.all([
            toDataURL(dataToRender.maleWinner.fullBodyPhotoUrl),
            toDataURL(dataToRender.femaleWinner.fullBodyPhotoUrl),
            toDataURL(systemConfig.schoolLogo)
        ]);
        
        setPosterData({ 
            ...dataToRender, 
            maleWinner: { ...dataToRender.maleWinner, fullBodyPhotoUrl: malePhotoData },
            femaleWinner: { ...dataToRender.femaleWinner, fullBodyPhotoUrl: femalePhotoData },
            schoolLogo: logoData
        });
        
        setTimeout(async () => {
            const posterElement = posterRef.current;
            if (!posterElement) {
                alert("海報模板加載失敗。");
                setIsGeneratingPoster(false);
                return;
            }
            try {
                const canvas = await html2canvas(posterElement, { scale: 2, useCORS: true });
                const image = canvas.toDataURL('image/png', 1.0);
                const link = document.createElement('a');
                link.href = image;
                link.download = `Monthly_Star_Poster_${selectedMonthForAdmin}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (canvasError) {
                console.error('海報生成失敗 (html2canvas stage):', canvasError);
                alert('海報生成失敗，可能是由於網絡或圖片格式問題。');
            } finally {
                setIsGeneratingPoster(false);
                setPosterData(null);
            }
        }, 500);

    } catch (preloadError) {
        console.error('海報圖片預加載或轉換失敗:', preloadError);
        alert('海報圖片處理失敗，請檢查網絡連線。');
        setIsGeneratingPoster(false);
    }
  };


  const AwardCard = ({ award, student, style }) => {
      const rank = award.rank || '';
      
      const rankStyles = useMemo(() => {
          if (rank.includes('冠軍')) {
              return {
                  bg: 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-400',
                  text: 'text-yellow-900',
                  shadow: 'shadow-yellow-400/30 hover:shadow-yellow-300/50',
                  border: 'border-yellow-500/50',
                  ribbon: 'bg-yellow-500',
                  rankText: 'text-yellow-800'
              };
          }
          if (rank.includes('亞軍')) {
              return {
                  bg: 'bg-gradient-to-br from-slate-200 via-gray-300 to-slate-300',
                  text: 'text-slate-800',
                  shadow: 'shadow-slate-400/30 hover:shadow-slate-300/50',
                  border: 'border-gray-400/50',
                  ribbon: 'bg-slate-500',
                  rankText: 'text-slate-100'
              };
          }
          if (rank.includes('季軍') || rank.includes('殿軍')) {
              return {
                  bg: 'bg-gradient-to-br from-orange-300 via-amber-500 to-orange-400',
                  text: 'text-orange-900',
                  shadow: 'shadow-amber-600/30 hover:shadow-amber-500/50',
                  border: 'border-orange-500/50',
                  ribbon: 'bg-orange-600',
                  rankText: 'text-orange-100'
              };
          }
          return {
              bg: 'bg-gradient-to-br from-blue-300 via-sky-400 to-blue-400',
              text: 'text-sky-900',
              shadow: 'shadow-sky-400/30 hover:shadow-sky-300/50',
              border: 'border-sky-500/50',
              ribbon: 'bg-sky-500',
              rankText: 'text-sky-100'
          };
      }, [rank]);

      return (
          <div style={style} className={`group relative flex flex-col ${rankStyles.bg} rounded-3xl p-1.5 shadow-lg ${rankStyles.shadow} transition-all duration-300 ease-in-out hover:scale-105`}>
              <div className="absolute top-0 left-10 w-12 h-16 overflow-hidden z-20">
                  <div className={`absolute -top-2 left-0 w-full h-full rotate-45 transform-gpu ${rankStyles.ribbon} shadow-md`}></div>
              </div>

              <div className="bg-white/50 backdrop-blur-sm rounded-[1.35rem] h-full flex flex-col p-6">
                  <div className="w-full aspect-[4/3] rounded-2xl bg-white/50 overflow-hidden relative border border-white/50 shadow-inner">
                      {award.photoUrl ? (
                          <img src={award.photoUrl} alt={award.title} className="w-full h-full object-cover" />
                      ) : (
                          <div className={`w-full h-full flex items-center justify-center opacity-20 ${rankStyles.text}`}>
                              <Trophy size={64}/>
                          </div>
                      )}
                      <div className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-full text-sm font-black shadow-lg ${rankStyles.ribbon} ${rankStyles.rankText}`}>
                          {award.rank}
                      </div>
                  </div>
                  <div className="flex-1 flex flex-col pt-5 px-1">
                      <p className={`text-xs font-bold ${rankStyles.text} opacity-70`}>{award.date}</p>
                      <h4 className={`text-xl font-black leading-tight mt-1 mb-3 ${rankStyles.text}`}>{award.title}</h4>
                      <div className="mt-auto flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold bg-white/70 ${rankStyles.text} shadow-sm border-2 ${rankStyles.border}`}>
                              {student ? student.name[0] : award.studentName[0]}
                           </div>
                           <div>
                               <p className={`font-bold ${rankStyles.text}`}>{award.studentName}</p>
                               {student && <p className={`text-xs font-semibold ${rankStyles.text} opacity-80`}>Class {student.class}</p>}
                           </div>
                      </div>
                  </div>
              </div>
              
               {role === 'admin' && (
                  <button 
                    onClick={() => deleteItem('awards', award.id)}
                    className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur text-white/70 hover:text-red-500 hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100 z-30"
                  >
                    <Trash2 size={16}/>
                  </button>
               )}
          </div>
      );
  };
  
  const PlayerCardModal = ({ student, onClose }) => {
    const cardRef = useRef(null);
    const [isDownloading, setIsDownloading] = useState(false);

    if (!student) return null;

    const currentIndex = rankedStudents.findIndex(s => s.id === student.id);
    const rank = currentIndex >= 0 ? currentIndex + 1 : '-';

    const handlePrev = (e) => {
      e.stopPropagation();
      if (currentIndex > 0) setShowPlayerCard(rankedStudents[currentIndex - 1]);
    };
    const handleNext = (e) => {
      e.stopPropagation();
      if (currentIndex < rankedStudents.length - 1) setShowPlayerCard(rankedStudents[currentIndex + 1]);
    };
    
    const { internalStats, externalStatsByYear } = useMemo(() => {
        const studentMatches = leagueMatches.filter(m => m.status === 'completed' && (m.player1Id === student.id || m.player2Id === student.id));
        
        const internalMatches = studentMatches.filter(m => m.matchType !== 'external');
        const internalTotal = internalMatches.length;
        const internalWins = internalMatches.filter(m => m.winnerId === student.id).length;
        const internalWinRate = internalTotal > 0 ? Math.round((internalWins / internalTotal) * 100) : 0;
        let giantKillsCount = 0;
        internalMatches.filter(m => m.winnerId === student.id).forEach(match => {
            const opponentId = match.player1Id === student.id ? match.player2Id : match.player1Id;
            const opponentIndex = rankedStudents.findIndex(s => s.id === opponentId);
            if (opponentIndex >= 0 && (currentIndex - opponentIndex) >= 5) giantKillsCount++;
        });

        const externalMatches = studentMatches.filter(m => m.matchType === 'external' && m.player1Id === student.id);
        const statsByYear = externalMatches.reduce((acc, match) => {
            const year = getAcademicYear(match.date);
            if (!acc[year]) {
                acc[year] = { played: 0, wins: 0, losses: 0 };
            }
            acc[year].played += 1;
            if (match.winnerId === student.id) {
                acc[year].wins += 1;
            } else {
                acc[year].losses += 1;
            }
            return acc;
        }, {});

        return {
            internalStats: {
                winRate: internalWinRate,
                wins: internalWins,
                losses: internalTotal - internalWins,
                giantKills: giantKillsCount
            },
            externalStatsByYear: Object.entries(statsByYear).sort((a,b) => b[0].localeCompare(a[0]))
        };
    }, [leagueMatches, student, rankedStudents, currentIndex]);

    const studentAchievements = achievements.filter(ach => ach.studentId === student.id);
    const uniqueAchievements = [...new Set(studentAchievements.map(ach => ach.badgeId))];

    const handleDownload = async (e) => {
      e.stopPropagation();
      if (!cardRef.current || isDownloading) return;
      setIsDownloading(true);
      try {
        await Promise.all([toDataURL(student.photo_url), toDataURL(systemConfig.schoolLogo)]);
        const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff'});
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `PlayerCard_${student.name}_${student.class}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error("下載卡片失敗:", err);
        alert("下載卡片圖片失敗，請檢查網絡或圖片連結。");
      } finally {
        setIsDownloading(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
        <div className="relative max-w-md w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
          <div ref={cardRef} className="w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-100 relative">
            <div className="bg-slate-50 border-b p-6 flex justify-between items-center relative">
              <SchoolLogo size={24} />
              <div className="text-center flex-1 z-10">
                <h3 className="font-black text-slate-800 tracking-widest text-sm">BCKLAS SQUASH TEAM</h3>
              </div>
              <TrophyIcon size={32} className="text-slate-200 absolute right-4 opacity-50" />
            </div>
            <div className="p-8 pb-4 flex flex-col items-center relative">
              <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center mb-4 relative z-10">
                 {student.photo_url ? (
                   <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                 ) : (
                   <span className="text-5xl font-black text-slate-300">{student.name[0]}</span>
                 )}
              </div>
              <button onClick={handlePrev} disabled={currentIndex <= 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all z-20"><ChevronRight className="rotate-180" size={24}/></button>
              <button onClick={handleNext} disabled={currentIndex >= rankedStudents.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white rounded-full shadow-md text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all z-20"><ChevronRight size={24}/></button>
              <h2 className="text-2xl font-black text-slate-800">{student.name} {student.eng_name ? `(${student.eng_name})` : ''}</h2>
              <p className="text-sm font-bold text-slate-400 uppercase mt-1">CLASS: {student.class} ({student.classNo})</p>
            </div>
            <div className="grid grid-cols-3 gap-2 px-6 py-4">
               <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                 <p className="text-xl font-black text-blue-600">{student.totalPoints}</p>
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider mt-1">Points</p>
               </div>
               <div className={`border rounded-xl p-3 text-center ${BADGE_DATA[student.badge]?.bg || 'bg-slate-50'} ${BADGE_DATA[student.badge]?.border || 'border-slate-200'}`}>
                 <p className="text-xl">{BADGE_DATA[student.badge]?.icon || '⚪'}</p>
                 <p className={`text-[9px] font-black uppercase tracking-wider mt-1 ${BADGE_DATA[student.badge]?.color || 'text-slate-400'}`}>{student.badge || '無'}</p>
               </div>
               <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                 <p className="text-xl font-black text-slate-700">#{rank}</p>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">Rank (Team)</p>
               </div>
            </div>
            <div className="px-6 py-4 space-y-4">
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">內部聯賽表現 (Internal League)</h4>
                  <ul className="space-y-1.5 text-sm font-bold text-slate-600">
                    <li className="flex justify-between"><span>勝率 (Win Rate):</span> <span className="text-slate-800">{internalStats.winRate}% ({internalStats.wins}勝 {internalStats.losses}負)</span></li>
                    <li className="flex justify-between"><span>巨人殺手 (Giant Kills):</span> <span className="text-slate-800">{internalStats.giantKills} 次</span></li>
                  </ul>
               </div>
               <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">代表學校出賽 (School Team)</h4>
                  {externalStatsByYear.length > 0 ? (
                    <ul className="space-y-1.5 text-sm font-bold text-slate-600">
                      {externalStatsByYear.map(([year, stats]) => (
                        <li key={year} className="flex justify-between">
                          <span>{year} 學年:</span> 
                          <span className="text-slate-800">{stats.played}場 {stats.wins}勝 {stats.losses}負 ({Math.round(stats.wins/stats.played * 100)}%)</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">暫無校外賽記錄</p>
                  )}
               </div>
            </div>
            <div className="px-8 pb-8 pt-2">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b pb-2">Achievements</h4>
               <div className="flex flex-wrap gap-2">
                 {uniqueAchievements.length > 0 ? uniqueAchievements.map(badgeId => {
                     const badge = ACHIEVEMENT_DATA[badgeId];
                     if (!badge) return null;
                     return (
                         <div key={badgeId} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500 shadow-sm border" title={badge.name}>
                             {badge.icon}
                         </div>
                     );
                 }) : <p className="text-xs text-slate-300">尚未獲得徽章</p>}
               </div>
            </div>
            <div className="bg-slate-800 text-slate-400 text-center py-2 text-[8px] font-black tracking-widest uppercase">
              Generated by BCKLAS Squash System v{CURRENT_VERSION}
            </div>
          </div>
          <button 
            onClick={handleDownload} 
            disabled={isDownloading}
            className="mt-6 flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-full font-black shadow-xl shadow-blue-900/50 hover:bg-blue-500 transition-all disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
            {isDownloading ? '生成中...' : '下載卡片 (PNG)'}
          </button>
          <button onClick={onClose} className="mt-4 text-white/50 hover:text-white text-sm font-bold transition-all">關閉 (Close)</button>
        </div>
      </div>
    );
  };

  const BadgeInfoModal = ({ badgeInfo, onClose }) => {
      if (!badgeInfo) return null;
      const badgeData = ACHIEVEMENT_DATA[badgeInfo.badgeId];
      if (!badgeData) return null;
      const levelData = badgeData.levels?.[badgeInfo.level] || badgeData.levels?.[1] || { name: badgeData.baseName, desc: '詳細描述待補充' };
      
      return (
          <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50 duration-300" onClick={onClose}>
              <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl relative animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                  <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
                  <div className="flex flex-col items-center text-center">
                      <div className="w-28 h-28 bg-slate-50 rounded-3xl flex items-center justify-center text-blue-600 shadow-inner border mb-6">
                          {React.cloneElement(badgeData.icon, { size: 64 })}
                      </div>
                      <h3 className="text-3xl font-black text-slate-800 mb-2">{levelData.name}</h3>
                      <div className="px-4 py-1.5 rounded-full text-xs font-bold border-2 text-blue-600 bg-blue-100 border-blue-200">
                          {badgeData.rarity}
                      </div>
                      <p className="text-slate-500 mt-8 text-lg leading-relaxed font-bold">
                          {levelData.desc}
                      </p>
                  </div>
              </div>
          </div>
      );
  };

const PlayerDashboard = ({ student, data, onClose, onBadgeClick }) => {

    if (!student || !data) return null;

    return (
        <div className="animate-in fade-in duration-500 font-bold">
            <div className="flex items-center gap-6 mb-10">
                {/* onClose is now optional, only show button if it exists */}
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
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
                    <TrophyIcon size={32} className="mx-auto text-yellow-500 mb-4"/>
                    <p className="text-4xl font-black text-slate-800">{student.totalPoints}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">Total Points</p>
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
                                if (!badgeData) {
                                    return null;
                                }
                                
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
                            return (
                                <div key={match.id} className={`p-6 rounded-3xl flex items-center justify-between gap-4 ${isWinner ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                                    <div>
                                        <p className="text-xs text-slate-400 font-bold">{match.date} - {match.tournamentName}</p>
                                        <p className="font-bold text-slate-700">vs. {opponentName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-2xl ${isWinner ? 'text-emerald-600' : 'text-rose-600'}`}>{score}</p>
                                        <p className={`text-xs font-bold ${isWinner ? 'text-emerald-500' : 'text-rose-500'}`}>{isWinner ? '勝利' : '落敗'}</p>
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
{/* --- END: 版本 12.3 修正 --- */}


  const MonthlyStarsPage = ({ monthlyStarsData }) => {
    const [displayMonth, setDisplayMonth] = useState('');

    useEffect(() => {
        if (monthlyStarsData.length > 0) {
            setDisplayMonth(monthlyStarsData[0].id);
        }
    }, [monthlyStarsData]);

    const currentData = monthlyStarsData.find(ms => ms.id === displayMonth);

    if (monthlyStarsData.length === 0) {
        return (
            <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
               <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-300 mb-6"><Star size={40}/></div>
               <p className="text-xl font-black text-slate-400">「每月之星」即將登場</p>
               <p className="text-sm text-slate-300 mt-2">請教練在後台設定本月的得獎者。</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 font-bold">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <h3 className="text-4xl font-black text-slate-800">每月之星 <span className="text-yellow-500">Player of the Month</span></h3>
                <select 
                    value={displayMonth} 
                    onChange={e => setDisplayMonth(e.target.value)}
                    className="bg-white border-2 border-slate-100 focus:border-blue-600 transition-all rounded-2xl p-4 outline-none text-lg font-bold shadow-sm"
                >
                    {monthlyStars.map(ms => <option key={ms.id} value={ms.id}>{ms.id.replace('-', ' 年 ')} 月</option>)}
                </select>
            </div>

            {currentData && (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-10 rounded-[4rem] border-2 border-white shadow-xl">
                        <div className="w-full aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden mb-8 shadow-lg">
                           {currentData.maleWinner.fullBodyPhotoUrl ? <img src={currentData.maleWinner.fullBodyPhotoUrl} className="w-full h-full object-cover object-top"/> : <div className="flex items-center justify-center h-full text-slate-400"><User size={64}/></div>}
                        </div>
                        <h4 className="text-3xl font-black text-blue-800">{currentData.maleWinner.studentName}</h4>
                        <p className="text-sm font-bold text-slate-400 mb-6">{currentData.maleWinner.studentClass}</p>
                        <div className="space-y-6">
                            <div>
                                <h5 className="font-black text-slate-500 mb-2">獲選原因</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed">{currentData.maleWinner.reason}</p>
                            </div>
                             <div>
                                <h5 className="font-black text-slate-500 mb-2">本年度目標</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed font-semibold italic">"{currentData.maleWinner.goals}"</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-50 to-white p-10 rounded-[4rem] border-2 border-white shadow-xl">
                        <div className="w-full aspect-[3/4] bg-slate-200 rounded-3xl overflow-hidden mb-8 shadow-lg">
                            {currentData.femaleWinner.fullBodyPhotoUrl ? <img src={currentData.femaleWinner.fullBodyPhotoUrl} className="w-full h-full object-cover object-top"/> : <div className="flex items-center justify-center h-full text-slate-400"><User size={64}/></div>}
                        </div>
                        <h4 className="text-3xl font-black text-pink-800">{currentData.femaleWinner.studentName}</h4>
                        <p className="text-sm font-bold text-slate-400 mb-6">{currentData.femaleWinner.studentClass}</p>
                        <div className="space-y-6">
                            <div>
                                <h5 className="font-black text-slate-500 mb-2">獲選原因</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed">{currentData.femaleWinner.reason}</p>
                            </div>
                             <div>
                                <h5 className="font-black text-slate-500 mb-2">本年度目標</h5>
                                <p className="text-slate-700 bg-white/50 p-4 rounded-xl text-sm leading-relaxed font-semibold italic">"{currentData.femaleWinner.goals}"</p>
                            </div>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="mb-8 animate-pulse">
        <SchoolLogo size={96} />
      </div>
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-bold animate-pulse">正在連接 BCKLAS 資料庫...</p>
      <p className="text-xs text-slate-300 mt-2 font-mono">v{CURRENT_VERSION}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex font-sans overflow-hidden" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text-primary)' }}>
      
      {/* Hidden Poster for Rendering */}
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -100}}>
          <PosterTemplate ref={posterRef} data={posterData} />
      </div>

      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryImageUpload} />
      
      {showTournamentModal && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowTournamentModal(false)}>
            <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setShowTournamentModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
                <h3 className="text-3xl font-black text-slate-800 mb-8">建立新的循環賽事</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">1. 賽事名稱</label>
                        <input type="text" value={newTournamentName} onChange={(e) => setNewTournamentName(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none text-lg" placeholder="例如：2024-25 上學期循環賽"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">2. 選擇參賽球員 (已選 {tournamentPlayers.length} 人)</label>
                        <div className="max-h-60 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border">
                            {students.sort((a,b) => a.class.localeCompare(b.class) || a.classNo.localeCompare(b.classNo)).map(s => (
                                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${tournamentPlayers.includes(s.id) ? 'bg-blue-600 text-white' : 'hover:bg-slate-200'}`}>
                                    <input type="checkbox" checked={tournamentPlayers.includes(s.id)} onChange={() => {setTournamentPlayers(prev => prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id])}} className="w-5 h-5 rounded-md accent-blue-200"/>
                                    <span className="font-bold text-sm">{s.name} ({s.class})</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">3. 分組數量 (自動平均分配)</label>
                        <input type="number" min="1" value={numGroups} onChange={(e) => setNumGroups(Math.max(1, parseInt(e.target.value, 10) || 1))} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none text-lg"/>
                    </div>
                </div>
                <div className="mt-10 flex justify-end">
                    <button onClick={handleGenerateRoundRobinMatches} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all font-black disabled:opacity-50">
                        {isUpdating ? <Loader2 className="animate-spin" /> : <Swords/>} 自動生成賽程
                    </button>
                </div>
            </div>
        </div>
      )}

      {viewingImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setViewingImage(null)}>
          <button onClick={() => setViewingImage(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-all z-50"><X size={32} /></button>
          <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
             <img src={viewingImage.url} alt={viewingImage.title} className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"/>
             <div className="mt-6 text-center text-white">
                 <h3 className="text-2xl font-bold">{viewingImage.title}</h3>
                 {viewingImage.description && <p className="text-sm text-white/70 mt-2 max-w-2xl mx-auto">{viewingImage.description}</p>}
             </div>
          </div>
        </div>
      )}

      {/* 版本 12.0: 主題式動態登入頁面 */}
{showLoginModal && (
    <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-cover bg-center"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1594420314182-1a48c4349635?q=80&w=2000&auto=format&fit=crop')" }}
    >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"></div>

        {/* 登入框 */}
        <div className="relative bg-white/90 backdrop-blur-2xl w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border border-white/30 
                        animate-in fade-in-50 zoom-in-95 duration-700 ease-out">
            
            <div className="flex justify-center mb-10 animate-in slide-in-from-bottom-8 delay-200 duration-500">
                <SchoolLogo className="text-white" size={80} />
            </div>

            <div className="animate-in slide-in-from-bottom-8 delay-300 duration-500">
                <h2 className="text-4xl font-black text-center text-slate-800 mb-2">正覺壁球</h2>
                <p className="text-center text-slate-400 font-bold mb-10">BCKLAS Squash Team System</p>
            </div>
            
            {/* 登入表單 (動畫延遲載入) */}
            <div className="animate-in fade-in delay-500 duration-500">
                <div className="space-y-6">
                    <div className="bg-slate-50 p-1 rounded-[2rem] flex mb-4 relative">
                        <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-[1.8rem] shadow-sm transition-all duration-300 ease-out ${loginTab === 'admin' ? 'left-1/2' : 'left-1'}`}></div>
                        <button onClick={() => setLoginTab('student')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'student' ? 'text-blue-600' : 'text-slate-400'}`}>學員入口</button>
                        <button onClick={() => setLoginTab('admin')} className={`flex-1 py-3 text-sm font-black z-10 transition-colors ${loginTab === 'admin' ? 'text-blue-600' : 'text-slate-400'}`}>教練登入</button>
                    </div>
                    {loginTab === 'student' ? (
                        <div className="space-y-3 font-bold animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex gap-3">
                            <input type="text" value={loginClass} onChange={(e) => setLoginClass(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 outline-none text-lg" placeholder="班別 (如 6A)" />
                            <input type="text" value={loginClassNo} onChange={(e) => setLoginClassNo(e.target.value)} className="w-1/2 bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 outline-none text-lg" placeholder="班號 (如 01)" />
                            </div>
                            <div className="relative">
                            <span className="absolute left-5 top-5 text-slate-300"><Lock size={18}/></span>
                            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="學生密碼" />
                            </div>
                            <button onClick={() => handleLogin('student')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">進入系統</button>
                        </div>
                    ) : (
                        <div className="space-y-3 font-bold animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="relative">
                            <span className="absolute left-5 top-5 text-slate-300"><Mail size={18}/></span>
                            <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="教練電郵" />
                            </div>
                            <div className="relative">
                            <span className="absolute left-5 top-5 text-slate-300"><Lock size={18}/></span>
                            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="教練密碼" />
                            </div>
                            <button onClick={() => handleLogin('admin')} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-slate-200 transition-all active:scale-[0.98]">管理員登入</button>
                        </div>
                    )}
                </div>
                <p className="text-center text-[10px] text-slate-300 mt-10 font-bold uppercase tracking-widest">BCKLAS Management v{CURRENT_VERSION}</p>
            </div>
        </div>
    </div>
)}


      <aside 
        className={`fixed md:static inset-y-0 left-0 z-[60] w-80 border-r transition-transform duration-300 ease-in-out 
                   ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
                   md:translate-x-0`}
        style={{ backgroundColor: 'var(--theme-sidebar-bg)' }}
      >
        <div className="p-10 h-full flex flex-col font-bold">
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className="flex items-center justify-center"><SchoolLogo size={32} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] -mt-1">BCKLAS SYSTEM v{CURRENT_VERSION}</p>
            </div>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto">
              {/***** START: 版本 12.1 - 側邊欄按鈕樣式更新 (修正版) *****/}
              {(() => {
                // --- Helper Component & Styles ---
                const baseButtonClass = "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left font-bold";
                const activeStyle = {
                  backgroundColor: 'var(--theme-sidebar-active-bg)',
                  color: 'var(--theme-sidebar-active-text)',
                  boxShadow: '0 10px 15px -3px rgba(var(--theme-accent-rgb, 59, 130, 246), 0.2), 0 4px 6px -2px rgba(var(--theme-accent-rgb, 59, 130, 246), 0.1)'
                };
                const inactiveStyle = {
                  color: 'var(--theme-sidebar-text)',
                  backgroundColor: 'transparent'
                };
                const hoverStyle = { // For inactive buttons
                    backgroundColor: 'rgba(128, 128, 128, 0.05)'
                };

                const NavButton = ({ tabName, icon, children }) => {
                    const [isHovered, setIsHovered] = useState(false);
                    const isActive = activeTab === tabName;

                    let style = isActive ? activeStyle : inactiveStyle;
                    if (!isActive && isHovered) {
                        style = {...style, ...hoverStyle};
                    }
                    
                    return (
                        <button
                          onClick={() => { setActiveTab(tabName); setSidebarOpen(false); }}
                          className={baseButtonClass}
                          style={style}
                          onMouseEnter={() => setIsHovered(true)}
                          onMouseLeave={() => setIsHovered(false)}
                        >
                          {icon} {children}
                        </button>
                    );
                };

                // --- Main Navigation Structure ---
                return (
                  <>
                    {(role === 'admin' || role === 'student') && (
                      <>
                        <div className="text-[10px] uppercase tracking-widest mb-4 px-6" style={{ color: 'var(--theme-text-faint)' }}>主選單</div>
                        <NavButton tabName="myDashboard" icon={<UserCheck size={20} />}>我的表現</NavButton>
                        <NavButton tabName="dashboard" icon={<LayoutDashboard size={20} />}>管理概況</NavButton>
                        <NavButton tabName="monthlyStars" icon={<Star size={20} />}>每月之星</NavButton>
                        <NavButton tabName="rankings" icon={<Trophy size={20} />}>積分排行</NavButton>
                        <NavButton tabName="league" icon={<Swords size={20} />}>聯賽專區</NavButton>
                        <NavButton tabName="gallery" icon={<ImageIcon size={20} />}>精彩花絮</NavButton>
                        <NavButton tabName="awards" icon={<Award size={20} />}>獎項成就</NavButton>
                        <NavButton tabName="schedules" icon={<CalendarIcon size={20} />}>訓練日程</NavButton>
                        <NavButton tabName="competitions" icon={<Megaphone size={20} />}>比賽與公告</NavButton>
                      </>
                    )}
                    {role === 'admin' && (
                      <>
                        <div className="text-[10px] uppercase tracking-widest my-6 px-6 pt-6 border-t" style={{ color: 'var(--theme-text-faint)', borderColor: 'var(--theme-border)' }}>教練工具</div>
                        <NavButton tabName="assessments" icon={<Activity size={20} />}>綜合能力評估</NavButton>
                        <NavButton tabName="monthlyStarsAdmin" icon={<Crown size={20} />}>每月之星管理</NavButton>
                        <NavButton tabName="students" icon={<Users size={20} />}>隊員管理</NavButton>
                        <NavButton tabName="externalMatches" icon={<BookMarked size={20} />}>校外賽管理</NavButton>
                        <NavButton tabName="attendance" icon={<ClipboardCheck size={20} />}>快速點名</NavButton>
                        <NavButton tabName="financial" icon={<DollarSign size={20} />}>財務收支</NavButton>
                        <NavButton tabName="settings" icon={<Settings2 size={20} />}>系統設定</NavButton>
                      </>
                    )}
                  </>
                );
              })()}
              {/***** END: 版本 12.1 - 側邊欄按鈕樣式更新 (修正版) *****/}
            </nav>
          
          <div className="pt-10 border-t">
            <div className="bg-slate-50 rounded-3xl p-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  {role === 'admin' ? <ShieldCheck size={20}/> : <User size={20}/>}
                </div>
                <div>
                  <p className="text-xs text-slate-400">登入身份</p>
                  <p className="text-sm font-black text-slate-800">{role === 'admin' ? '校隊教練' : currentUserInfo?.name || '學員'}</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
              <LogOut size={14}/> 登出系統
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto relative" style={{ backgroundColor: 'var(--theme-bg)' }}>
        <header className="px-10 py-8 sticky top-0 backdrop-blur-xl z-40 border-b flex ..." style={{ backgroundColor: 'var(--theme-header-bg)', borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-6">
            <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all">
              <Menu size={24}/>
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800">
                {viewingStudent ? "👨‍🎓 球員儀表板" :
                 activeTab === 'myDashboard' ? "📊 我的儀表板" :
                 activeTab === 'rankings' ? "🏆 積分排行榜" :
                 activeTab === 'dashboard' ? "📊 管理總結" :
                 activeTab === 'students' ? "👥 隊員檔案庫" :
                 activeTab === 'attendance' ? "✅ 日程連動點名" :
                 activeTab === 'competitions' ? "🏸 比賽資訊公告" :
                 activeTab === 'schedules' ? "📅 訓練班日程表" :
                 activeTab === 'gallery' ? "📸 精彩花絮" :
                 activeTab === 'awards' ? "🏆 獎項成就" :
                 activeTab === 'league' ? "🗓️ 聯賽專區" :
                 activeTab === 'financial' ? "💰 財務收支管理" :
                 activeTab === 'settings' ? "⚙️ 系統核心設定" :
                 activeTab === 'monthlyStarsAdmin' ? "🌟 每月之星管理" :
                 activeTab === 'monthlyStars' ? "🌟 每月之星" :
                 activeTab === 'externalMatches' ? "📝 校外賽記錄管理" : ""}
              </h1>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                BCKLAS SQUASH TEAM MANAGEMENT SYSTEM
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {role === 'admin' && isUpdating && (
              <div className="flex items-center gap-2 text-blue-600 text-xs font-black bg-blue-50 px-4 py-2 rounded-full animate-pulse">
                <Loader2 size={14} className="animate-spin"/> 同步中...
              </div>
            )}
            <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl items-center gap-2 font-black">
              <div className="px-4 py-1.5 bg-white rounded-xl shadow-sm text-xs text-blue-600 flex items-center gap-2">
                <Clock size={14}/> {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto pb-40">
          
          {showPlayerCard && ( <PlayerCardModal student={showPlayerCard} onClose={() => setShowPlayerCard(null)} /> )}

          {showAddAwardModal && (
                  <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAddAwardModal(false)}>
                      <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 shadow-2xl relative animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setShowAddAwardModal(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
                          <h3 className="text-3xl font-black text-slate-800 mb-8">新增輝煌成就</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            {/* 圖片上傳區 */}
                            <div className="md:col-span-1">
                              <label className="text-sm font-bold text-slate-500 mb-2 block">得獎照片</label>
                              <div 
                                className="w-full aspect-[4/3] bg-slate-50 rounded-2xl border-2 border-dashed flex items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all cursor-pointer"
                                onClick={() => document.getElementById('awardPhotoInput').click()}
                              >
                                {awardPhotoPreview ? (
                                  <img src={awardPhotoPreview} alt="Award Preview" className="w-full h-full object-cover rounded-2xl" />
                                ) : (
                                  <div className="text-center">
                                    <ImageIcon size={40} />
                                    <p className="text-xs font-bold mt-2">點擊上傳照片</p>
                                  </div>
                                )}
                              </div>
                              <input 
                                id="awardPhotoInput"
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handleAwardPhotoUpload}
                              />
                            </div>
          
                            {/* 表單輸入區 */}
                            <div className="md:col-span-1 space-y-4">
                              <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">獎項名稱</label>
                                <input type="text" placeholder="例如：全港學界壁球賽" value={newAwardData.title} onChange={e => setNewAwardData({...newAwardData, title: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">名次</label>
                                <input type="text" placeholder="例如：冠軍" value={newAwardData.rank} onChange={e => setNewAwardData({...newAwardData, rank: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-slate-500 block mb-1">獲獎學生</label>
                                <input type="text" placeholder="輸入學生姓名" value={newAwardData.studentName} onChange={e => setNewAwardData({...newAwardData, studentName: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
                              </div>
                            </div>
          
                            <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1">獲獎日期</label>
                                <input type="date" value={newAwardData.date} onChange={e => setNewAwardData({...newAwardData, date: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500" />
                            </div>
                             <div className="md:col-span-2">
                                <label className="text-xs font-bold text-slate-500 block mb-1">備註 (可選)</label>
                                <textarea placeholder="可輸入比賽地點、主辦單位等資訊" value={newAwardData.description} onChange={e => setNewAwardData({...newAwardData, description: e.target.value})} className="w-full bg-slate-50 p-3 rounded-xl outline-none border-2 focus:border-blue-500 h-20"></textarea>
                            </div>
                          </div>
          
                          <div className="mt-8 flex justify-end">
                              <button onClick={handleSaveAward} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-yellow-500 text-white rounded-2xl shadow-xl shadow-yellow-100 hover:bg-yellow-600 transition-all font-black disabled:opacity-50">
                                  {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存獎項
                              </button>
                          </div>
                      </div>
                  </div>
                )}
          
          {selectedSchedule && (
            <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedSchedule(null)}>
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500"></div>{selectedSchedule.resource.trainingClass} 訓練詳情</h3>
                <div className="space-y-4 text-lg">
                  <div className="flex items-center gap-4"><CalendarIcon size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.resource.date}</span></div>
                  <div className="flex items-center gap-4"><Clock size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.resource.time || 'N/A'}</span></div>
                  <div className="flex items-center gap-4"><MapPin size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.resource.location}</span></div>
                </div>
                {role === 'admin' && moment(selectedSchedule.start).isSame(new Date(), 'day') && (
                  <div className="mt-8 pt-6 border-t">
                    <button onClick={() => { setActiveTab('attendance'); setSelectedSchedule(null); }} className="w-full text-center py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all">前往點名</button>
                  </div>
                )}
              </div>
            </div>
          )}

                    {/* 在此渲染彈窗 */}
          {viewingBadge && (
             <BadgeInfoModal badgeInfo={viewingBadge} onClose={() => setViewingBadge(null)} />
          )}

          {/* --- 全新：授予勳章選擇視窗 --- */}
          {showAwardModal && studentToAward && (
              <div className="fixed inset-0 z-[400] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowAwardModal(false)}>
                  <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                      <div className="p-6 border-b flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
                          <div>
                              <h3 className="text-2xl font-black text-slate-800">授予徽章</h3>
                              <p className="text-sm font-bold text-slate-500 mt-1">目前選擇學員：<span className="text-blue-600">{studentToAward.name} ({studentToAward.class})</span></p>
                          </div>
                          <button onClick={() => setShowAwardModal(false)} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-800 shadow-sm transition-colors"><X size={20} /></button>
                      </div>
                      
                      <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(ACHIEVEMENT_DATA).map(([badgeId, badgeData]) => (
                              <div key={badgeId} className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                                  <div className="flex items-center gap-3 mb-3 border-b pb-3">
                                      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border shadow-inner">
                                          {badgeData.icon}
                                      </div>
                                      <div>
                                          <h4 className="font-black text-slate-800 text-sm">{badgeData.baseName}</h4>
                                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{badgeData.rarity}</span>
                                      </div>
                                  </div>
                                  <div className="space-y-2">
                                      {Object.entries(badgeData.levels).map(([levelStr, levelData]) => {
                                          const level = parseInt(levelStr);
                                          return (
                                              <button 
                                                  key={level}
                                                  onClick={() => {
                                                      if(confirm(`確定要授予 ${studentToAward.name} 「${levelData.name}」嗎？`)){
                                                          awardAchievement(badgeId, studentToAward.id, level);
                                                          setShowAwardModal(false);
                                                      }
                                                  }}
                                                  className="w-full text-left p-2 rounded-xl text-xs hover:bg-blue-50 hover:text-blue-700 transition-colors group flex flex-col gap-1 border border-transparent hover:border-blue-100"
                                              >
                                                  <span className="font-bold text-slate-700 group-hover:text-blue-700">{levelData.name}</span>
                                                  <span className="text-[10px] text-slate-400 line-clamp-1">{levelData.desc}</span>
                                              </button>
                                          )
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
          {/* --------------------------------- */}

          
          {viewingStudent && (<PlayerDashboard student={viewingStudent} data={playerDashboardData} onClose={() => setViewingStudent(null)} onBadgeClick={setViewingBadge} />)}

         {/* --- START: 版本 12.8 修正 - 完整 myDashboard 渲染區塊 --- */}
         {/* --- START: 版本 12.8 修正 - 完整 myDashboard 渲染區塊 --- */}
{!viewingStudent && activeTab === 'myDashboard' && role === 'student' && (
    <>
        <PlayerDashboard 
            student={rankedStudents.find(s => s.id === currentUserInfo?.id) || currentUserInfo} 
            data={myDashboardData} 
            onClose={null} 
            onBadgeClick={setViewingBadge} 
        />

        {/* 勳章展示牆編輯器 Modal 視窗 */}
        {showcaseEditorOpen && (
            <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowcaseEditorOpen(false)}>
                <div className="bg-white rounded-[3rem] w-full max-w-3xl p-10 shadow-2xl relative animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setShowcaseEditorOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-800 transition-colors"><X size={24} /></button>
                    <h3 className="text-3xl font-black text-slate-800 mb-2">編輯我的勳章展示牆</h3>
                    <p className="text-slate-400 mb-8">選擇最多 3 個你最自豪的勳章，它們將會顯示在你的名字旁邊！</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* 左側：可選勳章 */}
                        <div className="bg-slate-50 p-6 rounded-3xl border">
                            <h4 className="font-bold text-slate-600 mb-4 text-center">我獲得的勳章</h4>
                            <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                                {myDashboardData?.achievements.map(ach => {
                                    const badgeData = ACHIEVEMENT_DATA[ach.badgeId];
                                    if (!badgeData) return null;
                                    const levelData = badgeData.levels?.[ach.level] || badgeData.levels?.[1] || {};
                                    const isSelected = selectedFeaturedBadges.includes(ach.badgeId);
                                    const isDisabled = !isSelected && selectedFeaturedBadges.length >= 3;

                                    return (
                                        <button 
                                            key={ach.badgeId}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                setSelectedFeaturedBadges(prev => 
                                                    isSelected ? prev.filter(b => b !== ach.badgeId) : [...prev, ach.badgeId]
                                                );
                                            }}
                                            className={`flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all ${
                                                isSelected ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-transparent hover:bg-slate-200'
                                            } ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}`}
                                            title={levelData.name}
                                        >
                                            <div className="w-12 h-12 flex items-center justify-center">{badgeData.icon}</div>
                                            <p className="text-[9px] font-bold text-slate-500 mt-1 truncate w-full">{levelData.name}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 右側：已選勳章 */}
                        <div className="p-6">
                            <h4 className="font-bold text-slate-600 mb-4 text-center">我的展示牆 (預覽)</h4>
                            <div className="flex justify-center items-center gap-4 p-4 rounded-3xl bg-slate-100 min-h-[100px]">
                                {selectedFeaturedBadges.map(badgeId => {
                                    const badgeData = ACHIEVEMENT_DATA[badgeId];
                                    if (!badgeData) return null;
                                    return (
                                        <div key={badgeId} className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md border animate-in zoom-in-50" title={badgeData.baseName}>
                                            {badgeData.icon}
                                        </div>
                                    );
                                })}
                                {selectedFeaturedBadges.length === 0 && <p className="text-xs text-slate-400">請從左側選擇勳章</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button onClick={handleSaveFeaturedBadges} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all font-black disabled:opacity-50">
                            {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* "編輯我的勳章展示牆" 按鈕 */}
        <div className="mt-10 text-center">
            <button 
                onClick={() => {
                    setSelectedFeaturedBadges(currentUserInfo?.featuredBadges || []);
                    setShowcaseEditorOpen(true);
                }}
                className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl shadow-sm hover:shadow-lg hover:border-blue-500 hover:text-blue-600 transition-all font-bold"
            >
                <Pencil size={16} /> 編輯我的勳章展示牆
            </button>
        </div>
    </>
)}
{/* --- END: 版本 12.8 修正 --- */}

          
          {!viewingStudent && activeTab === 'dashboard' && (role === 'admin' || role === 'student') && (
             <div className="space-y-10 animate-in fade-in duration-700 font-bold">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm mb-10"><h3 className="text-2xl font-black mb-10 flex items-center gap-4"><History className="text-blue-600"/> 最近更新活動</h3><div className="space-y-6">{competitions.slice(0, 4).map(c => (<div key={c.id} className="flex gap-6 items-start"><div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 ring-8 ring-blue-50"></div><div><p className="text-sm font-black text-slate-800">發佈了比賽公告：{c.title}</p><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">比賽日期：{c.date}</p></div></div>))}{schedules.slice(0, 2).map(s => (<div key={s.id} className="flex gap-6 items-start"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 ring-8 ring-emerald-50"></div><div><p className="text-sm font-black text-slate-800">新增訓練日程：{s.trainingClass}</p><p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{s.date} @ {s.location}</p></div></div>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-xl shadow-blue-100 relative overflow-hidden"><div className="absolute -right-5 -bottom-5 opacity-20"><Users size={120}/></div><p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-2">活躍隊員</p><p className="text-6xl font-black mt-2 font-mono">{students.length}</p><div className="mt-6 flex items-center gap-2 text-xs text-blue-200 font-bold"><TrendingUp size={14}/> 成長茁壯中</div></div>
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden"><div className="absolute -right-5 -bottom-5 opacity-5"><CalendarIcon size={120}/></div><p className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2">本月訓練</p><p className="text-6xl font-black mt-2 text-slate-800 font-mono">{dashboardStats.thisMonthTrainings}</p><div className="mt-6 flex items-center gap-2 text-xs text-slate-400 font-bold"><Clock size={14}/> 訓練不間斷</div></div>
                   <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden"><div className="absolute -right-5 -bottom-5 opacity-20"><Hourglass size={120}/></div><p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">距離下一場比賽</p><div className="flex items-baseline gap-2 mt-2"><p className="text-6xl font-black font-mono">{dashboardStats.daysToNextMatch}</p>{dashboardStats.daysToNextMatch !== '-' && dashboardStats.daysToNextMatch !== 'Today!' && (<span className="text-xl font-bold text-slate-500">Days</span>)}</div><div className="mt-6 flex items-center gap-2 text-xs text-emerald-400 font-bold"><Target size={14}/> 全力備戰中</div></div>
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden"><div className="absolute -right-5 -bottom-5 opacity-5"><Medal size={120}/></div><div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mb-4 z-10 border border-yellow-200"><TrophyIcon size={32}/></div><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 z-10">本年度獎項</p><p className="text-4xl font-black mt-1 text-slate-800 z-10">{dashboardStats.awardsThisYear}</p></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm"><h3 className="text-2xl font-black mb-10 flex items-center gap-4"><Target className="text-blue-600"/> 章別分佈概況</h3><div className="space-y-6">{Object.keys(BADGE_DATA).filter(k => k !== '無').map(badge => {const count = students.filter(s => s.badge === badge).length;const percent = students.length ? Math.round((count/students.length)*100) : 0;return (<div key={badge} className="space-y-2"><div className="flex justify-between items-center px-2"><span className={`text-xs font-black ${BADGE_DATA[badge].color}`}>{badge}</span><span className="text-xs text-slate-400 font-mono">{count} 人 ({percent}%)</span></div><div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border"><div className={`h-full transition-all duration-1000 ${BADGE_DATA[badge].bg.replace('bg-', 'bg-')}`} style={{width: `${percent}%`, backgroundColor: 'currentColor'}}></div></div></div>);})}</div></div>
                   <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col h-full"><h3 className="text-2xl font-black mb-6 flex items-center gap-4"><BookOpen className="text-blue-600"/> 章別獎勵計劃</h3><div className="flex-1 w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group"><iframe src="https://docs.google.com/gview?embedded=true&url=https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@8532769cb36715336a13538c021cfee65daa50c9/Booklet.pdf" className="w-full h-full min-h-[300px]" frameBorder="0" title="Award Scheme Booklet"></iframe><div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"><a href="https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@8532769cb36715336a13538c021cfee65daa50c9/Booklet.pdf" target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 hover:bg-blue-700"><Download size={14}/> 下載 PDF</a></div></div></div>
                </div>
             </div>
          )}

          {!viewingStudent && activeTab === 'monthlyStars' && (<MonthlyStarsPage monthlyStarsData={monthlyStars} />)}

 {/* ASSESSMENTS TAB (NEW) */}
          {!viewingStudent && activeTab === 'assessments' && role === 'admin' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 font-bold">
                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-3xl font-black mb-2 text-center">綜合能力評估錄入</h3>
                   <p className="text-center text-slate-400 mb-10">請輸入學員各項體能與技術測試的最新成績。</p>
                   
                   <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-bold text-slate-500 mb-2 block">選擇學員</label>
                          <select value={newAssessment.studentId} onChange={e => setNewAssessment({...newAssessment, studentId: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none">
                            <option value="" disabled>-- 請選擇一位隊員 --</option>
                            {students.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-bold text-slate-500 mb-2 block">評估日期</label>
                          <input type="date" value={newAssessment.date} onChange={e => setNewAssessment({...newAssessment, date: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"/>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl border space-y-6">
                        <h4 className="text-lg font-black text-slate-700 flex items-center gap-2"><Activity size={20}/> 體能測試指標</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div><label className="text-xs text-slate-500 block mb-1">仰臥起坐 (次/分)</label><input type="number" value={newAssessment.situps} onChange={e => setNewAssessment({...newAssessment, situps: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 45"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">1分鐘折返跑 (次)</label><input type="number" value={newAssessment.shuttleRun} onChange={e => setNewAssessment({...newAssessment, shuttleRun: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="跑3組平均值"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">耐力跑 (6/9分鐘)</label><input type="number" value={newAssessment.enduranceRun} onChange={e => setNewAssessment({...newAssessment, enduranceRun: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 圈數"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">手握力 (kg)</label><input type="number" value={newAssessment.gripStrength} onChange={e => setNewAssessment({...newAssessment, gripStrength: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 30"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">柔軟度 (坐姿體前彎 cm)</label><input type="number" value={newAssessment.flexibility} onChange={e => setNewAssessment({...newAssessment, flexibility: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 25"/></div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-3xl border space-y-6">
                        <h4 className="text-lg font-black text-slate-700 flex items-center gap-2"><Swords size={20}/> 技術測試指標</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div><label className="text-xs text-slate-500 block mb-1">正手直線連續 (次)</label><input type="number" value={newAssessment.fhDrive} onChange={e => setNewAssessment({...newAssessment, fhDrive: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 30"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">反手直線連續 (次)</label><input type="number" value={newAssessment.bhDrive} onChange={e => setNewAssessment({...newAssessment, bhDrive: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 20"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">正手截擊連續 (次)</label><input type="number" value={newAssessment.fhVolley} onChange={e => setNewAssessment({...newAssessment, fhVolley: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 15"/></div>
                          <div><label className="text-xs text-slate-500 block mb-1">反手截擊連續 (次)</label><input type="number" value={newAssessment.bhVolley} onChange={e => setNewAssessment({...newAssessment, bhVolley: e.target.value})} className="w-full p-3 rounded-xl border-2 outline-none focus:border-blue-500" placeholder="例如: 10"/></div>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">教練評語 (可選)</label>
                        <textarea value={newAssessment.notes} onChange={e => setNewAssessment({...newAssessment, notes: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none h-24" placeholder="輸入關於學生表現的觀察或建議..."></textarea>
                      </div>

                      <div className="pt-6 border-t">
                        <button onClick={handleSaveAssessment} disabled={isUpdating} className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存評估成績</button>
                      </div>
                   </div>
                 </div>
              </div>
            )}
          
          {!viewingStudent && activeTab === 'rankings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12 mt-10 md:mt-24">
                {rankedStudents.slice(0, 3).map((s, i) => {
                   let orderClass = "", sizeClass = "", gradientClass = "", iconColor = "", shadowClass = "", label = "", labelBg = "";
                   if (i === 0) { orderClass = "order-1 md:order-2"; sizeClass = "w-full md:w-1/3 md:-mt-12 scale-105 md:scale-110 z-20"; gradientClass = "bg-gradient-to-b from-yellow-100 via-yellow-50 to-white border-yellow-300"; iconColor = "text-yellow-500"; shadowClass = "shadow-2xl shadow-yellow-200/50"; label = "CHAMPION"; labelBg = "bg-yellow-500"; } 
                   else if (i === 1) { orderClass = "order-2 md:order-1"; sizeClass = "w-full md:w-1/4 z-10"; gradientClass = "bg-gradient-to-b from-slate-200 via-slate-50 to-white border-slate-300"; iconColor = "text-slate-500"; shadowClass = "shadow-xl shadow-slate-300/50"; label = "RUNNER-UP"; labelBg = "bg-slate-500"; } 
                   else { orderClass = "order-3 md:order-3"; sizeClass = "w-full md:w-1/4 z-10"; gradientClass = "bg-gradient-to-b from-orange-100 via-orange-50 to-white border-orange-300"; iconColor = "text-orange-500"; shadowClass = "shadow-xl shadow-orange-200/50"; label = "3RD PLACE"; labelBg = "bg-orange-500"; }
                   return (
                      <div key={s.id} className={`relative flex-shrink-0 flex flex-col items-center text-center ${orderClass} ${sizeClass} transition-all duration-500 hover:-translate-y-2`}>
                          <div className={`absolute inset-0 rounded-[3rem] border-4 ${gradientClass} ${shadowClass} overflow-hidden`}>
                               <div className="absolute -right-4 -top-4 opacity-10 rotate-12"><TrophyIcon size={120} className={i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : 'text-orange-600'}/></div>
                               <div className="absolute top-2 right-4 opacity-10 select-none pointer-events-none"><span className="text-9xl font-black font-mono tracking-tighter">{i+1}</span></div>
                          </div>
                          <div className="relative z-10 p-8 w-full h-full flex flex-col items-center">
                              {i === 0 && (<div className="absolute -top-14 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-lg"><Crown size={64} fill="currentColor" strokeWidth={1.5} /></div>)}
                              <div className={`w-24 h-24 mx-auto bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-black mb-4 ${iconColor}`}>{s.name[0]}<div className={`absolute -bottom-3 px-4 py-1 rounded-full text-[10px] text-white font-black tracking-widest ${labelBg} shadow-sm`}>{label}</div></div>
                              <div className="mt-4 w-full"><h3 className="text-2xl font-black text-slate-800 truncate">{s.name}</h3><p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{s.class} ({s.classNo})</p><div className="my-6"><div className={`text-5xl font-black font-mono tracking-tight ${iconColor}`}>{s.totalPoints}</div><p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Total Points</p></div><div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-white/50 backdrop-blur-sm`}><span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span><span className="text-xs font-black text-slate-500">{s.badge}</span></div></div>
                          </div>
                      </div>
                   )
                })}
              </div>
              <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 mb-8 flex flex-col md:flex-row items-start md:items-center gap-6 shadow-sm">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Info size={24} /></div>
                  <div className="flex-1">
                      <h4 className="text-lg font-black text-slate-800 mb-2">💡 積分機制說明</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 font-bold">
                          <ul className="list-disc pl-4 space-y-1"><li><span className="text-slate-400">出席訓練</span>：只作紀錄 (不加分)</li><li><span className="text-blue-600">內部聯賽</span>：勝方 +10 / 巨人殺手 +20</li></ul>
                          <ul className="list-disc pl-4 space-y-1"><li><span className="text-indigo-500">校外賽參與</span>：+20 / 勝場 +20</li><li><span className="text-yellow-600">校外賽獎項</span>：冠軍+100 / 亞軍+50 / 季殿+30</li></ul>
                      </div>
                  </div>
              </div>
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden font-bold">
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-xl font-black">全體隊員排名表</h3>
                  {role === 'admin' && <div className="flex gap-2"><span className="text-[10px] text-slate-400 self-center">*請在下方列表為個別學生加分</span></div>}
                  <div className="relative w-full md:w-80"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/><input value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="搜尋姓名或班別..." className="w-full bg-white border rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-600 transition-all shadow-sm"/></div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b font-black"><tr><th className="px-8 py-6 text-center">排名</th><th className="px-8 py-6">隊員資料</th><th className="px-8 py-6">目前章別</th><th className="px-8 py-6 text-right">基礎分</th><th className="px-8 py-6 text-right">總分</th>{role === 'admin' && <th className="px-8 py-6 text-center">教練操作</th>}</tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s, i) => (
                        <tr key={s.id} className="group hover:bg-blue-50/30 transition-all cursor-pointer" onClick={() => setShowPlayerCard(s)}>
                          <td className="px-8 py-8 text-center"><span className={`inline-flex w-10 h-10 items-center justify-center rounded-xl text-sm font-black ${i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{i+1}</span></td>
                          <td className="px-8 py-8">
    <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-lg font-black text-slate-300 border group-hover:bg-white group-hover:text-blue-600 transition-all uppercase">{s.name[0]}</div>
        <div>
            <div className="flex items-center gap-2">
                <div className="font-black text-lg text-slate-800">{s.name}</div>
                {/* --- START: 版本 12.9 新增 - 顯示主打勳章 --- */}
                <div className="flex items-center gap-1">
                    {s.featuredBadges?.map(badgeId => {
                        const badge = ACHIEVEMENT_DATA[badgeId];
                        if (!badge) return null;
                        return (
                            <div key={badgeId} title={badge.baseName} className="w-5 h-5 flex items-center justify-center text-blue-600">
                                {React.cloneElement(badge.icon, { size: 18 })}
                            </div>
                        );
                    })}
                </div>
                {/* --- END: 版本 12.9 新增 --- */}
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Class {s.class} • No.{s.classNo}</div>
        </div>
    </div>
</td>

                          <td className="px-8 py-8"><div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color} ${BADGE_DATA[s.badge]?.border} shadow-sm`}><span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span><span className="text-xs font-black">{s.badge}</span></div></td>
                          <td className="px-8 py-8 text-right font-mono text-slate-400">{s.points}</td>
                          <td className="px-8 py-8 text-right font-mono text-3xl text-blue-600 font-black">{s.totalPoints}</td>
                          {role === 'admin' && (
                            <td className="px-8 py-8"><div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}><button onClick={()=>adjustPoints(s.id, 10)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="+10分"><Plus size={18}/></button><button onClick={()=>adjustPoints(s.id, -10)} className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all" title="-10分"><MinusCircle size={18}/></button><button onClick={()=> handleExternalComp(s)} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" title="校外賽成績錄入"><Globe size={18}/></button><button onClick={()=>deleteItem('students', s.id)} className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all" title="永久刪除"><Trash2 size={18}/></button></div></td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {!viewingStudent && activeTab === 'students' && role === 'admin' && (
             <div className="space-y-10 animate-in slide-in-from-right-10 duration-700 font-bold">
                <div className="flex overflow-x-auto gap-4 pb-4"><div className="bg-slate-800 text-white px-5 py-3 rounded-2xl whitespace-nowrap shadow-md flex-shrink-0"><span className="text-[10px] uppercase tracking-widest text-slate-400 block">總人數</span><span className="text-xl font-black">{students.length}</span></div>{Object.entries(birthYearStats).sort().map(([year, count]) => (<div key={year} className="bg-white px-5 py-3 rounded-2xl whitespace-nowrap shadow-sm border border-slate-100 min-w-[100px] flex-shrink-0"><span className="text-[10px] uppercase tracking-widest text-slate-400 block">{year} 年</span><span className="text-xl font-black text-slate-800">{count} 人</span></div>))}</div>
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between shadow-sm gap-8 relative overflow-hidden"><div className="absolute -left-10 -bottom-10 opacity-5 rotate-12"><Users size={150}/></div><div className="relative z-10"><h3 className="text-3xl font-black">隊員檔案管理</h3><p className="text-slate-400 text-sm mt-1">在此批量匯入名單或個別編輯隊員屬性</p></div><div className="flex gap-4 relative z-10 flex-wrap justify-center"><div className="relative"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><select value={selectedYearFilter} onChange={(e) => setSelectedYearFilter(e.target.value)} className="pl-10 pr-10 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 outline-none shadow-sm"><option value="ALL">全部年份</option>{Object.keys(birthYearStats).sort().map(year => (<option key={year} value={year}>{year} 年出生 ({birthYearStats[year]}人)</option>))}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/></div><button onClick={()=>downloadTemplate('students')} className="p-5 bg-slate-50 text-slate-400 border border-slate-100 rounded-[2rem] hover:text-blue-600 transition-all" title="下載名單範本"><Download size={24}/></button><label className="bg-blue-600 text-white px-10 py-5 rounded-[2.2rem] cursor-pointer hover:bg-blue-700 shadow-2xl shadow-blue-100 flex items-center gap-3 transition-all active:scale-[0.98]"><Upload size={20}/> 批量匯入 CSV 名單<input type="file" className="hidden" accept=".csv" onChange={handleCSVImportStudents}/></label></div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {filteredStudents.sort((a,b)=>a.class.localeCompare(b.class)).map(s => (
                     <div key={s.id} className="p-8 bg-white border border-slate-100 rounded-[3rem] shadow-sm hover:shadow-xl hover:shadow-slate-100 transition-all flex flex-col items-center group relative cursor-pointer" onClick={() => setViewingStudent(s)}>
                        <div className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[8px] font-black border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color}`}>{s.badge}</div>
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-3xl mb-4 text-slate-300 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all font-black uppercase">{s.name[0]}</div>
                        <p className="text-xl font-black text-slate-800">{s.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-widest">{s.class} ({s.classNo})</p>

                        {/* --- START: 版本 12.9 新增 - 在隊員卡片上顯示主打勳章 --- */}
                        <div className="flex items-center justify-center gap-2 mt-3 h-6">
                            {s.featuredBadges?.map(badgeId => {
                                const badge = ACHIEVEMENT_DATA[badgeId];
                                if (!badge) return null;
                                return (
                                    <div key={badgeId} title={badge.baseName} className="w-6 h-6 flex items-center justify-center text-yellow-500">
                                        {React.cloneElement(badge.icon, { size: 20 })}
                                    </div>
                                );
                            })}
                        </div>
                        {/* --- END: 版本 12.9 新增 --- */}
                        {s.dob ? (<div className="mt-2 text-[10px] bg-slate-50 text-slate-500 px-3 py-1 rounded-full font-bold flex items-center gap-1 border border-slate-100"><Cake size={10}/> {s.dob}</div>) : (<div className="mt-2 text-[10px] text-slate-300 font-bold">未設定生日</div>)}
                        <div className="mt-1 text-[10px] text-blue-500 font-bold">{s.squashClass}</div>
                        <div className="mt-6 pt-6 border-t border-slate-50 w-full flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                           <button onClick={() => handleManualAward(s)} className="text-slate-300 hover:text-yellow-500 hover:bg-yellow-50 p-2 rounded-xl transition-all" title="授予徽章"><Award size={16}/></button>
                           <button onClick={() => handleUpdateSquashClass(s)} className="text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 p-2 rounded-xl transition-all" title="設定報名班別"><Layers size={16}/></button>
                           <button onClick={() => handleSetupStudentAuth(s)} className="text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 p-2 rounded-xl transition-all" title="設定登入資料"><Key size={16}/></button>
                           <button onClick={() => handleUpdateDOB(s)} className="text-slate-300 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-all" title="設定出生日期"><Cake size={16}/></button>
                           <button onClick={()=>deleteItem('students', s.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-all" title="刪除隊員"><Trash2 size={16}/></button>
                        </div>

                     </div>
                   ))}
                   <button onClick={()=>{const name = prompt('隊員姓名');const cls = prompt('班別 (如: 6A)');if(name && cls) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'students'), { name, class: cls.toUpperCase(), classNo: '00', badge: '無', points: 100, squashClass: '', createdAt: serverTimestamp() });}} className="p-8 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 hover:text-blue-600 hover:border-blue-600 transition-all group"><Plus size={32} className="mb-2 group-hover:scale-125 transition-all"/><span className="text-sm font-black uppercase tracking-widest">新增單一隊員</span></button>
                </div>
             </div>
          )}

          {/* MONTHLY STARS ADMIN */}
          {!viewingStudent && activeTab === 'monthlyStarsAdmin' && role === 'admin' && (
              <div className="animate-in fade-in duration-500 font-bold">
                  <div className="bg-white p-10 rounded-[3rem] border shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h3 className="text-3xl font-black">每月之星內容管理</h3>
                        <input type="month" value={selectedMonthForAdmin} onChange={e => setSelectedMonthForAdmin(e.target.value)} className="bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none text-lg font-bold"/>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Male Winner Form */}
                      <div className="bg-slate-50/70 p-8 rounded-3xl border space-y-4">
                        <h4 className="text-xl font-black text-blue-600">每月之星 (男)</h4>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">選擇學員</label>
                           <select value={monthlyStarEditData.maleWinner?.studentId || ''} onChange={e => handleMonthlyStarStudentSelect('maleWinner', e.target.value)} className="w-full bg-white p-4 rounded-xl shadow-sm outline-none">
                             <option value="" disabled>請選擇一位男同學...</option>
                             {students.sort((a,b) => a.class.localeCompare(b.class)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                           </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">獲選原因</label>
                          <textarea value={monthlyStarEditData.maleWinner?.reason || ''} onChange={e => handleMonthlyStarFieldChange('maleWinner', 'reason', e.target.value)} className="w-full bg-white p-4 rounded-xl shadow-sm h-24 outline-none"></textarea>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">本年度目標</label>
                          <textarea value={monthlyStarEditData.maleWinner?.goals || ''} onChange={e => handleMonthlyStarFieldChange('maleWinner', 'goals', e.target.value)} className="w-full bg-white p-4 rounded-xl shadow-sm h-24 outline-none"></textarea>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">上傳全身照</label>
                          <div className="w-full aspect-[3/4] bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                             {malePhotoPreview ? <img src={malePhotoPreview} alt="Preview" className="w-full h-full object-cover"/> : <span className="text-slate-300"><ImageIcon size={48}/></span>}
                          </div>
                          <input type="file" accept="image/*" onChange={e => handleMonthlyStarPhotoUpload('maleWinner', e.target.files[0])} className="mt-2 text-xs"/>
                        </div>
                      </div>
                      {/* Female Winner Form */}
                      <div className="bg-slate-50/70 p-8 rounded-3xl border space-y-4">
                        <h4 className="text-xl font-black text-pink-500">每月之星 (女)</h4>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">選擇學員</label>
                           <select value={monthlyStarEditData.femaleWinner?.studentId || ''} onChange={e => handleMonthlyStarStudentSelect('femaleWinner', e.target.value)} className="w-full bg-white p-4 rounded-xl shadow-sm outline-none">
                             <option value="" disabled>請選擇一位女同學...</option>
                             {students.sort((a,b) => a.class.localeCompare(b.class)).map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                           </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">獲選原因</label>
                          <textarea value={monthlyStarEditData.femaleWinner?.reason || ''} onChange={e => handleMonthlyStarFieldChange('femaleWinner', 'reason', e.target.value)} className="w-full bg-white p-4 rounded-xl shadow-sm h-24 outline-none"></textarea>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">本年度目標</label>
                          <textarea value={monthlyStarEditData.femaleWinner?.goals || ''} onChange={e => handleMonthlyStarFieldChange('femaleWinner', 'goals', e.target.value)} className="w-full bg-white p-4 rounded-xl shadow-sm h-24 outline-none"></textarea>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-400 mb-2 block">上傳全身照</label>
                          <div className="w-full aspect-[3/4] bg-white rounded-xl shadow-sm flex items-center justify-center overflow-hidden">
                             {femalePhotoPreview ? <img src={femalePhotoPreview} alt="Preview" className="w-full h-full object-cover"/> : <span className="text-slate-300"><ImageIcon size={48}/></span>}
                          </div>
                          <input type="file" accept="image/*" onChange={e => handleMonthlyStarPhotoUpload('femaleWinner', e.target.files[0])} className="mt-2 text-xs"/>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-4">
                     <button onClick={handleGeneratePoster} disabled={isGeneratingPoster || !monthlyStarEditData.maleWinner.studentId || !monthlyStarEditData.femaleWinner.studentId} className="flex items-center gap-3 px-8 py-4 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all font-black disabled:opacity-50 disabled:cursor-not-allowed">
                        {isGeneratingPoster ? <Loader2 className="animate-spin" /> : <Printer />} 下載本月海報
                    </button>
                    <button onClick={handleSaveMonthlyStar} disabled={isUpdating} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all font-black disabled:opacity-50">
                        {isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 發佈 / 更新
                    </button>
                  </div>
              </div>
          )}

          {/* SCHEDULES TAB */}
          {!viewingStudent && activeTab === 'schedules' && (
            <div className="space-y-8 animate-in fade-in duration-500 font-bold">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6"><div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><CalendarIcon/></div><div><h3 className="text-xl font-black">訓練班日程表</h3><p className="text-xs text-slate-400 mt-1">查看各級訓練班的日期與地點安排</p></div></div>
                  <div className="flex flex-wrap gap-4 w-full md:w-auto"><div className="relative flex-1 md:flex-none"><Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18}/><select value={selectedClassFilter} onChange={(e)=>setSelectedClassFilter(e.target.value)} className="w-full md:w-60 bg-slate-50 border-none outline-none pl-12 pr-6 py-4 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner">{uniqueTrainingClasses.map(c => (<option key={c} value={c}>{c === 'ALL' ? '🌍 全部訓練班' : `🏸 ${c}`}</option>))}</select></div>{role === 'admin' && (<div className="flex gap-2"><button onClick={()=>downloadTemplate('schedule')} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl border transition-all" title="下載日程範本"><Download size={20}/></button><label className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all font-black text-sm"><Upload size={18}/> 匯入 CSV 日程<input type="file" className="hidden" accept=".csv" onChange={handleCSVImportSchedules}/></label></div>)}</div>
               </div>
               <div className="bg-white p-6 rounded-[3rem] shadow-sm border h-[70vh]">
                  <Calendar
                      localizer={localizer}
                      events={calendarEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%' }}
                      onSelectEvent={event => setSelectedSchedule(event)}
                      eventPropGetter={(event) => {
                          const className = event.resource.trainingClass === 'A班' ? 'bg-blue-500' : event.resource.trainingClass === 'B班' ? 'bg-green-500' : 'bg-yellow-500';
                          return { className: `${className} border-none text-white p-1 text-xs rounded-lg` };
                      }}
                  />
               </div>
            </div>
          )}

          {/* ATTENDANCE TAB */}
          {!viewingStudent && activeTab === 'attendance' && role === 'admin' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-bold">
               <div className={`p-12 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden transition-all duration-1000 ${todaySchedule ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-slate-800'}`}><div className="absolute -right-20 -bottom-20 opacity-10 rotate-12"><ClipboardCheck size={300}/></div><div className="relative z-10"><h3 className="text-4xl font-black flex items-center gap-4 mb-4">教練點名工具 <Clock size={32}/></h3><div className="flex flex-wrap gap-4">{todaySchedule ? (<><div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2"><Star size={14} className="text-yellow-300 fill-yellow-300"/><span className="text-sm font-black">今日：{todaySchedule.trainingClass}</span></div><div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2"><MapPin size={14}/><span className="text-sm font-black">{todaySchedule.location}</span></div></>) : (<div className="bg-slate-700/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/5 flex items-center gap-2"><Info size={14}/><span className="text-sm font-black text-slate-300 font-bold">今日無預設訓練，進行一般點名</span></div>)}</div></div><div className="relative z-10 bg-white/10 px-10 py-6 rounded-[2.5rem] backdrop-blur-md mt-10 md:mt-0 text-center border border-white/10 shadow-inner"><p className="text-[10px] uppercase tracking-[0.3em] text-blue-100 font-black opacity-60">Today's Date</p><p className="text-2xl font-black mt-1 font-mono">{new Date().toLocaleDateString()}</p></div></div>
              {pendingAttendance.length > 0 && (
    <div className="fixed bottom-10 right-10 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
        <button 
            onClick={savePendingAttendance} 
            disabled={isUpdating}
            className="flex items-center gap-4 px-8 py-5 bg-blue-600 text-white rounded-3xl shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
        >
            <Save size={24} />
            <div className="text-left">
                <span className="text-xl font-black">儲存點名紀錄</span>
                <span className="block text-xs text-blue-200">已選擇 {pendingAttendance.length} 位學生</span>
            </div>
        </button>
    </div>
)}
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-8"><div className="flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FileBarChart size={24}/></div><div><h4 className="font-black text-slate-800">出席率報表中心</h4><p className="text-[10px] text-slate-400 font-bold">匯出 CSV 檢查各班出席狀況</p></div></div><div className="flex gap-2"><button onClick={() => exportMatrixAttendanceCSV(attendanceClassFilter)} className="px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"><Download size={16}/> 匯出班級點名總表</button></div></div>
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6"><div className="flex items-center gap-3 text-slate-400 min-w-max"><Filter size={20} /><span>選擇點名班別：</span></div><div className="flex flex-wrap gap-2">{uniqueTrainingClasses.map(cls => (<button key={cls} onClick={() => setAttendanceClassFilter(cls)} className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${attendanceClassFilter === cls ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'}`}>{cls === 'ALL' ? '🌍 全部學員' : cls}</button>))}</div></div>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {studentsInSelectedAttendanceClass.length > 0 ? (
                    studentsInSelectedAttendanceClass.map(s => {
                      const isAttended = todaySchedule && attendanceLogs.some(log => log.studentId === s.id && log.date === todaySchedule.date && log.trainingClass === todaySchedule.trainingClass);
                      const isPending = pendingAttendance.includes(s.id);
                      return (
                        <button 
                          key={s.id} 
                          onClick={() => {
                              if (!isAttended) {
                                  togglePendingAttendance(s.id);
                              }
                          }}
                          disabled={isAttended}
                          className={`group p-8 rounded-[3rem] border shadow-sm transition-all flex flex-col items-center text-center relative overflow-hidden 
                            ${isAttended 
                              ? 'bg-emerald-50 border-emerald-200 shadow-emerald-50 cursor-not-allowed' 
                              : isPending 
                                ? 'border-blue-500 shadow-xl shadow-blue-50 ring-4 ring-blue-100' 
                                : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-lg'
                            }`}
                        >
                          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl mb-4 transition-all font-black uppercase 
                            ${isAttended 
                              ? 'bg-emerald-200 text-white rotate-12' 
                              : isPending 
                                ? 'bg-blue-600 text-white rotate-6' 
                                : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-blue-100'
                            }`}
                          >
                            {s.name[0]}
                          </div>
                          <p className={`font-black text-xl transition-all ${isAttended ? 'text-emerald-700' : isPending ? 'text-blue-600' : 'text-slate-800'}`}>{s.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{s.class} ({s.classNo})</p>
                          <div className="mt-1 text-[10px] text-blue-500 font-bold truncate max-w-full px-2" title={s.squashClass}>{s.squashClass}</div>
                          <div className={`absolute top-4 right-4 transition-all ${isAttended ? 'text-emerald-500' : isPending ? 'text-blue-500' : 'text-slate-100 group-hover:text-blue-100'}`}>
                            <CheckCircle2 size={24}/>
                          </div>
                          {isAttended && (<div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[10px] py-1 font-black uppercase tracking-widest">已出席</div>)}
                          {isPending && !isAttended && (<div className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[10px] py-1 font-black uppercase tracking-widest">待儲存</div>)}
                        </button>
                      );
                    })
                  ) : (<div className="col-span-full py-20 text-center text-slate-300 font-bold bg-white rounded-[3rem] border border-dashed">此班別暫無學員資料</div>)}
               </div>
            </div>
          )}

          {/* FINANCIAL TAB */}
          {!viewingStudent && activeTab === 'financial' && role === 'admin' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 font-bold">
                <div className="flex justify-end">
                  <button onClick={saveFinanceConfig} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"><Save size={20} /> 儲存財務設定</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center"><div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6"><TrendingUp size={32}/></div><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總收入</p><h3 className="text-4xl font-black text-emerald-500">${financialSummary.revenue.toLocaleString()}</h3></div>
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center"><div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6"><Trash2 size={32}/></div><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總支出</p><h3 className="text-4xl font-black text-rose-500">${financialSummary.expense.toLocaleString()}</h3></div>
                  <div className={`p-10 rounded-[3.5rem] border shadow-sm flex flex-col justify-center items-center text-center ${financialSummary.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}><div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${financialSummary.profit >= 0 ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-rose-600 shadow-sm'}`}><DollarSign size={32}/></div><p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計資助盈餘</p><h3 className={`text-4xl font-black ${financialSummary.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>${financialSummary.profit.toLocaleString()}</h3></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-10"><div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm"><Trash2 size={24}/></div><h4 className="text-2xl font-black text-slate-800">支出設定 (教練費)</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[ { label: '校隊教練次數', key: 'nTeam' }, { label: '單次校隊成本', key: 'costTeam' }, { label: '進階班次數', key: 'nTrain' }, { label: '單次進階成本', key: 'costTrain' }, { label: '趣味班次數', key: 'nHobby' }, { label: '單次趣味成本', key: 'costHobby' } ].map(item => (
                        <div key={item.key}><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">{item.label}</label><input type="number" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-rose-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black" value={financeConfig[item.key]} onChange={e => setFinanceConfig({...financeConfig, [item.key]: Number(e.target.value)})}/></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-10"><div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm"><DollarSign size={24}/></div><h4 className="text-2xl font-black text-slate-800">預計收入 (學費)</h4></div>
                    <div className="space-y-10">
                      <div><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">預計總人數</label><input type="number" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black" value={financeConfig.totalStudents} onChange={e => setFinanceConfig({...financeConfig, totalStudents: Number(e.target.value)})}/></div>
                      <div><label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">每位學員學費 ($)</label><input type="number" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black" value={financeConfig.feePerStudent} onChange={e => setFinanceConfig({...financeConfig, feePerStudent: Number(e.target.value)})}/></div>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {/* COMPETITIONS TAB */}
          {!viewingStudent && activeTab === 'competitions' && (
             <div className="space-y-10 animate-in fade-in duration-500 font-bold">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="absolute -right-10 -top-10 text-slate-50 rotate-12"><Megaphone size={120}/></div>
                   <div className="flex justify-between items-center mb-10 relative z-10">
                      <div>
                        <h3 className="text-3xl font-black">最新比賽與公告</h3>
                        <p className="text-slate-400 text-xs mt-1">追蹤校隊最新動態與賽程詳情</p>
                      </div>
                      {role === 'admin' && (
                        <div className="flex gap-2">
                          <button onClick={generateCompetitionRoster} className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center gap-2" title="生成推薦名單">
                            <ListChecks size={24}/>
                            <span className="text-xs font-black">推薦名單</span>
                          </button>
                          <button onClick={()=>{
                            const title = prompt('公告標題');
                            const date = prompt('發佈日期 (YYYY-MM-DD)');
                            const url = prompt('相關連結 (如報名表 Google Drive / 官網網址) - 可選:');
                            if(title && date) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'competitions'), { title, date, url: url || '', createdAt: serverTimestamp() });
                          }} className="p-4 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">
                            <Plus size={24}/>
                          </button>
                        </div>
                      )}
                   </div>
                   <div className="space-y-4 relative z-10">
                      {competitions.length === 0 && (
                        <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                          <p className="text-slate-300 font-black">目前暫無公告發佈</p>
                        </div>
                      )}
                      {competitions.sort((a,b)=>b.createdAt?.seconds - a.createdAt?.seconds).map(c => (
                        <div key={c.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white hover:shadow-lg hover:shadow-slate-100 transition-all group">
                           <div className="flex gap-6 items-center flex-1">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-all">
                               <TrophyIcon size={24}/>
                             </div>
                             <div>
                               <p className="font-black text-xl text-slate-800">{c.title}</p>
                               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                 <CalendarIcon size={12}/> {c.date}
                               </div>
                             </div>
                           </div>
                           <div className="flex items-center gap-3 w-full md:w-auto">
                             <button 
                                onClick={() => {
                                    if (c.url) window.open(c.url, '_blank');
                                    else alert('此公告暫無詳細連結');
                                }}
                                className={`flex-1 md:flex-none px-6 py-3 border rounded-xl text-xs font-black transition-all flex items-center gap-2 ${c.url ? 'bg-blue-600 text-white border-transparent hover:bg-blue-700' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600'}`}
                             >
                                <ExternalLink size={14}/> 查看詳情
                             </button>
                             {role === 'admin' && <button onClick={()=>deleteItem('competitions', c.id)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>}
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          )}

          {/* GALLERY TAB */}
          {!viewingStudent && activeTab === 'gallery' && (
            <div className="space-y-10 animate-in fade-in duration-500 font-bold">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6">
                    {currentAlbum ? (<button onClick={() => setCurrentAlbum(null)} className="p-4 bg-slate-100 text-slate-500 hover:text-blue-600 rounded-2xl transition-all"><ArrowLeft size={24}/></button>) : (<div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><ImageIcon/></div>)}
                    <div><h3 className="text-xl font-black">{currentAlbum ? currentAlbum : "精彩花絮 (Gallery)"}</h3><p className="text-xs text-slate-400 mt-1">{currentAlbum ? "瀏覽相簿內容" : "回顧訓練與比賽的珍貴時刻"}</p></div>
                  </div>
                  {role === 'admin' && (<div className="flex items-center gap-3">{isUploading && <span className="text-xs text-blue-600 animate-pulse font-bold">上傳壓縮中...</span>}<button onClick={handleAddMedia} disabled={isUploading} className="bg-orange-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all font-black text-sm disabled:opacity-50"><PlusCircle size={18}/> 新增相片/影片</button></div>)}
               </div>
               {galleryItems.length === 0 ? (<div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><ImageIcon size={40}/></div><p className="text-xl font-black text-slate-400">目前暫無花絮內容</p><p className="text-sm text-slate-300 mt-2">請教練新增精彩相片或影片</p></div>) : (<>{!currentAlbum && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{galleryAlbums.map((album) => (<div key={album.title} onClick={() => setCurrentAlbum(album.title)} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"><div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-6">{album.cover ? (album.type === 'video' ? (<div className="w-full h-full flex items-center justify-center bg-slate-900/5 text-slate-300"><Video size={48}/></div>) : (<img src={album.cover} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="Cover"/>)) : (<div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300"><Folder size={48}/></div>)}<div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-sm">{album.count} 項目</div></div><div className="px-2 pb-2"><h4 className="font-black text-xl text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{album.title}</h4><p className="text-xs text-slate-400 mt-1">點擊查看相簿內容 <ChevronRight size={12} className="inline ml-1"/></p></div></div>))}</div>)}{currentAlbum && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">{galleryItems.filter(item => (item.title || "未分類") === currentAlbum).sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).map(item => (<div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all"><div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-4">{item.type === 'video' ? (getYouTubeEmbedUrl(item.url) ? (<iframe src={getYouTubeEmbedUrl(item.url)} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={item.title}/>) : (<div className="w-full h-full flex items-center justify-center text-slate-400"><Video size={48}/><span className="ml-2 text-xs">影片連結無效</span></div>)) : (<img src={item.url} alt={item.title} onClick={() => setViewingImage(item)} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 cursor-zoom-in"/>)}<div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-none">{item.type === 'video' ? <Video size={12}/> : <ImageIcon size={12}/>}{item.type === 'video' ? 'Video' : 'Photo'}</div></div><div className="px-2"><p className="text-xs text-slate-500 font-bold line-clamp-2">{item.description || "沒有描述"}</p></div>{role === 'admin' && (<div className="mt-6 pt-4 border-t border-slate-50 flex justify-end"><button onClick={() => deleteItem('gallery', item.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button></div>)}</div>))}</div>)}</>)}
            </div>
           )}

          {/* AWARDS TAB */}
          {!viewingStudent && activeTab === 'awards' && (
             <div className="space-y-8 animate-in fade-in duration-500 font-bold">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-6">
                     <div className="p-4 bg-yellow-100 text-yellow-600 rounded-2xl"><Award/></div>
                     <div>
                       <h3 className="text-xl font-black">獎項成就 (Hall of Fame)</h3>
                       <p className="text-xs text-slate-400 mt-1">紀錄校隊輝煌戰績</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
                       <button onClick={() => setAwardsViewMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-sm font-bold transition-all ${awardsViewMode === 'grid' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Columns size={16}/> 榮譽牆</button>
                       <button onClick={() => setAwardsViewMode('timeline')} className={`flex items-center gap-2 px-4 py-2 rounded-[1.2rem] text-sm font-bold transition-all ${awardsViewMode === 'timeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><History size={16}/> 時間軸</button>
                     </div>
                     {role === 'admin' && (
                        <button onClick={handleAddAward} className="bg-yellow-500 text-white p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all font-black"><PlusCircle size={18}/> <span className="hidden sm:inline">新增獎項</span></button>
                     )}
                   </div>
                </div>
                {awards.length === 0 ? (
                  <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center"><div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><Trophy size={40}/></div><p className="text-xl font-black text-slate-400">目前暫無獎項紀錄</p><p className="text-sm text-slate-300 mt-2">請教練新增比賽獲獎紀錄</p></div>
                ) : (
                  <>
                  {awardsViewMode === 'grid' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {awards.map((award) => {
                          const student = students.find(s => s.name === award.studentName);
                          return <AwardCard key={award.id} award={award} student={student} />;
                       })}
                    </div>
                  )}
                  {awardsViewMode === 'timeline' && (
                    <div className="relative pl-8 pr-4">
                      <div className="absolute left-[3.25rem] top-0 h-full w-1 bg-slate-200 rounded-full"></div>
                       {awards.map((award, index) => {
                          const student = students.find(s => s.name === award.studentName);
                          const year = award.date.split('-')[0];
                          const prevYear = index > 0 ? awards[index-1].date.split('-')[0] : null;
                          const showYear = year !== prevYear;
                          return (
                            <div key={award.id} className="relative mb-12 animate-in fade-in slide-in-from-left-8 duration-500">
                              {showYear && (<div className="absolute -left-2 top-0 flex items-center justify-center w-24 h-24 bg-slate-800 text-white font-black text-2xl rounded-full border-8 border-[#F8FAFC] z-10">{year}</div>)}
                              <div className={`ml-20 md:ml-40 pl-10 pt-2 ${showYear ? 'mt-8' : ''}`}><AwardCard award={award} student={student} /></div>
                            </div>
                          );
                       })}
                    </div>
                  )}
                  </>
                )}
             </div>
            )}

          {/* LEAGUE TAB */}
          {!viewingStudent && activeTab === 'league' && (role === 'admin' || role === 'student') && (
              <div className="space-y-10 animate-in fade-in duration-500 font-bold">
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                          <div>
                              <h3 className="text-4xl font-black mb-2">🗓️ 聯賽專區</h3>
                              <p className="text-slate-400">查看賽程、賽果及歷史賽事</p>
                          </div>
                           <div className="flex w-full md:w-auto items-center gap-3">
                               <select value={selectedTournament} onChange={(e) => setSelectedTournament(e.target.value)} className="flex-grow w-full md:w-72 bg-slate-50 border-none outline-none pl-6 pr-10 py-4 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner">
                                   {tournamentList.length === 0 ? <option value="">暫無賽事</option> : tournamentList.map(t => <option key={t} value={t}>{t}</option>)}
                               </select>
                               {role === 'admin' && (
                                <div className="flex gap-2">
                                  <button onClick={() => setShowTournamentModal(true)} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all" title="建立新賽事"><Plus size={20}/></button>
                                </div>
                               )}
                           </div>
                      </div>
                      
                      {role === 'student' && myTournamentStats && (
                        <div className="mb-10 p-8 bg-blue-50 border-2 border-blue-100 rounded-3xl">
                          <h4 className="text-xl font-black text-blue-800 mb-6">我的個人戰績 ({selectedTournament})</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><p className="text-3xl font-black text-blue-600">{myTournamentStats.played}</p><p className="text-xs font-bold text-slate-400">已賽</p></div>
                            <div><p className="text-3xl font-black text-emerald-600">{myTournamentStats.wins}</p><p className="text-xs font-bold text-slate-400">勝</p></div>
                            <div><p className="text-3xl font-black text-rose-600">{myTournamentStats.losses}</p><p className="text-xs font-bold text-slate-400">負</p></div>
                            <div><p className="text-3xl font-black text-slate-600">{myTournamentStats.leaguePoints}</p><p className="text-xs font-bold text-slate-400">積分</p></div>
                          </div>
                          {myUpcomingMatches.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-blue-200">
                               <h5 className="font-bold text-sm text-blue-800 mb-2">你即將到來的比賽：</h5>
                               {myUpcomingMatches.map(match => (
                                   <div key={match.id} className="text-xs text-slate-600">
                                       <span>{match.date} {match.time} vs <strong>{match.player1Id === currentUserInfo.id ? match.player2Name : match.player1Name}</strong></span>
                                   </div>
                               ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {Object.keys(groupedMatches).length === 0 ? (
                        <div className="text-center py-20 text-slate-300 font-bold bg-slate-50/50 rounded-2xl">
                          {leagueMatches.length > 0 ? '請從上方選擇一個賽事' : '暫無任何賽事，請教練建立新賽事。'}
                        </div>
                      ) : (
                        Object.keys(groupedMatches).map(groupName => (
                            <div key={groupName} className="mb-10">
                                <h4 className="text-2xl font-black text-slate-600 mb-4 pl-2">{groupName}</h4>
                                <div className="overflow-x-auto bg-slate-50/50 p-2 md:p-6 rounded-3xl border">
                                    {tournamentStandings[groupName] && (
                                      <table className="w-full text-left mb-4">
                                        <thead className="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                                          <tr>
                                            <th className="px-4 py-3">排名</th>
                                            <th className="px-4 py-3">球員</th>
                                            <th className="px-4 py-3 text-center">已賽</th>
                                            <th className="px-4 py-3 text-center">勝</th>
                                            <th className="px-4 py-3 text-center">負</th>
                                            <th className="px-4 py-3 text-center">分差</th>
                                            <th className="px-4 py-3 text-center">積分</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/50">
                                          {tournamentStandings[groupName]?.map((player, index) => (
                                            <tr key={player.id} className="font-bold">
                                              <td className="px-4 py-3 text-center">{index + 1}</td>
                                              <td className="px-4 py-3 text-slate-800">{player.name}</td>
                                              <td className="px-4 py-3 text-center text-slate-500">{player.played}</td>
                                              <td className="px-4 py-3 text-center text-emerald-500">{player.wins}</td>
                                              <td className="px-4 py-3 text-center text-rose-500">{player.losses}</td>
                                              <td className="px-4 py-3 text-center font-mono">{player.pointsDiff > 0 ? `+${player.pointsDiff}` : player.pointsDiff}</td>
                                              <td className="px-4 py-3 text-center font-mono text-blue-600 text-lg">{player.leaguePoints}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )}

                                    <table className="w-full text-left mt-6">
                                        <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black">
                                            <tr>
                                                <th className="px-6 py-4">日期 / 地點</th>
                                                <th className="px-6 py-4">對賽球員</th>
                                                <th className="px-6 py-4 text-center">比分</th>
                                                <th className="px-6 py-4 text-center">狀態</th>
                                                {role === 'admin' && <th className="px-6 py-4 text-center">操作</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/50">
                                            {groupedMatches[groupName].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(match => (
                                                <tr key={match.id} className={`transition-all ${match.status === 'completed' ? 'text-slate-400' : 'hover:bg-white/50'}`}>
                                                    <td className="px-6 py-5">
                                                        <div className="font-bold text-slate-800">{match.date} <span className="font-mono text-sm">{match.time}</span></div>
                                                        <div className="text-xs">{match.venue}</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`font-black text-base ${match.winnerId === match.player1Id ? 'text-blue-600' : 'text-slate-800'}`}>{match.player1Name}</div>
                                                            <Swords size={14} className="text-slate-300"/>
                                                            <div className={`font-black text-base ${match.winnerId === match.player2Id ? 'text-blue-600' : 'text-slate-800'}`}>{match.player2Name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        {match.status === 'completed' ? (
                                                            <span className="font-mono font-black text-2xl text-slate-800">{match.matchType === 'external' ? match.externalMatchScore : `${match.score1} : ${match.score2}`}</span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        {match.status === 'completed' ? (
                                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-200">已完賽</span>
                                                        ) : (
                                                            <span className="px-3 py-1 bg-yellow-100 text-yellow-600 text-[10px] font-black rounded-full border border-yellow-200">待開賽</span>
                                                        )}
                                                    </td>
                                                    {role === 'admin' && (
                                                      <td className="px-6 py-5 text-center">
                                                          <div className="flex justify-center gap-2">
                                                              {match.status === 'scheduled' && match.matchType !== 'external' && (
                                                                  <>
                                                                    <button onClick={() => handleUpdateLeagueMatchScore(match)} className="p-3 bg-white text-blue-600 rounded-xl border hover:bg-blue-600 hover:text-white transition-all" title="輸入比分"><FileText size={16}/></button>
                                                                    <button onClick={() => handleEditLeagueMatch(match)} className="p-3 bg-white text-gray-600 rounded-xl border hover:bg-gray-600 hover:text-white transition-all" title="編輯比賽"><Pencil size={16}/></button>
                                                                  </>
                                                              )}
                                                              <button onClick={() => deleteItem('league_matches', match.id)} className="p-3 bg-white text-red-500 rounded-xl border hover:bg-red-600 hover:text-white transition-all" title="刪除比賽"><Trash2 size={16}/></button>
                                                          </div>
                                                      </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                      )}
                  </div>
              </div>
           )}

          {/* EXTERNAL MATCHES TAB */}
          {!viewingStudent && activeTab === 'externalMatches' && role === 'admin' && (
              <div className="max-w-2xl mx-auto space-y-10 animate-in fade-in duration-500 font-bold">
                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-3xl font-black mb-2 text-center">新增校外賽記錄</h3>
                   <p className="text-center text-slate-400 mb-10">請在此逐一記錄每場校外賽的賽果。</p>
                   <div className="space-y-6">
                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">1. 選擇賽事</label>
                        <select value={newExternalMatch.tournamentName} onChange={e => setNewExternalMatch({...newExternalMatch, tournamentName: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none">
                          <option value="" disabled>-- 請選擇一個已匯入的賽事 --</option>
                          {externalTournaments.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                        <p className="text-xs text-slate-400 mt-2 px-2">如清單中沒有所需賽事，請先到「系統設定」頁面匯入。</p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">2. 比賽日期</label>
                        <input type="date" value={newExternalMatch.date} onChange={e => setNewExternalMatch({...newExternalMatch, date: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none"/>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">3. 我方隊員</label>
                        <select value={newExternalMatch.player1Id} onChange={e => setNewExternalMatch({...newExternalMatch, player1Id: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none">
                          <option value="" disabled>-- 請選擇一位隊員 --</option>
                          {students.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-bold text-slate-500 mb-2 block">4. 對手學校 (可選)</label>
                          <input type="text" value={newExternalMatch.opponentSchool} onChange={e => setNewExternalMatch({...newExternalMatch, opponentSchool: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none" placeholder="例如: 喇沙書院"/>
                        </div>
                        <div>
                          <label className="text-sm font-bold text-slate-500 mb-2 block">5. 對手球員 (可選)</label>
                          <input type="text" value={newExternalMatch.opponentPlayerName} onChange={e => setNewExternalMatch({...newExternalMatch, opponentPlayerName: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none" placeholder="例如: 王小虎"/>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">6. 賽果 (文字)</label>
                        <input type="text" value={newExternalMatch.externalMatchScore} onChange={e => setNewExternalMatch({...newExternalMatch, externalMatchScore: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none" placeholder="例如: 2-1"/>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-slate-500 mb-2 block">7. 本場結果</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setNewExternalMatch({...newExternalMatch, isWin: true})} className={`p-4 rounded-2xl text-lg font-black transition-all ${newExternalMatch.isWin === true ? 'bg-emerald-500 text-white ring-4 ring-emerald-200' : 'bg-slate-100 hover:bg-slate-200'}`}>勝利</button>
                            <button onClick={() => setNewExternalMatch({...newExternalMatch, isWin: false})} className={`p-4 rounded-2xl text-lg font-black transition-all ${newExternalMatch.isWin === false ? 'bg-rose-500 text-white ring-4 ring-rose-200' : 'bg-slate-100 hover:bg-slate-200'}`}>落敗</button>
                        </div>
                      </div>
                      <div className="pt-6 border-t">
                        <button onClick={handleSaveExternalMatch} disabled={isUpdating} className="w-full flex items-center justify-center gap-3 py-5 bg-blue-600 text-white font-black text-xl rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">{isUpdating ? <Loader2 className="animate-spin" /> : <Save />} 儲存賽果</button>
                      </div>
                   </div>
                 </div>
              </div>
            )}

          {/* SETTINGS TAB */}
          {!viewingStudent && activeTab === 'settings' && role === 'admin' && (
             <div className="max-w-4xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-3xl font-black mb-10 text-center">系統偏好設定</h3>
                   <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">管理員存取密碼</label>
                        <div className="relative">
                           <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                           <input type="password" value={systemConfig.adminPassword} onChange={(e)=>setSystemConfig({...systemConfig, adminPassword: e.target.value})} className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white p-5 pl-14 rounded-2xl outline-none transition-all"/>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">數據導入編碼</label>
                        <select value={importEncoding} onChange={(e)=>setImportEncoding(e.target.value)} className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-black cursor-pointer appearance-none shadow-inner">
                          <option value="AUTO">自動偵測 (推薦)</option>
                          <option value="UTF8">萬用編碼 (UTF-8)</option>
                          <option value="BIG5">繁體中文 (BIG5 - Excel 常用)</option>
                        </select>
                      </div>
                     <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">系統外觀主題</label>
                        <select 
                          value={systemConfig.theme || 'default'} 
                          onChange={(e) => setSystemConfig({...systemConfig, theme: e.target.value})}
                          className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-black cursor-pointer appearance-none shadow-inner"
                          style={{ color: 'var(--theme-text-primary)', backgroundColor: 'var(--theme-bg-card)' }}
                        >
                          <option value="default">預設 (專業藍)</option>
                          <option value="championship-gold">冠軍金 (黑金)</option>
                          <option value="fresh-green">清新綠 (活力)</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">學校校徽 (School Logo)</label>
                        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative" onClick={() => document.getElementById('logoInput').click()}>
                           {systemConfig.schoolLogo ? (<img src={systemConfig.schoolLogo} className="h-32 object-contain" alt="Current Logo"/>) : (<div className="text-slate-300 flex flex-col items-center"><ImageIcon size={48} className="mb-2"/><span className="text-xs font-bold">點擊上傳校徽圖片</span></div>)}
                           <input id="logoInput" type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => { const file = e.target.files[0]; if(file) { if(file.size > 1024 * 1024) { alert('圖片太大，請使用小於 1MB 的圖片'); return; } const reader = new FileReader(); reader.onload = (ev) => setSystemConfig({...systemConfig, schoolLogo: ev.target.result}); reader.readAsDataURL(file); } }}/>
                           {systemConfig.schoolLogo && (<button onClick={(e) => { e.stopPropagation(); setSystemConfig({...systemConfig, schoolLogo: null}); }} className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50"><Trash2 size={16}/></button>)}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold px-2">建議使用背景透明的 PNG 圖片，檔案大小請小於 1MB 以確保讀取速度。</p>
                      </div>
                   </div>
                 </div>

                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-2xl font-black mb-4">校外賽事名稱管理</h3>
                   <p className="text-slate-400 mb-8">您可以在此批量匯入官方的賽事名稱，以便在「校外賽管理」頁面中快速選取。</p>
                   <div className="flex flex-col sm:flex-row gap-4 items-center">
                     <label className="flex-1 w-full bg-blue-600 text-white px-10 py-5 rounded-[2rem] cursor-pointer hover:bg-blue-700 shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"><Upload size={20}/> 批量匯入賽事名稱 (CSV)<input type="file" className="hidden" accept=".csv" onChange={handleCSVImportExternalTournaments}/></label>
                     <button onClick={() => { const name = prompt('請輸入單一賽事名稱:'); if (name) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'external_tournaments'), { name, timestamp: serverTimestamp() }); }} className="w-full sm:w-auto p-5 bg-slate-50 text-slate-500 border rounded-[2rem] hover:text-blue-600 transition-all flex items-center justify-center gap-2" title="新增單一賽事"><Plus size={24}/> 新增單一</button>
                   </div>
                   <div className="mt-8">
                     <h4 className="font-bold text-slate-500 mb-2">目前已匯入的賽事列表:</h4>
                     <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-2xl p-4 space-y-2 border">
                       {externalTournaments.length > 0 ? externalTournaments.map(t => (
                         <div key={t.id} className="flex justify-between items-center bg-white p-2 rounded-lg">
                           <span className="text-sm font-semibold text-slate-700">{t.name}</span>
                           <button onClick={() => deleteItem('external_tournaments', t.id)} className="p-1 text-slate-300 hover:text-red-500"><Trash2 size={14}/></button>
                         </div>
                       )) : <p className="text-sm text-center text-slate-400 p-4">暫無賽事</p>}
                     </div>
                   </div>
                 </div>

                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100 mb-6">
                       <h4 className="text-orange-600 font-black mb-2 flex items-center gap-2"><History/> 新賽季重置</h4>
                       <p className="text-xs text-slate-400 mb-4">將所有學員積分重置為該章別的起步底分 (金:200, 銀:100...)。</p>
                       <button onClick={handleSeasonReset} className="w-full bg-white text-orange-600 border-2 border-orange-200 py-3 rounded-2xl font-black hover:bg-orange-600 hover:text-white transition-all">重置積分 (開啟新賽季)</button>
                    </div>
                    <button onClick={async ()=>{ setIsUpdating(true); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), systemConfig); setIsUpdating(false); alert('系統設定已更新！'); }} className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]">
                      <Save size={24}/> 保存設定
                    </button>
                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-4 mt-6">
                      <Info className="text-blue-500 shrink-0" size={20}/>
                      <p className="text-[10px] text-slate-400 font-bold leading-relaxed">修改密碼後請妥善保存，否則將無法進入教練後台。系統預設密碼為 "admin"。</p>
                    </div>
                 </div>
                 <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">Copyright © 2026 正覺壁球. All Rights Reserved.</div>
             </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
