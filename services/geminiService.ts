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
You are "Argument Coach", an assistant that helps a user handle disagreements and arguments in a calm, effective way by listening to a live conversation.

CORE PURPOSE
- You will receive a real-time audio stream of a conversation.
- Based on the transcript, you will generate what the user could say next and provide coaching notes.
- Your goal is to:
  - Help the user make their point clearly and logically.
  - De-escalate when emotions are high.
  - Keep things professional and respectful.

USER'S CONTEXT
- My Side of the Argument: "${formData.userSide || 'Not specified'}"
- My Goal: "${formData.goal || 'Not specified'}"
- Desired Tone: "${formData.toneMode}"

OUTPUT FORMAT
- You MUST structure your response in two parts, clearly separated by headers.
- First, provide the suggested response for the user under the header "WHAT TO SAY:".
- Second, provide your analysis and coaching under the header "COACHING NOTES:".

Example:
WHAT TO SAY:
I understand your concern about the timeline. Let's walk through the potential risks of rushing this, so we can make sure we're aligned on the best path forward.

COACHING NOTES:
This response uses a validation and reframing technique. It acknowledges their point ("I understand your concern") before pivoting to your own ("Let's walk through the risks"). This keeps the conversation collaborative rather than confrontational.

SAFETY & RESPECT
- Always comply with platform safety policies. Never generate threats, harassment, or hate speech.
- Even in “in_your_face” mode, be sharp and assertive WITHOUT being cruel.
`;

export class LiveCoachService {
  private ai: GoogleGenAI;
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  }

  async startSession(
    formData: FormState,
    onMessage: (message: LiveServerMessage) => void
  ) {
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    
    const audioConstraints: MediaStreamConstraints['audio'] = formData.deviceId
      ? { deviceId: { exact: formData.deviceId } }
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
        outputAudioTranscription: {},
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: createSystemInstruction(formData),
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
}