// src/hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { db } from '../firebase'; // 確保路徑指向您的 firebase.js
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export const useFirebaseData = () => {
    // 定義所有需要從 Firebase 獲取的資料狀態
    const [students, setStudents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [monthlyStars, setMonthlyStars] = useState([]);
    const [leagueMatches, setLeagueMatches] = useState([]);

    useEffect(() => {
        // 1. 監聽學生資料 (Students)
        const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // 這裡可以加入您原有的排序邏輯，例如按班級排序
            setStudents(studentsData);
        }, (error) => {
            console.error("Error fetching students: ", error);
        });

        // 2. 監聽比賽紀錄 (Competitions/Matches)
        // 假設您的外部比賽紀錄存在 'matches' 集合，並依日期排序
        const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
        const unsubscribeCompetitions = onSnapshot(matchesQuery, (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(matchesData);
        }, (error) => {
             console.error("Error fetching competitions: ", error);
        });

        // 3. 監聽每月之星 (Monthly Stars)
        const unsubscribeStars = onSnapshot(collection(db, 'monthly_stars'), (snapshot) => {
            const starsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMonthlyStars(starsData);
        }, (error) => {
             console.error("Error fetching monthly stars: ", error);
        });

        // 4. 監聽內部聯賽 (League Matches)
        const unsubscribeLeagueMatches = onSnapshot(collection(db, 'league_matches'), (snapshot) => {
            const leagueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeagueMatches(leagueData);
        }, (error) => {
             console.error("Error fetching league matches: ", error);
        });

        // 清理函數：當元件卸載時，取消所有監聽，避免記憶體洩漏
        return () => {
            unsubscribeStudents();
            unsubscribeCompetitions();
            unsubscribeStars();
            unsubscribeLeagueMatches();
        };
    }, []); // 空陣列表示只在元件掛載時執行一次設定

    // 將收集到的資料打包回傳
    return {
        students,
        competitions,
        monthlyStars,
        leagueMatches,
        // 如果未來有 loading 狀態或錯誤狀態，也可以在這裡回傳
    };
};
