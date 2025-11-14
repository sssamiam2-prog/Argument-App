
import React, { useState, useRef } from 'react';
import { CoachService } from '../services/geminiService';
import { CoachingCard } from './CoachingCard';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { CheckIcon } from './icons/CheckIcon';
import { MicIcon } from './icons/MicIcon';
import { StopIcon } from './icons/StopIcon';

type PracticeState = 'idle' | 'prompt_loading' | 'prompt_ready' | 'feedback_loading' | 'feedback_ready';
type RecordingState = 'idle' | 'recording' | 'stopping';
type PracticeRole = 'listener' | 'speaker';

interface PracticeModeProps {
    selectedDeviceId: string;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ selectedDeviceId }) => {
    const [practiceRole, setPracticeRole] = useState<PracticeRole>('listener');
    const [practiceState, setPracticeState] = useState<PracticeState>('idle');
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [userResponse, setUserResponse] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const coachServiceRef = useRef(new CoachService());
    const stopRecordingFn = useRef<(() => Promise<string>) | null>(null);

    const handleGetPrompt = async () => {
        setPracticeState('prompt_loading');
        setError(null);
        setAiPrompt('');
        setUserResponse('');
        setFeedback('');
        try {
            const prompt = practiceRole === 'listener'
                ? await coachServiceRef.current.generateListenerPracticePrompt()
                : await coachServiceRef.current.generateSpeakerPracticePrompt();

            setAiPrompt(prompt);
            setPracticeState('prompt_ready');
        } catch (e) {
            console.error(e);
            setError("Failed to get a practice scenario from the coach. Please try again.");
            setPracticeState('idle');
        }
    };

    const handleSubmitResponse = async () => {
        if (!userResponse.trim()) {
            return;
        }
        setPracticeState('feedback_loading');
        setError(null);
        try {
            const result = practiceRole === 'listener'
                ? await coachServiceRef.current.analyzeListenerResponse(aiPrompt, userResponse)
                : await coachServiceRef.current.analyzeSpeakerResponse(aiPrompt, userResponse);

            setFeedback(result);
            setPracticeState('feedback_ready');
        } catch (e) {
            console.error(e);
            setError("Failed to analyze your response. Please try again.");
            setPracticeState('prompt_ready'); 
        }
    };

    const handleStartRecording = async () => {
        if (!selectedDeviceId) {
            alert("Please select a microphone from the 'Live Coach' tab first.");
            return;
        }
        setRecordingState('recording');
        setUserResponse('');
        try {
            const { stop } = await coachServiceRef.current.startSingleTurnTranscription(
                selectedDeviceId,
                (transcript) => {
                    setUserResponse(transcript);
                }
            );
            stopRecordingFn.current = stop;
        } catch (e) {
            console.error("Failed to start recording:", e);
            setError("Could not start recording. Please check microphone permissions.");
            setRecordingState('idle');
        }
    };

    const handleStopRecording = async () => {
        if (stopRecordingFn.current) {
            setRecordingState('stopping');
            try {
                const finalTranscript = await stopRecordingFn.current();
                setUserResponse(finalTranscript);
            } catch (e) {
                console.error("Error stopping recording:", e);
                setError("An error occurred while finalizing the transcript.");
            } finally {
                stopRecordingFn.current = null;
                setRecordingState('idle');
            }
        }
    };
    
    const renderPrompt = () => (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">
                Practice Scenario
            </h3>
            {practiceRole === 'listener' ? (
                 <>
                    <p className="text-base text-slate-600 dark:text-slate-300 italic">"The other person says..."</p>
                    <blockquote className="mt-2 pl-4 border-l-4 border-brand-secondary text-slate-800 dark:text-slate-200 text-lg font-medium">
                        {aiPrompt}
                    </blockquote>
                 </>
            ) : (
                <>
                    <p className="text-base text-slate-600 dark:text-slate-300 italic">"The situation is..."</p>
                    <p className="mt-2 text-slate-800 dark:text-slate-200 text-lg font-medium">
                        {aiPrompt}
                    </p>
                </>
            )}
        </div>
    );
    
    const renderFeedback = () => {
        const wellDoneMatch = feedback.match(/WHAT YOU DID WELL:([\s\S]*?)(?:HOW TO IMPROVE:|$)/i);
        const improveMatch = feedback.match(/HOW TO IMPROVE:([\s\S]*)/i);

        const wellDoneContent = wellDoneMatch ? wellDoneMatch[1].trim() : '';
        const improveContent = improveMatch ? improveMatch[1].trim() : '';
        
        if (!wellDoneContent && !improveContent) {
            return (
                 <div className="space-y-6 mt-6 animate-fade-in">
                    <CoachingCard
                        title="Feedback"
                        content={feedback}
                        icon={<LightbulbIcon className="w-6 h-6" />}
                        color="brand-primary"
                    />
                </div>
            )
        }

        return (
            <div className="space-y-6 mt-6 animate-fade-in">
                {wellDoneContent && (
                    <CoachingCard
                        title="What You Did Well"
                        content={wellDoneContent}
                        icon={<CheckIcon className="w-6 h-6" />}
                        color="brand-secondary"
                    />
                )}
                {improveContent && (
                    <CoachingCard
                        title="How to Improve"
                        content={improveContent}
                        icon={<LightbulbIcon className="w-6 h-6" />}
                        color="brand-primary"
                    />
                )}
            </div>
        );
    };

    const renderRecordButton = () => {
        if (recordingState === 'recording') {
            return (
                <button
                    onClick={handleStopRecording}
                    className="p-2 rounded-full text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    aria-label="Stop recording"
                >
                    <StopIcon className="w-6 h-6" />
                </button>
            );
        }
        if (recordingState === 'stopping') {
            return (
                <button
                    disabled
                    className="p-2 rounded-full text-slate-500 bg-slate-200 dark:bg-slate-700 cursor-not-allowed"
                    aria-label="Stopping recording"
                >
                    <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent border-dashed rounded-full animate-spin"></div>
                </button>
            );
        }
        return (
            <button
                onClick={handleStartRecording}
                className="p-2 rounded-full text-brand-primary bg-brand-light dark:bg-brand-dark dark:text-white hover:bg-indigo-200 dark:hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-colors"
                aria-label="Start recording"
            >
                <MicIcon className="w-6 h-6" />
            </button>
        );
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 mt-8">
            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-xl flex items-center space-x-2 border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setPracticeRole('listener')} 
                    className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-lg transition-colors duration-200 ${practiceRole === 'listener' ? 'bg-brand-primary text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    Practice as Listener
                </button>
                <button 
                    onClick={() => setPracticeRole('speaker')}
                    className={`flex-1 text-center py-2 px-3 text-sm font-semibold rounded-lg transition-colors duration-200 ${practiceRole === 'speaker' ? 'bg-brand-primary text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                    Practice as Speaker
                </button>
            </div>

            {practiceState === 'idle' && (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Practice Your Skills</h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Hone your ability to paraphrase as the Listener, or practice making clear "I" statements as the Speaker.</p>
                    <button
                        onClick={handleGetPrompt}
                        className="mt-6 inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all duration-200"
                    >
                        Start Scenario
                    </button>
                </div>
            )}

            {(practiceState === 'prompt_loading' || practiceState === 'feedback_loading') && (
                <div className="flex flex-col items-center justify-center text-center h-full min-h-[200px] bg-white dark:bg-slate-800 p-6 pt-12 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent border-dashed rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 font-semibold">
                        {practiceState === 'prompt_loading' ? 'Getting a new scenario...' : 'Analyzing your response...'}
                    </p>
                </div>
            )}
            
            {(practiceState === 'prompt_ready' || practiceState === 'feedback_ready') && renderPrompt()}

            {practiceState === 'prompt_ready' && (
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <label htmlFor="user-response" className="block text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                        Your Response
                    </label>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                       {practiceRole === 'listener' 
                            ? "How would you paraphrase this? Type your response or use the microphone to record."
                            : "How would you respond using an 'I' statement? Type or record your response."
                        }
                    </p>
                    <div className="flex items-start space-x-3">
                        <textarea
                            id="user-response"
                            value={userResponse}
                            onChange={(e) => setUserResponse(e.target.value)}
                            disabled={recordingState !== 'idle'}
                            className="flex-grow p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-primary focus:border-brand-primary transition duration-150 min-h-[100px] disabled:bg-slate-100 dark:disabled:bg-slate-800"
                            placeholder={
                                recordingState === 'recording' ? "Listening..." :
                                recordingState === 'stopping' ? "Finalizing transcript..." :
                                practiceRole === 'listener' ? "e.g., 'It sounds like you're feeling hurt because...'" : "e.g., 'I feel frustrated when...'"
                            }
                        />
                        <div className="flex-shrink-0 pt-1">
                            {renderRecordButton()}
                        </div>
                    </div>
                    <button
                        onClick={handleSubmitResponse}
                        disabled={!userResponse.trim() || recordingState !== 'idle'}
                        className="mt-4 w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-secondary hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        Get Feedback
                    </button>
                </div>
            )}
            
            {practiceState === 'feedback_ready' && (
                <>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                            Your Response
                        </h3>
                        <p className="text-slate-700 dark:text-slate-300 italic">
                            "{userResponse}"
                        </p>
                    </div>
                    {renderFeedback()}
                    <div className="text-center">
                        <button
                            onClick={handleGetPrompt}
                            className="mt-4 inline-flex justify-center items-center py-3 px-6 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-800 transition-all duration-200"
                        >
                            Try Another Scenario
                        </button>
                    </div>
                </>
            )}

            {error && (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-6 rounded-xl shadow-lg border border-red-200 dark:border-red-800">
                    <h3 className="mt-2 text-lg font-semibold">An Error Occurred</h3>
                    <p className="text-center">{error}</p>
                </div>
            )}
        </div>
    );
}
