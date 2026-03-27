import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HABIT_ICONS, TRACKING_TYPES } from '@mindful-flow/shared/constants';
import { useCategories } from '../hooks/useCategories';

export default function HabitModal({ open, onClose, onSave, habit = null }) {
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

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-4xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div className="p-8 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold font-headline tracking-tight">{habit ? 'Edit Habit' : 'Create Habit'}</h2>
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Habit Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                    placeholder="e.g., Morning Yoga" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Category</label>
                  <select
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
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Tracking Type</label>
                  <div className="grid grid-cols-2 p-1.5 bg-surface-container rounded-2xl">
                    <button type="button" onClick={() => setTrackingType('checkmark')}
                      className={`py-3 rounded-xl font-bold transition-all ${trackingType === 'checkmark' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>
                      Checkmark
                    </button>
                    <button type="button" onClick={() => setTrackingType('duration')}
                      className={`py-3 rounded-xl font-bold transition-all ${trackingType === 'duration' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>
                      Duration
                    </button>
                  </div>
                </div>
                {trackingType === 'duration' && (
                  <div>
                    <label className="block text-sm font-bold text-on-surface-variant mb-1">Weekly Target (hours)</label>
                    <input
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
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {HABIT_ICONS.map((ic) => (
                      <button key={ic} type="button" onClick={() => setIcon(ic)}
                        className={`p-2 rounded-xl transition-colors ${icon === ic ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                        <span className="material-symbols-outlined text-xl">{ic}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Color</label>
                  <div className="flex gap-3">
                    {['primary', 'secondary', 'tertiary'].map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        className={`w-10 h-10 rounded-full bg-${c} ${color === c ? 'ring-4 ring-offset-2 ring-primary/30' : ''}`} />
                    ))}
                  </div>
                </div>
                {trackingType === 'checkmark' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-on-surface-variant mb-1">Frequency</label>
                      <div className="grid grid-cols-2 p-1.5 bg-surface-container rounded-2xl">
                        <button type="button" onClick={() => setFrequency('daily')}
                          className={`py-3 rounded-xl font-bold transition-all ${frequency === 'daily' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>Daily</button>
                        <button type="button" onClick={() => setFrequency('weekly')}
                          className={`py-3 rounded-xl font-bold transition-all ${frequency === 'weekly' ? 'bg-surface-container-lowest shadow-sm text-primary' : 'text-on-surface-variant'}`}>Weekly</button>
                      </div>
                    </div>
                    {frequency === 'weekly' && (
                      <div>
                        <label className="block text-sm font-bold text-on-surface-variant mb-1">Weekly Target</label>
                        <div className="flex items-center gap-4">
                          <input type="range" min="1" max="7" value={target} onChange={(e) => setTarget(Number(e.target.value))}
                            className="flex-1 accent-primary h-2 bg-surface-container rounded-full" />
                          <span className="w-12 h-12 flex items-center justify-center bg-primary-container text-on-primary font-bold rounded-xl">{target}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Description (optional)</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-surface-container border-none focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/40 font-medium"
                    placeholder="e.g., 10 minutes session" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-4 px-6 border border-outline-variant/30 text-on-surface font-bold rounded-2xl hover:bg-surface-container transition-colors">Cancel</button>
                  <button type="submit"
                    className="flex-1 py-4 px-6 bg-primary text-on-primary font-bold rounded-2xl shadow-lg hover:opacity-90 active:scale-[0.98] transition-all">
                    {habit ? 'Update' : 'Save Habit'}
                  </button>
                </div>
              </form>
            </div>
            <div className="h-2 bg-gradient-to-r from-primary via-secondary to-tertiary opacity-50" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
