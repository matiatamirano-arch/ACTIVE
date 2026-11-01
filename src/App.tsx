import React from 'react';
import { Header } from './components/Header';
import { ExerciseBankView } from './components/coach/ExerciseBankView';
import { MethodologyView } from './components/coach/MethodologyView';
import { RoutineBuilder } from './components/coach/RoutineBuilder';
import { StudentsView } from './components/coach/StudentsView';
import { WorkoutHistoryView } from './components/coach/WorkoutHistoryView';
import { ShareModal } from './components/modals/ShareModal';
import { StudentProgressModal } from './components/modals/StudentProgressModal';
import { VideoModal } from './components/modals/VideoModal';
import { StudentGymPortal } from './components/student/StudentGymPortal';
import { GymProvider, useGym } from './context/GymContext';

const AppContent: React.FC = () => {
  const { mode, coachTab, shareModalStudent, setShareModalStudent } = useGym();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header */}
      <Header />

      {/* Main Mode View */}
      {mode === 'student' ? (
        <StudentGymPortal />
      ) : (
        <main className="pb-16">
          {coachTab === 'students' && <StudentsView />}
          {coachTab === 'builder' && <RoutineBuilder />}
          {coachTab === 'methodology' && <MethodologyView />}
          {coachTab === 'exercises' && <ExerciseBankView />}
          {coachTab === 'history' && <WorkoutHistoryView />}
        </main>
      )}

      {/* Global Modals */}
      <VideoModal />
      <StudentProgressModal />
      {shareModalStudent && (
        <ShareModal student={shareModalStudent} onClose={() => setShareModalStudent(null)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <GymProvider>
      <AppContent />
    </GymProvider>
  );
}
