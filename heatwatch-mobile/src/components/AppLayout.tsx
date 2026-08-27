import type { ReactNode } from 'react';
import { BottomNavigation } from './BottomNavigation.tsx';
import { clsx } from 'clsx';
import { useHomeData } from '../hooks/useHomeData.ts';
import { DesktopCitizenPortal } from './DesktopCitizenPortal.tsx';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { weather } = useHomeData();

  const riskLevel = weather?.source === 'mock' ? 'low' : 'moderate'; // Example logic

  return (
    <div className={clsx(
      "relative min-h-screen",
      riskLevel === 'moderate' && "heat-warm"
    )}>
      <div className="hidden md:block">
        <DesktopCitizenPortal>{children}</DesktopCitizenPortal>
      </div>
      <div className="atmospheric-bg" />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8 pb-32 md:pb-12 md:hidden">
        {children}
      </main>

      <BottomNavigation />
    </div>
  );
}
