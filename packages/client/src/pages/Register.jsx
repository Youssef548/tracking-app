import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Registration failed');
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
        <h1 className="font-headline text-3xl font-extrabold text-on-surface mb-2">Create account</h1>
        <p className="text-on-surface-variant mb-8">Start your mindful journey</p>
        {error && (
          <div className="bg-error-container/20 text-error p-3 rounded-xl text-sm font-medium mb-4">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-bold text-on-surface-variant mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
              className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium" placeholder="••••••" />
          </div>
          <button type="submit" className="w-full py-4 bg-primary text-on-primary font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all">
            Create Account
          </button>
        </form>
        <p className="text-center text-on-surface-variant text-sm mt-6">
          Already have an account? <Link to="/login" className="text-primary font-semibold">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
