import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DurationInput({ open, onClose, onSubmit, habitName }) {
  const [hours, setHours] = useState(1);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(hours);
    setHours(1);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="duration-modal-title">
          <motion.div
            className="absolute inset-0 bg-on-surface/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative bg-surface-container-lowest rounded-2xl shadow-xl p-6 w-full max-w-xs"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <h3 id="duration-modal-title" className="font-headline font-bold text-lg mb-1">Log Time</h3>
            <p className="text-sm text-on-surface-variant mb-4">{habitName}</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Hours</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium text-center text-2xl"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow hover:opacity-90 active:scale-[0.98] transition-all">Log</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
