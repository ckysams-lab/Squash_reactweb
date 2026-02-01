import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, ClipboardCheck, DollarSign, Plus, Trash2, 
  UserCheck, Calendar as CalendarIcon, ShieldCheck, Menu, X, Loader2,
  Trophy, Megaphone, Upload, LogIn, LogOut, Lock, User, MinusCircle, PlusCircle, 
  Save, FileSpreadsheet, Download, FileText, Info, Link as LinkIcon, Settings2,
  ChevronRight, Search, Filter, History, Clock, MapPin, Layers, Award,
  Trophy as TrophyIcon, Star, Target, TrendingUp, ChevronDown, CheckCircle2,
  FileBarChart, Crown, ListChecks, Image as ImageIcon, Video, PlayCircle, Camera,
  Hourglass, Medal, Folder, ArrowLeft, Bookmark, BookOpen, Swords
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, deleteDoc, query, orderBy, serverTimestamp, updateDoc, writeBatch, increment, where
} from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase 初始化 ---
let firebaseConfig;
try {
  const envConfig = import.meta.env?.VITE_FIREBASE_CONFIG;
  if (envConfig) {
    firebaseConfig = JSON.parse(envConfig);
  } else if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    throw new Error('No env config');
  }
} catch (e) {
  firebaseConfig = {
    apiKey: "AIzaSyAYm_63S9pKMZ51Qb2ZlCHRsfuGzy2gstw",
    authDomain: "squashreact.firebaseapp.com",
    projectId: "squashreact",
    storageBucket: "squashreact.firebasestorage.app",
    messagingSenderId: "342733564194",
    appId: "1:342733564194:web:7345d90d7d22c0b605dd7b",
    measurementId: "G-JRZ0QSFLLQ"
  };
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// [Fix 2.0] 強制鎖定 App ID
const appId = 'bcklas-squash-core-v1'; 

// --- 版本控制 (Version Control) ---
// Version 3.9.1: 修正 JSX 語法錯誤
// Version 4.0: [Current] 調整學生登入後預設跳轉頁面為「比賽與公告」
const CURRENT_VERSION = "4.0";

export default function App() {
  // --- 狀態管理 ---
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student'
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]); 
  const [attendanceLogs, setAttendanceLogs] = useState([]); 
  const [competitions, setCompetitions] = useState([]);
  const [schedules, setSchedules] = useState([]); 
  const [galleryItems, setGalleryItems] = useState([]); 
  const [awards, setAwards] = useState([]); 
  const [downloadFiles, setDownloadFiles] = useState([]); 
  
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

  // 對戰錄入狀態
  const [matchWinner, setMatchWinner] = useState('');
  const [matchLoser, setMatchLoser] = useState('');

  const [importEncoding, setImportEncoding] = useState('AUTO');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const galleryInputRef = useRef(null);

  // [Fix 1.0] 財務參數
  const [financeConfig, setFinanceConfig] = useState({
    nTeam: 1, costTeam: 2750,
    nTrain: 3, costTrain: 1350,
    nHobby: 4, costHobby: 1200,
    totalStudents: 50, feePerStudent: 250
  });

  // 自動計算總收支
  const financialSummary = useMemo(() => {
    const revenue = financeConfig.totalStudents * financeConfig.feePerStudent;
    const expense = (financeConfig.nTeam * financeConfig.costTeam) + 
                    (financeConfig.nTrain * financeConfig.costTrain) + 
                    (financeConfig.nHobby * financeConfig.costHobby);
    return { revenue, expense, profit: revenue - expense };
  }, [financeConfig]);

  // Dashboard 統計數據
  const dashboardStats = useMemo(() => {
    const now = new Date();
    const todayZero = new Date(now.setHours(0,0,0,0));
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTrainings = schedules.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    const futureCompetitions = competitions
      .filter(c => new Date(c.date) >= todayZero)
      .sort((a,b) => new Date(a.date) - new Date(b.date));
    
    let daysToNextMatch = "-";
    if (futureCompetitions.length > 0) {
      const nextMatchDate = new Date(futureCompetitions[0].date);
      const diffTime = Math.abs(nextMatchDate - todayZero);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      daysToNextMatch = diffDays === 0 ? "Today!" : `${diffDays}`;
    }

    const awardsThisYear = awards.filter(a => {
      const d = new Date(a.date);
      return d.getFullYear() === currentYear;
    }).length;

    return {
      thisMonthTrainings,
      daysToNextMatch,
      awardsThisYear
    };
  }, [schedules, competitions, awards]);

  // 相簿分組邏輯
  const galleryAlbums = useMemo(() => {
    const albums = {};
    galleryItems.forEach(item => {
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

  // 章別定義
  const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 400, level: 4, desc: "最高榮譽" },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-50", icon: "🥇", border: "border-yellow-200", shadow: "shadow-yellow-100", basePoints: 200, level: 3, desc: "卓越表現" },
    "銀章": { color: "text-slate-500", bg: "bg-slate-100", icon: "🥈", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 100, level: 2, desc: "進步神速" },
    "銅章": { color: "text-orange-600", bg: "bg-orange-50", icon: "🥉", border: "border-orange-200", shadow: "shadow-orange-100", basePoints: 30, level: 1, desc: "初露鋒芒" },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", border: "border-slate-100", shadow: "shadow-transparent", basePoints: 0, level: 0, desc: "努力中" }
  };

  // --- 設定 Favicon ---
  useEffect(() => {
    const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
    const logoUrl = systemConfig.schoolLogo || defaultLogoUrl;

    const link = document.querySelector("link[rel~='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'icon';
    link.href = logoUrl;
    document.getElementsByTagName('head')[0].appendChild(link);
    document.title = "BCKLAS 壁球校隊系統";
  }, [systemConfig.schoolLogo]);

  // --- Firebase Auth 監聽 ---
  useEffect(() => {
    const safetyTimeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { 
        console.error("Auth Error:", err);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      clearTimeout(safetyTimeout);
    });
    return () => {
      unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  // --- Firestore 資料即時監聽 ---
  useEffect(() => {
    if (!user) return;
    
    try {
      const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
      const attendanceLogsRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs');
      const competitionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
      const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
      const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles');
      const galleryRef = collection(db, 'artifacts', appId, 'public', 'data', 'gallery'); 
      const awardsRef = collection(db, 'artifacts', appId, 'public', 'data', 'awards');
      
      const systemConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');
      const financeConfigRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'finance');

      const unsubSystemConfig = onSnapshot(systemConfigRef, (docSnap) => {
        if (docSnap.exists()) setSystemConfig(docSnap.data());
        else setDoc(systemConfigRef, { adminPassword: 'admin', announcements: [], seasonalTheme: 'default', schoolLogo: null });
      }, (e) => console.error("Config err", e));

      const unsubFinanceConfig = onSnapshot(financeConfigRef, (docSnap) => {
        if (docSnap.exists()) {
          setFinanceConfig(prev => ({...prev, ...docSnap.data()}));
        } else {
          setDoc(financeConfigRef, financeConfig);
        }
      }, (e) => console.error("Finance err", e));
      
      const unsubStudents = onSnapshot(studentsRef, (snap) => {
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubAttendanceLogs = onSnapshot(attendanceLogsRef, (snap) => {
        setAttendanceLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubCompetitions = onSnapshot(competitionsRef, (snap) => {
        setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubSchedules = onSnapshot(schedulesRef, (snap) => {
        setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubFiles = onSnapshot(filesRef, (snap) => {
        setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubGallery = onSnapshot(galleryRef, (snap) => {
        setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      const unsubAwards = onSnapshot(awardsRef, (snap) => {
        setAwards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });

      return () => { 
        unsubSystemConfig(); unsubFinanceConfig(); unsubStudents(); unsubAttendanceLogs(); unsubCompetitions(); unsubSchedules(); unsubFiles(); unsubGallery(); unsubAwards();
      };
    } catch (e) {
      console.error("Firestore Init Error:", e);
    }
  }, [user]);

  // --- 登入邏輯 ---
  const handleLogin = (type, data) => {
    if (type === 'admin') {
      if (data.password === systemConfig.adminPassword) {
        setRole('admin'); 
        setShowLoginModal(false); 
        setActiveTab('dashboard');
      } else { alert('管理員密碼錯誤 (預設: admin)'); }
    } else {
      const student = students.find(s => s.class === data.className.toUpperCase() && s.classNo === data.classNo);
      if (student) {
        setRole('student'); 
        setCurrentUserInfo(student); 
        setShowLoginModal(false); 
        // [Fix 4.0] 學生登入後，優先顯示「比賽與公告」，而非積分榜
        setActiveTab('competitions'); 
      } else { alert('找不到學員資料，請檢查班別及班號'); }
    }
  };

  const handleLogout = () => { 
    setRole(null); 
    setCurrentUserInfo(null); 
    setShowLoginModal(true); 
    setSidebarOpen(false);
  };

  // --- 積分計算與排行邏輯 ---
  const rankedStudents = useMemo(() => {
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

    const uniqueStudents = Array.from(uniqueMap.values());

    return uniqueStudents.map(s => ({ 
      ...s, 
      totalPoints: Number(s.points) || 0 // 不再加章別底分，直接顯示 DB 積分
    })).sort((a, b) => {
      // 1. 先比總分 (高分在前)
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      
      // 2. 同分決勝：先到先得 (lastUpdated 時間較早的在前)
      const timeA = a.lastUpdated?.seconds || Infinity;
      const timeB = b.lastUpdated?.seconds || Infinity;
      return timeA - timeB;
    });
  }, [students]);

  // --- 財務儲存 ---
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

  // --- 積分調整 ---
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

  // 內部聯賽：提交對戰結果
  const handleMatchSubmit = async () => {
    if (!matchWinner || !matchLoser) {
      alert("請選擇勝方和負方");
      return;
    }
    if (matchWinner === matchLoser) {
      alert("勝負雙方不能是同一人");
      return;
    }

    const winner = students.find(s => s.id === matchWinner);
    const loser = students.find(s => s.id === matchLoser);

    if (!winner || !loser) return;

    const winnerRank = rankedStudents.findIndex(s => s.id === winner.id) + 1;
    const loserRank = rankedStudents.findIndex(s => s.id === loser.id) + 1;
    
    const winnerBadgeLevel = BADGE_DATA[winner.badge]?.level || 0;
    const loserBadgeLevel = BADGE_DATA[loser.badge]?.level || 0;

    // 判斷巨人殺手條件
    const isRankGiantKiller = (winnerRank - loserRank) >= 5;
    const isBadgeGiantKiller = winnerBadgeLevel < loserBadgeLevel;

    const isGiantKiller = isRankGiantKiller || isBadgeGiantKiller;
    const pointsToAdd = isGiantKiller ? 20 : 10;
    
    const confirmMsg = `⚔️ 確認對戰結果？\n\n` + 
                       `🏆 勝方: ${winner.name} (排名:${winnerRank}, ${winner.badge})\n` +
                       `💀 負方: ${loser.name} (排名:${loserRank}, ${loser.badge})\n\n` +
                       `${isGiantKiller ? "🔥 觸發「巨人殺手」獎勵！\n" : ""}` + 
                       `勝方獲得: +${pointsToAdd} 分\n負方獲得: +0 分`;

    if (confirm(confirmMsg)) {
        setIsUpdating(true);
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', winner.id), { 
                points: increment(pointsToAdd),
                lastUpdated: serverTimestamp() 
            });
            
            alert("✅ 成績已錄入！");
            setMatchWinner('');
            setMatchLoser('');
        } catch(e) {
            console.error(e);
            alert("錄入失敗");
        }
        setIsUpdating(false);
    }
  };

  // 賽季重置功能
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

  // 自動化點名
  const markAttendance = async (student) => {
    if (!todaySchedule) { 
      alert('⚠️ 今日沒有設定訓練日程，請先到「訓練日程」新增今天的課堂。'); 
      return; 
    }
    
    const todayStr = todaySchedule.date;
    const isAttended = attendanceLogs.some(log => 
      log.studentId === student.id && 
      log.date === todayStr && 
      log.trainingClass === todaySchedule.trainingClass
    );

    if (isAttended) {
      alert(`⚠️ ${student.name} 已經點過名了！`);
      return;
    }

    if (confirm(`確認為 ${student.name} 進行「${todaySchedule.trainingClass}」點名？\n\n🎁 系統將自動為該學員增加 10 積分！`)) {
      try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'attendance_logs'), {
          studentId: student.id,
          name: student.name,
          class: student.class,
          classNo: student.classNo,
          trainingClass: todaySchedule.trainingClass,
          date: todaySchedule.date,
          location: todaySchedule.location,
          timestamp: serverTimestamp()
        });

        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'students', student.id), { 
          points: increment(10),
          lastUpdated: serverTimestamp()
        });
      } catch (e) {
        console.error(e);
        alert('點名失敗，請檢查網絡');
      }
    }
  };

  // 自動生成比賽名單
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

  // 匯出 CSV 報表功能
  const exportAttendanceCSV = (targetClass) => {
    const logs = attendanceLogs.filter(l => targetClass === 'ALL' || l.trainingClass === targetClass);
    
    if (logs.length === 0) {
      alert('⚠️ 沒有找到相關的點名紀錄');
      return;
    }

    logs.sort((a,b) => a.date.localeCompare(b.date) || a.class.localeCompare(b.class) || a.name.localeCompare(b.name));
    
    let csvContent = "\uFEFF"; 
    csvContent += "日期,訓練班別,地點,學生姓名,班級,班號,記錄時間\n";
    
    logs.forEach(l => {
      const time = l.timestamp ? new Date(l.timestamp.seconds * 1000).toLocaleTimeString() : 'N/A';
      csvContent += `${l.date},${l.trainingClass},${l.location},${l.name},${l.class},${l.classNo},${time}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${targetClass === 'ALL' ? '全部班級' : targetClass}_出席紀錄_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- 智能壓縮圖片 Helper Function ---
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024; // 限制最大寬度
          const MAX_HEIGHT = 1024;
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
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  // --- 新增花絮功能 ---
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

  // --- CSV 工具 ---
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
        const [name, cls, no, badge, initPoints, squashClass] = cols;
        if (name && name !== "姓名") {
          batch.set(doc(colRef), { 
            name, 
            class: (cls || '1A').toUpperCase(), 
            classNo: no || '0', 
            badge: badge || '無', 
            points: Number(initPoints) || 100, 
            squashClass: squashClass || '', 
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

  const deleteItem = async (col, id) => {
    if (role !== 'admin') return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
  };

  const todaySchedule = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return schedules.find(s => s.date === today);
  }, [schedules]);

  const uniqueTrainingClasses = useMemo(() => {
    const classes = schedules.map(s => s.trainingClass).filter(Boolean);
    return ['ALL', ...new Set(classes)];
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    const filtered = selectedClassFilter === 'ALL' 
      ? schedules 
      : schedules.filter(s => s.trainingClass === selectedClassFilter);
    return filtered.sort((a,b) => a.date.localeCompare(b.date));
  }, [schedules, selectedClassFilter]);

  const filteredStudents = useMemo(() => {
    return rankedStudents.filter(s => 
      s.name.includes(searchTerm) || 
      s.class.includes(searchTerm.toUpperCase())
    );
  }, [rankedStudents, searchTerm]);

  const studentsInSelectedAttendanceClass = useMemo(() => {
    const sorted = [...students].sort((a,b) => a.class.localeCompare(b.class));
    if (attendanceClassFilter === 'ALL') return sorted;
    return sorted.filter(s => {
      if (!s.squashClass) return false;
      return s.squashClass.includes(attendanceClassFilter);
    });
  }, [students, attendanceClassFilter]);

  const downloadTemplate = (type) => {
    let csv = "";
    let filename = "";
    if(type === 'schedule') {
      csv = "班別名稱,日期(YYYY-MM-DD),地點,教練,備註\n初級班A,2024-03-20,學校壁球場,王教練,第一課\n校隊訓練,2024-03-25,歌和老街,李教練,專項訓練";
      filename = "訓練日程匯入範本.csv";
    } else {
      csv = "姓名,班別,班號,章別(無/銅章/銀章/金章/白金章),初始積分,壁球班別\n陳小明,6A,01,銅章,120,校隊訓練班\n張小華,5C,12,無,100,壁球中級訓練班";
      filename = "學員匯入範本.csv";
    }
    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  // --- 校徽 Logo 組件 ---
  const SchoolLogo = ({ size = 48, className = "" }) => {
    const [error, setError] = useState(false);
    const defaultLogoUrl = "https://cdn.jsdelivr.net/gh/ckysams-lab/Squash_reactweb@56552b6e92b3e5d025c5971640eeb4e5b1973e13/image%20(1).png";
    const logoUrl = systemConfig.schoolLogo || defaultLogoUrl;

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

  // 新增獎項功能
  const handleAddAward = async () => {
    const title = prompt("獎項名稱 (例如：全港學界壁球賽 冠軍):");
    if (!title) return;
    const studentName = prompt("獲獎學生姓名:");
    if (!studentName) return;
    const date = prompt("獲獎日期 (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
    const rank = prompt("名次 (例如：冠軍, 亞軍, 季軍, 優異):");
    const desc = prompt("備註 (可選):") || "";

    try {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'awards'), {
            title,
            studentName,
            date,
            rank,
            description: desc,
            timestamp: serverTimestamp()
        });
        alert('🏆 獎項新增成功！');
    } catch (e) {
        console.error(e);
        alert('新增失敗');
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* 隱藏的 Input 供花絮上傳使用 */}
      <input 
        type="file" 
        ref={galleryInputRef} 
        className="hidden" 
        accept="image/*"
        multiple 
        onChange={handleGalleryImageUpload}
      />

      {/* 燈箱 Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300" 
          onClick={() => setViewingImage(null)}
        >
          <button onClick={() => setViewingImage(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20 hover:text-white transition-all z-50">
            <X size={32} />
          </button>
          <div className="relative max-w-full max-h-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
             <img src={viewingImage.url} alt={viewingImage.title} className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"/>
             <div className="mt-6 text-center text-white">
                 <h3 className="text-2xl font-bold">{viewingImage.title}</h3>
                 {viewingImage.description && <p className="text-sm text-white/70 mt-2 max-w-2xl mx-auto">{viewingImage.description}</p>}
             </div>
          </div>
        </div>
      )}

      {/* 登入視窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border border-white/50 transform transition-all duration-700">
            <div className="flex justify-center mb-10">
              <SchoolLogo className="text-white" size={80} />
            </div>
            <h2 className="text-4xl font-black text-center text-slate-800 mb-2">正覺壁球</h2>
            <p className="text-center text-slate-400 font-bold mb-10">BCKLAS Squash Team System</p>
            <div className="space-y-6">
              <div className="bg-slate-50 p-1 rounded-[2rem] flex mb-4">
                <button className="flex-1 py-3 text-sm font-black text-blue-600 bg-white rounded-[1.8rem] shadow-sm">學員入口</button>
                <button onClick={() => {
                  const p = prompt('請輸入教練管理密碼'); 
                  if(p === systemConfig.adminPassword) { setRole('admin'); setShowLoginModal(false); setActiveTab('dashboard'); }
                  else if(p) alert('密碼錯誤 (預設: admin)');
                }} className="flex-1 py-3 text-sm font-black text-slate-400 hover:text-slate-600">教練登入</button>
              </div>
              <div className="space-y-3 font-bold">
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><Layers size={18}/></span>
                  <input id="stdClass" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="班別 (如: 6A)" />
                </div>
                <div className="relative">
                  <span className="absolute left-5 top-5 text-slate-300"><UserCheck size={18}/></span>
                  <input id="stdNo" className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white transition-all rounded-2xl p-5 pl-14 outline-none text-lg" placeholder="班號 (如: 05)" />
                </div>
                <button onClick={() => {
                  const c = document.getElementById('stdClass').value.toUpperCase();
                  const n = document.getElementById('stdNo').value;
                  handleLogin('student', { className: c, classNo: n });
                }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                  進入系統
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-300 mt-10 font-bold uppercase tracking-widest">BCKLAS Management v{CURRENT_VERSION}</p>
          </div>
        </div>
      )}
      
      {/* 側邊欄 */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-80 bg-white border-r transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 h-full flex flex-col font-bold">
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className="flex items-center justify-center">
               <SchoolLogo size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] -mt-1">BCKLAS SYSTEM v{CURRENT_VERSION}</p>
            </div>
          </div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto">
            <div className="text-[10px] text-slate-300 uppercase tracking-widest mb-4 px-6">主選單</div>
            
            {role === 'admin' && (
              <button onClick={() => {setActiveTab('dashboard'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                <LayoutDashboard size={20}/> 管理概況
              </button>
            )}
            
            <button onClick={() => {setActiveTab('rankings'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'rankings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Trophy size={20}/> 積分排行
            </button>
            {/* [Fix 3.9] 新增「內部聯賽」按鈕 */}
            <button onClick={() => {setActiveTab('league'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'league' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Swords size={20}/> 內部聯賽
            </button>
            <button onClick={() => {setActiveTab('gallery'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'gallery' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <ImageIcon size={20}/> 精彩花絮
            </button>
            <button onClick={() => {setActiveTab('awards'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'awards' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Award size={20}/> 獎項成就
            </button>
            <button onClick={() => {setActiveTab('schedules'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'schedules' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <CalendarIcon size={20}/> 訓練日程
            </button>
            <button onClick={() => {setActiveTab('competitions'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'competitions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Megaphone size={20}/> 比賽與公告
            </button>

            {role === 'admin' && (
              <>
                <div className="text-[10px] text-slate-300 uppercase tracking-widest my-6 px-6 pt-6 border-t">教練工具</div>
                <button onClick={() => {setActiveTab('students'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Users size={20}/> 隊員管理
                </button>
                <button onClick={() => {setActiveTab('attendance'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <ClipboardCheck size={20}/> 快速點名
                </button>
                <button onClick={() => {setActiveTab('financial'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'financial' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <DollarSign size={20}/> 財務收支
                </button>
                <button onClick={() => {setActiveTab('settings'); setSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'}`}>
                  <Settings2 size={20}/> 系統設定
                </button>
              </>
            )}
          </nav>
          
          <div className="pt-10 border-t">
            <div className="bg-slate-50 rounded-3xl p-6 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                  {role === 'admin' ? <ShieldCheck size={20}/> : <User size={20}/>}
                </div>
                <div>
                  <p className="text-xs text-slate-400">登入身份</p>
                  <p className="text-sm font-black text-slate-800">{role === 'admin' ? '校隊教練' : currentUserInfo?.name}</p>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-xs font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2">
              <LogOut size={14}/> 登出系統
            </button>
          </div>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 h-screen overflow-y-auto relative bg-[#F8FAFC]">
        {/* 頂部標題 */}
        <header className="px-10 py-8 sticky top-0 bg-white/80 backdrop-blur-xl z-40 border-b flex justify-between items-center">
          <div className="flex items-center gap-6">
            <button onClick={()=>setSidebarOpen(true)} className="md:hidden p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-blue-600 transition-all">
              <Menu size={24}/>
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-800">
                {activeTab === 'rankings' && "🏆 積分排行榜"}
                {activeTab === 'dashboard' && "📊 管理總結"}
                {activeTab === 'students' && "👥 隊員檔案庫"}
                {activeTab === 'attendance' && "✅ 日程連動點名"}
                {activeTab === 'competitions' && "🏸 比賽資訊公告"}
                {activeTab === 'schedules' && "📅 訓練班日程表"}
                {/* [Fix 2.6] 花絮標題 */}
                {activeTab === 'gallery' && "📸 精彩花絮"}
                {/* [Fix 3.4] 新增標題 */}
                {activeTab === 'awards' && "🏆 獎項成就"}
                {/* [Fix 3.9] 新增標題 */}
                {activeTab === 'league' && "⚔️ 內部聯賽"}
                {activeTab === 'financial' && "💰 財務收支管理"}
                {activeTab === 'settings' && "⚙️ 系統核心設定"}
              </h1>
              {/* [Fix 1.1] 系統名修正 */}
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
          
          {/* 1. 積分排行 */}
          {activeTab === 'rankings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row justify-center items-end gap-6 mb-12 mt-10 md:mt-24">
                {rankedStudents.slice(0, 3).map((s, i) => {
                   let orderClass = "";
                   let sizeClass = "";
                   let gradientClass = "";
                   let iconColor = "";
                   let shadowClass = "";
                   let label = "";
                   let labelBg = "";

                   if (i === 0) { // 1st Place
                      orderClass = "order-1 md:order-2";
                      sizeClass = "w-full md:w-1/3 md:-mt-12 scale-105 md:scale-110 z-20"; 
                      gradientClass = "bg-gradient-to-b from-yellow-100 via-yellow-50 to-white border-yellow-300";
                      iconColor = "text-yellow-500";
                      shadowClass = "shadow-2xl shadow-yellow-200/50";
                      label = "CHAMPION";
                      labelBg = "bg-yellow-500";
                   } else if (i === 1) { // 2nd Place
                      orderClass = "order-2 md:order-1";
                      sizeClass = "w-full md:w-1/4 z-10"; 
                      gradientClass = "bg-gradient-to-b from-slate-200 via-slate-50 to-white border-slate-300";
                      iconColor = "text-slate-500";
                      shadowClass = "shadow-xl shadow-slate-300/50";
                      label = "RUNNER-UP";
                      labelBg = "bg-slate-500";
                   } else { // 3rd Place
                      orderClass = "order-3 md:order-3";
                      sizeClass = "w-full md:w-1/4 z-10"; 
                      gradientClass = "bg-gradient-to-b from-orange-100 via-orange-50 to-white border-orange-300";
                      iconColor = "text-orange-500";
                      shadowClass = "shadow-xl shadow-orange-200/50";
                      label = "3RD PLACE";
                      labelBg = "bg-orange-500";
                   }

                   return (
                      <div key={s.id} className={`relative flex-shrink-0 flex flex-col items-center text-center ${orderClass} ${sizeClass} transition-all duration-500 hover:-translate-y-2`}>
                          <div className={`absolute inset-0 rounded-[3rem] border-4 ${gradientClass} ${shadowClass} overflow-hidden`}>
                               <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                                  <TrophyIcon size={120} className={i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : 'text-orange-600'}/>
                               </div>
                               <div className="absolute top-2 right-4 opacity-10 select-none pointer-events-none">
                                  <span className="text-9xl font-black font-mono tracking-tighter">{i+1}</span>
                               </div>
                          </div>

                          <div className="relative z-10 p-8 w-full h-full flex flex-col items-center">
                              {i === 0 && (
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce drop-shadow-lg">
                                  <Crown size={64} fill="currentColor" strokeWidth={1.5} />
                                </div>
                              )}
                              <div className={`w-24 h-24 mx-auto bg-white rounded-full border-4 border-white shadow-md flex items-center justify-center text-4xl font-black mb-4 ${iconColor}`}>
                                  {s.name[0]}
                                  <div className={`absolute -bottom-3 px-4 py-1 rounded-full text-[10px] text-white font-black tracking-widest ${labelBg} shadow-sm`}>
                                     {label}
                                  </div>
                              </div>
                              <div className="mt-4 w-full">
                                   <h3 className="text-2xl font-black text-slate-800 truncate">{s.name}</h3>
                                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{s.class} ({s.classNo})</p>
                                   <div className="my-6">
                                     <div className={`text-5xl font-black font-mono tracking-tight ${iconColor}`}>
                                        {s.totalPoints}
                                     </div>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Total Points</p>
                                   </div>
                                   <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-white/50 backdrop-blur-sm`}>
                                     <span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span>
                                     <span className="text-xs font-black text-slate-500">{s.badge}</span>
                                   </div>
                              </div>
                          </div>
                      </div>
                   )
                })}
              </div>

              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden font-bold">
                <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-xl font-black">全體隊員排名表</h3>
                  {role === 'admin' && (
                     <div className="flex gap-2">
                        <button 
                          onClick={() => adjustPoints('EXTERNAL_COMP_PARTICIPATION', 20)} // 這裡僅示範 UI，需選擇特定學生
                          className="px-4 py-2 bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-600 transition-all flex items-center gap-2"
                          title="需手動選擇學生操作，建議在下方列表操作"
                          disabled
                        >
                           <Award size={14}/> 外賽獎勵說明
                        </button>
                        <span className="text-[10px] text-slate-400 self-center">*請在下方列表為個別學生加分</span>
                     </div>
                  )}
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                    <input 
                      value={searchTerm}
                      onChange={(e)=>setSearchTerm(e.target.value)}
                      placeholder="搜尋姓名或班別..." 
                      className="w-full bg-white border rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-blue-600 transition-all shadow-sm"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-[0.2em] bg-slate-50 border-b font-black">
                      <tr>
                        <th className="px-8 py-6 text-center">排名</th>
                        <th className="px-8 py-6">隊員資料</th>
                        <th className="px-8 py-6">目前章別</th>
                        <th className="px-8 py-6 text-right">基礎分</th>
                        <th className="px-8 py-6 text-right">總分</th>
                        {role === 'admin' && <th className="px-8 py-6 text-center">教練操作</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s, i) => (
                        <tr key={s.id} className="group hover:bg-blue-50/30 transition-all">
                          <td className="px-8 py-8 text-center">
                            <span className={`inline-flex w-10 h-10 items-center justify-center rounded-xl text-sm font-black ${
                              i < 3 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                            }`}>
                              {i+1}
                            </span>
                          </td>
                          <td className="px-8 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-lg font-black text-slate-300 border group-hover:bg-white group-hover:text-blue-600 transition-all uppercase">
                                {s.name[0]}
                              </div>
                              <div>
                                <div className="font-black text-lg text-slate-800">{s.name}</div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Class {s.class} • No.{s.classNo}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border ${BADGE_DATA[s.badge]?.bg} ${BADGE_DATA[s.badge]?.color} ${BADGE_DATA[s.badge]?.border} shadow-sm`}>
                              <span className="text-lg">{BADGE_DATA[s.badge]?.icon}</span>
                              <span className="text-xs font-black">{s.badge}</span>
                            </div>
                          </td>
                          <td className="px-8 py-8 text-right font-mono text-slate-400">{s.points}</td>
                          <td className="px-8 py-8 text-right font-mono text-3xl text-blue-600 font-black">{s.totalPoints}</td>
                          {role === 'admin' && (
                            <td className="px-8 py-8">
                              <div className="flex justify-center gap-2">
                                <button onClick={()=>adjustPoints(s.id, 10)} className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="+10分"><Plus size={18}/></button>
                                <button onClick={()=>adjustPoints(s.id, -10)} className="p-3 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-600 hover:text-white transition-all" title="-10分"><MinusCircle size={18}/></button>
                                {/* [Fix 3.9] 新增外賽獎勵按鈕 */}
                                <button 
                                  onClick={()=> {
                                      if(confirm(`確認給予 ${s.name} 外賽獎勵 (+20分)?`)) adjustPoints(s.id, 20);
                                  }} 
                                  className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" 
                                  title="+20分 (外賽獎勵)"
                                >
                                    <Award size={18}/>
                                </button>
                                <button 
                                  onClick={() => {
                                    if(confirm(`確定要永久刪除 ${s.name} (${s.class} ${s.classNo}) 嗎？`)) {
                                      deleteItem('students', s.id);
                                    }
                                  }} 
                                  className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                                  title="永久刪除"
                                >
                                  <Trash2 size={18}/>
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

           {/* [Fix 3.9] 內部聯賽 (League) */}
           {activeTab === 'league' && role === 'admin' && (
              <div className="space-y-10 animate-in fade-in duration-500 font-bold">
                 <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-5 rotate-12"><Swords size={200}/></div>
                    
                    <div className="relative z-10 text-center mb-12">
                       <h3 className="text-4xl font-black mb-2">⚔️ 內部聯賽對戰錄入</h3>
                       <p className="text-slate-400">系統將自動判定排名與章別，計算積分獎勵</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                       <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-emerald-100 text-center">
                          <h4 className="text-2xl font-black text-emerald-600 mb-6">🏆 勝方 (Winner)</h4>
                          <select 
                             className="w-full p-4 rounded-2xl border-none outline-none text-center font-black text-lg shadow-sm"
                             value={matchWinner}
                             onChange={(e) => setMatchWinner(e.target.value)}
                          >
                             <option value="">選擇勝方隊員</option>
                             {rankedStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.badge}) - Rank {rankedStudents.indexOf(s)+1}</option>
                             ))}
                          </select>
                       </div>

                       <div className="bg-rose-50 p-8 rounded-[3rem] border-2 border-rose-100 text-center">
                          <h4 className="text-2xl font-black text-rose-600 mb-6">💀 負方 (Loser)</h4>
                          <select 
                             className="w-full p-4 rounded-2xl border-none outline-none text-center font-black text-lg shadow-sm"
                             value={matchLoser}
                             onChange={(e) => setMatchLoser(e.target.value)}
                          >
                             <option value="">選擇負方隊員</option>
                             {rankedStudents.map(s => (
                                <option key={s.id} value={s.id}>{s.name} ({s.badge}) - Rank {rankedStudents.indexOf(s)+1}</option>
                             ))}
                          </select>
                       </div>
                    </div>

                    <div className="mt-12 flex justify-center relative z-10">
                        <button 
                           onClick={handleMatchSubmit}
                           className="bg-slate-900 text-white px-12 py-5 rounded-[2.5rem] text-xl font-black shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                        >
                           <Swords size={28}/> 提交對戰結果
                        </button>
                    </div>

                    <div className="mt-8 text-center text-xs text-slate-400 font-bold">
                       <p>✨ 規則：基礎勝利 +10 分</p>
                       {/* [Fix 3.9.1] 轉義 > 符號 */}
                       <p className="mt-1">🔥 巨人殺手：低章贏高章 或 贏高於自己 5 名以上對手 -&gt; <span className="text-orange-500">+20 分</span></p>
                    </div>
                 </div>
              </div>
           )}

          {/* ... (其他 Tab 保持不變：schedules, competitions, gallery, awards, students, attendance, financial, settings) ... */}
          
          {/* 7. 系統設定 (Settings) - [Fix 3.9] 增加賽季重置 */}
          {activeTab === 'settings' && role === 'admin' && (
             <div className="max-w-2xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-3xl font-black mb-10 text-center">系統偏好設定</h3>
                   {/* ... (原有設定) ... */}
                   
                   <div className="pt-8 border-t border-slate-100 space-y-4">
                        {/* [Fix 3.9] 賽季重置按鈕 */}
                        <div className="p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100 mb-6">
                           <h4 className="text-orange-600 font-black mb-2 flex items-center gap-2"><History/> 新賽季重置</h4>
                           <p className="text-xs text-slate-400 mb-4">將所有學員積分重置為該章別的起步底分 (金:200, 銀:100...)。</p>
                           <button 
                             onClick={handleSeasonReset}
                             className="w-full bg-white text-orange-600 border-2 border-orange-200 py-3 rounded-2xl font-black hover:bg-orange-600 hover:text-white transition-all"
                           >
                             重置積分 (開啟新賽季)
                           </button>
                        </div>

                        <button 
                          onClick={async ()=>{
                            setIsUpdating(true);
                            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), systemConfig);
                            setIsUpdating(false);
                            alert('系統設定已更新！');
                          }}
                          className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                          <Save size={24}/> 保存設定
                        </button>
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
                          <Info className="text-blue-500 shrink-0" size={20}/>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            修改密碼後請妥善保存，否則將無法進入教練後台。系統預設密碼為 "admin"。
                          </p>
                        </div>
                   </div>
                </div>
                {/* ... */}
                <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
                  Copyright © 2026 正覺壁球. All Rights Reserved.
                </div>
             </div>
          )}

          {/* 為保持代碼簡潔，這裡省略未變動的 Tab 代碼 (schedules, competitions, gallery, awards, students, attendance, financial)，請保留原樣 */}
          {/* ... (Paste previous tabs code here) ... */}
          
          {/* 補回省略的 tabs 以確保完整性 (Version 3.9 Full Restore) */}
          {activeTab === 'schedules' && (
            <div className="space-y-8 animate-in fade-in duration-500 font-bold">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><CalendarIcon/></div>
                    <div>
                      <h3 className="text-xl font-black">訓練班日程表</h3>
                      <p className="text-xs text-slate-400 mt-1">查看各級訓練班的日期與地點安排</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600" size={18}/>
                      <select 
                        value={selectedClassFilter} 
                        onChange={(e)=>setSelectedClassFilter(e.target.value)}
                        className="w-full md:w-60 bg-slate-50 border-none outline-none pl-12 pr-6 py-4 rounded-2xl text-sm font-black appearance-none cursor-pointer hover:bg-slate-100 transition-all shadow-inner"
                      >
                        {uniqueTrainingClasses.map(c => (
                          <option key={c} value={c}>{c === 'ALL' ? '🌍 全部訓練班' : `🏸 ${c}`}</option>
                        ))}
                      </select>
                    </div>

                    {role === 'admin' && (
                      <div className="flex gap-2">
                         <button onClick={()=>downloadTemplate('schedule')} className="p-4 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-2xl border transition-all" title="下載日程範本"><Download size={20}/></button>
                         <label className="bg-blue-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all font-black text-sm">
                           <Upload size={18}/> 匯入 CSV 日程
                           <input type="file" className="hidden" accept=".csv" onChange={handleCSVImportSchedules}/>
                         </label>
                      </div>
                    )}
                  </div>
               </div>

               {filteredSchedules.length === 0 ? (
                 <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><CalendarIcon size={40}/></div>
                    <p className="text-xl font-black text-slate-400">目前暫無訓練日程紀錄</p>
                    <p className="text-sm text-slate-300 mt-2">請點擊上方匯入按鈕上傳 CSV 檔案</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSchedules.map(sc => {
                      const isToday = new Date().toISOString().split('T')[0] === sc.date;
                      return (
                        <div key={sc.id} className={`bg-white p-10 rounded-[3.5rem] border-2 shadow-sm hover:scale-[1.02] transition-all relative overflow-hidden group ${isToday ? 'border-blue-500 shadow-xl shadow-blue-50' : 'border-slate-100'}`}>
                           {isToday && (
                             <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest animate-pulse">
                               Today • 今日訓練
                             </div>
                           )}
                           <div className="mb-8">
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-4 py-2 rounded-full font-black uppercase tracking-widest border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                {sc.trainingClass}
                              </span>
                              <h4 className="text-3xl font-black text-slate-800 mt-6">{sc.date}</h4>
                              <p className="text-[10px] text-slate-300 font-bold mt-1 uppercase tracking-[0.3em]">Training Session</p>
                           </div>
                           
                           <div className="space-y-5">
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500"><MapPin size={18}/></div>
                                <span className="font-bold">{sc.location}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-600">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-blue-500"><UserCheck size={18}/></div>
                                <span className="font-bold">{sc.coach} 教練</span>
                              </div>
                              {/* 新增：手動刪除按鈕 */}
                              {role === 'admin' && (
                                <button 
                                  onClick={() => {
                                    if(window.confirm(`確定要刪除 ${sc.date} 的這堂訓練課嗎？`)) {
                                      deleteItem('schedules', sc.id);
                                    }
                                  }}
                                  className="absolute top-8 right-8 w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm z-10"
                                  title="刪除課堂"
                                >
                                  <Trash2 size={20}/>
                                </button>
                              )}
                              {sc.notes && (
                                <div className="p-6 bg-slate-50 rounded-[2rem] text-xs text-slate-400 leading-relaxed italic border border-slate-100">
                                  "{sc.notes}"
                                </div>
                              )}
                           </div>
                           
                           {role === 'admin' && (
                             <div className="mt-10 pt-8 border-t border-dashed border-slate-100 opacity-0 group-hover:opacity-100 transition-all flex justify-end">
                               <button onClick={()=>deleteItem('schedules', sc.id)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                             </div>
                           )}
                        </div>
                      );
                    })}
                 </div>
               )}
            </div>
          )}

          {/* 3. 快速點名 (過濾多班別學員不重複) */}
          {activeTab === 'attendance' && role === 'admin' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-bold">
               <div className={`p-12 rounded-[4rem] text-white flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden transition-all duration-1000 ${todaySchedule ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-slate-800'}`}>
                  <div className="absolute -right-20 -bottom-20 opacity-10 rotate-12"><ClipboardCheck size={300}/></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl font-black flex items-center gap-4 mb-4">教練點名工具 <Clock size={32}/></h3>
                    <div className="flex flex-wrap gap-4">
                      {todaySchedule ? (
                        <>
                          <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <Star size={14} className="text-yellow-300 fill-yellow-300"/>
                            <span className="text-sm font-black">今日：{todaySchedule.trainingClass}</span>
                          </div>
                          <div className="bg-white/20 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 flex items-center gap-2">
                            <MapPin size={14}/>
                            <span className="text-sm font-black">{todaySchedule.location}</span>
                          </div>
                        </>
                      ) : (
                        <div className="bg-slate-700/50 backdrop-blur-md px-5 py-2 rounded-full border border-white/5 flex items-center gap-2">
                          <Info size={14}/>
                          <span className="text-sm font-black text-slate-300 font-bold">今日無預設訓練，進行一般點名</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="relative z-10 bg-white/10 px-10 py-6 rounded-[2.5rem] backdrop-blur-md mt-10 md:mt-0 text-center border border-white/10 shadow-inner">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-blue-100 font-black opacity-60">Today's Date</p>
                    <p className="text-2xl font-black mt-1 font-mono">{new Date().toLocaleDateString()}</p>
                  </div>
               </div>

               {/* [Fix 2.2] 新增：報表匯出中心 */}
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-8">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><FileBarChart size={24}/></div>
                   <div>
                     <h4 className="font-black text-slate-800">出席率報表中心</h4>
                     <p className="text-[10px] text-slate-400 font-bold">匯出 CSV 檢查各班出席狀況</p>
                   </div>
                 </div>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => exportAttendanceCSV('ALL')}
                     className="px-6 py-3 bg-slate-50 text-slate-500 hover:bg-slate-100 rounded-2xl text-xs font-black transition-all"
                   >
                     匯出全部紀錄
                   </button>
                   {/* 這裡可以根據 selectedClassFilter 匯出特定班別 */}
                   {attendanceClassFilter !== 'ALL' && (
                     <button 
                       onClick={() => exportAttendanceCSV(attendanceClassFilter)}
                       className="px-6 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
                     >
                       <Download size={16}/> 匯出 {attendanceClassFilter} 報表
                     </button>
                   )}
                 </div>
               </div>

               {/* 壁球班別篩選選單 */}
               <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
                 <div className="flex items-center gap-3 text-slate-400 min-w-max">
                   <Filter size={20} />
                   <span>選擇點名班別：</span>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   {uniqueTrainingClasses.map(cls => (
                     <button
                       key={cls}
                       onClick={() => setAttendanceClassFilter(cls)}
                       className={`px-6 py-3 rounded-2xl text-sm font-black transition-all ${
                         attendanceClassFilter === cls 
                         ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                         : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border border-slate-100'
                       }`}
                     >
                       {cls === 'ALL' ? '🌍 全部學員' : cls}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {studentsInSelectedAttendanceClass.length > 0 ? (
                    studentsInSelectedAttendanceClass.map(s => {
                      // [Fix 2.2] 檢查是否已出席 (比對 DB 紀錄)
                      const isAttended = todaySchedule && attendanceLogs.some(log => 
                        log.studentId === s.id && 
                        log.date === todaySchedule.date && 
                        log.trainingClass === todaySchedule.trainingClass
                      );

                      return (
                        <button 
                          key={s.id} 
                          onClick={() => markAttendance(s)} // [Fix 2.2] 改為呼叫寫入資料庫的函數
                          className={`group p-8 rounded-[3rem] border shadow-sm transition-all flex flex-col items-center text-center relative overflow-hidden ${
                            isAttended 
                            ? 'bg-emerald-50 border-emerald-200 shadow-emerald-50 cursor-default' 
                            : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50'
                          }`}
                        >
                           <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl mb-4 transition-all font-black uppercase ${
                             isAttended
                             ? 'bg-emerald-200 text-white rotate-12'
                             : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-6'
                           }`}>
                              {s.name[0]}
                           </div>
                           <p className={`font-black text-xl transition-all ${isAttended ? 'text-emerald-700' : 'text-slate-800 group-hover:text-blue-600'}`}>{s.name}</p>
                           <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{s.class} ({s.classNo})</p>
                           <div className="mt-1 text-[10px] text-blue-500 font-bold truncate max-w-full px-2" title={s.squashClass}>
                             {s.squashClass}
                           </div>
                           
                           {/* [Fix 2.2] 狀態圖示 */}
                           <div className={`absolute top-4 right-4 transition-all ${isAttended ? 'text-emerald-500' : 'text-slate-100 group-hover:text-blue-100'}`}>
                              <CheckCircle2 size={24}/>
                           </div>
                           
                           {isAttended && (
                             <div className="absolute bottom-0 left-0 right-0 bg-emerald-500 text-white text-[10px] py-1 font-black uppercase tracking-widest">
                               已出席
                             </div>
                           )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-20 text-center text-slate-300 font-bold bg-white rounded-[3rem] border border-dashed">
                      此班別暫無學員資料
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* 4. 比賽資訊與公告 */}
          {activeTab === 'competitions' && (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-500 font-bold">
                <div className="lg:col-span-2 space-y-8">
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
                               const date = prompt('比賽日期 (YYYY-MM-DD)');
                               if(title && date) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'competitions'), { title, date, createdAt: serverTimestamp() });
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
                              <div className="flex gap-6 items-center">
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
                                <button className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black hover:bg-blue-600 hover:text-white transition-all">查看詳情</button>
                                {role === 'admin' && <button onClick={()=>deleteItem('competitions', c.id)} className="p-3 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="space-y-8">
                   <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-20 -bottom-20 opacity-10"><FileText size={200}/></div>
                      <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
                        檔案下載中心 <Download size={20}/>
                      </h3>
                      <div className="space-y-4 relative z-10">
                         {downloadFiles.map(f => (
                           <a key={f.id} href={f.url} target="_blank" className="group block p-5 bg-white/10 border border-white/10 rounded-[2rem] flex items-center justify-between hover:bg-white hover:text-slate-900 transition-all duration-500">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-xl group-hover:bg-slate-100 group-hover:text-blue-600 transition-all"><FileSpreadsheet size={18}/></div>
                                <span className="text-sm font-black">{f.name}</span>
                              </div>
                              <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition-all"/>
                           </a>
                         ))}
                         {role === 'admin' && (
                           <button onClick={()=>{
                             const name = prompt('檔案顯示名稱');
                             const url = prompt('Google Drive 或連結 URL');
                             if(name && url) addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles'), { name, url, createdAt: serverTimestamp() });
                           }} className="w-full py-5 border-2 border-dashed border-white/20 rounded-[2rem] text-xs font-black text-white/30 hover:text-white hover:border-white transition-all flex items-center justify-center gap-2">
                             <Plus size={14}/> 上傳新資源
                           </button>
                         )}
                      </div>
                   </div>
                   
                   <div className="bg-blue-600 p-10 rounded-[3.5rem] text-white shadow-xl shadow-blue-100">
                      <h4 className="text-xl font-black mb-4">系統公告通知</h4>
                      <p className="text-sm text-blue-100/70 leading-relaxed font-bold">
                        本學期壁球訓練已全面數位化，請隊員定期查看「積分排行」並參與「訓練班日程」！
                      </p>
                      <button className="mt-8 px-6 py-3 bg-white text-blue-600 rounded-2xl text-xs font-black shadow-lg">了解更多</button>
                   </div>
                </div>
             </div>
          )}

           {/* [Fix 2.6] 精彩花絮頁面 */}
           {activeTab === 'gallery' && (
            <div className="space-y-10 animate-in fade-in duration-500 font-bold">
               <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-6">
                    {currentAlbum ? (
                        <button onClick={() => setCurrentAlbum(null)} className="p-4 bg-slate-100 text-slate-500 hover:text-blue-600 rounded-2xl transition-all">
                            <ArrowLeft size={24}/>
                        </button>
                    ) : (
                        <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl"><ImageIcon/></div>
                    )}
                    
                    <div>
                      <h3 className="text-xl font-black">{currentAlbum ? currentAlbum : "精彩花絮 (Gallery)"}</h3>
                      <p className="text-xs text-slate-400 mt-1">
                          {currentAlbum ? "瀏覽相簿內容" : "回顧訓練與比賽的珍貴時刻"}
                      </p>
                    </div>
                  </div>
                  
                  {role === 'admin' && (
                     <div className="flex items-center gap-3">
                         {isUploading && <span className="text-xs text-blue-600 animate-pulse font-bold">上傳壓縮中...</span>}
                         <button onClick={handleAddMedia} disabled={isUploading} className="bg-orange-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-orange-600 shadow-xl shadow-orange-100 transition-all font-black text-sm disabled:opacity-50">
                           <PlusCircle size={18}/> 新增相片/影片
                         </button>
                     </div>
                  )}
               </div>

               {galleryItems.length === 0 ? (
                 <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><ImageIcon size={40}/></div>
                    <p className="text-xl font-black text-slate-400">目前暫無花絮內容</p>
                    <p className="text-sm text-slate-300 mt-2">請教練新增精彩相片或影片</p>
                 </div>
               ) : (
                 <>
                    {!currentAlbum && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                             {galleryAlbums.map((album) => (
                                 <div 
                                    key={album.title} 
                                    onClick={() => setCurrentAlbum(album.title)}
                                    className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                                 >
                                     <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-6">
                                         {album.cover ? (
                                             album.type === 'video' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-900/5 text-slate-300">
                                                    <Video size={48}/>
                                                </div>
                                             ) : (
                                                <img src={album.cover} className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" alt="Cover"/>
                                             )
                                         ) : (
                                             <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                 <Folder size={48}/>
                                             </div>
                                         )}
                                         <div className="absolute bottom-3 right-3 bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-black backdrop-blur-sm">
                                             {album.count} 項目
                                         </div>
                                     </div>
                                     
                                     <div className="px-2 pb-2">
                                         <h4 className="font-black text-xl text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors">{album.title}</h4>
                                         <p className="text-xs text-slate-400 mt-1">
                                             點擊查看相簿內容 <ChevronRight size={12} className="inline ml-1"/>
                                         </p>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}

                    {currentAlbum && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {galleryItems
                                .filter(item => (item.title || "未分類") === currentAlbum)
                                .sort((a,b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                                .map(item => (
                                <div key={item.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                                    <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 mb-4">
                                        {item.type === 'video' ? (
                                        getYouTubeEmbedUrl(item.url) ? (
                                            <iframe 
                                                src={getYouTubeEmbedUrl(item.url)} 
                                                className="w-full h-full" 
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                allowFullScreen
                                                title={item.title}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                                                <Video size={48}/>
                                                <span className="ml-2 text-xs">影片連結無效</span>
                                            </div>
                                        )
                                        ) : (
                                        <img 
                                            src={item.url} 
                                            alt={item.title} 
                                            onClick={() => setViewingImage(item)} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700 cursor-zoom-in"
                                        />
                                        )}
                                        
                                        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 pointer-events-none">
                                        {item.type === 'video' ? <Video size={12}/> : <ImageIcon size={12}/>}
                                        {item.type === 'video' ? 'Video' : 'Photo'}
                                        </div>
                                    </div>
                                    
                                    <div className="px-2">
                                        <p className="text-xs text-slate-500 font-bold line-clamp-2">{item.description || "沒有描述"}</p>
                                    </div>

                                    {role === 'admin' && (
                                        <div className="mt-6 pt-4 border-t border-slate-50 flex justify-end">
                                            <button 
                                            onClick={() => {
                                                if(confirm('確定要刪除此項目嗎？')) deleteItem('gallery', item.id);
                                            }}
                                            className="text-slate-300 hover:text-red-500 p-2"
                                            >
                                            <Trash2 size={18}/>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                 </>
               )}
            </div>
           )}

           {/* [Fix 3.4] 新增「獎項成就 (Awards)」頁面 */}
           {activeTab === 'awards' && (
             <div className="space-y-8 animate-in fade-in duration-500 font-bold">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-6">
                     <div className="p-4 bg-yellow-100 text-yellow-600 rounded-2xl"><Award/></div>
                     <div>
                       <h3 className="text-xl font-black">獎項成就 (Hall of Fame)</h3>
                       <p className="text-xs text-slate-400 mt-1">紀錄校隊輝煌戰績</p>
                     </div>
                   </div>
                   
                   {role === 'admin' && (
                      <button onClick={handleAddAward} className="bg-yellow-500 text-white px-8 py-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:bg-yellow-600 shadow-xl shadow-yellow-100 transition-all font-black text-sm">
                        <PlusCircle size={18}/> 新增獎項
                      </button>
                   )}
                </div>
 
                {awards.length === 0 ? (
                  <div className="bg-white rounded-[3rem] p-20 border border-dashed flex flex-col items-center justify-center text-center">
                     <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6"><Trophy size={40}/></div>
                     <p className="text-xl font-black text-slate-400">目前暫無獎項紀錄</p>
                     <p className="text-sm text-slate-300 mt-2">請教練新增比賽獲獎紀錄</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                     {awards.sort((a,b) => b.date.localeCompare(a.date)).map((award) => (
                        <div key={award.id} className="relative group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-yellow-200 transition-all flex flex-col md:flex-row items-center gap-6">
                           <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 text-yellow-600 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0">
                             <Medal size={32}/>
                           </div>
                           <div className="flex-1 text-center md:text-left">
                              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-1">
                                <h4 className="text-xl font-black text-slate-800">{award.title}</h4>
                                <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[10px] font-black w-fit mx-auto md:mx-0">{award.rank}</span>
                              </div>
                              <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 text-sm text-slate-500">
                                 <span className="flex items-center justify-center gap-1"><User size={14}/> {award.studentName}</span>
                                 <span className="flex items-center justify-center gap-1"><CalendarIcon size={14}/> {award.date}</span>
                              </div>
                              {award.description && (
                                <p className="text-xs text-slate-400 mt-2 font-medium bg-slate-50 p-2 rounded-lg inline-block">“{award.description}”</p>
                              )}
                           </div>
                           
                           {role === 'admin' && (
                              <button 
                                onClick={() => {
                                   if(confirm(`確定要刪除 "${award.title}" 嗎？`)) deleteItem('awards', award.id);
                                }}
                                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              >
                                <Trash2 size={18}/>
                              </button>
                           )}
                        </div>
                     ))}
                  </div>
                )}
             </div>
            )}

          {/* [Fix 1.0] 修正：正確的財務組件渲染位置 */}
          {activeTab === 'financial' && role === 'admin' && (
             <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 font-bold">
                <div className="flex justify-end">
                  <button 
                      onClick={saveFinanceConfig}
                      className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                  >
                      <Save size={20} />
                      儲存財務設定
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6">
                      <TrendingUp size={32}/>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總收入</p>
                    <h3 className="text-4xl font-black text-emerald-500">${financialSummary.revenue.toLocaleString()}</h3>
                  </div>

                  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mb-6">
                      <Trash2 size={32}/>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計總支出</p>
                    <h3 className="text-4xl font-black text-rose-500">${financialSummary.expense.toLocaleString()}</h3>
                  </div>

                  <div className={`p-10 rounded-[3.5rem] border shadow-sm flex flex-col justify-center items-center text-center ${financialSummary.profit >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${financialSummary.profit >= 0 ? 'bg-white text-blue-600 shadow-sm' : 'bg-white text-rose-600 shadow-sm'}`}>
                      <DollarSign size={32}/>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計資助盈餘</p>
                    <h3 className={`text-4xl font-black ${financialSummary.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      ${financialSummary.profit.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shadow-sm"><Trash2 size={24}/></div>
                      <h4 className="text-2xl font-black text-slate-800">支出設定 (教練費)</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { label: '校隊教練次數', key: 'nTeam' }, { label: '單次校隊成本', key: 'costTeam' },
                        { label: '進階班次數', key: 'nTrain' }, { label: '單次進階成本', key: 'costTrain' },
                        { label: '趣味班次數', key: 'nHobby' }, { label: '單次趣味成本', key: 'costHobby' },
                      ].map(item => (
                        <div key={item.key}>
                          <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">{item.label}</label>
                          <input 
                            type="number" 
                            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-rose-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                            value={financeConfig[item.key]}
                            onChange={e => setFinanceConfig({...financeConfig, [item.key]: Number(e.target.value)})}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shadow-sm"><DollarSign size={24}/></div>
                      <h4 className="text-2xl font-black text-slate-800">預計收入 (學費)</h4>
                    </div>
                    <div className="space-y-10">
                      <div>
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">預計總人數</label>
                        <input 
                          type="number" 
                          className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                          value={financeConfig.totalStudents}
                          onChange={e => setFinanceConfig({...financeConfig, totalStudents: Number(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block">每位學員學費 ($)</label>
                        <input 
                          type="number" 
                          className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                          value={financeConfig.feePerStudent}
                          onChange={e => setFinanceConfig({...financeConfig, feePerStudent: Number(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          )}

          {/* 7. 系統設定 (教練專用) */}
          {activeTab === 'settings' && role === 'admin' && (
             <div className="max-w-2xl mx-auto space-y-10 animate-in zoom-in-95 duration-500 font-bold">
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <h3 className="text-3xl font-black mb-10 text-center">系統偏好設定</h3>
                   <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">管理員存取密碼</label>
                        <div className="relative">
                           <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                           <input 
                              type="password" 
                              value={systemConfig.adminPassword}
                              onChange={(e)=>setSystemConfig({...systemConfig, adminPassword: e.target.value})}
                              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-600 focus:bg-white p-5 pl-14 rounded-2xl outline-none transition-all"
                           />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">數據導入編碼</label>
                        <select 
                          value={importEncoding}
                          onChange={(e)=>setImportEncoding(e.target.value)}
                          className="w-full bg-slate-50 border-none p-5 rounded-2xl outline-none font-black cursor-pointer appearance-none shadow-inner"
                        >
                          <option value="AUTO">自動偵測 (推薦)</option>
                          <option value="UTF8">萬用編碼 (UTF-8)</option>
                          <option value="BIG5">繁體中文 (BIG5 - Excel 常用)</option>
                        </select>
                      </div>

                      {/* [Fix 2.7] 新增：校徽圖片上傳區域 */}
                      <div className="space-y-3">
                        <label className="text-xs text-slate-400 font-black uppercase tracking-widest px-2">學校校徽 (School Logo)</label>
                        <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-slate-100 transition-all cursor-pointer relative" onClick={() => document.getElementById('logoInput').click()}>
                           {systemConfig.schoolLogo ? (
                             <img src={systemConfig.schoolLogo} className="h-32 object-contain" alt="Current Logo"/>
                           ) : (
                             <div className="text-slate-300 flex flex-col items-center">
                               <ImageIcon size={48} className="mb-2"/>
                               <span className="text-xs font-bold">點擊上傳校徽圖片</span>
                             </div>
                           )}
                           <input 
                             id="logoInput"
                             type="file" 
                             className="hidden" 
                             accept="image/png, image/jpeg"
                             onChange={(e) => {
                               const file = e.target.files[0];
                               if(file) {
                                 if(file.size > 1024 * 1024) { // 1MB limit
                                   alert('圖片太大，請使用小於 1MB 的圖片');
                                   return;
                                 }
                                 const reader = new FileReader();
                                 reader.onload = (ev) => setSystemConfig({...systemConfig, schoolLogo: ev.target.result});
                                 reader.readAsDataURL(file);
                               }
                             }}
                           />
                           {systemConfig.schoolLogo && (
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setSystemConfig({...systemConfig, schoolLogo: null});
                               }}
                               className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-sm text-red-500 hover:bg-red-50"
                             >
                               <Trash2 size={16}/>
                             </button>
                           )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold px-2">建議使用背景透明的 PNG 圖片，檔案大小請小於 1MB 以確保讀取速度。</p>
                      </div>

                      <div className="pt-8 border-t border-slate-100 space-y-4">
                        {/* [Fix 3.9] 賽季重置按鈕 */}
                        <div className="p-6 bg-orange-50 rounded-[2.5rem] border border-orange-100 mb-6">
                           <h4 className="text-orange-600 font-black mb-2 flex items-center gap-2"><History/> 新賽季重置</h4>
                           <p className="text-xs text-slate-400 mb-4">將所有學員積分重置為該章別的起步底分 (金:200, 銀:100...)。</p>
                           <button 
                             onClick={handleSeasonReset}
                             className="w-full bg-white text-orange-600 border-2 border-orange-200 py-3 rounded-2xl font-black hover:bg-orange-600 hover:text-white transition-all"
                           >
                             重置積分 (開啟新賽季)
                           </button>
                        </div>

                        <button 
                          onClick={async ()=>{
                            setIsUpdating(true);
                            await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system'), systemConfig);
                            setIsUpdating(false);
                            alert('系統設定已更新！');
                          }}
                          className="w-full bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                          <Save size={24}/> 保存設定
                        </button>
                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center gap-4">
                          <Info className="text-blue-500 shrink-0" size={20}/>
                          <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                            修改密碼後請妥善保存，否則將無法進入教練後台。系統預設密碼為 "admin"。
                          </p>
                        </div>
                      </div>
                   </div>
                </div>
                
                <div className="p-8 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.5em]">
                  Copyright © 2026 正覺壁球. All Rights Reserved.
                </div>
             </div>
          )}

        </div>
      </main>
    </div>
  );
}
