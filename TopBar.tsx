import React from 'react';
import { Lock, Menu, Moon, Sun } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { NavSection } from '../types/vault';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

const SECTION_TITLES: Record<NavSection, string> = {
  dashboard: 'My Dashboard',
  schedule: 'My Schedule & Routines',
  calendar: 'Calendar View',
  targets: 'My Targets & Achievements',
  journal: 'My Journal',
  secrets: 'My Secrets Vault',
  security: 'Backup & Security',
};

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const { activeSection, securityConfig, toggleTheme, triggerEmergencyLock } = useVault();

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 dark:border-[#1B263B] bg-white/95 dark:bg-[#06080D]/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 h-14">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
          className="lg:hidden rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#131C31]"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-display text-base sm:text-lg font-semibold text-slate-900 dark:text-[#F8FAFC] truncate">
            {SECTION_TITLES[activeSection]}
          </h1>
          <span className="hidden md:inline text-slate-300 dark:text-slate-700" aria-hidden="true">
            /
          </span>
          <span className="hidden md:inline text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {todayFormatted}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={securityConfig.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#0D1424] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#D4AF37]/50 transition-colors whitespace-nowrap shrink-0"
        >
          {securityConfig.theme === 'dark' ? (
            <>
              <Sun className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-slate-700" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={triggerEmergencyLock}
          className="flex items-center gap-2 rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-3.5 py-1.5 text-xs font-semibold text-white dark:text-[#06080D] hover:bg-slate-800 dark:hover:bg-[#E5C158] transition-colors whitespace-nowrap shrink-0"
        >
          <Lock className="h-3.5 w-3.5" />
          <span>Lock App</span>
        </button>
      </div>
    </header>
  );
}
