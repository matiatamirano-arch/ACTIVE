import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot, query, setDoc, where, writeBatch, Query, DocumentData } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { logout, useAuth } from '../auth/AuthContext';
import { INITIAL_EXERCISES } from '../data/exerciseBank';
import { DEFAULT_METHODOLOGY, INITIAL_ROUTINES } from '../data/initialData';
import { Exercise, PlanningMethodology, Routine, Student, WorkoutSessionLog } from '../types/gym';
export type AppMode = 'coach' | 'student';
export type CoachTab = 'students' | 'builder' | 'methodology' | 'exercises' | 'history';

interface GymContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  coachTab: CoachTab;
  setCoachTab: (tab: CoachTab) => void;
  activeStudentId: string;
  setActiveStudentId: (id: string) => void;
  activeStudent: Student | undefined;
  activeStudentRoutine: Routine | undefined;

  // Data
  students: Student[];
  routines: Routine[];
  exercises: Exercise[];
  methodology: PlanningMethodology;
  workoutLogs: WorkoutSessionLog[];

  // Selected for edit
  editingRoutineId: string | null;
  setEditingRoutineId: (id: string | null) => void;

  // Modals & Student Lock
  videoModalExercise: Exercise | null;
  setVideoModalExercise: (exercise: Exercise | null) => void;
  shareModalStudent: Student | null;
  setShareModalStudent: (student: Student | null) => void;
  progressModalStudentId: string | null;
  setProgressModalStudentId: (studentId: string | null) => void;
  isStudentIsolated: boolean;
  setIsStudentIsolated: (isolated: boolean) => void;

  // CRUD
  addStudent: (student: Omit<Student, 'id' | 'slug' | 'joinDate'>) => Student;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;
  removeDemoStudents: () => void;

  addRoutine: (routine: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>) => Routine;
  updateRoutine: (routine: Routine) => Promise<void>;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (routineId: string, newName?: string) => Routine;
  assignRoutineToStudent: (studentId: string, routineId: string) => void;

  addExercise: (exercise: Omit<Exercise, 'id'>) => Exercise;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;

  updateMethodology: (methodology: PlanningMethodology) => void;
  saveWorkoutSessionLog: (log: Omit<WorkoutSessionLog, 'id'>) => Promise<WorkoutSessionLog>;

  // Switchers & Sharing
  openStudentGymMode: (studentId: string) => void;
  openCoachMode: () => void;
  getStudentShareUrl: (student: Student) => string;

  // Backup & Reset
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => Promise<boolean>;
  resetAllData: () => void;
}


