// src/context/SidebarContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [collapsedWidth, setCollapsedWidth] = useState(80);

  const toggleSidebar = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  const getCurrentWidth = useCallback(() => {
    return collapsed ? collapsedWidth : sidebarWidth;
  }, [collapsed, collapsedWidth, sidebarWidth]);

  const value = {
    collapsed,
    setCollapsed,
    sidebarWidth,
    setSidebarWidth,
    collapsedWidth,
    setCollapsedWidth,
    toggleSidebar,
    getCurrentWidth,
    currentWidth: getCurrentWidth()
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};