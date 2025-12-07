'use client';

import { useTheme } from '@/context/ThemeContext';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPath: string;
}

export default function AdminLayout({ children, currentPath }: AdminLayoutProps) {
  const { theme } = useTheme();

  return (
    <div
      className="flex flex-col lg:flex-row min-h-screen transition-colors duration-300"
      style={{ backgroundColor: theme.colors.background }}
    >
      <AdminSidebar currentPath={currentPath} />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
