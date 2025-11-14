
import React from 'react';
import { LogoIcon } from './icons/LogoIcon';

export const Header: React.FC = () => {
  return (
    <header className="text-center flex flex-col items-center">
      <LogoIcon className="w-24 h-24 mb-2" />
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary py-2">
        Conflict to Clarity Coach
      </h1>
      <p className="mt-2 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Navigate disagreements. Turn conflict into constructive conversation.
      </p>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-500 max-w-2xl mx-auto">
        This tool coaches you using the <strong>Speaker-Listener Technique</strong> to promote clear, respectful dialogue.
      </p>
    </header>
  );
};
