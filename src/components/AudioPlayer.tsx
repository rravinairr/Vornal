import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { formatTime } from "../hooks/useAudioRecorder";
import { CardAudioVisualizer } from "./CardAudioVisualizer";

interface AudioPlayerProps {
  audioBlob: Blob;
  duration?: number;
  showVisualizer?: boolean;
  waveActive?: string;
  waveInactive?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBlob,
  duration,
  showVisualizer = false,
  waveActive = "#E11D48",
  waveInactive = "#FDA4AF",
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    setAudioUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [audioBlob]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn("Audio play prevented:", err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!audioDuration || audioDuration === 0 || !isFinite(audioDuration))) {
      if (isFinite(audioRef.current.duration)) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleWaveSeek = (ratio: number) => {
    const target = ratio * (audioDuration || 1);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  return (
    <div className="bg-stone-50/90 dark:bg-stone-900/90 border border-stone-200/80 dark:border-stone-800 rounded-2xl p-3 flex flex-col gap-2 transition-all">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Optional Waveform Frequency Visualizer */}
      {showVisualizer && (
        <div className="px-1 pt-1">
          <CardAudioVisualizer
            audioBlob={audioBlob}
            audioDuration={audioDuration}
            activeColor={waveActive}
            inactiveColor={waveInactive}
            isPlaying={isPlaying}
            currentTime={currentTime}
            onSeek={handleWaveSeek}
          />
        </div>
      )}

      {/* Progress slider and times */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 min-w-[34px]">
          {formatTime(Math.floor(currentTime))}
        </span>
        <div className="relative flex-1 flex items-center h-4">
          <input
            type="range"
            min={0}
            max={audioDuration || 1}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-stone-100"
          />
        </div>
        <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-stone-400 min-w-[34px] text-right">
          {formatTime(Math.floor(audioDuration))}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors shadow-xs"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>
          <button
            onClick={restartAudio}
            aria-label="Restart audio from beginning"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={cycleSpeed}
          className="min-h-[36px] px-2.5 flex items-center text-xs font-mono font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 rounded-lg transition-colors"
        >
          {playbackRate}x
        </button>
      </div>
    </div>
  );
};
