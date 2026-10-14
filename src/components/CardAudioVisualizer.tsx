import React, { useEffect, useState, useRef } from "react";

interface CardAudioVisualizerProps {
  audioBlob: Blob;
  audioDuration: number;
  activeColor: string;
  inactiveColor: string;
  isPlaying?: boolean;
  currentTime?: number;
  onSeek?: (ratio: number) => void;
}

export const CardAudioVisualizer: React.FC<CardAudioVisualizerProps> = ({
  audioBlob,
  audioDuration,
  activeColor,
  inactiveColor,
  isPlaying = false,
  currentTime = 0,
  onSeek,
}) => {
  const [samples, setSamples] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const extractWaveform = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) {
          generateFallbackSamples();
          return;
        }

        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioCtx = new AudioCtx();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        if (isCancelled) {
          audioCtx.close().catch(() => {});
          return;
        }

        const rawData = audioBuffer.getChannelData(0); // Primary audio channel
        const barCount = 32;
        const blockSize = Math.floor(rawData.length / barCount);
        const extracted: number[] = [];

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          const start = i * blockSize;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j]);
          }
          const avg = sum / blockSize;
          // Scale to 0.15 - 1.0 range
          extracted.push(Math.min(1.0, Math.max(0.12, avg * 4.5)));
        }

        setSamples(extracted);
        audioCtx.close().catch(() => {});
      } catch (err) {
        // Fallback: generate representative speech cadence envelope from blob size/seed
        generateFallbackSamples();
      }
    };

    const generateFallbackSamples = () => {
      const barCount = 32;
      const seed = audioBlob.size % 997;
      const fallback: number[] = [];
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 4 + seed;
        const val = 0.2 + 0.6 * Math.abs(Math.sin(angle) * Math.cos(angle * 1.5));
        fallback.push(Math.min(1.0, Math.max(0.15, val)));
      }
      setSamples(fallback);
    };

    extractWaveform();

    return () => {
      isCancelled = true;
    };
  }, [audioBlob]);

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio);
  };

  const currentRatio = audioDuration > 0 ? currentTime / audioDuration : 0;

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      title="Audio frequency intensity & duration (click to seek)"
      className="w-full h-8 flex items-center gap-[2px] py-1 cursor-pointer group/wave select-none"
    >
      {samples.map((val, idx) => {
        const barProgressRatio = idx / samples.length;
        const isPast = barProgressRatio <= currentRatio;
        const barHeightPercent = Math.max(16, val * 100);

        return (
          <div
            key={idx}
            className="flex-1 flex items-center justify-center h-full transition-all"
          >
            <div
              style={{
                height: `${barHeightPercent}%`,
                backgroundColor: isPast ? activeColor : inactiveColor,
                opacity: isPast ? 1 : 0.45,
              }}
              className="w-full rounded-full transition-all duration-75 group-hover/wave:opacity-90"
            />
          </div>
        );
      })}
    </div>
  );
};
