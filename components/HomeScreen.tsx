
import React from 'react';

export const HomeScreen: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in text-slate-700 dark:text-slate-300">
      <div className="space-y-8">
        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4">How This App Helps You Master Conversations</h2>
          <p className="mb-4">
            This app is built around the <strong>Speaker-Listener Technique</strong>, a powerful method for turning arguments into productive dialogues. It provides two distinct modes to help you build your communication skills:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-brand-primary dark:text-indigo-400">Live Coach Mode</h3>
                <p className="text-sm mt-1">Get real-time, AI-powered suggestions during a live conversation. The coach helps you paraphrase what the other person says, de-escalating tension and ensuring you understand their point before you respond.</p>
            </div>
             <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-brand-secondary dark:text-emerald-400">Practice Mode</h3>
                <p className="text-sm mt-1">Hone your skills in a safe, simulated environment. Practice paraphrasing as the 'Listener' or crafting effective 'I' statements as the 'Speaker' and receive instant feedback on your performance.</p>
            </div>
          </div>
           <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Ready to start? <strong>Use the menu in the top-right corner</strong> to select a mode.
          </p>
        </div>

        <div className="p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 prose prose-slate dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">What is the Speaker-Listener Technique?</h2>
          <p>The Speaker-Listener Technique is a structured way to communicate that helps couples and colleagues talk about difficult topics safely. It ensures one person speaks at a time while the other gives their full attention.</p>
          
          <h4 className="font-semibold mt-4">The Core Rules</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>One person is the "Speaker", the other is the "Listener". The roles switch back and forth.</li>
            <li>It's about understanding, not agreeing. The goal is for both people to feel heard and respected.</li>
          </ol>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 not-prose">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-brand-primary">The Speaker's Job</h5>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li><strong>Speak for yourself.</strong> Use "I" statements (e.g., "I feel...", "I think...").</li>
                    <li><strong>Keep it brief.</strong> Don't talk for more than a few sentences at a time.</li>
                    <li><strong>Stop to let the Listener paraphrase.</strong> This ensures they are understanding you.</li>
                </ul>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <h5 className="font-bold text-brand-secondary">The Listener's Job</h5>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                    <li><strong>Listen attentively.</strong> Focus on their words, not your response.</li>
                    <li><strong>Paraphrase what you heard.</strong> In your own words, repeat back their message to show you understand.</li>
                    <li><strong>Don't rebut or argue.</strong> Your only job is to reflect. You'll get your turn to speak.</li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
