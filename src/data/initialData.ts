import { PlanningMethodology, Routine, Student, WorkoutSessionLog } from '../types/gym';

export const DEFAULT_METHODOLOGY: PlanningMethodology = {
  coachName: 'Coach Matías Altamirano',
  gymName: 'ACTIVE FUNCTIONAL STUDIO',
  gymTagline: 'No utilizamos máquinas, no construimos cuerpos que se les parezcan. Entrenamos sonrisas.',
  philosophyTitle: 'Metodología Active Functional: 100% Pesos Libres & Movimiento',
  philosophyDescription:
    'Simplemente entrenamos personas. Las acompañamos a mejorar su calidad de vida a través de la actividad física y el movimiento humano. Todos los ejercicios se realizan con pesos libres (barras, mancuernas, kettlebells, balón medicinal y peso corporal). Sin máquinas guiadas. Entrenar es una excusa para divertirnos!',
  intensityMetric: 'RIR',
  defaultIntensityTarget: 'RIR 1-2',
  defaultRestFuerzaSeconds: 120, // 2 minutos estrictos
  defaultRestHipertrofiaSeconds: 60, // máx 1 minuto
  defaultRestHeavySeconds: 120,
  defaultRestIsolationSeconds: 60,
  warmUpFormula: {
    sets: [
      { percent: 40, reps: 8, label: 'Aproximación 1 (Muy ligero, entrar en calor)' },
      { percent: 60, reps: 5, label: 'Aproximación 2 (Activación neural)' },
      { percent: 80, reps: 3, label: 'Aproximación 3 (Calibración)' },
      { percent: 90, reps: 1, label: 'Aproximación 4 (Toma de contacto antes de serie efectiva)' },
    ],
  },
  weeklyVolumeLimits: {
    Pecho: { minSets: 8, targetSets: 12, maxSets: 16 },
    Espalda: { minSets: 10, targetSets: 14, maxSets: 18 },
    Cuádriceps: { minSets: 10, targetSets: 14, maxSets: 18 },
    Isquiotibiales: { minSets: 8, targetSets: 12, maxSets: 16 },
    Glúteos: { minSets: 8, targetSets: 12, maxSets: 16 },
    Hombros: { minSets: 8, targetSets: 12, maxSets: 16 },
    Bíceps: { minSets: 6, targetSets: 10, maxSets: 14 },
    Tríceps: { minSets: 6, targetSets: 10, maxSets: 14 },
    Core: { minSets: 8, targetSets: 12, maxSets: 16 },
    Gemelos: { minSets: 6, targetSets: 8, maxSets: 12 },
    Movilidad: { minSets: 4, targetSets: 8, maxSets: 12 },
  },
  progressionFuerza: {
    week1: { reps: 6, deltaKg: 0, rir: 'RIR 1-2', label: 'Semana 1: Carga Base (6 reps @ RIR 1-2)' },
    week2: { reps: 4, deltaKg: 5, rir: 'RIR 1-2', label: 'Semana 2: Carga Máxima (4 reps + 5kg @ RIR 1-2)' },
    week3: { reps: 6, deltaKg: 0, rir: 'RIR 1-2', label: 'Semana 3: Descarga Activa (6 reps peso base)' },
    week4: { reps: 3, deltaKg: 10, rir: 'RIR 1-2', label: 'Semana 4: Pico de Fuerza (3 reps + 5kg de sem 2)' },
  },
  progressionHipertrofia: {
    week1: { reps: 10, label: 'Semana 1: 10 reps (3 vueltas)' },
    week2: { reps: 12, label: 'Semana 2: 12 reps (sobrecarga)' },
    week3: { reps: 8, label: 'Semana 3: 8 reps (descarga)' },
    week4: { reps: 15, label: 'Semana 4: 15 reps (volumen máximo)' },
  },
  progressionIntermitente: {
    workSeconds: 10,
    restSeconds: 20,
    week1: { blocks: 2, minutesPerBlock: 7, label: 'Semana 1: 2 bloques de 7 min (10" x 20")' },
    week2: { blocks: 2, minutesPerBlock: 10, label: 'Semana 2: 2 bloques de 10 min (10" x 20")' },
    week3: { blocks: 2, minutesPerBlock: 7, label: 'Semana 3: 2 bloques de 7 min (descarga)' },
    week4: { blocks: 1, minutesPerBlock: 15, label: 'Semana 4: 1 bloque de 15 min (reto final)' },
  },
  rules: [
    'No utilizamos máquinas: todos los ejercicios son con pesos libres para estimular estabilizadores.',
    'Pausas de Fuerza obligatorias: 2 minutos (120s) exactos para recuperación neural completa.',
    'Fase de Activación obligatoria: Foam roller + movilidad de tobillo, cadera, tórax + activador SNC.',
    'Los ejercicios se mantienen todo el mes por aprendizaje motor; solo varían las cargas y reps según la semana.',
    'Circuito de Hipertrofia: 3 vueltas de 6 ejercicios con pausas de no más de 1 minuto.',
    'En Descenso de Peso: Intermitente Neuromuscular 10" trabajo x 20" descanso en bloques semanales (7m, 10m, 15m).',
  ],
};

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'student-1',
    slug: 'lucas-benitez',
    name: 'Lucas Benítez',
    email: 'lucas.benitez@gmail.com',
    phone: '+54 9 11 4521-8932',
    pinCode: '1234',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    goal: 'Fuerza & Hipertrofia',
    level: 'Intermedio',
    trainingDaysPerWeek: 2,
    currentProgramWeek: 2,
    injuriesOrLimitations: 'Cuidar valgo de rodilla en sentadilla.',
    coachNotes: 'Semana 2 en curso: Subió +5kg en Sentadilla (85kg) y Remo (75kg) a 4 reps con RIR 1-2 impecable.',
    activeRoutineId: 'routine-active-fuerza-4sem',
    joinDate: '2026-10-01',
  },
  {
    id: 'student-2',
    slug: 'camila-rossi',
    name: 'Camila Rossi',
    email: 'cami.rossi@outlook.com',
    phone: '+54 9 11 6789-2211',
    pinCode: '2468',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    goal: 'Descenso de Peso',
    level: 'Intermedio',
    trainingDaysPerWeek: 2,
    currentProgramWeek: 1,
    injuriesOrLimitations: 'Ninguna. Gran capacidad de trabajo intermitente.',
    coachNotes: 'Método Descenso de Peso: 1 pareja de fuerza + Intermitente neuromuscular 10" x 20" (2 bloques de 7 min).',
    activeRoutineId: 'routine-active-descenso-peso',
    joinDate: '2026-10-10',
  },
  {
    id: 'student-3',
    slug: 'marcos-gimenez',
    name: 'Marcos Giménez',
    email: 'marcos.gimenez99@gmail.com',
    phone: '+54 9 11 9844-3321',
    pinCode: '3344',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    goal: 'Rendimiento Funcional',
    level: 'Principiante',
    trainingDaysPerWeek: 2,
    currentProgramWeek: 3,
    injuriesOrLimitations: 'Molestia lumbar leve previa: enfatizar activación de cadera y bisagra neutra.',
    coachNotes: 'Semana 3 de descarga activa. Foco en calidad técnica y rotaciones de zona media.',
    activeRoutineId: 'routine-active-fuerza-4sem',
    joinDate: '2026-10-15',
  },
];

