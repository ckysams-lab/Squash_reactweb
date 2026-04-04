// File: src/App.jsx
// Version 1.6: Fixes all no-unused-vars ESLint errors and other warnings.

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
import WallOfFamePage from './pages/WallOfFamePage';
import FinancialPage from './pages/FinancialPage';
import PlayerDashboard from './components/PlayerDashboard';
import MyDashboardPage from './pages/MyDashboardPage';
import CreatePostModal from './components/CreatePostModal';
import ExternalMatchesPage from './pages/ExternalMatchesPage';
import SocialFeedPage from './pages/SocialFeedPage';
import RankingPage from './pages/RankingPage';
import FormTemplatePage from './pages/FormTemplatePage';
import { toDataURL, getAcademicYear, readCSVFile, compressImage, getYouTubeEmbedUrl } from './utils/helpers';
import { useFirebaseData } from './hooks/useFirebaseData';
import LiveScoreboardDisplay from './components/LiveScoreboardDisplay';
import React, { useState, useEffect, useMemo, useRef } from 'react';

import {
  Activity, ArrowLeft, Award, BookMarked, BookOpen, Bookmark, Cake, Calendar as CalendarIcon, Camera, CheckCircle2,
  ChevronDown, ChevronRight, ClipboardCheck, Clock, Coffee, Columns, Crown, DollarSign, Download, ExternalLink, Eye,
  FileBarChart, FileSpreadsheet, FileText, Filter, Folder, Globe, Heart, History, Hourglass, Image as ImageIcon, Info,
  Key, LayoutDashboard, Layers, Link as LinkIcon, ListChecks, Loader2, Lock, LogIn, LogOut, Mail, MapPin, Medal,
  Megaphone, Menu, MinusCircle, Pencil, Percent, PlayCircle, Plus, PlusCircle, Printer, Rocket, Save, Search, Settings2,
  Shield as ShieldIcon, ShieldCheck, Sparkles, Star, Sun, Swords, Target, Trash2, TrendingUp, Trophy, Trophy as TrophyIcon,
  Upload, User, UserCheck, UserCog, UserPlus, Users, X, Zap, MessageSquare
} from 'lucide-react';

