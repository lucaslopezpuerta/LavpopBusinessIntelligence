import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const navigateTo = useCallback((tabId) => {
        setActiveTab(tabId);
    }, []);

    return (
        <NavigationContext.Provider value={{ activeTab, navigateTo }}>
            {children}
        </NavigationContext.Provider>
    );
};

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
