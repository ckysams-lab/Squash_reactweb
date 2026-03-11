// src/hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

// 1. 新增一個 user 參數
export const useFirebaseData = (user) => { 
    const [students, setStudents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [monthlyStars, setMonthlyStars] = useState([]);
    const [leagueMatches, setLeagueMatches] = useState([]);

    useEffect(() => {
        // 2. 核心邏輯：如果 user 是 null (未登入)，就什麼都不做，直接返回！
        if (!user) {
            // 可選：當登出時，清空現有的資料
            setStudents([]);
            setCompetitions([]);
            setMonthlyStars([]);
            setLeagueMatches([]);
            return; 
        }

        // 如果 user 存在，才開始掛載監聽器
        console.log("User detected, starting to fetch data...");

        const unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setStudents(studentsData);
        }, (error) => {
            console.error("Error fetching students: ", error);
        });

        const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
        const unsubscribeCompetitions = onSnapshot(matchesQuery, (snapshot) => {
            const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCompetitions(matchesData);
        }, (error) => {
             console.error("Error fetching competitions: ", error);
        });

        const unsubscribeStars = onSnapshot(collection(db, 'monthly_stars'), (snapshot) => {
            const starsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMonthlyStars(starsData);
        }, (error) => {
             console.error("Error fetching monthly stars: ", error);
        });

        const unsubscribeLeagueMatches = onSnapshot(collection(db, 'league_matches'), (snapshot) => {
            const leagueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setLeagueMatches(leagueData);
        }, (error) => {
             console.error("Error fetching league matches: ", error);
        });

        // 3. 清理函數
        return () => {
            unsubscribeStudents();
            unsubscribeCompetitions();
            unsubscribeStars();
            unsubscribeLeagueMatches();
        };
    }, [user]); // 4. 關鍵！把 user 加入依賴陣列。當 user 狀態改變時（登入或登出），這個 useEffect 會重新執行。

    return {
        students,
        competitions,
        monthlyStars,
        leagueMatches,
    };
};
