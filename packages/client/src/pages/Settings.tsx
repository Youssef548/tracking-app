import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import type { User } from '@mindful-flow/shared/types';

interface ThemeOption {
  value: 'light' | 'dark' | 'auto';
  icon: string;
  label: string;
}

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'light', icon: '☀️', label: 'Light' },
  { value: 'dark',  icon: '🌙', label: 'Dark'  },
  { value: 'auto',  icon: '💻', label: 'Auto'  },
];

interface ProfileCardProps {
  user: User | null;
  updateUser: (user: User) => void;
}

function ProfileCard({ user, updateUser }: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setSaved(false);
    setLoading(true);
    try {
      const body: { name?: string; email?: string } = {};
      if (name !== user?.name) body.name = name;
      if (email !== user?.email) body.email = email;
      if (Object.keys(body).length === 0) { setEditing(false); setLoading(false); return; }

      const res = await api.put<{ user: User }>('/auth/profile', body);
      updateUser(res.data.user);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = axiosErr.response?.data?.error?.message ?? 'Failed to save. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setError('');
    setEditing(false);
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 border border-outline-variant/20">
      <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-3">Profile</p>

      {!editing ? (
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold font-headline text-xl flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-headline font-semibold text-on-surface truncate">{user?.name}</div>
            <div className="text-sm text-on-surface-variant truncate">{user?.email}</div>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 rounded-xl transition-colors"
          >
            Edit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 border border-outline-variant/30 text-on-surface font-semibold rounded-2xl text-sm hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { void handleSave(); }}
              disabled={loading}
              className="flex-1 py-2.5 bg-primary text-on-primary font-semibold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {saved && (
        <p className="text-xs text-success font-semibold mt-2">Profile updated.</p>
      )}
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setError('');
    setSaved(false);
    if (!currentPassword || !newPassword) {
      setError('Both fields are required.');
      return;
    }
    setLoading(true);
    try {
      await api.put('/auth/profile', { currentPassword, password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } } };
      const msg = axiosErr.response?.data?.error?.message ?? 'Failed to update password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-3xl p-5 mb-4 border border-outline-variant/20">
      <p className="text-xs font-bold text-on-surface-variant tracking-widest uppercase mb-3">Security</p>
      <p className="font-headline font-semibold text-on-surface mb-3">Change Password</p>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">Current password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-on-surface-variant mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl border border-outline-variant/30 bg-surface text-on-surface text-sm focus:outline-none focus:border-primary"
          />
        </div>
        {error && <p className="text-xs text-error">{error}</p>}
        {saved && <p className="text-xs text-success font-semibold">Password updated.</p>}
        <button
          onClick={() => { void handleSave(); }}
          disabled={loading}
          className="w-full py-2.5 bg-primary text-on-primary font-semibold rounded-2xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 mt-1"
        >
          {loading ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-1">Settings</h1>
        <p className="text-on-surface-variant text-sm">Manage your preferences</p>
      </div>

      <ProfileCard user={user} updateUser={updateUser} />
      <PasswordCard />

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
              aria-pressed={theme === value}
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