const GymContext = createContext<GymContextType | undefined>(undefined);
const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const id = () => crypto.randomUUID();
export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isCoach } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [methodology, setMethodology] = useState<PlanningMethodology>(DEFAULT_METHODOLOGY);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutSessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const [modeState, setModeState] = useState<AppMode>(isCoach ? 'coach' : 'student');
  const mode = isCoach ? modeState : 'student';
  const setMode = (next: AppMode) => { if (isCoach) setModeState(next); };
  const [coachTab, setCoachTab] = useState<CoachTab>('students');
  const [activeStudentId, setActiveStudentId] = useState(new URLSearchParams(window.location.search).get('alumno') || '');
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [videoModalExercise, setVideoModalExercise] = useState<Exercise | null>(null);
  const [shareModalStudent, setShareModalStudent] = useState<Student | null>(null);
  const [progressModalStudentId, setProgressModalStudentId] = useState<string | null>(null);
  const [isStudentIsolatedState, setIsStudentIsolated] = useState(!isCoach);
  const isStudentIsolated = !isCoach || isStudentIsolatedState;

  useEffect(() => {
    // Legacy URLs carried personal data and a PIN. Remove their payload without reading it.
    const url = new URL(window.location.href);
    ['d', 'data', 'p'].forEach(key => url.searchParams.delete(key));
    window.history.replaceState({}, '', url);
    // Discard the old browser-only prototype store; it is never imported automatically.
    try { for (const suffix of ['students', 'routines', 'logs', 'methodology', 'exercises']) localStorage.removeItem('coachpro_gym_data_v1_' + suffix); } catch { /* Browser storage may be disabled. */ }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true); setError('');
    const source = isCoach ? collection(db, 'students') : query(collection(db, 'students'), where('email', '==', user.email?.toLowerCase()));
    return onSnapshot(source, snapshot => {
      setStudents(snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Student));
      setLoading(false);
    }, () => { setError('No se pudieron cargar los alumnos. Revisá la conexión y que las reglas de Firestore estén publicadas.'); setLoading(false); });
  }, [user?.uid, isCoach]);

  const activeStudent = students.find(s => s.id === activeStudentId) || (isCoach && activeStudentId ? undefined : students[0]);
  useEffect(() => {
    if (!user) return;
    if (!isCoach && !activeStudent) { setRoutines([]); setWorkoutLogs([]); return; }
    const listen = <T,>(source: Query<DocumentData>, setter: React.Dispatch<React.SetStateAction<T[]>>) => onSnapshot(source, snapshot => setter(snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as T)), () => setError('No se pudieron sincronizar los datos. Revisá la conexión y los permisos de Firebase.'));
    const unsubscribers = [
      listen<Routine>(isCoach ? collection(db, 'routines') : query(collection(db, 'routines'), where('studentId', '==', activeStudent!.id)), setRoutines),
      listen<WorkoutSessionLog>(isCoach ? collection(db, 'logs') : query(collection(db, 'logs'), where('studentId', '==', activeStudent!.id)), setWorkoutLogs),
      onSnapshot(collection(db, 'exercises'), snapshot => {
        const custom = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as Exercise);
        setExercises([...INITIAL_EXERCISES.filter(e => !custom.some(c => c.id === e.id)), ...custom]);
      }, () => setError('No se pudo cargar el banco de ejercicios. Revisá los permisos.')),
      onSnapshot(doc(db, 'settings', 'methodology'), snapshot => setMethodology(snapshot.exists() ? snapshot.data() as PlanningMethodology : DEFAULT_METHODOLOGY), () => setError('No se pudo cargar la metodología. Revisá los permisos.')),
    ];
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, [user?.uid, isCoach, activeStudent?.id]);
  const activeStudentRoutine = routines.find(r => r.id === activeStudent?.activeRoutineId && r.studentId === activeStudent?.id);

  const track = async <T,>(operation: () => Promise<T>): Promise<T> => {
    setPending(p => p + 1); setError('');
    try { return await operation(); }
    catch (e) { setError('No se guardó el cambio. Revisá tu conexión y los permisos; volvé a intentarlo.'); throw e; }
    finally { setPending(p => p - 1); }
  };
  const coachOnly = () => { if (!isCoach) throw new Error('Acceso reservado a profesores.'); };
  const put = <T extends { id: string },>(name: string, value: T) => { coachOnly(); void track(() => setDoc(doc(db, name, value.id), clean(value))).catch(() => {}); };
  const remove = (name: string, key: string) => { coachOnly(); void track(() => deleteDoc(doc(db, name, key))).catch(() => {}); };
  const normalizeStudent = (student: Student): Student => {
    const email = student.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Ingresá el correo del alumno para habilitar su acceso.');
    if (students.some(s => s.id !== student.id && s.email === email)) throw new Error('Ya existe un alumno con ese correo.');
    return { ...student, email, pinCode: '' };
  };
  const addStudent = (data: Omit<Student, 'id' | 'slug' | 'joinDate'>): Student => {
    const key = id(); const student = normalizeStudent({ ...data, id: key, slug: key, joinDate: new Date().toISOString().slice(0, 10), activeRoutineId: '' });
    put('students', student); return student;
  };
  const updateStudent = (student: Student) => put('students', normalizeStudent(student));
  const deleteStudent = (key: string) => remove('students', key);
  const removeDemoStudents = () => { students.filter(s => ['student-1', 'student-2', 'student-3'].includes(s.id)).forEach(s => deleteStudent(s.id)); };
  const addRoutine = (data: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Routine => {
    const now = new Date().toISOString(); const routine = { ...data, id: id(), createdAt: now, updatedAt: now };
    void saveRoutine(routine).catch(() => {}); return routine;
  };
  const saveRoutine = (routine: Routine) => {
    coachOnly(); const batch = writeBatch(db);
    batch.set(doc(db, 'routines', routine.id), clean(routine));
    const previous = routines.find(r => r.id === routine.id);
    if (previous?.studentId && previous.studentId !== routine.studentId && students.find(s => s.id === previous.studentId)?.activeRoutineId === routine.id) batch.update(doc(db, 'students', previous.studentId), { activeRoutineId: '' });
    if (routine.studentId && students.some(s => s.id === routine.studentId)) batch.update(doc(db, 'students', routine.studentId), { activeRoutineId: routine.id });
    return track(() => batch.commit());
  };
  const updateRoutine = (routine: Routine) => saveRoutine({ ...routine, updatedAt: new Date().toISOString() });
  const deleteRoutine = (key: string) => remove('routines', key);
  const duplicateRoutine = (key: string, name?: string): Routine => {
    const original = routines.find(r => r.id === key); if (!original) throw new Error('Rutina no encontrada');
    return addRoutine({ ...clean(original), name: name || original.name + ' (Copia)' });
  };
  const assignRoutineToStudent = (studentId: string, routineId: string) => {
    coachOnly(); const student = students.find(s => s.id === studentId); const original = routines.find(r => r.id === routineId);
    if (!student || !original) throw new Error('Alumno o rutina no encontrados');
    const assigned = { ...clean(original), id: id(), studentId, isTemplate: false };
    const batch = writeBatch(db);
    batch.set(doc(db, 'routines', assigned.id), clean(assigned));
    batch.update(doc(db, 'students', studentId), { activeRoutineId: assigned.id });
    void track(() => batch.commit()).catch(() => {});
  };
  const addExercise = (data: Omit<Exercise, 'id'>): Exercise => { const exercise = { ...data, id: id(), isCustom: true }; put('exercises', exercise); return exercise; };
  const updateExercise = (exercise: Exercise) => put('exercises', exercise);
  const deleteExercise = (key: string) => remove('exercises', key);
  const updateMethodology = (next: PlanningMethodology) => { coachOnly(); void track(() => setDoc(doc(db, 'settings', 'methodology'), clean(next))).catch(() => {}); };
  const saveWorkoutSessionLog = async (data: Omit<WorkoutSessionLog, 'id'>): Promise<WorkoutSessionLog> => {
    if (!activeStudent || data.studentId !== activeStudent.id) throw new Error('Alumno inválido');
    // One result per student, routine, week and day; retries never create duplicates.
    const log = { ...data, id: [data.studentId, data.routineId, data.programWeek, data.dayId].join('_') };
    await track(() => setDoc(doc(db, 'logs', log.id), clean(log))); return log;
  };
  const openStudentGymMode = (key: string) => { if (!isCoach) return; setActiveStudentId(key); setMode('student'); };
  const openCoachMode = () => { if (isCoach) { setMode('coach'); setIsStudentIsolated(false); } };
  const getStudentShareUrl = (student: Student) => { const url = new URL(window.location.origin + window.location.pathname); url.searchParams.set('alumno', student.id); return url.toString(); };
  const exportBackupJSON = () => { coachOnly(); return JSON.stringify({ version: 2, students, routines, exercises, methodology, workoutLogs }, null, 2); };
  const importBackupJSON = async (json: string): Promise<boolean> => {
    coachOnly();
    try {
      const data = JSON.parse(json);
      const entries: [string, { id: string }][] = [];
      for (const [field, name] of [['students', 'students'], ['routines', 'routines'], ['exercises', 'exercises'], ['workoutLogs', 'logs']]) {
        if (data[field] !== undefined && !Array.isArray(data[field])) throw new Error('Formato inválido');
        for (const entry of data[field] || []) {
          if (typeof entry.id !== 'string' || !entry.id || entry.id.includes('/')) throw new Error('ID inválido');
          entries.push([name, name === 'students' ? normalizeStudent(entry) : entry]);
        }
      }
      if (!entries.length) throw new Error('Archivo vacío');
      if (entries.length > 450) throw new Error('Importá hasta 450 registros por archivo.');
      const batch = writeBatch(db);
      entries.forEach(([name, entry]) => batch.set(doc(db, name, entry.id), clean(entry)));
      if (data.methodology) batch.set(doc(db, 'settings', 'methodology'), clean(data.methodology));
      await track(() => batch.commit()); return true;
    } catch { setError('No se importó la copia. Verificá el formato, los correos y el límite de 450 registros.'); return false; }
  };
  const resetAllData = () => { setError('El reinicio masivo está deshabilitado para proteger los datos compartidos. Eliminá los registros desde su pantalla.'); };

  return <GymContext.Provider value={{ mode, setMode, coachTab, setCoachTab, activeStudentId, setActiveStudentId, activeStudent, activeStudentRoutine, students, routines, exercises, methodology, workoutLogs: [...workoutLogs].sort((a,b) => b.date.localeCompare(a.date)), editingRoutineId, setEditingRoutineId, videoModalExercise, setVideoModalExercise, shareModalStudent, setShareModalStudent, progressModalStudentId, setProgressModalStudentId, isStudentIsolated, setIsStudentIsolated, addStudent, updateStudent, deleteStudent, removeDemoStudents, addRoutine, updateRoutine, deleteRoutine, duplicateRoutine, assignRoutineToStudent, addExercise, updateExercise, deleteExercise, updateMethodology, saveWorkoutSessionLog, openStudentGymMode, openCoachMode, getStudentShareUrl, exportBackupJSON, importBackupJSON, resetAllData }}>
    <div className="bg-zinc-900 text-white text-xs px-4 py-2 flex justify-between items-center gap-3"><span>{user?.email} · {pending ? 'Guardando…' : 'Conectado'}</span><button onClick={logout}>Cerrar sesión</button></div>
    {error && <div role="alert" className="bg-red-50 text-red-800 p-4">{error}<button className="ml-4 underline" onClick={() => window.location.reload()}>Reintentar carga</button></div>}
    {loading ? <p className="p-8">Cargando tus datos…</p> : !isCoach && !activeStudent ? <div className="p-8"><h1 className="text-xl font-bold">Todavía no tenés una planificación vinculada</h1><p>Pedile a tu profe que registre este mismo correo en tu ficha: {user?.email}.</p></div> : children}
  </GymContext.Provider>;
};
export const useGym = () => { const context = useContext(GymContext); if (!context) throw new Error('GymProvider requerido'); return context; };
