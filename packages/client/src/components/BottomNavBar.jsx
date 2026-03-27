import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/',          icon: 'home',           label: 'Home'      },
  { to: '/calendar',  icon: 'calendar_month', label: 'Calendar'  },
  { to: '/habits',    icon: 'add_circle',     label: 'Add',    special: true },
  { to: '/analytics', icon: 'analytics',      label: 'Analytics' },
  { to: '/habits',    icon: 'checklist',      label: 'Habits'    },
  { to: '/settings',  icon: 'settings',       label: 'Settings'  },
];

export default function BottomNavBar() {
  return (
    <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 md:hidden bg-surface-container-lowest/85 backdrop-blur-2xl border-t border-outline-variant/20 shadow-lg">
      {tabs.map((t, i) => (
        <NavLink key={i} to={t.to} end={t.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-transform active:scale-95 duration-150 ${
              isActive ? 'text-primary' : 'text-on-surface-variant'
            }`
          }>
          <span className={`material-symbols-outlined ${t.special ? 'text-3xl text-primary' : ''}`}>
            {t.icon}
          </span>
          <span className="text-[10px] font-semibold mt-1">{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
