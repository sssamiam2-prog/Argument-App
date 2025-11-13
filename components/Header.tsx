
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">
        Argument Coach
      </h1>
      <p className="mt-2 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Navigate disagreements with AI-powered advice. Turn conflict into constructive conversation.
      </p>
    </header>
  );
};
