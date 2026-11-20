import React, { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { GraphCanvas } from '../components/GraphCanvas';
import { LESSONS } from '../data/lessonsAndApps';
import { GraphData, PageId } from '../types/graph';

const COMPLETED_LESSONS_KEY = 'graphconnect_completed_lessons_v1';

interface LearningCenterViewProps {
  onLoadGraphAndNavigate: (graph: GraphData, target: PageId) => void;
}

export const LearningCenterView: React.FC<LearningCenterViewProps> = ({
  onLoadGraphAndNavigate,
}) => {
  const [selectedId, setSelectedId] = useState<string>(LESSONS[0].id);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_LESSONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const activeLesson =
    LESSONS.find((l) => l.id === selectedId) ?? LESSONS[0];
  const activeIdx = LESSONS.findIndex((l) => l.id === activeLesson.id);

  const toggleCompleted = (id: string) => {
    const next = completedIds.includes(id)
      ? completedIds.filter((x) => x !== id)
      : [...completedIds, id];
    setCompletedIds(next);
    try {
      localStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Structured Curriculum · 5 Foundational DAA Modules
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Educational Learning Center
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Master graph fundamentals, queue wavefronts, stack backtracking, connectivity theorems, and asymptotic complexity.
          </p>
        </div>

        <div className="text-xs font-mono text-slate-600 dark:text-slate-400 tabular-nums">
          Progress: {completedIds.length} / {LESSONS.length} Lessons Completed
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Curriculum Navigation */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2">
          {LESSONS.map((lesson) => {
            const isSelected = lesson.id === activeLesson.id;
            const isDone = completedIds.includes(lesson.id);
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedId(lesson.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-colors flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {lesson.number} · {lesson.readTime}
                  </div>
                  <div className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                    {lesson.title}
                  </div>
                </div>
                {isDone && (
                  <CheckCircle2
                    aria-label="Completed"
                    className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-1"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Lesson Reader + Interactive Diagram */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-7">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1.5">
              <div className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-semibold">
                {activeLesson.number} · {activeLesson.readTime}
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
                {activeLesson.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {activeLesson.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleCompleted(activeLesson.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                completedIds.includes(activeLesson.id)
                  ? 'bg-emerald-600 text-white'
                  : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {completedIds.includes(activeLesson.id)
                ? '✓ Marked Complete'
                : 'Mark Lesson Complete'}
            </button>
          </div>

          {/* Lesson Sections */}
          <div className="space-y-6">
            {activeLesson.sections.map((sec) => (
              <div key={sec.heading} className="space-y-3">
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100">
                  {sec.heading}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sec.body}
                </p>
                {sec.bullets && (
                  <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 pl-4 list-disc">
                    {sec.bullets.map((b, i) => (
                      <li key={i} className="leading-relaxed">
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
                {sec.code && (
                  <pre className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1526] border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed">
                    {sec.code}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {/* Interactive Lesson Diagram Preview */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-display font-bold text-slate-900 dark:text-slate-100">
                  Interactive Diagram: {activeLesson.demoGraph.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Send this example directly to the visualizer to step through its execution.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onLoadGraphAndNavigate(
                      JSON.parse(JSON.stringify(activeLesson.demoGraph)),
                      'bfs'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Open in BFS Visualizer
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onLoadGraphAndNavigate(
                      JSON.parse(JSON.stringify(activeLesson.demoGraph)),
                      'dfs'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold whitespace-nowrap"
                >
                  Open in DFS Visualizer
                </button>
              </div>
            </div>

            <GraphCanvas graph={activeLesson.demoGraph} heightClass="h-[290px]" />
          </div>

          {/* Lesson Pagination */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={activeIdx <= 0}
              onClick={() => setSelectedId(LESSONS[activeIdx - 1].id)}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
            >
              ← Previous Lesson
            </button>

            {activeIdx < LESSONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setSelectedId(LESSONS[activeIdx + 1].id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                <span>Next: {LESSONS[activeIdx + 1].title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                End of Curriculum — Ready for Practice Quiz!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
