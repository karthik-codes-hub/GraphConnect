import React, { useMemo, useState } from 'react';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { QUIZ_QUESTIONS, QuizQuestion } from '../data/quizQuestions';

export const QuizView: React.FC = () => {
  const [difficultyFilter, setDifficultyFilter] = useState<
    'All' | 'Beginner' | 'Intermediate' | 'Advanced'
  >('All');
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const filteredQuestions = useMemo(() => {
    if (difficultyFilter === 'All') return QUIZ_QUESTIONS;
    return QUIZ_QUESTIONS.filter((q) => q.difficulty === difficultyFilter);
  }, [difficultyFilter]);

  const answeredInView = filteredQuestions.filter(
    (q) => answers[q.id] !== undefined
  );
  const correctInView = answeredInView.filter(
    (q) => answers[q.id] === q.correctIndex
  );

  const totalAnswered = Object.keys(answers).length;
  const totalCorrect = QUIZ_QUESTIONS.filter(
    (q) => answers[q.id] === q.correctIndex
  ).length;
  const accuracyPct =
    totalAnswered === 0 ? 0 : Math.round((totalCorrect / totalAnswered) * 100);

  const handleSelectOption = (q: QuizQuestion, optIdx: number) => {
    if (answers[q.id] !== undefined) return; // Lock after first submission for authentic assessment
    setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header & Scoreboard */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Interactive DAA Assessment · {QUIZ_QUESTIONS.length} Curated Problems
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-slate-100">
            Practice & Quiz Module
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
            Test your mastery across BFS & DFS trace prediction, connected components, isolated vertices, asymptotic complexity, and algorithm selection with instant explanations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-xs font-mono tabular-nums">
            Score:{' '}
            <strong className="text-blue-600 dark:text-cyan-400">
              {totalCorrect} / {QUIZ_QUESTIONS.length}
            </strong>{' '}
            ({totalAnswered} Attempted · {accuracyPct}% Accuracy)
          </div>

          <button
            type="button"
            onClick={() => setAnswers({})}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Quiz</span>
          </button>
        </div>
      </div>

      {/* Difficulty Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter quiz difficulty"
          className="inline-flex p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/90 gap-1"
        >
          {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setDifficultyFilter(lvl)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                difficultyFilter === lvl
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
          Showing {filteredQuestions.length} questions · {correctInView.length}/
          {answeredInView.length} correct in filter
        </div>
      </div>

      {/* Final Performance Summary Card (shown once at least 5 questions or all questions answered) */}
      {totalAnswered > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-blue-600 dark:text-cyan-400 font-semibold">
              Live Assessment Summary
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900 dark:text-slate-100">
              {totalAnswered === QUIZ_QUESTIONS.length
                ? `Quiz Complete — Final Score: ${totalCorrect} / ${QUIZ_QUESTIONS.length} (${accuracyPct}%)`
                : `In Progress — ${totalCorrect} Correct out of ${totalAnswered} Answered (${accuracyPct}%)`}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {accuracyPct >= 85
                ? 'Strong command of graph traversal mechanics, SCC vs. WCC definitions, and O(V + E) analysis.'
                : accuracyPct >= 60
                ? 'Solid foundation! Review explanations on any missed items and test them interactively in the Comparison Lab.'
                : 'Keep practicing! Step through sample trees and cyclic graphs in the BFS and DFS Visualizers to build intuition.'}
            </p>
          </div>
          <div className="text-right font-mono tabular-nums shrink-0">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {accuracyPct}%
            </div>
            <div className="text-xs text-slate-500">
              {QUIZ_QUESTIONS.length - totalAnswered} remaining
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-5">
        {filteredQuestions.map((q) => {
          const userChoice = answers[q.id];
          const isAnswered = userChoice !== undefined;
          const isCorrect = userChoice === q.correctIndex;

          return (
            <div
              key={q.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Question {q.id.toString().padStart(2, '0')} · {q.category} ·{' '}
                  {q.difficulty}
                </span>
                {isAnswered && (
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isCorrect
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              <h3 className="text-base font-display font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {q.question}
              </h3>

              {q.graphContext && (
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0D1526] border border-slate-200/80 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200">
                  {q.graphContext}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, idx) => {
                  const isThisSelected = userChoice === idx;
                  const isThisRight = q.correctIndex === idx;

                  let styleClass =
                    'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0D1526] hover:border-blue-400 text-slate-800 dark:text-slate-200';
                  if (isAnswered) {
                    if (isThisRight) {
                      styleClass =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                    } else if (isThisSelected) {
                      styleClass =
                        'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200';
                    } else {
                      styleClass =
                        'border-slate-200 dark:border-slate-800 opacity-60 text-slate-600 dark:text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAnswered}
                      onClick={() => handleSelectOption(q, idx)}
                      className={`text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-colors flex items-start gap-2 ${styleClass}`}
                    >
                      <span className="font-mono font-bold shrink-0">
                        {`${String.fromCharCode(65 + idx)}. `}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0D1526] border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100">
                    Explanation (Correct Answer:{' '}
                    {String.fromCharCode(65 + q.correctIndex)}):
                  </strong>{' '}
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
