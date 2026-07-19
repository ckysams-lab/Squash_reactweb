// File: src/context/AppContext.jsx
// Version: 1.0 (Initial Context Setup)

import React, { createContext, useContext } from 'react';

// 建立全域管網
const AppContext = createContext();

// 建立水龍頭 (Hook)，讓其他頁面可以取用資料
export const useAppContext = () => {
    return useContext(AppContext);
};

// 建立供水站 (Provider)
export const AppProvider = ({ children, value }) => {
    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};
