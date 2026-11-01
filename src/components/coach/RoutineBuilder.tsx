import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Dumbbell,
  ExternalLink,
  Flame,
  Info,
  Layers,
  Loader2,
  MoveDown,
  MoveUp,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Video,
  Wand2,
  X,
  Youtube,
  Zap,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import {
  Equipment,
  Exercise,
  FunctionalPattern,
  MuscleGroup,
  Routine,
  RoutineDay,
  RoutineExercise,
  SetType,
  SplitType,
  WorkoutSet,
} from '../../types/gym';
import { extractYouTubeId, getYouTubeEmbedUrl, getYouTubeSearchUrl, getYouTubeThumbnail } from '../../utils/youtube';
import { INITIAL_ROUTINES } from '../../data/initialData';

const ALL_MUSCLES: MuscleGroup[] = [
  'Pecho',
  'Espalda',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core',
  'Gemelos',
];

const ALL_EQUIPMENT: Equipment[] = [
  'Barra',
  'Mancuerna',
  'Kettlebell',
  'Peso Corporal',
  'Balón Medicinal',
  'Banda Elástica',
  'Polea',
  'Máquina',
];

const ALL_PATTERNS: FunctionalPattern[] = [
  'Rodilla Dominante',
  'Cadera Dominante',
  'Tracción',
  'Empuje',
  'Zona Media y Rotaciones',
  'Activación y Movilidad',
  'Metabólico / Intermitente',
];

