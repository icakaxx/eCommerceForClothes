'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:14',message:'initial state from localStorage',data:{saved,parsed:saved==='true'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return saved === 'true';
    }
    return false;
  });
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:20',message:'isCollapsed state changed',data:{isCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }, [isCollapsed]);
  // #endregion

  // Sync with localStorage changes from OTHER tabs/windows only
  // Note: We don't listen to sidebar-toggle events from same tab to avoid race conditions
  useEffect(() => {
    const handleStorageChange = (e?: StorageEvent) => {
      // Only handle storage events from other tabs (e will be defined for cross-tab events)
      // For same-tab, we update state directly in handleToggle
      if (e && e.key === 'admin-sidebar-collapsed') {
        const saved = localStorage.getItem('admin-sidebar-collapsed');
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:33',message:'storage event from other tab',data:{saved,parsed:saved==='true',currentIsCollapsed:isCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
        // #endregion
        setIsCollapsed(saved === 'true');
      }
    };
    
    // Listen for storage events (from other tabs/windows only)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isCollapsed]);

  const handleToggle = (collapsed: boolean) => {
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:52',message:'handleToggle called in AdminLayout',data:{newCollapsed:collapsed,currentIsCollapsed:isCollapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Update localStorage FIRST before state update to prevent race condition
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
      // #region agent log
      fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:56',message:'localStorage updated before state',data:{collapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    }
    setIsCollapsed(collapsed);
    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/4ac959d0-00f1-4827-be42-5302a13eec1d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:60',message:'setIsCollapsed called',data:{collapsed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    // Dispatch custom event for same-tab sync (but localStorage is already updated)
    window.dispatchEvent(new Event('sidebar-toggle'));
  };

  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <AdminSidebar 
        currentPath={currentPath} 
        collapsed={isCollapsed} 
        onToggle={handleToggle}
      />
      <main className="flex-1 overflow-auto transition-all duration-300">
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  );
}



