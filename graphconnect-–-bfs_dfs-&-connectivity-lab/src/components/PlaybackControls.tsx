import React from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';

export interface PlaybackControlsProps {
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  speedMultiplier: number;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
  onSeek: (step: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  currentStep,
  totalSteps,
  isPlaying,
  speedMultiplier,
  onPlayPause,
  onPrev,
  onNext,
  onRestart,
  onSeek,
  onSpeedChange,
}) => {
  const maxIndex = Math.max(0, totalSteps - 1);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRestart}
            aria-label="Restart visualization"
            title="Restart from Step 0"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPrev}
            disabled={currentStep <= 0}
            aria-label="Previous step"
            title="Previous Step"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause visualization' : 'Run visualization'}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{currentStep >= maxIndex && maxIndex > 0 ? 'Replay' : 'Run Visualization'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onNext}
            disabled={currentStep >= maxIndex}
            aria-label="Next step"
            title="Next Step"
            className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Speed slider with explicit numeric label & unit */}
        <div className="flex items-center gap-3">
          <label
            htmlFor="traversal-speed-slider"
            className="text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap"
          >
            Speed:{' '}
            <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {speedMultiplier.toFixed(1)}x
            </span>
          </label>
          <input
            id="traversal-speed-slider"
            type="range"
            min={0.5}
            max={3.5}
            step={0.5}
            value={speedMultiplier}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-28 accent-blue-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Step Scrubber */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums whitespace-nowrap">
          Step {currentStep} / {maxIndex}
        </span>
        <input
          type="range"
          aria-label="Traversal step scrubber"
          min={0}
          max={maxIndex}
          value={Math.min(currentStep, maxIndex)}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer"
        />
      </div>
    </div>
  );
};
