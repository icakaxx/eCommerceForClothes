'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="flex min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      {/* Backdrop for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed position on desktop, overlay on mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <AdminSidebar
          currentPath={currentPath}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with hamburger button */}
        <div
          className="sticky top-0 z-20 flex items-center justify-between p-4 lg:hidden shadow-sm"
          style={{
            backgroundColor: theme.colors.surface,
            borderBottom: `1px solid ${theme.colors.border}`
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg transition-colors duration-300"
            style={{ color: theme.colors.text }}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <div
            className="text-lg font-semibold"
            style={{ color: theme.colors.text }}
          >
            Admin Panel
          </div>

          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}



