import React, { useState } from 'react';
import { Calculator, Flame, Info, X } from 'lucide-react';
import { useGym } from '../../context/GymContext';

interface WarmupCalculatorModalProps {
  initialWeight?: number;
  exerciseName?: string;
  onClose: () => void;
}

export const WarmupCalculatorModal: React.FC<WarmupCalculatorModalProps> = ({
  initialWeight = 80,
  exerciseName,
  onClose,
}) => {
  const { methodology } = useGym();
  const [workingWeight, setWorkingWeight] = useState<number>(initialWeight || 80);
  const [barWeight, setBarWeight] = useState<number>(20); // 20kg Olympic bar

  const formulaSets: { percent: number; reps: number; label: string }[] =
    methodology.warmUpFormula?.sets || [
      { percent: 40, reps: 8, label: 'Aproximación 1' },
      { percent: 60, reps: 5, label: 'Aproximación 2' },
      { percent: 80, reps: 3, label: 'Aproximación 3' },
      { percent: 90, reps: 1, label: 'Aproximación 4' },
    ];

  // Helper to calculate disc plates per side for standard bar
  const calculatePlates = (totalWeight: number) => {
    if (totalWeight <= barWeight) return 'Solo la barra';
    const weightPerSide = (totalWeight - barWeight) / 2;
    return `+ ${weightPerSide.toFixed(1)} kg por lado`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/70">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Calculadora de Aproximación</h3>
              <p className="text-xs text-zinc-400">
                {exerciseName || 'Protocolo de Calentamiento del Entrenador'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Peso Serie Efectiva (kg)
              </label>
              <input
                type="number"
                min={5}
                step={2.5}
                value={workingWeight}
                onChange={(e) => setWorkingWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Peso de la Barra (kg)
              </label>
              <select
                value={barWeight}
                onChange={(e) => setBarWeight(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value={20}>Barra Olímpica (20 kg)</option>
                <option value={15}>Barra Femenina (15 kg)</option>
                <option value={10}>Barra Z (10 kg)</option>
                <option value={0}>Máquina / Mancuerna (0 kg)</option>
              </select>
            </div>
          </div>

          {/* Ramp-up sets list */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Series de Calentamiento Gradual
            </div>

            {formulaSets.map((s, idx) => {
              const exactWeight = Math.round((workingWeight * (s.percent / 100)) / 2.5) * 2.5;
              const roundedWeight = Math.max(exactWeight, barWeight);

              return (
                <div
                  key={idx}
                  className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800 flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {roundedWeight} kg
                      </span>
                      <span className="text-xs text-zinc-400">× {s.reps} reps</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 font-mono">
                        {s.percent}%
                      </span>
                    </div>
                    {barWeight > 0 && (
                      <p className="text-[11px] text-zinc-500 mt-1 ml-7">
                        {calculatePlates(roundedWeight)}
                      </p>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-400 text-right max-w-[130px] leading-tight hidden sm:block">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coach Advice */}
          <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-amber-300 flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Regla de Oro del Entrenador:</span>
              Las aproximaciones son para preparar articulaciones y activar el sistema nervioso.
              Nunca llegues con fatiga a tu primera serie efectiva.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Entendido, volver a entrenar
          </button>
        </div>
      </div>
    </div>
  );
};
