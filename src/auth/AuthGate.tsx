import React, { useState } from 'react';
import { createUserWithEmailAndPassword, reload, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { logout, useAuth } from './AuthContext';
import { ActiveLogo } from '../components/brand/ActiveLogo';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, isCoach, error: permissionError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const run = async (action: () => Promise<unknown>, success = '') => {
    setBusy(true); setMessage('');
    try { await action(); setMessage(success); }
    catch (e: any) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'El correo o la contraseña no son correctos.',
        'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Ingresá o recuperá tu contraseña.',
        'auth/weak-password': 'Usá una contraseña de al menos 8 caracteres.',
        'auth/too-many-requests': 'Hubo demasiados intentos. Esperá unos minutos.',
        'auth/network-request-failed': 'No hay conexión. Volvé a intentarlo.',
      };
      setMessage(messages[e.code] || 'No pudimos completar la operación. Revisá los datos y la configuración de Firebase.');
    } finally { setBusy(false); }
  };
  if (!loading && user && (isCoach || user.emailVerified) && !permissionError) return <>{children}</>;
  return <main className="min-h-screen bg-zinc-50 flex items-center justify-center p-5 text-zinc-900">
    <section className="w-full max-w-md bg-white rounded-2xl border p-6 space-y-5 shadow-sm">
      <ActiveLogo variant="full" />
      {loading ? <p>Comprobando tu acceso…</p> : permissionError ? <><p role="alert">{permissionError}</p><button onClick={() => window.location.reload()}>Reintentar</button><button onClick={logout}>Cerrar sesión</button></> : user ? <>
        <h1 className="text-xl font-bold">Confirmá tu correo</h1>
        <p>Enviamos un enlace a {user.email}. Abrilo para acceder a tu planificación.</p>
        <button disabled={busy} className="w-full rounded-xl bg-orange-500 p-3 text-white" onClick={() => run(async () => { await reload(user); await user.getIdToken(true); }, 'Si todavía no ingresás, revisá que hayas abierto el enlace de verificación.')}>Ya confirmé mi correo</button>
        <button disabled={busy} onClick={() => run(() => sendEmailVerification(user), 'Correo enviado. Revisá también la carpeta de spam.')}>Reenviar verificación</button>
        <button className="block" onClick={logout}>Usar otra cuenta</button>
      </> : <>
        <h1 className="text-xl font-bold">{register ? 'Creá tu acceso' : 'Ingresá a Active'}</h1>
        <p className="text-sm text-zinc-600">Usá el correo que registró tu profe. Tu planificación y tus registros quedan vinculados a esa cuenta.</p>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); void run(async () => {
          if (register) { const result = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password); await sendEmailVerification(result.user); }
          else await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
        }); }}>
          <label className="block">Correo<input required type="email" autoComplete="email" className="block w-full rounded-lg border p-3 mt-1" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block">Contraseña<input required minLength={register ? 8 : undefined} type="password" autoComplete={register ? 'new-password' : 'current-password'} className="block w-full rounded-lg border p-3 mt-1" value={password} onChange={e => setPassword(e.target.value)} /></label>
          <button disabled={busy} className="w-full bg-orange-500 text-white rounded-xl p-3 font-bold">{busy ? 'Un momento…' : register ? 'Crear cuenta' : 'Ingresar'}</button>
        </form>
        <button disabled={busy} className="text-sm block" onClick={() => { setRegister(!register); setMessage(''); }}>{register ? 'Ya tengo cuenta' : 'Primera vez: crear mi acceso'}</button>
        <button disabled={busy || !email.trim()} className="text-sm block" onClick={() => run(() => sendPasswordResetEmail(auth, email.trim().toLowerCase()), 'Si hay una cuenta con ese correo, recibirás las instrucciones para recuperar el acceso.')}>Olvidé mi contraseña</button>
      </>}
      {message && <p role="status" className="text-sm bg-orange-50 rounded-lg p-3">{message}</p>}
    </section>
  </main>;
}