// Helper to create the standard 3 sets for a strength exercise
const createStrengthSets = (baseWeight: number, baseReps: string = '6', rir: string = 'RIR 1-2') => [
  { id: `s-${Math.random()}-1`, setNumber: 1, setType: 'normal' as const, targetReps: baseReps, targetRirRpe: rir, restSeconds: 120, targetWeight: baseWeight, tempo: '3-0-1-0' },
  { id: `s-${Math.random()}-2`, setNumber: 2, setType: 'normal' as const, targetReps: baseReps, targetRirRpe: rir, restSeconds: 120, targetWeight: baseWeight, tempo: '3-0-1-0' },
  { id: `s-${Math.random()}-3`, setNumber: 3, setType: 'normal' as const, targetReps: baseReps, targetRirRpe: rir, restSeconds: 120, targetWeight: baseWeight, tempo: '3-0-1-0' },
];

// Helper to create 3 circuit sets for hypertrophy
const createCircuitSets = (reps: string = '10') => [
  { id: `c-${Math.random()}-1`, setNumber: 1, setType: 'normal' as const, targetReps: reps, targetRirRpe: 'RIR 1', restSeconds: 60, targetWeight: 16 },
  { id: `c-${Math.random()}-2`, setNumber: 2, setType: 'normal' as const, targetReps: reps, targetRirRpe: 'RIR 1', restSeconds: 60, targetWeight: 16 },
  { id: `c-${Math.random()}-3`, setNumber: 3, setType: 'normal' as const, targetReps: reps, targetRirRpe: 'RIR 0-1', restSeconds: 60, targetWeight: 16 },
];

