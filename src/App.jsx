import { ACHIEVEMENT_DATA, BADGE_DATA } from './constants/data';
import TacticalBoardModal from './components/TacticalBoardModal';
import UmpirePanelModal from './components/UmpirePanelModal';
import PlayerCardModal from './components/PlayerCardModal';
import BadgeInfoModal from './components/BadgeInfoModal';
import AddPlayerModal from './components/AddPlayerModal';
import EditPlayerModal from './components/EditPlayerModal';
import PosterGenerator from './components/PosterGenerator';
import AddAwardModal from './components/AddAwardModal';
import AddTournamentModal from './components/AddTournamentModal';
import LoginScreen from './components/LoginScreen';
import MonthlyStarsPage from './pages/MonthlyStarsPage';
import DashboardPage from './pages/DashboardPage';
import LeaguePage from './pages/LeaguePage';
import RosterPage from './pages/RosterPage';
import CalendarPage from './pages/CalendarPage';
import AwardsPage from './pages/AwardsPage';
import GalleryPage from './pages/GalleryPage';
import AttendancePage from './pages/AttendancePage';
import AssessmentsPage from './pages/AssessmentsPage';
import SettingsPage from './pages/SettingsPage';
import CompetitionsPage from './pages/CompetitionsPage';
import FinancialPage from './pages/FinancialPage';
import PlayerDashboard from './components/PlayerDashboard';
import MyDashboardPage from './pages/MyDashboardPage';
import ExternalMatchesPage from './pages/ExternalMatchesPage';
import { toDataURL, getAcademicYear, readCSVFile, compressImage, getYouTubeEmbedUrl } from './utils/helpers';
import { useFirebaseData } from './hooks/useFirebaseData';
import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
  Activity, ArrowLeft, Award, BookMarked, BookOpen, Bookmark, Cake, Calendar as CalendarIcon, Camera, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardCheck, Clock, Coffee, Columns, Crown, DollarSign, Download, ExternalLink, Eye,
  FileBarChart, FileSpreadsheet, FileText, Filter, Folder, Globe, Heart, History, Hourglass, Image as ImageIcon, Info,
  Key, LayoutDashboard, Layers, Link as LinkIcon, ListChecks, Loader2, Lock, LogIn, LogOut, Mail, MapPin, Medal,
  Megaphone, Menu, MinusCircle, Pencil, Percent, PlayCircle, Plus, PlusCircle, Printer, Rocket, Save, Search, Settings2,
  Shield as ShieldIcon, ShieldCheck, Sparkles, Star, Sun, Swords, Target, Trash2, TrendingUp, Trophy, Trophy as TrophyIcon,
  Upload, User, UserCheck, UserCog, UserPlus, Users, Video, X, Zap
} from 'lucide-react';

