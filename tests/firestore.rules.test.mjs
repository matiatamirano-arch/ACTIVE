import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';

let env;
const ownerUid = 'vgh76zcWT2cmLeSVK7hpdMOMvNn2';
const student = { id: 'alice', email: 'alice@example.com', pinCode: '', activeRoutineId: 'routine-a' };
const session = { id: 'alice_routine-a_1_day-1', studentId: 'alice', routineId: 'routine-a', routineName: 'A', dayId: 'day-1', dayName: 'Día 1', programWeek: 1, date: new Date().toISOString(), durationMinutes: 45, completedExercises: [], studentRating: 5, feedbackToCoach: 'Bien', totalVolumeKg: 120 };
const draft = { studentId: 'alice', routineId: 'routine-a', dayId: 'day-1', week: 1, updatedAt: new Date().toISOString(), sessionSets: {}, coachFeedback: 'Bien', finishRating: 5 };
const alice = () => env.authenticatedContext('alice-uid', { email: 'alice@example.com', email_verified: true }).firestore();
const bob = () => env.authenticatedContext('bob-uid', { email: 'bob@example.com', email_verified: true }).firestore();
before(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-active', firestore: { rules: await readFile('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 } });
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'students', 'alice'), student);
    await setDoc(doc(db, 'students', 'bob'), { ...student, id: 'bob', email: 'bob@example.com', activeRoutineId: 'routine-b' });
    await setDoc(doc(db, 'routines', 'routine-a'), { id: 'routine-a', studentId: 'alice' });
    await setDoc(doc(db, 'routines', 'routine-b'), { id: 'routine-b', studentId: 'bob' });
    await setDoc(doc(db, 'drafts', 'alice_routine-a_1_day-1'), draft);
  });
});
after(async () => { await env?.cleanup(); });
test('anonymous and unverified accounts cannot read student information', async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'students', 'alice')));
  await assertFails(getDoc(doc(env.authenticatedContext('unverified', { email: student.email, email_verified: false }).firestore(), 'students', 'alice')));
});
test('student can query only their own email and read their own routine', async () => {
  await assertSucceeds(getDocs(query(collection(alice(), 'students'), where('email', '==', student.email))));
  await assertFails(getDocs(collection(alice(), 'students')));
  await assertFails(getDoc(doc(alice(), 'students', 'bob')));
  await assertSucceeds(getDocs(query(collection(alice(), 'routines'), where('studentId', '==', 'alice'))));
  await assertFails(getDoc(doc(alice(), 'routines', 'routine-b')));
});
test('student cannot edit planning, profiles, or grant coach permissions', async () => {
  await assertFails(updateDoc(doc(alice(), 'routines', 'routine-a'), { name: 'changed' }));
  await assertFails(updateDoc(doc(alice(), 'students', 'alice'), { email: 'other@example.com' }));
  await assertFails(setDoc(doc(alice(), 'coaches', 'alice-uid'), { enabled: true }));
});
test('student saves and updates their own session, without changing ownership', async () => {
  await assertSucceeds(setDoc(doc(alice(), 'logs', session.id), session));
  await assertSucceeds(updateDoc(doc(alice(), 'logs', session.id), { feedbackToCoach: 'Actualizado' }));
  await assertFails(updateDoc(doc(alice(), 'logs', session.id), { studentId: 'bob' }));
  await assertFails(setDoc(doc(alice(), 'logs', 'forged'), { ...session, id: 'forged', studentId: 'bob', routineId: 'routine-b' }));
  await assertFails(setDoc(doc(alice(), 'logs', 'wrong-routine'), { ...session, id: 'wrong-routine', routineId: 'routine-b' }));
  await assertFails(getDoc(doc(bob(), 'logs', session.id)));
});
test('drafts are private and writable only for own student and routine', async () => {
  await assertSucceeds(getDoc(doc(alice(), 'drafts', 'alice_routine-a_1_day-1')));
  await assertSucceeds(setDoc(doc(alice(), 'drafts', 'alice_routine-a_1_day-1'), { ...draft, coachFeedback: 'Otra nota' }));
  await assertFails(getDoc(doc(bob(), 'drafts', 'alice_routine-a_1_day-1')));
  await assertFails(updateDoc(doc(alice(), 'drafts', 'alice_routine-a_1_day-1'), { studentId: 'bob' }));
  await assertFails(setDoc(doc(alice(), 'drafts', 'wrong'), { ...draft, routineId: 'routine-b' }));
  await assertSucceeds(getDoc(doc(alice(), 'drafts', 'not-yet-created')));
});
test('student cannot occupy another session identifier', async () => {
  await assertFails(setDoc(doc(alice(), 'drafts', 'bob_routine-b_1_day-1'), draft));
  await assertFails(setDoc(doc(alice(), 'logs', 'bob_routine-b_1_day-1'), { ...session, id: 'bob_routine-b_1_day-1' }));
});
test('malformed logs are rejected', async () => {
  await assertFails(setDoc(doc(alice(), 'logs', 'bad'), { ...session, id: 'bad', totalVolumeKg: -1 }));
  await assertFails(setDoc(doc(alice(), 'logs', 'bad'), { ...session, id: 'bad', admin: true }));
});
test('owner can administer and delegated coach can manage without granting more access', async () => {
  const owner = env.authenticatedContext(ownerUid).firestore();
  await assertSucceeds(getDocs(collection(owner, 'students')));
  await assertSucceeds(setDoc(doc(owner, 'coaches', 'coach-uid'), { name: 'Profe' }));
  const coach = env.authenticatedContext('coach-uid', { email: 'coach@example.com', email_verified: true }).firestore();
  await assertSucceeds(getDocs(collection(coach, 'students')));
  await assertSucceeds(updateDoc(doc(coach, 'routines', 'routine-a'), { name: 'Plan del profe' }));
  await assertFails(setDoc(doc(coach, 'coaches', 'another'), { name: 'Otro' }));
});
