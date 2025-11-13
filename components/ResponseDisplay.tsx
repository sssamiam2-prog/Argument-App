import React from 'react';
import type { GeminiResponse } from '../types';
import { CoachingCard } from './CoachingCard';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { QuoteIcon } from './icons/QuoteIcon';

interface ResponseDisplayProps {
  isLoading: boolean;
  error: string | null;
  response: GeminiResponse | null;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ isLoading, error, response }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">Listening for conversation...</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">The coach's advice will appear here.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-800">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="mt-2 text-lg font-semibold">An Error Occurred</h3>
        <p className="text-center">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <LightbulbIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-center">
          Press "Start Listening" to get real-time advice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <CoachingCard
        title="What to Say Next"
        content={response.shortResponse}
        icon={<QuoteIcon className="w-6 h-6" />}
        color="brand-primary"
      />
      <CoachingCard
        title="Coaching Notes"
        content={response.coachingNotes}
        icon={<LightbulbIcon className="w-6 h-6" />}
        color="brand-secondary"
      />
    </div>
  );
};
