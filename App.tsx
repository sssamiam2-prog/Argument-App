
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Controls } from './components/Controls';
import { TranscriptDisplay } from './components/TranscriptDisplay';
import { ResponseDisplay } from './components/ResponseDisplay';
import { Header } from './components/Header';
import { CoachService } from './services/geminiService';
import type { FormState, GeminiResponse } from './types';
import type { LiveServerMessage } from '@google/genai';
import { MicSelection } from './components/MicSelection';
import { ToneMode } from './types';
import { PracticeMode } from './components/PracticeMode';
import { Modal } from './components/Modal';
import { MenuIcon } from './components/icons/MenuIcon';
import { CoachIcon } from './components/icons/CoachIcon';
import { PracticeIcon } from './components/icons/PracticeIcon';
import { SettingsIcon } from './components/icons/SettingsIcon';
import { HomeScreen } from './components/HomeScreen';
import { HomeIcon } from './components/icons/HomeIcon';


export type SessionState = 'idle' | 'listening' | 'generating' | 'reply_ready';
export type AppMode = 'home' | 'coach' | 'practice';

const App: React.FC = () => {
  const [appMode, setAppMode] = useState<AppMode>('home');
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<GeminiResponse | null>(null);
  const [transcript, setTranscript] = useState<string>('');

  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [micStreamForVisualizer, setMicStreamForVisualizer] = useState<MediaStream | null>(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);


  const stopSessionRef = useRef<(() => void) | null>(null);
  const coachServiceRef = useRef(new CoachService());
  const lastSpeakerRef = useRef<'user' | 'other' | null>(null);
  const currentFormState = useRef<Pick<FormState, 'userSide' | 'goal' | 'toneMode'>>({ toneMode: ToneMode.Professional });


  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        // We need to request user media to get the device labels
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = devices.filter(
          (device) => device.kind === 'audioinput'
        );
        setAudioDevices(audioInputDevices);
        if (audioInputDevices.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(audioInputDevices[0].deviceId);
        }
      } catch (err) {
        console.error('Error enumerating audio devices:', err);
        setError('Could not access microphone. Please grant permission and refresh the page.');
      }
    };
    
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    getAudioDevices();
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    }
  }, [selectedDeviceId]);

  // Effect to get mic stream for visualizer in settings modal
  useEffect(() => {
    if (!isSettingsOpen || !selectedDeviceId) {
      if (micStreamForVisualizer) {
        micStreamForVisualizer.getTracks().forEach(track => track.stop());
        setMicStreamForVisualizer(null);
      }
      return;
    }

    let isCancelled = false;
    
    const getMicStream = async () => {
      // If a stream already exists, stop its tracks before getting a new one
      if (micStreamForVisualizer) {
        micStreamForVisualizer.getTracks().forEach(track => track.stop());
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { deviceId: { exact: selectedDeviceId } } 
        });
        if (!isCancelled) {
          setMicStreamForVisualizer(stream);
        } else {
          stream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error("Error getting mic stream for visualizer:", err);
        setMicStreamForVisualizer(null);
      }
    };

    getMicStream();

    return () => {
      isCancelled = true;
      if (micStreamForVisualizer) {
        micStreamForVisualizer.getTracks().forEach(track => track.stop());
      }
    };
  }, [selectedDeviceId, isSettingsOpen]);

  // Effect to close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);


  const handleAiMessage = useCallback((message: LiveServerMessage) => {
    if (message.serverContent?.inputTranscription) {
      const { text } = message.serverContent.inputTranscription;
      setTranscript(prev => {
        if (lastSpeakerRef.current !== 'other') {
          lastSpeakerRef.current = 'other';
          const prefix = '\n[THEM]: ';
          if (prev.trim() === '') return `${prefix.trim()} ${text}`;
          return `${prev}${prefix}${text}`;
        }
        return `${prev}${text}`;
      });
    }
    
    if (message.serverContent?.turnComplete) {
      lastSpeakerRef.current = null;
    }
  }, []);
  
  const startTranscription = async () => {
    lastSpeakerRef.current = null;
    if (micStreamForVisualizer) {
        micStreamForVisualizer.getTracks().forEach(track => track.stop());
        setMicStreamForVisualizer(null);
    }
    setSessionState('listening');
    setError(null);
    setResponse(null);
    try {
      const { stop } = await coachServiceRef.current.startTranscriptionSession(selectedDeviceId, handleAiMessage);
      stopSessionRef.current = stop;
    } catch (e) {
      console.error(e);
      setError('Failed to start the listening session. Please check microphone permissions and try again.');
      setSessionState('idle');
    }
  };

  const handleStartSession = async (formFields: Pick<FormState, 'userSide' | 'goal' | 'toneMode'>) => {
    setTranscript('');
    currentFormState.current = formFields;
    await startTranscription();
  };

  const handleListenAgain = async () => {
      await startTranscription();
  }
  
  const handleGenerateReply = async () => {
    stopSessionRef.current?.();
    stopSessionRef.current = null;
    setSessionState('generating');
    
    try {
      const fullFormData: FormState = {
        ...currentFormState.current,
        conversationText: transcript,
      };
      const resultText = await coachServiceRef.current.generateReply(fullFormData);
      
      const whatToSayMatch = resultText.match(/WHAT TO SAY:([\s\S]*?)(?:COACHING NOTES:|$)/);
      const coachingNotesMatch = resultText.match(/COACHING NOTES:([\s\S]*)/);
      const shortResponse = whatToSayMatch ? whatToSayMatch[1].trim() : resultText;
      const coachingNotes = coachingNotesMatch ? coachingNotesMatch[1].trim() : '';

      setResponse({ shortResponse, coachingNotes });
      setSessionState('reply_ready');
    } catch (e) {
      console.error(e);
      setError('Failed to generate a reply from the AI coach.');
      setSessionState('idle');
    }
  };

  const handleEndSession = () => {
    stopSessionRef.current?.();
    stopSessionRef.current = null;
    setSessionState('idle');
    // Reset form state related to the session if needed
    // e.g., setTranscript(''); setResponse(null);
  };

  const renderMenu = () => {
    const MenuItem = ({ icon, label, onClick, isActive = false }: { icon: React.ReactNode, label: string, onClick: () => void, isActive?: boolean }) => (
      <button
        onClick={onClick}
        className={`w-full flex items-center space-x-3 text-left px-4 py-2.5 text-sm rounded-md transition-colors duration-150 ${
            isActive 
                ? 'bg-brand-primary text-white' 
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );

    return (
        <div ref={menuRef} className="relative">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-900 focus:ring-brand-primary transition-colors"
                aria-label="Open menu"
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
            >
                <MenuIcon className="w-6 h-6" />
            </button>
            {isMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-2 z-10 animate-fade-in-fast">
                    <MenuItem 
                        label="Home"
                        icon={<HomeIcon className="w-5 h-5" />}
                        isActive={appMode === 'home'}
                        onClick={() => { setAppMode('home'); setIsMenuOpen(false); }}
                    />
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <MenuItem 
                        label="Live Coach"
                        icon={<CoachIcon className="w-5 h-5" />}
                        isActive={appMode === 'coach'}
                        onClick={() => { setAppMode('coach'); setIsMenuOpen(false); }}
                    />
                    <MenuItem 
                        label="Practice Mode"
                        icon={<PracticeIcon className="w-5 h-5" />}
                        isActive={appMode === 'practice'}
                        onClick={() => { setAppMode('practice'); setIsMenuOpen(false); }}
                    />
                    <div className="my-1 h-px bg-slate-200 dark:bg-slate-700" />
                    {audioDevices.length > 1 && (
                        <MenuItem 
                            label="Settings"
                            icon={<SettingsIcon className="w-5 h-5" />}
                            onClick={() => { setIsSettingsOpen(true); setIsMenuOpen(false); }}
                        />
                    )}
                </div>
            )}
        </div>
    );
  }

  const renderContent = () => {
    switch(appMode) {
      case 'home':
        return <HomeScreen />;
      case 'coach':
        return (
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="h-full lg:col-span-1">
              <Controls
                sessionState={sessionState}
                onStartSession={handleStartSession}
                onEndSession={handleEndSession}
                onGenerateReply={handleGenerateReply}
                onListenAgain={handleListenAgain}
              />
            </div>
            
            {sessionState !== 'idle' ? (
              <>
                <div className="h-full lg:col-span-1">
                  <TranscriptDisplay transcript={transcript} />
                </div>
                <div className="h-full lg:col-span-1">
                  <ResponseDisplay 
                    isLoading={sessionState === 'generating'}
                    isListening={sessionState === 'listening'}
                    error={error} 
                    response={response} 
                  />
                </div>
              </>
            ) : (
              <div className="h-full lg:col-span-2">
                <ResponseDisplay isLoading={false} isListening={false} error={null} response={null} />
              </div>
            )}
          </main>
        );
      case 'practice':
        return <PracticeMode selectedDeviceId={selectedDeviceId} />;
      default:
        return null;
    }
  }


  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 lg:top-8 lg:right-8 z-20">
            {renderMenu()}
        </div>
        
        <Header />

        <div className="mt-8">
          {renderContent()}
        </div>
      </div>

      <Modal title="Settings" isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)}>
        <MicSelection 
            devices={audioDevices}
            selectedDevice={selectedDeviceId}
            onDeviceChange={setSelectedDeviceId}
            stream={micStreamForVisualizer}
        />
      </Modal>

    </div>
  );
};

export default App;
