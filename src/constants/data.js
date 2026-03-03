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

const BADGE_DATA = {
    "白金章": { color: "text-slate-400", bg: "bg-slate-100", icon: "💎", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 400, level: 4, desc: "最高榮譽" },
    "金章": { color: "text-yellow-600", bg: "bg-yellow-50", icon: "🥇", border: "border-yellow-200", shadow: "shadow-yellow-100", basePoints: 200, level: 3, desc: "卓越表現" },
    "銀章": { color: "text-slate-500", bg: "bg-slate-100", icon: "🥈", border: "border-slate-200", shadow: "shadow-slate-100", basePoints: 100, level: 2, desc: "進步神速" },
    "銅章": { color: "text-orange-600", bg: "bg-orange-50", icon: "🥉", border: "border-orange-200", shadow: "shadow-orange-100", basePoints: 30, level: 1, desc: "初露鋒芒" },
    "無": { color: "text-slate-300", bg: "bg-slate-50", icon: "⚪", border: "border-slate-100", shadow: "shadow-transparent", basePoints: 0, level: 0, desc: "努力中" }
  };