export const INITIAL_ROUTINES: Routine[] = [
  // -------------------------------------------------------------
  // MÉTODO 1: FUERZA & HIPERTROFIA FUNCIONAL (4 SEMANAS)
  // -------------------------------------------------------------
  {
    id: 'routine-active-fuerza-4sem',
    name: 'Método Fuerza & Hipertrofia Funcional (4 Semanas)',
    description:
      'Planificación oficial Active Functional Studio. 2 estímulos semanales con progresión mesociclo de 4 semanas: Sem 1 (6 reps) → Sem 2 (+5kg, 4 reps) → Sem 3 (Descarga, 6 reps) → Sem 4 (+10kg, 3 reps). Pausas de 2 min.',
    methodologyType: 'fuerza_hipertrofia',
    splitType: 'funcional_fuerza_hipertrofia',
    difficulty: 'Intermedio',
    daysCount: 2,
    currentWeek: 2,
    createdAt: '2026-10-01',
    updatedAt: '2026-10-28',
    days: [
      {
        id: 'day-fuerza-1',
        dayNumber: 1,
        dayName: 'Estímulo 1: Rodilla Dominante & Tracciones',
        stimulusType: 'rodilla_traccion',
        focusMuscles: ['Cuádriceps', 'Espalda', 'Core'],
        targetDurationMinutes: 65,
        exercises: [
          // FASE 1: ACTIVACIÓN
          { id: 're-a1', exerciseId: 'act-foam-roller', phase: 'activacion', order: 1, sets: [{ id: 's-a1', setNumber: 1, setType: 'normal', targetReps: '3-4 min', targetRirRpe: 'Liberación', restSeconds: 0 }] },
          { id: 're-a2', exerciseId: 'act-mov-tobillo', phase: 'activacion', order: 2, sets: [{ id: 's-a2', setNumber: 1, setType: 'normal', targetReps: '10 osc/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-a3', exerciseId: 'act-mov-cadera', phase: 'activacion', order: 3, sets: [{ id: 's-a3', setNumber: 1, setType: 'normal', targetReps: '8 rot/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-a4', exerciseId: 'act-mov-torax', phase: 'activacion', order: 4, sets: [{ id: 's-a4', setNumber: 1, setType: 'normal', targetReps: '8 rot/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-a5', exerciseId: 'act-snc-pogo', phase: 'activacion', order: 5, sets: [{ id: 's-a5', setNumber: 1, setType: 'normal', targetReps: '3 x 15 seg', targetRirRpe: 'Reactivación', restSeconds: 30 }] },

          // FASE 2: BLOQUE DE FUERZA (PAREJA 1 & 2 - 3 SERIES, 2 MIN DESCANSO)
          { id: 're-f1', exerciseId: 'fz-sentadilla-barra', phase: 'fuerza', pairGroup: 'Pareja 1 (Sentadilla - Remo cerrado)', order: 6, coachNotes: 'Semana 1 base: 80kg x 6. Semana 2 (+5kg): 85kg x 4 reps @ RIR 1-2. Pausa 2 min estricta.', sets: createStrengthSets(80, '6') },
          { id: 're-f2', exerciseId: 'fz-remo-cerrado-barra', phase: 'fuerza', pairGroup: 'Pareja 1 (Sentadilla - Remo cerrado)', order: 7, coachNotes: 'Semana 1 base: 70kg x 6. Semana 2 (+5kg): 75kg x 4 reps. Pausa 2 min estricta.', sets: createStrengthSets(70, '6') },
          { id: 're-f3', exerciseId: 'fz-estocadas-mancuerna', phase: 'fuerza', pairGroup: 'Pareja 2 (Estocadas - Dominadas/Remo mentón)', order: 8, coachNotes: '3 series de 6 reps con mancuernas de 20kg por pierna.', sets: createStrengthSets(20, '6') },
          { id: 're-f4', exerciseId: 'fz-remo-menton-dominadas', phase: 'fuerza', pairGroup: 'Pareja 2 (Estocadas - Dominadas/Remo mentón)', order: 9, coachNotes: 'Dominadas estrictas o remo al mentón con barra. 3 series.', sets: createStrengthSets(0, '6') },

          // FASE 3: CIRCUITO DE HIPERTROFIA (6 EJERCICIOS, 3 VUELTAS, MÁX 1 MIN DESCANSO)
          { id: 're-h1', exerciseId: 'hip-sentadilla-bulgara', phase: 'hipertrofia', circuitRound: 1, order: 10, coachNotes: 'Rodilla Dominante 1 (10 reps sem 1, 12 sem 2, 8 sem 3, 15 sem 4)', sets: createCircuitSets('10') },
          { id: 're-h2', exerciseId: 'hip-step-up-cajon', phase: 'hipertrofia', circuitRound: 1, order: 11, coachNotes: 'Rodilla Dominante 2', sets: createCircuitSets('10') },
          { id: 're-h3', exerciseId: 'hip-remo-unilateral-mancuerna', phase: 'hipertrofia', circuitRound: 1, order: 12, coachNotes: 'Tracción 1 con mancuerna de 22kg', sets: createCircuitSets('10') },
          { id: 're-h4', exerciseId: 'fz-remo-menton-dominadas', phase: 'hipertrofia', circuitRound: 1, order: 13, coachNotes: 'Tracción 2 asistida con banda', sets: createCircuitSets('10') },
          { id: 're-h5', exerciseId: 'hip-pallof-press-banda', phase: 'hipertrofia', circuitRound: 1, order: 14, coachNotes: 'Zona Media / Antirrotación 1', sets: createCircuitSets('10') },
          { id: 're-h6', exerciseId: 'hip-russian-twist-kettlebell', phase: 'hipertrofia', circuitRound: 1, order: 15, coachNotes: 'Zona Media / Rotación 2', sets: createCircuitSets('10') },
        ],
      },
      {
        id: 'day-fuerza-2',
        dayNumber: 2,
        dayName: 'Estímulo 2: Cadera Dominante & Empujes',
        stimulusType: 'cadera_empuje',
        focusMuscles: ['Isquiotibiales', 'Glúteos', 'Pecho', 'Hombros', 'Core'],
        targetDurationMinutes: 65,
        exercises: [
          // FASE 1: ACTIVACIÓN
          { id: 're-d2-a1', exerciseId: 'act-foam-roller', phase: 'activacion', order: 1, sets: [{ id: 's2-a1', setNumber: 1, setType: 'normal', targetReps: '3-4 min', targetRirRpe: 'Liberación', restSeconds: 0 }] },
          { id: 're-d2-a2', exerciseId: 'act-mov-tobillo', phase: 'activacion', order: 2, sets: [{ id: 's2-a2', setNumber: 1, setType: 'normal', targetReps: '10 osc/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-d2-a3', exerciseId: 'act-mov-cadera', phase: 'activacion', order: 3, sets: [{ id: 's2-a3', setNumber: 1, setType: 'normal', targetReps: '8 rot/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-d2-a4', exerciseId: 'act-mov-torax', phase: 'activacion', order: 4, sets: [{ id: 's2-a4', setNumber: 1, setType: 'normal', targetReps: '8 rot/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-d2-a5', exerciseId: 'act-snc-pogo', phase: 'activacion', order: 5, sets: [{ id: 's2-a5', setNumber: 1, setType: 'normal', targetReps: '3 x 15 seg', targetRirRpe: 'Reactivación', restSeconds: 30 }] },

          // FASE 2: BLOQUE DE FUERZA (PAREJA 1 & 2 - 3 SERIES, 2 MIN DESCANSO)
          { id: 're-d2-f1', exerciseId: 'fz-peso-muerto-barra', phase: 'fuerza', pairGroup: 'Pareja 1 (Peso Muerto - Press Banca)', order: 6, coachNotes: 'Semana 1 base: 100kg x 6. Semana 2 (+5kg): 105kg x 4 reps. Pausa 2 min estricta.', sets: createStrengthSets(100, '6') },
          { id: 're-d2-f2', exerciseId: 'fz-press-banca-barra', phase: 'fuerza', pairGroup: 'Pareja 1 (Peso Muerto - Press Banca)', order: 7, coachNotes: 'Semana 1 base: 75kg x 6. Semana 2 (+5kg): 80kg x 4 reps. Pausa 2 min estricta.', sets: createStrengthSets(75, '6') },
          { id: 're-d2-f3', exerciseId: 'fz-hip-thrust-barra', phase: 'fuerza', pairGroup: 'Pareja 2 (Hip Thrust - Press Militar)', order: 8, coachNotes: 'Semana 1 base: 110kg x 6. Semana 2 (+5kg): 115kg x 4 reps.', sets: createStrengthSets(110, '6') },
          { id: 're-d2-f4', exerciseId: 'fz-press-militar-barra', phase: 'fuerza', pairGroup: 'Pareja 2 (Hip Thrust - Press Militar)', order: 9, coachNotes: 'Semana 1 base: 45kg x 6. Semana 2 (+5kg): 50kg x 4 reps.', sets: createStrengthSets(45, '6') },

          // FASE 3: CIRCUITO DE HIPERTROFIA (6 EJERCICIOS, 3 VUELTAS)
          { id: 're-d2-h1', exerciseId: 'hip-rdl-mancuernas', phase: 'hipertrofia', circuitRound: 1, order: 10, coachNotes: 'Cadera Dominante 1 (con mancuernas de 24kg)', sets: createCircuitSets('10') },
          { id: 're-d2-h2', exerciseId: 'int-kb-swings', phase: 'hipertrofia', circuitRound: 1, order: 11, coachNotes: 'Cadera Dominante 2 (kettlebell de 20kg)', sets: createCircuitSets('10') },
          { id: 're-d2-h3', exerciseId: 'hip-pushups-deficit', phase: 'hipertrofia', circuitRound: 1, order: 12, coachNotes: 'Empuje 1 con déficit', sets: createCircuitSets('10') },
          { id: 're-d2-h4', exerciseId: 'fz-press-militar-barra', phase: 'hipertrofia', circuitRound: 1, order: 13, coachNotes: 'Empuje 2 con mancuernas livianas', sets: createCircuitSets('10') },
          { id: 're-d2-h5', exerciseId: 'hip-chop-diagonal-banda', phase: 'hipertrofia', circuitRound: 1, order: 14, coachNotes: 'Zona Media / Rotación 1', sets: createCircuitSets('10') },
          { id: 're-d2-h6', exerciseId: 'hip-pallof-press-banda', phase: 'hipertrofia', circuitRound: 1, order: 15, coachNotes: 'Zona Media / Antirrotación 2', sets: createCircuitSets('10') },
        ],
      },
    ],
  },

  // -------------------------------------------------------------
  // MÉTODO 2: DESCENSO DE PESO (METABÓLICO & INTERMITENTE 10" x 20")
  // -------------------------------------------------------------
  {
    id: 'routine-active-descenso-peso',
    name: 'Método Descenso de Peso (Fuerza + Intermitente 10" x 20")',
    description:
      'Planificación funcional orientada a la quema de grasa y aceleración metabólica: Activación completa + 1 pareja de fuerza con pesos libres + Intermitente Neuromuscular 10" trabajo x 20" descanso en bloques progresivos.',
    methodologyType: 'descenso_peso',
    splitType: 'funcional_descenso_peso',
    difficulty: 'Intermedio',
    daysCount: 2,
    currentWeek: 1,
    createdAt: '2026-10-05',
    updatedAt: '2026-10-25',
    days: [
      {
        id: 'day-desc-1',
        dayNumber: 1,
        dayName: 'Día 1: Rodilla Dominante & Intermitente',
        stimulusType: 'rodilla_traccion',
        focusMuscles: ['Cuádriceps', 'Espalda', 'Core'],
        targetDurationMinutes: 55,
        exercises: [
          // FASE 1: ACTIVACIÓN
          { id: 're-dp-a1', exerciseId: 'act-foam-roller', phase: 'activacion', order: 1, sets: [{ id: 'sdp-a1', setNumber: 1, setType: 'normal', targetReps: '3 min', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-dp-a2', exerciseId: 'act-mov-tobillo', phase: 'activacion', order: 2, sets: [{ id: 'sdp-a2', setNumber: 1, setType: 'normal', targetReps: '10 reps/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-dp-a3', exerciseId: 'act-mov-cadera', phase: 'activacion', order: 3, sets: [{ id: 'sdp-a3', setNumber: 1, setType: 'normal', targetReps: '8 reps/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-dp-a4', exerciseId: 'act-mov-torax', phase: 'activacion', order: 4, sets: [{ id: 'sdp-a4', setNumber: 1, setType: 'normal', targetReps: '8 reps/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-dp-a5', exerciseId: 'act-snc-pogo', phase: 'activacion', order: 5, sets: [{ id: 'sdp-a5', setNumber: 1, setType: 'normal', targetReps: '3 x 15 seg', targetRirRpe: 'SNC', restSeconds: 30 }] },

          // FASE 2: FUERZA (SOLO 1 PAREJA DE EJERCICIOS)
          { id: 're-dp-f1', exerciseId: 'fz-sentadilla-barra', phase: 'fuerza', pairGroup: 'Pareja Única (Sentadilla - Remo cerrado)', order: 6, coachNotes: '3 series pesadas de 6 reps @ RIR 1-2. Pausa de 2 min.', sets: createStrengthSets(65, '6') },
          { id: 're-dp-f2', exerciseId: 'fz-remo-cerrado-barra', phase: 'fuerza', pairGroup: 'Pareja Única (Sentadilla - Remo cerrado)', order: 7, coachNotes: '3 series de 6 reps con barra.', sets: createStrengthSets(50, '6') },

          // FASE 3: INTERMITENTE NEUROMUSCULAR (10" x 20" en bloques)
          { id: 're-dp-i1', exerciseId: 'int-kb-swings', phase: 'intermitente', order: 8, coachNotes: 'Estación 1: 10" trabajo a máxima potencia x 20" descanso', sets: [{ id: 'si-1', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp-i2', exerciseId: 'int-slam-ball', phase: 'intermitente', order: 9, coachNotes: 'Estación 2: 10" x 20"', sets: [{ id: 'si-2', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp-i3', exerciseId: 'int-burpees-funcionales', phase: 'intermitente', order: 10, coachNotes: 'Estación 3: 10" x 20"', sets: [{ id: 'si-3', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp-i4', exerciseId: 'int-mountain-climbers', phase: 'intermitente', order: 11, coachNotes: 'Estación 4: 10" x 20"', sets: [{ id: 'si-4', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp-i5', exerciseId: 'int-box-jumps', phase: 'intermitente', order: 12, coachNotes: 'Estación 5: 10" x 20"', sets: [{ id: 'si-5', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
        ],
      },
      {
        id: 'day-desc-2',
        dayNumber: 2,
        dayName: 'Día 2: Cadera Dominante & Intermitente',
        stimulusType: 'cadera_empuje',
        focusMuscles: ['Isquiotibiales', 'Pecho', 'Core'],
        targetDurationMinutes: 55,
        exercises: [
          // FASE 1: ACTIVACIÓN
          { id: 're-dp2-a1', exerciseId: 'act-foam-roller', phase: 'activacion', order: 1, sets: [{ id: 'sdp2-a1', setNumber: 1, setType: 'normal', targetReps: '3 min', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-dp2-a2', exerciseId: 'act-mov-cadera', phase: 'activacion', order: 2, sets: [{ id: 'sdp2-a2', setNumber: 1, setType: 'normal', targetReps: '8 reps/lado', targetRirRpe: 'Movilidad', restSeconds: 0 }] },
          { id: 're-dp2-a3', exerciseId: 'act-snc-pogo', phase: 'activacion', order: 3, sets: [{ id: 'sdp2-a3', setNumber: 1, setType: 'normal', targetReps: '3 x 15 seg', targetRirRpe: 'SNC', restSeconds: 30 }] },

          // FASE 2: FUERZA (SOLO 1 PAREJA DE EJERCICIOS)
          { id: 're-dp2-f1', exerciseId: 'fz-peso-muerto-barra', phase: 'fuerza', pairGroup: 'Pareja Única (Peso Muerto - Press Banca)', order: 4, coachNotes: '3 series pesadas de 6 reps @ RIR 1-2. Pausa 2 min.', sets: createStrengthSets(70, '6') },
          { id: 're-dp2-f2', exerciseId: 'fz-press-banca-barra', phase: 'fuerza', pairGroup: 'Pareja Única (Peso Muerto - Press Banca)', order: 5, coachNotes: '3 series de 6 reps con barra.', sets: createStrengthSets(45, '6') },

          // FASE 3: INTERMITENTE NEUROMUSCULAR (10" x 20")
          { id: 're-dp2-i1', exerciseId: 'int-kb-swings', phase: 'intermitente', order: 6, coachNotes: 'Estación 1: 10" x 20"', sets: [{ id: 'si2-1', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp2-i2', exerciseId: 'int-slam-ball', phase: 'intermitente', order: 7, coachNotes: 'Estación 2: 10" x 20"', sets: [{ id: 'si2-2', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp2-i3', exerciseId: 'int-burpees-funcionales', phase: 'intermitente', order: 8, coachNotes: 'Estación 3: 10" x 20"', sets: [{ id: 'si2-3', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
          { id: 're-dp2-i4', exerciseId: 'int-mountain-climbers', phase: 'intermitente', order: 9, coachNotes: 'Estación 4: 10" x 20"', sets: [{ id: 'si2-4', setNumber: 1, setType: 'normal', targetReps: '10 seg máx', targetRirRpe: 'Máximo', restSeconds: 20 }] },
        ],
      },
    ],
  },
];

// Pre-populated realistic historical session logs for Lucas Benítez
// Showing load volume evolution (reps * weight) across weeks!
export const INITIAL_LOGS: WorkoutSessionLog[] = [
  {
    id: 'log-w1-d1',
    studentId: 'student-1',
    routineId: 'routine-active-fuerza-4sem',
    routineName: 'Método Fuerza & Hipertrofia Funcional',
    dayId: 'day-fuerza-1',
    dayName: 'Estímulo 1: Rodilla Dominante & Tracciones',
    programWeek: 1,
    date: '2026-10-06T18:00:00.000Z',
    durationMinutes: 62,
    totalVolumeKg: 3840,
    studentRating: 5,
    feedbackToCoach: 'Arranque de Semana 1 perfecto. Sentadilla 80kg x 6 reps en las 3 series sintiendo muy bien el RIR 1-2. Las pausas de 2 min me dejaron recuperar al 100%.',
    completedExercises: [
      {
        exerciseId: 'fz-sentadilla-barra',
        exerciseName: 'Sentadilla Libre con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 80, targetReps: '6', actualWeight: 80, actualReps: 6, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 80, targetReps: '6', actualWeight: 80, actualReps: 6, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 80, targetReps: '6', actualWeight: 80, actualReps: 6, actualRir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'fz-remo-cerrado-barra',
        exerciseName: 'Remo Cerrado con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 70, targetReps: '6', actualWeight: 70, actualReps: 6, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 70, targetReps: '6', actualWeight: 70, actualReps: 6, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 70, targetReps: '6', actualWeight: 70, actualReps: 6, actualRir: 1, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-w1-d2',
    studentId: 'student-1',
    routineId: 'routine-active-fuerza-4sem',
    routineName: 'Método Fuerza & Hipertrofia Funcional',
    dayId: 'day-fuerza-2',
    dayName: 'Estímulo 2: Cadera Dominante & Empujes',
    programWeek: 1,
    date: '2026-10-09T18:00:00.000Z',
    durationMinutes: 64,
    totalVolumeKg: 4320,
    studentRating: 5,
    feedbackToCoach: 'Semana 1 completa. Peso muerto con 100kg x 6 reps muy sólido y press banca con 75kg.',
    completedExercises: [
      {
        exerciseId: 'fz-peso-muerto-barra',
        exerciseName: 'Peso Muerto con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 100, targetReps: '6', actualWeight: 100, actualReps: 6, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 100, targetReps: '6', actualWeight: 100, actualReps: 6, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 100, targetReps: '6', actualWeight: 100, actualReps: 6, actualRir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'fz-press-banca-barra',
        exerciseName: 'Press de Banca Plano con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 75, targetReps: '6', actualWeight: 75, actualReps: 6, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 75, targetReps: '6', actualWeight: 75, actualReps: 6, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 75, targetReps: '6', actualWeight: 75, actualReps: 6, actualRir: 1, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-w2-d1',
    studentId: 'student-1',
    routineId: 'routine-active-fuerza-4sem',
    routineName: 'Método Fuerza & Hipertrofia Funcional',
    dayId: 'day-fuerza-1',
    dayName: 'Estímulo 1: Rodilla Dominante & Tracciones',
    programWeek: 2,
    date: '2026-10-13T18:00:00.000Z',
    durationMinutes: 66,
    totalVolumeKg: 4680,
    studentRating: 5,
    feedbackToCoach: '¡Semana 2 de sobrecarga (+5kg)! Sentadilla con 85kg x 4 reps y Remo con 75kg x 4 reps. El aumento de volumen y fuerza se sintió genial.',
    completedExercises: [
      {
        exerciseId: 'fz-sentadilla-barra',
        exerciseName: 'Sentadilla Libre con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 85, targetReps: '4', actualWeight: 85, actualReps: 4, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 85, targetReps: '4', actualWeight: 85, actualReps: 4, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 85, targetReps: '4', actualWeight: 85, actualReps: 4, actualRir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'fz-remo-cerrado-barra',
        exerciseName: 'Remo Cerrado con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 75, targetReps: '4', actualWeight: 75, actualReps: 4, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 75, targetReps: '4', actualWeight: 75, actualReps: 4, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 75, targetReps: '4', actualWeight: 75, actualReps: 4, actualRir: 1, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-w2-d2',
    studentId: 'student-1',
    routineId: 'routine-active-fuerza-4sem',
    routineName: 'Método Fuerza & Hipertrofia Funcional',
    dayId: 'day-fuerza-2',
    dayName: 'Estímulo 2: Cadera Dominante & Empujes',
    programWeek: 2,
    date: '2026-10-16T18:00:00.000Z',
    durationMinutes: 65,
    totalVolumeKg: 5040,
    studentRating: 5,
    feedbackToCoach: 'Semana 2 Día 2: Peso muerto subió a 105kg x 4 reps y Banca 80kg x 4 reps.',
    completedExercises: [
      {
        exerciseId: 'fz-peso-muerto-barra',
        exerciseName: 'Peso Muerto con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 105, targetReps: '4', actualWeight: 105, actualReps: 4, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 105, targetReps: '4', actualWeight: 105, actualReps: 4, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 105, targetReps: '4', actualWeight: 105, actualReps: 4, actualRir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'fz-press-banca-barra',
        exerciseName: 'Press de Banca Plano con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 80, targetReps: '4', actualWeight: 80, actualReps: 4, actualRir: 1, completed: true },
          { setNumber: 2, targetWeight: 80, targetReps: '4', actualWeight: 80, actualReps: 4, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 80, targetReps: '4', actualWeight: 80, actualReps: 4, actualRir: 1, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-w3-d1',
    studentId: 'student-1',
    routineId: 'routine-active-fuerza-4sem',
    routineName: 'Método Fuerza & Hipertrofia Funcional',
    dayId: 'day-fuerza-1',
    dayName: 'Estímulo 1: Rodilla Dominante & Tracciones',
    programWeek: 3,
    date: '2026-10-20T18:00:00.000Z',
    durationMinutes: 58,
    totalVolumeKg: 4020,
    studentRating: 5,
    feedbackToCoach: 'Semana 3 de Descarga Activa: Volvimos a 6 reps con el peso base (80kg / 70kg). Las articulaciones descansadas y listos para la semana 4 de récord.',
    completedExercises: [
      {
        exerciseId: 'fz-sentadilla-barra',
        exerciseName: 'Sentadilla Libre con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 80, targetReps: '6', actualWeight: 80, actualReps: 6, actualRir: 2, completed: true },
          { setNumber: 2, targetWeight: 80, targetReps: '6', actualWeight: 80, actualReps: 6, actualRir: 2, completed: true },
          { setNumber: 3, targetWeight: 80, targetReps: '6', actualWeight: 80, actualReps: 6, actualRir: 2, completed: true },
        ],
      },
    ],
  },
  {
    id: 'log-w4-d1',
    studentId: 'student-1',
    routineId: 'routine-active-fuerza-4sem',
    routineName: 'Método Fuerza & Hipertrofia Funcional',
    dayId: 'day-fuerza-1',
    dayName: 'Estímulo 1: Rodilla Dominante & Tracciones',
    programWeek: 4,
    date: '2026-10-27T18:00:00.000Z',
    durationMinutes: 68,
    totalVolumeKg: 5380,
    studentRating: 5,
    feedbackToCoach: '¡SEMANA 4 PICO DE FUERZA! Sentadilla 90kg (+10kg sobre base) x 3 reps sólidas a RIR 1 y Remo 80kg x 3 reps. ¡Récord personal superado!',
    completedExercises: [
      {
        exerciseId: 'fz-sentadilla-barra',
        exerciseName: 'Sentadilla Libre con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 90, targetReps: '3', actualWeight: 90, actualReps: 3, actualRir: 1, completed: true },
          { setNumber: 2, targetWeight: 90, targetReps: '3', actualWeight: 90, actualReps: 3, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 90, targetReps: '3', actualWeight: 90, actualReps: 3, actualRir: 1, completed: true },
        ],
      },
      {
        exerciseId: 'fz-remo-cerrado-barra',
        exerciseName: 'Remo Cerrado con Barra (Pareja 1)',
        sets: [
          { setNumber: 1, targetWeight: 80, targetReps: '3', actualWeight: 80, actualReps: 3, actualRir: 1, completed: true },
          { setNumber: 2, targetWeight: 80, targetReps: '3', actualWeight: 80, actualReps: 3, actualRir: 1, completed: true },
          { setNumber: 3, targetWeight: 80, targetReps: '3', actualWeight: 80, actualReps: 3, actualRir: 1, completed: true },
        ],
      },
    ],
  },
];
