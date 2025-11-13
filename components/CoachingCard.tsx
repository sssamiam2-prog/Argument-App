
import React, { useState } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CoachingCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  color: 'brand-primary' | 'brand-secondary';
}

// A simple markdown-to-HTML parser for basic formatting
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  const formattedText = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map((line, index) => {
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return `<li class="ml-5 list-disc" key=${index}>${line.substring(2)}</li>`;
      }
      return `<p key=${index}>${line}</p>`;
    })
    .join('');

  // Group list items
  const finalHtml = formattedText.replace(/<\/li><li/g, '</li><li').replace(/<li/g, '<ul><li').replace(/<\/li>/g, '</li></ul>').replace(/<\/ul><ul>/g, '');

  return <div className="prose prose-sm dark:prose-invert max-w-none space-y-3" dangerouslySetInnerHTML={{ __html: finalHtml }} />;
};


export const CoachingCard: React.FC<CoachingCardProps> = ({ title, content, icon, color }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const borderColor = color === 'brand-primary' ? 'border-brand-primary' : 'border-brand-secondary';
  const textColor = color === 'brand-primary' ? 'text-brand-primary' : 'text-brand-secondary';
  const darkTextColor = color === 'brand-primary' ? 'dark:text-indigo-400' : 'dark:text-emerald-400';

  return (
    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border-t-4 ${borderColor}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <span className={`${textColor} ${darkTextColor}`}>{icon}</span>
          <h3 className={`text-lg font-bold ${textColor} ${darkTextColor}`}>{title}</h3>
        </div>
        <button
          onClick={handleCopy}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 focus:ring-brand-primary transition-colors"
          aria-label="Copy to clipboard"
        >
          {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <ClipboardIcon className="w-5 h-5" />}
        </button>
      </div>
      <div className="mt-4 text-slate-700 dark:text-slate-300">
        <SimpleMarkdown text={content} />
      </div>
    </div>
  );
};
