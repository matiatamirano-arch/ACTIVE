import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { INITIAL_ROUTINES } from '../src/data/initialData';

process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
initializeApp({ projectId: 'demo-active' });
const auth = getAuth(); const db = getFirestore();
const password = 'Emulator-test-only-937!';
await auth.createUser({ uid: 'vgh76zcWT2cmLeSVK7hpdMOMvNn2', email: 'owner@example.com', password });
await auth.createUser({ uid: 'ui-alice', email: 'alice@example.com', password, emailVerified: true });
await auth.createUser({ uid: 'ui-bob', email: 'bob@example.com', password, emailVerified: true });
const routine = JSON.parse(JSON.stringify({ ...INITIAL_ROUTINES[0], id: 'ui-routine', studentId: 'ui-alice-student', name: 'Rutina para Alice' }));
await db.doc('students/ui-alice-student').set({ id: 'ui-alice-student', slug: 'ui-alice-student', name: 'Alice de prueba', email: 'alice@example.com', pinCode: '', phone: '', avatarUrl: '', goal: 'Fuerza & Hipertrofia', level: 'Principiante', currentProgramWeek: 1, activeRoutineId: routine.id, trainingDaysPerWeek: 2, injuriesOrLimitations: '', coachNotes: '', joinDate: '2026-11-01' });
await db.doc('routines/' + routine.id).set(routine);
const server = spawn('npm', ['run', 'dev', '--', '--port', '3100', '--host', '127.0.0.1', '--strictPort'], { env: { ...process.env, VITE_USE_FIREBASE_EMULATORS: 'true' }, stdio: 'ignore' });
let browser;
try {
  for (let i=0; i<100; i++) { try { if ((await fetch('http://127.0.0.1:3100')).ok) break; } catch {} await new Promise(r => setTimeout(r,100)); }
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  async function login(email: string, suffix = '') {
    await page.goto('http://127.0.0.1:3100/' + suffix);
    await page.getByLabel('Correo', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  }
  await login('owner@example.com');
  await page.getByRole('heading', { name: 'Mis Alumnos (1)' }).waitFor();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await login('alice@example.com', '?alumno=another-student&d=legacy-secret');
  await page.getByText('Alice de prueba', { exact: true }).first().waitFor();
  assert(!page.url().includes('legacy-secret'));
  assert.equal(await page.getByRole('button', { name: 'Acceso Profesor' }).count(), 0);
  assert.equal(await page.getByRole('heading', { name: /Mis Alumnos/ }).count(), 0);
  // The same link receives a coach's changed day label without a page reload.
  routine.days[0].dayName = 'Plan actualizado en vivo';
  await db.doc('routines/' + routine.id).set(routine);
  await page.getByText('Plan actualizado en vivo', { exact: false }).first().waitFor();
  await page.getByRole('heading', { name: '2) Fuerza', exact: true }).click();
  await page.locator('input[type=number][step="0.5"]').first().fill('27.5');
  await page.locator('input[type=number]').nth(1).fill('9');
  const draftId = ['ui-alice-student', routine.id, 1, routine.days[0].id].join('_');
  async function waitForDocument(path: string, predicate: (data: any) => boolean) {
    for (let i=0; i<80; i++) { const snapshot = await db.doc(path).get(); if (snapshot.exists && predicate(snapshot.data())) return snapshot.data(); await new Promise(r => setTimeout(r,100)); }
    throw new Error('Document did not synchronize: ' + path);
  }
  await waitForDocument('drafts/' + draftId, data => Object.values(data.sessionSets).some((sets: any) => sets[0]?.actualWeight === 27.5 && sets[0]?.actualReps === 9));
  await page.reload();
  await page.getByRole('heading', { name: '2) Fuerza', exact: true }).click();
  assert.equal(await page.locator('input[type=number][step="0.5"]').first().inputValue(), '27.5');
  await page.getByRole('button', { name: /Pasar a Etapa 3:/ }).click();
  await page.getByRole('button', { name: 'Finalizar Entrenamiento', exact: true }).click();
  await page.locator('textarea').fill('Comentario guardado de prueba');
  await waitForDocument('drafts/' + draftId, data => data.coachFeedback === 'Comentario guardado de prueba');
  await page.getByRole('button', { name: 'Guardar y enviar al profe', exact: true }).click();
  await waitForDocument('logs/' + draftId, data => data.feedbackToCoach === 'Comentario guardado de prueba');
  await page.getByRole('button', { name: 'Cerrar', exact: true }).click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await login('bob@example.com', '?alumno=ui-alice-student');
  await page.getByRole('heading', { name: 'Todavía no tenés una planificación vinculada' }).waitFor();
  assert.equal(await page.getByText('Alice de prueba', { exact: true }).count(), 0);
  assert.deepEqual(errors, []);
  console.log('UI smoke passed: owner login, isolated student, legacy URL cleanup, live planning update, draft persistence after reload, weight/repetition/comment sync, completed session, unmatched email.');
} finally { await browser?.close(); server.kill('SIGTERM'); }
