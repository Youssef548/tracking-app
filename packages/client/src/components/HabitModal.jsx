import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { HABIT_ICONS, TRACKING_TYPES } from '@mindful-flow/shared/constants';
import { useCategories } from '../hooks/useCategories';

export default function HabitModal({ open, onClose, onSave, habit = null, isPending = false }) {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [target, setTarget] = useState(3);
  const [icon, setIcon] = useState('check_circle');
  const [color, setColor] = useState('primary');
  const [description, setDescription] = useState('');
  const { data: categories = [] } = useCategories();
  const [categoryId, setCategoryId] = useState('');
  const [trackingType, setTrackingType] = useState('checkmark');
  const [weeklyTarget, setWeeklyTarget] = useState(8);
  const shouldReduce = useReducedMotion();
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setFrequency(habit.frequency);
      setTarget(habit.target);
      setIcon(habit.icon);
      setColor(habit.color);
      setDescription(habit.description || '');
      setCategoryId(habit.categoryId?._id || habit.categoryId || '');
      setTrackingType(habit.trackingType || 'checkmark');
      setWeeklyTarget(habit.weeklyTarget || 8);
    } else {
      setName('');
      setFrequency('daily');
      setTarget(3);
      setIcon('check_circle');
      setColor('primary');
      setDescription('');
      setCategoryId('');
      setTrackingType('checkmark');
      setWeeklyTarget(8);
    }
  }, [habit, open]);

  // Focus close button when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [open]);

  // Escape key closes modal
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
    const data = {
      name, icon, color, description,
      categoryId: categoryId || null,
      trackingType,
    };
    if (trackingType === 'checkmark') {
      data.frequency = frequency;
      data.target = frequency === 'daily' ? 1 : target;
    } else {
      data.frequency = 'weekly';
      data.weeklyTarget = weeklyTarget;
      data.target = 1;
    }
    onSave(data);
  }

  const motionProps = shouldReduce
    ? {}
    : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, transition: { duration: 0.25, ease: 'easeOut' } };

  const backdropProps = shouldReduce
    ? {}
    : { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.2 } };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="habit-modal-title"
        >
          <motion.div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            {...backdropProps}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            className="relative w-full max-w-lg w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-4xl shadow-xl overflow-hidden flex flex-col max-h-[90dvh]"
            {...motionProps}
          >
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-8">
                <h2 id="habit-modal-title" className="text-2xl font-bold font-headline tracking-tight">
                  {habit ? 'Edit Habit' : 'Create Habit'}
                </h2>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="habit-name" className="block text-sm font-bold text-on-surface-variant mb-1">Habit Name</label>
                  <input id="habit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                    placeholder="e.g., Morning Yoga" />
                </div>
                <div>
                  <label htmlFor="habit-category" className="block text-sm font-bold text-on-surface-variant mb-1">Category</label>
                  <select id="habit-category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                  >
                    <option value="">None</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="block text-sm font-bold text-on-surface-variant mb-1" id="tracking-type-label">Tracking Type</span>
                  <div className="grid grid-cols-2 p-1.5 bg-surface-container rounded-2xl" role="group" aria-labelledby="tracking-type-label">
                    <button type="button" onClick={() => setTrackingType('checkmark')}
                      aria-pressed={trackingType === 'checkmark'}
                      className={`py-3 rounded-xl font-bold transition-all ${trackingType === 'checkmark' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>
                      Checkmark
                    </button>
                    <button type="button" onClick={() => setTrackingType('duration')}
                      aria-pressed={trackingType === 'duration'}
                      className={`py-3 rounded-xl font-bold transition-all ${trackingType === 'duration' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>
                      Duration
                    </button>
                  </div>
                </div>
                {trackingType === 'duration' && (
                  <div>
                    <label htmlFor="weekly-target-hours" className="block text-sm font-bold text-on-surface-variant mb-1">Weekly Target (hours)</label>
                    <input id="weekly-target-hours"
                      type="number"
                      min="1"
                      max="168"
                      value={weeklyTarget}
                      onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                      className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface font-medium"
                    />
                  </div>
                )}
                <div>
                  <span className="block text-sm font-bold text-on-surface-variant mb-1" id="icon-label">Icon</span>
                  <div className="flex flex-wrap gap-2" role="group" aria-labelledby="icon-label">
                    {HABIT_ICONS.map((ic) => (
                      <button key={ic} type="button" onClick={() => setIcon(ic)}
                        aria-label={ic.replace(/_/g, ' ')}
                        aria-pressed={icon === ic}
                        className={`p-2 rounded-xl transition-colors ${icon === ic ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                        <span className="material-symbols-outlined text-xl" aria-hidden="true">{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-bold text-on-surface-variant mb-1" id="color-label">Color</span>
                  <div className="flex gap-3" role="group" aria-labelledby="color-label">
                    {['primary', 'secondary', 'tertiary'].map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        aria-label={`${c} color`}
                        aria-pressed={color === c}
                        className={`w-10 h-10 rounded-full bg-${c} ${color === c ? 'ring-4 ring-offset-2 ring-primary/30' : ''}`} />
                    ))}
                  </div>
                </div>
                {trackingType === 'checkmark' && (
                  <>
                    <div>
                      <span className="block text-sm font-bold text-on-surface-variant mb-1" id="frequency-label">Frequency</span>
                      <div className="grid grid-cols-2 p-1.5 bg-surface-container rounded-2xl" role="group" aria-labelledby="frequency-label">
                        <button type="button" onClick={() => setFrequency('daily')}
                          aria-pressed={frequency === 'daily'}
                          className={`py-3 rounded-xl font-bold transition-all ${frequency === 'daily' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>Daily</button>
                        <button type="button" onClick={() => setFrequency('weekly')}
                          aria-pressed={frequency === 'weekly'}
                          className={`py-3 rounded-xl font-bold transition-all ${frequency === 'weekly' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>Weekly</button>
                      </div>
                    </div>
                    {frequency === 'weekly' && (
                      <div>
                        <label htmlFor="weekly-target-days" className="block text-sm font-bold text-on-surface-variant mb-1">Weekly Target</label>
                        <div className="flex items-center gap-4">
                          <input id="weekly-target-days" type="range" min="1" max="7" value={target}
                            onChange={(e) => setTarget(Number(e.target.value))}
                            aria-valuetext={`${target} day${target !== 1 ? 's' : ''} per week`}
                            className="flex-1 accent-primary h-2 bg-surface-container rounded-full" />
                          <span className="w-12 h-12 flex items-center justify-center bg-primary-container text-on-primary font-bold rounded-xl" aria-hidden="true">{target}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label htmlFor="habit-description" className="block text-sm font-bold text-on-surface-variant mb-1">Description (optional)</label>
                  <input id="habit-description" type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                    placeholder="e.g., 10 minutes session" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-4 px-6 border border-outline-variant/30 text-on-surface font-bold rounded-2xl hover:bg-surface-container transition-colors">Cancel</button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 py-4 px-6 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                    {isPending ? 'Saving…' : habit ? 'Update' : 'Save Habit'}
                  </button>
                </div>
              </form>
            </div>
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-tertiary opacity-50" aria-hidden="true" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
