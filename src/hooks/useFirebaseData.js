// src/hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; // 👈 確保引入了 auth
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // 👈 引入這個

export const useFirebaseData = () => { // 👈 移除 user 參數
    const [students, setStudents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [monthlyStars, setMonthlyStars] = useState([]);
    const [leagueMatches, setLeagueMatches] = useState([]);

    useEffect(() => {
        // 宣告退訂函數的變數
        let unsubscribeStudents;
        let unsubscribeCompetitions;
        let unsubscribeStars;
        let unsubscribeLeagueMatches;

        // 核心改變：Hook 自己監聽 Auth 狀態，這是最可靠的！
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log("✅ Hook Auth confirmed, starting fetch...");

                // 只有在 Auth 絕對確認後，才掛載資料監聽器
                unsubscribeStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
                    const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook fetched Students count:", studentsData.length);
                    setStudents(studentsData);
                }, (error) => console.error("Error fetching students: ", error));

                const matchesQuery = query(collection(db, 'matches'), orderBy('date', 'desc'));
                unsubscribeCompetitions = onSnapshot(matchesQuery, (snapshot) => {
                    const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setCompetitions(matchesData);
                }, (error) => console.error("Error fetching competitions: ", error));

                unsubscribeStars = onSnapshot(collection(db, 'monthly_stars'), (snapshot) => {
                    const starsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setMonthlyStars(starsData);
                }, (error) => console.error("Error fetching monthly stars: ", error));

                unsubscribeLeagueMatches = onSnapshot(collection(db, 'league_matches'), (snapshot) => {
                    const leagueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setLeagueMatches(leagueData);
                }, (error) => console.error("Error fetching league matches: ", error));

            } else {
                // 登出時，清空資料並取消監聽
                console.log("❌ Hook Auth logged out, clearing data.");
                setStudents([]);
                setCompetitions([]);
                setMonthlyStars([]);
                setLeagueMatches([]);
                
                if(unsubscribeStudents) unsubscribeStudents();
                if(unsubscribeCompetitions) unsubscribeCompetitions();
                if(unsubscribeStars) unsubscribeStars();
                if(unsubscribeLeagueMatches) unsubscribeLeagueMatches();
            }
        });

        // Hook 卸載時的清理工作
        return () => {
            unsubscribeAuth(); // 取消 Auth 監聽
            if(unsubscribeStudents) unsubscribeStudents();
            if(unsubscribeCompetitions) unsubscribeCompetitions();
            if(unsubscribeStars) unsubscribeStars();
            if(unsubscribeLeagueMatches) unsubscribeLeagueMatches();
        };
    }, []); // 👈 依賴陣列為空，因為我們靠內部監聽 Auth 變化

    return {
        students,
        competitions,
        monthlyStars,
        leagueMatches,
    };
};
