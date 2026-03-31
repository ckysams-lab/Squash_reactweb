// src/hooks/useFirebaseData.js (Version 2.0 - Multi-Tenant Ready)

import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const useFirebaseData = () => {
    // 1. 宣告所有狀態
    const [students, setStudents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [monthlyStars, setMonthlyStars] = useState([]);
    const [leagueMatches, setLeagueMatches] = useState([]);
    const [feedPosts, setFeedPosts] = useState([]);
    
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [downloadFiles, setDownloadFiles] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);
    const [awards, setAwards] = useState([]);
    const [trophies, setTrophies] = useState([]);
    const [alumni, setAlumni] = useState([]);
    const [playerJournals, setPlayerJournals] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [externalTournaments, setExternalTournaments] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [tacticalShots, setTacticalShots] = useState([]);

    useEffect(() => {
        let unsubscribes = [];

        // 👇 核心修改：不再寫死 appId，改為動態從 LocalStorage 讀取 👇
        // 如果沒有抓到，預設還是給你們學校的 ID，作為防呆
        const currentAppId = localStorage.getItem('tenant_app_id') || 'bcklas-squash-core-v1';

        const getCollectionPath = (collectionName) => collection(db, 'artifacts', currentAppId, 'public', 'data', collectionName);

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                // 在 Console 中印出目前連線的機構 ID，方便你除錯
                console.log(`✅ Hook: Auth confirmed, fetching data for Tenant: [${currentAppId}]...`);

                const bindListener = (collectionRef, setFunction, name) => {
                    const unsub = onSnapshot(collectionRef, 
                        (snap) => {
                            setFunction(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        },
                        (error) => console.error(`Error fetching ${name}:`, error)
                    );
                    unsubscribes.push(unsub);
                };

                // --- 綁定所有監聽器 (自動指向 currentAppId 的資料夾) ---
                bindListener(getCollectionPath('students'), setStudents, 'students');
                bindListener(query(getCollectionPath('competitions'), orderBy('date', 'desc')), setCompetitions, 'competitions');
                bindListener(getCollectionPath('monthly_stars'), setMonthlyStars, 'monthlyStars');
                bindListener(getCollectionPath('league_matches'), setLeagueMatches, 'leagueMatches');
                bindListener(getCollectionPath('attendance_logs'), setAttendanceLogs, 'attendanceLogs');
                bindListener(getCollectionPath('schedules'), setSchedules, 'schedules');
                bindListener(getCollectionPath('downloadFiles'), setDownloadFiles, 'downloadFiles');
                bindListener(getCollectionPath('gallery'), setGalleryItems, 'galleryItems');
                bindListener(query(getCollectionPath('trophies'), orderBy("year", "desc")), setTrophies, 'trophies');
                bindListener(query(getCollectionPath('alumni'), orderBy("graduationYear", "desc")), setAlumni, 'alumni');
                bindListener(query(getCollectionPath('player_journals'), orderBy("createdAt", "asc")), setPlayerJournals, 'playerJournals');
                bindListener(query(getCollectionPath('awards'), orderBy("date", "desc")), setAwards, 'awards');
                bindListener(query(getCollectionPath('achievements'), orderBy("timestamp", "desc")), setAchievements, 'achievements');
                bindListener(query(getCollectionPath('external_tournaments'), orderBy("name", "asc")), setExternalTournaments, 'externalTournaments');
                bindListener(query(getCollectionPath('assessments'), orderBy("date", "desc")), setAssessments, 'assessments');
                bindListener(getCollectionPath('tactical_shots'), setTacticalShots, 'tacticalShots');
                bindListener(query(getCollectionPath('feed_posts'), orderBy("timestamp", "desc")), setFeedPosts, 'feedPosts');

            } else {
                console.log("❌ Hook: Auth logged out, clearing ALL data.");
                
                // 清空所有狀態，確保不同學校的資料不會殘留在畫面上
                setStudents([]); setCompetitions([]); setMonthlyStars([]); setLeagueMatches([]);
                setAttendanceLogs([]); setSchedules([]); setDownloadFiles([]); setGalleryItems([]);
                setAwards([]); setAchievements([]); setExternalTournaments([]); setAssessments([]); setTacticalShots([]);
                setTrophies([]); setAlumni([]); setPlayerJournals([]); setFeedPosts([]);

                // 執行並清空所有退訂函數
                unsubscribes.forEach(unsub => unsub());
                unsubscribes = [];
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribes.forEach(unsub => unsub());
        };
    }, []); // Hook 只在掛載時執行一次，依賴 Auth 狀態來決定是否拉取資料

    // 2. 將所有資料打包回傳
    return {
        students, competitions, monthlyStars, leagueMatches,
        attendanceLogs, schedules, downloadFiles, galleryItems,
        awards, achievements, externalTournaments, assessments, tacticalShots,
        feedPosts, trophies, alumni, playerJournals
    }; 
};
