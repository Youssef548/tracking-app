import { useState } from 'react';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit } from '../hooks/useHabits';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories';
import HabitModal from '../components/HabitModal';
import CategoryModal from '../components/CategoryModal';
import FAB from '../components/FAB';
import AnimatedList, { AnimatedItem } from '../components/AnimatedList';

const colorMap = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', progress: 'bg-primary' },
  secondary: { bg: 'bg-secondary/10', text: 'text-secondary', progress: 'bg-secondary' },
  tertiary: { bg: 'bg-tertiary/10', text: 'text-tertiary', progress: 'bg-tertiary' },
};

export default function Habits() {
  const { data: habits = [] } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  function handleSave(data) {
    if (editing) {
      updateHabit.mutate({ id: editing._id, ...data });
    } else {
      createHabit.mutate(data);
    }
    setModalOpen(false);
    setEditing(null);
  }

  function handleEdit(habit) {
    setEditing(habit);
    setModalOpen(true);
  }

  function handleDelete(id) {
    if (window.confirm('Archive this habit?')) {
      deleteHabit.mutate(id);
    }
  }

  function handleSaveCategory(data) {
    if (editingCat) {
      updateCategory.mutate({ id: editingCat._id, ...data });
    } else {
      createCategory.mutate(data);
    }
    setCatModalOpen(false);
    setEditingCat(null);
  }

  function handleDeleteCategory(id) {
    if (window.confirm('Delete this category? Habits in this category will become uncategorized.')) {
      deleteCategory.mutate(id);
    }
  }

  return (
    <>
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-3">Habit Ecosystem</h1>
          <p className="text-on-surface-variant text-lg">Nurture your daily rituals and track your evolution.</p>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-8 py-4 bg-primary text-on-primary rounded-xl font-semibold active:scale-95 transition-transform shadow-sm">
          <span className="material-symbols-outlined">add_circle</span>
          <span>New Habit</span>
        </button>
      </div>

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-headline text-xl font-bold">Categories</h2>
          <button
            onClick={() => { setEditingCat(null); setCatModalOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-semibold active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Category
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <div key={cat._id} className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2.5 rounded-xl border border-outline-variant/10 group">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
              <span className="font-semibold text-sm">{cat.name}</span>
              <span className="text-xs text-on-surface-variant">
                {habits.filter((h) => (h.categoryId?._id || h.categoryId) === cat._id).length} habits
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                <button onClick={() => { setEditingCat(cat); setCatModalOpen(true); }}
                  className="p-1 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button onClick={() => handleDeleteCategory(cat._id)}
                  className="p-1 text-on-surface-variant hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-on-surface-variant">No categories yet. Create one to organize your habits.</p>
          )}
        </div>
      </div>

      <AnimatedList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {habits.map((habit) => {
          const colors = colorMap[habit.color] || colorMap.primary;
          return (
            <AnimatedItem key={habit._id}>
            <div className="group bg-surface-container-lowest p-7 rounded-4xl border border-outline-variant/10 hover:border-primary/20 transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl ${colors.bg} ${colors.text}`}>
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{habit.icon}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleEdit(habit)} className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button onClick={() => handleDelete(habit._id)} className="p-2 text-on-surface-variant hover:text-error transition-colors">
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
              {habit.categoryId && habit.categoryId.name && (
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"
                  style={{
                    backgroundColor: `${habit.categoryId.color}15`,
                    color: habit.categoryId.color,
                  }}
                >
                  {habit.categoryId.name}
                </span>
              )}
              <h3 className="text-xl font-bold font-headline mb-2">{habit.name}</h3>
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-surface-container-high rounded-lg text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  {habit.frequency}
                </span>
                {habit.description && <span className="text-sm text-on-surface-variant">{habit.description}</span>}
              </div>
            </div>
            </AnimatedItem>
          );
        })}
      </AnimatedList>

      {habits.length === 0 && (
        <p className="text-on-surface-variant text-center py-20 text-lg">No habits yet. Create your first one!</p>
      )}

      <HabitModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} habit={editing} />
      <CategoryModal
        open={catModalOpen}
        onClose={() => { setCatModalOpen(false); setEditingCat(null); }}
        onSave={handleSaveCategory}
        category={editingCat}
      />
      <FAB onClick={() => { setEditing(null); setModalOpen(true); }} />
    </>
  );
}
