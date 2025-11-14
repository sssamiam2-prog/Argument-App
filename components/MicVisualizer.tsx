import React, { useRef, useEffect } from 'react';

interface MicVisualizerProps {
  stream: MediaStream | null;
}

export const MicVisualizer: React.FC<MicVisualizerProps> = ({ stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    
    // Use a larger fftSize for a smoother waveform
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount; // will be 1024
    const dataArray = new Uint8Array(bufferLength);
    
    source.connect(analyser);

    let animationFrameId: number;

    const drawWaveform = () => {
      animationFrameId = requestAnimationFrame(drawWaveform);
      
      // Get waveform data instead of frequency data
      analyser.getByteTimeDomainData(dataArray);
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = '#4f46e5'; // brand-primary color

      canvasCtx.beginPath();
      
      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
        // dataArray values are 0-255, with 128 as the center (silence)
        const v = dataArray[i] / 128.0; // normalize to a range around 1.0
        const y = v * canvas.height / 2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      
      canvasCtx.stroke();
    };

    drawWaveform();

    return () => {
      cancelAnimationFrame(animationFrameId);
      source.disconnect();
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream]);

  if (!stream) return null;

  return <canvas ref={canvasRef} width="300" height="50" className="w-full h-12 rounded-md bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600"></canvas>;
};
