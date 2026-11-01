import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  History,
  MessageSquare,
  Search,
  Star,
  TrendingUp,
  User,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';

export const WorkoutHistoryView: React.FC = () => {
  const { workoutLogs, students } = useGym();
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('todos');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [onlyFeedbackFilter, setOnlyFeedbackFilter] = useState(false);

  const filteredLogs = workoutLogs.filter((log) => {
    if (selectedStudentFilter !== 'todos' && log.studentId !== selectedStudentFilter) {
      return false;
    }
    if (onlyFeedbackFilter && !log.feedbackToCoach) {
      return false;
    }
    return true;
  });

  const feedbackLogsCount = workoutLogs.filter((l) => l.feedbackToCoach).length;

  // Calculate cumulative stats
  const totalKgAllSessions = workoutLogs.reduce((acc, l) => acc + (l.totalVolumeKg || 0), 0);
  const totalSessionsCount = workoutLogs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
              Historial de Entrenamientos y Feedback
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Revisa las sesiones que completaron tus alumnos en el gimnasio, sus cargas reales levantadas, RIR y mensajes directos.
          </p>
        </div>

        {/* Global Summary Stats */}
        <div className="flex items-center gap-4 bg-white border border-zinc-200 px-4 py-2.5 rounded-2xl shadow-2xs">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
              Sesiones Registradas
            </span>
            <span className="text-lg font-black text-zinc-950">{totalSessionsCount}</span>
          </div>
          <div className="h-8 w-px bg-zinc-200" />
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
              Volumen Total
            </span>
            <span className="text-lg font-black text-orange-600 font-mono">
              {totalKgAllSessions.toLocaleString()} kg
            </span>
          </div>
        </div>
      </div>

      {/* Filter by student and feedback toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          <button
            onClick={() => setSelectedStudentFilter('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStudentFilter === 'todos'
                ? 'bg-orange-500 text-white font-bold shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Todos los alumnos ({workoutLogs.length})
          </button>
          {students.map((st) => {
            const count = workoutLogs.filter((l) => l.studentId === st.id).length;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedStudentFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 cursor-pointer ${
                  selectedStudentFilter === st.id
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                <img src={st.avatarUrl} alt={st.name} className="w-4 h-4 rounded-full object-cover" />
                <span>{st.name}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Feedback-only toggle button */}
        <button
          onClick={() => setOnlyFeedbackFilter(!onlyFeedbackFilter)}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
            onlyFeedbackFilter
              ? 'bg-violet-600 text-white shadow-xs'
              : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Solo con Mensajes / Feedback ({feedbackLogsCount})</span>
        </button>
      </div>

      {/* Logs list */}
      <div className="space-y-4">
        {filteredLogs.map((log) => {
          const student = students.find((s) => s.id === log.studentId);
          const isExpanded = expandedLogId === log.id;
          const dateFormatted = new Date(log.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={log.id}
              className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs transition-all hover:border-orange-300"
            >
              {/* Header */}
              <div
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={student?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                    alt={student?.name || 'Alumno'}
                    className="w-12 h-12 rounded-2xl object-cover border border-zinc-200"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-zinc-950 text-base">
                        {student ? student.name : 'Alumno'}
                      </h3>
                      <span className="text-xs text-orange-600 font-semibold">
                        • {log.routineName}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-700 font-semibold mt-0.5">{log.dayName}</div>
                    <div className="text-[11px] text-zinc-500 capitalize">{dateFormatted}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                      Volumen Sesión
                    </span>
                    <span className="text-sm font-bold font-mono text-orange-600">
                      {log.totalVolumeKg?.toLocaleString()} kg
                    </span>
                  </div>

                  {log.studentRating && (
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                        Sensación
                      </span>
                      <span className="text-amber-500 font-bold text-sm">
                        {'★'.repeat(log.studentRating)}
                      </span>
                    </div>
                  )}

                  <div className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              {/* Feedback box */}
              {log.feedbackToCoach && (
                <div className="px-5 pb-3">
                  <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-zinc-800 space-y-2">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-orange-800 font-bold">Mensaje del alumno al terminar: </span>
                        <span className="italic text-zinc-900">"{log.feedbackToCoach}"</span>
                      </div>
                    </div>

                    {student?.phone && (
                      <div className="pl-6 pt-1">
                        <a
                          href={`https://api.whatsapp.com/send?phone=${student.phone.replace(
                            /[^0-9]/g,
                            ''
                          )}&text=${encodeURIComponent(
                            `¡Hola ${student.name}! 💪 Vi tu feedback de la sesión en Active Functional ("${log.feedbackToCoach}"). ¡Excelente trabajo! Te comento:...`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shadow-2xs"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Responder por WhatsApp a {student.name.split(' ')[0]}</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Detailed sets dropdown */}
              {isExpanded && (
                <div className="p-5 pt-3 border-t border-zinc-200 bg-zinc-50 space-y-4 animate-fade-in">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                    Desglose de Ejercicios y Series Realizadas
                  </h4>

                  <div className="space-y-3">
                    {log.completedExercises.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-xl border border-zinc-200 space-y-2 text-xs shadow-2xs"
                      >
                        <div className="font-bold text-zinc-950 flex items-center gap-2">
                          <span className="text-zinc-400 font-mono">#{idx + 1}</span>
                          <span>{ex.exerciseName}</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {ex.sets.map((s, sIdx) => (
                            <div
                              key={sIdx}
                              className={`p-2 rounded-lg border ${
                                s.completed
                                  ? 'bg-orange-50/60 border-orange-200 text-zinc-800'
                                  : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                              }`}
                            >
                              <div className="font-semibold text-[11px] text-zinc-500">
                                Set {s.setNumber}:
                              </div>
                              <div className="font-bold text-zinc-950 font-mono">
                                {s.actualWeight} kg × {s.actualReps} reps
                              </div>
                              {s.actualRir !== undefined && (
                                <div className="text-[10px] text-orange-600 font-mono font-semibold">
                                  RIR {s.actualRir}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredLogs.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-zinc-200 shadow-2xs">
          <History className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-900">Aún no hay sesiones registradas</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Cuando tus alumnos entrenen desde su enlace o entres en la Vista Alumno y toques "Finalizar Entrenamiento", verás aquí todos sus registros.
          </p>
        </div>
      )}
    </div>
  );
};
