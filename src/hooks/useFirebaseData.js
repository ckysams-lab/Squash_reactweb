// src/hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // 確保這裡正確匯入了 auth 和 db
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const useFirebaseData = () => {
    // 宣告狀態：預設都是空陣列
    const [students, setStudents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [monthlyStars, setMonthlyStars] = useState([]);
    const [leagueMatches, setLeagueMatches] = useState([]);

    useEffect(() => {
        // 宣告退訂函數的變數，用於清理記憶體
        let unsubscribeStudents;
        let unsubscribeCompetitions;
        let unsubscribeStars;
        let unsubscribeLeagueMatches;

        // 監聽登入狀態：只有在確認登入後才開始抓資料
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log("✅ Hook: 使用者已登入，開始抓取資料...");

                // 1. 抓取學生資料
                unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
                    const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook: 成功抓取 Students，數量:", studentsData.length);
                    setStudents(studentsData);
                }, (error) => console.error("❌ 抓取 students 失敗: ", error));

                // 2. 抓取比賽紀錄 (注意：這裡假設您的集合名稱是 matches，如果是 competitions 請自行更改)
                const matchesQuery = query(collection(db, 'competitions'), orderBy('date', 'desc')); // 改為 competitions 以符合您原本的命名
                unsubscribeCompetitions = onSnapshot(matchesQuery, (snapshot) => {
                    const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook: 成功抓取 Competitions，數量:", matchesData.length);
                    setCompetitions(matchesData);
                }, (error) => console.error("❌ 抓取 competitions 失敗: ", error));

                // 3. 抓取每月之星
                const unsubscribeStars = onSnapshot(collection(db, 'monthly_stars'), (snapshot) => {
                    const starsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook: 成功抓取 Monthly Stars，數量:", starsData.length);
                    setMonthlyStars(starsData);
                }, (error) => console.error("❌ 抓取 monthly_stars 失敗: ", error));

                // 4. 抓取內部聯賽
                unsubscribeLeagueMatches = onSnapshot(collection(db, 'league_matches'), (snapshot) => {
                    const leagueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook: 成功抓取 League Matches，數量:", leagueData.length);
                    setLeagueMatches(leagueData);
                }, (error) => console.error("❌ 抓取 league_matches 失敗: ", error));

            } else {
                // 如果未登入或登出，清空所有資料並取消監聽
                console.log("❌ Hook: 未登入，清空資料。");
                setStudents([]);
                setCompetitions([]);
                setMonthlyStars([]);
                setLeagueMatches([]);
                
                if (unsubscribeStudents) unsubscribeStudents();
                if (unsubscribeCompetitions) unsubscribeCompetitions();
                if (unsubscribeStars) unsubscribeStars();
                if (unsubscribeLeagueMatches) unsubscribeLeagueMatches();
            }
        });

        // 當這個 Hook 被卸載時執行的清理工作
        return () => {
            unsubscribeAuth(); // 停止監聽登入狀態
            if (unsubscribeStudents) unsubscribeStudents();
            if (unsubscribeCompetitions) unsubscribeCompetitions();
            if (unsubscribeStars) unsubscribeStars();
            if (unsubscribeLeagueMatches) unsubscribeLeagueMatches();
        };
    }, []); // 依賴陣列為空，表示這個設定只在組件掛載時執行一次

    // 將所有資料打包回傳給 App.jsx
    return {
        students,
        competitions,
        monthlyStars,
        leagueMatches,
    };
};
