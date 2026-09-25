import { useEffect, useRef } from "react";

interface AudioWaveformProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  barCount?: number;
}

const AudioWaveform = ({ analyser, isPlaying, barCount = 32 }: AudioWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      if (!isPlaying || !analyser) {
        // Draw idle state
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = canvas.width / barCount;
        const gap = 2;
        
        for (let i = 0; i < barCount; i++) {
          const x = i * barWidth;
          const height = 4 + Math.sin(i * 0.3) * 2;
          const y = (canvas.height - height) / 2;
          
          ctx.fillStyle = "hsl(var(--primary) / 0.3)";
          ctx.beginPath();
          ctx.roundRect(x + gap / 2, y, barWidth - gap, height, 2);
          ctx.fill();
        }
        return;
      }

      animationRef.current = requestAnimationFrame(draw);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = canvas.width / barCount;
      const gap = 2;
      
      for (let i = 0; i < barCount; i++) {
        // Sample from frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] || 0;
        
        // Calculate bar height with minimum
        const minHeight = 4;
        const maxHeight = canvas.height - 8;
        const height = minHeight + (value / 255) * maxHeight;
        
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;
        
        // Create gradient effect
        const intensity = value / 255;
        ctx.fillStyle = `hsl(var(--primary) / ${0.4 + intensity * 0.6})`;
        
        ctx.beginPath();
        ctx.roundRect(x + gap / 2, y, barWidth - gap, height, 2);
        ctx.fill();
      }
    };

    if (isPlaying && analyser) {
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      draw(); // Draw idle state
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyser, barCount]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={40}
      className="w-full h-10 rounded-lg"
    />
  );
};

export default AudioWaveform;
