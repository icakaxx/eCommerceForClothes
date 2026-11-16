'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { getAdminSession } from '@/lib/auth';

function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] || '?';
  const parts = local.split(/[._\-+\s]+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function displayName(email: string): string {
  const local = email.split('@')[0] || email;
  return local.replace(/[._-]/g, ' ').trim() || email;
}

type Props = {
  showLabel?: boolean;
  className?: string;
};

export default function AdminUserBadge({ showLabel = true, className = '' }: Props) {
  const { theme } = useTheme();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    void getAdminSession().then((session) => {
      setEmail(session?.user?.email ?? null);
    });
  }, []);

  if (!email) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`} title={email}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
        style={{ backgroundColor: theme.colors.primary }}
        aria-hidden
      >
        {initialsFromEmail(email)}
      </div>
      {showLabel ? (
        <span className="hidden max-w-[200px] truncate text-sm sm:inline" style={{ color: theme.colors.text }}>
          {displayName(email)}
        </span>
      ) : null}
    </div>
  );
}