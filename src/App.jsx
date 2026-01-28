import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  LayoutDashboard, Users, ClipboardCheck, DollarSign, Plus, Trash2, 
  UserCheck, Calendar as CalendarIcon, ShieldCheck, Menu, X, Loader2,
  Trophy, Megaphone, Upload, LogIn, LogOut, Lock, User, MinusCircle, PlusCircle, 
  Save, FileSpreadsheet, Download, FileText, Info, Link as LinkIcon, Settings2,
  ChevronRight, Search, Filter, History, Clock, MapPin, Layers, Award,
  Trophy as TrophyIcon, Star, Target, TrendingUp, ChevronDown, CheckCircle2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, onSnapshot, 
  addDoc, deleteDoc, query, orderBy, serverTimestamp, updateDoc, writeBatch, increment,
  limit
} from 'firebase/firestore';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// --- Firebase 初始化 ---
const firebaseConfig = {
  apiKey: "AIzaSyAYm_63S9pKMZ51Qb2ZlCHRsfuGzy2gstw",
  authDomain: "squashreact.firebaseapp.com",
  projectId: "squashreact",
  storageBucket: "squashreact.firebasestorage.app",
  messagingSenderId: "342733564194",
  appId: "1:342733564194:web:7345d90d7d22c0b605dd7b",
  measurementId: "G-JRZ0QSFLLQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'squash-management-v1';

// --- [等級勳章組件] ---
const RankBadge = ({ rank, points }) => {
  const getBadgeConfig = () => {
    if (rank === 1) return { icon: <Trophy className="text-yellow-400" size={14}/>, label: "傳奇球王", color: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    if (rank === 2) return { icon: <Award className="text-slate-400" size={14}/>, label: "頂尖高手", color: "bg-slate-50 text-slate-700 border-slate-200" };
    if (rank === 3) return { icon: <Award className="text-amber-600" size={14}/>, label: "領軍人物", color: "bg-amber-50 text-amber-700 border-amber-200" };
    if (rank <= 8) return { icon: <Star className="text-blue-400" size={14}/>, label: "八強精英", color: "bg-blue-50 text-blue-700 border-blue-200" };
    if (points >= 1000) return { icon: <CheckCircle2 className="text-emerald-500" size={14}/>, label: "精英球員", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    return null;
  };
  const badge = getBadgeConfig();
  if (!badge) return null;
  return (
    <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${badge.color}`}>
      {badge.icon} {badge.label}
    </div>
  );
};

export default function App() {
  // --- 狀態管理 ---
  const [attendanceTab, setAttendanceTab] = useState('take'); // 'take' (點名) | 'history' (紀錄)
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'admin' | 'student'
  const [currentUserInfo, setCurrentUserInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('rankings');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [schedules, setSchedules] = useState([]); // 訓練日程
  const [downloadFiles, setDownloadFiles] = useState([]); 
  const [systemConfig, setSystemConfig] = useState({ 
    adminPassword: 'admin', 
    announcements: [],
    seasonalTheme: 'default'
  });
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [importEncoding, setImportEncoding] = useState('AUTO');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('ALL'); // 點名頁專用篩選
  const [tempAttendance, setTempAttendance] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // 新增：財務參數
  const [financeConfig, setFinanceConfig] = useState({
    nTeam: 1, costTeam: 2750,
    nTrain: 3, costTrain: 1350,
    nHobby: 4, costHobby: 1200,
    totalStudents: 50, feePerStudent: 250
  });

  // 新增：自動計算總收支
  const financialSummary = useMemo(() => {
    const revenue = financeConfig.totalStudents * financeConfig.feePerStudent;
    const expense = (financeConfig.nTeam * financeConfig.costTeam) + 
                    (financeConfig.nTrain * financeConfig.costTrain) + 
                    (financeConfig.nHobby * financeConfig.costHobby);
    return { revenue, expense, profit: revenue - expense };
  }, [financeConfig]);

  // 章別數據與積分邏輯
  const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", border: "border-slate-200", shadow: "shadow-slate-100", bonus: 400, desc: "最高榮譽" },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-50", icon: "🥇", border: "border-yellow-200", shadow: "shadow-yellow-100", bonus: 200, desc: "卓越表現" },
    "銀章": { color: "text-slate-500", bg: "bg-slate-100", icon: "🥈", border: "border-slate-200", shadow: "shadow-slate-100", bonus: 100, desc: "進步神速" },
    "銅章": { color: "text-orange-600", bg: "bg-orange-50", icon: "🥉", border: "border-orange-200", shadow: "shadow-orange-100", bonus: 50, desc: "初露鋒芒" },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", border: "border-slate-100", shadow: "shadow-transparent", bonus: 0, desc: "努力中" }
  };

  // --- Firebase Auth 監聽 ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) { console.error("Auth Error:", err); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore 資料即時監聽 ---
  useEffect(() => {
    if (!user) return;
    
    const studentsRef = collection(db, 'artifacts', appId, 'public', 'data', 'students');
    const attendanceRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
    const competitionsRef = collection(db, 'artifacts', appId, 'public', 'data', 'competitions');
    const schedulesRef = collection(db, 'artifacts', appId, 'public', 'data', 'schedules');
    const filesRef = collection(db, 'artifacts', appId, 'public', 'data', 'downloadFiles'); 
    const configDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'config', 'system');

    // 系統配置監聽
    const unsubConfig = onSnapshot(configDocRef, (docSnap) => {
      if (docSnap.exists()) setSystemConfig(docSnap.data());
      else setDoc(configDocRef, { adminPassword: 'admin', announcements: [], seasonalTheme: 'default' });
    });
    
    // 學生資料監聽
    const unsubStudents = onSnapshot(studentsRef, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 點名紀錄監聽 (優化：只讀取最近 100 筆，防止白畫面)
    const qAttendance = query(attendanceRef, orderBy('date', 'desc'), limit(100));
    const unsubAttendance = onSnapshot(qAttendance, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
      setAttendance(data);
    }, (err) => {
      console.error("讀取點名紀錄錯誤:", err);
      setAttendance([]); 
    });

    // 比賽資訊監聽
    const unsubCompetitions = onSnapshot(competitionsRef, (snap) => {
      setCompetitions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 訓練日程監聽
    const unsubSchedules = onSnapshot(schedulesRef, (snap) => {
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 檔案下載監聽
    const unsubFiles = onSnapshot(filesRef, (snap) => {
      setDownloadFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubConfig(); unsubStudents(); unsubAttendance(); unsubCompetitions(); unsubSchedules(); unsubFiles(); 
    };
  }, [user]);

  // --- 登入邏輯 ---
  const handleLogin = (type, data) => {
    if (type === 'admin') {
      if (data.password === systemConfig.adminPassword) {
        setRole('admin'); 
        setShowLoginModal(false); 
        setActiveTab('dashboard');
      } else { alert('管理員密碼錯誤'); }
    } else {
      const student = students.find(s => s.class === data.className.toUpperCase() && s.classNo === data.classNo);
      if (student) {
        setRole('student'); 
        setCurrentUserInfo(student); 
        setShowLoginModal(false); 
        setActiveTab('rankings');
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
    return students.map(s => ({ 
      ...s, 
      totalPoints: (Number(s.points) || 0) + (BADGE_DATA[s.badge]?.bonus || 0) 
    })).sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return a.class.localeCompare(b.class);
    });
  }, [students]);

 // --- 財務收支組件 ---
  const FinancialView = () => (
    <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-700 font-bold">
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
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">預計資助</p>
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
  );

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

  // --- 核心功能：訓練班日程匯入 ---
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
    } catch (err) { alert('匯入失敗，請確認 CSV 格式 (班別,日期,地點,教練,備註)'); }
    setIsUpdating(false);
    e.target.value = null;
  };

  // --- 核心功能：學員匯入 ---
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
            squashClass: squashClass || '', // 壁球班別
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

// --- [v4.4 點名存檔與顯示修復] ---
  const saveAttendance = async () => {
    const selectedIds = Object.keys(tempAttendance).filter(id => tempAttendance[id]);
    if (selectedIds.length === 0) {
      alert("⚠️ 請至少勾選一位出席的學員！");
      return;
    }

    let targetClass = attendanceClassFilter;
    if (todaySchedule && todaySchedule.trainingClass) {
      targetClass = todaySchedule.trainingClass;
    } else if (targetClass === 'ALL') {
      targetClass = '自由訓練 (Mixed)';
    }

    const recordId = "ATT_" + Date.now();
    const newRecord = {
      id: recordId,
      date: todaySchedule?.date || new Date().toISOString().split('T')[0],
      className: targetClass,
      location: todaySchedule?.location || "體育館",
      coach: todaySchedule?.coach || "教練",
      records: tempAttendance, 
      timestamp: new Date()
    };

    try {
      // 確保使用 setDoc 寫入，這是最穩定的寫法
      const attendanceRef = collection(db, 'artifacts', appId, 'public', 'data', 'attendance');
      await setDoc(doc(attendanceRef, recordId), newRecord); 
      
      // 本地更新，不用等 snapshot，即時回饋
      setAttendance(prev => [newRecord, ...prev]);
      
      setTempAttendance({});
      alert(`✅ 已成功儲存 ${targetClass} 的出席紀錄 (${selectedIds.length} 人)！`);
      setAttendanceTab('history'); 
    } catch (error) {
      console.error("存檔失敗:", error);
      alert("存檔失敗，請檢查網路連線");
    }
  };

  const deleteItem = async (col, id) => {
    if (role !== 'admin') return;
    if (confirm('⚠️ 確定要永久刪除此項紀錄嗎？此動作無法復原。')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', col, id));
    }
  };

  // --- 日程連動點名邏輯 ---
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

  // 點名專用過濾學員
  const studentsInSelectedAttendanceClass = useMemo(() => {
    const sorted = [...students].sort((a,b) => a.class.localeCompare(b.class));
    if (attendanceClassFilter === 'ALL') return sorted;
    return sorted.filter(s => {
      if (!s.squashClass) return false;
      return s.squashClass.includes(attendanceClassFilter);
    });
  }, [students, attendanceClassFilter]);

// --- [v2.6 新增] 匯出出席紀錄功能 ---
  const exportAttendanceCSV = (targetClass) => {
    if (!targetClass || targetClass === 'ALL') {
      alert('請先選擇一個班別以匯出紀錄');
      return;
    }

    const classStudents = students.filter(s => 
      s.class === targetClass || (s.squashClass && s.squashClass.includes(targetClass))
    ).sort((a, b) => a.classNo - b.classNo);

    const classAttendanceRecords = attendance.filter(r => 
      r.className === targetClass || r.trainingClass === targetClass
    ).sort((a, b) => a.date.localeCompare(b.date));

    if (classAttendanceRecords.length === 0) {
      alert('該班別尚無點名紀錄');
      return;
    }

    let csvContent = "\ufeff姓名,班別,班號,總出席次數,出席率";
    classAttendanceRecords.forEach(r => {
      csvContent += `,${r.date}`;
    });
    csvContent += "\n";

    classStudents.forEach(s => {
      let presentCount = 0;
      let row = `${s.name},${s.class},${s.classNo}`;
      
      let dateStatuses = "";
      classAttendanceRecords.forEach(r => {
        const status = r.records?.[s.id] || r.studentStatuses?.[s.id];
        const isPresent = status === 'Present' || status === '出席' || status === true;
        if (isPresent) presentCount++;
        dateStatuses += `,${isPresent ? '✅' : '⬜'}`;
      });

      const rate = classAttendanceRecords.length > 0 
        ? Math.round((presentCount / classAttendanceRecords.length) * 100) + '%' 
        : '0%';
        
      row += `,${presentCount},${rate}${dateStatuses}`;
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `出席紀錄_${targetClass}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- 下載範本 ---
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

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-400 font-bold animate-pulse">正在連接正覺壁球資料庫...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 overflow-hidden">
      
      {/* 登入視窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl p-12 border border-white/20 transform transition-all duration-700">
            <div className="flex justify-center mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-200">
                <ShieldCheck className="text-white" size={48} />
              </div>
            </div>
            <h2 className="text-4xl font-black text-center text-slate-800 mb-2">正覺壁球</h2>
            <p className="text-center text-slate-400 font-bold mb-10">學員管理及積分系統</p>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-1 rounded-[2rem] flex mb-4">
                <button className="flex-1 py-3 text-sm font-black text-blue-600 bg-white rounded-[1.8rem] shadow-sm">學員入口</button>
                <button onClick={() => {
                  const p = prompt('請輸入教練管理密碼'); 
                  if(p === systemConfig.adminPassword) { setRole('admin'); setShowLoginModal(false); setActiveTab('dashboard'); }
                  else if(p) alert('密碼錯誤');
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
            <p className="text-center text-[10px] text-slate-300 mt-10 font-bold uppercase tracking-widest">正覺壁球管理系統 v4.4 (Stable)</p>
          </div>
        </div>
      )}
      
      {/* 側邊欄 */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-80 bg-white border-r transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-10 h-full flex flex-col font-bold">
          <div className="flex items-center gap-4 mb-14 px-2">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-100">
              <ShieldCheck className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter">正覺壁球</h2>
              <p className="text-[10px] text-slate-300 uppercase tracking-[0.2em] -mt-1">智能系統</p>
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
      <main className="flex-1 h-screen overflow-y-auto">
        {/* 手機版 Header */}
        <div className="md:hidden p-6 flex items-center justify-between sticky top-0 bg-[#F8FAFC]/80 backdrop-blur-md z-40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <ShieldCheck size={20}/>
            </div>
            <span className="font-black text-slate-800">正覺壁球</span>
          </div>
          <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-slate-400">
            <Menu size={20}/>
          </button>
        </div>

        <div className="p-6 md:p-10 max-w-[1600px] mx-auto pb-32">
          
          {/* 1. 管理儀表板 */}
          {activeTab === 'dashboard' && role === 'admin' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">管理概況</h2>
                  <p className="text-slate-400 font-bold mt-2">歡迎回來，教練！這是目前的球隊數據概覽。</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-slate-400">系統連線正常</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-8">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"><Users size={24}/></div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">+12%</span>
                    </div>
                    <div className="text-5xl font-black mb-2">{students.length}</div>
                    <div className="text-blue-100 font-bold">總學員人數</div>
                  </div>
                  <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                   <div className="flex justify-between items-start mb-8">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Trophy size={24}/></div>
                   </div>
                   <div className="text-5xl font-black text-slate-800 mb-2">
                     {students.filter(s => s.badge !== '無').length}
                   </div>
                   <div className="text-slate-400 font-bold">獲獎章人數</div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                   <div className="flex justify-between items-start mb-8">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CalendarIcon size={24}/></div>
                   </div>
                   <div className="text-5xl font-black text-slate-800 mb-2">{schedules.length}</div>
                   <div className="text-slate-400 font-bold">本季訓練課堂</div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                   <div className="flex justify-between items-start mb-8">
                      <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl"><Star size={24}/></div>
                   </div>
                   <div className="text-5xl font-black text-slate-800 mb-2">
                     {attendance.length > 0 ? attendance.length : 0}
                   </div>
                   <div className="text-slate-400 font-bold">已建立點名紀錄</div>
                </div>
              </div>

              {/* 快速操作區 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <button onClick={() => setActiveTab('attendance')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <ClipboardCheck size={24}/>
                    </div>
                    <h3 className="text-lg font-black text-slate-800">快速點名</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">紀錄今日出席狀況</p>
                 </button>
                 
                 <button onClick={() => setActiveTab('students')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left group">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <User size={24}/>
                    </div>
                    <h3 className="text-lg font-black text-slate-800">新增學員</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">建立新隊員檔案</p>
                 </button>

                 <button onClick={() => setActiveTab('competitions')} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all text-left group">
                    <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Megaphone size={24}/>
                    </div>
                    <h3 className="text-lg font-black text-slate-800">發布公告</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">更新最新賽事資訊</p>
                 </button>
              </div>
            </div>
          )}

          {/* 2. 積分排行榜 */}
          {activeTab === 'rankings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">積分風雲榜</h2>
                  <p className="text-slate-400 font-bold mt-2">即時更新的隊員積分與排名</p>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                    <input 
                      type="text" 
                      placeholder="搜尋姓名或班別..." 
                      className="w-full pl-12 pr-6 py-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm outline-none focus:ring-2 ring-blue-100 font-bold text-slate-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm text-slate-400 hover:text-blue-600">
                    <Filter size={20}/>
                  </button>
                </div>
              </div>

              {/* 前三名獎台 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 items-end">
                {rankedStudents[1] && (
                   <div className="order-2 md:order-1 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center transform hover:-translate-y-2 transition-all duration-500">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-black text-slate-400 border-4 border-white shadow-xl">
                          {rankedStudents[1].name[0]}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                          NO.2
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-slate-800">{rankedStudents[1].name}</h3>
                      <p className="text-xs font-bold text-slate-400 mb-4">{rankedStudents[1].class}</p>
                      <div className="text-2xl font-black text-slate-600">{rankedStudents[1].totalPoints}</div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Points</div>
                   </div>
                )}

                {rankedStudents[0] && (
                   <div className="order-1 md:order-2 bg-gradient-to-b from-yellow-50 to-white p-8 rounded-[3rem] border border-yellow-100 shadow-xl shadow-yellow-100/50 flex flex-col items-center transform scale-110 z-10">
                      <div className="relative mb-6">
                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-5xl">👑</div>
                         <div className="w-24 h-24 rounded-full bg-yellow-100 flex items-center justify-center text-3xl font-black text-yellow-600 border-4 border-white shadow-xl">
                            {rankedStudents[0].name[0]}
                         </div>
                         <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-white px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-yellow-200">
                            CHAMPION
                         </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mt-2">{rankedStudents[0].name}</h3>
                      <p className="text-xs font-bold text-yellow-600/60 mb-6">{rankedStudents[0].class}</p>
                      <div className="text-4xl font-black text-yellow-500 mb-1">{rankedStudents[0].totalPoints}</div>
                      <div className="text-[10px] font-bold text-yellow-300 uppercase tracking-widest">Points</div>
                   </div>
                )}

                {rankedStudents[2] && (
                   <div className="order-3 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center transform hover:-translate-y-2 transition-all duration-500">
                      <div className="relative mb-4">
                        <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center text-2xl font-black text-orange-400 border-4 border-white shadow-xl">
                          {rankedStudents[2].name[0]}
                        </div>
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black shadow-sm">
                          NO.3
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-slate-800">{rankedStudents[2].name}</h3>
                      <p className="text-xs font-bold text-slate-400 mb-4">{rankedStudents[2].class}</p>
                      <div className="text-2xl font-black text-orange-500">{rankedStudents[2].totalPoints}</div>
                      <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Points</div>
                   </div>
                )}
              </div>

              {/* 完整列表 */}
              <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b font-black">
                      <tr>
                        <th className="px-8 py-6 rounded-tl-3xl">排名</th>
                        <th className="px-6 py-6">學員姓名</th>
                        <th className="px-6 py-6">班別資料</th>
                        <th className="px-6 py-6">等級勳章</th>
                        <th className="px-6 py-6 text-right">目前積分</th>
                        {role === 'admin' && <th className="px-8 py-6 text-right rounded-tr-3xl">管理操作</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredStudents.map((s, index) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-sm
                              ${index < 3 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}
                            `}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {s.name[0]}
                              </div>
                              <span className="font-black text-slate-700">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div>
                              <div className="font-bold text-sm text-slate-600">{s.class} ({s.classNo})</div>
                              <div className="text-[10px] text-slate-300 font-bold">{s.squashClass || '未分班'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <RankBadge rank={index + 1} points={s.totalPoints} />
                          </td>
                          <td className="px-6 py-5 text-right font-black text-slate-700 font-mono">
                            {s.totalPoints}
                          </td>
                          {role === 'admin' && (
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => adjustPoints(s.id, 10)} className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors">
                                  <Plus size={14}/>
                                </button>
                                <button onClick={() => adjustPoints(s.id, -10)} className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors">
                                  <Minus size={14}/>
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

          {/* 3. 訓練日程表 */}
          {activeTab === 'schedules' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">訓練日程</h2>
                  <p className="text-slate-400 font-bold mt-2">查看最新的訓練時間與地點安排</p>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
                  <select 
                    className="bg-transparent font-black text-slate-600 text-sm outline-none px-4 cursor-pointer"
                    value={selectedClassFilter}
                    onChange={(e) => setSelectedClassFilter(e.target.value)}
                  >
                    <option value="ALL">全部班別</option>
                    {uniqueTrainingClasses.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchedules.map(schedule => {
                   const isToday = new Date().toISOString().split('T')[0] === schedule.date;
                   return (
                     <div key={schedule.id} className={`p-8 rounded-[2.5rem] border transition-all hover:scale-[1.02] cursor-pointer group relative overflow-hidden
                       ${isToday ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 border-blue-500' : 'bg-white text-slate-800 border-slate-100 shadow-sm hover:border-blue-200'}
                     `}>
                        {isToday && (
                          <div className="absolute top-0 right-0 bg-white/20 px-4 py-2 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">
                            TODAY
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 mb-6">
                           <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg
                             ${isToday ? 'bg-white/20 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600'}
                           `}>
                             {new Date(schedule.date).getDate()}
                           </div>
                           <div>
                             <div className={`text-xs font-bold uppercase tracking-widest opacity-60`}>
                               {new Date(schedule.date).toLocaleDateString('en-US', { month: 'short', weekday: 'short' })}
                             </div>
                             <div className="font-black text-lg">{schedule.trainingClass}</div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                             <MapPin size={16}/> {schedule.location}
                           </div>
                           <div className="flex items-center gap-3 text-sm font-bold opacity-80">
                             <User size={16}/> 教練: {schedule.coach}
                           </div>
                           {schedule.notes && (
                             <div className="mt-4 pt-4 border-t border-current/10 text-xs leading-relaxed opacity-70">
                               {schedule.notes}
                             </div>
                           )}
                        </div>
                     </div>
                   );
                })}
              </div>
            </div>
          )}

          {/* 4. [v4.4 優化版] 點名系統 (分頁 + 讀取限制) */}
          {activeTab === 'attendance' && role === 'admin' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* 頂部功能區 */}
              <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="bg-slate-50 p-1.5 rounded-[2rem] flex items-center">
                  <button 
                    onClick={() => setAttendanceTab('take')}
                    className={`px-6 py-3 rounded-[1.8rem] text-sm font-black transition-all flex items-center gap-2 ${attendanceTab === 'take' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <ClipboardCheck size={18}/> 今日點名
                  </button>
                  <button 
                    onClick={() => setAttendanceTab('history')}
                    className={`px-6 py-3 rounded-[1.8rem] text-sm font-black transition-all flex items-center gap-2 ${attendanceTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <History size={18}/> 出席紀錄
                  </button>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest hidden md:block">選擇班別:</span>
                  <select 
                    value={attendanceClassFilter} 
                    onChange={(e) => setAttendanceClassFilter(e.target.value)}
                    className="flex-1 md:w-64 bg-slate-50 border-r-[16px] border-transparent px-6 py-3 rounded-2xl font-black text-slate-700 outline-none focus:bg-white focus:ring-2 ring-blue-100 transition-all cursor-pointer"
                  >
                    <option value="ALL">📋 顯示所有學員</option>
                    {uniqueTrainingClasses.filter(c => c !== 'ALL').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* A. 進行點名介面 */}
              {attendanceTab === 'take' && (
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">
                        {todaySchedule ? `📅 ${todaySchedule.date} - ${todaySchedule.trainingClass}` : '👋 自由點名模式'}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                        已選取: <span className="text-blue-600 text-lg">{Object.values(tempAttendance).filter(v => v).length}</span> 人
                      </p>
                    </div>
                    <button 
                      onClick={saveAttendance} 
                      className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-200 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <Save size={18}/> 提交紀錄
                    </button>
                  </div>
                  
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {studentsInSelectedAttendanceClass.map(s => {
                      const isSelected = tempAttendance[s.id] || false;
                      return (
                        <div 
                          key={s.id} 
                          onClick={() => setTempAttendance(prev => ({...prev, [s.id]: !prev[s.id]}))}
                          className={`group p-4 rounded-3xl border transition-all flex items-center justify-between cursor-pointer select-none
                            ${isSelected 
                              ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200 scale-[1.02]' 
                              : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-colors
                              ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-blue-600'}`}>
                              {s.classNo}
                            </div>
                            <div>
                              <div className={`font-black ${isSelected ? 'text-white' : 'text-slate-800'}`}>{s.name}</div>
                              <div className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{s.class}</div>
                            </div>
                          </div>
                          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                            ${isSelected ? 'border-white bg-white' : 'border-slate-200 group-hover:border-blue-400'}`}>
                            {isSelected && <div className="w-4 h-4 rounded-full bg-blue-600"></div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* B. 出席紀錄列表 (分頁優化版) */}
              {attendanceTab === 'history' && (
                <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="p-8 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">
                        {attendanceClassFilter === 'ALL' ? '近期出席概況' : `${attendanceClassFilter} - 出席紀錄`}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">
                         為確保流暢度，僅顯示最近 50 筆紀錄
                      </p>
                    </div>
                    <button 
                      onClick={() => exportAttendanceCSV(attendanceClassFilter)}
                      className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 hover:scale-105 transition-all flex items-center gap-2"
                    >
                      <FileSpreadsheet size={18}/> 匯出 CSV 報表
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b font-black">
                        <tr>
                          <th className="px-6 py-4 rounded-tl-3xl">日期</th>
                          <th className="px-6 py-4">班別</th>
                          <th className="px-6 py-4">出席人數</th>
                          <th className="px-6 py-4 text-right rounded-tr-3xl">狀態</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(attendance || [])
                          .filter(r => r && (attendanceClassFilter === 'ALL' || r.className === attendanceClassFilter || r.trainingClass === attendanceClassFilter))
                          .sort((a,b) => {
                             const dateA = a.date || '';
                             const dateB = b.date || '';
                             return dateB.localeCompare(dateA);
                          })
                          .slice(0, 50) // [v4.4 強制分頁]
                          .map((record, index) => {
                            let count = 0;
                            try {
                                const records = record.records || record.studentStatuses || {};
                                count = Object.values(records).filter(v => v === true || v === 'Present' || v === '出席').length;
                            } catch(e) {}
                            
                            return (
                              <tr key={record.id || index} className="hover:bg-slate-50/80 transition-all">
                                <td className="px-6 py-4 font-black text-slate-700 font-mono">{record.date || '無日期'}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-500">{record.className || record.trainingClass || '未知班別'}</td>
                                <td className="px-6 py-4">
                                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-black">
                                    {count} 人
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button className="text-xs font-bold text-blue-500 hover:text-blue-700">查看詳情</button>
                                </td>
                              </tr>
                            );
                        })}
                        {(attendance || []).length === 0 && (
                          <tr>
                            <td colSpan="4" className="text-center py-10 text-slate-300 font-bold">尚無任何點名紀錄</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. 比賽與公告管理 */}
          {activeTab === 'competitions' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              
              {/* 頂部標題與新增按鈕 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">比賽與公告</h2>
                  <p className="text-slate-400 font-bold mt-2">最新賽事資訊與壁球隊通告</p>
                </div>
                {role === 'admin' && (
                  <button 
                    onClick={() => {
                      const title = prompt('請輸入標題');
                      if(!title) return;
                      // 這裡只是一個簡單的範例，實際新增邏輯需配合 Firebase addDoc
                      alert('新增功能需連接 addDoc'); 
                    }}
                    className="bg-blue-600 text-white px-8 py-4 rounded-[2rem] font-black shadow-xl shadow-blue-200 hover:scale-105 transition-all flex items-center gap-3"
                  >
                    <Plus size={20}/> 發布新資訊
                  </button>
                )}
              </div>

              {/* 公告欄 (Announcements) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-200 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                       <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                         <Megaphone className="text-white" size={24}/>
                       </div>
                       <h3 className="text-2xl font-black">重要通告</h3>
                    </div>
                    
                    <div className="space-y-6">
                      {(systemConfig.announcements || []).length > 0 ? (
                        systemConfig.announcements.map((ann, idx) => (
                          <div key={idx} className="bg-white/10 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                            <p className="font-bold text-lg leading-relaxed">{ann}</p>
                            <div className="mt-4 flex items-center gap-2 text-white/50 text-[10px] font-black uppercase tracking-widest">
                              <Info size={12}/> 系統公告
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-white/60 font-bold text-center py-10">目前沒有緊急公告</div>
                      )}
                    </div>
                  </div>
                  
                  {/* 背景裝飾 */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
                </div>

                {/* 比賽列表 (Competitions) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                     <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center">
                       <TrophyIcon size={20}/>
                     </div>
                     <h3 className="text-xl font-black text-slate-800">近期賽事</h3>
                  </div>

                  <div className="grid gap-4">
                    {(competitions || []).map(c => (
                      <div key={c.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-orange-200 transition-all cursor-pointer flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 font-black text-lg group-hover:scale-110 transition-transform">
                              {c.date ? c.date.split('-')[1] : 'M'}
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-slate-800 group-hover:text-orange-600 transition-colors">{c.title}</h4>
                               <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                 <CalendarIcon size={12}/> {c.date} • {c.location || '地點待定'}
                               </div>
                            </div>
                         </div>
                         <div className="w-10 h-10 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-all">
                           <ChevronRight size={20}/>
                         </div>
                      </div>
                    ))}
                    
                    {(!competitions || competitions.length === 0) && (
                      <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-bold">
                        暫無比賽資訊
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. 教練後台 - 學員管理 */}
          {activeTab === 'students' && role === 'admin' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-800 tracking-tight">隊員檔案管理</h2>
                  <p className="text-slate-400 font-bold mt-2">在此批量匯入名單或個別編輯隊員屬性</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                   <div className="relative flex-1 md:w-64">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                     <input 
                       type="text"
                       placeholder="搜尋姓名..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full pl-12 pr-6 py-4 rounded-[2rem] bg-white border border-slate-100 focus:outline-none focus:ring-2 ring-blue-100 font-bold text-slate-600"
                     />
                   </div>
                   <button className="bg-blue-600 text-white w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                     <Plus size={24}/>
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredStudents.map(s => (
                   <div key={s.id} className="group bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:border-blue-300 hover:shadow-xl transition-all relative overflow-hidden">
                      <div className="relative z-10 flex items-center gap-5">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner">
                           {s.name[0]}
                         </div>
                         <div>
                            <h3 className="text-xl font-black text-slate-800">{s.name}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                               <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.class}</span>
                               <span className="bg-blue-100 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 uppercase tracking-wider">{s.classNo}</span>
                            </div>
                         </div>
                      </div>
                      
                      {/* 懸浮操作欄 */}
                      <div className="absolute bottom-0 left-0 w-full bg-slate-50 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-end gap-3">
                         <button onClick={() => deleteItem('students', s.id)} className="w-10 h-10 rounded-2xl bg-white text-rose-500 shadow-sm flex items-center justify-center hover:bg-rose-500 hover:text-white transition-colors">
                           <Trash2 size={18}/>
                         </button>
                         <button className="w-10 h-10 rounded-2xl bg-white text-blue-500 shadow-sm flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                           <Settings2 size={18}/>
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* 7. 財務管理 */}
          {activeTab === 'financial' && role === 'admin' && (
             <FinancialView />
          )}

          {/* 8. 系統設定 */}
          {activeTab === 'settings' && role === 'admin' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   
                   {/* 資料匯入區 */}
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Upload size={24}/></div>
                        <h3 className="text-2xl font-black text-slate-800">資料匯入</h3>
                      </div>
                      
                      <div className="space-y-8">
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">1. 選擇 CSV 編碼 (防止亂碼)</label>
                          <div className="flex gap-2">
                            {['AUTO', 'UTF-8', 'BIG5'].map(enc => (
                              <button 
                                key={enc}
                                onClick={() => setImportEncoding(enc)}
                                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${importEncoding === enc ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                              >
                                {enc}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                           <h4 className="font-black text-slate-700 mb-4">匯入學員名單</h4>
                           <div className="flex gap-4">
                             <button onClick={() => downloadTemplate('student')} className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-slate-500 shadow-sm hover:text-indigo-600">下載範本</button>
                             <label className="flex-1 cursor-pointer">
                               <input type="file" accept=".csv" onChange={handleCSVImportStudents} className="hidden" />
                               <div className="w-full h-full bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform">
                                 <Upload size={14}/> 選擇檔案
                               </div>
                             </label>
                           </div>
                        </div>

                        <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                           <h4 className="font-black text-slate-700 mb-4">匯入訓練日程</h4>
                           <div className="flex gap-4">
                             <button onClick={() => downloadTemplate('schedule')} className="px-4 py-3 bg-white rounded-xl text-xs font-bold text-slate-500 shadow-sm hover:text-indigo-600">下載範本</button>
                             <label className="flex-1 cursor-pointer">
                               <input type="file" accept=".csv" onChange={handleCSVImportSchedules} className="hidden" />
                               <div className="w-full h-full bg-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform">
                                 <Upload size={14}/> 選擇檔案
                               </div>
                             </label>
                           </div>
                        </div>
                      </div>
                   </div>

                   {/* 系統參數設定 */}
                   <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center"><Settings2 size={24}/></div>
                        <h3 className="text-2xl font-black text-slate-800">系統參數</h3>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">管理員密碼</label>
                           <input 
                             type="text" 
                             value={systemConfig.adminPassword}
                             onChange={(e) => setSystemConfig({...systemConfig, adminPassword: e.target.value})}
                             className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-slate-800 focus:bg-white rounded-2xl outline-none transition-all font-mono text-lg font-black"
                           />
                        </div>
                        
                        <div className="pt-4">
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
             </div>
          )}

        </div>
      </main>
      </div>
  );
}
