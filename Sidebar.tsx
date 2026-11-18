import React from 'react';
import {
  BookOpen,
  Calendar,
  CalendarClock,
  LayoutDashboard,
  Lock,
  ShieldCheck,
  Target,
  X,
} from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { NavSection } from '../types/vault';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ITEMS: Array<{ id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { id: 'schedule', label: 'My Schedule', icon: CalendarClock },
  { id: 'calendar', label: 'Calendar View', icon: Calendar },
  { id: 'targets', label: 'My Targets', icon: Target },
  { id: 'journal', label: 'My Journal', icon: BookOpen },
  { id: 'secrets', label: 'My Secrets', icon: Lock },
  { id: 'security', label: 'Backup & Security', icon: ShieldCheck },
];

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeSection, setActiveSection, isSecretsUnlocked, triggerEmergencyLock, secretsIdleRemaining } =
    useVault();

  const handleSelect = (id: NavSection) => {
    setActiveSection(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white dark:bg-[#0B101B] border-r border-slate-200 dark:border-[#1B263B] px-4 py-6">
      <div>
        <div className="flex items-center justify-between px-3 pb-6 border-b border-slate-200 dark:border-[#1B263B]">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] dark:bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37]">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-[#F8FAFC] whitespace-nowrap">
                MYVAULT
              </span>
            </div>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Your Life. Your Rules.</p>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-[#131C31]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Primary Navigation" className="mt-6 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-[#E5C158] dark:bg-[#131C31] dark:text-[#E5C158] border border-slate-800 dark:border-[#D4AF37]/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#11192C] dark:hover:text-white border border-transparent'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive
                        ? 'text-[#D4AF37]'
                        : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'secrets' && (
                  <span className="text-[11px] font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                    {isSecretsUnlocked
                      ? secretsIdleRemaining !== null
                        ? `${secretsIdleRemaining}s`
                        : 'Open'
                      : 'Locked'}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-slate-200 dark:border-[#1B263B] space-y-3">
        <button
          type="button"
          onClick={() => {
            onCloseMobile();
            triggerEmergencyLock();
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-500/20 dark:text-rose-300 transition-colors whitespace-nowrap"
        >
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>Emergency Lock</span>
        </button>
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Shortcut: Ctrl + Shift + L
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0">{sidebarContent}</aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
