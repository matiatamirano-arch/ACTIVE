import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '../auth/AuthContext';

type Sets = Record<string, { actualWeight: number; actualReps: number; actualRir: number; completed: boolean }[]>;
type Draft = { sessionSets: Sets; coachFeedback: string; finishRating: number };
const empty = (): Draft => ({ sessionSets: {}, coachFeedback: '', finishRating: 5 });
export function useWorkoutDraft(studentId: string | undefined, routineId: string | undefined, dayId: string | undefined, week: number) {
  const { user } = useAuth();
  const cacheKey = (key: string) => 'active-draft:' + user?.uid + ':' + key;
  const key = studentId && routineId && dayId ? [studentId, routineId, week, dayId].join('_') : '';
  const [value, setValue] = useState<Draft>(empty);
  const [loadedKey, setLoadedKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef<{ key: string; value: Draft; dirty: boolean; timer?: ReturnType<typeof setTimeout>; revision: number }>({ key: '', value: empty(), dirty: false, revision: 0 });
  const persist = async (state = ref.current) => {
    if (!state.key || !state.dirty) return;
    if (state.timer) clearTimeout(state.timer);
    const revision = state.revision;
    setSaving(true);
    try {
      await setDoc(doc(db, 'drafts', state.key), { ...state.value, studentId, routineId, dayId, week, updatedAt: new Date().toISOString() });
      if (state.revision === revision) { state.dirty = false; try { localStorage.removeItem(cacheKey(state.key)); } catch {} }
      if (ref.current === state) setError('');
    } catch (e) {
      if (ref.current === state) setError('Los últimos cambios todavía no se guardaron. Revisá tu conexión y tocá Reintentar.');
      throw e;
    } finally { if (ref.current === state) setSaving(state.dirty); }
  };
  useEffect(() => {
    if (!key) return;
    const state = { key, value: empty(), dirty: false, revision: 0 } as typeof ref.current;
    try { const cached = localStorage.getItem(cacheKey(key)); if (cached) { state.value = JSON.parse(cached); state.dirty = true; } } catch {}
    ref.current = state; setValue(state.value); setError(''); setSaving(false);
    let initialSeen = false;
    const unsubscribe = onSnapshot(doc(db, 'drafts', key), snapshot => {
      if (!state.dirty && !snapshot.metadata.hasPendingWrites) {
        state.value = snapshot.exists() ? { sessionSets: snapshot.data().sessionSets || {}, coachFeedback: snapshot.data().coachFeedback || '', finishRating: snapshot.data().finishRating || 5 } : empty();
        setValue(state.value);
      }
      setLoadedKey(key);
      if (!initialSeen && state.dirty) void persist(state).catch(() => {});
      initialSeen = true;
    }, () => { setLoadedKey(key); setError('No se pudo cargar el entrenamiento en curso. Reintentá antes de registrar cambios.'); });
    return () => { unsubscribe(); if (state.timer) clearTimeout(state.timer); if (state.dirty) void persist(state).catch(() => {}); };
  }, [key, user?.uid]);
  const change = <K extends keyof Draft>(field: K, next: React.SetStateAction<Draft[K]>) => {
    const state = ref.current;
    if (!key || state.key !== key || loadedKey !== key) return;
    state.value = { ...state.value, [field]: typeof next === 'function' ? (next as (v: Draft[K]) => Draft[K])(state.value[field]) : next };
    state.dirty = true; state.revision++; try { localStorage.setItem(cacheKey(key), JSON.stringify(state.value)); } catch {} setValue(state.value); setSaving(true);
    if (state.timer) clearTimeout(state.timer);
    state.timer = setTimeout(() => { void persist(state).catch(() => {}); }, 700);
  };
  return { ...value, loading: !!key && loadedKey !== key, saving, error, flush: () => persist(),
    setSessionSets: (next: React.SetStateAction<Sets>) => change('sessionSets', next),
    setCoachFeedback: (next: React.SetStateAction<string>) => change('coachFeedback', next),
    setFinishRating: (next: React.SetStateAction<number>) => change('finishRating', next),
  };
}
