import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const THEME_OPTIONS = [
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'dark',  icon: '🌙', label: 'Dark'  },
  { value: 'auto',  icon: '💻', label: 'Auto'  },
];

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-1">Settings</h1>
        <p className="text-on-surface-variant text-sm">Manage your preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 flex items-center gap-4 border border-outline-variant/20">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline text-xl flex-shrink-0">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-headline font-semibold text-on-surface truncate">{user?.name}</div>
          <div className="text-sm text-on-surface-variant truncate">{user?.email}</div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 border border-outline-variant/20">
        <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-3">
          Appearance
        </p>
        <p className="font-headline font-semibold text-on-surface mb-3">Theme</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ value, icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`py-3 rounded-2xl border-2 flex flex-col items-center gap-1 transition-colors text-sm font-semibold ${
                theme === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-outline-variant/30 text-on-surface-variant hover:border-primary/40'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-on-surface-variant text-center mt-3">
          Auto follows your device's system setting
        </p>
      </div>

      {/* Account */}
      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden border border-outline-variant/20">
        <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase px-5 pt-5 pb-3">
          Account
        </p>
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/15">
          <span className="text-on-surface text-sm">Notifications</span>
          <span className="text-secondary text-sm font-semibold">On</span>
        </div>
        <div className="px-5 py-4 border-t border-outline-variant/15">
          <button
            onClick={logout}
            className="w-full py-3 rounded-2xl bg-tertiary/10 text-tertiary font-semibold text-sm hover:bg-tertiary/15 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
