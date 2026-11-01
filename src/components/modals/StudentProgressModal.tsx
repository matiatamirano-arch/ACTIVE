import React from 'react';
import { LineChart, TrendingUp, X } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { VolumeEvolutionChart } from '../student/VolumeEvolutionChart';

export const StudentProgressModal: React.FC = () => {
  const { progressModalStudentId, setProgressModalStudentId, students } = useGym();

  if (!progressModalStudentId) return null;

  const student = students.find((s) => s.id === progressModalStudentId);
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-900 max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <img
              src={student.avatarUrl}
              alt={student.name}
              className="w-10 h-10 rounded-xl object-cover border border-zinc-200 shadow-2xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-zinc-950">{student.name}</h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  {student.goal}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Gráfica de evolución de volumen (kg × reps) y progresión de cargas
              </p>
            </div>
          </div>

          <button
            onClick={() => setProgressModalStudentId(null)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 transition-colors cursor-pointer"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: VolumeEvolutionChart */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <VolumeEvolutionChart studentId={student.id} />
        </div>
      </div>
    </div>
  );
};
