import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  Award,
  Calendar,
  ChevronRight,
  Dumbbell,
  Filter,
  Flame,
  Layers,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { WorkoutSessionLog } from '../../types/gym';

interface VolumeEvolutionChartProps {
  studentId?: string;
}

export const VolumeEvolutionChart: React.FC<VolumeEvolutionChartProps> = ({ studentId }) => {
  const { workoutLogs, activeStudent } = useGym();
  const currentStudentId = studentId || activeStudent?.id;

  const [selectedExerciseFilter, setSelectedExerciseFilter] = useState<string>('todos');
  const [chartViewMode, setChartViewMode] = useState<'timeline' | 'weekly'>('timeline');

  // Filter logs for this student
  const studentLogs = useMemo(() => {
    return workoutLogs
      .filter((l) => l.studentId === currentStudentId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [workoutLogs, currentStudentId]);

  // Extract all distinct exercises logged by this student
  const uniqueExercises = useMemo(() => {
    const set = new Set<string>();
    studentLogs.forEach((log) => {
      log.completedExercises.forEach((ex) => {
        if (ex.exerciseName) set.add(ex.exerciseName);
      });
    });
    return Array.from(set);
  }, [studentLogs]);

  // Prepare chart data points
  const chartData = useMemo(() => {
    return studentLogs.map((log, index) => {
      const dateObj = new Date(log.date);
      const formattedDate = dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      });

      let calculatedVolume = 0;
      let exerciseMaxWeight = 0;
      let totalRepsDone = 0;

      if (selectedExerciseFilter === 'todos') {
        calculatedVolume = log.totalVolumeKg || 0;
        // Fallback calculation if not stored
        if (calculatedVolume === 0) {
          log.completedExercises.forEach((ex) => {
            ex.sets.forEach((s) => {
              if (s.completed) {
                calculatedVolume += (s.actualWeight || 0) * (s.actualReps || 0);
                totalRepsDone += s.actualReps || 0;
              }
            });
          });
        }
      } else {
        const foundEx = log.completedExercises.find(
          (e) => e.exerciseName === selectedExerciseFilter
        );
        if (foundEx) {
          foundEx.sets.forEach((s) => {
            if (s.completed) {
              calculatedVolume += (s.actualWeight || 0) * (s.actualReps || 0);
              totalRepsDone += s.actualReps || 0;
              if (s.actualWeight > exerciseMaxWeight) exerciseMaxWeight = s.actualWeight;
            }
          });
        }
      }

      return {
        sessionIndex: index + 1,
        sessionName: `Sesión ${index + 1}`,
        date: formattedDate,
        fullDate: dateObj.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        dayName: log.dayName,
        weekName: `Semana ${log.programWeek || Math.min(4, Math.floor(index / 2) + 1)}`,
        programWeek: log.programWeek || Math.min(4, Math.floor(index / 2) + 1),
        volumenKg: calculatedVolume,
        pesoMaximo: exerciseMaxWeight,
        repeticiones: totalRepsDone,
      };
    });
  }, [studentLogs, selectedExerciseFilter]);

  // Weekly aggregated data for the 4-week progression
  const weeklyData = useMemo(() => {
    const weeks: Record<number, { week: number; name: string; totalVolume: number; sessionsCount: number }> = {
      1: { week: 1, name: 'Semana 1 (Base 6 reps)', totalVolume: 0, sessionsCount: 0 },
      2: { week: 2, name: 'Semana 2 (+5kg 4 reps)', totalVolume: 0, sessionsCount: 0 },
      3: { week: 3, name: 'Semana 3 (Descarga 6 reps)', totalVolume: 0, sessionsCount: 0 },
      4: { week: 4, name: 'Semana 4 (+10kg 3 reps)', totalVolume: 0, sessionsCount: 0 },
    };

    chartData.forEach((d) => {
      const w = d.programWeek;
      if (weeks[w]) {
        weeks[w].totalVolume += d.volumenKg;
        weeks[w].sessionsCount += 1;
      }
    });

    return Object.values(weeks);
  }, [chartData]);

  // Summary Metrics
  const totalAccumulatedVolume = chartData.reduce((acc, d) => acc + d.volumenKg, 0);
  const maxSessionVolume = chartData.reduce((max, d) => Math.max(max, d.volumenKg), 0);
  const averageVolume = chartData.length > 0 ? Math.round(totalAccumulatedVolume / chartData.length) : 0;

  // Progression delta: compare week 1 volume to week 4 or latest
  const firstVolume = chartData[0]?.volumenKg || 0;
  const lastVolume = chartData[chartData.length - 1]?.volumenKg || 0;
  const volumeGrowthPercent = firstVolume > 0 ? Math.round(((lastVolume - firstVolume) / firstVolume) * 100) : 0;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-6 text-zinc-900">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-zinc-950 uppercase tracking-tight">
                Evolución del Volumen de Carga (kg × reps)
              </h3>
              <p className="text-xs text-zinc-500">
                Seguimiento científico de sobrecarga progresiva y tonelaje levantado
              </p>
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 self-start sm:self-auto">
          <button
            onClick={() => setChartViewMode('timeline')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              chartViewMode === 'timeline'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Línea Temporal
          </button>
          <button
            onClick={() => setChartViewMode('weekly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              chartViewMode === 'weekly'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Por Semanas (1 a 4)
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
            Volumen Total Acumulado
          </span>
          <div className="text-lg sm:text-xl font-black text-orange-600 font-mono">
            {totalAccumulatedVolume.toLocaleString()} <span className="text-xs text-zinc-500 font-sans">kg</span>
          </div>
          <span className="text-[11px] text-zinc-500 block">
            {chartData.length} sesiones completadas
          </span>
        </div>

        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
            Récord Máximo de Sesión
          </span>
          <div className="text-lg sm:text-xl font-black text-zinc-950 font-mono">
            {maxSessionVolume.toLocaleString()} <span className="text-xs text-zinc-500 font-sans">kg</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <Award className="w-3 h-3" /> Mayor tonelaje
          </span>
        </div>

        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
            Promedio por Sesión
          </span>
          <div className="text-lg sm:text-xl font-black text-zinc-950 font-mono">
            {averageVolume.toLocaleString()} <span className="text-xs text-zinc-500 font-sans">kg</span>
          </div>
          <span className="text-[11px] text-zinc-500 block">
            Carga media de trabajo
          </span>
        </div>

        <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
            Sobrecarga Progresiva
          </span>
          <div className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
            {volumeGrowthPercent >= 0 ? `+${volumeGrowthPercent}%` : `${volumeGrowthPercent}%`}
          </div>
          <span className="text-[11px] text-zinc-500 block">
            Progreso Semana 1 a 4
          </span>
        </div>
      </div>

      {/* Exercise Filter Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-semibold text-zinc-700">Filtrar por Ejercicio:</span>
          <select
            value={selectedExerciseFilter}
            onChange={(e) => setSelectedExerciseFilter(e.target.value)}
            className="bg-white border border-zinc-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-medium focus:outline-none focus:border-orange-500 shadow-2xs"
          >
            <option value="todos">Todos los ejercicios (Volumen global de sesión)</option>
            {uniqueExercises.map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] text-zinc-500 font-mono">
          Fórmula: Volumen (kg) = Σ (Peso kg × Repeticiones válidas)
        </div>
      </div>

      {/* Main Recharts Area Chart */}
      <div className="h-72 sm:h-80 w-full pt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 border border-dashed border-zinc-200 bg-zinc-50/50 rounded-xl">
            <Dumbbell className="w-10 h-10 mb-2 opacity-40 text-orange-500" />
            <p className="text-xs font-semibold text-zinc-700">Aún no hay registros de carga para este alumno.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Al finalizar una sesión de entrenamiento, los datos de peso y repeticiones se graficarán aquí.
            </p>
          </div>
        ) : chartViewMode === 'timeline' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#d4d4d8' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#d4d4d8' }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} kg`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-zinc-200 p-3 rounded-xl shadow-xl text-xs space-y-1 text-zinc-900">
                        <div className="font-bold text-zinc-950 flex items-center justify-between gap-3">
                          <span>{data.fullDate}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold border border-orange-200">
                            {data.weekName}
                          </span>
                        </div>
                        <div className="text-zinc-600 text-[11px] truncate max-w-[220px]">
                          {data.dayName}
                        </div>
                        <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between gap-4">
                          <span className="text-zinc-600">Volumen Levantado:</span>
                          <span className="font-mono font-bold text-orange-600 text-sm">
                            {data.volumenKg?.toLocaleString()} kg
                          </span>
                        </div>
                        {selectedExerciseFilter !== 'todos' && data.pesoMaximo > 0 && (
                          <div className="flex items-center justify-between gap-4 text-[11px] text-zinc-600">
                            <span>Carga máxima:</span>
                            <span className="font-bold text-zinc-950">{data.pesoMaximo} kg</span>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="volumenKg"
                name="Volumen de Carga (kg)"
                stroke="#ea580c"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#volumeGradient)"
                activeDot={{ r: 6, fill: '#ea580c', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          /* Weekly Comparison Bar Chart */
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#d4d4d8' }}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#d4d4d8' }}
                tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val} kg`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-zinc-200 p-3 rounded-xl shadow-xl text-xs space-y-1 text-zinc-900">
                        <div className="font-bold text-zinc-950">{data.name}</div>
                        <div className="pt-1 flex items-center justify-between gap-4">
                          <span className="text-zinc-600">Volumen Semanal:</span>
                          <span className="font-mono font-bold text-orange-600 text-sm">
                            {data.totalVolume?.toLocaleString()} kg
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {data.sessionsCount} sesiones completadas en esta semana
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="totalVolume"
                name="Volumen Semanal (kg)"
                fill="#f97316"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Methodological Progression Badge */}
      <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0" />
          <span className="text-zinc-700">
            <strong className="text-zinc-950">Progresión del Mes:</strong> Semana 1 (6 reps) → Semana 2 (+5kg, 4 reps) → Semana 3 (Descarga, 6 reps) → Semana 4 (+10kg, 3 reps).
          </span>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto text-zinc-600 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-orange-500" /> Pausas de 2 min obligatorias
        </div>
      </div>
    </div>
  );
};
