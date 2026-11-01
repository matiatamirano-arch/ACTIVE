import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Timer,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface RestTimerProps {
  initialSeconds?: number;
  onFinish?: () => void;
  triggerTime?: number; // timestamp to force start or reset timer
}

// Simple Web Audio API beep synthesizer
function playBeep(frequency = 880, duration = 0.2, count = 2) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + i * 0.25);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.25 + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + duration);
    }
  } catch (e) {
    console.warn('Audio not available', e);
  }
}

export const RestTimer: React.FC<RestTimerProps> = ({
  initialSeconds = 90,
  onFinish,
  triggerTime,
}) => {
  const [targetSeconds, setTargetSeconds] = useState(initialSeconds);
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const intervalRef = useRef<number | null>(null);

  // When initialSeconds or triggerTime changes from outside (e.g. student completed a set)
  useEffect(() => {
    if (triggerTime) {
      setTargetSeconds(initialSeconds);
      setSecondsLeft(initialSeconds);
      setIsRunning(true);
      setIsMinimized(false);
    }
  }, [triggerTime, initialSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (soundEnabled) {
              playBeep(920, 0.25, 3);
            }
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 300]);
            }
            if (onFinish) onFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, soundEnabled, onFinish]);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const handlePreset = (seconds: number) => {
    setTargetSeconds(seconds);
    setSecondsLeft(seconds);
    setIsRunning(true);
  };

  const addTime = (delta: number) => {
    setSecondsLeft((prev) => Math.max(0, prev + delta));
  };

  const progressPercent = targetSeconds > 0 ? ((targetSeconds - secondsLeft) / targetSeconds) * 100 : 0;

  // Minimized floating pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 bg-zinc-900 border border-emerald-500/40 rounded-full shadow-2xl px-3.5 py-2 flex items-center gap-2.5 backdrop-blur-md">
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
        </div>
        <div className="text-sm font-mono font-bold text-white tracking-wider">
          {formatTime(secondsLeft)}
        </div>
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-1 rounded-full text-zinc-300 hover:text-white"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="p-1 rounded-full text-zinc-400 hover:text-white"
          title="Expandir"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-3 sm:right-6 z-40 w-[92vw] sm:w-80 bg-zinc-950/95 border border-zinc-700/80 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-zinc-100 transition-all">
      {/* Progress Bar Top */}
      <div className="w-full bg-zinc-800 h-1.5">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
          <Timer className="w-4 h-4" />
          <span>Descanso entre Series</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-red-400" />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Minimizar"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Clock display */}
      <div className="p-4 text-center">
        <div className="text-4xl font-mono font-black tracking-tight text-white mb-2">
          {formatTime(secondsLeft)}
        </div>

        {/* Main controls */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <button
            onClick={() => addTime(-15)}
            className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
          >
            -15s
          </button>
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold shadow-md transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Iniciar
              </>
            )}
          </button>
          <button
            onClick={() => {
              setIsRunning(false);
              setSecondsLeft(targetSeconds);
            }}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl"
            title="Reiniciar"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => addTime(30)}
            className="px-2.5 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg font-medium"
          >
            +30s
          </button>
        </div>

        {/* Quick Presets based on coach guidelines */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-zinc-800/80">
          {[
            { label: '60s', secs: 60 },
            { label: '90s', secs: 90 },
            { label: '2 min', secs: 120 },
            { label: '3 min', secs: 180 },
          ].map((preset) => (
            <button
              key={preset.secs}
              onClick={() => handlePreset(preset.secs)}
              className={`py-1 text-xs font-semibold rounded-lg transition-colors ${
                targetSeconds === preset.secs
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
