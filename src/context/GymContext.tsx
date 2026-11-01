import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_EXERCISES } from '../data/exerciseBank';
import {
  DEFAULT_METHODOLOGY,
  INITIAL_LOGS,
  INITIAL_ROUTINES,
  INITIAL_STUDENTS,
} from '../data/initialData';
import {
  Exercise,
  PlanningMethodology,
  Routine,
  Student,
  WorkoutSessionLog,
} from '../types/gym';
import { decodeStudentShareData, encodeStudentShareData } from '../utils/studentShare';

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
  updateRoutine: (routine: Routine) => void;
  deleteRoutine: (id: string) => void;
  duplicateRoutine: (routineId: string, newName?: string) => Routine;
  assignRoutineToStudent: (studentId: string, routineId: string) => void;

  addExercise: (exercise: Omit<Exercise, 'id'>) => Exercise;
  updateExercise: (exercise: Exercise) => void;
  deleteExercise: (id: string) => void;

  updateMethodology: (methodology: PlanningMethodology) => void;
  saveWorkoutSessionLog: (log: Omit<WorkoutSessionLog, 'id'>) => WorkoutSessionLog;

  // Switchers & Sharing
  openStudentGymMode: (studentId: string) => void;
  openCoachMode: () => void;
  getStudentShareUrl: (student: Student) => string;

  // Backup & Reset
  exportBackupJSON: () => string;
  importBackupJSON: (jsonStr: string) => boolean;
  resetAllData: () => void;
}

