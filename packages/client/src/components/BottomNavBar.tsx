import { NavLink } from 'react-router-dom';

interface TabItem {
  to: string;
  icon: string;
  label: string;
}

const tabs: TabItem[] = [
  { to: '/',          icon: 'home',           label: 'Home'      },
  { to: '/habits',    icon: 'checklist',      label: 'Habits'    },
  { to: '/weekly',    icon: 'view_week',      label: 'Weekly'    },
  { to: '/calendar',  icon: 'calendar_month', label: 'Calendar'  },
  { to: '/analytics', icon: 'analytics',      label: 'Analytics' },
];

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-surface-container-lowest/85 backdrop-blur-2xl border-t border-outline-variant/20 shadow-lg">
      {tabs.map((t, i) => (
        <NavLink key={i} to={t.to} end={t.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[44px] min-h-[44px] transition-transform active:scale-95 duration-150 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }>
          <span className="material-symbols-outlined" aria-hidden="true">
            {t.icon}
          </span>
          <span className="text-[10px] font-semibold mt-1">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
