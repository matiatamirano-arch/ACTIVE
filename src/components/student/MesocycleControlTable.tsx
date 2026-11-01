import React, { useMemo, useState } from 'react';
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  ExternalLink,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Sparkles,
  Table,
  TrendingUp,
  Video,
  Youtube,
  Zap,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Routine, RoutineExercise, Student, WorkoutSessionLog } from '../../types/gym';

interface MesocycleControlTableProps {
  student: Student;
  routine: Routine;
}

export const MesocycleControlTable: React.FC<MesocycleControlTableProps> = ({
  student,
  routine,
}) => {
  const { exercises, workoutLogs, setVideoModalExercise } = useGym();
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [selectedStimulusFilter, setSelectedStimulusFilter] = useState<'all' | 'rodilla' | 'cadera'>(
    'all'
  );

  // Filter logs for this student
  const studentLogs = useMemo(() => {
    return workoutLogs.filter((l) => l.studentId === student.id);
  }, [workoutLogs, student.id]);

  // Helper to find actual weight & reps logged for an exercise in a given program week
  const getActualLogForWeek = (exerciseId: string, week: 1 | 2 | 3 | 4) => {
    const weekLog = studentLogs.find((l) => l.programWeek === week);
    if (!weekLog) return null;

    const loggedEx = weekLog.completedExercises.find((e) => e.exerciseId === exerciseId);
    if (!loggedEx || loggedEx.sets.length === 0) return null;

    // Find the heaviest completed set
    let maxWeight = 0;
    let actualReps = 0;
    loggedEx.sets.forEach((s) => {
      if (s.completed && s.actualWeight >= maxWeight) {
        maxWeight = s.actualWeight;
        actualReps = s.actualReps;
      }
    });

    return maxWeight > 0 ? { weight: maxWeight, reps: actualReps } : null;
  };

  // Collect all unique exercises across all days in this routine
  const uniqueRoutineExercises = useMemo(() => {
    const list: {
      re: RoutineExercise;
      dayName: string;
      stimulusType: string;
      dayNumber: number;
    }[] = [];
    const seenIds = new Set<string>();

    routine.days.forEach((day) => {
      day.exercises.forEach((re) => {
        if (!seenIds.has(re.exerciseId)) {
          seenIds.add(re.exerciseId);
          list.push({
            re,
            dayName: day.dayName,
            stimulusType: day.stimulusType || 'rodilla_traccion',
            dayNumber: day.dayNumber,
          });
        }
      });
    });

    return list;
  }, [routine]);

  // Filter by stimulus
  const filteredExercises = uniqueRoutineExercises.filter((item) => {
    if (selectedStimulusFilter === 'rodilla') return item.stimulusType === 'rodilla_traccion';
    if (selectedStimulusFilter === 'cadera') return item.stimulusType === 'cadera_empuje';
    return true;
  });

  // Calculate projected weights according to the coach's 4-week method
  // Adapts in REAL TIME when the student logs actual weights in Week 1 / Week 2!
  const calculateWeekTargets = (
    baseWeight: number,
    phase?: string,
    realW1Weight?: number | null,
    realW2Weight?: number | null
  ) => {
    // If the student logged a real weight in Week 1, use that as the real baseline!
    const effectiveBase = realW1Weight && realW1Weight > 0 ? realW1Weight : baseWeight;
    const isAdapted = Boolean(realW1Weight && realW1Weight > 0);

    if (phase === 'fuerza') {
      const w2Target = effectiveBase > 0 ? effectiveBase + 5 : 0;
      const w4Target =
        realW2Weight && realW2Weight > 0
          ? realW2Weight + 5
          : effectiveBase > 0
          ? effectiveBase + 10
          : 0;

      return {
        w1: {
          weight: effectiveBase,
          reps: '6 reps',
          label: isAdapted ? 'Base Real Sem 1' : 'Base',
          isAdapted: false,
        },
        w2: {
          weight: w2Target,
          reps: '4 reps',
          label: isAdapted ? `⚡ +5kg (${effectiveBase}+5)` : '+5 kg',
          isAdapted,
        },
        w3: {
          weight: effectiveBase,
          reps: '6 reps',
          label: isAdapted ? `Descarga (${effectiveBase}kg)` : 'Descarga',
          isAdapted,
        },
        w4: {
          weight: w4Target,
          reps: '3 reps',
          label: isAdapted ? `⚡ Pico (${w4Target}kg)` : '+10 kg',
          isAdapted,
        },
      };
    }
    // Hipertrofia circuit
    return {
      w1: { weight: baseWeight, reps: '10 reps', label: 'Base', isAdapted: false },
      w2: { weight: baseWeight, reps: '12 reps', label: 'Sobrecarga', isAdapted: false },
      w3: { weight: baseWeight, reps: '8 reps', label: 'Descarga', isAdapted: false },
      w4: { weight: baseWeight, reps: '15 reps', label: 'Máximo', isAdapted: false },
    };
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl p-4 sm:p-6 shadow-xs space-y-6 text-zinc-900">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Table className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight">
                Tabla de Control del Mesociclo (kg × reps)
              </h3>
              <p className="text-xs text-zinc-500">
                Monitoreo semana a semana de sobrecarga progresiva y cumplimiento de tu planificación
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle: Tabla de Control vs Calendario Semanal */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-2xl border border-zinc-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Tabla de Cargas</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'calendar'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Calendario del Mes</span>
          </button>
        </div>
      </div>

      {/* Mesocycle Method Summary Banner */}
      <div className="bg-orange-50/70 p-4 rounded-2xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="font-bold text-zinc-950 uppercase tracking-wider">
              Regla de Oro de Active Functional:
            </span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px] border border-orange-200">
              Aprendizaje Motor
            </span>
          </div>
          <p className="text-zinc-700 text-[11px] max-w-xl">
            Los ejercicios se mantienen fijos durante las 4 semanas del mes. La progresión se logra aumentando el peso (+5kg en Sem 2, descarga en Sem 3, +10kg en Sem 4) o las repeticiones en el circuito.
          </p>
        </div>

        {/* Current Student Week Pill */}
        <div className="bg-white border border-zinc-200 p-2.5 rounded-xl flex items-center gap-3 self-start sm:self-auto flex-shrink-0 shadow-2xs">
          <div className="text-right">
            <span className="text-[10px] text-zinc-500 uppercase font-bold block">
              Semana Actual del Alumno
            </span>
            <span className="text-sm font-black text-orange-600 font-mono">
              Semana {student.currentProgramWeek || 2} de 4
            </span>
          </div>
          <span className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
        </div>
      </div>

      {viewMode === 'table' ? (
        /* ======================================================== */
        /* TABLA DE CONTROL DE CARGAS POR EJERCICIO */
        /* ======================================================== */
        <div className="space-y-4">
          {/* Stimulus filter buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedStimulusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedStimulusFilter === 'all'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              Todos los Ejercicios ({uniqueRoutineExercises.length})
            </button>
            <button
              onClick={() => setSelectedStimulusFilter('rodilla')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedStimulusFilter === 'rodilla'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              Estímulo 1: Rodilla & Tracciones
            </button>
            <button
              onClick={() => setSelectedStimulusFilter('cadera')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedStimulusFilter === 'cadera'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
              }`}
            >
              Estímulo 2: Cadera & Empujes
            </button>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 min-w-[200px]">Ejercicio & Fase</th>
                  <th className="py-3.5 px-3 min-w-[130px] text-center border-l border-zinc-200">
                    <div>Semana 1</div>
                    <span className="text-[10px] text-zinc-500 font-normal lowercase">
                      Base (6 reps)
                    </span>
                  </th>
                  <th className="py-3.5 px-3 min-w-[130px] text-center border-l border-zinc-200 bg-orange-50/70 text-orange-800">
                    <div>Semana 2</div>
                    <span className="text-[10px] text-orange-600 font-normal lowercase">
                      +5kg (4 reps)
                    </span>
                  </th>
                  <th className="py-3.5 px-3 min-w-[130px] text-center border-l border-zinc-200">
                    <div>Semana 3</div>
                    <span className="text-[10px] text-zinc-500 font-normal lowercase">
                      Descarga (6 reps)
                    </span>
                  </th>
                  <th className="py-3.5 px-3 min-w-[130px] text-center border-l border-zinc-200 bg-emerald-50/70 text-emerald-800">
                    <div>Semana 4</div>
                    <span className="text-[10px] text-emerald-600 font-normal lowercase">
                      Pico +10kg (3 reps)
                    </span>
                  </th>
                  <th className="py-3.5 px-3 w-28 text-center border-l border-zinc-200">
                    Progreso
                  </th>
                  <th className="py-3.5 px-3 w-16 text-center border-l border-zinc-200">Video</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 font-sans">
                {filteredExercises.map((item) => {
                  const exData = exercises.find((e) => e.id === item.re.exerciseId);
                  const baseWeight = item.re.sets[0]?.targetWeight || 0;

                  // Actual logged weights from student sessions
                  const logW1 = getActualLogForWeek(item.re.exerciseId, 1);
                  const logW2 = getActualLogForWeek(item.re.exerciseId, 2);
                  const logW3 = getActualLogForWeek(item.re.exerciseId, 3);
                  const logW4 = getActualLogForWeek(item.re.exerciseId, 4);

                  // Dynamically adapt week targets from student's real Week 1 & Week 2 loads!
                  const targets = calculateWeekTargets(
                    baseWeight,
                    item.re.phase,
                    logW1?.weight,
                    logW2?.weight
                  );

                  const deltaKg =
                    item.re.phase === 'fuerza' && (logW1?.weight || baseWeight) > 0 ? '+10 kg' : 'Volumen';

                  return (
                    <tr
                      key={item.re.id}
                      className="hover:bg-zinc-50 transition-colors"
                    >
                      {/* Exercise Name & Badges */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-zinc-950 text-xs sm:text-sm">
                          {exData ? exData.name : 'Ejercicio'}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px]">
                          {item.re.phase === 'fuerza' ? (
                            <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-bold border border-orange-200">
                              Fuerza (Pausa 2m)
                            </span>
                          ) : item.re.phase === 'activacion' ? (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                              Activación
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold border border-purple-200">
                              Hipertrofia
                            </span>
                          )}
                          <span className="text-zinc-500">• {exData?.equipment}</span>
                        </div>
                      </td>

                      {/* Week 1 Cell */}
                      <td className="py-3 px-3 text-center border-l border-zinc-200">
                        <div className="font-mono font-bold text-zinc-900 text-xs sm:text-sm">
                          {logW1 ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {logW1.weight} kg × {logW1.reps}
                            </span>
                          ) : baseWeight > 0 ? (
                            `${targets.w1.weight} kg × ${targets.w1.reps.split(' ')[0]}`
                          ) : (
                            targets.w1.reps
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {logW1 ? 'Completado' : 'Plan: ' + targets.w1.reps}
                        </div>
                      </td>

                      {/* Week 2 Cell */}
                      <td className="py-3 px-3 text-center border-l border-zinc-200 bg-orange-50/50">
                        <div className="font-mono font-bold text-orange-700 text-xs sm:text-sm">
                          {logW2 ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {logW2.weight} kg × {logW2.reps}
                            </span>
                          ) : baseWeight > 0 ? (
                            `${targets.w2.weight} kg × ${targets.w2.reps.split(' ')[0]}`
                          ) : (
                            targets.w2.reps
                          )}
                        </div>
                        <div className="text-[10px] text-orange-600 mt-0.5 font-mono">
                          {logW2 ? 'Completado' : targets.w2.label}
                        </div>
                      </td>

                      {/* Week 3 Cell */}
                      <td className="py-3 px-3 text-center border-l border-zinc-200">
                        <div className="font-mono font-bold text-zinc-900 text-xs sm:text-sm">
                          {logW3 ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {logW3.weight} kg × {logW3.reps}
                            </span>
                          ) : baseWeight > 0 ? (
                            `${targets.w3.weight} kg × ${targets.w3.reps.split(' ')[0]}`
                          ) : (
                            targets.w3.reps
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">
                          {logW3 ? 'Completado' : 'Descarga'}
                        </div>
                      </td>

                      {/* Week 4 Cell */}
                      <td className="py-3 px-3 text-center border-l border-zinc-200 bg-emerald-50/50">
                        <div className="font-mono font-bold text-emerald-700 text-xs sm:text-sm">
                          {logW4 ? (
                            <span className="text-emerald-600 font-bold flex items-center justify-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              {logW4.weight} kg × {logW4.reps}
                            </span>
                          ) : baseWeight > 0 ? (
                            `${targets.w4.weight} kg × ${targets.w4.reps.split(' ')[0]}`
                          ) : (
                            targets.w4.reps
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-600 mt-0.5 font-mono font-semibold">
                          {logW4 ? 'Récord Logrado' : 'Pico +10kg'}
                        </div>
                      </td>

                      {/* Progression Delta */}
                      <td className="py-3 px-3 text-center border-l border-zinc-200">
                        <span className="px-2 py-1 rounded-lg bg-zinc-100 text-orange-600 font-mono font-bold text-xs inline-block border border-zinc-200">
                          {deltaKg}
                        </span>
                      </td>

                      {/* YouTube Shorts Button */}
                      <td className="py-3 px-3 text-center border-l border-zinc-200">
                        {exData && (
                          <button
                            onClick={() => setVideoModalExercise(exData)}
                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                            title="Ver Shorts de Técnica en Video"
                          >
                            <Youtube className="w-4 h-4 fill-current" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VISTA DE CALENDARIO DEL MES (4 SEMANAS) */
        /* ======================================================== */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((weekNum) => {
              const weekLogs = studentLogs.filter((l) => l.programWeek === weekNum);
              const isCurrentWeek = (student.currentProgramWeek || 2) === weekNum;
              const weekVolume = weekLogs.reduce((acc, l) => acc + (l.totalVolumeKg || 0), 0);

              const weekTitle =
                weekNum === 1
                  ? 'Semana 1: Carga Base (6 reps)'
                  : weekNum === 2
                  ? 'Semana 2: Carga +5kg (4 reps)'
                  : weekNum === 3
                  ? 'Semana 3: Descarga Activa (6 reps)'
                  : 'Semana 4: Pico de Fuerza +10kg (3 reps)';

              return (
                <div
                  key={weekNum}
                  className={`p-5 rounded-2xl border transition-all ${
                    isCurrentWeek
                      ? 'bg-orange-50/40 border-orange-300 shadow-sm'
                      : 'bg-white border-zinc-200 shadow-2xs'
                  }`}
                >
                  {/* Week Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                          isCurrentWeek
                            ? 'bg-orange-500 text-white'
                            : 'bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        S{weekNum}
                      </span>
                      <div>
                        <h4 className="font-bold text-zinc-950 text-sm">{weekTitle}</h4>
                        <span className="text-[10px] text-zinc-500">
                          {isCurrentWeek ? 'Semana en curso' : `Mesociclo - Semana ${weekNum}`}
                        </span>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-[10px] text-zinc-500 block">Volumen</span>
                      <span className="text-xs font-bold text-orange-600">
                        {weekVolume > 0 ? `${weekVolume.toLocaleString()} kg` : 'Por registrar'}
                      </span>
                    </div>
                  </div>

                  {/* Scheduled Days in this week */}
                  <div className="space-y-2">
                    {routine.days.map((day) => {
                      const completedLog = weekLogs.find((l) => l.dayId === day.id);

                      return (
                        <div
                          key={day.id}
                          className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                completedLog ? 'bg-emerald-500' : 'bg-zinc-300'
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-zinc-900">{day.dayName}</div>
                              <div className="text-[10px] text-zinc-500">
                                {day.exercises.length} ejercicios con pesos libres
                              </div>
                            </div>
                          </div>

                          <div>
                            {completedLog ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px] font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {completedLog.totalVolumeKg?.toLocaleString()} kg
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[11px]">Programado</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
