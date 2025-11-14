
import { GoogleGenAI, Modality, type Blob, type LiveServerMessage } from '@google/genai';
import type { FormState } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

// --- Audio Helper Functions from Gemini Documentation ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// FIX: Replaced malformed createBlob function with the correct implementation.
// The previous version had an incorrect loop and was missing the `int16` variable declaration, which caused all the reported errors.
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Audio Helper Functions ---

const createSystemInstruction = (formData: FormState) => `
You are "Conflict to Clarity Coach", an expert in communication strategies. Your primary role is to guide a user ([ME]) through a difficult conversation with another person ([THEM]) using the "Speaker-Listener Technique".

THE SPEAKER-LISTENER TECHNIQUE: CORE RULES
1. One person is the "Speaker", the other is the "Listener". Roles switch.
2. THE SPEAKER'S JOB: Speak for yourself using "I" statements. Keep your messages brief. Stop to let the Listener paraphrase.
3. THE LISTENER'S JOB: Listen attentively. Paraphrase the Speaker's message to show you understand, without adding your own opinions or arguments.

YOUR TASK
Based on the provided transcript, your goal is to help [ME] successfully use this technique. Your primary suggestion in "WHAT TO SAY:" should be a paraphrase of the last thing [THEM] said. Your "COACHING NOTES:" should explain why this is effective and guide them on their next step, keeping their overall goal and tone in mind.

USER'S CONTEXT
- My Side of the Argument: "${formData.userSide || 'Not specified'}"
- My Goal: "${formData.goal || 'Not specified'}"
- Desired Tone: "${formData.toneMode}"

TRANSCRIPT OF CONVERSATION SO FAR:
${formData.conversationText || 'The conversation has not started yet.'}

**CRITICAL OUTPUT FORMATTING RULES**
- Your entire response MUST start *immediately* with "WHAT TO SAY:". Do not include any introductory phrases like "Okay, here is what you should say..." or any other conversational filler before the first header.
- Your response MUST be structured into exactly two parts, using the following headers:
1.  \`WHAT TO SAY:\`
2.  \`COACHING NOTES:\`
- Under "WHAT TO SAY:", provide the *exact, verbatim phrase* that [ME] should say out loud. This phrase should be enclosed in quotation marks to make it clear that it is a direct script.
- Under "COACHING NOTES:", provide your analysis and advice.

Example:
[THEM]: I'm just so frustrated that this project is late again! It feels like you don't care about the deadlines.

WHAT TO SAY:
"So, if I'm hearing you right, you're feeling frustrated because the project is delayed, and it's making you think I might not be taking the deadlines seriously. Is that correct?"

COACHING NOTES:
This is a paraphrase. You are reflecting back what you heard without judgment. This validates their feelings and ensures you've understood them correctly before you respond with your perspective. It's a crucial first step in de-escalation.
`;

const createListenerPracticePromptSystemInstruction = () => `
You are a scenario generator for a communication skills app that teaches the Speaker-Listener Technique. 
Your task is to create a single, short, challenging, and emotionally charged statement that one person might say to another during a disagreement. 
The statement should be something that is difficult to respond to calmly and would require a thoughtful paraphrase.
- The statement should be from the perspective of "the other person".
- DO NOT use quotation marks.
- DO NOT use prefixes like "[THEM]:" or "They say:".
- Provide ONLY the statement itself.

Example of a good statement:
You always prioritize your work over our relationship and it makes me feel like I don't matter to you.
`;

const createListenerPracticeAnalysisSystemInstruction = (aiPrompt: string, userResponse: string) => `
You are an expert coach in the "Speaker-Listener Technique". Your task is to evaluate a user's response to a given statement, providing constructive feedback.

The core principle of the user's task is to PARAPHRASE the other person's statement. A good paraphrase:
1.  Accurately reflects the content and feeling of the original statement.
2.  Does NOT add the user's own arguments, defensiveness, or opinions.
3.  Shows the user was listening and is trying to understand.

Here is the scenario:
- THE OTHER PERSON SAID: "${aiPrompt}"
- THE USER RESPONDED: "${userResponse}"

Analyze the user's response based on the principles above. Structure your feedback into two parts: "WHAT YOU DID WELL" and "HOW TO IMPROVE".
- Under "WHAT YOU DID WELL", highlight positive aspects of their paraphrase (e.g., "You correctly identified the feeling of frustration...").
- Under "HOW TO IMPROVE", provide specific, actionable advice on making the paraphrase better (e.g., "Try to avoid using the word 'but', as it can sound defensive. Instead, you could say...").
- Keep the feedback concise, encouraging, and focused on the technique.
- If the response is excellent, say so!

Your entire response MUST be formatted with these two headers.
`;

