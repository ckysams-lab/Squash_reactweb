// src/hooks/useFirebaseData.js
import { useState, useEffect } from 'react';
import { db, auth } from '../firebase'; 
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export const useFirebaseData = () => {
    const [students, setStudents] = useState([]);
    const [competitions, setCompetitions] = useState([]);
    const [monthlyStars, setMonthlyStars] = useState([]);
    const [leagueMatches, setLeagueMatches] = useState([]);

    useEffect(() => {
        let unsubscribeStudents;
        let unsubscribeCompetitions;
        let unsubscribeStars;
        let unsubscribeLeagueMatches;

        // 🚨 這是最關鍵的修正：定義正確的 appId 和基礎路徑 🚨
        const appId = 'bcklas-squash-core-v1';
        
        // 輔助函數：用來產生正確的長路徑
        const getCollectionPath = (collectionName) => {
            return collection(db, 'artifacts', appId, 'public', 'data', collectionName);
        };

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                console.log("✅ Hook Auth confirmed, starting fetch with correct path...");

                // 1. 使用修正後的方法抓取 Students
                unsubscribeStudents = onSnapshot(getCollectionPath('students'), (snapshot) => {
                    const studentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook fetched Students count:", studentsData.length);
                    setStudents(studentsData);
                }, (error) => console.error("Error fetching students: ", error));

                // 2. 抓取 Competitions (注意：您之前命名為 competitions，請確認您的資料庫確實是這個名字)
                const matchesQuery = query(getCollectionPath('competitions'), orderBy('date', 'desc'));
                unsubscribeCompetitions = onSnapshot(matchesQuery, (snapshot) => {
                    const matchesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook fetched Competitions count:", matchesData.length);
                    setCompetitions(matchesData);
                }, (error) => console.error("Error fetching competitions: ", error));

                // 3. 抓取 Monthly Stars
                const unsubscribeStars = onSnapshot(getCollectionPath('monthly_stars'), (snapshot) => {
                    const starsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook fetched Monthly Stars count:", starsData.length);
                    setMonthlyStars(starsData);
                }, (error) => console.error("Error fetching monthly stars: ", error));

                // 4. 抓取 League Matches
                const unsubscribeLeagueMatches = onSnapshot(getCollectionPath('league_matches'), (snapshot) => {
                    const leagueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    console.log("🔥 Hook fetched League Matches count:", leagueData.length);
                    setLeagueMatches(leagueData);
                }, (error) => console.error("Error fetching league matches: ", error));

            } else {
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

        return () => {
            unsubscribeAuth();
            if(unsubscribeStudents) unsubscribeStudents();
            if(unsubscribeCompetitions) unsubscribeCompetitions();
            if(unsubscribeStars) unsubscribeStars();
            if(unsubscribeLeagueMatches) unsubscribeLeagueMatches();
        };
    }, []);

    return {
        students,
        competitions,
        monthlyStars,
        leagueMatches,
    };
};
