
import React from 'react';
import type { GeminiResponse } from '../types';
import { CoachingCard } from './CoachingCard';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { QuoteIcon } from './icons/QuoteIcon';

interface ResponseDisplayProps {
  isLoading: boolean;
  isListening: boolean;
  error: string | null;
  response: GeminiResponse | null;
}

export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ isLoading, isListening, error, response }) => {
  const containerClasses = "flex flex-col items-center justify-start text-center h-full min-h-[200px] bg-white dark:bg-slate-800 p-6 pt-12 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700";

  if (isLoading) {
    return (
      <div className={containerClasses}>
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent border-dashed rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">Coach is thinking...</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">Generating your response.</p>
      </div>
    );
  }

  if (isListening) {
    return (
      <div className={containerClasses}>
        <div className="relative flex h-12 w-12 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
            <svg className="relative w-6 h-6 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m12 7.5v-1.5a6 6 0 00-6-6M6 12v-1.5a6 6 0 016-6v1.5m-6 7.5a6 6 0 006 6v-1.5m6-6a6 6 0 01-6 6v-1.5" />
            </svg>
        </div>
        <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">Listening for conversation...</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-500">The coach's advice will appear here after you request a reply.</p>
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
      <div className={containerClasses}>
        <LightbulbIcon className="w-16 h-16 text-slate-400 dark:text-slate-500" />
        <p className="mt-4 text-slate-500 dark:text-slate-400">
          Press "Start Listening" to begin your session.
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
