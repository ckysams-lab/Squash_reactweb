// src/hooks/useFirebaseData.js
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
    
    // --- 新增的狀態 ---
    const [attendanceLogs, setAttendanceLogs] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [downloadFiles, setDownloadFiles] = useState([]);
    const [galleryItems, setGalleryItems] = useState([]);
    const [awards, setAwards] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [externalTournaments, setExternalTournaments] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [tacticalShots, setTacticalShots] = useState([]);

    useEffect(() => {
        // 宣告所有退訂函數
        let unsubscribes = [];

        const appId = 'bcklas-squash-core-v1';
        const getCollectionPath = (collectionName) => collection(db, 'artifacts', appId, 'public', 'data', collectionName);

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log("✅ Hook: Auth confirmed, starting FULL data fetch...");

                // 建立一個小工具來簡化監聽器的綁定
                const bindListener = (collectionRef, setFunction, name) => {
                    const unsub = onSnapshot(collectionRef, 
                        (snap) => {
                            setFunction(snap.docs.map(d => ({ id: d.id, ...d.data() })));
                        },
                        (error) => console.error(`Error fetching ${name}:`, error)
                    );
                    unsubscribes.push(unsub);
                };

                // --- 綁定所有監聽器 ---
                
                // 原有的 4 個
                bindListener(getCollectionPath('students'), setStudents, 'students');
                bindListener(query(getCollectionPath('competitions'), orderBy('date', 'desc')), setCompetitions, 'competitions');
                bindListener(getCollectionPath('monthly_stars'), setMonthlyStars, 'monthlyStars');
                bindListener(getCollectionPath('league_matches'), setLeagueMatches, 'leagueMatches');

                // 新增的 9 個
                bindListener(getCollectionPath('attendance_logs'), setAttendanceLogs, 'attendanceLogs');
                bindListener(getCollectionPath('schedules'), setSchedules, 'schedules');
                bindListener(getCollectionPath('downloadFiles'), setDownloadFiles, 'downloadFiles');
                bindListener(getCollectionPath('gallery'), setGalleryItems, 'galleryItems');
                
                // 注意：帶有排序的查詢
                bindListener(query(getCollectionPath('awards'), orderBy("date", "desc")), setAwards, 'awards');
                bindListener(query(getCollectionPath('achievements'), orderBy("timestamp", "desc")), setAchievements, 'achievements');
                bindListener(query(getCollectionPath('external_tournaments'), orderBy("name", "asc")), setExternalTournaments, 'externalTournaments');
                bindListener(query(getCollectionPath('assessments'), orderBy("date", "desc")), setAssessments, 'assessments');
                
                bindListener(getCollectionPath('tactical_shots'), setTacticalShots, 'tacticalShots');

            } else {
                console.log("❌ Hook: Auth logged out, clearing ALL data.");
                // 清空狀態
                setStudents([]); setCompetitions([]); setMonthlyStars([]); setLeagueMatches([]);
                setAttendanceLogs([]); setSchedules([]); setDownloadFiles([]); setGalleryItems([]);
                setAwards([]); setAchievements([]); setExternalTournaments([]); setAssessments([]); setTacticalShots([]);
                
                // 執行並清空所有退訂函數
                unsubscribes.forEach(unsub => unsub());
                unsubscribes = [];
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribes.forEach(unsub => unsub());
        };
    }, []);

    // 2. 將所有資料打包回傳
    return {
        students, competitions, monthlyStars, leagueMatches,
        attendanceLogs, schedules, downloadFiles, galleryItems,
        awards, achievements, externalTournaments, assessments, tacticalShots
    };
};
