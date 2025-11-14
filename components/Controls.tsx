
import React, { useState } from 'react';
import type { FormState } from '../types';
import { ToneMode } from '../types';
import type { SessionState } from '../App';

interface ControlsProps {
  onStartSession: (formFields: Pick<FormState, 'userSide' | 'goal' | 'toneMode'>) => void;
  onEndSession: () => void;
  onGenerateReply: () => void;
  onListenAgain: () => void;
  sessionState: SessionState;
}

export const Controls: React.FC<ControlsProps> = ({ 
    onStartSession, 
    onEndSession, 
    onGenerateReply, 
    onListenAgain,
    sessionState 
}) => {
  const [userSide, setUserSide] = useState('');
  const [goal, setGoal] = useState('');
  const [toneMode, setToneMode] = useState<ToneMode>(ToneMode.Professional);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sessionState === 'idle') {
        onStartSession({
            userSide,
            toneMode,
            goal,
        });
    }
  };

  const isFormDisabled = sessionState !== 'idle';

  const renderButtons = () => {
    switch (sessionState) {
        case 'listening':
            return <>
                <button
                    type="button"
                    onClick={onGenerateReply}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all duration-200"
                >
                    Give Me a Reply
                </button>
                <button type="button" onClick={onEndSession} className="w-full text-center py-2 text-sm text-red-600 dark:text-red-400 hover:underline">
                    End Session
                </button>
            </>;
        case 'generating':
            return <>
                <button
                    type="button"
                    disabled
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary/70 focus:outline-none transition-all duration-200 cursor-not-allowed"
                >
                    <div className="w-5 h-5 border-2 border-white border-t-transparent border-dashed rounded-full animate-spin mr-3"></div>
                    Generating Reply...
                </button>
                 <button type="button" onClick={onEndSession} className="w-full text-center py-2 text-sm text-red-600 dark:text-red-400 hover:underline">
                    End Session
                </button>
            </>;
        case 'reply_ready':
             return <>
                <button
                    type="button"
                    onClick={onListenAgain}
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-secondary hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-brand-secondary transition-all duration-200"
                >
                    Listen to Them Again
                </button>
                 <button type="button" onClick={onEndSession} className="w-full text-center py-2 text-sm text-red-600 dark:text-red-400 hover:underline">
                    End Session
                </button>
            </>;
        case 'idle':
        default:
            return <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all duration-200"
                >
                Start Listening
            </button>;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col h-full">
      <details open={!isFormDisabled} className="group flex-shrink-0 flex-grow">
        <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer list-none flex justify-between items-center">
          <span>{isFormDisabled ? 'Session Settings' : 'Settings'}</span>
          <svg className="w-4 h-4 transition-transform transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <fieldset disabled={isFormDisabled} className="space-y-6 mt-4 animate-fade-in disabled:opacity-60">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tone
            </label>
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setToneMode(ToneMode.Professional)}
                className={`w-1/3 py-2 px-2 rounded-md text-xs sm:text-sm font-semibold transition-colors duration-200 disabled:opacity-50 ${
                  toneMode === ToneMode.Professional
                    ? 'bg-brand-primary text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Professional
              </button>
              <button
                type="button"
                onClick={() => setToneMode(ToneMode.MarriagePartner)}
                className={`w-1/3 py-2 px-2 rounded-md text-xs sm:text-sm font-semibold transition-colors duration-200 disabled:opacity-50 ${
                    toneMode === ToneMode.MarriagePartner
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Partner
              </button>
              <button
                type="button"
                onClick={() => setToneMode(ToneMode.InYourFace)}
                className={`w-1/3 py-2 px-2 rounded-md text-xs sm:text-sm font-semibold transition-colors duration-200 disabled:opacity-50 ${
                  toneMode === ToneMode.InYourFace
                    ? 'bg-amber-500 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                In Your Face
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="user-side" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              My Side <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="user-side"
              type="text"
              value={userSide}
              onChange={(e) => setUserSide(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 disabled:cursor-not-allowed"
              placeholder="e.g., 'I want to delay the project by 2 weeks.'"
            />
          </div>

          <div>
            <label htmlFor="goal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              My Goal <span className="text-slate-400">(Optional)</span>
            </label>
            <input
              id="goal"
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 disabled:cursor-not-allowed"
              placeholder="e.g., 'Defend my decision without burning bridges.'"
            />
          </div>
        </fieldset>
      </details>
      
      <div className="mt-auto pt-4 flex-shrink-0 space-y-2">
        {renderButtons()}
      </div>
    </form>
  );
};