const createSpeakerPracticePromptSystemInstruction = () => `
You are a scenario generator for a communication skills app that teaches the Speaker-Listener Technique. 
Your task is to create a situation where a user needs to express their feelings or perspective using an "I" statement. 
The scenario should be a brief description of a common interpersonal conflict.
- The scenario should be something that would typically provoke a "You" statement (e.g., blaming).
- DO NOT use quotation marks.
- DO NOT use prefixes like "[SCENARIO]:".
- Provide ONLY the scenario description itself.

Example of a good scenario:
Your partner has been spending a lot of time on their phone during your dinner dates.
`;

const createSpeakerPracticeAnalysisSystemInstruction = (scenario: string, userResponse: string) => `
You are an expert coach in the "Speaker-Listener Technique". Your task is to evaluate a user's response from the "Speaker" role, providing constructive feedback.

The core principles for the Speaker are:
1.  Use "I" statements to express feelings and thoughts (e.g., "I feel...", "I am concerned that...").
2.  Avoid "You" statements that blame, accuse, or generalize (e.g., "You always...", "You never...", "You make me feel...").
3.  Keep the message brief and focused on a single point.

Here is the scenario:
- THE SITUATION: "${scenario}"
- THE USER'S "I" STATEMENT: "${userResponse}"

Analyze the user's response based on the principles above. Structure your feedback into two parts: "WHAT YOU DID WELL" and "HOW TO IMPROVE".
- Under "WHAT YOU DID WELL", highlight positive aspects (e.g., "You did a great job starting with 'I feel' which clearly owns your emotion.").
- Under "HOW TO IMPROVE", provide specific, actionable advice (e.g., "The phrase 'you make me feel' can come across as blame. A more direct 'I' statement would be 'I feel sad when...'.").
- If the response is excellent, say so!
- Keep the feedback concise, encouraging, and focused on the technique.

Your entire response MUST be formatted with these two headers.
`;


export class CoachService {
  private ai: GoogleGenAI;
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  async generateReply(formData: FormState): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: createSystemInstruction(formData),
    });
    return response.text;
  }

  async startTranscriptionSession(
    deviceId: string | undefined,
    onMessage: (message: LiveServerMessage) => void
  ) {
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    const audioConstraints: MediaStreamConstraints['audio'] = deviceId
      ? { deviceId: { exact: deviceId } }
      : true;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
    
    let source: MediaStreamAudioSourceNode | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;

    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          source = inputAudioContext.createMediaStreamSource(stream);
          scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: onMessage,
        onerror: (e: ErrorEvent) => {
          console.error('Session Error:', e);
        },
        onclose: (e: CloseEvent) => {
          console.log('Session Closed');
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
      },
    });

    const stop = async () => {
        stream.getTracks().forEach(track => track.stop());
        if (source) source.disconnect();
        if (scriptProcessor) scriptProcessor.disconnect();
        if (inputAudioContext.state !== 'closed') {
            await inputAudioContext.close();
        }
        const session = await sessionPromise;
        session.close();
    };

    return { stop };
  }

  async startSingleTurnTranscription(
    deviceId: string,
    onPartialTranscript: (transcript: string) => void,
  ): Promise<{ stop: () => Promise<string> }> {
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { deviceId: { exact: deviceId } } });
  
    let source: MediaStreamAudioSourceNode | null = null;
    let scriptProcessor: ScriptProcessorNode | null = null;
    let fullTranscript = '';
  
    const sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          source = inputAudioContext.createMediaStreamSource(stream);
          scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmBlob = createBlob(inputData);
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ media: pcmBlob });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: (message: LiveServerMessage) => {
          if (message.serverContent?.inputTranscription) {
            const { text } = message.serverContent.inputTranscription;
            // The API sends chunks. We append them to build the full transcript.
            fullTranscript += text;
            onPartialTranscript(fullTranscript);
          }
        },
        onerror: (e: ErrorEvent) => { console.error('Session Error:', e); },
        onclose: (e: CloseEvent) => { /* console.log('Session Closed'); */ },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        inputAudioTranscription: {},
      },
    });
  
    const stop = async (): Promise<string> => {
      stream.getTracks().forEach(track => track.stop());
      if (source) source.disconnect();
      if (scriptProcessor) scriptProcessor.disconnect();
      if (inputAudioContext.state !== 'closed') {
        await inputAudioContext.close();
      }
      const session = await sessionPromise;
      session.close();
      return fullTranscript;
    };
  
    return { stop };
  }

  async generateListenerPracticePrompt(): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: createListenerPracticePromptSystemInstruction(),
    });
    return response.text.trim();
  }

  async analyzeListenerResponse(aiPrompt: string, userResponse: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: createListenerPracticeAnalysisSystemInstruction(aiPrompt, userResponse),
    });
    return response.text;
  }

  async generateSpeakerPracticePrompt(): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: createSpeakerPracticePromptSystemInstruction(),
    });
    return response.text.trim();
  }

  async analyzeSpeakerResponse(scenario: string, userResponse: string): Promise<string> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: createSpeakerPracticeAnalysisSystemInstruction(scenario, userResponse),
    });
    return response.text;
  }
}
