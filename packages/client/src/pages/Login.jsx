import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <motion.div
        className="w-full max-w-md bg-surface-container-lowest p-8 rounded-4xl shadow-lg"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-2">Welcome back</h1>
        <p className="text-on-surface-variant mb-8">Sign in to The Mindful Flow</p>
        {error && (
          <div className="bg-error-container/20 text-error p-3 rounded-xl text-sm font-medium mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="••••••" />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all">
            Sign In
          </button>
        </form>
        <p className="text-center text-on-surface-variant text-sm mt-6">
          Don't have an account? <Link to="/register" className="text-primary font-semibold">Sign up</Link>
        </p>
      </motion.div>
    </div>
  );
}
