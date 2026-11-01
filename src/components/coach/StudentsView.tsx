import React, { useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronDown,
  Dumbbell,
  Edit3,
  ExternalLink,
  LineChart,
  MessageSquare,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Share2,
  Sparkles,
  Trash2,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Routine, Student } from '../../types/gym';
import { INITIAL_ROUTINES } from '../../data/initialData';

export const StudentsView: React.FC = () => {
  const {
    students,
    routines,
    workoutLogs,
    addRoutine,
    addStudent,
    updateStudent,
    deleteStudent,
    removeDemoStudents,
    openStudentGymMode,
    setShareModalStudent,
    setProgressModalStudentId,
    setCoachTab,
    setEditingRoutineId,
  } = useGym();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoalFilter, setSelectedGoalFilter] = useState<string>('todos');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    pinCode: '1234',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    goal: 'Fuerza & Hipertrofia' as Student['goal'],
    level: 'Intermedio' as Student['level'],
    trainingDaysPerWeek: 2,
    currentProgramWeek: 1 as 1 | 2 | 3 | 4,
    injuriesOrLimitations: '',
    coachNotes: '',
    activeRoutineId: '',
  });

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      pinCode: Math.floor(1000 + Math.random() * 9000).toString(),
      avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 500000000)}?auto=format&fit=crop&w=250&q=80`,
      goal: 'Fuerza & Hipertrofia',
      level: 'Intermedio',
      trainingDaysPerWeek: 2,
      currentProgramWeek: 1,
      injuriesOrLimitations: '',
      coachNotes: '',
      activeRoutineId: routines[0]?.id || '',
    });
    setShowModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      pinCode: student.pinCode,
      avatarUrl: student.avatarUrl,
      goal: student.goal,
      level: student.level,
      trainingDaysPerWeek: student.trainingDaysPerWeek,
      currentProgramWeek: student.currentProgramWeek || 1,
      injuriesOrLimitations: student.injuriesOrLimitations,
      coachNotes: student.coachNotes,
      activeRoutineId: student.activeRoutineId,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStudent) {
      updateStudent({
        ...editingStudent,
        ...formData,
      });
    } else {
      addStudent(formData);
    }
    setShowModal(false);
  };

  // Quick assignment of pre-configured methodology routines directly to a student
  const handleAssignTemplateToStudent = (
    student: Student,
    templateType: 'fuerza_hipertrofia' | 'descenso_peso'
  ) => {
    const templateSource =
      routines.find((r) => r.methodologyType === templateType) ||
      INITIAL_ROUTINES.find((r) => r.methodologyType === templateType);

    if (!templateSource) return;

    // Create a personalized clone for this student
    const personalizedRoutine = addRoutine({
      ...JSON.parse(JSON.stringify(templateSource)),
      name: `${templateSource.name} - ${student.name}`,
      studentId: student.id,
      daysCount: templateSource.days.length,
      currentWeek: student.currentProgramWeek || 1,
    });

    updateStudent({
      ...student,
      activeRoutineId: personalizedRoutine.id,
    });

    setEditingRoutineId(personalizedRoutine.id);
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = selectedGoalFilter === 'todos' || s.goal === selectedGoalFilter;
    return matchesSearch && matchesGoal;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
              Mis Alumnos ({students.length})
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Gestiona a tus deportistas, asigna sus rutinas personalizadas y comparte sus accesos móviles directos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {students.some((s) => s.id === 'student-1' || s.id === 'student-2' || s.id === 'student-3') && (
            <button
              onClick={() => {
                if (
                  confirm(
                    '¿Deseas eliminar los alumnos de prueba creados por defecto (Lucas, Camila, Marcos) para quedarte únicamente con tus alumnos reales (ej. Rocío Zubiri)?'
                  )
                ) {
                  removeDemoStudents();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 border border-zinc-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Eliminar alumnos de demostración"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quitar Alumnos Demo</span>
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-[1.02] flex-shrink-0 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Registrar Nuevo Alumno
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['todos', 'Hipertrofia', 'Fuerza Máxima', 'Recomposición', 'Pérdida de Grasa'].map(
            (goal) => (
              <button
                key={goal}
                onClick={() => setSelectedGoalFilter(goal)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedGoalFilter === goal
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                {goal === 'todos' ? 'Todos los objetivos' : goal}
              </button>
            )
          )}
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudents.map((student) => {
          const routine = routines.find((r) => r.id === student.activeRoutineId);

          return (
            <div
              key={student.id}
              className="bg-white border border-zinc-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:border-orange-300 hover:shadow-md transition-all relative overflow-hidden group"
            >
              {/* Top Card Info */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={student.avatarUrl}
                      alt={student.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-zinc-200 shadow-2xs"
                    />
                    <div>
                      <h3 className="font-bold text-zinc-950 text-base leading-tight group-hover:text-orange-600 transition-colors">
                        {student.name}
                      </h3>
                      <span className="text-[11px] text-zinc-500 block mt-0.5">{student.email}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{student.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(student)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100 transition-colors text-xs font-semibold cursor-pointer"
                      title="Editar perfil"
                    >
                      Editar
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold border border-orange-200">
                    {student.goal}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs border border-zinc-200 font-medium">
                    {student.level}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs border border-zinc-200 font-medium">
                    {student.trainingDaysPerWeek} días/sem
                  </span>
                </div>

                {/* Assigned Routine Info */}
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-1 text-xs mb-3">
                  <div className="text-zinc-500 font-semibold flex items-center justify-between">
                    <span>Rutina Actual:</span>
                    {routine && (
                      <button
                        onClick={() => {
                          setEditingRoutineId(routine.id);
                          setCoachTab('builder');
                        }}
                        className="text-[11px] text-violet-700 font-bold hover:underline"
                      >
                        Abrir Planificador
                      </button>
                    )}
                  </div>
                  <div className="font-bold text-zinc-900">
                    {routine ? routine.name : 'Sin rutina asignada'}
                  </div>
                  {routine && (
                    <div className="text-[11px] text-zinc-500">
                      {routine.days.length} días estructurados •{' '}
                      {routine.days.reduce((acc, d) => acc + d.exercises.length, 0)} ejercicios con video
                    </div>
                  )}

                  {/* Quick Method Assignment and Edit Exercises */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-200">
                    <div className="relative group/tpl flex-1 min-w-[150px]">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-orange-600" />
                        <span>Cargar Método al Alumno</span>
                        <ChevronDown className="w-2.5 h-2.5 text-orange-600" />
                      </button>
                      <div className="absolute left-0 bottom-full mb-1.5 w-72 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-30 hidden group-hover/tpl:block hover:group-hover/tpl:block animate-fade-in text-zinc-900">
                        <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1 tracking-wider">
                          Asignar Plantilla Metodológica:
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAssignTemplateToStudent(student, 'fuerza_hipertrofia')}
                          className="w-full text-left p-2 rounded-xl hover:bg-zinc-50 transition-colors text-xs"
                        >
                          <div className="font-bold text-zinc-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            Método 1: Fuerza & Hipertrofia (4 sem)
                          </div>
                          <div className="text-[10px] text-zinc-500 leading-tight">
                            2 estímulos semanales con progresión 4 semanas
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAssignTemplateToStudent(student, 'descenso_peso')}
                          className="w-full text-left p-2 rounded-xl hover:bg-zinc-50 transition-colors text-xs mt-1 border-t border-zinc-100 pt-2"
                        >
                          <div className="font-bold text-zinc-950 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-violet-600" />
                            Método 2: Descenso de Peso (10"x20")
                          </div>
                          <div className="text-[10px] text-zinc-500 leading-tight">
                            1 pareja de fuerza + bloques intermitentes
                          </div>
                        </button>
                      </div>
                    </div>

                    {routine && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoutineId(routine.id);
                          setCoachTab('builder');
                        }}
                        className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-[11px] font-semibold transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer"
                        title="Editar ejercicios, series o videos de esta rutina"
                      >
                        <Edit3 className="w-3 h-3 text-orange-600" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Limitations / Injuries Alert */}
                {student.injuriesOrLimitations && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5 mb-3">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600" />
                    <span>{student.injuriesOrLimitations}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-zinc-200 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openStudentGymMode(student.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    title="Abrir como la ve el alumno"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-white" />
                    Ver Rutina en Vivo
                  </button>

                  <button
                    onClick={() => setShareModalStudent(student)}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    title="Compartir link directo con el alumno"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartir
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setProgressModalStudentId(student.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Ver gráfica Recharts de evolución de volumen y progresión"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
                    <span>Gráfica de Cargas</span>
                  </button>

                  <button
                    onClick={() => setCoachTab('history')}
                    className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    title="Ver historial de entrenamientos y mensajes"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-violet-600" />
                    <span>Feedback</span>
                    {workoutLogs.filter((l) => l.studentId === student.id && l.feedbackToCoach).length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`¿Estás seguro de eliminar a ${student.name}?`)) {
                        deleteStudent(student.id);
                      }
                    }}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar Alumno"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredStudents.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-zinc-200">
          <Users className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-zinc-800">No se encontraron alumnos</h3>
          <p className="text-xs text-zinc-500 mt-1">
            Intenta con otro término de búsqueda o crea uno nuevo.
          </p>
        </div>
      )}

      {/* Create / Edit Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-zinc-950 mb-4">
              {editingStudent ? 'Editar Ficha del Alumno' : 'Registrar Nuevo Alumno'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ej. Agustín Gómez"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Teléfono (para WhatsApp) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+54 9 11 1234-5678"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="alumno@gmail.com"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    PIN de Acceso
                  </label>
                  <input
                    type="text"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="1234"
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 font-mono focus:outline-none focus:border-orange-500 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Objetivo</label>
                  <select
                    value={formData.goal}
                    onChange={(e) =>
                      setFormData({ ...formData, goal: e.target.value as Student['goal'] })
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  >
                    <option value="Fuerza & Hipertrofia">Fuerza & Hipertrofia (4 Semanas)</option>
                    <option value="Descenso de Peso">Descenso de Peso (Intermitente)</option>
                    <option value="Rendimiento Funcional">Rendimiento Funcional</option>
                    <option value="Recomposición">Recomposición Corporal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Nivel</label>
                  <select
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({ ...formData, level: e.target.value as Student['level'] })
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Semana del Mes
                  </label>
                  <select
                    value={formData.currentProgramWeek}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currentProgramWeek: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4,
                      })
                    }
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 font-bold shadow-2xs"
                  >
                    <option value={1}>Semana 1 (Base 6 reps)</option>
                    <option value={2}>Semana 2 (+5kg 4 reps)</option>
                    <option value={3}>Semana 3 (Descarga 6 reps)</option>
                    <option value={4}>Semana 4 (+10kg 3 reps)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Rutina Personalizada Asignada
                </label>
                <select
                  value={formData.activeRoutineId}
                  onChange={(e) => setFormData({ ...formData, activeRoutineId: e.target.value })}
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                >
                  <option value="">-- Sin rutina asignada --</option>
                  {routines.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.days.length} días)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Lesiones o Limitaciones Físicas
                </label>
                <input
                  type="text"
                  value={formData.injuriesOrLimitations}
                  onChange={(e) =>
                    setFormData({ ...formData, injuriesOrLimitations: e.target.value })
                  }
                  placeholder="ej. Molestia en rodilla derecha al flexionar a más de 90°"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Notas Privadas del Entrenador
                </label>
                <textarea
                  rows={2}
                  value={formData.coachNotes}
                  onChange={(e) => setFormData({ ...formData, coachNotes: e.target.value })}
                  placeholder="Observaciones de progreso, antecedentes deportivos..."
                  className="w-full bg-white border border-zinc-300 rounded-xl p-2.5 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Guardar Cambios' : 'Crear Alumno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