export const RoutineBuilder: React.FC = () => {
  const {
    routines,
    students,
    exercises,
    methodology,
    editingRoutineId,
    setEditingRoutineId,
    addRoutine,
    updateRoutine,
    duplicateRoutine,
    deleteRoutine,
    addExercise,
    setVideoModalExercise,
  } = useGym();

  // Find active routine or default to first
  const currentRoutine = routines.find((r) => r.id === editingRoutineId) || routines[0];

  // Local draft state for pristine editing
  const [draftRoutine, setDraftRoutine] = useState<Routine>(() => {
    return currentRoutine
      ? JSON.parse(JSON.stringify(currentRoutine))
      : {
          id: `routine-${Date.now()}`,
          name: 'Nueva Rutina Personalizada',
          description: '',
          splitType: 'upper_lower' as SplitType,
          difficulty: 'Intermedio',
          daysCount: 3,
          days: [],
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
  });

  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showExercisePickerModal, setShowExercisePickerModal] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState<string>('todos');
  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const isInitialMount = useRef(true);
  const lastLoadedId = useRef<string | null>(null);
  const lastSavedHashRef = useRef<string>(JSON.stringify(draftRoutine));
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Exercise Replacement State (e.g. swap Ejercicio 1 for Sentadilla)
  const [replacingRoutineExId, setReplacingRoutineExId] = useState<string | null>(null);

  // 4-Week Projection Modal State
  const [showProjectionModal, setShowProjectionModal] = useState(false);
  const [projectionExercise, setProjectionExercise] = useState<RoutineExercise | null>(null);

  // Stage filter for day editing: 'all' | 'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente'
  const [coachStageFilter, setCoachStageFilter] = useState<
    'all' | 'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente'
  >('all');

  // Modal for creating custom exercise on the fly with video
  const [showCreateCustomExerciseModal, setShowCreateCustomExerciseModal] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExYoutubeUrl, setNewExYoutubeUrl] = useState('');
  const [newExPattern, setNewExPattern] = useState<FunctionalPattern>('Rodilla Dominante');
  const [newExMuscle, setNewExMuscle] = useState<MuscleGroup>('Cuádriceps');
  const [newExEquipment, setNewExEquipment] = useState<Equipment>('Barra');
  const [newExPhase, setNewExPhase] = useState<'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente'>('fuerza');
  const [newExSetsCount, setNewExSetsCount] = useState<number>(3);
  const [newExTargetReps, setNewExTargetReps] = useState<string>('6');
  const [newExRestSeconds, setNewExRestSeconds] = useState<number>(120);
  const [newExCoachCue, setNewExCoachCue] = useState<string>('');

  // Sync draft when editingRoutineId changes from external selection
  React.useEffect(() => {
    if (editingRoutineId) {
      const found = routines.find((r) => r.id === editingRoutineId);
      if (found && lastLoadedId.current !== found.id) {
        lastLoadedId.current = found.id;
        setDraftRoutine(JSON.parse(JSON.stringify(found)));
        lastSavedHashRef.current = JSON.stringify(found);
        setActiveDayIndex(0);
      }
    }
  }, [editingRoutineId, routines]);

  // Debounced Auto-Save
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentHash = JSON.stringify(draftRoutine);
    if (currentHash === lastSavedHashRef.current) {
      return;
    }

    setSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        let saved = draftRoutine;
        if (!routines.some((r) => r.id === draftRoutine.id)) {
          saved = addRoutine(draftRoutine);
          lastLoadedId.current = saved.id;
          setDraftRoutine(saved);
          setEditingRoutineId(saved.id);
        }
        await updateRoutine(saved);
        lastSavedHashRef.current = JSON.stringify(saved);
        setSaveStatus('saved');
        setLastSavedAt(new Date().toLocaleTimeString());
      } catch { setSaveStatus('idle'); }

    }, 700);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [draftRoutine, routines, updateRoutine, addRoutine]);

  const activeDay: RoutineDay | undefined = draftRoutine.days[activeDayIndex] || draftRoutine.days[0];

  // Save routine manually
  const handleSaveRoutine = async () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    setSaveStatus('saving');
    try {
      let saved = draftRoutine;
      if (!routines.some(r => r.id === draftRoutine.id)) {
        saved = addRoutine(draftRoutine);
        lastLoadedId.current = saved.id;
        setDraftRoutine(saved);
        setEditingRoutineId(saved.id);
      }
      await updateRoutine(saved);
      lastSavedHashRef.current = JSON.stringify(saved);
      setSaveStatus('saved'); setLastSavedAt(new Date().toLocaleTimeString());
      setSavedToast(true); setTimeout(() => setSavedToast(false), 3000);
    } catch { setSaveStatus('idle'); }
  };

  // Add new day to routine
  const handleAddDay = () => {
    const newDayNum = draftRoutine.days.length + 1;
    const newDay: RoutineDay = {
      id: `day-${Date.now()}`,
      dayNumber: newDayNum,
      dayName: `Día ${newDayNum}: Sesión Personalizada`,
      stimulusType: 'funcional_mixto',
      exercises: [],
      focusMuscles: ['Pecho'],
      targetDurationMinutes: 60,
    };
    setDraftRoutine((prev) => ({
      ...prev,
      daysCount: prev.days.length + 1,
      days: [...prev.days, newDay],
    }));
    setActiveDayIndex(draftRoutine.days.length);
  };

  // Remove day
  const handleRemoveDay = (dayIndex: number) => {
    if (draftRoutine.days.length <= 1) {
      alert('La rutina debe tener al menos 1 día de entrenamiento.');
      return;
    }
    setDraftRoutine((prev) => {
      const updatedDays = prev.days
        .filter((_, idx) => idx !== dayIndex)
        .map((d, i) => ({ ...d, dayNumber: i + 1 }));
      return {
        ...prev,
        daysCount: updatedDays.length,
        days: updatedDays,
      };
    });
    setActiveDayIndex(0);
  };

  // Add or Replace exercise in active day from exercise picker
  const handleAddExerciseToDay = (exerciseId: string) => {
    if (!activeDay) return;
    const exData = exercises.find((e) => e.id === exerciseId);

    // If replacing an existing exercise (e.g. swap Ejercicio 1 for Sentadillas)
    if (replacingRoutineExId) {
      setDraftRoutine((prev) => ({
        ...prev,
        days: prev.days.map((d, idx) =>
          idx === activeDayIndex
            ? {
                ...d,
                exercises: d.exercises.map((re) =>
                  re.id === replacingRoutineExId
                    ? {
                        ...re,
                        exerciseId,
                        coachNotes: exData?.cues[0] || re.coachNotes,
                      }
                    : re
                ),
              }
            : d
        ),
      }));
      setReplacingRoutineExId(null);
      setShowExercisePickerModal(false);
      setToastMessage(`✓ Ejercicio reemplazado exitosamente por "${exData?.name}".`);
      setSavedToast(true);
      return;
    }

    const isCompound =
      exData?.muscleGroup === 'Pecho' ||
      exData?.muscleGroup === 'Espalda' ||
      exData?.muscleGroup === 'Cuádriceps' ||
      exData?.muscleGroup === 'Isquiotibiales';

    const defaultRest = isCompound
      ? methodology.defaultRestFuerzaSeconds || 120
      : methodology.defaultRestHipertrofiaSeconds || 60;

    const chosenPhase =
      coachStageFilter !== 'all'
        ? coachStageFilter
        : exData?.functionalPattern === 'Activación y Movilidad'
        ? 'activacion'
        : 'fuerza';

    const newRoutineExercise: RoutineExercise = {
      id: `re-${Date.now()}`,
      exerciseId,
      phase: chosenPhase,
      order: activeDay.exercises.length + 1,
      coachNotes: exData?.cues[0] || 'Cuidar técnica y fase excéntrica en 2-3 segundos.',
      sets: [
        {
          id: `s-${Date.now()}-1`,
          setNumber: 1,
          setType: 'top_set',
          targetReps: chosenPhase === 'fuerza' ? '6' : '10-12',
          targetRirRpe: methodology.defaultIntensityTarget || 'RIR 1-2',
          restSeconds: defaultRest,
          targetWeight: 0,
          tempo: '2-0-1-0',
        },
        {
          id: `s-${Date.now()}-2`,
          setNumber: 2,
          setType: 'backoff',
          targetReps: chosenPhase === 'fuerza' ? '6' : '10-12',
          targetRirRpe: methodology.defaultIntensityTarget || 'RIR 1',
          restSeconds: defaultRest,
          targetWeight: 0,
          tempo: '2-0-1-0',
        },
        {
          id: `s-${Date.now()}-3`,
          setNumber: 3,
          setType: 'backoff',
          targetReps: chosenPhase === 'fuerza' ? '6' : '10-12',
          targetRirRpe: 'RIR 1',
          restSeconds: defaultRest,
          targetWeight: 0,
          tempo: '2-0-1-0',
        },
      ],
    };

    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, idx) =>
        idx === activeDayIndex ? { ...d, exercises: [...d.exercises, newRoutineExercise] } : d
      ),
    }));

    setShowExercisePickerModal(false);
  };

  // Create custom exercise with video on the fly and add directly to active day
  const handleCreateCustomExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim() || !activeDay) return;

    const extractedId = extractYouTubeId(newExYoutubeUrl);
    // If not valid or empty, fallback to clean exercise video demo
    const videoId = extractedId || 'rT7DgCr-3pg';
    const isShort = newExYoutubeUrl.includes('/shorts/') || Boolean(newExYoutubeUrl.match(/shorts/i));

    const cues = newExCoachCue.trim()
      ? [newExCoachCue.trim()]
      : ['Mantener control excéntrico y tensión muscular constante.'];

    const effectivePhase =
      coachStageFilter !== 'all' ? coachStageFilter : newExPhase;

    // 1. Add to global exercise bank
    const created = addExercise({
      name: newExName.trim(),
      muscleGroup: newExMuscle,
      equipment: newExEquipment,
      functionalPattern: newExPattern,
      youtubeUrl: newExYoutubeUrl.trim() || `https://www.youtube.com/watch?v=${videoId}`,
      youtubeVideoId: videoId,
      isShorts: isShort,
      cues,
      tipsForCoach: 'Creado por el entrenador desde el planificador',
      defaultRestSeconds: newExRestSeconds,
    });

    // 2. Build initial sets
    const sets: WorkoutSet[] = Array.from({ length: Math.max(1, newExSetsCount) }).map((_, i) => ({
      id: `s-${Date.now()}-${i + 1}`,
      setNumber: i + 1,
      setType: i === 0 ? 'top_set' : 'backoff',
      targetReps: newExTargetReps || (effectivePhase === 'fuerza' ? '6' : '10-12'),
      targetRirRpe: effectivePhase === 'fuerza' ? 'RIR 1-2' : 'RIR 1',
      restSeconds: newExRestSeconds || (effectivePhase === 'fuerza' ? 120 : 60),
      targetWeight: 0,
      tempo: '2-0-1-0',
    }));

    // 3. Create RoutineExercise
    const newRoutineExercise: RoutineExercise = {
      id: `re-${Date.now()}`,
      exerciseId: created.id,
      phase: effectivePhase,
      order: activeDay.exercises.length + 1,
      coachNotes: cues[0],
      sets,
    };

    // 4. Append to active day in draftRoutine (auto-save will trigger automatically!)
    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, idx) =>
        idx === activeDayIndex ? { ...d, exercises: [...d.exercises, newRoutineExercise] } : d
      ),
    }));

    // 5. Reset and close modal
    setShowCreateCustomExerciseModal(false);
    setNewExName('');
    setNewExYoutubeUrl('');
    setNewExCoachCue('');
    setToastMessage(`¡Ejercicio "${created.name}" creado con video y agregado a la rutina!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Remove exercise from active day
  const handleRemoveExercise = (reId: string) => {
    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, idx) =>
        idx === activeDayIndex
          ? {
              ...d,
              exercises: d.exercises
                .filter((e) => e.id !== reId)
                .map((e, i) => ({ ...e, order: i + 1 })),
            }
          : d
      ),
    }));
  };

  // Reorder exercise
  const handleMoveExercise = (index: number, direction: 'up' | 'down') => {
    if (!activeDay) return;
    const newExs = [...activeDay.exercises];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newExs.length) return;

    const temp = newExs[index];
    newExs[index] = newExs[targetIdx];
    newExs[targetIdx] = temp;

    // renumber
    const updated = newExs.map((e, i) => ({ ...e, order: i + 1 }));

    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, idx) => (idx === activeDayIndex ? { ...d, exercises: updated } : d)),
    }));
  };

  // Set management
  const handleAddSet = (reId: string) => {
    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, dIdx) => {
        if (dIdx !== activeDayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.map((re) => {
            if (re.id !== reId) return re;
            const lastSet = re.sets[re.sets.length - 1];
            const newSet: WorkoutSet = {
              id: `s-${Date.now()}-${re.sets.length + 1}`,
              setNumber: re.sets.length + 1,
              setType: 'normal',
              targetReps: lastSet ? lastSet.targetReps : '10',
              targetRirRpe: lastSet ? lastSet.targetRirRpe : 'RIR 1-2',
              restSeconds: lastSet ? lastSet.restSeconds : 90,
              targetWeight: lastSet ? lastSet.targetWeight : 0,
              tempo: lastSet ? lastSet.tempo : '2-0-1-0',
            };
            return {
              ...re,
              sets: [...re.sets, newSet],
            };
          }),
        };
      }),
    }));
  };

  const handleRemoveSet = (reId: string, setIdx: number) => {
    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, dIdx) => {
        if (dIdx !== activeDayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.map((re) => {
            if (re.id !== reId) return re;
            if (re.sets.length <= 1) return re;
            return {
              ...re,
              sets: re.sets
                .filter((_, i) => i !== setIdx)
                .map((s, i) => ({ ...s, setNumber: i + 1 })),
            };
          }),
        };
      }),
    }));
  };

  const handleUpdateSet = (reId: string, setIdx: number, updates: Partial<WorkoutSet>) => {
    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((d, dIdx) => {
        if (dIdx !== activeDayIndex) return d;
        return {
          ...d,
          exercises: d.exercises.map((re) => {
            if (re.id !== reId) return re;
            return {
              ...re,
              sets: re.sets.map((s, i) => (i === setIdx ? { ...s, ...updates } : s)),
            };
          }),
        };
      }),
    }));
  };

  // Apply Coach Methodology rules to current routine in 1 click!
  const handleApplyMethodology = () => {
    setDraftRoutine((prev) => ({
      ...prev,
      days: prev.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((re) => {
          const exData = exercises.find((e) => e.id === re.exerciseId);
          const isCompound =
            exData?.equipment === 'Barra' ||
            exData?.equipment === 'Peso Corporal' ||
            exData?.name.includes('Press') ||
            exData?.name.includes('Sentadilla') ||
            exData?.name.includes('Peso Muerto');

          const rest = isCompound
            ? methodology.defaultRestFuerzaSeconds || 120
            : methodology.defaultRestHipertrofiaSeconds || 60;

          return {
            ...re,
            sets: re.sets.map((s) => ({
              ...s,
              restSeconds: rest,
              targetRirRpe: s.setType === 'top_set' ? 'RIR 1-2' : s.setType === 'failure' ? 'RIR 0' : 'RIR 1',
            })),
          };
        }),
      })),
    }));

    alert('¡Pautas de tu metodología aplicadas a todos los descansos y RIR de esta rutina!');
  };

  // Load official pre-built methodology routines (Fuerza/Hipertrofia or Descenso de Peso)
  const handleLoadMethodologyTemplate = (templateType: 'fuerza_hipertrofia' | 'descenso_peso') => {
    const templateSource =
      routines.find((r) => r.methodologyType === templateType) ||
      INITIAL_ROUTINES.find((r) => r.methodologyType === templateType);

    if (!templateSource) return;

    const assignedStudent = students.find((s) => s.id === draftRoutine.studentId);
    const studentSuffix = assignedStudent ? ` (${assignedStudent.name})` : ` #${routines.length + 1}`;

    const newRoutine: Routine = {
      ...JSON.parse(JSON.stringify(templateSource)),
      id: `routine-${Date.now()}`,
      name: `${templateSource.name}${studentSuffix}`,
      studentId: draftRoutine.studentId,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const saved = addRoutine(newRoutine);
    setEditingRoutineId(saved.id);
    setDraftRoutine(JSON.parse(JSON.stringify(saved)));
    setActiveDayIndex(0);
    setToastMessage(
      `¡Plantilla "${templateSource.name}" cargada con éxito! Ahora puedes editar los ejercicios, pesos o series libremente.`
    );
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Calculate weekly volume per muscle group in this entire routine
  const weeklyMuscleVolume: Record<string, number> = {};
  draftRoutine.days.forEach((day) => {
    day.exercises.forEach((re) => {
      const exData = exercises.find((e) => e.id === re.exerciseId);
      if (exData) {
        // Effective sets: every set except warmup
        const effectiveSets = re.sets.filter((s) => s.setType !== 'warmup').length;
        weeklyMuscleVolume[exData.muscleGroup] =
          (weeklyMuscleVolume[exData.muscleGroup] || 0) + effectiveSets;
      }
    });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-900">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Dumbbell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
              Planificador de Rutinas Personalizadas
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 mt-1 max-w-2xl">
            Diseña los días de entrenamiento, asigna ejercicios del banco de videos YouTube y verifica en tiempo real que se cumpla tu modelo de planificación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Continuous Auto-save Status Pill */}
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando automáticamente...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{saveStatus === 'idle' ? 'No se confirmó el guardado. Volvé a guardar.' : `Guardado automático ${lastSavedAt || ''}`}</span>
            </span>
          )}

          <button
            onClick={handleApplyMethodology}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-bold transition-colors"
            title="Ajusta descansos y RIR según tu metodología"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Aplicar Mi Método
          </button>

          <button
            onClick={handleSaveRoutine}
            className="flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-[1.02]"
            title="Forzar guardado inmediato"
          >
            {savedToast ? (
              <>
                <Check className="w-4 h-4" /> ¡Guardado!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Guardar Ahora
              </>
            )}
          </button>
        </div>
      </div>

      {/* Auto-save & Custom Toast */}
      {(savedToast || toastMessage) && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">
              {toastMessage || '¡Rutina guardada automáticamente! Tus alumnos la verán reflejada al instante en su portal.'}
            </span>
          </div>
          <button
            onClick={() => {
              setSavedToast(false);
              setToastMessage(null);
            }}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold px-2 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Routine Selector & Meta Form */}
      <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2 flex-1">
            <label className="text-xs font-semibold text-zinc-600 whitespace-nowrap">
              Editar Rutina:
            </label>
            <select
              value={draftRoutine.id}
              onChange={(e) => {
                const target = routines.find((r) => r.id === e.target.value);
                if (target) {
                  setEditingRoutineId(target.id);
                  setDraftRoutine(JSON.parse(JSON.stringify(target)));
                }
              }}
              className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs sm:text-sm text-zinc-950 font-bold focus:outline-none focus:border-orange-500 flex-1 max-w-md"
            >
              {routines.map((r) => {
                const assignedStudent = students.find((s) => s.id === r.studentId);
                return (
                  <option key={r.id} value={r.id}>
                    {r.name} {assignedStudent ? `(Alumno: ${assignedStudent.name})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Template loader dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>Cargar Plantilla Oficial</span>
                <ChevronDown className="w-3 h-3 text-orange-500" />
              </button>

              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-40 hidden group-hover:block hover:block animate-fade-in">
                <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 tracking-wider">
                  Metodología Active Functional:
                </div>
                <button
                  type="button"
                  onClick={() => handleLoadMethodologyTemplate('fuerza_hipertrofia')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-orange-50 transition-colors space-y-0.5"
                >
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Método 1: Fuerza & Hipertrofia (4 sem)
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    2 estímulos semanales (pares fijos + circuitos 6 ejerc. con pausas 2m y 1m)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadMethodologyTemplate('descenso_peso')}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-violet-50 transition-colors space-y-0.5 mt-1 border-t border-zinc-100 pt-2"
                >
                  <div className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-violet-600" />
                    Método 2: Descenso de Peso (10"x20")
                  </div>
                  <div className="text-[10px] text-zinc-500 leading-tight">
                    1 pareja fuerza + Intermitente neuromuscular (10"x20" por bloques)
                  </div>
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                const cloned = duplicateRoutine(draftRoutine.id);
                setEditingRoutineId(cloned.id);
                setDraftRoutine(JSON.parse(JSON.stringify(cloned)));
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold border border-zinc-200"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicar
            </button>
            <button
              onClick={() => {
                const newR = addRoutine({
                  name: `Rutina Personalizada #${routines.length + 1}`,
                  description: '',
                  splitType: 'upper_lower',
                  difficulty: 'Intermedio',
                  daysCount: 3,
                  days: [
                    {
                      id: `day-${Date.now()}-1`,
                      dayNumber: 1,
                      dayName: 'Día 1: Empuje & Pecho',
                      stimulusType: 'rodilla_traccion',
                      exercises: [],
                      focusMuscles: ['Pecho'],
                      targetDurationMinutes: 60,
                    },
                  ],
                });
                setEditingRoutineId(newR.id);
                setDraftRoutine(JSON.parse(JSON.stringify(newR)));
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-xl text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Nueva Rutina
            </button>
          </div>
        </div>

        {/* Routine Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nombre de la Rutina *
            </label>
            <input
              type="text"
              value={draftRoutine.name}
              onChange={(e) => setDraftRoutine({ ...draftRoutine, name: e.target.value })}
              className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Asignar a Alumno
            </label>
            <select
              value={draftRoutine.studentId || ''}
              onChange={(e) =>
                setDraftRoutine({ ...draftRoutine, studentId: e.target.value || undefined })
              }
              className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500"
            >
              <option value="">-- Plantilla General / Sin asignar --</option>
              {students.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} ({st.goal})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              División (Split)
            </label>
            <select
              value={draftRoutine.splitType}
              onChange={(e) =>
                setDraftRoutine({ ...draftRoutine, splitType: e.target.value as SplitType })
              }
              className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500"
            >
              <option value="upper_lower">Torso / Pierna</option>
              <option value="push_pull_legs">Empuje / Tracción / Pierna (PPL)</option>
              <option value="full_body">Cuerpo Completo (Full Body)</option>
              <option value="weider">Weider (Músculo por Día)</option>
              <option value="custom">Híbrido / Personalizado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Builder Grid: Days & Exercises on Left, Real-time Volume & Rules on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Routine Days & Exercises Editor (2 columns) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {draftRoutine.days.map((day, idx) => (
              <button
                key={day.id}
                onClick={() => setActiveDayIndex(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeDayIndex === idx
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-white hover:bg-zinc-100 text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                }`}
              >
                <span>
                  Día {day.dayNumber}: {day.dayName.split(':')[1]?.trim() || day.dayName}
                </span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeDayIndex === idx ? 'bg-orange-700/50 text-white' : 'bg-zinc-100 text-zinc-600'
                }`}>
                  {day.exercises.length}
                </span>
              </button>
            ))}

            <button
              onClick={handleAddDay}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-orange-50 text-orange-600 border border-dashed border-orange-300 whitespace-nowrap transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir Día
            </button>
          </div>

          {/* Active Day Detail Card */}
          {activeDay && (
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-5 shadow-xs">
              {/* Day Header Inputs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                <div className="flex-1">
                  <input
                    type="text"
                    value={activeDay.dayName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDraftRoutine((prev) => ({
                        ...prev,
                        days: prev.days.map((d, i) =>
                          i === activeDayIndex ? { ...d, dayName: val } : d
                        ),
                      }));
                    }}
                    className="text-base sm:text-lg font-bold text-zinc-950 bg-transparent border-b border-zinc-200 focus:border-orange-500 focus:outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-zinc-600">
                    <span>Duración:</span>
                    <input
                      type="number"
                      value={activeDay.targetDurationMinutes}
                      onChange={(e) => {
                        const mins = parseInt(e.target.value, 10) || 60;
                        setDraftRoutine((prev) => ({
                          ...prev,
                          days: prev.days.map((d, i) =>
                            i === activeDayIndex ? { ...d, targetDurationMinutes: mins } : d
                          ),
                        }));
                      }}
                      className="w-14 bg-zinc-50 border border-zinc-300 rounded-lg px-2 py-1 text-center font-bold text-zinc-900 text-xs"
                    />
                    <span>min</span>
                  </div>

                  <button
                    onClick={() => handleRemoveDay(activeDayIndex)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Eliminar este día"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 3 Etapas Management for Active Day */}
              {(() => {
                const isAerobicMethod =
                  draftRoutine.methodologyType === 'descenso_peso' ||
                  (activeDay.exercises.some((e) => e.phase === 'intermitente') &&
                    !activeDay.exercises.some((e) => e.phase === 'hipertrofia'));

                const stage3Phase = isAerobicMethod ? 'intermitente' : 'hipertrofia';

                const activacionExercises = activeDay.exercises.filter((e) => e.phase === 'activacion');
                const fuerzaExercises = activeDay.exercises.filter((e) => e.phase === 'fuerza');
                const stage3Exercises = activeDay.exercises.filter((e) => e.phase === stage3Phase);

                const displayedExercises =
                  coachStageFilter === 'all'
                    ? activeDay.exercises
                    : activeDay.exercises.filter((e) => e.phase === coachStageFilter);

                return (
                  <div className="space-y-4">
                    {/* Stage Filter Tabs Bar */}
                    <div className="bg-zinc-50 p-2.5 rounded-2xl border border-zinc-200 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                        <span className="font-bold uppercase tracking-wider text-zinc-500 text-[11px]">
                          Etapas del Método en este Día:
                        </span>
                        <span className="text-[11px] font-bold text-orange-600 font-mono">
                          {isAerobicMethod
                            ? 'Método: Descenso de Peso (10"×20")'
                            : 'Método: Hipertrofia & Fuerza (4 sem)'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCoachStageFilter('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            coachStageFilter === 'all'
                              ? 'bg-zinc-900 text-white shadow-xs'
                              : 'bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                          }`}
                        >
                          Todas las Etapas ({activeDay.exercises.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => setCoachStageFilter('activacion')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            coachStageFilter === 'activacion'
                              ? 'bg-orange-500 text-white shadow-xs'
                              : 'bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${coachStageFilter === 'activacion' ? 'bg-white' : 'bg-orange-500'}`} />
                          1. Activación ({activacionExercises.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => setCoachStageFilter('fuerza')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            coachStageFilter === 'fuerza'
                              ? 'bg-violet-600 text-white shadow-xs'
                              : 'bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${coachStageFilter === 'fuerza' ? 'bg-white' : 'bg-violet-600'}`} />
                          2. Fuerza ({fuerzaExercises.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => setCoachStageFilter(stage3Phase)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            coachStageFilter === stage3Phase
                              ? 'bg-orange-600 text-white shadow-xs'
                              : 'bg-white text-zinc-700 hover:text-zinc-950 border border-zinc-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${coachStageFilter === stage3Phase ? 'bg-white' : 'bg-orange-600'}`}
                          />
                          3. {isAerobicMethod ? 'Intermitente' : 'Hipertrofia'} ({stage3Exercises.length})
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setProjectionExercise(null);
                            setShowProjectionModal(true);
                          }}
                          className="sm:ml-auto px-3 py-1.5 rounded-xl text-xs font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Ver cómo se calculan automáticamente las cargas de las semanas 2, 3 y 4 (+5kg / Descarga / +10kg)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                          <span>👁️ Proyección 4 Semanas</span>
                        </button>
                      </div>

                      {/* Stage info cue & direct add button */}
                      {coachStageFilter !== 'all' && (
                        <div className="p-2.5 rounded-xl bg-white border border-zinc-200 text-xs text-zinc-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                coachStageFilter === 'activacion'
                                  ? 'bg-orange-500'
                                  : coachStageFilter === 'fuerza'
                                  ? 'bg-violet-600'
                                  : isAerobicMethod
                                  ? 'bg-emerald-600'
                                  : 'bg-purple-600'
                              }`}
                            />
                            <span className="font-medium text-zinc-700">
                              {coachStageFilter === 'activacion' &&
                                'Etapa 1: Foam roller, movilidad de tobillo, cadera, tórax y activador del SNC.'}
                              {coachStageFilter === 'fuerza' &&
                                'Etapa 2: Pares de fuerza con descansos obligatorios de 2 min (120s) y RIR 1-2.'}
                              {coachStageFilter === 'hipertrofia' &&
                                'Etapa 3: Circuito de 6 ejercicios (2 dominante + 2 tracción/empuje + 2 rotaciones core), 3 vueltas, descanso 60s.'}
                              {coachStageFilter === 'intermitente' &&
                                'Etapa 3: Intermitente neuromuscular (10" de trabajo × 20" de micropausa en bloques).'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setNewExPhase(coachStageFilter);
                              setReplacingRoutineExId(null);
                              setShowExercisePickerModal(true);
                            }}
                            className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg whitespace-nowrap flex items-center justify-center gap-1 self-start sm:self-auto transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" /> Añadir a esta Etapa
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Exercise List for Active Day */}
                    <div className="space-y-4">
                      {displayedExercises.length === 0 ? (
                        <div className="p-6 text-center bg-zinc-50 rounded-2xl border border-zinc-200 text-zinc-500 text-xs font-medium">
                          No hay ejercicios asignados en esta etapa. Haz clic en "Elegir del Banco" o "+ Crear Ejercicio Propio" abajo para agregar.
                        </div>
                      ) : (
                        displayedExercises.map((re, exIdx) => {
                          const exData = exercises.find((e) => e.id === re.exerciseId);

                          return (
                            <div
                              key={re.id}
                              className="p-4 bg-white rounded-2xl border border-zinc-200 space-y-3 shadow-xs hover:border-zinc-300 transition-colors"
                            >
                              {/* Exercise Header */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-xl bg-zinc-100 text-zinc-800 font-black text-xs flex items-center justify-center flex-shrink-0 border border-zinc-200">
                                    {exIdx + 1}
                                  </span>
                                  <div>
                                    <h4 className="font-bold text-zinc-950 text-sm sm:text-base">
                                      {exData ? exData.name : 'Ejercicio'}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                      {exData && (
                                        <span className="text-orange-600 font-semibold">
                                          {exData.muscleGroup}
                                        </span>
                                      )}
                                      <span>•</span>
                                      <span>{exData?.equipment}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Video Preview, Replace & Order Controls */}
                                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto ml-10 sm:ml-0">
                                  {/* Direct Exercise Replacement Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplacingRoutineExId(re.id);
                                      setShowExercisePickerModal(true);
                                    }}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                    title="Reemplazar este ejercicio por otro (ej. Sentadillas) manteniendo series y progresiones"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5 text-violet-600" />
                                    <span>Reemplazar</span>
                                  </button>

                                  {re.phase === 'fuerza' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setProjectionExercise(re);
                                        setShowProjectionModal(true);
                                      }}
                                      className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                      title="Ver progresión a 4 semanas para este ejercicio (+5kg / Descarga / +10kg)"
                                    >
                                      <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                                      <span className="hidden sm:inline">Proyección 4 Sem</span>
                                    </button>
                                  )}

                                  {exData && (
                                    <button
                                      type="button"
                                      onClick={() => setVideoModalExercise(exData)}
                                      className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold transition-colors"
                                    >
                                      <Youtube className="w-3.5 h-3.5 text-red-600 fill-current" />
                                      Ver Video
                                    </button>
                                  )}

                                  <div className="flex items-center gap-1 border-l border-zinc-200 pl-2">
                                    <button
                                      type="button"
                                      disabled={exIdx === 0}
                                      onClick={() => handleMoveExercise(exIdx, 'up')}
                                      className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 rounded transition-colors"
                                      title="Subir"
                                    >
                                      <MoveUp className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={exIdx === displayedExercises.length - 1}
                                      onClick={() => handleMoveExercise(exIdx, 'down')}
                                      className="p-1 text-zinc-400 hover:text-zinc-800 disabled:opacity-30 rounded transition-colors"
                                      title="Bajar"
                                    >
                                      <MoveDown className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveExercise(re.id)}
                                      className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors ml-1"
                                      title="Quitar ejercicio"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Stage Selector & Pair Group Assignment */}
                              <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-600">Etapa:</span>
                                  <select
                                    value={re.phase || 'fuerza'}
                                    onChange={(e) => {
                                      const newPhase = e.target.value as
                                        | 'activacion'
                                        | 'fuerza'
                                        | 'hipertrofia'
                                        | 'intermitente';
                                      setDraftRoutine((prev) => ({
                                        ...prev,
                                        days: prev.days.map((d, dIdx) =>
                                          dIdx === activeDayIndex
                                            ? {
                                                ...d,
                                                exercises: d.exercises.map((x) =>
                                                  x.id === re.id ? { ...x, phase: newPhase } : x
                                                ),
                                              }
                                            : d
                                        ),
                                      }));
                                    }}
                                    className={`font-bold px-2 py-1 rounded-lg border text-xs focus:outline-none bg-white ${
                                      re.phase === 'activacion'
                                        ? 'text-orange-700 border-orange-300'
                                        : re.phase === 'fuerza'
                                        ? 'text-violet-700 border-violet-300'
                                        : re.phase === 'intermitente'
                                        ? 'text-emerald-700 border-emerald-300'
                                        : 'text-purple-700 border-purple-300'
                                    }`}
                                  >
                                    <option value="activacion">1) Activación</option>
                                    <option value="fuerza">2) Fuerza</option>
                                    <option value="hipertrofia">3) Hipertrofia</option>
                                    <option value="intermitente">3) Intermitente (10"x20")</option>
                                  </select>
                                </div>

                                {re.phase === 'fuerza' && (
                                  <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                                    <span className="text-zinc-500 text-[11px] whitespace-nowrap">
                                      Pareja:
                                    </span>
                                    <input
                                      type="text"
                                      value={re.pairGroup || ''}
                                      placeholder="Ej. Pareja 1 (Sentadilla - Remo)"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setDraftRoutine((prev) => ({
                                          ...prev,
                                          days: prev.days.map((d, dIdx) =>
                                            dIdx === activeDayIndex
                                              ? {
                                                  ...d,
                                                  exercises: d.exercises.map((x) =>
                                                    x.id === re.id ? { ...x, pairGroup: val } : x
                                                  ),
                                                }
                                              : d
                                          ),
                                        }));
                                      }}
                                      className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs text-zinc-800 focus:outline-none focus:border-orange-500 flex-1"
                                    />
                                  </div>
                                )}
                              </div>

                              {/* Coach custom instructions for this student */}
                              <div>
                                <input
                                  type="text"
                                  value={re.coachNotes || ''}
                                  placeholder="Indicaciones para el alumno (ej. Pausa de 1s abajo, no despegar codos...)"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setDraftRoutine((prev) => ({
                                      ...prev,
                                      days: prev.days.map((d, dIdx) =>
                                        dIdx === activeDayIndex
                                          ? {
                                              ...d,
                                              exercises: d.exercises.map((x) =>
                                                x.id === re.id ? { ...x, coachNotes: val } : x
                                              ),
                                            }
                                          : d
                                      ),
                                    }));
                                  }}
                                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-1.5 text-xs text-zinc-800 focus:outline-none focus:border-orange-500 placeholder:text-zinc-400"
                                />
                              </div>

                              {/* Sets Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
                                      <th className="py-1 px-1.5 w-10 text-center">Set</th>
                                      <th className="py-1 px-1.5 w-28">Tipo</th>
                                      <th className="py-1 px-1.5 w-24">Reps</th>
                                      <th className="py-1 px-1.5 w-24">Intensidad</th>
                                      <th className="py-1 px-1.5 w-20">Descanso</th>
                                      <th className="py-1 px-1.5 w-20">Kg Obj.</th>
                                      <th className="py-1 px-1.5 w-8"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100">
                                    {re.sets.map((set, sIdx) => (
                                      <tr key={set.id}>
                                        <td className="py-1.5 px-1.5 text-center font-bold text-zinc-500">
                                          {set.setNumber}
                                        </td>
                                        <td className="py-1.5 px-1.5">
                                          <select
                                            value={set.setType}
                                            onChange={(e) =>
                                              handleUpdateSet(re.id, sIdx, {
                                                setType: e.target.value as SetType,
                                              })
                                            }
                                            className="bg-white border border-zinc-300 rounded-lg px-2 py-1 text-xs text-zinc-800 focus:outline-none focus:border-orange-500"
                                          >
                                            <option value="top_set">Top Set (Pesada)</option>
                                            <option value="backoff">Backoff (-10%)</option>
                                            <option value="normal">Normal</option>
                                            <option value="warmup">Aproximación</option>
                                            <option value="dropset">Drop Set</option>
                                            <option value="failure">Al Fallo (RIR 0)</option>
                                          </select>
                                        </td>
                                        <td className="py-1.5 px-1.5">
                                          <input
                                            type="text"
                                            value={set.targetReps}
                                            onChange={(e) =>
                                              handleUpdateSet(re.id, sIdx, { targetReps: e.target.value })
                                            }
                                            placeholder="8-10"
                                            className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1 text-center font-bold text-zinc-950 focus:outline-none focus:border-orange-500"
                                          />
                                        </td>
                                        <td className="py-1.5 px-1.5">
                                          <input
                                            type="text"
                                            value={set.targetRirRpe}
                                            onChange={(e) =>
                                              handleUpdateSet(re.id, sIdx, {
                                                targetRirRpe: e.target.value,
                                              })
                                            }
                                            placeholder="RIR 1-2"
                                            className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1 text-center font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                                          />
                                        </td>
                                        <td className="py-1.5 px-1.5">
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="number"
                                              step={15}
                                              value={set.restSeconds}
                                              onChange={(e) =>
                                                handleUpdateSet(re.id, sIdx, {
                                                  restSeconds: parseInt(e.target.value, 10) || 60,
                                                })
                                              }
                                              className="w-full bg-white border border-zinc-300 rounded-lg px-1.5 py-1 text-center font-mono text-zinc-800 focus:outline-none focus:border-orange-500 font-bold"
                                            />
                                            <span className="text-[10px] text-zinc-500">s</span>
                                          </div>
                                        </td>
                                        <td className="py-1.5 px-1.5">
                                          <input
                                            type="number"
                                            step="2.5"
                                            value={set.targetWeight || ''}
                                            onChange={(e) =>
                                              handleUpdateSet(re.id, sIdx, {
                                                targetWeight: parseFloat(e.target.value) || 0,
                                              })
                                            }
                                            placeholder="0"
                                            className="w-full bg-white border border-zinc-300 rounded-lg px-2 py-1 text-center font-bold text-zinc-950 focus:outline-none focus:border-orange-500"
                                          />
                                        </td>
                                        <td className="py-1.5 px-1.5 text-center">
                                          <button
                                            onClick={() => handleRemoveSet(re.id, sIdx)}
                                            className="text-zinc-400 hover:text-red-600 transition-colors"
                                            title="Eliminar serie"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>

                              <button
                                onClick={() => handleAddSet(re.id)}
                                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 pt-1 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" /> Añadir Serie
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Add Exercise Actions: from bank or create custom with own video */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    setReplacingRoutineExId(null);
                    setShowExercisePickerModal(true);
                  }}
                  className="py-3 px-4 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-300 hover:border-orange-500 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Search className="w-4 h-4 text-orange-500" />
                  Elegir del Banco ({exercises.length} videos)
                </button>

                <button
                  onClick={() => {
                    setNewExName('');
                    setNewExYoutubeUrl('');
                    setNewExCoachCue('');
                    setShowCreateCustomExerciseModal(true);
                  }}
                  className="py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + Crear Ejercicio Propio con Video
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Methodology Audit & Weekly Volume Radar (1 column) */}
        <div className="space-y-4">
          {/* Methodology Real-time Audit */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                <BookOpen className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-950">
                Auditoría del Método
              </h3>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Tu modelo <span className="text-zinc-950 font-bold">"{methodology.philosophyTitle}"</span>{' '}
              establece estas pautas de volumen semanal para evitar sobreentrenamiento o subentrenamiento:
            </p>

            {/* Volume Progress Bars */}
            <div className="space-y-3 pt-2">
              {Object.entries(methodology.weeklyVolumeLimits || {}).map(([muscle, limitsObj]) => {
                const limits = limitsObj as { minSets: number; targetSets: number; maxSets: number };
                const currentSets = weeklyMuscleVolume[muscle] || 0;
                const isUnder = currentSets > 0 && currentSets < limits.minSets;
                const isOptimal = currentSets >= limits.minSets && currentSets <= limits.maxSets;
                const isOver = currentSets > limits.maxSets;

                const percent = Math.min(100, Math.round((currentSets / limits.maxSets) * 100));

                return (
                  <div key={muscle} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800">{muscle}</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span
                          className={`font-bold ${
                            isOptimal
                              ? 'text-orange-600'
                              : isOver
                              ? 'text-red-600'
                              : isUnder
                              ? 'text-amber-600'
                              : 'text-zinc-400'
                          }`}
                        >
                          {currentSets}
                        </span>
                        <span className="text-zinc-500">/ {limits.targetSets} obj</span>
                      </div>
                    </div>

                    <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOptimal
                            ? 'bg-orange-500'
                            : isOver
                            ? 'bg-red-500'
                            : isUnder
                            ? 'bg-amber-500'
                            : 'bg-zinc-300'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Coach Rules Checklist */}
            <div className="pt-3 border-t border-zinc-200 space-y-2">
              <span className="text-[11px] uppercase font-bold text-zinc-500 tracking-wider block">
                Reglas Activas del Entrenador:
              </span>
              <ul className="space-y-1 text-[11px] text-zinc-600">
                {methodology.rules.slice(0, 3).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-3xl bg-white border border-zinc-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2">
                {replacingRoutineExId ? (
                  <RefreshCw className="w-5 h-5 text-violet-600 animate-spin-reverse" />
                ) : (
                  <Youtube className="w-5 h-5 text-red-600" />
                )}
                <div>
                  <h3 className="text-base font-black text-zinc-950">
                    {replacingRoutineExId
                      ? 'Reemplazar Ejercicio en la Rutina'
                      : 'Seleccionar Ejercicio con Video de YouTube'}
                  </h3>
                  {replacingRoutineExId && (
                    <p className="text-xs text-violet-700 font-medium">
                      Elige el nuevo ejercicio (ej. Sentadillas). Se conservarán las series y cargas configuradas.
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowExercisePickerModal(false);
                  setReplacingRoutineExId(null);
                }}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Replacement Banner Notification */}
            {replacingRoutineExId && (
              <div className="px-5 py-3 bg-violet-50 border-b border-violet-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-violet-900 font-medium">
                  <Sparkles className="w-4 h-4 text-violet-600 flex-shrink-0" />
                  <span>
                    Sustitución en 1 clic: Busca y haz clic en <strong>"🔄 Reemplazar por este"</strong> para cambiar el ejercicio de forma instantánea.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReplacingRoutineExId(null)}
                  className="text-xs font-bold text-violet-700 hover:underline whitespace-nowrap"
                >
                  Cancelar Reemplazo
                </button>
              </div>
            )}

            {/* Quick banner to create custom exercise directly */}
            {!replacingRoutineExId && (
              <div className="px-5 py-3 bg-orange-50 border-b border-orange-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-xs text-orange-950 font-medium">
                    ¿Quieres un ejercicio nuevo o con tu propio video de YouTube?
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowExercisePickerModal(false);
                    setNewExName(pickerSearch.trim());
                    setNewExYoutubeUrl('');
                    setNewExCoachCue('');
                    setShowCreateCustomExerciseModal(true);
                  }}
                  className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear Ejercicio Propio
                </button>
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-4 border-b border-zinc-200 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar ejercicio por nombre (ej. Sentadillas, Remo, Peso Muerto)..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setPickerMuscle('todos')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                    pickerMuscle === 'todos'
                      ? 'bg-orange-500 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Todos
                </button>
                {[
                  'Pecho',
                  'Espalda',
                  'Cuádriceps',
                  'Isquiotibiales',
                  'Glúteos',
                  'Hombros',
                  'Bíceps',
                  'Tríceps',
                  'Core',
                  'Gemelos',
                ].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPickerMuscle(m)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                      pickerMuscle === m
                        ? 'bg-orange-500 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-zinc-100">
              {exercises
                .filter((ex) => {
                  const matchS = ex.name.toLowerCase().includes(pickerSearch.toLowerCase());
                  const matchM = pickerMuscle === 'todos' || ex.muscleGroup === pickerMuscle;
                  return matchS && matchM;
                })
                .map((ex) => (
                  <div
                    key={ex.id}
                    className="pt-2 pb-2 flex items-center justify-between gap-3 hover:bg-zinc-50 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getYouTubeThumbnail(ex.youtubeVideoId)}
                        alt={ex.name}
                        className="w-16 h-10 object-cover rounded-lg flex-shrink-0 border border-zinc-200"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-zinc-950 text-xs sm:text-sm truncate">
                          {ex.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-0.5">
                          <span className="text-orange-600 font-semibold">{ex.muscleGroup}</span>
                          <span>•</span>
                          <span>{ex.equipment}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setVideoModalExercise(ex)}
                        className="p-2 text-zinc-500 hover:text-red-600 transition-colors"
                        title="Ver video en YouTube"
                      >
                        <Youtube className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleAddExerciseToDay(ex.id)}
                        className={`px-3 py-1.5 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                          replacingRoutineExId
                            ? 'bg-violet-600 hover:bg-violet-700 shadow-xs'
                            : 'bg-orange-500 hover:bg-orange-600 shadow-xs'
                        }`}
                      >
                        {replacingRoutineExId ? (
                          <>
                            <RefreshCw className="w-3 h-3" />
                            <span>Reemplazar por este</span>
                          </>
                        ) : (
                          '+ Añadir a la Rutina'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Creating Custom Exercise with Video On-the-fly */}
      {showCreateCustomExerciseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-zinc-300 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
                  <Plus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-950">
                    Crear Nuevo Ejercicio con Video
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Se guardará en el banco de ejercicios y se añadirá de inmediato al día activo
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateCustomExerciseModal(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCustomExercise} className="p-6 overflow-y-auto space-y-4">
              {/* Exercise Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Sentadilla Búlgara con Mancuernas, Remo en Anillas..."
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>

              {/* YouTube Video URL with Live Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Youtube className="w-4 h-4 text-red-600 fill-current" />
                    Enlace de YouTube o YouTube Shorts *
                  </label>
                  {newExName.trim() && (
                    <button
                      type="button"
                      onClick={() =>
                        window.open(getYouTubeSearchUrl(newExName.trim()), '_blank')
                      }
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors"
                    >
                      <span>Buscar ideas en YouTube</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="https://www.youtube.com/shorts/... o https://youtu.be/..."
                  value={newExYoutubeUrl}
                  onChange={(e) => setNewExYoutubeUrl(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-mono"
                />

                {/* Video Detection & Live Preview */}
                {(() => {
                  const extractedId = extractYouTubeId(newExYoutubeUrl);
                  const isShort =
                    newExYoutubeUrl.includes('/shorts/') || Boolean(newExYoutubeUrl.match(/shorts/i));

                  if (extractedId) {
                    return (
                      <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-20 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-zinc-200">
                            <img
                              src={getYouTubeThumbnail(extractedId)}
                              alt="Vista previa"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play className="w-4 h-4 text-white fill-current" />
                            </div>
                          </div>
                          <div className="min-w-0 text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isShort
                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isShort ? '⚡ YouTube Shorts' : '▶ Video de YouTube'}
                              </span>
                              <span className="text-zinc-500 font-mono text-[10px]">
                                ID: {extractedId}
                              </span>
                            </div>
                            <p className="text-zinc-600 text-[11px] truncate mt-0.5 font-medium">
                              Video listo para reproducirse en la app del alumno
                            </p>
                          </div>
                        </div>

                        <a
                          href={`https://www.youtube.com/watch?v=${extractedId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-zinc-500 hover:text-zinc-900 rounded-lg hover:bg-zinc-200 transition-colors flex-shrink-0"
                          title="Probar en YouTube"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    );
                  }

                  return (
                    <p className="text-[11px] text-zinc-500">
                      💡 Tip: Pega el enlace que copias de la app de YouTube o el navegador. Si no tienes uno a mano, se asignará un video de técnica demostrativo por defecto.
                    </p>
                  );
                })()}
              </div>

              {/* Grid: Pattern, Equipment, Muscle, Phase */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Patrón Funcional (100% Pesos Libres)
                  </label>
                  <select
                    value={newExPattern}
                    onChange={(e) => setNewExPattern(e.target.value as FunctionalPattern)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    {ALL_PATTERNS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Equipamiento
                  </label>
                  <select
                    value={newExEquipment}
                    onChange={(e) => setNewExEquipment(e.target.value as Equipment)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    {ALL_EQUIPMENT.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Grupo Muscular Principal
                  </label>
                  <select
                    value={newExMuscle}
                    onChange={(e) => setNewExMuscle(e.target.value as MuscleGroup)}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-medium"
                  >
                    {ALL_MUSCLES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Fase en la Rutina
                  </label>
                  <select
                    value={newExPhase}
                    onChange={(e) => {
                      const phase = e.target.value as 'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente';
                      setNewExPhase(phase);
                      if (phase === 'fuerza') {
                        setNewExRestSeconds(120);
                        setNewExTargetReps('6');
                      } else if (phase === 'hipertrofia') {
                        setNewExRestSeconds(60);
                        setNewExTargetReps('10-12');
                      } else if (phase === 'activacion') {
                        setNewExRestSeconds(30);
                        setNewExTargetReps('10 oscilaciones');
                      } else {
                        setNewExRestSeconds(20);
                        setNewExTargetReps('10" max');
                      }
                    }}
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-950 focus:outline-none focus:border-orange-500 font-bold"
                  >
                    <option value="fuerza">Fase 2: Fuerza (Pausa obligatoria 120s)</option>
                    <option value="hipertrofia">Fase 3: Hipertrofia (Circuito, pausa ≤ 60s)</option>
                    <option value="activacion">Fase 1: Activación y Movilidad Funcional</option>
                    <option value="intermitente">Fase 3: Intermitente Neuromuscular (10"×20")</option>
                  </select>
                </div>
              </div>

              {/* Initial Sets, Reps & Rest Configuration */}
              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-2">
                <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider block">
                  Configuración Inicial en la Rutina:
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1 font-semibold">Series</label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={newExSetsCount}
                      onChange={(e) => setNewExSetsCount(parseInt(e.target.value, 10) || 3)}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-2.5 py-1.5 text-center text-xs font-bold text-zinc-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1 font-semibold">Reps Obj.</label>
                    <input
                      type="text"
                      value={newExTargetReps}
                      onChange={(e) => setNewExTargetReps(e.target.value)}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-2.5 py-1.5 text-center text-xs font-bold text-zinc-950 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-500 mb-1 font-semibold">Pausa (seg)</label>
                    <input
                      type="number"
                      step={15}
                      value={newExRestSeconds}
                      onChange={(e) => setNewExRestSeconds(parseInt(e.target.value, 10) || 60)}
                      className="w-full bg-white border border-zinc-300 rounded-xl px-2.5 py-1.5 text-center text-xs font-mono font-bold text-orange-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Coach Cue / Instructions */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Indicación Técnica para el Alumno (Cue)
                </label>
                <input
                  type="text"
                  placeholder="ej. Bajar en 3 segundos, rodillas hacia afuera, activar abdomen."
                  value={newExCoachCue}
                  onChange={(e) => setNewExCoachCue(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-xl px-3.5 py-2 text-xs text-zinc-950 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowCreateCustomExerciseModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Crear y Agregar a la Rutina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-Week Load Progression Projection Modal */}
      {showProjectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-900 max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50/70">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-orange-100 text-orange-600">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-zinc-950">
                    Proyección de Cargas del Mesociclo (4 Semanas)
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {projectionExercise
                      ? `Progresión para: ${exercises.find((e) => e.id === projectionExercise.exerciseId)?.name || 'Ejercicio'}`
                      : 'Modelo de sobrecarga progresiva y aprendizaje motor'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProjectionModal(false);
                  setProjectionExercise(null);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Method explanation banner */}
              <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-xl text-xs text-zinc-800 space-y-1">
                <div className="font-bold text-orange-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  <span>Automatización del Método:</span>
                </div>
                <p className="text-zinc-700">
                  Los ejercicios se mantienen todo el mes para favorecer el <strong>aprendizaje motor</strong>. Cuando planificas la Semana 1 o el alumno carga sus kg reales en tiempo real, las semanas 2, 3 y 4 se autoprograman siguiendo tus reglas.
                </p>
              </div>

              {/* 4 Weeks Grid */}
              {(() => {
                const baseWeight =
                  projectionExercise?.sets[0]?.targetWeight || 50;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Semana 1 */}
                    <div className="p-4 rounded-xl border border-zinc-200 bg-white space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-zinc-500">
                          Semana 1
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
                          Carga Base
                        </span>
                      </div>
                      <div className="text-2xl font-black text-zinc-950 font-mono">
                        {baseWeight} kg
                      </div>
                      <div className="text-xs font-bold text-orange-600">
                        6 reps @ RIR 1-2
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        3 series fijas • Pausas de 2 minutos
                      </div>
                    </div>

                    {/* Semana 2 */}
                    <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/40 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-orange-700">
                          Semana 2
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                          +5 kg adicional
                        </span>
                      </div>
                      <div className="text-2xl font-black text-orange-950 font-mono">
                        {baseWeight + 5} kg
                      </div>
                      <div className="text-xs font-bold text-orange-600">
                        4 reps @ RIR 1-2
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        3 series fijas • Pausas de 2 minutos
                      </div>
                    </div>

                    {/* Semana 3 */}
                    <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-blue-700">
                          Semana 3
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                          Descarga
                        </span>
                      </div>
                      <div className="text-2xl font-black text-blue-950 font-mono">
                        {baseWeight} kg
                      </div>
                      <div className="text-xs font-bold text-blue-600">
                        6 reps @ RIR 1-2
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Volvemos a 6 reps con el peso base para asimilar fatiga
                      </div>
                    </div>

                    {/* Semana 4 */}
                    <div className="p-4 rounded-xl border border-violet-200 bg-violet-50/40 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase text-violet-700">
                          Semana 4
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                          +10 kg (+5kg a Sem 2)
                        </span>
                      </div>
                      <div className="text-2xl font-black text-violet-950 font-mono">
                        {baseWeight + 10} kg
                      </div>
                      <div className="text-xs font-bold text-violet-600">
                        3 reps @ RIR 1-2
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        Pico de fuerza máxima del mesociclo
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Hipertrofia & Intermitente Progression Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                  <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    <span>3) Hipertrofia (Circuito 6 ejercicios):</span>
                  </div>
                  <div className="text-zinc-600 space-y-0.5 text-[11px]">
                    <div>• <strong>Sem 1:</strong> 10 reps (3 vueltas, pausa &lt;1 min)</div>
                    <div>• <strong>Sem 2:</strong> 12 reps</div>
                    <div>• <strong>Sem 3:</strong> 8 reps (descarga)</div>
                    <div>• <strong>Sem 4:</strong> 15 reps (pico de volumen)</div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs space-y-1.5">
                  <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>3) Intermitente Neuromuscular (10" × 20"):</span>
                  </div>
                  <div className="text-zinc-600 space-y-0.5 text-[11px]">
                    <div>• <strong>Sem 1:</strong> 2 bloques de 7 minutos</div>
                    <div>• <strong>Sem 2:</strong> 2 bloques de 10 minutos</div>
                    <div>• <strong>Sem 3:</strong> 2 bloques de 7 minutos</div>
                    <div>• <strong>Sem 4:</strong> 1 bloque de 15 minutos</div>
                  </div>
                </div>
              </div>

              {/* Where to view info */}
              <div className="p-3 bg-zinc-100 rounded-xl text-xs text-zinc-700">
                <span className="font-bold text-zinc-950">¿Dónde lo ve el alumno? </span>
                En su portal móvil tiene las pestañas <strong>Semana 1, 2, 3 y 4</strong> arriba de cada día y la <strong>Tabla de Control (kg × reps)</strong> para comparar todo el mes en una sola pantalla.
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50/70 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowProjectionModal(false);
                  setProjectionExercise(null);
                }}
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
