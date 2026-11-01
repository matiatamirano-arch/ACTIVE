import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  ChevronDown,
  Database,
  Dumbbell,
  History,
  Lock,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  User,
  Users,
  Video,
} from 'lucide-react';
import { ActiveLogo } from './brand/ActiveLogo';
import { CoachTab, useGym } from '../context/GymContext';

export const Header: React.FC = () => {
  const {
    mode,
    setMode,
    coachTab,
    setCoachTab,
    students,
    activeStudentId,
    setActiveStudentId,
    activeStudent,
    methodology,
    setShareModalStudent,
    exportBackupJSON,
    importBackupJSON,
    resetAllData,
    isStudentIsolated,
    openCoachMode,
  } = useGym();

  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const handleDownloadBackup = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `active-functional-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowBackupMenu(false);
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importBackupJSON(content);
        if (success) {
          alert('¡Copia de seguridad importada con éxito!');
        } else {
          alert('Error al leer el archivo JSON de copia de seguridad.');
        }
      }
    };
    reader.readAsText(file);
    setShowBackupMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 text-zinc-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Gym Branding */}
          <div className="flex items-center gap-3">
            <ActiveLogo variant="full" />
            <div className="hidden lg:block border-l border-zinc-200 pl-3">
              <ActiveLogo variant="stamp" />
            </div>
          </div>

          {/* If accessed via Student Private Link, show isolated student identity */}
          {isStudentIsolated ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200">
                {activeStudent && (
                  <img
                    src={activeStudent.avatarUrl}
                    alt={activeStudent.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                )}
                <span className="text-xs font-bold text-orange-950">
                  {activeStudent ? activeStudent.name : 'Alumno'}
                </span>
                <span className="hidden sm:inline text-[10px] text-zinc-500 font-medium">
                  • Tu Rutina Personalizada
                </span>
              </div>


            </div>
          ) : (
            <>
              {/* Center Mode Switcher: Coach vs Student */}
              <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                <button
                  onClick={() => setMode('coach')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'coach'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Panel</span> Entrenador
                </button>
                <button
                  onClick={() => setMode('student')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'student'
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Vista</span> Alumno
                </button>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                {/* Student Picker (fast switch) */}
                <div className="relative">
                  <button
                    onClick={() => setShowStudentPicker(!showStudentPicker)}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-xs text-zinc-800 transition-colors cursor-pointer"
                    title="Cambiar Alumno Activo"
                  >
                    {activeStudent && (
                      <img
                        src={activeStudent.avatarUrl}
                        alt={activeStudent.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="font-semibold text-zinc-900 max-w-[80px] sm:max-w-[120px] truncate">
                      {activeStudent ? activeStudent.name : 'Alumnos'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  </button>

                  {showStudentPicker && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2 z-50 animate-fade-in text-xs">
                      <div className="px-2 py-1.5 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                        Seleccionar Alumno
                      </div>
                      <div className="space-y-1">
                        {students.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => {
                              setActiveStudentId(st.id);
                              setShowStudentPicker(false);
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                              st.id === activeStudentId
                                ? 'bg-orange-50 text-orange-700 font-bold border border-orange-200'
                                : 'hover:bg-zinc-100 text-zinc-700'
                            }`}
                          >
                            <img
                              src={st.avatarUrl}
                              alt={st.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{st.name}</div>
                              <div className="text-[10px] text-zinc-500 truncate">{st.goal}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Share button for the active student */}
                {activeStudent && (
                  <button
                    onClick={() => setShareModalStudent(activeStudent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02] cursor-pointer"
                    title="Compartir link directo con el alumno"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Compartir</span>
                  </button>
                )}

                {/* Settings & Backup Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowBackupMenu(!showBackupMenu)}
                    className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
                    title="Copia de seguridad y configuración"
                  >
                    <Database className="w-4 h-4" />
                  </button>

                  {showBackupMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl p-2.5 z-50 animate-fade-in text-xs space-y-1">
                      <div className="px-2 py-1 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                        Gestión de Datos
                      </div>
                      <button
                        onClick={handleDownloadBackup}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-100 text-zinc-700 flex items-center gap-2 cursor-pointer"
                      >
                        <Database className="w-3.5 h-3.5 text-orange-500" />
                        Descargar Copia de Seguridad (JSON)
                      </button>

                      <label className="w-full text-left px-3 py-2 rounded-xl hover:bg-zinc-100 text-zinc-700 flex items-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-violet-600" />
                        Importar Copia de Seguridad
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleUploadBackup}
                          className="hidden"
                        />
                      </label>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              '¿Restablecer datos demo iniciales? Se sobrescribirán los cambios no guardados.'
                            )
                          ) {
                            resetAllData();
                            setShowBackupMenu(false);
                          }
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                      >
                        Restablecer Datos de Demostración
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Coach Tabs Subnavigation (visible only in Coach mode) */}
        {mode === 'coach' && (
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 border-t border-zinc-200 scrollbar-none">
            {[
              { id: 'students', label: 'Alumnos', icon: Users, count: students.length },
              { id: 'builder', label: 'Planificador de Rutinas', icon: Dumbbell },
              { id: 'methodology', label: 'Mi Método de Planificación', icon: BookOpen },
              { id: 'exercises', label: 'Banco de Videos YouTube', icon: Video },
              { id: 'history', label: 'Historial y Feedback', icon: History },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = coachTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCoachTab(tab.id as CoachTab)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all ${
                    isActive
                      ? 'bg-zinc-950 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-orange-400' : 'text-zinc-500'}`} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
