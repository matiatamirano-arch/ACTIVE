import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export const OWNER_UID = 'vgh76zcWT2cmLeSVK7hpdMOMvNn2';
const AuthContext = createContext<{ user: User | null; loading: boolean; isCoach: boolean; error: string }>({ user: null, loading: true, isCoach: false, error: '' });
export const useAuth = () => useContext(AuthContext);
export const logout = () => signOut(auth);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ user: null as User | null, loading: true, isCoach: false, error: '' });
  useEffect(() => {
    let generation = 0;
    const unsubscribe = onIdTokenChanged(auth, async user => {
      const current = ++generation;
      setState({ user, loading: true, isCoach: false, error: '' });
      let isCoach = user?.uid === OWNER_UID;
      let error = '';
      if (user && !isCoach && user.emailVerified) {
        try { isCoach = (await getDoc(doc(db, 'coaches', user.uid))).exists(); }
        catch { error = 'No pudimos comprobar tus permisos. Revisá la conexión y las reglas de acceso.'; }
      }
      if (current === generation) setState({ user, loading: false, isCoach, error });
    });
    return () => { generation++; unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
