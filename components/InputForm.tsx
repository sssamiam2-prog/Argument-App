import React, { useState, useEffect, useRef } from 'react';
import type { FormState } from '../types';
import { ToneMode } from '../types';

interface InputFormProps {
  onToggleListening: (formData: FormState) => void;
  isListening: boolean;
  transcript: string;
}

export const InputForm: React.FC<InputFormProps> = ({ onToggleListening, isListening, transcript }) => {
  const [userSide, setUserSide] = useState('');
  const [goal, setGoal] = useState('');
  const [toneMode, setToneMode] = useState<ToneMode>(ToneMode.Professional);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getAudioDevices = async () => {
      try {
        // Must request permission to get device labels
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
      }
    };
    
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices);
    getAudioDevices();
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices);
    }
  }, []);


  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onToggleListening({
      conversationText: transcript, 
      userSide,
      toneMode,
      goal,
      deviceId: selectedDeviceId,
    });
  };

  const buttonText = isListening ? 'Stop Listening' : 'Start Listening';
  const buttonColor = isListening ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' : 'bg-brand-primary hover:bg-brand-dark focus:ring-brand-primary';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
      
      <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 h-48 overflow-y-auto border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
            {transcript || <span className="text-slate-400">Live transcript will appear here...</span>}
        </p>
        <div ref={transcriptEndRef} />
      </div>

      <fieldset disabled={isListening} className="space-y-6">
        <div>
          <label htmlFor="mic-select" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Microphone Source
          </label>
          <select
            id="mic-select"
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 disabled:opacity-50"
            disabled={isListening || audioDevices.length === 0}
            aria-label="Select microphone source"
          >
            {audioDevices.length > 0 ? (
              audioDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </option>
              ))
            ) : (
              <option>No microphones found</option>
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Tone
          </label>
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setToneMode(ToneMode.Professional)}
              className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-200 disabled:opacity-50 ${
                toneMode === ToneMode.Professional
                  ? 'bg-brand-primary text-white shadow'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Professional
            </button>
            <button
              type="button"
              onClick={() => setToneMode(ToneMode.InYourFace)}
              className={`w-1/2 py-2 px-4 rounded-md text-sm font-semibold transition-colors duration-200 disabled:opacity-50 ${
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
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 disabled:opacity-50"
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
            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 disabled:opacity-50"
            placeholder="e.g., 'Defend my decision without burning bridges.'"
          />
        </div>
      </fieldset>
      
      <button
        type="submit"
        className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${buttonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all duration-200`}
      >
        {isListening ? (
          <>
            <span className="relative flex h-3 w-3 mr-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            {buttonText}
          </>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
};