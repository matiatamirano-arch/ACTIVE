import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Plus,
  RotateCcw,
  Save,
  Sliders,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { PlanningMethodology } from '../../types/gym';
import { ActiveLogo } from '../brand/ActiveLogo';

export const MethodologyView: React.FC = () => {
  const { methodology, updateMethodology } = useGym();
  const [formData, setFormData] = useState<PlanningMethodology>(methodology);
  const [newRule, setNewRule] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedMethodTab, setSelectedMethodTab] = useState<'fuerza' | 'descenso'>('fuerza');

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMethodology(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule.trim()],
    }));
    setNewRule('');
  };

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, idx) => idx !== index),
    }));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-900">
      {/* Brand Header Banner */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ActiveLogo variant="full" />
              <ActiveLogo variant="stamp" />
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 italic max-w-2xl font-serif">
              "Simplemente entrenamos personas. Las acompañamos a mejorar su calidad de vida a través de la actividad física y el movimiento. No utilizamos máquinas, no construimos cuerpos que se les parezcan. Entrenar es una excusa para divertirnos!"
            </p>
          </div>

          <button
            onClick={() => handleSave()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-xs transition-all hover:scale-[1.02] flex-shrink-0 cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" /> ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Metodología
              </>
            )}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-2xl text-xs sm:text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-orange-600" />
          <span>
            ¡Metodología Active Functional guardada! Las rutinas y alumnos aplicarán automáticamente estas reglas.
          </span>
        </div>
      )}

      {/* Methodology Selector Tabs */}
      <div className="flex items-center gap-2 bg-zinc-100 p-1.5 rounded-2xl border border-zinc-200">
        <button
          onClick={() => setSelectedMethodTab('fuerza')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition-all cursor-pointer ${
            selectedMethodTab === 'fuerza'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          <span>Método 1: Fuerza & Hipertrofia Funcional (4 Semanas)</span>
        </button>

        <button
          onClick={() => setSelectedMethodTab('descenso')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-tight transition-all cursor-pointer ${
            selectedMethodTab === 'descenso'
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-zinc-600 hover:text-zinc-950'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Método 2: Descenso de Peso (Intermitente 10" x 20")</span>
        </button>
      </div>

      {selectedMethodTab === 'fuerza' ? (
        /* ======================================================== */
        /* MÉTODO 1: FUERZA & HIPERTROFIA (4 SEMANAS) */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Phase 1: Activación */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center border border-orange-200">
                1
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                Fase 1: Activación Funcional (Obligatoria)
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              Se realiza al inicio de cada sesión para preparar articulaciones y sistema nervioso:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium text-zinc-800">
                <span className="text-orange-600 font-bold block mb-1">1. Foam Roller</span>
                Liberación miofascial lenta en zonas de tensión
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium text-zinc-800">
                <span className="text-orange-600 font-bold block mb-1">2. Tobillo</span>
                Dorsiflexión dinámica en pared (10 osc/lado)
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium text-zinc-800">
                <span className="text-orange-600 font-bold block mb-1">3. Cadera</span>
                Apertura y movilidad articular 90/90
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium text-zinc-800">
                <span className="text-orange-600 font-bold block mb-1">4. Tórax</span>
                Rotaciones torácicas open book / cuadrupedia
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 font-medium text-zinc-800">
                <span className="text-orange-600 font-bold block mb-1">5. Activador SNC</span>
                Pogo jumps reactivos o saltos elásticos
              </div>
            </div>
          </div>

          {/* Phase 2: Fuerza (Progresión de 4 semanas) */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                    Fase 2: Bloque de Fuerza (2 Estímulos Semanales • 3 Series • Pausas 2 min)
                  </h3>
                  <span className="text-xs text-zinc-500">
                    Los ejercicios se mantienen todo el mes por aprendizaje motor. Pausas obligatorias de 120s.
                  </span>
                </div>
              </div>
            </div>

            {/* Stimulus Structure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
                  Estímulo 1: Rodilla Dominante & Tracciones
                </span>
                <ul className="text-xs text-zinc-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <strong>Pareja 1:</strong> Sentadilla libre con barra + Remo cerrado con barra
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <strong>Pareja 2:</strong> Estocadas con mancuernas + Remo al mentón / Dominadas
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
                  Estímulo 2: Cadera Dominante & Empujes
                </span>
                <ul className="text-xs text-zinc-700 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <strong>Pareja 1:</strong> Peso Muerto con barra + Press de Banca plano con barra
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <strong>Pareja 2:</strong> Hip Thrust con barra + Press Militar de pie con barra
                  </li>
                </ul>
              </div>
            </div>

            {/* 4-Week Auto Progression Schedule */}
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 block mb-2">
                Esquema de Progresión Mesociclo (4 Semanas):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <div className="font-bold text-zinc-950">Semana 1: Carga Base</div>
                  <div className="text-orange-600 font-mono font-bold">6 Repeticiones</div>
                  <div className="text-[11px] text-zinc-500">RIR 1-2 • Peso base programado</div>
                </div>

                <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200 space-y-1">
                  <div className="font-bold text-zinc-950">Semana 2: Sobrecarga</div>
                  <div className="text-orange-600 font-mono font-bold">4 Reps (+5 kg)</div>
                  <div className="text-[11px] text-zinc-600">+5kg al peso de sem 1 • RIR 1-2</div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                  <div className="font-bold text-zinc-950">Semana 3: Descarga</div>
                  <div className="text-orange-600 font-mono font-bold">6 Repeticiones</div>
                  <div className="text-[11px] text-zinc-500">Volver a peso base de sem 1 • RIR 1-2</div>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                  <div className="font-bold text-zinc-950">Semana 4: Pico de Fuerza</div>
                  <div className="text-emerald-700 font-mono font-bold">3 Reps (+10 kg)</div>
                  <div className="text-[11px] text-zinc-600">+5kg a sem 2 (+10kg base) • RIR 1-2</div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 3: Circuito de Hipertrofia Funcional */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                  Fase 3: Circuito de Hipertrofia Funcional (6 Ejercicios • 3 Vueltas)
                </h3>
                <span className="text-xs text-zinc-500">
                  2 ejercicios del patrón del día + 2 tracciones/empujes + 2 rotaciones de zona media. Pausas de máx 1 min.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Semana 1</span>
                <span className="text-base font-bold text-zinc-950 font-mono">10 Reps</span>
              </div>
              <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Semana 2</span>
                <span className="text-base font-bold text-orange-600 font-mono">12 Reps</span>
              </div>
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Semana 3 (Descarga)</span>
                <span className="text-base font-bold text-zinc-700 font-mono">8 Reps</span>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-bold">Semana 4 (Máximo)</span>
                <span className="text-base font-bold text-emerald-700 font-mono">15 Reps</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* MÉTODO 2: DESCENSO DE PESO (METABÓLICO & INTERMITENTE) */
        /* ======================================================== */
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-orange-500 text-white font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                Fase 1 & 2: Activación + Fuerza de 1 Sola Pareja
              </h3>
            </div>
            <p className="text-xs text-zinc-600">
              La activación es idéntica al método anterior. En la fase de fuerza se realiza únicamente 1 pareja de ejercicios con pesos libres (3 series, 2 min descanso) para preservar masa magra sin fatiga excesiva antes del bloque metabólico.
            </p>
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-violet-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                  Fase 3: Intermitente Neuromuscular 10" x 20"
                </h3>
                <span className="text-xs text-zinc-500">
                  4 a 6 ejercicios funcionales consecutivos (10 segundos de trabajo máximo x 20 segundos de descanso).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-950">Semana 1</div>
                <div className="text-orange-600 font-mono font-bold text-sm">2 Bloques de 7 min</div>
                <div className="text-[11px] text-zinc-500">10" trabajo x 20" descanso</div>
              </div>

              <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200 space-y-1">
                <div className="font-bold text-zinc-950">Semana 2 (Carga)</div>
                <div className="text-orange-600 font-mono font-bold text-sm">2 Bloques de 10 min</div>
                <div className="text-[11px] text-zinc-600">Aumento de densidad metabólica</div>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1">
                <div className="font-bold text-zinc-950">Semana 3 (Descarga)</div>
                <div className="text-orange-600 font-mono font-bold text-sm">2 Bloques de 7 min</div>
                <div className="text-[11px] text-zinc-500">Recuperación activa</div>
              </div>

              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-1">
                <div className="font-bold text-zinc-950">Semana 4 (Reto Final)</div>
                <div className="text-emerald-700 font-mono font-bold text-sm">1 Bloque de 15 min</div>
                <div className="text-[11px] text-zinc-600">Continuo sin corte inter-bloque</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reglas de Oro Activas */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-3 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-orange-600 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Reglas Metodológicas Active Functional
        </h3>

        <div className="space-y-2">
          {formData.rules.map((rule, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs sm:text-sm text-zinc-800"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-orange-200">
                  {idx + 1}
                </span>
                <span>{rule}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRule(idx)}
                className="p-1 text-zinc-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Añadir nueva regla metodológica..."
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRule();
              }
            }}
            className="flex-1 bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
          />
          <button
            type="button"
            onClick={handleAddRule}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-orange-600" /> Añadir
          </button>
        </div>
      </div>
    </div>
  );
};
