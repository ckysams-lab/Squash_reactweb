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
  } else {
     document.body.innerText = "Application failed to load. Please contact the administrator.";
  }
}

const localizer = momentLocalizer(moment);
const appId = 'bcklas-squash-core-v1'; 
const ACHIEVEMENT_DATA = {
  'ice-breaker': { name: '破蛋者', desc: '首次在內部聯賽中獲勝', icon: <Zap size={24} /> },
  'giant-killer': { name: '巨人殺手', desc: '戰勝比自己排名高10位以上的對手', icon: <ShieldIcon size={24} /> },
  'first-participation': { name: '賽場新星', desc: '首次代表學校參加校外賽', icon: <Star size={24} /> },
  'first-win-ext': { name: '首戰告捷', desc: '首次在校外賽中勝出一場', icon: <Rocket size={24} /> },
  'first-bronze': { name: '銅級榮譽', desc: '首次贏得校外賽季軍或殿軍', icon: <Medal size={24} className="text-orange-500" /> },
  'first-silver': { name: '銀級榮譽', desc: '首次贏得校外賽亞軍', icon: <Medal size={24} className="text-slate-500" /> },
  'first-gold': { name: '金級榮譽', desc: '首次贏得校外賽冠軍', icon: <Medal size={24} className="text-yellow-500" /> },
  'perfect-attendance': { name: '全勤小蜜蜂', desc: '訓練全勤，風雨不改', icon: <Sun size={24} /> },
  'diligent-practice': { name: '勤奮練習', desc: '訓練態度認真，值得嘉許', icon: <Coffee size={24} /> },
  'team-spirit': { name: '團隊精神', desc: '具備體育精神，樂於助人', icon: <Heart size={24} /> },
  'mvp': { name: '年度 MVP', desc: '賽季積分榜第一名', icon: <Crown size={24} /> },
  'top-three': { name: '年度三甲', desc: '賽季積分榜前三名', icon: <TrophyIcon size={24} /> },
  'elite-player': { name: '年度壁球精英', desc: '賽季積分榜前八名', icon: <Sparkles size={24} /> },
};

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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth(); 
    if (month >= 8) { 
        return `${year}-${(year + 1).toString().slice(-2)}`;
    } else { 
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
  const [assessments, setAssessments] = useState([]); 
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

  const [systemConfig, setSystemConfig] = useState({ 
    adminPassword: 'admin', 
    announcements: [],
    seasonalTheme: 'default',
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

  const [newExternalMatch, setNewExternalMatch] = useState({
    tournamentName: '',
    date: new Date().toISOString().split('T')[0],
    player1Id: '',
    opponentSchool: '',
    opponentPlayerName: '',
    externalMatchScore: '',
    isWin: null,
  });

  const [newAssessment, setNewAssessment] = useState({
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
    if (!user) return;
    
    try {
      const listeners = [];
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      const attendanceLogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs');
      const competitionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
      const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
      const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles');
      const galleryRef = collection(db, 'artifacts', appId, 'public', 'data', 'gallery'); 
      const awardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'awards');
      const achievementsRef = collection(db, 'artifacts', appId, 'public', 'data', 'achievements');
      const leagueMatchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'league_matches');
      const externalTournamentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'external_tournaments');
      const monthlyStarsRef = collection(db, 'artifacts', appId, 'public', 'data', 'monthly_stars');
      const assessmentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'assessments');
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
      
      listeners.push(onSnapshot(studentsRef, (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(attendanceLogsRef, (snap) => setAttendanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(competitionsRef, (snap) => setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(schedulesRef, (snap) => setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(filesRef, (snap) => setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(galleryRef, (snap) => setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(awardsRef, orderBy("date", "desc")), (snap) => setAwards(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(achievementsRef, orderBy("timestamp", "desc")), (snap) => setAchievements(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(leagueMatchesRef, orderBy("date", "desc")), (snap) => setLeagueMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(externalTournamentsRef, orderBy("name", "asc")), (snap) => setExternalTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(monthlyStarsRef, orderBy("month", "desc")), (snap) => setMonthlyStars(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(assessmentsRef, orderBy("date", "desc")), (snap) => setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() })))));

      return () => listeners.forEach(unsub => unsub());

    } catch (e) {
      console.error("Firestore Init Error:", e);
    }
  }, [user]);

  const awardAchievement = async (badgeId, studentId) => {
    if (!badgeId || !studentId) return;
    const alreadyHasBadge = achievements.some(ach => ach.studentId === studentId && ach.badgeId === badgeId);
    if (alreadyHasBadge) {
      alert("該學員已擁有此徽章，無需重複授予。");
      return;
    }
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'achievements'), {
        studentId,
        badgeId,
        timestamp: serverTimestamp()
      });
      const student = students.find(s => s.id === studentId);
      const badge = ACHIEVEMENT_DATA[badgeId];
      alert(`✅ 成功授予 ${student?.name || '學員'} 「${badge.name}」 徽章！`);
    } catch (e) {
      console.error("Failed to award achievement:", e);
      alert("授予失敗，請檢查網絡連線。");
    }
  };

  const handleManualAward = (student) => {
    const allBadges = Object.entries(ACHIEVEMENT_DATA);
    let promptMsg = `請為 ${student.name} 選擇要授予的徽章 (輸入代號):\n\n`;
    allBadges.forEach(([id, data], index) => {
        promptMsg += `${index + 1}. ${data.name}\n`;
    });
    const choice = prompt(promptMsg);
    if (choice && !isNaN(choice)) {
        const selectedIndex = parseInt(choice, 10) - 1;
        if (selectedIndex >= 0 && selectedIndex < allBadges.length) {
            const [badgeId, badgeData] = allBadges[selectedIndex];
            if (confirm(`確定要授予 ${student.name} 「${badgeData.name}」徽章嗎？`)) {
                awardAchievement(badgeId, student.id);
            }
        } else {
            alert("無效的選擇。");
        }
    }
  };

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
            timestamp: serverTimestamp() 
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
            timestamp: serverTimestamp() 
          });
        }
      });
      await batch.commit();
      alert('隊員名單更新成功！');
    } catch (err) { alert('匯入失敗'); }
    setIsUpdating(false);
    e.target.value = null;
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
        setActiveTab('competitions');
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
    return [...students] 
    .map(s => ({ 
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

  const handleSetupStudentAuth = async (student) => {
    if (!student.class || !student.classNo) {
        alert(`錯誤：學生 ${student.name} 的班別或班號為空，無法設定登入資料。`);
        return;
    }
    const authEmail = `${student.class.toLowerCase().trim()}${student.classNo.trim()}@bcklas.squash`;
    const currentAuthEmail = student.authEmail || '尚未設定';
    const confirmMsg = `即將為學生 ${student.name} (${student.class} ${student.classNo}) 設定或更新登入識別碼。\n\n` +
                     `舊識別碼: ${currentAuthEmail}\n` +
                     `新識別碼: ${authEmail}\n\n` +
                     `確認後，請手動前往 Firebase 後台，使用「${authEmail}」為該學生建立帳戶並設定密碼。\n\n` +
                     `確定要更新嗎？`;
    if (confirm(confirmMsg)) {
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), {
                authEmail: authEmail,
                lastUpdated: serverTimestamp()
            });
            alert(`✅ 設定成功！\n\n學生 ${student.name} 的登入識別碼已更新為：\n${authEmail}\n\n下一步：請到 Firebase Authentication 後台使用此電郵建立用戶。`);
        } catch (e) {
            console.error("Setup Auth Email failed", e);
            alert("更新失敗，請檢查網絡或聯絡管理員。");
        }
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
    if(filteredMatches.length === 0) return {};
    const groups = {};
    filteredMatches.forEach(match => {
        const groupKey = match.groupName || '所有比賽';
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(match);
    });
    const sortedGroups = Object.keys(groups).sort((a, b) => {
        if (a === '所有比賽') return -1;
        if (b === '所有比賽') return 1;
        return a.localeCompare(b);
    });

    const result = {};
    sortedGroups.forEach(key => {
        result[key] = groups[key];
    })
    return result;
  }, [filteredMatches]);

  useEffect(() => {
    if (tournamentList.length > 0 && !selectedTournament) {
      setSelectedTournament(tournamentList[0]);
    }
  }, [tournamentList, selectedTournament]);

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

  const playerDashboardData = useMemo(() => {
        if (!viewingStudent) return null;

        const studentMatches = leagueMatches.filter(m => m.player1Id === viewingStudent.id || m.player2Id === viewingStudent.id);
        const completedMatches = studentMatches.filter(m => m.status === 'completed');
        const studentAttendance = attendanceLogs.filter(log => log.studentId === viewingStudent.id);
        const studentAchievements = achievements.filter(ach => ach.studentId === viewingStudent.id);

        const wins = completedMatches.filter(m => m.winnerId === viewingStudent.id).length;
        const totalPlayed = completedMatches.length;
        const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;

        const totalScheduledSessions = schedules.filter(s => viewingStudent.squashClass && s.trainingClass === viewingStudent.squashClass).length;
        const attendedSessions = new Set(studentAttendance.map(log => log.date)).size;
        const attendanceRate = totalScheduledSessions > 0 ? Math.round((attendedSessions / totalScheduledSessions) * 100) : 0;

        let currentPoints = BADGE_DATA[viewingStudent.badge]?.basePoints || 0;
        const dynamicPointsHistory = [{ 
            date: viewingStudent.createdAt?.toDate ? viewingStudent.createdAt.toDate().toISOString().split('T')[0] : '初始', 
            points: currentPoints 
        }];

        completedMatches
            .sort((a,b) => a.date.localeCompare(b.date))
            .forEach(match => {
                if (match.winnerId === viewingStudent.id && match.matchType !== 'external') {
                    const winnerRank = rankedStudents.findIndex(s => s.id === match.winnerId) + 1;
                    const loserRank = rankedStudents.findIndex(s => s.id === (match.winnerId === match.player1Id ? match.player2Id : match.player1Id)) + 1;
                    const isGiantKiller = winnerRank > 0 && loserRank > 0 && (winnerRank - loserRank) >= 5;
                    const pointsToAdd = isGiantKiller ? 20 : 10;
                    currentPoints += pointsToAdd;
                    dynamicPointsHistory.push({ date: match.date, points: currentPoints });
                }
        });

        const studentAssessments = assessments.filter(a => a.studentId === viewingStudent.id).sort((a, b) => b.date.localeCompare(a.date));
        const latestAssessment = studentAssessments.length > 0 ? studentAssessments[0] : null;
        
        let radarData = [];
        if (latestAssessment) {
            const calcScore = (val, max) => Math.min(10, Math.max(1, Math.round((val / max) * 10)));
            radarData = [
                { subject: '體能 (折返跑)', A: calcScore(latestAssessment.shuttleRun, 25), fullMark: 10 }, 
                { subject: '力量 (仰臥/握力)', A: calcScore((latestAssessment.situps + latestAssessment.gripStrength)/2, 50), fullMark: 10 },
                { subject: '柔軟度', A: calcScore(latestAssessment.flexibility, 40), fullMark: 10 },
                { subject: '正手技術', A: calcScore((latestAssessment.fhDrive + latestAssessment.fhVolley)/2, 50), fullMark: 10 },
                { subject: '反手技術', A: calcScore((latestAssessment.bhDrive + latestAssessment.bhVolley)/2, 50), fullMark: 10 },
            ];
        }

        const recentMatches = studentMatches
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);

        return {
            winRate,
            wins,
            totalPlayed,
            attendanceRate,
            attendedSessions,
            totalScheduledSessions,
            pointsHistory: dynamicPointsHistory,
            recentMatches,
            latestAssessment,
            radarData,
            achievements: [...new Set(studentAchievements.map(ach => ach.badgeId))]
        };
  }, [viewingStudent, leagueMatches, attendanceLogs, schedules, achievements, rankedStudents, assessments]);

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

  const handleAddAward = async () => {
    const title = prompt("獎項名稱 (例如：全港學界壁球賽 冠軍):");
    if (!title) return;
    const studentName = prompt("獲獎學生姓名:");
    if (!studentName) return;
    const date = prompt("獲獎日期 (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    const rank = prompt("名次 (例如：冠軍, 亞軍, 季軍, 優異):");
    const photoUrl = prompt("得獎照片網址 (可選，空白則使用預設圖):"); 
    const desc = prompt("備註 (可選):") || "";
    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'awards'), {
            title,
            studentName,
            date,
            rank,
            photoUrl: photoUrl || "", 
            description: desc,
            timestamp: serverTimestamp()
        });
        alert('🏆 獎項新增成功！');
    } catch (e) {
        console.error(e);
        alert('新增失敗');
    }
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
      const displayStudentChar = student?.name?.[0] || award.studentName?.[0] || '🏆';

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
                              {displayStudentChar}
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

  const PlayerDashboard = ({ student, data, onClose }) => {
    if (!student || !data) return null;

    return (
        <div className="animate-in fade-in duration-500 font-bold">
            <div className="flex items-center gap-6 mb-10">
                <button onClick={onClose} className="p-4 bg-white text-slate-500 hover:text-blue-600 rounded-2xl transition-all border shadow-sm">
                    <ArrowLeft size={24}/>
                </button>
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
                        {data.achievements.length > 0 ? data.achievements.map(badgeId => {
                            const badge = ACHIEVEMENT_DATA[badgeId];
                            if (!badge) return null;
                            return (
                                <div key={badgeId} className="group relative flex flex-col items-center justify-center text-center p-2" title={badge.desc}>
                                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-md border group-hover:scale-110 transition-transform">
                                        {badge.icon}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-600 mt-2 truncate w-full">{badge.name}</p>
                                </div>
                            );
                        }) : <p className="col-span-full text-center text-xs text-slate-400 py-4">還沒有獲得任何徽章。</p>}
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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="mb-8 animate-pulse"><SchoolLogo size={96} /></div>
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-bold animate-pulse">正在連接 BCKLAS 資料庫...</p>
      <p className="text-xs text-slate-300 mt-2 font-mono">v{CURRENT_VERSION}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* ...All modals and other hidden elements... */}

      <aside> {/* ... Sidebar JSX (unchanged) ... */} </aside>

      <main className="flex-1 h-screen overflow-y-auto relative bg-[#F8FAFC]">
        <header> {/* ... Header JSX (unchanged) ... */} </header>

        <div className="p-10 max-w-7xl mx-auto pb-40">
          
          {showPlayerCard && (<PlayerCardModal student={showPlayerCard} onClose={() => setShowPlayerCard(null)} />)}
          {selectedSchedule && (<div>...</div>)}
          {viewingStudent && (<PlayerDashboard student={viewingStudent} data={playerDashboardData} onClose={() => setViewingStudent(null)} />)}
          
          {/* Main Content Area */}
          {!viewingStudent && activeTab === 'dashboard' && ( /* ...dashboard content... */ )}
          {!viewingStudent && activeTab === 'rankings' && ( /* ...rankings content... */ )}
          {!viewingStudent && activeTab === 'students' && role === 'admin' && ( /* ...students content... */ )}
          {!viewingStudent && activeTab === 'monthlyStarsAdmin' && role === 'admin' && ( /* ...monthlyStarsAdmin content... */ )}
          {!viewingStudent && activeTab === 'monthlyStars' && ( /* ...monthlyStars content... */ )}
          {!viewingStudent && activeTab === 'assessments' && role === 'admin' && ( /* ...assessments content... */ )}
          {!viewingStudent && activeTab === 'schedules' && ( /* ...schedules content... */ )}
          {!viewingStudent && activeTab === 'attendance' && role === 'admin' && ( /* ...attendance content... */ )}
          {!viewingStudent && activeTab === 'financial' && role === 'admin' && ( /* ...financial content... */ )}
          {!viewingStudent && activeTab === 'competitions' && ( /* ...competitions content... */ )}
          {!viewingStudent && activeTab === 'gallery' && ( /* ...gallery content... */ )}
          {!viewingStudent && activeTab === 'awards' && ( /* ...awards content... */ )}
          {!viewingStudent && activeTab === 'externalMatches' && role === 'admin' && ( /* ...externalMatches content... */ )}
          {!viewingStudent && activeTab === 'league' && (role === 'admin' || role === 'student') && ( /* ...league content... */ )}
          {!viewingStudent && activeTab === 'settings' && role === 'admin' && ( /* ...settings content... */ )}
        </div>
      </main>
      
      {activeTab === 'attendance' && pendingAttendance.length > 0 && role === 'admin' && (
        <div className="fixed bottom-12 right-12 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button onClick={savePendingAttendance} disabled={isUpdating} className="flex items-center gap-4 px-8 py-5 bg-blue-600 text-white rounded-[2rem] shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all text-lg font-black disabled:opacity-50">
            <Save size={24} />
            <span>儲存 {pendingAttendance.length} 筆點名紀錄</span>
            {isUpdating && <Loader2 className="animate-spin" size={20} />}
          </button>
        </div>
      )}
    </div>
  );
}

