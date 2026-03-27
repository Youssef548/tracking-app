import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const links = [
  { to: '/',          label: 'Home'      },
  { to: '/calendar',  label: 'Calendar'  },
  { to: '/weekly',    label: 'Weekly'    },
  { to: '/analytics', label: 'Analytics' },
  { to: '/habits',    label: 'Habits'    },
];

export default function TopNavBar() {
  const { user } = useAuth();

  return (
    <header className="hidden md:block bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-sm sticky top-0 z-50">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="text-xl font-bold tracking-tighter text-on-surface font-headline">
          The Mindful Flow
        </div>

        <nav className="flex items-center space-x-8">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) =>
                `font-headline text-sm tracking-tight transition-colors ${
                  isActive
                    ? 'text-primary font-semibold border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`
              }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center space-x-3">
          <NotificationDropdown />
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `p-2 rounded-full transition-colors ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`
            }
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </NavLink>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