const STORAGE_KEY = 'coachpro_gym_data_v1';

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check URL parameters on initialization
  const initialParams = (() => {
    try {
      const search = window.location.search;
      if (!search) return null;
      const params = new URLSearchParams(search);
      const alumno = params.get('alumno') || params.get('student');
      const dataParam = params.get('d') || params.get('data') || params.get('p');
      const decoded = dataParam ? decodeStudentShareData(dataParam) : null;
      return { alumno, dataParam, decoded };
    } catch {
      return null;
    }
  })();

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_students');
      let list: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;

      // If URL contains decoded student, prioritize it!
      if (initialParams?.decoded?.s) {
        const studentFromPayload = initialParams.decoded.s;
        const exists = list.some(
          (s) => s.id === studentFromPayload.id || s.slug === studentFromPayload.slug
        );
        if (!exists) {
          list = [studentFromPayload, ...list];
        } else {
          list = list.map((s) =>
            s.id === studentFromPayload.id || s.slug === studentFromPayload.slug
              ? { ...s, ...studentFromPayload }
              : s
          );
        }
      } else if (initialParams?.alumno) {
        // If alumno param is in URL but student is not in storage, create them!
        const slug = initialParams.alumno;
        const exists = list.some((s) => s.slug === slug || s.id === slug);
        if (!exists) {
          const formattedName = slug
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          const onTheFlyStudent: Student = {
            id: `student-${slug}`,
            name: formattedName,
            slug: slug,
            email: '',
            phone: '',
            goal: 'Fuerza & Hipertrofia',
            level: 'Intermedio',
            pinCode: '1234',
            trainingDaysPerWeek: 2,
            currentProgramWeek: 1,
            activeRoutineId: 'routine-1',
            avatarUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
            joinDate: new Date().toISOString().split('T')[0],
          };
          list = [onTheFlyStudent, ...list];
        }
      }

      return list;
    } catch {
      return initialParams?.decoded?.s ? [initialParams.decoded.s] : INITIAL_STUDENTS;
    }
  });

  const [routines, setRoutines] = useState<Routine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_routines');
      let list: Routine[] = saved ? JSON.parse(saved) : INITIAL_ROUTINES;

      if (initialParams?.decoded?.r) {
        const routineFromPayload = initialParams.decoded.r;
        const exists = list.some((r) => r.id === routineFromPayload.id);
        if (!exists) {
          list = [routineFromPayload, ...list];
        } else {
          list = list.map((r) =>
            r.id === routineFromPayload.id ? routineFromPayload : r
          );
        }
      }

      return list;
    } catch {
      return initialParams?.decoded?.r ? [initialParams.decoded.r] : INITIAL_ROUTINES;
    }
  });

  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_exercises');
      return saved ? JSON.parse(saved) : INITIAL_EXERCISES;
    } catch {
      return INITIAL_EXERCISES;
    }
  });

  const [methodology, setMethodology] = useState<PlanningMethodology>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_methodology');
      return saved ? JSON.parse(saved) : DEFAULT_METHODOLOGY;
    } catch {
      return DEFAULT_METHODOLOGY;
    }
  });

  const [workoutLogs, setWorkoutLogs] = useState<WorkoutSessionLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY + '_logs');
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  // Mode: if accessed with student link, start directly in student mode!
  const [mode, setMode] = useState<AppMode>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('alumno') || params.get('student') || params.get('d')) {
        return 'student';
      }
    } catch {}
    return 'coach';
  });

  const [coachTab, setCoachTab] = useState<CoachTab>('students');
  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    if (initialParams?.decoded?.s?.id) return initialParams.decoded.s.id;
    if (initialParams?.alumno) return `student-${initialParams.alumno}`;
    return 'student-1';
  });
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  // Modals & Student Lock
  const [videoModalExercise, setVideoModalExercise] = useState<Exercise | null>(null);
  const [shareModalStudent, setShareModalStudent] = useState<Student | null>(null);
  const [progressModalStudentId, setProgressModalStudentId] = useState<string | null>(null);
  const [isStudentIsolated, setIsStudentIsolated] = useState<boolean>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return Boolean(params.get('alumno') || params.get('student') || params.get('d'));
    } catch {
      return false;
    }
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_students', JSON.stringify(students));
    } catch (e) {
      console.warn('Failed to save students to localStorage', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_routines', JSON.stringify(routines));
    } catch (e) {
      console.warn('Failed to save routines to localStorage', e);
    }
  }, [routines]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_exercises', JSON.stringify(exercises));
    } catch (e) {
      console.warn('Failed to save exercises to localStorage', e);
    }
  }, [exercises]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_methodology', JSON.stringify(methodology));
    } catch (e) {
      console.warn('Failed to save methodology to localStorage', e);
    }
  }, [methodology]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY + '_logs', JSON.stringify(workoutLogs));
    } catch (e) {
      console.warn('Failed to save logs to localStorage', e);
    }
  }, [workoutLogs]);

  // Ensure activeStudentId matches the URL target if provided
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const alumnoParam = params.get('alumno') || params.get('student');
      const studentIdParam = params.get('id');

      if (alumnoParam || studentIdParam) {
        setMode('student');
        setIsStudentIsolated(true);

        const target = students.find(
          (s) => s.slug === alumnoParam || s.id === (studentIdParam || alumnoParam)
        );
        if (target) {
          setActiveStudentId(target.id);
        }
      }
    } catch (e) {
      console.error('Error parsing URL query params:', e);
    }
  }, [students]);

  const activeStudent =
    students.find((s) => s.id === activeStudentId) ||
    students.find(
      (s) => s.slug === new URLSearchParams(window.location.search).get('alumno')
    ) ||
    students[0];

  const activeStudentRoutine = routines.find(
    (r) => r.id === activeStudent?.activeRoutineId || r.studentId === activeStudent?.id
  ) || routines[0];

  // Actions
  const addStudent = (studentData: Omit<Student, 'id' | 'slug' | 'joinDate'>): Student => {
    const slug = studentData.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const newStudent: Student = {
      ...studentData,
      id: `student-${Date.now()}`,
      slug: slug || `alumno-${Date.now().toString().slice(-4)}`,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setStudents((prev) => [newStudent, ...prev]);
    return newStudent;
  };

  const updateStudent = (updated: Student) => {
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (activeStudentId === id) {
      const remaining = students.filter((s) => s.id !== id);
      if (remaining.length > 0) {
        setActiveStudentId(remaining[0].id);
      }
    }
  };

  const addRoutine = (routineData: Omit<Routine, 'id' | 'createdAt' | 'updatedAt'>): Routine => {
    const now = new Date().toISOString().split('T')[0];
    const newRoutine: Routine = {
      ...routineData,
      id: `routine-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setRoutines((prev) => [newRoutine, ...prev]);
    return newRoutine;
  };

  const updateRoutine = (updated: Routine) => {
    const updatedWithTimestamp = {
      ...updated,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setRoutines((prev) =>
      prev.map((r) => (r.id === updated.id ? updatedWithTimestamp : r))
    );
  };

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  const duplicateRoutine = (routineId: string, newName?: string): Routine => {
    const orig = routines.find((r) => r.id === routineId);
    if (!orig) throw new Error('Rutina no encontrada');
    const now = new Date().toISOString().split('T')[0];
    const cloned: Routine = {
      ...JSON.parse(JSON.stringify(orig)),
      id: `routine-${Date.now()}`,
      name: newName || `${orig.name} (Copia)`,
      createdAt: now,
      updatedAt: now,
    };
    setRoutines((prev) => [cloned, ...prev]);
    return cloned;
  };

  const assignRoutineToStudent = (studentId: string, routineId: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, activeRoutineId: routineId } : s))
    );
  };

  const addExercise = (exerciseData: Omit<Exercise, 'id'>): Exercise => {
    const newEx: Exercise = {
      ...exerciseData,
      id: `ex-custom-${Date.now()}`,
      isCustom: true,
    };
    setExercises((prev) => [newEx, ...prev]);
    return newEx;
  };

  const updateExercise = (updated: Exercise) => {
    setExercises((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  };

  const deleteExercise = (id: string) => {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  const updateMethodology = (newMethod: PlanningMethodology) => {
    setMethodology(newMethod);
  };

  const saveWorkoutSessionLog = (logData: Omit<WorkoutSessionLog, 'id'>): WorkoutSessionLog => {
    const newLog: WorkoutSessionLog = {
      ...logData,
      id: `log-${Date.now()}`,
    };
    setWorkoutLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const openStudentGymMode = (studentId: string) => {
    setActiveStudentId(studentId);
    setMode('student');
    // Update browser URL query param without reload
    const target = students.find((s) => s.id === studentId);
    if (target && window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.set('alumno', target.slug);
      window.history.pushState({}, '', url.toString());
    }
  };

  const openCoachMode = () => {
    setMode('coach');
    setIsStudentIsolated(false);
    if (window.history.pushState) {
      const url = new URL(window.location.href);
      url.searchParams.delete('alumno');
      url.searchParams.delete('student');
      url.searchParams.delete('id');
      window.history.pushState({}, '', url.toString());
    }
  };

  const removeDemoStudents = () => {
    const demoIds = new Set(['student-1', 'student-2', 'student-3']);
    setStudents((prev) => {
      const remaining = prev.filter((s) => !demoIds.has(s.id));
      if (remaining.length > 0) {
        setActiveStudentId(remaining[0].id);
      }
      return remaining;
    });
  };

  const getStudentShareUrl = (student: Student): string => {
    // Clean base URL without existing query params
    const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    const url = new URL(baseUrl);
    url.searchParams.set('alumno', student.slug);

    // Find student's assigned routine
    const assignedRoutine = routines.find(
      (r) => r.id === student.activeRoutineId || r.studentId === student.id
    );

    // Encode student and routine data into URL payload so any phone sees her immediate routine
    const payload = encodeStudentShareData({
      s: student,
      r: assignedRoutine,
    });

    if (payload) {
      url.searchParams.set('d', payload);
    }

    return url.toString();
  };

  const exportBackupJSON = (): string => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      students,
      routines,
      exercises,
      methodology,
      workoutLogs,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importBackupJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.students && Array.isArray(data.students)) setStudents(data.students);
      if (data.routines && Array.isArray(data.routines)) setRoutines(data.routines);
      if (data.exercises && Array.isArray(data.exercises)) setExercises(data.exercises);
      if (data.methodology) setMethodology(data.methodology);
      if (data.workoutLogs && Array.isArray(data.workoutLogs)) setWorkoutLogs(data.workoutLogs);
      return true;
    } catch (e) {
      console.error('Error importing JSON backup:', e);
      return false;
    }
  };

  const resetAllData = () => {
    setStudents(INITIAL_STUDENTS);
    setRoutines(INITIAL_ROUTINES);
    setExercises(INITIAL_EXERCISES);
    setMethodology(DEFAULT_METHODOLOGY);
    setWorkoutLogs(INITIAL_LOGS);
    localStorage.removeItem(STORAGE_KEY + '_students');
    localStorage.removeItem(STORAGE_KEY + '_routines');
    localStorage.removeItem(STORAGE_KEY + '_exercises');
    localStorage.removeItem(STORAGE_KEY + '_methodology');
    localStorage.removeItem(STORAGE_KEY + '_logs');
  };

  return (
    <GymContext.Provider
      value={{
        mode,
        setMode,
        coachTab,
        setCoachTab,
        activeStudentId,
        setActiveStudentId,
        activeStudent,
        activeStudentRoutine,
        students,
        routines,
        exercises,
        methodology,
        workoutLogs,
        editingRoutineId,
        setEditingRoutineId,
        videoModalExercise,
        setVideoModalExercise,
        shareModalStudent,
        setShareModalStudent,
        progressModalStudentId,
        setProgressModalStudentId,
        isStudentIsolated,
        setIsStudentIsolated,
        addStudent,
        updateStudent,
        deleteStudent,
        removeDemoStudents,
        addRoutine,
        updateRoutine,
        deleteRoutine,
        duplicateRoutine,
        assignRoutineToStudent,
        addExercise,
        updateExercise,
        deleteExercise,
        updateMethodology,
        saveWorkoutSessionLog,
        openStudentGymMode,
        openCoachMode,
        getStudentShareUrl,
        exportBackupJSON,
        importBackupJSON,
        resetAllData,
      }}
    >
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