import { 
  collection, doc, setDoc, onSnapshot, arrayUnion, arrayRemove, 
  addDoc, deleteDoc, serverTimestamp, updateDoc, writeBatch, increment
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
import { db, auth, firebaseConfig, signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from './firebase';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const CURRENT_VERSION = "1.6";

momentLocalizer(moment);
const appId = 'bcklas-squash-core-v1';

const SchoolLogo = ({ size = 48, className = "", systemConfig }) => {
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

const NavButton = ({ tabName, activeTab, setActiveTab, setSidebarOpen, icon, children }) => {
    const [isHovered, setIsHovered] = useState(false);
    const isActive = activeTab === tabName;
    
    const activeStyle = {
      backgroundColor: 'var(--theme-sidebar-active-bg)',
      color: 'var(--theme-sidebar-active-text)',
      boxShadow: '0 10px 15px -3px rgba(var(--theme-accent-rgb, 59, 130, 246), 0.2)'
    };
    const inactiveStyle = { color: 'var(--theme-sidebar-text)', backgroundColor: 'transparent' };
    const hoverStyle = { backgroundColor: 'rgba(128, 128, 128, 0.05)' };

    let style = isActive ? activeStyle : inactiveStyle;
    if (!isActive && isHovered) style = {...style, ...hoverStyle};
    
    return (
        <button
          onClick={() => { setActiveTab(tabName); setSidebarOpen(false); }}
          className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left font-bold"
          style={style}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {icon} {children}
        </button>
    );
};


export default function App() {
  const [user, setUser] = useState(null);

  const { 
    students, 
    competitions, 
    monthlyStars, 
    leagueMatches,
    attendanceLogs, 
    schedules, 
    // downloadFiles, // ESLINT: REMOVED
    galleryItems,
    awards, 
    achievements, 
    externalTournaments, 
    assessments, 
    tacticalShots,
    feedPosts,
    trophies,
    alumni,
    playerJournals
  } = useFirebaseData();

  const [role, setRole] = useState(null);
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [liveMatches, setLiveMatches] = useState([]);
  const [showUmpirePanel, setShowUmpirePanel] = useState(false);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [activeLeagueMatch, setActiveLeagueMatch] = useState(null);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  
  // ESLINT: REMOVED UNUSED STATE
  // const [tacticalData, setTacticalData] = useState({ p1: '', p2: '' });
  // const [activePlayer, setActivePlayer] = useState(1);
  // const [lastRecorded, setLastRecorded] = useState(null);
  // const [pendingTacticalShots, setPendingTacticalShots] = useState([]);

  const syncGoogleDriveGallery = async () => {
    setIsSyncingDrive(true);
    try {
        const gasUrl = "https://script.google.com/macros/s/AKfycby_ynudWf8U11QIpm5SdVJgFvFoOM4yVZzw_b-VrT5f6t2BnVavzYjdDBUMP3JIg91zfw/exec"; 
        
        const response = await fetch(gasUrl);
        const result = await response.json();
        
        if (result.status === 'success' && Array.isArray(result.data)) {
            const batch = writeBatch(db);
            const galleryColRef = collection(db, 'artifacts', appId, 'public', 'data', 'gallery');
            let itemsToSyncCount = 0;

            const existingDriveImageUrls = new Set(galleryItems.filter(item => item.isDrive).map(item => item.url));

            result.data.forEach(album => {
                if (album.photos && Array.isArray(album.photos)) {
                    album.photos.forEach(photo => {
                        if (!existingDriveImageUrls.has(photo.url)) {
                            const newDocRef = doc(galleryColRef);
                            batch.set(newDocRef, {
                                type: 'image',
                                url: photo.url,
                                title: album.album,
                                description: photo.name || `來自 ${album.album}`,
                                isDrive: true,
                                timestamp: serverTimestamp()
                            });
                            itemsToSyncCount++;
                        }
                    });
                }
            });

            if (itemsToSyncCount > 0) {
                await batch.commit();
                alert(`✅ 成功從 Google Drive 同步並永久儲存了 ${itemsToSyncCount} 個新項目！`);
            } else {
                alert("ℹ️ Google Drive 中沒有找到新的照片可以同步。所有項目都已是最新狀態。");
            }
        } else {
            alert("同步失敗：" + (result.message || '無法解析來自 Google Drive 的資料。'));
        }
    } catch (error) {
        console.error("Drive sync error:", error);
        alert("網路錯誤，無法連接 Google Drive。");
    }
    setIsSyncingDrive(false);
  };

  const handleLikePost = async (postId) => {
      if (!user) {
          alert("請先登入才能按讚喔！");
          return;
      }

      const userId = role === 'admin' ? 'admin' : currentUserInfo?.id;
      if (!userId) return;

      try {
          const post = feedPosts.find(p => p.id === postId);
          if (!post) return;

          const isLiked = post.likes && post.likes.includes(userId);
          const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'feed_posts', postId);

          if (isLiked) {
              await updateDoc(postRef, { likes: arrayRemove(userId) });
          } else {
              await updateDoc(postRef, { likes: arrayUnion(userId) });
          }
      } catch (error) {
          console.error("按讚失敗:", error);
      }
  };

  const parseCsvRow = (row) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
  };

  const handleAddComment = async (postId, commentText) => {
      if (!user) {
          alert("請先登入才能留言喔！");
          return;
      }
      if (!commentText.trim()) return;

      const userId = role === 'admin' ? 'admin' : currentUserInfo?.id;
      const authorName = role === 'admin' ? '系統管理員 (教練)' : currentUserInfo?.name;
      const authorPhotoUrl = currentUserInfo?.photoUrl || null;

      try {
          const postRef = doc(db, 'artifacts', appId, 'public', 'data', 'feed_posts', postId);
          
          const newComment = {
              id: Date.now().toString(),
              userId: userId,
              authorName: authorName,
              authorRole: role,
              authorPhotoUrl: authorPhotoUrl,
              text: commentText.trim(),
              createdAt: new Date().toISOString()
          };

          await updateDoc(postRef, { comments: arrayUnion(newComment) });
      } catch (error) {
          console.error("留言失敗:", error);
          alert("留言失敗，請稍後再試。");
      }
  };

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

  const handleSaveFeaturedBadges = async () => {
    if (!currentUserInfo) return;
    
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
            lastUpdated: serverTimestamp()
        });
        
        setCurrentUserInfo(prev => ({ ...prev, featuredBadges: selectedFeaturedBadges }));
        alert('✅ 你的勳章展示牆已成功更新！');
        setShowcaseEditorOpen(false);
    } catch (e) {
        console.error("Failed to save featured badges:", e);
        alert(`儲存失敗 (${e.code || '未知錯誤'})，請聯絡教練或檢查網絡。`);
    }
    setIsUpdating(false);
  };

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
    document.body.className = `theme-${theme}`;
  }, [systemConfig?.theme]);
  
  useEffect(() => {
    if (!user) return;
    
    try {
      const listeners = [];
      // ESLINT: Removed unused 'collections' variable
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
        else setDoc(financeConfigRef, { nTeam: 1, costTeam: 2750, nTrain: 3, costTrain: 1350, nHobby: 4, costHobby: 1200, totalStudents: 50, feePerStudent: 250 });
      }, (e) => console.error("Finance err", e)));
    
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

  const todaySchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find(s => s.date === today);
  }, [schedules]);

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
    const currentAcademicYear = getAcademicYear(now); 
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
      if (isNaN(d)) return false;
      const awardAcademicYear = getAcademicYear(d);
      return awardAcademicYear === currentAcademicYear;
    }).length;
    
    return { thisMonthTrainings, daysToNextMatch, awardsThisYear };
  }, [schedules, competitions, awards]);

  const galleryAlbums = useMemo(() => {
    const albums = {};
    const safeGallery = Array.isArray(galleryItems) ? galleryItems : [];
    
    safeGallery.forEach(item => {
      const title = item.title || "未分類相簿"; 

      if (!albums[title]) {
        albums[title] = { 
            title, 
            cover: item.url, 
            count: 0, 
            items: [], 
            type: item.type, 
            lastUpdated: item.timestamp?.seconds || 0,
            isDrive: item.isDrive || false 
        };
      }
      
      albums[title].count += 1;
      albums[title].items.push(item);
      
      if (item.timestamp?.seconds && item.timestamp.seconds > albums[title].lastUpdated) {
         albums[title].cover = item.url;
         albums[title].lastUpdated = item.timestamp.seconds;
      }
    });

    return Object.values(albums).sort((a,b) => b.lastUpdated - a.lastUpdated);
  }, [galleryItems]);

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
    const { 
        studentId, 
        date, 
        notes = '', 
        situps = 0, 
        shuttleRun = 0, 
        enduranceRun = 0, 
        gripStrength = 0, 
        flexibility = 0, 
        fhDrive = 0, 
        bhDrive = 0, 
        fhVolley = 0, 
        bhVolley = 0,
        rankT1 = '', 
        rankT2 = '', 
        rankT3 = '', 
        hoursT1 = '', 
        hoursT2 = '', 
        hoursT3 = '' 
    } = newAssessment;

    if (!studentId || !date) {
      alert("請選擇學員並填寫評估日期！"); return;
    }

    setIsUpdating(true);

    try {
      const cleanDataToSave = {
        studentId, date,
        notes: notes || '', 
        situps: Number(situps) || 0,
        shuttleRun: Number(shuttleRun) || 0,
        enduranceRun: Number(enduranceRun) || 0,
        gripStrength: Number(gripStrength) || 0,
        flexibility: Number(flexibility) || 0,
        fhDrive: Number(fhDrive) || 0,
        bhDrive: Number(bhDrive) || 0,
        fhVolley: Number(fhVolley) || 0,
        bhVolley: Number(bhVolley) || 0,
        rankT1: String(rankT1 || ''),
        rankT2: String(rankT2 || ''),
        rankT3: String(rankT3 || ''),
        hoursT1: String(hoursT1 || ''),
        hoursT2: String(hoursT2 || ''),
        hoursT3: String(hoursT3 || ''),
        timestamp: serverTimestamp()
      };

      const assessmentsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'assessments');
      await addDoc(assessmentsColRef, cleanDataToSave);

      alert('✅ 綜合能力評估儲存成功！');
      
      setNewAssessment({
        studentId: '', date: new Date().toISOString().split('T')[0], 
        situps: '', shuttleRun: '', enduranceRun: '', gripStrength: '', flexibility: '', 
        fhDrive: '', bhDrive: '', fhVolley: '', bhVolley: '', notes: '',
        rankT1: '', rankT2: '', rankT3: '', hoursT1: '', hoursT2: '', hoursT3: ''
      });

    } catch (e) {
      console.error("Failed to save assessment:", e);
      alert(`儲存失敗：${e.message}`);
    }

    setIsUpdating(false);
  };

  const handleAddJournalEntry = async (studentId, content) => {
      if (!content.trim()) return;
      setIsUpdating(true);
      try {
          await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'player_journals'), {
              studentId,
              coachContent: content,
              coachId: currentUserInfo?.id || 'admin',
              coachName: currentUserInfo?.name || '教練',
              studentReply: null,
              createdAt: serverTimestamp()
          });
      } catch (e) {
          console.error("Failed to add journal entry:", e);
          alert("新增日誌失敗，請檢查網路。");
      }
      setIsUpdating(false);
  };

  const handleReplyJournalEntry = async (journalId, replyContent) => {
      if (!replyContent.trim()) return;
      setIsUpdating(true);
      try {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'player_journals', journalId);
          await updateDoc(docRef, {
              studentReply: replyContent,
              repliedAt: serverTimestamp()
          });
      } catch (e) {
          console.error("Failed to reply journal entry:", e);
          alert("回覆失敗，請檢查網路。");
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
        tournamentName, date, player1Id, isWin, externalMatchScore,
        opponentSchool, opponentPlayerName,
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

  const handleSetupStudentAuth = async (student) => {
    const password = prompt(`請為 ${student.name} 設定登入密碼 (最少 6 位數):`);
    if (!password || password.length < 6) {
        alert("密碼無效或太短 (Firebase 規定最少 6 位數)！已取消操作。");
        return;
    }

    const studentAuthEmail = `${student.class.toLowerCase().trim()}${student.classNo.trim()}@bcklas.squash`;

    setIsUpdating(true);
    try {
        const tempApp = initializeApp(firebaseConfig, "TempApp");
        const tempAuth = getAuth(tempApp);

        await createUserWithEmailAndPassword(tempAuth, studentAuthEmail, password);

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), {
            authEmail: studentAuthEmail,
            lastUpdated: serverTimestamp()
        });

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
        uniqueMap.set(key, { ...s, totalPoints: currentPoints });
      } else {
        const existing = uniqueMap.get(key);
        if (currentPoints > existing.totalPoints) {
            uniqueMap.set(key, { ...s, totalPoints: currentPoints });
        }
      }
    });

    return Array.from(uniqueMap.values()).sort((a, b) => {
      const pointsA = Number(a.totalPoints) || 0;
      const pointsB = Number(b.totalPoints) || 0;

      if (pointsB !== pointsA) return pointsB - pointsA; 
      
      const timeA = a.lastUpdated?.seconds || 0;
      const timeB = b.lastUpdated?.seconds || 0;
      if (timeB !== timeA) return timeB - timeA;
      
      const classCompare = (a.class || '').localeCompare(b.class || '');
      if (classCompare !== 0) return classCompare;
      return (a.classNo || '').localeCompare(b.classNo || '');
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

  const adjustPoints = async (id, amount, _reason = "教練調整") => { // ESLINT: Use _ to ignore unused var
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
        adjustPoints(student.id, points, reason); // ESLINT: Pass reason
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
                title,
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

  const handleCSVImportTrophies = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'trophies');
      let count = 0;

      rows.forEach(row => {
        const cols = parseCsvRow(row);
        if (cols.length >= 4) {
          const [year, tournamentName, award, roster] = cols;
          if (year && tournamentName && award) {
            const newDocRef = doc(colRef);
            batch.set(newDocRef, {
              year: Number(year) || 0,
              tournamentName,
              award,
              roster: roster ? roster.split(',').map(name => name.trim()) : [],
              createdAt: serverTimestamp()
            });
            count++;
          }
        }
      });

      if (count > 0) {
          await batch.commit();
          alert(`✅ 成功匯入 ${count} 筆團隊獎項紀錄！`);
      } else {
          alert("⚠️ 匯入 0 筆紀錄。請檢查您的 CSV 檔案內容是否為空，或格式是否完全符合範本要求 (包含標題行)。");
      }
    } catch (err) {
      console.error("Trophy import failed:", err);
      alert('獎項紀錄匯入失敗，請檢查檔案格式或內容。');
    }
    setIsUpdating(false);
    if (e.target) e.target.value = null;
  };

  const handleCSVImportAlumni = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUpdating(true);
    try {
      const text = await readCSVFile(file, importEncoding);
      const rows = text.split(/\r?\n/).filter(r => r.trim() !== '').slice(1);
      const batch = writeBatch(db);
      const colRef = collection(db, 'artifacts', appId, 'public', 'data', 'alumni');
      let count = 0;

      rows.forEach(row => {
        const cols = parseCsvRow(row);
        if (cols.length >= 3) {
          const [name, graduationYear, achievement] = cols;
          if (name && graduationYear) {
            const newDocRef = doc(colRef);
            batch.set(newDocRef, {
              name,
              graduationYear: Number(graduationYear) || 0,
              achievement,
              createdAt: serverTimestamp()
            });
            count++;
          }
        }
      });

      if (count > 0) {
          await batch.commit();
          alert(`✅ 成功匯入 ${count} 筆傳奇校友紀錄！`);
      } else {
          alert("⚠️ 匯入 0 筆紀錄。請檢查您的 CSV 檔案內容是否為空，或格式是否完全符合範本要求 (包含標題行)。");
      }
    } catch (err) {
      console.error("Alumni import failed:", err);
      alert('傳奇校友匯入失敗，請檢查檔案格式或內容。');
    }
    setIsUpdating(false);
    if (e.target) e.target.value = null;
  };

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

  const tournamentList = useMemo(() => {
    if (leagueMatches.length === 0) return [];
    const uniqueNames = [...new Set(leagueMatches.map(m => m.tournamentName).filter(Boolean))];
    return uniqueNames.sort((a, b) => b.localeCompare(a));
  }, [leagueMatches]);

  const filteredMatches = useMemo(() => {
    if (!selectedTournament) return [];
    return leagueMatches.filter(m => m.tournamentName === selectedTournament);
  }, [leagueMatches, selectedTournament]);

  useEffect(() => {
    if (tournamentList.length > 0 && !selectedTournament) {
      setSelectedTournament(tournamentList[0]);
    }
  }, [tournamentList, selectedTournament]);

  const groupedMatches = useMemo(() => {
    const groups = {};
    if (filteredMatches.length > 0) {
        filteredMatches.forEach(match => {
            const groupKey = match.groupName || '所有比賽';
            if (!groups[groupKey]) groups[groupKey] = [];
            groups[groupKey].push(match);
        });
    }

    const sortedGroupKeys = Object.keys(groups).sort((a, b) => {
        if (a === '所有比賽') return -1;
        if (b === '所有比賽') return 1;
        return a.localeCompare(b);
    });

    const result = {};
    sortedGroupKeys.forEach(key => { result[key] = groups[key]; });
    return result;
  }, [filteredMatches]);

  const handleCheerMatch = async (matchId, e) => {
      e.stopPropagation();
      if (!currentUserInfo && role !== 'admin') {
          alert("請先登入才能為隊友打氣喔！");
          return;
      }

      const userId = currentUserInfo?.id || 'admin';
      const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', matchId);

      try {
          const currentMatch = leagueMatches.find(m => m.id === matchId);
          if (!currentMatch) return;
          const currentCheers = currentMatch.cheers || [];

          if (currentCheers.includes(userId)) {
              await updateDoc(matchRef, { cheers: arrayRemove(userId) });
          } else {
              await updateDoc(matchRef, { cheers: arrayUnion(userId) });
          }
      } catch (error) {
          console.error("Cheer failed:", error);
      }
  };

  const handleUpdateLeagueMatchScore = async (match) => {
      const score1_str = prompt(`請輸入 ${match.player1Name} 的分數:`);
      if (score1_str === null) return;
      const score2_str = prompt(`請輸入 ${match.player2Name || '對手'} 的分數:`);
      if (score2_str === null) return;
      
      const score1 = parseInt(score1_str, 10);
      const score2 = parseInt(score2_str, 10);

      if (isNaN(score1) || isNaN(score2)) { alert("分數必須是數字！"); return; }
      if (score1 === score2) { alert("比分不能相同，必須有勝負之分。"); return; }

      const winnerId = score1 > score2 ? match.player1Id : match.player2Id;
      const winner = students.find(s => s.id === winnerId);
      
      const loserId = (winnerId === match.player1Id ? match.player2Id : match.player1Id);
      const loser = loserId ? students.find(s => s.id === loserId) : null;
      
      if (!winner) { alert("找不到獲勝球員資料，無法更新積分。"); return; }

      const winnerRank = rankedStudents.findIndex(s => s.id === winner.id) + 1;
      const loserRank = loser ? (rankedStudents.findIndex(s => s.id === loser.id) + 1) : 0;
      const winnerBadgeLevel = BADGE_DATA[winner.badge]?.level || 0;
      const loserBadgeLevel = loser ? (BADGE_DATA[loser.badge]?.level || 0) : 0;
      const isRankGiantKiller = winnerRank > 0 && loserRank > 0 && (winnerRank - loserRank) >= 5;
      const isBadgeGiantKiller = loser && winnerBadgeLevel < loserBadgeLevel;
      const isGiantKiller = isRankGiantKiller || isBadgeGiantKiller;
      const pointsToAdd = isGiantKiller ? 20 : 10;
      
      const confirmMsg = `✍️ 確認賽果？\n\n${match.player1Name} vs ${match.player2Name || 'BYE'}\n比分: ${score1} - ${score2}\n\n🏆 勝方: ${winner.name} (+${pointsToAdd} 分 ${isGiantKiller ? '🔥巨人殺手' : ''})`;

      if (confirm(confirmMsg)) {
          setIsUpdating(true);
          try {
              const batch = writeBatch(db);
              const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.id);
              batch.update(matchRef, { score1, score2, winnerId, status: 'completed', updatedAt: serverTimestamp() });

              const winnerRef = doc(db, 'artifacts', appId, 'public', 'data', 'students', winner.id);
              batch.update(winnerRef, { points: increment(pointsToAdd), lastUpdated: serverTimestamp() });
              
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
      if (!dateRegex.test(newDate)) { alert("日期格式錯誤！請使用 YYYY-MM-DD 格式。"); return; }

      const newTime = prompt(`請輸入新的比賽時間 (HH:MM):`, match.time);
      if (newTime === null) return;
      
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(newTime) && newTime !== 'N/A') { alert("時間格式錯誤！請使用 HH:MM 格式。"); return; }
      
      setIsUpdating(true);
      try {
          const matchRef = doc(db, 'artifacts', appId, 'public', 'data', 'league_matches', match.id);
          await updateDoc(matchRef, { date: newDate, time: newTime });
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
    if (!trulyFilteredMatches || trulyFilteredMatches.length === 0 || !students || students.length === 0) return {};
    
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

    trulyFilteredMatches.forEach(match => {
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
            if (player1Id !== player2Id) player2Standing.played += 1;

            player1Standing.pointsFor += p1Score;
            player1Standing.pointsAgainst += p2Score;
            player2Standing.pointsFor += p2Score;
            player2Standing.pointsAgainst += p1Score;

            if (p1Score > p2Score) {
                player1Standing.wins += 1; player1Standing.leaguePoints += 3; player2Standing.losses += 1;
            } else if (p2Score > p1Score) {
                player2Standing.wins += 1; player2Standing.leaguePoints += 3; player1Standing.losses += 1;
            } else { 
                player1Standing.leaguePoints += 1; player2Standing.leaguePoints += 1;
            }
        } else {
            player1Standing.wins += 1; player1Standing.leaguePoints += 3;
        }
    });

    const finalSortedResult = {};
    Object.keys(standingsData).forEach(groupKey => {
        finalSortedResult[groupKey] = Object.values(standingsData[groupKey]).map(player => {
            player.pointsDiff = player.pointsFor - player.pointsAgainst;
            return player;
        }).sort((a, b) => {
            if (b.leaguePoints !== a.leaguePoints) return b.leaguePoints - a.leaguePoints;
            if (b.pointsDiff !== a.pointsDiff) return b.pointsDiff - a.pointsDiff;
            return b.pointsFor - a.pointsFor;
        });
    });

    return finalSortedResult;
  }, [trulyFilteredMatches, students]);

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
    const targetStudentInfo = viewingStudent || (role === 'student' ? currentUserInfo : null);
    if (!targetStudentInfo) return null;

    const studentData = rankedStudents.find(s => s.id === targetStudentInfo.id) || targetStudentInfo;
    if (!studentData || !studentData.id) return null;

    const studentMatches = leagueMatches.filter(m => m.player1Id === studentData.id || m.player2Id === studentData.id);
    const completedMatches = studentMatches.filter(m => m.status === 'completed');
    const studentAttendance = attendanceLogs.filter(log => log.studentId === studentData.id);
    const studentAchievements = achievements.filter(ach => ach.studentId === studentData.id);

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
    const studentAssessments = (assessments || []).filter(a => a.studentId === studentData.id);
    let latestAssessment = null;
    if (studentAssessments.length > 0) {
        latestAssessment = studentAssessments.reduce((latest, current) => {
            const timeLatest = latest.timestamp?.seconds || new Date(latest.date).getTime() / 1000;
            const timeCurrent = current.timestamp?.seconds || new Date(current.date).getTime() / 1000;
            return (timeCurrent > timeLatest) ? current : latest;
        });
    }
    
    let radarData = [];
    if (latestAssessment) {
        const calcScore = (val, max) => Math.min(10, Math.max(1, Math.round((val / max) * 10)));
        const calculateShotScore = (driveHitsRaw, volleyHitsRaw) => {
            const driveHits = Math.min(10, Number(driveHitsRaw) || 0);
            const volleyHits = Math.min(7, Number(volleyHitsRaw) || 0);
            return Math.floor((driveHits * 4) + (volleyHits * (60 / 7)));
        };
        const fhTotalScore = calculateShotScore(latestAssessment.fhDrive, latestAssessment.fhVolley);
        const bhTotalScore = calculateShotScore(latestAssessment.bhDrive, latestAssessment.bhVolley);
        radarData = [
            { subject: '體能 (折返跑)', A: calcScore(latestAssessment.shuttleRun, 25), fullMark: 10 },
            { subject: '力量 (握力)', A: calcScore(latestAssessment.gripStrength, 70), fullMark: 10 },
            { subject: '柔軟度', A: calcScore(latestAssessment.flexibility, 30), fullMark: 10 },
            { subject: '正手技術', A: Math.max(1, Math.round(fhTotalScore / 10)), fullMark: 10 },
            { subject: '反手技術', A: Math.max(1, Math.round(bhTotalScore / 10)), fullMark: 10 },
        ];
    }

    const recentMatches = studentMatches.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

    return {
        winRate, wins, totalPlayed,
        attendanceRate, attendedSessions, totalScheduledSessions,
        pointsHistory: dynamicPointsHistory,
        recentMatches, latestAssessment, radarData,
        achievements: studentAchievements.map(ach => ({ badgeId: ach.badgeId, level: ach.level || 1 }))
    };
  }, [viewingStudent, currentUserInfo, role, rankedStudents, leagueMatches, attendanceLogs, schedules, achievements, assessments]);

  const myDashboardData = useMemo(() => {
    if (role !== 'student' || !currentUserInfo) return null;
    
    const studentData = rankedStudents.find(s => s.id === currentUserInfo.id);
    if (!studentData) return null;

    const studentMatches = leagueMatches.filter(m => m.player1Id === studentData.id || m.player2Id === studentData.id);
    const completedMatches = studentMatches.filter(m => m.status === 'completed');
    const studentAttendance = attendanceLogs.filter(log => log.studentId === studentData.id);
    const studentAchievements = achievements.filter(ach => ach.studentId === studentData.id);

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
    const studentAssessments = (assessments || []).filter(a => a.studentId === studentData.id);
    let latestAssessment = null;
    if (studentAssessments.length > 0) {
        latestAssessment = studentAssessments.reduce((latest, current) => {
            const timeLatest = latest.timestamp?.seconds || new Date(latest.date).getTime() / 1000;
            const timeCurrent = current.timestamp?.seconds || new Date(current.date).getTime() / 1000;
            return (timeCurrent > timeLatest) ? current : latest;
        });
    }
    let radarData = [];
    if (latestAssessment) {
        const calcScore = (val, max) => Math.min(10, Math.max(1, Math.round((val / max) * 10)));
        const calculateShotScore = (driveHitsRaw, volleyHitsRaw) => {
            const driveHits = Math.min(10, Number(driveHitsRaw) || 0);
            const volleyHits = Math.min(7, Number(volleyHitsRaw) || 0);
            return Math.floor((driveHits * 4) + (volleyHits * (60 / 7)));
        };
        const fhTotalScore = calculateShotScore(latestAssessment.fhDrive, latestAssessment.fhVolley);
        const bhTotalScore = calculateShotScore(latestAssessment.bhDrive, latestAssessment.bhVolley);
        radarData = [
            { subject: '體能 (折返跑)', A: calcScore(latestAssessment.shuttleRun, 25), fullMark: 10 },
            { subject: '力量 (握力)', A: calcScore(latestAssessment.gripStrength, 70), fullMark: 10 },
            { subject: '柔軟度', A: calcScore(latestAssessment.flexibility, 30), fullMark: 10 },
            { subject: '正手技術', A: Math.max(1, Math.round(fhTotalScore / 10)), fullMark: 10 },
            { subject: '反手技術', A: Math.max(1, Math.round(bhTotalScore / 10)), fullMark: 10 },
        ];
    }

    const recentMatches = studentMatches.sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);

    return {
        winRate, wins, totalPlayed,
        attendanceRate, attendedSessions, totalScheduledSessions,
        pointsHistory: dynamicPointsHistory,
        recentMatches, latestAssessment, radarData,
        achievements: studentAchievements.map(ach => ({ badgeId: ach.badgeId, level: ach.level || 1 }))
    };
  }, [currentUserInfo, role, rankedStudents, leagueMatches, attendanceLogs, schedules, achievements, assessments, students]);

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
            [gender]: { ...prev[gender], studentId: student.id, studentName: student.name, studentClass: student.class }
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
          await setDoc(docRef, { ...monthlyStarEditData, month: selectedMonthForAdmin, publishedAt: serverTimestamp() });
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
            if (!posterElement) { alert("海報模板加載失敗。"); setIsGeneratingPoster(false); return; }
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
        <SchoolLogo size={96} systemConfig={systemConfig} />
      </div>
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-bold animate-pulse">正在連接 BCKLAS 資料庫...</p>
      <p className="text-xs text-slate-300 mt-2 font-mono">v{CURRENT_VERSION}</p>
    </div>
  );

  return (
    <div className="min-h-screen flex font-sans overflow-hidden" style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text-primary)' }}>
      
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
            <div className="flex items-center justify-center"><SchoolLogo size={32} systemConfig={systemConfig} /></div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] -mt-1">BCKLAS SYSTEM v{CURRENT_VERSION}</p>
            </div>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto">
              <>
                {(role === 'admin' || role === 'student') && (
                  <>
                    <div className="text-[10px] uppercase tracking-widest mb-4 px-6" style={{ color: 'var(--theme-text-faint)' }}>主選單</div>
                    <NavButton tabName="myDashboard" icon={<UserCheck size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>我的表現</NavButton>
                    <NavButton tabName="monthlyStars" icon={<Star size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>每月之星</NavButton>
                    <NavButton tabName="rankings" icon={<Trophy size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>積分排行</NavButton>
                    <NavButton tabName="league" icon={<Swords size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>聯賽專區</NavButton>
                    <NavButton tabName="socialFeed" icon={<MessageSquare size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>球隊動態</NavButton>
                    <NavButton tabName="gallery" icon={<ImageIcon size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>精彩花絮</NavButton>
                    <NavButton tabName="wallOfFame" icon={<Trophy size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>榮譽殿堂</NavButton>
                    <NavButton tabName="awards" icon={<Award size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>獎項成就</NavButton>
                    <NavButton tabName="schedules" icon={<CalendarIcon size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>訓練日程</NavButton>
                    <NavButton tabName="competitions" icon={<Megaphone size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>比賽與公告</NavButton>
                  </>
                )}
                {role === 'admin' && (
                  <>
                    <div className="text-[10px] uppercase tracking-widest my-6 px-6 pt-6 border-t" style={{ color: 'var(--theme-text-faint)', borderColor: 'var(--theme-border)' }}>教練工具</div>
                    <NavButton tabName="dashboard" icon={<LayoutDashboard size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>管理概況</NavButton>
                    <NavButton tabName="formTemplates" icon={<FilePenLine size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>報名表範本</NavButton>
                    <NavButton tabName="assessments" icon={<Activity size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>綜合能力評估</NavButton>
                    <NavButton tabName="monthlyStarsAdmin" icon={<Crown size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>每月之星管理</NavButton>
                    <NavButton tabName="students" icon={<Users size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>隊員管理</NavButton>
                    <NavButton tabName="externalMatches" icon={<BookMarked size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>校外賽管理</NavButton>
                    <NavButton tabName="attendance" icon={<ClipboardCheck size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>快速點名</NavButton>
                    <NavButton tabName="financial" icon={<DollarSign size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>財務收支</NavButton>
                    <NavButton tabName="settings" icon={<Settings2 size={20} />} activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen}>系統設定</NavButton>
                  </>
                )}
              </>
          </nav>
          
          <div className="pt-10 border-t" style={{ borderColor: 'var(--theme-border)' }}>
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
        <header className="px-10 py-8 sticky top-0 backdrop-blur-xl z-40 border-b flex items-center justify-between" style={{ backgroundColor: 'var(--theme-header-bg)', borderColor: 'var(--theme-border)' }}>
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
                 activeTab === 'socialFeed' ? "💬 球隊動態牆" :
                 activeTab === 'wallOfFame' ? "🏛️ 榮譽殿堂" :
                 activeTab === 'financial' ? "💰 財務收支管理" :
                 activeTab === 'settings' ? "⚙️ 系統核心設定" :
                 activeTab === 'monthlyStarsAdmin' ? "🌟 每月之星管理" :
                 activeTab === 'monthlyStars' ? "🌟 每月之星" :
                 activeTab === 'externalMatches' ? "📝 校外賽記錄管理" :
                 activeTab === 'assessments' ? "📋 綜合能力評估" : ""}
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

          <LiveScoreboardDisplay 
              liveMatches={liveMatches} 
              TrophyIcon={TrophyIcon} 
              rankedStudents={rankedStudents} 
          />
        
          {showUmpirePanel && (
            <UmpirePanelModal 
                onClose={() => { setShowUmpirePanel(false); setActiveLeagueMatch(null); }} 
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
                  ACHIEVEMENT_DATA={ACHIEVEMENT_DATA}
                  assessments={assessments} 
                  attendanceLogs={attendanceLogs}
              /> 
          )}  

          {selectedSchedule && (
            <div className="fixed inset-0 z-[250] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setSelectedSchedule(null)}>
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    {selectedSchedule.trainingClass} 訓練詳情
                </h3>
                <div className="space-y-4 text-lg">
                  <div className="flex items-center gap-4"><CalendarIcon size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.date}</span></div>
                  <div className="flex items-center gap-4"><Clock size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.time || 'N/A'}</span></div>
                  <div className="flex items-center gap-4"><MapPin size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.location}</span></div>
                  {selectedSchedule.coach && (
                      <div className="flex items-center gap-4"><User size={20} className="text-slate-400"/><span className="font-bold">{selectedSchedule.coach}</span></div>
                  )}
                  {selectedSchedule.notes && (
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                          <span className="text-sm font-medium text-slate-600 bg-slate-50 p-3 rounded-xl w-full">{selectedSchedule.notes}</span>
                      </div>
                  )}
                </div>
                {role === 'admin' && (
                  <div className="mt-8 pt-6 border-t border-slate-100 flex gap-4">
                    <button 
                        onClick={() => { deleteItem('schedules', selectedSchedule.id); setSelectedSchedule(null); }} 
                        className="flex-1 text-center py-4 bg-rose-50 text-rose-600 font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <Trash2 size={18}/> 刪除此課程
                    </button>
                    {moment(selectedSchedule.date).isSame(new Date(), 'day') && (
                        <button 
                            onClick={() => { setActiveTab('attendance'); setSelectedSchedule(null); }} 
                            className="flex-1 text-center py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-md"
                        >
                            前往點名
                        </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {viewingBadge && (
            <BadgeInfoModal 
                badge={viewingBadge} 
                onClose={() => setViewingBadge(null)} 
                ACHIEVEMENT_DATA={ACHIEVEMENT_DATA}
            />
          )}

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
                                          );
                                      })}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

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
                  playerJournals={playerJournals}
                  handleAddJournalEntry={handleAddJournalEntry}
                  handleReplyJournalEntry={handleReplyJournalEntry}
              />
          )}
          
          {!viewingStudent && activeTab === 'myDashboard' && role === 'student' && (
              <MyDashboardPage 
                  currentUserInfo={currentUserInfo}
                  rankedStudents={rankedStudents}
                  playerDashboardData={myDashboardData}
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
                  playerJournals={playerJournals}
                  handleAddJournalEntry={handleAddJournalEntry}
                  handleReplyJournalEntry={handleReplyJournalEntry}
              />
          )}
        
          {!viewingStudent && activeTab === 'dashboard' && role === 'admin' && (
            <DashboardPage 
                dashboardStats={dashboardStats}
                assessments={assessments}
            />
          )}

          {!viewingStudent && activeTab === 'formTemplates' && role === 'admin' && (
                      <FormTemplatePage />
                    )}
          
          {!viewingStudent && activeTab === 'monthlyStars' && (<MonthlyStarsPage monthlyStarsData={monthlyStars} />)}

          {!viewingStudent && activeTab === 'assessments' && role === 'admin' && (
              <AssessmentsPage 
                  students={students}
                  assessments={assessments}
                  newAssessment={newAssessment}
                  setNewAssessment={setNewAssessment}
                  handleSaveAssessment={handleSaveAssessment}
                  isUpdating={isUpdating}
              />
          )}

          {!viewingStudent && activeTab === 'rankings' && (
              <RankingPage 
                  role={role}
                  rankedStudents={rankedStudents}
                  filteredStudents={filteredStudents}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  setShowPlayerCard={setShowPlayerCard}
                  adjustPoints={adjustPoints}
                  handleExternalComp={handleExternalComp}
                  deleteItem={deleteItem}
              />
          )}

          {!viewingStudent && activeTab === 'students' && role === 'admin' && (
            <RosterPage 
                students={students}
                filteredStudents={filteredStudents}
                birthYearStats={birthYearStats}
                selectedYearFilter={selectedYearFilter}
                setSelectedYearFilter={setSelectedYearFilter}
                handleCSVImportStudents={handleCSVImportStudents}
                setViewingStudent={setViewingStudent}
                handleManualAward={handleManualAward}
                handleUpdateSquashClass={handleUpdateSquashClass}
                setEditingStudent={setEditingStudent}
                deleteItem={deleteItem}
                setShowAddPlayerModal={setShowAddPlayerModal}
            />
          )}

          {!viewingStudent && activeTab === 'socialFeed' && (
              <SocialFeedPage 
                  role={role}
                  currentUserInfo={currentUserInfo}
                  feedPosts={feedPosts}
                  setShowCreatePostModal={setShowCreatePostModal}
                  handleLikePost={handleLikePost} 
                  handleAddComment={handleAddComment}
              />
          )}

          {!viewingStudent && activeTab === 'monthlyStarsAdmin' && role === 'admin' && (
              <div className="animate-in fade-in duration-500 font-bold">
                  <div className="bg-white p-10 rounded-[3rem] border shadow-sm mb-8">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h3 className="text-3xl font-black">每月之星內容管理</h3>
                        <input type="month" value={selectedMonthForAdmin} onChange={e => setSelectedMonthForAdmin(e.target.value)} className="bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-4 outline-none text-lg font-bold"/>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {!viewingStudent && activeTab === 'schedules' && (
              <CalendarPage 
                  role={role}
                  uniqueTrainingClasses={uniqueTrainingClasses}
                  selectedClassFilter={selectedClassFilter}
                  setSelectedClassFilter={setSelectedClassFilter}
                  calendarEvents={calendarEvents}
                  setSelectedSchedule={setSelectedSchedule}
                  handleCSVImportSchedules={handleCSVImportSchedules}
              />
          )}

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

          {!viewingStudent && activeTab === 'financial' && role === 'admin' && (
              <FinancialPage 
                  financeConfig={financeConfig}
                  setFinanceConfig={setFinanceConfig}
                  financialSummary={financialSummary}
                  saveFinanceConfig={saveFinanceConfig}
              />
          )}

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

          {!viewingStudent && activeTab === 'wallOfFame' && (
              <WallOfFamePage trophies={trophies} alumni={alumni} />
          )}
                
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
                  handleCSVImportTrophies={handleCSVImportTrophies}
                  handleCSVImportAlumni={handleCSVImportAlumni}
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

          {showCreatePostModal && (
              <CreatePostModal 
                  onClose={() => setShowCreatePostModal(false)}
                  currentUserInfo={currentUserInfo}
                  role={role}
                  appId={appId}
                  compressImage={compressImage}
              />
          )}

          {editingStudent && (
              <EditPlayerModal 
                  student={editingStudent}
                  onClose={() => setEditingStudent(null)} 
                  db={db}
                  appId={appId}
                  compressImage={compressImage}
                  handleSetupStudentAuth={handleSetupStudentAuth}
              />
          )}        
        </div>
      </main>
    </div>
  );
}
