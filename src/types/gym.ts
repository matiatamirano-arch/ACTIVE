export type MuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Cuádriceps'
  | 'Isquiotibiales'
  | 'Glúteos'
  | 'Hombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Core'
  | 'Gemelos'
  | 'Movilidad';

export type FunctionalPattern =
  | 'Rodilla Dominante'
  | 'Cadera Dominante'
  | 'Empuje'
  | 'Tracción'
  | 'Zona Media y Rotaciones'
  | 'Activación y Movilidad'
  | 'Metabólico / Intermitente';

export type Equipment =
  | 'Barra'
  | 'Mancuerna'
  | 'Kettlebell'
  | 'Balón Medicinal'
  | 'Peso Corporal'
  | 'Banda Elástica'
  | 'Foam Roller'
  | 'Polea'
  | 'Máquina';

export type SetType =
  | 'normal'
  | 'top_set'
  | 'backoff'
  | 'warmup'
  | 'dropset'
  | 'rest_pause'
  | 'failure';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  functionalPattern?: FunctionalPattern;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  youtubeUrl: string;
  youtubeVideoId: string;
  isShorts?: boolean;
  cues: string[];
  executionSteps?: string[];
  tipsForCoach?: string;
  isCustom?: boolean;
  defaultRestSeconds?: number;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  setType: SetType;
  targetReps: string; // e.g. "6", "4", "3" or "10-12"
  targetRirRpe: string; // e.g. "RIR 1-2"
  restSeconds: number; // e.g. 120 (2 min estricto en fuerza) o 60 (1 min en hipertrofia)
  targetWeight?: number; // en kg (base semana 1)
  tempo?: string;
  notes?: string;
}

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  phase?: 'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente';
  pairGroup?: string; // e.g. "Pareja 1 (Sentadilla - Remo cerrado)"
  circuitRound?: number;
  sets: WorkoutSet[];
  coachNotes?: string;
  order: number;
}

export interface RoutineDay {
  id: string;
  dayName: string;
  stimulusType?: 'rodilla_traccion' | 'cadera_empuje' | 'funcional_mixto';
  dayNumber: number;
  exercises: RoutineExercise[];
  focusMuscles: MuscleGroup[];
  targetDurationMinutes: number;
}

export type SplitType =
  | 'funcional_fuerza_hipertrofia'
  | 'funcional_descenso_peso'
  | 'push_pull_legs'
  | 'upper_lower'
  | 'full_body'
  | 'weider'
  | 'custom';

export type MethodologyType =
  | 'fuerza_hipertrofia'
  | 'descenso_peso'
  | 'personalizado';

export interface Routine {
  id: string;
  name: string;
  description: string;
  studentId?: string;
  methodologyType?: MethodologyType;
  isTemplate?: boolean;
  splitType: SplitType;
  difficulty: 'Principiante' | 'Intermedio' | 'Avanzado';
  daysCount: number;
  days: RoutineDay[];
  currentWeek?: 1 | 2 | 3 | 4;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningMethodology {
  coachName: string;
  gymName: string;
  gymTagline: string;
  isologoUrl?: string;
  philosophyTitle: string;
  philosophyDescription: string;
  intensityMetric: 'RIR' | 'RPE' | '% 1RM';
  defaultIntensityTarget: string; // e.g. "RIR 1-2"
  defaultRestFuerzaSeconds: number; // 120 (2 min estrictos)
  defaultRestHipertrofiaSeconds: number; // 60 (máx 1 min)
  defaultRestHeavySeconds?: number;
  defaultRestIsolationSeconds?: number;
  weeklyVolumeLimits?: Record<string, { minSets: number; targetSets: number; maxSets: number }>;
  warmUpFormula?: {
    sets: { percent: number; reps: number; label: string }[];
  };
  progressionFuerza: {
    week1: { reps: 6; deltaKg: 0; rir: 'RIR 1-2'; label: string };
    week2: { reps: 4; deltaKg: 5; rir: 'RIR 1-2'; label: string };
    week3: { reps: 6; deltaKg: 0; rir: 'RIR 1-2'; label: string };
    week4: { reps: 3; deltaKg: 10; rir: 'RIR 1-2'; label: string };
  };
  progressionHipertrofia: {
    week1: { reps: 10; label: string };
    week2: { reps: 12; label: string };
    week3: { reps: 8; label: string };
    week4: { reps: 15; label: string };
  };
  progressionIntermitente: {
    workSeconds: 10;
    restSeconds: 20;
    week1: { blocks: 2; minutesPerBlock: 7; label: string };
    week2: { blocks: 2; minutesPerBlock: 10; label: string };
    week3: { blocks: 2; minutesPerBlock: 7; label: string };
    week4: { blocks: 1; minutesPerBlock: 15; label: string };
  };
  rules: string[];
}

export interface Student {
  id: string;
  slug: string;
  name: string;
  email: string;
  phone: string;
  pinCode: string;
  avatarUrl: string;
  goal:
    | 'Fuerza & Hipertrofia'
    | 'Descenso de Peso'
    | 'Hipertrofia'
    | 'Fuerza Máxima'
    | 'Pérdida de Grasa'
    | 'Recomposición'
    | 'Rendimiento Funcional';
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  trainingDaysPerWeek: number;
  currentProgramWeek?: 1 | 2 | 3 | 4;
  injuriesOrLimitations: string;
  coachNotes: string;
  activeRoutineId: string;
  joinDate: string;
}

export interface SetLog {
  setNumber: number;
  targetWeight?: number;
  targetReps: string;
  actualWeight: number;
  actualReps: number;
  actualRir?: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  exerciseName: string;
  phase?: 'activacion' | 'fuerza' | 'hipertrofia' | 'intermitente';
  sets: SetLog[];
  notes?: string;
}

export interface WorkoutSessionLog {
  id: string;
  studentId: string;
  routineId: string;
  routineName: string;
  dayId: string;
  dayName: string;
  programWeek?: 1 | 2 | 3 | 4;
  date: string; // ISO date
  durationMinutes: number;
  completedExercises: ExerciseLog[];
  studentRating?: number; // 1-5
  feedbackToCoach?: string;
  totalVolumeKg: number;
}
