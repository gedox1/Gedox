import React, { useState } from 'react';
import { Award, Plus, Trash2, Trophy, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { TargetCategory, TargetHorizon } from '../types/vault';
import { formatDaysRemainingLabel, formatReadableDate, getDaysRemaining } from '../utils/scheduleHelpers';
import { addDaysISO, getTodayISO } from '../utils/storage';

type CategoryFilter = 'all' | TargetCategory;
type HorizonFilter = 'all' | TargetHorizon;

const CATEGORY_LABELS: Record<TargetCategory, string> = {
  academic: 'Academic',
  financial: 'Financial',
  personal: 'Personal',
  career: 'Career',
};

export function TargetsView() {
  const { targets, achievements, addTarget, updateTargetProgress, deleteTarget, addAchievement, deleteAchievement } =
    useVault();

  const todayISO = getTodayISO();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [horizonFilter, setHorizonFilter] = useState<HorizonFilter>('all');
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [showAchievementForm, setShowAchievementForm] = useState(false);

  // Target form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TargetCategory>('career');
  const [horizon, setHorizon] = useState<TargetHorizon>('short-term');
  const [targetDate, setTargetDate] = useState(() => addDaysISO(todayISO, 30));
  const [progress, setProgress] = useState(0);

  // Achievement form state
  const [achTitle, setAchTitle] = useState('');
  const [achCategory, setAchCategory] = useState<TargetCategory>('personal');
  const [achDate, setAchDate] = useState(todayISO);
  const [achNotes, setAchNotes] = useState('');

  const handleCreateTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTarget({
      title: title.trim(),
      description: description.trim(),
      category,
      horizon,
      targetDate,
      progress,
    });
    setTitle('');
    setDescription('');
    setProgress(0);
    setShowTargetForm(false);
  };

  const handleCreateAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!achTitle.trim()) return;
    addAchievement({
      title: achTitle.trim(),
      category: achCategory,
      achievedDate: achDate,
      notes: achNotes.trim(),
    });
    setAchTitle('');
    setAchNotes('');
    setShowAchievementForm(false);
  };

  const filteredTargets = targets.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (horizonFilter !== 'all' && t.horizon !== horizonFilter) return false;
    return true;
  });

  const filteredAchievements = achievements.filter((a) =>
    categoryFilter === 'all' ? true : a.category === categoryFilter
  );

  return (
    <div className="space-y-8">
      {/* Filter & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="tablist"
            aria-label="Target categories"
            className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-1"
          >
            {(['all', 'academic', 'financial', 'personal', 'career'] as CategoryFilter[]).map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={categoryFilter === cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-slate-900 text-[#E5C158] dark:bg-[#131C31] dark:text-[#E5C158]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Categories' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div
            role="tablist"
            aria-label="Target horizon"
            className="flex items-center gap-1 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-1"
          >
            {(['all', 'short-term', 'long-term'] as HorizonFilter[]).map((h) => (
              <button
                key={h}
                type="button"
                role="tab"
                aria-selected={horizonFilter === h}
                onClick={() => setHorizonFilter(h)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  horizonFilter === h
                    ? 'bg-slate-900 text-[#E5C158] dark:bg-[#131C31] dark:text-[#E5C158]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {h === 'all' ? 'All Horizons' : h}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setShowAchievementForm(true);
              setShowTargetForm(false);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#D4AF37]/60 whitespace-nowrap"
          >
            <Trophy className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span>Record Achievement</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowTargetForm(true);
              setShowAchievementForm(false);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#06080D] hover:bg-slate-800 dark:hover:bg-[#E5C158] whitespace-nowrap"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Target</span>
          </button>
        </div>
      </div>

      {/* Add Target Form */}
      {showTargetForm && (
        <form
          onSubmit={handleCreateTarget}
          className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1B263B]">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Set a New Target
            </h2>
            <button
              type="button"
              onClick={() => setShowTargetForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Target Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Master Quantitative Modeling or Save $20,000 Reserve"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TargetCategory)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="academic">Academic</option>
                <option value="financial">Financial</option>
                <option value="personal">Personal</option>
                <option value="career">Career</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Horizon
              </label>
              <select
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as TargetHorizon)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="short-term">Short-term</option>
                <option value="long-term">Long-term</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Target Completion Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Starting Progress ({progress}%)
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full accent-[#D4AF37] mt-2"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Success Criteria / Notes
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Define what completion looks like..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowTargetForm(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
            >
              Save Target
            </button>
          </div>
        </form>
      )}

      {/* Record Achievement Form */}
      {showAchievementForm && (
        <form
          onSubmit={handleCreateAchievement}
          className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1B263B]">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Record an Achievement
            </h2>
            <button
              type="button"
              onClick={() => setShowAchievementForm(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Achievement Title
              </label>
              <input
                type="text"
                required
                value={achTitle}
                onChange={(e) => setAchTitle(e.target.value)}
                placeholder="e.g., Published Research Paper or Cleared Debt Milestone"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={achCategory}
                onChange={(e) => setAchCategory(e.target.value as TargetCategory)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                <option value="academic">Academic</option>
                <option value="financial">Financial</option>
                <option value="personal">Personal</option>
                <option value="career">Career</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Date Achieved
              </label>
              <input
                type="date"
                value={achDate}
                onChange={(e) => setAchDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                rows={2}
                value={achNotes}
                onChange={(e) => setAchNotes(e.target.value)}
                placeholder="Context, metrics, or reflection..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAchievementForm(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
            >
              Save Achievement
            </button>
          </div>
        </form>
      )}

      {/* Targets Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Goals &amp; Progress
          </h2>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {filteredTargets.length} targets
          </span>
        </div>

        {filteredTargets.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-10 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No targets found in this filter.
            </p>
            <button
              type="button"
              onClick={() => setShowTargetForm(true)}
              className="mt-3 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
            >
              Create Target
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTargets.map((target) => {
              const daysLeft = getDaysRemaining(target.targetDate, todayISO);
              const isComplete = target.progress >= 100;

              return (
                <div
                  key={target.id}
                  className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                          {CATEGORY_LABELS[target.category]} · {target.horizon} ·{' '}
                          <span className="font-mono tabular-nums">
                            {isComplete
                              ? `Completed ${target.completedAt ? formatReadableDate(target.completedAt) : ''}`
                              : `${formatReadableDate(target.targetDate)} (${formatDaysRemainingLabel(daysLeft)})`}
                          </span>
                        </p>
                        <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900 dark:text-white">
                          {target.title}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTarget(target.id)}
                        aria-label={`Delete ${target.title}`}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {target.description && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {target.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-[#1B263B] space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Progress</span>
                      <span className="font-mono font-semibold tabular-nums text-[#B8860B] dark:text-[#D4AF37]">
                        {target.progress}%
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      aria-label={`Update progress for ${target.title}`}
                      value={target.progress}
                      onChange={(e) => updateTargetProgress(target.id, Number(e.target.value))}
                      className="w-full accent-[#D4AF37] cursor-pointer"
                    />

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateTargetProgress(target.id, Math.min(100, target.progress + 10))}
                          disabled={isComplete}
                          className="rounded-md border border-slate-200 dark:border-[#1B263B] px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-[#D4AF37]/50 disabled:opacity-40"
                        >
                          +10%
                        </button>
                        {!isComplete && (
                          <button
                            type="button"
                            onClick={() => updateTargetProgress(target.id, 100)}
                            className="rounded-md border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-2.5 py-1 text-xs font-medium text-[#B8860B] dark:text-[#E5C158] hover:bg-[#D4AF37]/20"
                          >
                            Mark 100%
                          </button>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {isComplete ? 'Achieved' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Achievements Section */}
      <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-[#1B263B]">
          <div className="flex items-center gap-2.5">
            <Award className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Recorded Achievements
            </h2>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            {filteredAchievements.length} logged
          </span>
        </div>

        {filteredAchievements.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Completed targets (100%) and manually logged wins appear here.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1B263B]">
            {filteredAchievements.map((ach) => (
              <div key={ach.id} className="flex items-start justify-between gap-4 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {ach.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {CATEGORY_LABELS[ach.category]} ·{' '}
                    <span className="font-mono tabular-nums">{formatReadableDate(ach.achievedDate)}</span>
                  </p>
                  {ach.notes && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{ach.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => deleteAchievement(ach.id)}
                  aria-label={`Delete achievement ${ach.title}`}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
