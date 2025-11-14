
import React, { useEffect, useRef } from 'react';

interface TranscriptDisplayProps {
  transcript: string;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({ transcript }) => {
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const renderTranscript = () => {
    if (!transcript) {
      return <span className="text-slate-400">Live transcript will appear here...</span>;
    }

    return transcript.split('\n').map((line, index) => {
      if (line.startsWith('[ME]:')) {
        return <div key={index}><strong className="text-indigo-500 dark:text-indigo-400">[ME]:</strong>{line.substring(5)}</div>;
      }
      if (line.startsWith('[THEM]:')) {
        return <div key={index}><strong className="text-emerald-600 dark:text-emerald-400">[THEM]:</strong>{line.substring(7)}</div>;
      }
      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 h-full flex flex-col">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex-shrink-0">
        Conversation Transcript
      </h3>
      <div className="flex-grow bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-y-auto border border-slate-200 dark:border-slate-700 min-h-[16rem]">
        <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono space-y-2">
          {renderTranscript()}
        </div>
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
};