import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, deleteDoc, query, orderBy, serverTimestamp, updateDoc, writeBatch, increment, where,
  enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode.react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { db, auth, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from './firebase';

// --- 版本控制 ---
const CURRENT_VERSION = "12.0";

// Calendar Localizer
const localizer = momentLocalizer(moment);
const appId = 'bcklas-squash-core-v1'; 

// 📺 學生/家長端：公開即時大螢幕顯示板 (支援勝負特效)
// ==========================================
const LiveScoreboardDisplay = ({ liveMatches, TrophyIcon }) => {
    if (!liveMatches || !Array.isArray(liveMatches)) return null;
    const activeMatches = liveMatches.filter(m => m.status === 'live');
    if (activeMatches.length === 0) return null;

    return (
        <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                即時比分轉播 (LIVE)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeMatches.map(match => {
                    const isFinished = match.matchWinner !== null;
                    const gamesNeeded = match.bestOf === 3 ? 2 : 3;

                    return (
                    <div key={match.id} className={`bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl border-4 relative overflow-hidden flex flex-col justify-center transition-all duration-1000 ${isFinished ? 'border-yellow-500 scale-[1.02]' : 'border-slate-800'}`}>
                        {!isFinished && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]"></div>}
                        <div className="absolute top-4 left-4 bg-slate-800 text-slate-400 text-[9px] font-black px-2 py-1 rounded border border-slate-700 tracking-widest">
                            {match.format} 分制 / {match.bestOf} 局勝
                        </div>
                        {isFinished && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
                                <div className="w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-500/20 via-slate-900/0 to-transparent animate-spin-slow"></div>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-white relative z-10 mt-6">
                            <div className="flex-1 text-center relative">
                                {match.matchWinner === 1 && TrophyIcon && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><TrophyIcon size={32} fill="currentColor"/></div>}
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Player 1</p>
                                <h4 className={`text-2xl md:text-3xl font-black truncate px-2 mb-4 ${match.matchWinner === 1 ? 'text-yellow-400' : ''}`}>{match.player1}</h4>
                                <div className="flex justify-center items-end gap-2">
                                    <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${match.games1 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>局 {match.games1}</span>
                                    <span className={`text-6xl md:text-8xl font-mono font-black transition-all ${match.server === 1 && !isFinished ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110' : 'text-slate-100'}`}>
                                        {match.score1}
                                    </span>
                                </div>
                                <div className="h-8 mt-6">
                                    {match.server === 1 && !isFinished && (
                                        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 px-4 py-1.5 rounded-full animate-bounce">
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                                            <span className="text-xs font-black tracking-widest">{match.serveSide === 'L' ? '左區發球 (L)' : '右區發球 (R)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="w-px h-32 bg-slate-700/50 mx-4 relative shrink-0">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-800 text-slate-500 text-xs font-black px-2 py-1 rounded-full border border-slate-700">VS</div>
                            </div>

                            <div className="flex-1 text-center relative">
                                {match.matchWinner === 2 && TrophyIcon && <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce"><TrophyIcon size={32} fill="currentColor"/></div>}
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Player 2</p>
                                <h4 className={`text-2xl md:text-3xl font-black truncate px-2 mb-4 ${match.matchWinner === 2 ? 'text-yellow-400' : ''}`}>{match.player2}</h4>
                                <div className="flex justify-center items-end gap-2 flex-row-reverse">
                                    <span className={`text-lg font-bold px-3 py-1 rounded-lg border ${match.games2 === gamesNeeded ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>局 {match.games2}</span>
                                    <span className={`text-6xl md:text-8xl font-mono font-black transition-all ${match.server === 2 && !isFinished ? 'text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] scale-110' : 'text-slate-100'}`}>
                                        {match.score2}
                                    </span>
                                </div>
                                <div className="h-8 mt-6">
                                    {match.server === 2 && !isFinished && (
                                        <div className="inline-flex items-center gap-2 bg-yellow-400/20 border border-yellow-400/50 text-yellow-400 px-4 py-1.5 rounded-full animate-bounce">
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,1)]"></div>
                                            <span className="text-xs font-black tracking-widest">{match.serveSide === 'L' ? '左區發球 (L)' : '右區發球 (R)'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

export default function App() {
  const { students, competitions, monthlyStars, leagueMatches } = useFirebaseData();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [attendanceLogs, setAttendanceLogs] = useState([]); 
  const [schedules, setSchedules] = useState([]); 
  const [liveMatches, setLiveMatches] = useState([]);
  const [showUmpirePanel, setShowUmpirePanel] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [activeLeagueMatch, setActiveLeagueMatch] = useState(null); // 👉 新增這行：記錄正在轉播的聯賽
  const [galleryItems, setGalleryItems] = useState([]);
  const [driveAlbums, setDriveAlbums] = useState([]); // 儲存來自 Google Drive 的相簿
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
    const syncGoogleDriveGallery = async () => {
      setIsSyncingDrive(true);
      try {
          // 👇 把這裡的網址，換成您剛剛在第二階段拿到的 Web App URL 👇
          const gasUrl = "https://script.google.com/macros/s/AKfycby_ynudWf8U11QIpm5SdVJgFvFoOM4yVZzw_b-VrT5f6t2BnVavzYjdDBUMP3JIg91zfw/exec"; 
          
          const response = await fetch(gasUrl);
          const result = await response.json();
          
          if (result.status === 'success') {
              setDriveAlbums(result.data);
              alert("✅ 成功從 Google Drive 同步相簿！");
          } else {
              alert("同步失敗：" + result.message);
          }
      } catch (error) {
          console.error("Drive sync error:", error);
          alert("網路錯誤，無法連接 Google Drive");
      }
      setIsSyncingDrive(false);
  };

  const [awards, setAwards] = useState([]); 
  const [achievements, setAchievements] = useState([]); 
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

  const [tacticalShots, setTacticalShots] = useState([]);
  const [showTacticalBoard, setShowTacticalBoard] = useState(false);
  const [systemConfig, setSystemConfig] = useState({ 
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
        assessments: collection(db, 'artifacts', appId, 'public', 'data', 'assessments'), 
        tactical_shots: collection(db, 'artifacts', appId, 'public', 'data', 'tactical_shots')
      };


      const systemConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');
      const financeConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'finance');

      listeners.push(onSnapshot(systemConfigRef, (docSnap) => {
        if (docSnap.exists()) setSystemConfig(docSnap.data());
        else setDoc(systemConfigRef, { announcements: [], theme: 'default', schoolLogo: null });
      }, (e) => console.error("Config err", e)));

      const liveMatchesRef = collection(db, 'artifacts', appId, 'public', 'data', 'live_matches');
      listeners.push(onSnapshot(liveMatchesRef, (snap) => {
        setLiveMatches(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }));

      listeners.push(onSnapshot(financeConfigRef, (docSnap) => {
        if (docSnap.exists()) setFinanceConfig(prev => ({...prev, ...docSnap.data()}));
        else setDoc(financeConfigRef, financeConfig);
      }, (e) => console.error("Finance err", e)));
      
      listeners.push(onSnapshot(collections.attendance_logs, (snap) => setAttendanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.schedules, (snap) => setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.downloadFiles, (snap) => setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(collections.gallery, (snap) => setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.awards, orderBy("date", "desc")), (snap) => setAwards(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.achievements, orderBy("timestamp", "desc")), (snap) => setAchievements(snap.docs.map(d => ({ id: d.id, ...d.data() }))))); 
      listeners.push(onSnapshot(query(collections.external_tournaments, orderBy("name", "asc")), (snap) => setExternalTournaments(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
      listeners.push(onSnapshot(query(collections.assessments, orderBy("date", "desc")), (snap) => { 
        setAssessments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }));
// [11.3] 新增戰術數據監聽
      listeners.push(onSnapshot(collections.tactical_shots, (snap) => {
        setTacticalShots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    
    // 1. 先處理原本 Firebase 裡的照片
    safeGallery.forEach(item => {
      const title = item.title || "未分類";
      if (!albums[title]) {
        albums[title] = { title, cover: item.url, count: 0, items: [], type: item.type, lastUpdated: item.timestamp?.seconds || 0 };
      }
      albums[title].count += 1;
      albums[title].items.push(item);
      if (item.timestamp?.seconds && item.timestamp.seconds > albums[title].lastUpdated) {
         albums[title].cover = item.url;
         albums[title].lastUpdated = item.timestamp.seconds;
      }
    });

    // 2. 把 Google Drive 抓下來的相簿加進去
    const safeDriveAlbums = Array.isArray(driveAlbums) ? driveAlbums : [];
    safeDriveAlbums.forEach(driveAlbum => {
      // 如果已經有同名的 Firebase 相簿，Drive 會蓋過去或者獨立成一包，這裡當作獨立的新相簿處理
      albums[`[Drive] ${driveAlbum.album}`] = {
         title: driveAlbum.album,
         cover: driveAlbum.cover,
         count: driveAlbum.count,
         items: driveAlbum.photos.map(p => ({ id: p.id, url: p.url, type: 'image', description: p.name })), // 轉換成系統看得懂的格式
         type: 'image',
         lastUpdated: Date.now() / 1000, // Drive 抓下來的預設排在最前面
         isDrive: true // 標記這是 Drive 來的
      };
    });

    return Object.values(albums).sort((a,b) => b.lastUpdated - a.lastUpdated);
  }, [galleryItems, driveAlbums]); // 加上 driveAlbums 作為依賴

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
    };

    const player = students.find(s => s.id === player1Id);
    if (!player) {
      alert('找不到指定的學生資料！');
      return;
    };

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

    // 👉 貼在這裡：請求推播通知並儲存 Token
  const requestNotificationPermission = async (studentData) => {
    // 確保 app 已經初始化，且有找到學生資料才執行
    if (!app || !studentData || !studentData.id) return;

    try {
      const messaging = getMessaging(app);
      // 請求瀏覽器通知權限
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // 替換成您在 Firebase 後台拿到的 VAPID Key
        const currentToken = await getToken(messaging, { 
            vapidKey: 'lr72oncIjjBhzK77g6RLbmCp9IS_JdufjdNWELE0tN4' 
        });
        
        if (currentToken) {
          // 將 Token 寫入該名學生的 Firestore 資料中
          const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', studentData.id);
          await updateDoc(userRef, {
            fcmToken: currentToken,
            lastTokenUpdate: serverTimestamp() // 記錄最後更新時間
          });
          console.log("✅ 推播通知設定成功！Token已儲存。");
        }
      } else {
        console.log("🚫 使用者拒絕了推播通知。");
      }
    } catch (error) {
      console.error("⚠️ 無法獲取推播 Token:", error);
    }
  };

  
  const deleteItem = async (col, id) => {
    if (role !== 'admin') return;
    if (window.confirm('確定要永久刪除這個項目嗎？')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    }
  };

    const handleSetupStudentAuth = async (student) => {
    // 1. 彈出視窗讓教練直接輸入密碼
    const password = prompt(`請為 ${student.name} 設定登入密碼 (最少 6 位數):`);
    if (!password || password.length < 6) {
        alert("密碼無效或太短 (Firebase 規定最少 6 位數)！已取消操作。");
        return;
    }

    // 2. 自動組合專屬信箱格式：班別+班號@bcklas.squash (例如 6a01@bcklas.squash)
    const studentAuthEmail = `${student.class.toLowerCase().trim()}${student.classNo.trim()}@bcklas.squash`;

    setIsUpdating(true);
    try {
        // 3. 【核心技巧】建立一個「暫時的」Firebase實例，避免教練被強制登出
        const tempApp = initializeApp(firebaseConfig, "TempApp");
        const tempAuth = getAuth(tempApp);

        // 4. 在暫時的實例中建立學生帳號
        await createUserWithEmailAndPassword(tempAuth, studentAuthEmail, password);

        // 5. 更新 Firestore 中的學生資料，綁定 authEmail 作為紀錄
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), {
            authEmail: studentAuthEmail,
            lastUpdated: serverTimestamp()
        });

        // 6. 刪除暫時的實例，釋放系統資源
        await deleteApp(tempApp);

        alert(`✅ 成功為 ${student.name} 建立登入帳號！\n\n請通知學生：\n登入班別：${student.class}\n登入學號：${student.classNo}\n登入密碼：${password}`);
    } catch (error) {
        console.error("建立學生帳號失敗:", error);
        if (error.code === 'auth/email-already-in-use') {
            alert(`建立失敗：這個帳號 (${studentAuthEmail}) 已經被註冊過了！\n如需重設密碼，目前仍需透過 Firebase 後台操作。`);
        } else {
            alert(`建立帳號發生錯誤: ${error.message}`);
        }
    }
    setIsUpdating(false);
  };

  const handleLogin = async (type, credentials) => {
    if (type === 'admin') {
      const { email, password } = credentials;
      if (!email || !password) {
        alert('請輸入教練電郵和密碼');
        return;
      }
      try {
        await signInWithEmailAndPassword(auth, email, password);
        setRole('admin'); 
        setShowLoginModal(false); 
        setActiveTab('dashboard');
      } catch (error) {
        console.error("Admin Login failed", error);
        alert('登入失敗：' + error.message + '\n(請確認教練帳號密碼是否正確)');
      }
    } else {
      const { classStr, classNo, password } = credentials;
      if (!classStr || !classNo || !password) {
        alert('請輸入班別、班號和密碼');
        return;
      }
      
      const studentAuthEmail = `${classStr.toLowerCase().trim()}${classNo.trim()}@bcklas.squash`;

      try {
        await signInWithEmailAndPassword(auth, studentAuthEmail, password);
        const matchedStudent = students.find(s => s.authEmail === studentAuthEmail);
        
        if (matchedStudent) {
            setCurrentUserInfo(matchedStudent);
            requestNotificationPermission(matchedStudent);
        } else {
            setCurrentUserInfo({ name: '同學', authEmail: studentAuthEmail });
        }
        setRole('student'); 
        setShowLoginModal(false); 
        setActiveTab('myDashboard');
      } catch (error) {
        console.error("Student Login failed", error);
        alert('登入失敗：\n(請確認班別、班號和密碼是否正確)');
      }
    }
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

    // --- 新增：為比賽打氣 (Team Cheers) ---
    const handleCheerMatch = async (matchId, e) => {
        e.stopPropagation(); // 防止點擊按鈕時觸發外層的點擊事件
        // 如果沒有登入（防呆），就不給點
        if (!currentUserInfo && role !== 'admin') {
            alert("請先登入才能為隊友打氣喔！");
            return;
        }

        // 使用學生ID或教練身分作為唯一識別碼，防止狂點
        const userId = currentUserInfo?.id || 'admin';
        const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', matchId);

        try {
            // 從目前的比賽列表中找到這場比賽
            const currentMatch = leagueMatches.find(m => m.id === matchId);
            const currentCheers = currentMatch?.cheers || [];

            // 如果這個人已經打過氣了，就幫他取消 (收回 🔥)
            if (currentCheers.includes(userId)) {
                await updateDoc(matchRef, {
                    cheers: currentCheers.filter(id => id !== userId)
                });
            } else {
                // 如果還沒打過氣，就加進去
                await updateDoc(matchRef, {
                    cheers: [...currentCheers, userId]
                });
            }
        } catch (error) {
            console.error("Cheer failed:", error);
        }
    };

  
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

   const trulyFilteredMatches = useMemo(() => {
    if (!selectedTournament) return [];
    return leagueMatches.filter(match => match.tournamentName === selectedTournament);
  }, [leagueMatches, selectedTournament]);
  const tournamentStandings = useMemo(() => {
    // 安全檢查：使用純淨的數據源
    if (!trulyFilteredMatches || trulyFilteredMatches.length === 0 || !students || students.length === 0) {
      return {};
    }
    
    const standingsData = {};

    const getOrCreateStanding = (playerId, groupKey) => {
        if (!standingsData[groupKey]) standingsData[groupKey] = {};
        if (!standingsData[groupKey][playerId]) {
            const student = students.find(s => s.id === playerId);
            if (!student) return null;
            standingsData[groupKey][playerId] = {
                id: playerId, name: student.name, class: student.class, classNo: student.classNo,
                played: 0, wins: 0, losses: 0,
                pointsFor: 0, pointsAgainst: 0, pointsDiff: 0, leaguePoints: 0
            };
        }
        return standingsData[groupKey][playerId];
    };

    // --- 主計算迴圈：現在運行在一個純淨的數據環境中 ---
    trulyFilteredMatches.forEach(match => {
        // 只處理已完賽的比賽
        if (match.status !== 'completed') return;

        const { player1Id, player2Id, groupName } = match;
        const groupKey = groupName || '所有比賽';
        
        const p1Score = parseInt(match.score1, 10) || 0;
        const p2Score = parseInt(match.score2, 10) || 0;

        const player1Standing = getOrCreateStanding(player1Id, groupKey);
        if (!player1Standing) return;

        player1Standing.played += 1;

        if (player2Id) {
            const player2Standing = getOrCreateStanding(player2Id, groupKey);
            if (!player2Standing) return;

            if (player1Id !== player2Id) {
                player2Standing.played += 1;
            }

            player1Standing.pointsFor += p1Score;
            player1Standing.pointsAgainst += p2Score;
            player2Standing.pointsFor += p2Score;
            player2Standing.pointsAgainst += p1Score;

            if (p1Score > p2Score) {
                player1Standing.wins += 1;
                player1Standing.leaguePoints += 3;
                player2Standing.losses += 1;
            } else if (p2Score > p1Score) {
                player2Standing.wins += 1;
                player2Standing.leaguePoints += 3;
                player1Standing.losses += 1;
            } else { 
                player1Standing.leaguePoints += 1;
                player2Standing.leaguePoints += 1;
            }
        } else {
            player1Standing.wins += 1;
            player1Standing.leaguePoints += 3;
        }
    });

    // --- 排序步驟 ---
    const finalSortedResult = {};
    Object.keys(standingsData).forEach(groupKey => {
        const groupStandings = standingsData[groupKey];
        const sortedPlayers = Object.values(groupStandings).map(player => {
            player.pointsDiff = player.pointsFor - player.pointsAgainst;
            return player;
        }).sort((a, b) => {
            if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            return b.pointsFor - a.pointsFor;
        });
        finalSortedResult[groupKey] = sortedPlayers;
    });

    return finalSortedResult;
  }, [trulyFilteredMatches, students]); // <-- 確保依賴純淨的數據


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

    const handleTacticalClick = (zone) => { // 移除 async
      if (!tacticalData.p1) {
          alert("請至少輸入一位我方球員的姓名！");
          return;
      }
      
      const playerName = activePlayer === 1 ? tacticalData.p1 : tacticalData.p2;
      const opponentName = activePlayer === 1 ? tacticalData.p2 : tacticalData.p1;
      
      // 視覺回饋
      setLastRecorded({ player: playerName, zone: zone });
      setTimeout(() => setLastRecorded(null), 800);

      // 自動切換到另一個人
      if (tacticalData.p2) {
          setActivePlayer(activePlayer === 1 ? 2 : 1);
      }

      // 取代原本的 addDoc：將落點紀錄暫存到陣列中
      setPendingTacticalShots(prev => [
          ...prev, 
          {
              player: playerName,
              opponent: opponentName || '未知對手',
              zone: zone,
              date: new Date().toISOString().split('T')[0]
          }
      ]);
  };

    const saveTacticalShots = async () => {
      if (pendingTacticalShots.length === 0) return;
      
      try {
          const batch = writeBatch(db); // 使用 Firebase 批次寫入
          const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'tactical_shots');
          
          pendingTacticalShots.forEach(shot => {
              batch.set(doc(colRef), {
                  ...shot,
                  timestamp: serverTimestamp()
              });
          });
          
          await batch.commit(); // 一次性發送所有累積的資料
          alert(`✅ 成功批次儲存 ${pendingTacticalShots.length} 筆戰術紀錄！`);
          setPendingTacticalShots([]); // 儲存後清空暫存區
      } catch(e) {
          console.error("批次戰術紀錄失敗", e);
          alert("儲存失敗，請檢查網路連線。");
      }
  };

const playerDashboardData = useMemo(() => {
    const targetStudentInfo = viewingStudent || (role === 'student' ? currentUserInfo : null);
    if (!targetStudentInfo) return null;

    const studentData = rankedStudents.find(s => s.id === targetStudentInfo.id) || targetStudentInfo;
    if (!studentData || !studentData.id) return null;

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
        { date: '目前', points: studentData.totalPoints || studentData.points || 0 }
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

    const recentMatches = studentMatches.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA);
}).slice(0, 5);

    return {
        winRate, wins, totalPlayed,
        attendanceRate, attendedSessions, totalScheduledSessions,
        pointsHistory: dynamicPointsHistory,
        recentMatches, latestAssessment, radarData,
        achievements: studentAchievements.map(ach => ({ badgeId: ach.badgeId, level: ach.level || 1 }))
    };
}, [viewingStudent, currentUserInfo, role, rankedStudents, leagueMatches, attendanceLogs, schedules, achievements, assessments]);


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

   const recentMatches = studentMatches.sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA);
}).slice(0, 5);

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
          <PosterGenerator ref={posterRef} data={posterData} schoolLogo={posterData?.schoolLogo} />
      </div>

      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryImageUpload} />
      {showTacticalBoard && (
   <TacticalBoardModal 
       onClose={() => setShowTacticalBoard(false)} 
       db={db} 
       appId={appId} 
   />
)}

{showAddAwardModal && (
    <AddAwardModal 
        onClose={() => setShowAddAwardModal(false)}
        db={db}
        appId={appId}
        compressImage={compressImage}
    />
)}

      {showTournamentModal && (
          <AddTournamentModal 
              onClose={() => setShowTournamentModal(false)}
              db={db}
              appId={appId}
              students={students}
              setSelectedTournament={setSelectedTournament}
          />
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
{/* 主題式動態登入頁面 */}
{showLoginModal && (
    <LoginScreen 
        onLogin={handleLogin} 
        systemConfig={systemConfig} 
    />
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

                {/* 👉 放在畫面最上層，如果有直播賽事就會自動顯示大螢幕 */}
        <LiveScoreboardDisplay liveMatches={liveMatches} />
        
        {showUmpirePanel && (
    <UmpirePanelModal 
        onClose={() => {
            setShowUmpirePanel(false); 
            setActiveLeagueMatch(null);
        }} 
        activeLeagueMatch={activeLeagueMatch}
        setActiveLeagueMatch={setActiveLeagueMatch}
        liveMatches={liveMatches}
        leagueMatches={leagueMatches}
        students={students}
        rankedStudents={rankedStudents}
        BADGE_DATA={BADGE_DATA}
        db={db}
        appId={appId}
    />
)}


          {showPlayerCard && ( 
              <PlayerCardModal 
                  student={showPlayerCard} 
                  onClose={() => setShowPlayerCard(null)} 
                  rankedStudents={rankedStudents}
                  setShowPlayerCard={setShowPlayerCard}
                  leagueMatches={leagueMatches}
                  achievements={achievements}
                  systemConfig={systemConfig}
                  BADGE_DATA={BADGE_DATA}
                  ACHIEVEMENT_DATA={ACHIEVEMENT_DATA}
              /> 
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
    <BadgeInfoModal 
        badge={viewingBadge} 
        onClose={() => setViewingBadge(null)} 
        ACHIEVEMENT_DATA={ACHIEVEMENT_DATA}
      />
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

          
          {viewingStudent && (
              <PlayerDashboard 
                  student={viewingStudent} 
                  data={playerDashboardData} 
                  onClose={() => setViewingStudent(null)} 
                  onBadgeClick={setViewingBadge}
                  tacticalShots={tacticalShots}
                  currentUserInfo={currentUserInfo}
                  role={role}
                  handleCheerMatch={handleCheerMatch}
              />
          )}

    {/* 我的表現 (學生專屬 Dashboard) */}
    {!viewingStudent && activeTab === 'myDashboard' && role === 'student' && (
        <MyDashboardPage 
            currentUserInfo={currentUserInfo}
            rankedStudents={rankedStudents}
            playerDashboardData={playerDashboardData}
            setViewingBadge={setViewingBadge}
            tacticalShots={tacticalShots}
            role={role}
            handleCheerMatch={handleCheerMatch}
            showcaseEditorOpen={showcaseEditorOpen}
            setShowcaseEditorOpen={setShowcaseEditorOpen}
            selectedFeaturedBadges={selectedFeaturedBadges}
            setSelectedFeaturedBadges={setSelectedFeaturedBadges}
            handleSaveFeaturedBadges={handleSaveFeaturedBadges}
            isUpdating={isUpdating}
        />
    )}
        
          {!viewingStudent && activeTab === 'dashboard' && (role === 'admin' || role === 'student') && (
            <DashboardPage 
                  competitions={competitions}
                  schedules={schedules}
                  students={students}
                  dashboardStats={dashboardStats}
              />
          )}
          {!viewingStudent && activeTab === 'monthlyStars' && (<MonthlyStarsPage monthlyStarsData={monthlyStars} />)}

          {/* ASSESSMENTS TAB (NEW) */}
            {!viewingStudent && activeTab === 'assessments' && role === 'admin' && (
                <AssessmentsPage 
                    students={students}
                    newAssessment={newAssessment}
                    setNewAssessment={setNewAssessment}
                    handleSaveAssessment={handleSaveAssessment}
                    isUpdating={isUpdating}
                />
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
    <RosterPage 
        students={students}
        filteredStudents={filteredStudents}
        birthYearStats={birthYearStats}
        selectedYearFilter={selectedYearFilter}
        setSelectedYearFilter={setSelectedYearFilter}
        downloadTemplate={downloadTemplate}
        handleCSVImportStudents={handleCSVImportStudents}
        setViewingStudent={setViewingStudent}
        handleManualAward={handleManualAward}
        handleUpdateSquashClass={handleUpdateSquashClass}
        handleSetupStudentAuth={handleSetupStudentAuth}
        setEditingStudent={setEditingStudent}
        deleteItem={deleteItem}
        setShowAddPlayerModal={setShowAddPlayerModal}
    />
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
              <CalendarPage 
                  role={role}
                  uniqueTrainingClasses={uniqueTrainingClasses}
                  selectedClassFilter={selectedClassFilter}
                  setSelectedClassFilter={setSelectedClassFilter}
                  calendarEvents={calendarEvents}
                  setSelectedSchedule={setSelectedSchedule}
                  downloadTemplate={downloadTemplate}
                  handleCSVImportSchedules={handleCSVImportSchedules}
              />
          )}

          {/* ATTENDANCE TAB */}
          {!viewingStudent && activeTab === 'attendance' && role === 'admin' && (
              <AttendancePage 
                  todaySchedule={todaySchedule}
                  pendingAttendance={pendingAttendance}
                  savePendingAttendance={savePendingAttendance}
                  isUpdating={isUpdating}
                  attendanceClassFilter={attendanceClassFilter}
                  setAttendanceClassFilter={setAttendanceClassFilter}
                  exportMatrixAttendanceCSV={exportMatrixAttendanceCSV}
                  uniqueTrainingClasses={uniqueTrainingClasses}
                  studentsInSelectedAttendanceClass={studentsInSelectedAttendanceClass}
                  attendanceLogs={attendanceLogs}
                  togglePendingAttendance={togglePendingAttendance}
              />
          )}
          {/* FINANCIAL TAB */}
          {!viewingStudent && activeTab === 'financial' && role === 'admin' && (
              <FinancialPage 
                  financeConfig={financeConfig}
                  setFinanceConfig={setFinanceConfig}
                  financialSummary={financialSummary}
                  saveFinanceConfig={saveFinanceConfig}
              />
          )}

          {/* COMPETITIONS TAB */}
          {!viewingStudent && activeTab === 'competitions' && (
              <CompetitionsPage 
                  role={role}
                  competitions={competitions}
                  generateCompetitionRoster={generateCompetitionRoster}
                  deleteItem={deleteItem}
                  db={db}
                  appId={appId}
              />
          )}

          {/* Gallery TAB */}
          {!viewingStudent && activeTab === 'gallery' && (
                <GalleryPage 
                    role={role}
                    currentAlbum={currentAlbum}
                    setCurrentAlbum={setCurrentAlbum}
                    isUploading={isUploading}
                    isSyncingDrive={isSyncingDrive}
                    syncGoogleDriveGallery={syncGoogleDriveGallery}
                    handleAddMedia={handleAddMedia}
                    galleryAlbums={galleryAlbums}
                    setViewingImage={setViewingImage}
                    getYouTubeEmbedUrl={getYouTubeEmbedUrl}
                    deleteItem={deleteItem}
                />
            )}
          
          {/* AWARDS TAB */}
          {!viewingStudent && activeTab === 'awards' && (
              <AwardsPage 
                  role={role}
                  awards={awards}
                  students={students}
                  awardsViewMode={awardsViewMode}
                  setAwardsViewMode={setAwardsViewMode}
                  setShowAddAwardModal={setShowAddAwardModal}
                  deleteItem={deleteItem}
              />
          )}

            
          {/* LEAGUE TAB */}
{!viewingStudent && activeTab === 'league' && (role === 'admin' || role === 'student') && (
    <LeaguePage 
        role={role}
        currentUserInfo={currentUserInfo}
        setShowTacticalBoard={setShowTacticalBoard}
        setShowUmpirePanel={setShowUmpirePanel}
        setActiveLeagueMatch={setActiveLeagueMatch}
        setShowTournamentModal={setShowTournamentModal}
        selectedTournament={selectedTournament}
        setSelectedTournament={setSelectedTournament}
        tournamentList={tournamentList}
        leagueMatches={leagueMatches}
        myTournamentStats={myTournamentStats}
        myUpcomingMatches={myUpcomingMatches}
        groupedMatches={groupedMatches}
        tournamentStandings={tournamentStandings}
        handleCheerMatch={handleCheerMatch}
        handleUpdateLeagueMatchScore={handleUpdateLeagueMatchScore}
        handleEditLeagueMatch={handleEditLeagueMatch}
        deleteItem={deleteItem}
        schoolLogo={systemConfig.schoolLogo}
    />
)}
            
          {/* EXTERNAL MATCHES TAB */}
{!viewingStudent && activeTab === 'externalMatches' && role === 'admin' && (
    <ExternalMatchesPage 
        newExternalMatch={newExternalMatch}
        setNewExternalMatch={setNewExternalMatch}
        externalTournaments={externalTournaments}
        students={students}
        handleSaveExternalMatch={handleSaveExternalMatch}
        isUpdating={isUpdating}
    />
)}

          {/* SETTINGS TAB */}
          {!viewingStudent && activeTab === 'settings' && role === 'admin' && (
              <SettingsPage 
                  systemConfig={systemConfig}
                  setSystemConfig={setSystemConfig}
                  importEncoding={importEncoding}
                  setImportEncoding={setImportEncoding}
                  externalTournaments={externalTournaments}
                  handleCSVImportExternalTournaments={handleCSVImportExternalTournaments}
                  deleteItem={deleteItem}
                  handleSeasonReset={handleSeasonReset}
                  setIsUpdating={setIsUpdating}
                  db={db}
                  appId={appId}
              />
          )}
          {showAddPlayerModal && (
              <AddPlayerModal 
                  onClose={() => setShowAddPlayerModal(false)} 
                  db={db}
                  appId={appId}
                  compressImage={compressImage}
    />
)}
          {/* 我們將 editingStudent 傳給新的 EditPlayerModal，並把 compressImage 函數也傳進去 */}
{editingStudent && (
    <EditPlayerModal 
        student={editingStudent}
        onClose={() => setEditingStudent(null)} 
        db={db}
        appId={appId}
        compressImage={compressImage}
    />
)}        
        </div>
      </main>
    </div>
  );
}
