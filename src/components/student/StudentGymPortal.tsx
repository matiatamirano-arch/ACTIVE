import React, { useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Dumbbell,
  Flame,
  Layers,
  LineChart,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Star,
  Table as TableIcon,
  Timer,
  TrendingUp,
  User,
  Video,
  Youtube,
  Zap,
} from 'lucide-react';
import { useWorkoutDraft } from '../../lib/useWorkoutDraft';
import { useGym } from '../../context/GymContext';
import { Exercise, RoutineDay, RoutineExercise, SetLog, WorkoutSessionLog } from '../../types/gym';
import { ActiveLogo } from '../brand/ActiveLogo';
import { IntermittentTimer } from './IntermittentTimer';
import { MesocycleControlTable } from './MesocycleControlTable';
import { RestTimer } from './RestTimer';
import { VolumeEvolutionChart } from './VolumeEvolutionChart';
import { WarmupCalculatorModal } from './WarmupCalculatorModal';

export const StudentGymPortal: React.FC = () => {
  const {
    activeStudent,
    activeStudentRoutine,
    exercises,
    methodology,
    workoutLogs,
    setVideoModalExercise,
    saveWorkoutSessionLog,
    openCoachMode,
  } = useGym();

  const [activeTab, setActiveTab] = useState<'workout' | 'mesocycle' | 'charts'>('workout');
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  // Active Stage in workout view: null means the student sees the 3 Etapas Hub overview
  const [selectedStage, setSelectedStage] = useState<
    'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente' | null
  >(null);

  // Student's active week (1, 2, 3, or 4)
  const [selectedWeek, setSelectedWeek] = useState<1 | 2 | 3 | 4>(
    activeStudent?.currentProgramWeek || 1
  );

  // Tracking state for active workout:
  // exerciseId -> sets: [ { actualWeight, actualReps, actualRir, completed } ]
  const draft = useWorkoutDraft(activeStudent?.id, activeStudentRoutine?.id, (activeStudentRoutine?.days[selectedDayIndex] || activeStudentRoutine?.days[0])?.id, selectedWeek);
  const { sessionSets, setSessionSets, coachFeedback, setCoachFeedback, finishRating, setFinishRating } = draft;
  const [finishing, setFinishing] = useState(false);

  // Rest timer triggers
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [timerTrigger, setTimerTrigger] = useState<number | undefined>(undefined);

  // Intermittent timer modal
  const [showIntermittentTimer, setShowIntermittentTimer] = useState(false);

  // Warmup calculator modal
  const [warmupModalData, setWarmupModalData] = useState<{
    weight: number;
    name: string;
  } | null>(null);

  // Finish modal
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [workoutFinishedSuccess, setWorkoutFinishedSuccess] = useState<WorkoutSessionLog | null>(
    null
  );

  if (draft.loading) return <p className="p-8">Cargando tu entrenamiento…</p>;


  if (!activeStudent) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6 text-center">
        <ActiveLogo variant="isologo" size="lg" className="mb-4 animate-bounce" />
        <h2 className="text-xl font-black text-zinc-950">No se encontró el alumno seleccionado</h2>
        <p className="text-zinc-600 text-sm mt-2 max-w-sm">
          Por favor regresa al panel del entrenador o selecciona un perfil válido.
        </p>
        <button
          onClick={openCoachMode}
          className="mt-6 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
        >
          Ir al Panel de Entrenador
        </button>
      </div>
    );
  }

  const routine = activeStudentRoutine;

  if (!routine || !routine.days || routine.days.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900 flex flex-col items-center justify-center p-6 text-center">
        <ActiveLogo variant="isologo" size="lg" className="mb-4" />
        <h2 className="text-xl font-black text-zinc-950">¡Hola, {activeStudent.name}!</h2>
        <p className="text-zinc-600 text-sm mt-2 max-w-sm">
          Tu entrenador ({methodology.coachName}) de Active Functional Studio está preparando tu rutina personalizada.
        </p>
        <button
          onClick={openCoachMode}
          className="mt-6 px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded-xl text-sm font-bold transition-colors"
        >
          Volver a la Gestión del Entrenador
        </button>
      </div>
    );
  }

  const currentDay: RoutineDay = routine.days[selectedDayIndex] || routine.days[0];

  // Helper to obtain the real weight lifted for an exercise in a given program week:
  // Checked first from workoutLogs, or if currently in that week, from sessionSets live state!
  const getRealWeightForExercise = (exerciseId: string, week: 1 | 2 | 3 | 4): number | null => {
    // 1. If currently active session is in that week, check live sessionSets
    if (selectedWeek === week) {
      const routineEx = currentDay.exercises.find((e) => e.exerciseId === exerciseId);
      if (routineEx && sessionSets[routineEx.id]) {
        let maxTyped = 0;
        sessionSets[routineEx.id].forEach((s) => {
          if (s.actualWeight && s.actualWeight > maxTyped) {
            maxTyped = s.actualWeight;
          }
        });
        if (maxTyped > 0) return maxTyped;
      }
    }

    // 2. Check saved workoutLogs for this student & week
    const weekLog = workoutLogs.find(
      (l) => l.studentId === activeStudent.id && l.programWeek === week
    );
    if (weekLog) {
      const loggedEx = weekLog.completedExercises.find((e) => e.exerciseId === exerciseId);
      if (loggedEx && loggedEx.sets.length > 0) {
        let maxLogged = 0;
        loggedEx.sets.forEach((s) => {
          if (s.completed && s.actualWeight && s.actualWeight > maxLogged) {
            maxLogged = s.actualWeight;
          }
        });
        if (maxLogged > 0) return maxLogged;
      }
    }

    return null;
  };

  // Helper to calculate target reps and projected weight according to the coach's 4-week method
  // Adapts in REAL TIME based on actual weights logged in Week 1 / Week 2!
  const getProjectedTarget = (
    re: RoutineExercise,
    setIndex: number
  ): {
    targetWeight: number;
    targetReps: string;
    targetRir: string;
    restSeconds: number;
    isAdaptedFromRealLoad?: boolean;
    realBaseWeightUsed?: number;
  } => {
    const rawSet = re.sets[setIndex] || re.sets[0];
    const initialConfigWeight = rawSet?.targetWeight || 0;

    // Check if the student has real weight recorded in Week 1 or Week 2
    const realW1 = getRealWeightForExercise(re.exerciseId, 1);
    const realW2 = getRealWeightForExercise(re.exerciseId, 2);

    // If student logged weight in Week 1, use that as the real baseline!
    const baselineWeight = realW1 !== null && realW1 > 0 ? realW1 : initialConfigWeight;
    const isAdapted = realW1 !== null && realW1 > 0 && selectedWeek > 1;

    if (re.phase === 'fuerza') {
      // Coach's Method:
      // Sem 1: 6 reps (baseWeight) @ RIR 1-2
      // Sem 2: 4 reps (baseWeight + 5kg) @ RIR 1-2
      // Sem 3: 6 reps (baseWeight descarga) @ RIR 1-2
      // Sem 4: 3 reps (baseWeight + 10kg) @ RIR 1-2
      if (selectedWeek === 1) {
        return {
          targetWeight: baselineWeight,
          targetReps: '6',
          targetRir: 'RIR 1-2',
          restSeconds: 120,
          isAdaptedFromRealLoad: false,
        };
      }
      if (selectedWeek === 2) {
        return {
          targetWeight: baselineWeight > 0 ? baselineWeight + 5 : 0,
          targetReps: '4',
          targetRir: 'RIR 1-2',
          restSeconds: 120,
          isAdaptedFromRealLoad: isAdapted,
          realBaseWeightUsed: baselineWeight,
        };
      }
      if (selectedWeek === 3) {
        return {
          targetWeight: baselineWeight,
          targetReps: '6 (Descarga)',
          targetRir: 'RIR 1-2',
          restSeconds: 120,
          isAdaptedFromRealLoad: isAdapted,
          realBaseWeightUsed: baselineWeight,
        };
      }
      if (selectedWeek === 4) {
        const targetW4 =
          realW2 !== null && realW2 > 0
            ? realW2 + 5
            : baselineWeight > 0
            ? baselineWeight + 10
            : 0;

        return {
          targetWeight: targetW4,
          targetReps: '3 (Récord)',
          targetRir: 'RIR 1-2',
          restSeconds: 120,
          isAdaptedFromRealLoad: isAdapted,
          realBaseWeightUsed: baselineWeight,
        };
      }
    }

    if (re.phase === 'hipertrofia') {
      // Coach's Method for Hypertrophy Circuit:
      // Sem 1: 10 reps | Sem 2: 12 reps | Sem 3: 8 reps | Sem 4: 15 reps
      const repsByWeek: Record<number, string> = { 1: '10', 2: '12', 3: '8', 4: '15' };
      return {
        targetWeight: baselineWeight,
        targetReps: repsByWeek[selectedWeek] || '10',
        targetRir: 'RIR 1',
        restSeconds: 60,
      };
    }

    return {
      targetWeight: baselineWeight,
      targetReps: rawSet?.targetReps || '10',
      targetRir: rawSet?.targetRirRpe || 'RIR 1-2',
      restSeconds: rawSet?.restSeconds || 60,
    };
  };

  // Helper to get or initialize set values
  const getSetState = (exId: string, setIdx: number, projectedWeight: number, defaultReps: string) => {
    const exData = sessionSets[exId];
    if (exData && exData[setIdx]) {
      return exData[setIdx];
    }
    const defaultRepsNum = parseInt(defaultReps, 10) || 6;
    return {
      actualWeight: projectedWeight || 0,
      actualReps: defaultRepsNum,
      actualRir: 1,
      completed: false,
    };
  };

  const updateSetState = (
    exId: string,
    setIdx: number,
    updates: Partial<{
      actualWeight: number;
      actualReps: number;
      actualRir: number;
      completed: boolean;
    }>,
    autoTriggerTimer?: boolean,
    restSeconds?: number
  ) => {
    setSessionSets((prev) => {
      const currentList = prev[exId] ? [...prev[exId]] : [];
      const currentVal = currentList[setIdx] || {
        actualWeight: 0,
        actualReps: 6,
        actualRir: 1,
        completed: false,
      };

      currentList[setIdx] = {
        ...currentVal,
        ...updates,
      };

      return {
        ...prev,
        [exId]: currentList,
      };
    });

    if (autoTriggerTimer && updates.completed) {
      setTimerSeconds(restSeconds || 120);
      setTimerTrigger(Date.now());
    }
  };

  // Group current day exercises into 3 phases: Activación, Fuerza, Hipertrofia/Intermitente
  const activacionExercises = currentDay.exercises.filter((e) => e.phase === 'activacion');
  const fuerzaExercises = currentDay.exercises.filter((e) => e.phase === 'fuerza');
  const hipertrofiaExercises = currentDay.exercises.filter((e) => e.phase === 'hipertrofia');
  const intermitenteExercises = currentDay.exercises.filter((e) => e.phase === 'intermitente');

  // Calculate completed stats
  const totalRoutineSets = currentDay.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  let completedSetsCount = 0;
  let totalVolumeKg = 0;

  currentDay.exercises.forEach((ex) => {
    ex.sets.forEach((set, idx) => {
      const proj = getProjectedTarget(ex, idx);
      const state = getSetState(ex.id, idx, proj.targetWeight, proj.targetReps);
      if (state.completed) {
        completedSetsCount++;
        totalVolumeKg += (state.actualWeight || 0) * (state.actualReps || 0);
      }
    });
  });

  const completionPercentage =
    totalRoutineSets > 0 ? Math.round((completedSetsCount / totalRoutineSets) * 100) : 0;

  const handleFinishWorkout = async () => {
    if (finishing) return;
    setFinishing(true);
    try {
    await draft.flush();
    const completedExercisesList = currentDay.exercises.map((re) => {
      const exData = exercises.find((e) => e.id === re.exerciseId);
      const setsLog: SetLog[] = re.sets.map((s, idx) => {
        const proj = getProjectedTarget(re, idx);
        const state = getSetState(re.id, idx, proj.targetWeight, proj.targetReps);
        return {
          setNumber: idx + 1,
          targetWeight: proj.targetWeight,
          targetReps: proj.targetReps,
          actualWeight: state.actualWeight,
          actualReps: state.actualReps,
          actualRir: state.actualRir,
          completed: state.completed,
        };
      });

      return {
        exerciseId: re.exerciseId,
        exerciseName: exData ? exData.name : 'Ejercicio',
        phase: re.phase,
        sets: setsLog,
        notes: re.coachNotes,
      };
    });

    const savedLog = await saveWorkoutSessionLog({
      studentId: activeStudent.id,
      routineId: routine.id,
      routineName: routine.name,
      dayId: currentDay.id,
      dayName: currentDay.dayName,
      programWeek: selectedWeek,
      date: new Date().toISOString(),
      durationMinutes: currentDay.targetDurationMinutes || 60,
      completedExercises: completedExercisesList,
      totalVolumeKg,
      studentRating: finishRating,
      feedbackToCoach: coachFeedback.trim() || undefined,
    });

    setWorkoutFinishedSuccess(savedLog);
    setShowFinishModal(false);
    } catch { alert('No pudimos confirmar el guardado. Tus datos siguen en pantalla; volvé a intentarlo.'); }
    finally { setFinishing(false); }
  };

  // Helper to render an exercise card
  const renderExerciseCard = (routineEx: RoutineExercise, exIndex: number) => {
    const exData: Exercise | undefined = exercises.find((e) => e.id === routineEx.exerciseId);
    const setsForEx = sessionSets[routineEx.id] || [];
    const completedSetsCount = setsForEx.filter((s) => s.completed).length;
    const totalSetsCount = routineEx.sets.length;
    const isExerciseCompleted = totalSetsCount > 0 && completedSetsCount === totalSetsCount;

    return (
      <div
        key={routineEx.id}
        className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 transition-all ${
          isExerciseCompleted ? 'border-emerald-300 bg-emerald-50/20' : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center flex-shrink-0 ${
              isExerciseCompleted ? 'bg-emerald-600 text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-900'
            }`}>
              {isExerciseCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : exIndex + 1}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-zinc-950 leading-tight">
                  {exData ? exData.name : 'Ejercicio'}
                </h3>
                {routineEx.pairGroup && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                    {routineEx.pairGroup.split('(')[0]?.trim()}
                  </span>
                )}
                {isExerciseCompleted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Listo ({completedSetsCount}/{totalSetsCount})
                  </span>
                ) : completedSetsCount > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    {completedSetsCount} de {totalSetsCount} series
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                {exData?.functionalPattern && (
                  <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-600 font-semibold border border-orange-200">
                    {exData.functionalPattern}
                  </span>
                )}
                {exData?.equipment && <span className="text-zinc-500">• {exData.equipment}</span>}
              </div>
            </div>
          </div>

          {/* YouTube Shorts Button & Warmup button */}
          <div className="flex items-center gap-2 self-start sm:self-auto ml-11 sm:ml-0">
            {exData && (
              <button
                onClick={() => setVideoModalExercise(exData)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Youtube className="w-4 h-4 text-red-600 fill-current" />
                <span>Shorts Técnico</span>
              </button>
            )}

            {routineEx.phase === 'fuerza' && routineEx.sets[0]?.targetWeight && routineEx.sets[0].targetWeight > 0 && (
              <button
                onClick={() => {
                  const proj = getProjectedTarget(routineEx, 0);
                  setWarmupModalData({
                    weight: proj.targetWeight,
                    name: exData ? exData.name : 'Ejercicio',
                  });
                }}
                className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
                title="Calculadora de aproximación"
              >
                <Flame className="w-4 h-4" />
              </button>
            )}

            {!isExerciseCompleted && totalSetsCount > 0 && routineEx.phase !== 'activacion' && (
              <button
                type="button"
                onClick={() => {
                  routineEx.sets.forEach((set, sIdx) => {
                    const proj = getProjectedTarget(routineEx, sIdx);
                    updateSetState(
                      routineEx.id,
                      sIdx,
                      {
                        completed: true,
                        actualWeight: proj.targetWeight,
                        actualReps: parseInt(proj.targetReps, 10) || 6,
                      },
                      false
                    );
                  });
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Marcar todas las series completadas"
              >
                <Check className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Completar</span> Todo
              </button>
            )}
          </div>
        </div>

        {/* Coach notes */}
        {routineEx.coachNotes && (
          <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
            <div>
              <span className="text-zinc-900 font-bold">Indicación Coach Matías: </span>
              <span>{routineEx.coachNotes}</span>
            </div>
          </div>
        )}

        {/* Dynamic Real-time Adaptation Badge */}
        {routineEx.phase === 'fuerza' && (() => {
          const firstProj = getProjectedTarget(routineEx, 0);
          if (firstProj.isAdaptedFromRealLoad && firstProj.realBaseWeightUsed) {
            const diff = firstProj.targetWeight - firstProj.realBaseWeightUsed;
            const diffSign = diff >= 0 ? `+${diff}` : `${diff}`;
            return (
              <div className="px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between text-xs animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
                    <Zap className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <span className="font-bold text-orange-950">
                      Carga Adaptada en Tiempo Real: {firstProj.targetWeight} kg
                    </span>
                    <span className="text-zinc-600 text-[11px] block sm:inline sm:ml-2">
                      ({diffSign} kg calculados automáticamente a partir de tus {firstProj.realBaseWeightUsed} kg de Sem 1)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white text-zinc-700 font-mono font-bold hidden sm:inline border border-orange-200">
                  RIR 1-2
                </span>
              </div>
            );
          }
          return null;
        })()}

        {/* Sets table (only if not a pure mobility drill) */}
        {routineEx.phase !== 'activacion' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 font-semibold uppercase tracking-wider">
                  <th className="py-2 px-2 w-10 text-center">Set</th>
                  <th className="py-2 px-2">Objetivo Semana {selectedWeek}</th>
                  <th className="py-2 px-2 w-24">Peso (kg)</th>
                  <th className="py-2 px-2 w-20">Reps</th>
                  <th className="py-2 px-2 w-16 text-center">RIR</th>
                  <th className="py-2 px-2 w-14 text-center">Listo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {routineEx.sets.map((set, setIdx) => {
                  const proj = getProjectedTarget(routineEx, setIdx);
                  const state = getSetState(
                    routineEx.id,
                    setIdx,
                    proj.targetWeight,
                    proj.targetReps
                  );

                  return (
                    <tr
                      key={set.id}
                      className={`transition-colors ${
                        state.completed ? 'bg-emerald-50/60' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <td className="py-2.5 px-2 text-center font-bold text-zinc-500">
                        {set.setNumber}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-zinc-950 font-mono">
                            {proj.targetReps} reps
                          </span>
                          <span className="text-orange-600 font-bold text-[11px]">
                            @ {proj.targetRir}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            (Pausa: {proj.restSeconds}s)
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          step="0.5"
                          value={state.actualWeight || ''}
                          placeholder={proj.targetWeight ? `${proj.targetWeight}` : '0'}
                          onChange={(e) =>
                            updateSetState(routineEx.id, setIdx, {
                              actualWeight: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1 text-center font-bold text-zinc-950 focus:outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="py-2.5 px-2">
                        <input
                          type="number"
                          value={state.actualReps || ''}
                          onChange={(e) =>
                            updateSetState(routineEx.id, setIdx, {
                              actualReps: parseInt(e.target.value, 10) || 0,
                            })
                          }
                          className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1 text-center font-bold text-zinc-950 focus:outline-none focus:border-orange-500"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <select
                          value={state.actualRir}
                          onChange={(e) =>
                            updateSetState(routineEx.id, setIdx, {
                              actualRir: parseInt(e.target.value, 10),
                            })
                          }
                          className="bg-white border border-zinc-300 rounded-lg px-1 py-1 text-center font-mono text-zinc-800 text-xs focus:outline-none focus:border-orange-500 font-bold"
                        >
                          <option value={0}>0 (Fallo)</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <button
                          onClick={() =>
                            updateSetState(
                              routineEx.id,
                              setIdx,
                              { completed: !state.completed },
                              !state.completed, // auto-start timer on check
                              proj.restSeconds
                            )
                          }
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                            state.completed
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-400 border border-zinc-300'
                          }`}
                          title={
                            state.completed
                              ? 'Serie completada (clic para desmarcar)'
                              : `Marcar completada e iniciar pausa de ${proj.restSeconds}s`
                          }
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Activation mobility checklist */
          <div className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-xs text-zinc-600 font-medium">
              Protocolo: {routineEx.sets[0]?.targetReps || 'Completar oscilaciones dinámicas'}
            </span>
            <button
              onClick={() => {
                const isDone = sessionSets[routineEx.id]?.[0]?.completed;
                updateSetState(routineEx.id, 0, { completed: !isDone });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sessionSets[routineEx.id]?.[0]?.completed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
              }`}
            >
              {sessionSets[routineEx.id]?.[0]?.completed ? '✓ Activado' : 'Marcar Listo'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 pb-28">
      <div role="status" className="text-xs p-3 bg-orange-50 text-orange-950">{draft.error || (draft.saving ? 'Guardando los cambios…' : 'Pesos, repeticiones y comentarios guardados automáticamente.')}{draft.error && <button className="underline ml-3" onClick={() => { void draft.flush().catch(() => {}); }}>Reintentar</button>}</div>
      {/* Top Mobile Bar with Active Functional Branding */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={activeStudent.avatarUrl}
              alt={activeStudent.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-orange-500 ring-2 ring-orange-200"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-zinc-950 leading-tight">
                  {activeStudent.name}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                  {activeStudent.goal}
                </span>
              </div>
              <p className="text-xs text-zinc-500 flex items-center gap-1">
                <span>Active Functional Studio •</span>
                <span className="text-zinc-800 font-bold">{methodology.coachName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={openCoachMode}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-zinc-100 border border-zinc-300 text-zinc-800 hover:bg-zinc-200 transition-colors"
          >
            Modo Coach
          </button>
        </div>
      </header>

      {/* Main Student Navigation: Routine vs Mesocycle Table vs Recharts Volume Chart */}
      <div className="max-w-4xl mx-auto px-4 pt-4">
        <div className="flex items-center justify-between bg-white p-1.5 rounded-2xl border border-zinc-200 gap-1 overflow-x-auto scrollbar-none shadow-xs">
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'workout'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <Dumbbell className="w-4 h-4 flex-shrink-0" />
            <span>Mi Rutina de Hoy</span>
          </button>

          <button
            onClick={() => setActiveTab('mesocycle')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'mesocycle'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <TableIcon className="w-4 h-4 flex-shrink-0" />
            <span>Tabla de Control (kg × reps)</span>
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === 'charts'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            <LineChart className="w-4 h-4 flex-shrink-0" />
            <span>Evolución (Recharts)</span>
          </button>
        </div>
      </div>

      {activeTab === 'mesocycle' ? (
        /* Mesocycle Matrix Table & Calendar Tab */
        <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
          <MesocycleControlTable student={activeStudent} routine={routine} />
        </main>
      ) : activeTab === 'charts' ? (
        /* Recharts Data Visualization Tab */
        <main className="max-w-4xl mx-auto px-4 mt-5 space-y-4">
          <VolumeEvolutionChart studentId={activeStudent.id} />
        </main>
      ) : (
        /* Workout Mode Tab */
        <main className="max-w-4xl mx-auto px-4 mt-4 space-y-5">
          {/* 4-Week Auto-Progression Bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Mesociclo de 4 Semanas (Progresión Automática)
                </span>
                <p className="text-xs text-zinc-600 mt-0.5 font-medium">
                  Los ejercicios se mantienen todo el mes por aprendizaje motor. Selecciona la semana para auto-ajustar cargas y repeticiones:
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded-lg border border-zinc-200 self-start sm:self-auto">
                100% Pesos Libres
              </span>
            </div>

            {/* Week Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { week: 1, label: 'Sem 1: Base', desc: '6 reps @ RIR 1-2' },
                { week: 2, label: 'Sem 2: Carga (+5kg)', desc: '4 reps @ RIR 1-2' },
                { week: 3, label: 'Sem 3: Descarga', desc: '6 reps (peso base)' },
                { week: 4, label: 'Sem 4: Récord (+10kg)', desc: '3 reps @ RIR 1-2' },
              ].map((w) => (
                <button
                  key={w.week}
                  onClick={() => setSelectedWeek(w.week as 1 | 2 | 3 | 4)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    selectedWeek === w.week
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs font-bold'
                      : 'bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  <div className="text-xs font-bold">{w.label}</div>
                  <div
                    className={`text-[10px] ${
                      selectedWeek === w.week ? 'text-orange-100 font-medium' : 'text-zinc-500'
                    }`}
                  >
                    {w.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Stimulus / Day Selector */}
            <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-2">
                {routine.days.map((day, idx) => (
                  <button
                    key={day.id}
                    onClick={() => {
                      setSelectedDayIndex(idx);
                      setSelectedStage(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDayIndex === idx
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-zinc-100 text-zinc-700 hover:text-zinc-950'
                    }`}
                  >
                    {day.dayName}
                  </button>
                ))}
              </div>

              {/* Progress counter */}
              <div className="text-xs text-zinc-500 whitespace-nowrap font-mono font-bold">
                {completedSetsCount}/{totalRoutineSets} series ({completionPercentage}%)
              </div>
            </div>
          </div>

          {(() => {
            const isDescensoPeso =
              routine.methodologyType === 'descenso_peso' ||
              (intermitenteExercises.length > 0 && hipertrofiaExercises.length === 0);

            // Compute stage completion stats
            const getStageStats = (stageExercises: RoutineExercise[]) => {
              const totalSets = stageExercises.reduce((acc, ex) => acc + ex.sets.length, 0);
              let completedSets = 0;
              stageExercises.forEach((ex) => {
                ex.sets.forEach((set, idx) => {
                  const proj = getProjectedTarget(ex, idx);
                  const state = getSetState(ex.id, idx, proj.targetWeight, proj.targetReps);
                  if (state.completed) completedSets++;
                });
              });
              return {
                totalSets,
                completedSets,
                isComplete: totalSets > 0 && completedSets === totalSets,
                isStarted: completedSets > 0 && completedSets < totalSets,
                percentage: totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0,
              };
            };

            const activacionStats = getStageStats(activacionExercises);
            const fuerzaStats = getStageStats(fuerzaExercises);
            const stage3Phase = isDescensoPeso ? 'intermitente' : 'hipertrofia';
            const stage3Exercises = isDescensoPeso ? intermitenteExercises : hipertrofiaExercises;
            const stage3Stats = getStageStats(stage3Exercises);

            // =========================================================================
            // VIEW A: 3 ETAPAS OVERVIEW HUB (Student first sees the 3 divided stages)
            // =========================================================================
            if (selectedStage === null) {
              return (
                <div className="space-y-5 animate-fade-in">
                  {/* Stages Intro Banner */}
                  <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                          {isDescensoPeso
                            ? 'Método 2: Aeróbico / Descenso de Peso'
                            : 'Método 1: Hipertrofia y Fuerza'}
                        </span>
                        <span className="text-xs text-zinc-500 font-medium">3 Etapas Obligatorias</span>
                      </div>
                      <h2 className="text-lg font-black text-zinc-950 mt-1">
                        Etapas del Entrenamiento de Hoy
                      </h2>
                      <p className="text-xs text-zinc-600 mt-0.5 max-w-xl font-medium">
                        Tu sesión está estructurada en 3 etapas secuenciales. Entra a cada una para
                        ver los ejercicios que forman parte, los videos técnicos y cómo realizarlos.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200 self-start sm:self-auto">
                      <div className="text-right">
                        <div className="text-xs text-zinc-500 font-semibold">Avance General</div>
                        <div className="text-sm font-black text-orange-600 font-mono">
                          {completionPercentage}%
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full border-4 border-zinc-200 relative flex items-center justify-center">
                        <div
                          className="absolute inset-0 rounded-full border-4 border-orange-500 transition-all"
                          style={{
                            clipPath: `polygon(50% 50%, -50% -50%, ${completionPercentage}% -50%)`,
                          }}
                        />
                        <span className="text-[11px] font-black font-mono text-zinc-900 z-10">
                          {completedSetsCount}/{totalRoutineSets}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* The 3 Stage Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* ETAPA 1: ACTIVACIÓN */}
                    <div
                      onClick={() => setSelectedStage('activacion')}
                      className={`group cursor-pointer rounded-2xl border p-5 transition-all relative overflow-hidden bg-white shadow-xs ${
                        activacionStats.isComplete
                          ? 'border-emerald-300 hover:border-emerald-500'
                          : activacionStats.isStarted
                          ? 'border-orange-300 hover:border-orange-500'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-500 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Flame className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                Etapa 1
                              </span>
                              <h3 className="text-base sm:text-lg font-black text-zinc-950 group-hover:text-orange-600 transition-colors">
                                1) Activación
                              </h3>
                              {activacionStats.isComplete ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Completada
                                </span>
                              ) : activacionStats.isStarted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                  ⚡ En Curso ({activacionStats.completedSets}/{activacionStats.totalSets})
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                  Pendiente
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-800 font-semibold mt-1">
                              Foam roller, movilidad de tobillo, cadera, tórax y un activador del SNC para finalizar.
                            </p>

                            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
                              Protocolo: Preparación articular y activación neuromuscular sin fatiga antes de levantar pesos libres.
                            </p>

                            {/* Exercises Preview Pills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {activacionExercises.map((ex) => {
                                const data = exercises.find((e) => e.id === ex.exerciseId);
                                const isDone = sessionSets[ex.id]?.[0]?.completed;
                                return (
                                  <span
                                    key={ex.id}
                                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 ${
                                      isDone
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-bold'
                                        : 'bg-zinc-50 text-zinc-700 border-zinc-200'
                                    }`}
                                  >
                                    {isDone && <Check className="w-3 h-3 text-emerald-600" />}
                                    {data?.name || 'Ejercicio de Movilidad'}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-200 flex-shrink-0">
                          <button
                            type="button"
                            className="w-full sm:w-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 group-hover:translate-x-1"
                          >
                            <span>
                              {activacionStats.isComplete
                                ? 'Revisar Etapa 1'
                                : activacionStats.isStarted
                                ? 'Continuar Etapa 1'
                                : 'Entrar a Etapa 1'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ETAPA 2: FUERZA */}
                    <div
                      onClick={() => setSelectedStage('fuerza')}
                      className={`group cursor-pointer rounded-2xl border p-5 transition-all relative overflow-hidden bg-white shadow-xs ${
                        fuerzaStats.isComplete
                          ? 'border-emerald-300 hover:border-emerald-500'
                          : fuerzaStats.isStarted
                          ? 'border-violet-300 hover:border-violet-500'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                            <Dumbbell className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-violet-100 text-violet-700 border border-violet-200">
                                Etapa 2
                              </span>
                              <h3 className="text-base sm:text-lg font-black text-zinc-950 group-hover:text-violet-600 transition-colors">
                                2) Fuerza
                              </h3>
                              {fuerzaStats.isComplete ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Completada
                                </span>
                              ) : fuerzaStats.isStarted ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                  ⚡ En Curso ({fuerzaStats.completedSets}/{fuerzaStats.totalSets} series)
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                  Pendiente
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-800 font-semibold mt-1">
                              {isDescensoPeso
                                ? '1 Pareja de fuerza con sobrecarga progresiva y descansos estrictos de 2 minutos.'
                                : '2 Pares de ejercicios de fuerza (Sentadilla-Remo / Peso Muerto-Press) con descansos de 2 min.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                              <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                                Semana {selectedWeek}:{' '}
                                {selectedWeek === 1
                                  ? '6 reps base @ RIR 1-2'
                                  : selectedWeek === 2
                                  ? '4 reps (+5kg sobre base) @ RIR 1-2'
                                  : selectedWeek === 3
                                  ? '6 reps (Descarga activa) @ RIR 1-2'
                                  : '3 reps (+10kg sobre base récord) @ RIR 1-2'}
                              </span>
                              <span className="text-zinc-600 font-semibold">Pausas obligatorias: 120s</span>
                            </div>

                            {/* Exercises Preview Pills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {fuerzaExercises.map((ex) => {
                                const data = exercises.find((e) => e.id === ex.exerciseId);
                                const proj = getProjectedTarget(ex, 0);
                                return (
                                  <span
                                    key={ex.id}
                                    className="text-[11px] px-2.5 py-1 rounded-lg border bg-zinc-50 text-zinc-800 border-zinc-200 font-medium flex items-center gap-1.5"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-violet-600" />
                                    <span>{data?.name || 'Ejercicio de Fuerza'}</span>
                                    <span className="text-violet-700 font-mono font-bold">
                                      {proj.targetWeight > 0 ? `${proj.targetWeight}kg` : ''}
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-200 flex-shrink-0">
                          <button
                            type="button"
                            className="w-full sm:w-auto px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 group-hover:translate-x-1"
                          >
                            <span>
                              {fuerzaStats.isComplete
                                ? 'Revisar Etapa 2'
                                : fuerzaStats.isStarted
                                ? 'Continuar Etapa 2'
                                : 'Entrar a Etapa 2'}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ETAPA 3: HIPERTROFIA O INTERMITENTE */}
                    <div
                      onClick={() => setSelectedStage(stage3Phase)}
                      className={`group cursor-pointer rounded-2xl border p-5 transition-all relative overflow-hidden bg-white shadow-xs ${
                        stage3Stats.isComplete
                          ? 'border-emerald-300 hover:border-emerald-500'
                          : stage3Stats.isStarted
                          ? 'border-orange-300 hover:border-orange-500'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-2xl border flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${
                              isDescensoPeso
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : 'bg-purple-50 border-purple-200 text-purple-600'
                            }`}
                          >
                            {isDescensoPeso ? (
                              <Zap className="w-6 h-6 fill-current" />
                            ) : (
                              <Layers className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                  isDescensoPeso
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}
                              >
                                Etapa 3
                              </span>
                              <h3
                                className={`text-base sm:text-lg font-black text-zinc-950 transition-colors ${
                                  isDescensoPeso
                                    ? 'group-hover:text-emerald-600'
                                    : 'group-hover:text-purple-600'
                                }`}
                              >
                                {isDescensoPeso ? '3) Intermitente' : '3) Hipertrofia'}
                              </h3>
                              {stage3Stats.isComplete ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" /> Completada
                                </span>
                              ) : stage3Stats.isStarted ? (
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                                    isDescensoPeso
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                      : 'text-purple-700 bg-purple-50 border-purple-200'
                                  }`}
                                >
                                  ⚡ En Curso ({stage3Stats.completedSets}/{stage3Stats.totalSets} series)
                                </span>
                              ) : (
                                <span className="text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full border border-zinc-200">
                                  Pendiente
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-zinc-800 font-semibold mt-1">
                              {isDescensoPeso
                                ? 'Intermitente neuromuscular: 10 segundos de trabajo máximo × 20 segundos de micropausa.'
                                : 'Circuito de 6 ejercicios (2 dominantes + 2 tracciones/empujes + 2 rotaciones zona media). 3 vueltas, pausas máx 1 min.'}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px]">
                              {isDescensoPeso ? (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Bloques Semana {selectedWeek}:{' '}
                                  {selectedWeek === 1
                                    ? '2 bloques de 7 min'
                                    : selectedWeek === 2
                                    ? '2 bloques de 10 min'
                                    : selectedWeek === 3
                                    ? '2 bloques de 7 min'
                                    : '1 bloque de 15 min'}
                                </span>
                              ) : (
                                <span className="text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  Semana {selectedWeek}:{' '}
                                  {selectedWeek === 1
                                    ? '10 reps'
                                    : selectedWeek === 2
                                    ? '12 reps'
                                    : selectedWeek === 3
                                    ? '8 reps'
                                    : '15 reps'}{' '}
                                  • Pausas máx 1 min
                                </span>
                              )}
                            </div>

                            {/* Exercises Preview Pills */}
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {stage3Exercises.map((ex) => {
                                const data = exercises.find((e) => e.id === ex.exerciseId);
                                return (
                                  <span
                                    key={ex.id}
                                    className="text-[11px] px-2.5 py-1 rounded-lg border bg-zinc-50 text-zinc-800 border-zinc-200 font-medium flex items-center gap-1.5"
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isDescensoPeso ? 'bg-emerald-500' : 'bg-purple-500'
                                      }`}
                                    />
                                    <span>{data?.name || 'Ejercicio'}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-200 flex-shrink-0">
                          <button
                            type="button"
                            className={`w-full sm:w-auto px-4 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 group-hover:translate-x-1 ${
                              isDescensoPeso
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            <span>
                              {stage3Stats.isComplete
                                ? `Revisar Etapa 3`
                                : stage3Stats.isStarted
                                ? `Continuar Etapa 3`
                                : `Entrar a Etapa 3`}
                            </span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary & Finish Workout Button */}
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-zinc-200 shadow-xs">
                    <div className="text-xs text-zinc-600 text-center sm:text-left">
                      <span className="font-bold text-zinc-950">Progreso total de hoy: </span>
                      <span>
                        {completedSetsCount} de {totalRoutineSets} series ({totalVolumeKg.toLocaleString()} kg acumulados)
                      </span>
                    </div>

                    <button
                      onClick={() => setShowFinishModal(true)}
                      disabled={completedSetsCount === 0}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs sm:text-sm uppercase tracking-wider rounded-xl shadow-xs transition-all hover:scale-[1.01]"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Finalizar Entrenamiento Completo
                    </button>
                  </div>
                </div>
              );
            }

            // =========================================================================
            // VIEW B: SINGLE ACTIVE STAGE EXECUTION
            // (Student entered one specific etapa: see exercises and how to perform them)
            // =========================================================================
            const currentStageNumber =
              selectedStage === 'activacion'
                ? 1
                : selectedStage === 'fuerza'
                ? 2
                : 3;

            const currentStageTitle =
              selectedStage === 'activacion'
                ? '1) Activación'
                : selectedStage === 'fuerza'
                ? '2) Fuerza'
                : isDescensoPeso
                ? '3) Intermitente'
                : '3) Hipertrofia';

            const activeExercisesForStage =
              selectedStage === 'activacion'
                ? activacionExercises
                : selectedStage === 'fuerza'
                ? fuerzaExercises
                : isDescensoPeso
                ? intermitenteExercises
                : hipertrofiaExercises;

            return (
              <div className="space-y-5 animate-fade-in">
                {/* Stage Header & Navigation Bar */}
                <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors self-start border border-zinc-300"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver a las 3 Etapas</span>
                    </button>

                    {/* Quick Stage Switcher Tabs */}
                    <div className="flex items-center gap-1 bg-zinc-50 p-1 rounded-xl border border-zinc-200 overflow-x-auto scrollbar-none">
                      <button
                        onClick={() => setSelectedStage('activacion')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          selectedStage === 'activacion'
                            ? 'bg-orange-500 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {activacionStats.isComplete && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>1. Activación</span>
                      </button>

                      <button
                        onClick={() => setSelectedStage('fuerza')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          selectedStage === 'fuerza'
                            ? 'bg-violet-600 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {fuerzaStats.isComplete && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>2. Fuerza</span>
                      </button>

                      <button
                        onClick={() => setSelectedStage(stage3Phase)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          selectedStage === stage3Phase
                            ? isDescensoPeso
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-orange-600 text-white shadow-xs'
                            : 'text-zinc-600 hover:text-zinc-950'
                        }`}
                      >
                        {stage3Stats.isComplete && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>3. {isDescensoPeso ? 'Intermitente' : 'Hipertrofia'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Stage Title and Protocol Card */}
                  <div className="pt-2 border-t border-zinc-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white ${
                            selectedStage === 'activacion'
                              ? 'bg-orange-500'
                              : selectedStage === 'fuerza'
                              ? 'bg-violet-600'
                              : isDescensoPeso
                              ? 'bg-emerald-600'
                              : 'bg-orange-600'
                          }`}
                        >
                          {currentStageNumber}
                        </span>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                            Etapa {currentStageNumber} de 3
                          </div>
                          <h2 className="text-base sm:text-lg font-black text-zinc-950">
                            {currentStageTitle}
                          </h2>
                        </div>
                      </div>

                      {/* Stage Specific Badges */}
                      {selectedStage === 'fuerza' && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-200 text-[11px] text-violet-700 font-mono font-bold">
                            <Timer className="w-3.5 h-3.5" /> Pausas de 120s obligatorias
                          </span>
                        </div>
                      )}

                      {selectedStage === 'hipertrofia' && (
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[11px] text-orange-700 font-bold font-mono">
                            3 Vueltas • Pausas máx 1 min
                          </span>
                        </div>
                      )}

                      {selectedStage === 'intermitente' && (
                        <button
                          onClick={() => setShowIntermittentTimer(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-xs self-start sm:self-auto"
                        >
                          <Timer className="w-4 h-4" />
                          <span>Abrir Cronómetro 10" x 20"</span>
                        </button>
                      )}
                    </div>

                    {/* Stage Protocol Instructions */}
                    <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                      {selectedStage === 'activacion' && (
                        <p>
                          <span className="font-bold text-orange-600">Instrucción Active: </span>
                          Realiza en secuencia el foam roller, la movilidad de tobillo, cadera, tórax y el activador del SNC. Toca "Shorts Técnico" en cada ejercicio para ver la ejecución exacta.
                        </p>
                      )}
                      {selectedStage === 'fuerza' && (
                        <p>
                          <span className="font-bold text-violet-700">Instrucción Active: </span>
                          Ejecuta los pares de fuerza con descansos completos de 2 minutos. En Semana {selectedWeek}, busca{' '}
                          {selectedWeek === 1
                            ? '6 reps con carga base y RIR 1-2.'
                            : selectedWeek === 2
                            ? '4 reps con +5kg sobre la base y RIR 1-2.'
                            : selectedWeek === 3
                            ? '6 reps en descarga activa con RIR 1-2.'
                            : '3 reps con +10kg sobre la base récord y RIR 1-2.'}
                        </p>
                      )}
                      {selectedStage === 'hipertrofia' && (
                        <p>
                          <span className="font-bold text-orange-600">Instrucción Active: </span>
                          Circuito continuo de 6 ejercicios (2 dominantes + 2 tracciones/empujes + 2 rotaciones de zona media). Completa 3 vueltas completas descansando no más de 1 minuto entre vueltas.
                        </p>
                      )}
                      {selectedStage === 'intermitente' && (
                        <p>
                          <span className="font-bold text-emerald-700">Instrucción Active: </span>
                          Trabaja a máxima intensidad durante 10 segundos y recupera 20 segundos. Semana {selectedWeek}:{' '}
                          {selectedWeek === 1 || selectedWeek === 3
                            ? '2 bloques de 7 minutos.'
                            : selectedWeek === 2
                            ? '2 bloques de 10 minutos.'
                            : '1 bloque de 15 minutos.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Intermittent Timer modal if open */}
                {showIntermittentTimer && (
                  <IntermittentTimer
                    currentWeek={selectedWeek}
                    onClose={() => setShowIntermittentTimer(false)}
                  />
                )}

                {/* Exercises List for this Stage ONLY */}
                <div className="space-y-4">
                  {activeExercisesForStage.length === 0 ? (
                    <div className="p-8 text-center bg-white border border-zinc-200 rounded-2xl text-zinc-500 font-medium">
                      No hay ejercicios cargados en esta etapa. Puedes agregarlos desde el Modo Entrenador.
                    </div>
                  ) : (
                    activeExercisesForStage.map((re, idx) => renderExerciseCard(re, idx))
                  )}
                </div>

                {/* Bottom Stage Navigation */}
                <div className="pt-4 pb-12 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    onClick={() => setSelectedStage(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-zinc-300"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Volver a las 3 Etapas</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {selectedStage === 'activacion' && (
                      <button
                        onClick={() => setSelectedStage('fuerza')}
                        className="w-full sm:w-auto px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Pasar a Etapa 2: Fuerza</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}

                    {selectedStage === 'fuerza' && (
                      <>
                        <button
                          onClick={() => setSelectedStage('activacion')}
                          className="px-3 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold border border-zinc-300"
                        >
                          ← Activación
                        </button>
                        <button
                          onClick={() => setSelectedStage(stage3Phase)}
                          className={`w-full sm:w-auto px-5 py-2.5 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 text-white ${
                            isDescensoPeso
                              ? 'bg-emerald-600 hover:bg-emerald-700'
                              : 'bg-orange-600 hover:bg-orange-700'
                          }`}
                        >
                          <span>Pasar a Etapa 3: {isDescensoPeso ? 'Intermitente' : 'Hipertrofia'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {(selectedStage === 'hipertrofia' || selectedStage === 'intermitente') && (
                      <>
                        <button
                          onClick={() => setSelectedStage('fuerza')}
                          className="px-3 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold border border-zinc-300"
                        >
                          ← Fuerza
                        </button>
                        <button
                          onClick={() => setShowFinishModal(true)}
                          className="w-full sm:w-auto px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Finalizar Entrenamiento</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </main>
      )}

      {/* Floating Rest Timer for Strength sets (2 min) */}
      <RestTimer initialSeconds={timerSeconds} triggerTime={timerTrigger} />

      {/* Warmup Calculator Modal */}
      {warmupModalData && (
        <WarmupCalculatorModal
          initialWeight={warmupModalData.weight}
          exerciseName={warmupModalData.name}
          onClose={() => setWarmupModalData(null)}
        />
      )}

      {/* Finish Workout Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white border border-zinc-300 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-900">
            <div className="text-center mb-5">
              <span className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 border border-orange-200 inline-flex items-center justify-center mb-3">
                <Award className="w-7 h-7" />
              </span>
              <h3 className="text-lg font-black text-zinc-950">¡Gran sesión completada!</h3>
              <p className="text-xs text-zinc-600 mt-1">
                Completaste <span className="text-orange-600 font-bold">{completedSetsCount}</span>{' '}
                series con un volumen de carga total de{' '}
                <span className="text-zinc-950 font-bold">{totalVolumeKg.toLocaleString()} kg</span> en
                la Semana {selectedWeek}.
              </p>
            </div>

            {/* Rating */}
            <div className="mb-4 text-center">
              <label className="block text-xs font-bold text-zinc-700 mb-2">
                ¿Cómo te sentiste físicamente hoy?
              </label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFinishRating(star)}
                    className="p-1.5 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        star <= finishRating
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-zinc-300 hover:text-zinc-400'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback message for the coach */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-orange-500" />
                Mensaje o feedback para Coach Matías:
              </label>
              <textarea
                rows={3}
                maxLength={5000}
                value={coachFeedback}
                onChange={(e) => setCoachFeedback(e.target.value)}
                placeholder="Ej: Cumplí las 4 reps con 85kg a RIR 1-2. Las pausas de 2 minutos fueron clave..."
                className="w-full bg-zinc-50 border border-zinc-300 rounded-xl p-3 text-xs text-zinc-950 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-xl"
              >
                Volver
              </button>
              <button
                disabled={finishing || draft.saving}
                onClick={handleFinishWorkout}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                {finishing ? 'Guardando…' : 'Guardar y enviar al profe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Celebration Screen */}
      {workoutFinishedSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white border border-orange-300 rounded-3xl p-6 text-center text-zinc-900 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 border border-orange-300 mx-auto flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <h3 className="text-xl font-black text-zinc-950">¡Sesión Registrada en Active!</h3>
            <p className="text-xs text-zinc-600 mt-2">
              Tu volumen de carga fue añadido al gráfico de evolución. Coach{' '}
              <span className="text-zinc-950 font-bold">{methodology.coachName}</span> ya tiene tu registro.
            </p>

            <div className="my-5 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-left space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-semibold">Semana:</span>
                <span className="text-orange-600 font-bold">
                  Semana {workoutFinishedSuccess.programWeek}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-semibold">Volumen Levantado:</span>
                <span className="text-zinc-950 font-bold font-mono">
                  {workoutFinishedSuccess.totalVolumeKg.toLocaleString()} kg
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setWorkoutFinishedSuccess(null);
                  setActiveTab('charts'); // take them to view their Recharts chart!
                }}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
              >
                Ver mi progreso
              </button>
              <button
                onClick={() => setWorkoutFinishedSuccess(null)}
                className="py-2.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-bold rounded-xl text-xs transition-colors border border-zinc-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
