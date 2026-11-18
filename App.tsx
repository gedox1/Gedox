/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalendarView } from './components/CalendarView';
import { DashboardView } from './components/DashboardView';
import { EmergencyLockScreen } from './components/EmergencyLockScreen';
import { JournalView } from './components/JournalView';
import { ScheduleView } from './components/ScheduleView';
import { SecretsView } from './components/SecretsView';
import { SecurityBackupView } from './components/SecurityBackupView';
import { Sidebar } from './components/Sidebar';
import { TargetsView } from './components/TargetsView';
import { TopBar } from './components/TopBar';
import { VaultProvider, useVault } from './context/VaultContext';
import { AuthGate } from './components/AuthGate';

function VaultWorkspace() {
  const { activeSection } = useVault();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#F4F6FA] dark:bg-[#06080D] text-slate-900 dark:text-[#F1F5F9]">
      <Sidebar mobileOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {activeSection === 'dashboard' && <DashboardView />}
          {activeSection === 'schedule' && <ScheduleView />}
          {activeSection === 'calendar' && <CalendarView />}
          {activeSection === 'targets' && <TargetsView />}
          {activeSection === 'journal' && <JournalView />}
          {activeSection === 'secrets' && <SecretsView />}
          {activeSection === 'security' && <SecurityBackupView />}
        </main>
      </div>

      <EmergencyLockScreen />
    </div>
  );
}

export default function App() {
  return (
    <VaultProvider>
      <AuthGate>
        <VaultWorkspace />
      </AuthGate>
    </VaultProvider>
  );
}
