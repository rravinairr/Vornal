import React, { useEffect, useRef } from "react";

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isRecording: boolean;
  isPaused: boolean;
  height?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  analyserNode,
  isRecording,
  isPaused,
  height = 56,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationId = requestAnimationFrame(render);

      const width = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, width, h);

      if (analyserNode && isRecording && !isPaused) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        // Flat baseline or subtle idle wave
        for (let i = 0; i < dataArray.length; i++) {
          dataArray[i] = 4;
        }
      }

      const barCount = 36;
      const barSpacing = 3;
      const totalSpacing = (barCount - 1) * barSpacing;
      const barWidth = Math.max(3, (width - totalSpacing) / barCount);

      const step = Math.floor(bufferLength / barCount) || 1;

      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        // Normalize 0 to 1
        const percent = isRecording && !isPaused ? Math.max(0.08, val / 255) : 0.08;
        const barHeight = Math.max(4, percent * (h - 8));

        const x = i * (barWidth + barSpacing);
        const y = (h - barHeight) / 2;

        // Warm ember / terracotta gradient when recording
        if (isRecording && !isPaused) {
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, "#F43F5E");
          grad.addColorStop(1, "#E11D48");
          ctx.fillStyle = grad;
        } else if (isPaused) {
          ctx.fillStyle = "#F59E0B";
        } else {
          ctx.fillStyle = "#CBD5E1";
        }

        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, isRecording, isPaused]);

  return (
    <div className="w-full flex items-center justify-center py-2">
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full max-w-sm h-14 rounded-lg"
      />
    </div>
  );
};
