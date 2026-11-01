import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Award,
  Bell,
  ChevronDown,
  Flame,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';

interface IntermittentTimerProps {
  currentWeek?: 1 | 2 | 3 | 4;
  onClose?: () => void;
}

// Simple Web Audio API beep synthesizer
function playIntervalBeep(frequency = 880, duration = 0.15) {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio not available', e);
  }
}

export const IntermittentTimer: React.FC<IntermittentTimerProps> = ({
  currentWeek = 1,
  onClose,
}) => {
  // Weekly configuration
  // Sem 1: 2 x 7 min | Sem 2: 2 x 10 min | Sem 3: 2 x 7 min | Sem 4: 1 x 15 min
  const blockConfig = {
    1: { blocks: 2, minutes: 7 },
    2: { blocks: 2, minutes: 10 },
    3: { blocks: 2, minutes: 7 },
    4: { blocks: 1, minutes: 15 },
  }[currentWeek];

  const totalBlockSeconds = blockConfig.minutes * 60;

  const [currentBlock, setCurrentBlock] = useState(1);
  const [totalSecondsRemaining, setTotalSecondsRemaining] = useState(totalBlockSeconds);
  const [phase, setPhase] = useState<'work' | 'rest' | 'inter_block_rest'>('work');
  const [intervalSeconds, setIntervalSeconds] = useState(10); // 10s work, 20s rest
  const [cycleCount, setCycleCount] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Sync when week changes
  useEffect(() => {
    setCurrentBlock(1);
    setTotalSecondsRemaining(blockConfig.minutes * 60);
    setPhase('work');
    setIntervalSeconds(10);
    setCycleCount(1);
    setIsRunning(false);
    setIsCompleted(false);
  }, [currentWeek]);

  useEffect(() => {
    if (!isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = window.setInterval(() => {
      // Countdown block total
      setTotalSecondsRemaining((prevTotal) => {
        if (prevTotal <= 1) {
          // Block finished!
          if (currentBlock < blockConfig.blocks) {
            // Move to inter-block rest
            setPhase('inter_block_rest');
            setIntervalSeconds(120); // 2 min descanso entre bloques
            setCurrentBlock((b) => b + 1);
            if (soundEnabled) playIntervalBeep(1040, 0.4);
            return blockConfig.minutes * 60;
          } else {
            // Entire workout complete!
            setIsRunning(false);
            setIsCompleted(true);
            if (soundEnabled) playIntervalBeep(1200, 0.6);
            return 0;
          }
        }
        return prevTotal - 1;
      });

      // Countdown current interval (10s work or 20s rest)
      setIntervalSeconds((prevInterval) => {
        if (prevInterval <= 1) {
          if (phase === 'work') {
            // Switch to Rest (20s)
            setPhase('rest');
            if (soundEnabled) playIntervalBeep(520, 0.25);
            return 20;
          } else if (phase === 'rest') {
            // Switch to Work (10s)
            setPhase('work');
            setCycleCount((c) => c + 1);
            if (soundEnabled) playIntervalBeep(920, 0.25);
            return 10;
          } else {
            // Back from inter-block rest
            setPhase('work');
            return 10;
          }
        }

        // Sound alert on 3, 2, 1
        if (prevInterval <= 4 && prevInterval > 1 && soundEnabled) {
          playIntervalBeep(700, 0.1);
        }

        return prevInterval - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, phase, currentBlock, blockConfig, soundEnabled]);

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentBlock(1);
    setTotalSecondsRemaining(blockConfig.minutes * 60);
    setPhase('work');
    setIntervalSeconds(10);
    setCycleCount(1);
    setIsCompleted(false);
  };

  return (
    <div className="bg-zinc-950 border border-orange-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background glow according to phase */}
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
          phase === 'work' ? 'bg-emerald-500/15' : 'bg-orange-500/15'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
            <Zap className="w-4 h-4 fill-current" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">
              Intermitente Neuromuscular 10" × 20"
            </h4>
            <span className="text-[11px] text-zinc-400">
              Semana {currentWeek}: {blockConfig.blocks} bloque{blockConfig.blocks > 1 ? 's' : ''} de{' '}
              {blockConfig.minutes} minutos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
            title={soundEnabled ? 'Silenciar beeps' : 'Activar beeps'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isCompleted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 mx-auto flex items-center justify-center animate-bounce">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-white">¡Bloques Intermitentes Completados!</h3>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Excelente trabajo metabólico. Cumpliste el protocolo neuromuscular de la Semana {currentWeek}.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
            Reiniciar Cronómetro
          </button>
        </div>
      ) : (
        <div className="py-4 text-center space-y-4">
          {/* Phase Badge */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-md ${
                phase === 'work'
                  ? 'bg-emerald-500 text-black shadow-emerald-500/30 animate-pulse'
                  : phase === 'rest'
                  ? 'bg-orange-500 text-black shadow-orange-500/30'
                  : 'bg-blue-500 text-white'
              }`}
            >
              {phase === 'work'
                ? '⚡ TRABAJO MÁXIMO (10s)'
                : phase === 'rest'
                ? '⏸ DESCANSO (20s)'
                : '☕ DESCANSO ENTRE BLOQUES'}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Bloque {currentBlock}/{blockConfig.blocks} • Intervalo #{cycleCount}
            </span>
          </div>

          {/* Large Countdown for Interval */}
          <div className="relative">
            <div
              className={`text-6xl sm:text-7xl font-mono font-black tracking-tight transition-colors duration-300 ${
                phase === 'work' ? 'text-emerald-400' : 'text-orange-400'
              }`}
            >
              {intervalSeconds}
              <span className="text-2xl text-zinc-500 font-sans ml-1">s</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-1">
              Tiempo restante del bloque: {formatMinSec(totalSecondsRemaining)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-lg ${
                isRunning
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-orange-500 hover:bg-orange-400 text-black'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pausar
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" /> Iniciar Intermitente
                </>
              )}
            </button>
            <button
              onClick={handleReset}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800"
              title="Reiniciar"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
