import { Home, ClipboardCheck, LayoutList, Bell, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: ClipboardCheck, label: 'Check', path: '/check' },
  { icon: LayoutList, label: 'Survey', path: '/survey' },
  { icon: Bell, label: 'Alerts', path: '/alerts' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export function BottomNavigation() {
  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none z-50">
      <nav className="max-w-md mx-auto h-16 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl flex items-center justify-around px-2 pointer-events-auto shadow-lg shadow-slate-900/5">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center flex-1 h-12 rounded-xl transition-colors relative",
                isActive ? "text-blue-600 font-semibold" : "text-slate-400 hover:text-slate-600 font-medium"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-1 bg-blue-50/80 rounded-lg -z-10"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}