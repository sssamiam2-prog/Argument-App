import React, { useState, useRef, useCallback } from 'react';
import { InputForm } from './components/InputForm';
import { ResponseDisplay } from './components/ResponseDisplay';
import { Header } from './components/Header';
import { LiveCoachService } from './services/geminiService';
import type { FormState, GeminiResponse } from './types';
import type { LiveServerMessage } from '@google/genai';

const App: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const stopSessionRef = useRef<(() => void) | null>(null);
  const liveServiceRef = useRef(new LiveCoachService());
  
  const currentOutputTranscriptionRef = useRef('');

  const handleAiMessage = useCallback((message: LiveServerMessage) => {
    if (message.serverContent?.inputTranscription) {
      const { text } = message.serverContent.inputTranscription;
      setTranscript(prev => `${prev}${text}`);
    }
    
    if (message.serverContent?.outputTranscription) {
        const { text } = message.serverContent.outputTranscription;
        currentOutputTranscriptionRef.current += text;
    }

    if (message.serverContent?.turnComplete) {
      setTranscript(prev => `${prev}\n`);

      const fullResponse = currentOutputTranscriptionRef.current;
      currentOutputTranscriptionRef.current = '';

      const whatToSayMatch = fullResponse.match(/WHAT TO SAY:([\s\S]*?)COACHING NOTES:/);
      const coachingNotesMatch = fullResponse.match(/COACHING NOTES:([\s\S]*)/);

      const shortResponse = whatToSayMatch ? whatToSayMatch[1].trim() : fullResponse;
      const coachingNotes = coachingNotesMatch ? coachingNotesMatch[1].trim() : 'No specific coaching notes provided in this turn.';

      setResponse({ shortResponse, coachingNotes });
    }
    
  }, []);

  const toggleListening = async (formData: FormState) => {
    if (isListening) {
      stopSessionRef.current?.();
      stopSessionRef.current = null;
      setIsListening(false);
    } else {
      setError(null);
      setResponse(null);
      setTranscript('');
      setIsListening(true);
      try {
        const { stop } = await liveServiceRef.current.startSession(formData, handleAiMessage);
        stopSessionRef.current = stop;
      } catch (e) {
        console.error(e);
        setError('Failed to start the listening session. Please check microphone permissions and try again.');
        setIsListening(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        <main className="mt-8 space-y-8">
          <InputForm onToggleListening={toggleListening} isListening={isListening} transcript={transcript} />
          <ResponseDisplay isLoading={isListening && !response && !error} error={error} response={response} />
        </main>
      </div>
    </div>
  );
};

export default App;
