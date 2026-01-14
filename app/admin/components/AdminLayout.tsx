'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import AdminSidebar from './AdminSidebar';
import AdminSearchBar from './AdminSearchBar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { theme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed');
      return saved === 'true';
    }
    return false;
  });

  // Calculate sidebar width
  const sidebarWidth = isCollapsed ? 64 : 256;

  // Sync with localStorage changes from OTHER tabs/windows only
  // Note: We don't listen to sidebar-toggle events from same tab to avoid race conditions
  useEffect(() => {
    const handleStorageChange = (e?: StorageEvent) => {
      // Only handle storage events from other tabs (e will be defined for cross-tab events)
      // For same-tab, we update state directly in handleToggle
      if (e && e.key === 'admin-sidebar-collapsed') {
        const saved = localStorage.getItem('admin-sidebar-collapsed');
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
    // Update localStorage FIRST before state update to prevent race condition
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', String(collapsed));
    }
    setIsCollapsed(collapsed);
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
      <AdminSearchBar 
        sidebarCollapsed={isCollapsed}
        sidebarWidth={sidebarWidth}
      />
      <main className="flex-1 overflow-auto transition-all duration-300">
        <div className="lg:pt-[56px] pt-16">
          {children}
        </div>
      </main>
    </div>
  );
}



