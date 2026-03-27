import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CATEGORY_COLORS } from '@mindful-flow/shared/constants';

export default function CategoryModal({ open, onClose, onSave, category = null }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CATEGORY_COLORS[0]);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
    } else {
      setName('');
      setColor(CATEGORY_COLORS[0]);
    }
  }, [category, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  function handleSubmit(e) {
    e.preventDefault();
    onSave({ name: name.trim(), color });
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog" aria-modal="true" aria-labelledby="category-modal-title">
          <motion.div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            {...(shouldReduce ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } })}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-sm bg-surface-container-lowest rounded-3xl shadow-xl overflow-hidden"
            {...(shouldReduce ? {} : { initial: { opacity: 0, scale: 0.97 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.97 }, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } })}
          >
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <h2 id="category-modal-title" className="text-xl font-bold font-headline">{category ? 'Edit Category' : 'New Category'}</h2>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={50}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                  placeholder="e.g., Religion"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      aria-label={`Color ${c}`}
                      aria-pressed={color === c}
                      className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-4 ring-offset-2 ring-primary/30 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 border border-outline-variant/30 text-on-surface font-bold rounded-xl hover:bg-surface-container transition-colors">Cancel</button>
                <button type="submit"
                  className="flex-1 py-3 bg-primary text-on-primary font-bold rounded-xl shadow hover:opacity-90 active:scale-[0.98] transition-all">
                  {category ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
