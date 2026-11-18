import React, { useMemo, useState } from 'react';
import { BookOpen, Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { JournalEntry, JournalMood } from '../types/vault';
import { formatReadableDate } from '../utils/scheduleHelpers';
import { getTodayISO } from '../utils/storage';

const MOODS: JournalMood[] = ['Focused', 'Driven', 'Calm', 'Grateful', 'Reflective', 'Challenged'];

export function JournalView() {
  const { journal, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useVault();
  const todayISO = getTodayISO();

  const [searchQuery, setSearchQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<'all' | JournalMood>('all');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(() => journal[0]?.id || null);
  const [isComposing, setIsComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(todayISO);
  const [title, setTitle] = useState('');
  const [mood, setMood] = useState<JournalMood>('Focused');
  const [reflection, setReflection] = useState('');
  const [experiences, setExperiences] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return journal.filter((entry) => {
      if (moodFilter !== 'all' && entry.mood !== moodFilter) return false;
      if (!q) return true;
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.reflection.toLowerCase().includes(q) ||
        entry.experiences.toLowerCase().includes(q) ||
        entry.lessonsLearned.toLowerCase().includes(q)
      );
    });
  }, [journal, searchQuery, moodFilter]);

  const activeEntry: JournalEntry | null =
    filteredEntries.find((e) => e.id === selectedEntryId) || filteredEntries[0] || null;

  const openNewComposer = () => {
    setEditingId(null);
    setDate(todayISO);
    setTitle('');
    setMood('Focused');
    setReflection('');
    setExperiences('');
    setLessonsLearned('');
    setIsComposing(true);
  };

  const openEditComposer = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setDate(entry.date);
    setTitle(entry.title);
    setMood(entry.mood);
    setReflection(entry.reflection);
    setExperiences(entry.experiences);
    setLessonsLearned(entry.lessonsLearned);
    setIsComposing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !reflection.trim()) return;

    if (editingId) {
      updateJournalEntry(editingId, {
        date,
        title: title.trim(),
        mood,
        reflection: reflection.trim(),
        experiences: experiences.trim(),
        lessonsLearned: lessonsLearned.trim(),
      });
    } else {
      addJournalEntry({
        date,
        title: title.trim(),
        mood,
        reflection: reflection.trim(),
        experiences: experiences.trim(),
        lessonsLearned: lessonsLearned.trim(),
      });
    }
    setIsComposing(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past entries or lessons..."
              className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] pl-9 pr-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#D4AF37] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by state of mind"
            value={moodFilter}
            onChange={(e) => setMoodFilter(e.target.value as 'all' | JournalMood)}
            className="rounded-lg border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] px-3 py-2 text-xs text-slate-700 dark:text-slate-200 focus:border-[#D4AF37] focus:outline-none"
          >
            <option value="all">All Reflections</option>
            {MOODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={openNewComposer}
          className="flex items-center gap-1.5 rounded-lg bg-[#0F172A] dark:bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-white dark:text-[#06080D] hover:bg-slate-800 dark:hover:bg-[#E5C158] whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Write Entry</span>
        </button>
      </div>

      {/* Composer */}
      {isComposing && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#1B263B]">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              {editingId ? 'Edit Journal Entry' : 'New Daily Journal Entry'}
            </h2>
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Entry Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summary title for today"
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Tone / Mindset
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as JournalMood)}
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              >
                {MOODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                About Your Day
              </label>
              <textarea
                rows={4}
                required
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Write freely about how your day unfolded..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Experiences &amp; Moments
              </label>
              <textarea
                rows={3}
                value={experiences}
                onChange={(e) => setExperiences(e.target.value)}
                placeholder="Notable conversations, breakthroughs, or experiences..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                Lessons Learned
              </label>
              <textarea
                rows={2}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="One principle or insight to carry forward..."
                className="w-full rounded-lg border border-slate-200 dark:border-[#1B263B] bg-slate-50 dark:bg-[#06080D] px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsComposing(false)}
              className="rounded-lg border border-slate-200 dark:border-[#1B263B] px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#D4AF37] px-5 py-2 text-xs font-semibold text-[#06080D] hover:bg-[#E5C158]"
            >
              {editingId ? 'Update Entry' : 'Save Journal Entry'}
            </button>
          </div>
        </form>
      )}

      {/* Split Archive + Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Entry Timeline List */}
        <section className="rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-[#1B263B] flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
              Previous Entries
            </h2>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {filteredEntries.length}
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">No journal entries found.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-[#1B263B] max-h-[540px] overflow-y-auto">
              {filteredEntries.map((entry) => {
                const selected = activeEntry?.id === entry.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => setSelectedEntryId(entry.id)}
                    className={`w-full text-left px-5 py-4 transition-colors ${
                      selected
                        ? 'bg-slate-900/5 dark:bg-[#131C31]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#101727]/60'
                    }`}
                  >
                    <p className="text-xs font-mono tabular-nums text-[#B8860B] dark:text-[#D4AF37]">
                      {formatReadableDate(entry.date)} · {entry.mood}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {entry.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {entry.reflection}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Active Entry Reader */}
        <section className="lg:col-span-2 rounded-xl border border-slate-200 dark:border-[#1B263B] bg-white dark:bg-[#0B101B] p-6 sm:p-8">
          {!activeEntry ? (
            <div className="py-16 text-center">
              <BookOpen className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Select an entry or write your first daily reflection.
              </p>
              <button
                type="button"
                onClick={openNewComposer}
                className="mt-4 rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-[#06080D]"
              >
                Write Today&apos;s Entry
              </button>
            </div>
          ) : (
            <article className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#1B263B]">
                <div>
                  <p className="text-xs font-mono tabular-nums text-[#B8860B] dark:text-[#D4AF37]">
                    {formatReadableDate(activeEntry.date)} · {activeEntry.mood}
                  </p>
                  <h2 className="mt-1.5 font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {activeEntry.title}
                  </h2>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditComposer(activeEntry)}
                    aria-label="Edit entry"
                    className="rounded-lg p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteJournalEntry(activeEntry.id)}
                    aria-label="Delete entry"
                    className="rounded-lg p-2 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Daily Reflection
                </h3>
                <p className="text-sm sm:text-[15px] leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-line max-w-[70ch]">
                  {activeEntry.reflection}
                </p>
              </div>

              {activeEntry.experiences && (
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-[#1B263B]">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Recorded Experiences
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line max-w-[70ch]">
                    {activeEntry.experiences}
                  </p>
                </div>
              )}

              {activeEntry.lessonsLearned && (
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-[#1B263B]">
                  <h3 className="text-xs font-semibold text-[#B8860B] dark:text-[#D4AF37]">
                    Lessons Learned
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-line max-w-[70ch]">
                    {activeEntry.lessonsLearned}
                  </p>
                </div>
              )}
            </article>
          )}
        </section>
      </div>
    </div>
  );
}
