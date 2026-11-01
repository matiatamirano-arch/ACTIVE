import React, { useState } from 'react';
import {
  CheckCircle2,
  Dumbbell,
  ExternalLink,
  Filter,
  Plus,
  Search,
  Trash2,
  Video,
  Youtube,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Equipment, Exercise, MuscleGroup } from '../../types/gym';
import { extractYouTubeId, getYouTubeSearchUrl, getYouTubeThumbnail } from '../../utils/youtube';

const ALL_MUSCLES: MuscleGroup[] = [
  'Pecho',
  'Espalda',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Core',
  'Gemelos',
];

const ALL_EQUIPMENT: Equipment[] = [
  'Barra',
  'Mancuerna',
  'Polea',
  'Máquina',
  'Peso Corporal',
  'Banda Elástica',
];

export const ExerciseBankView: React.FC = () => {
  const { exercises, addExercise, deleteExercise, setVideoModalExercise } = useGym();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('todos');

  // Modal create
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formMuscle, setFormMuscle] = useState<MuscleGroup>('Pecho');
  const [formEquipment, setFormEquipment] = useState<Equipment>('Barra');
  const [formYoutubeUrl, setFormYoutubeUrl] = useState('');
  const [formCue1, setFormCue1] = useState('');
  const [formCue2, setFormCue2] = useState('');
  const [formCoachTips, setFormCoachTips] = useState('');

  const extractedPreviewId = extractYouTubeId(formYoutubeUrl);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const videoId = extractedPreviewId || 'rT7DgCr-3pg'; // fallback to standard good form video

    const cues = [formCue1.trim(), formCue2.trim()].filter(Boolean);

    addExercise({
      name: formName.trim(),
      muscleGroup: formMuscle,
      equipment: formEquipment,
      youtubeUrl: formYoutubeUrl.trim() || `https://www.youtube.com/watch?v=${videoId}`,
      youtubeVideoId: videoId,
      cues: cues.length > 0 ? cues : ['Mantener control excéntrico y tensión muscular constante.'],
      tipsForCoach: formCoachTips.trim() || undefined,
    });

    setShowCreateModal(false);
    setFormName('');
    setFormYoutubeUrl('');
    setFormCue1('');
    setFormCue2('');
    setFormCoachTips('');
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.equipment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = selectedMuscle === 'todos' || ex.muscleGroup === selectedMuscle;
    const matchesEquipment =
      selectedEquipment === 'todos' || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-zinc-900">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Youtube className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-zinc-950">
              Banco de Ejercicios y Videos YouTube ({exercises.length})
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1 max-w-2xl">
            Cada ejercicio cuenta con su video tutorial de YouTube para que tus alumnos aprendan la técnica correcta sin dudas en el gimnasio. Puedes añadir cualquier link de YouTube.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all hover:scale-[1.02] flex-shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Añadir Ejercicio con YouTube
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar ejercicio por nombre (ej. Sentadilla, Press Banca, Curl...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500"
            >
              <option value="todos">Todo el equipamiento</option>
              {ALL_EQUIPMENT.map((eq) => (
                <option key={eq} value={eq}>
                  {eq}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Muscle group pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedMuscle('todos')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedMuscle === 'todos'
                ? 'bg-orange-500 text-white shadow-xs'
                : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
            }`}
          >
            Todos ({exercises.length})
          </button>
          {ALL_MUSCLES.map((muscle) => {
            const count = exercises.filter((e) => e.muscleGroup === muscle).length;
            return (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedMuscle === muscle
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900 border border-zinc-200'
                }`}
              >
                <span>{muscle}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Exercises */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredExercises.map((exercise) => {
          const thumbnail = getYouTubeThumbnail(exercise.youtubeVideoId);

          return (
            <div
              key={exercise.id}
              className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between hover:border-orange-300 transition-all hover:shadow-md group"
            >
              <div>
                {/* YouTube Video Preview Thumbnail with Click to Play */}
                <div
                  onClick={() => setVideoModalExercise(exercise)}
                  className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                >
                  <img
                    src={thumbnail}
                    alt={exercise.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Youtube className="w-6 h-6 fill-current" />
                    </span>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] text-zinc-200">
                    <span className="px-2 py-0.5 rounded bg-black/60 font-medium backdrop-blur-sm">
                      {exercise.equipment}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-red-600 text-white font-bold">
                      YouTube
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-zinc-950 text-sm sm:text-base leading-tight group-hover:text-orange-600 transition-colors">
                      {exercise.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200">
                      {exercise.muscleGroup}
                    </span>
                    {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                      <span className="text-[11px] text-zinc-500 truncate">
                        Secundarios: {exercise.secondaryMuscles.join(', ')}
                      </span>
                    )}
                  </div>

                  {/* Cues preview */}
                  {exercise.cues && exercise.cues.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-[11px] text-zinc-700 space-y-1">
                      <div className="text-zinc-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-orange-600" /> Clave técnica:
                      </div>
                      <p className="line-clamp-2">{exercise.cues[0]}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-4 pt-0 border-t border-zinc-200 mt-2 flex items-center justify-between gap-2">
                <button
                  onClick={() => setVideoModalExercise(exercise)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  Ver Técnica en Video
                </button>

                <a
                  href={getYouTubeSearchUrl(exercise.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 border border-zinc-200 transition-colors"
                  title="Buscar más videos de este ejercicio en YouTube"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                {exercise.isCustom && (
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar ${exercise.name}?`)) {
                        deleteExercise(exercise.id);
                      }
                    }}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar ejercicio personalizado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add Custom Exercise */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden p-6 text-zinc-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-zinc-950 mb-2 flex items-center gap-2">
              <Youtube className="w-5 h-5 text-red-600" /> Añadir Ejercicio con Video de YouTube
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              Pega cualquier enlace de YouTube (tutorial, short o video largo) para incorporarlo a tu catálogo de ejercicios.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Nombre del Ejercicio *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ej. Jalón unilateral en polea alta con rotación"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Grupo Muscular Principal *
                  </label>
                  <select
                    value={formMuscle}
                    onChange={(e) => setFormMuscle(e.target.value as MuscleGroup)}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  >
                    {ALL_MUSCLES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Equipamiento
                  </label>
                  <select
                    value={formEquipment}
                    onChange={(e) => setFormEquipment(e.target.value as Equipment)}
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                  >
                    {ALL_EQUIPMENT.map((eq) => (
                      <option key={eq} value={eq}>
                        {eq}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* YouTube Link Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Enlace o ID de YouTube *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formYoutubeUrl}
                    onChange={(e) => setFormYoutubeUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... o https://youtu.be/..."
                    className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-red-500 font-mono shadow-2xs"
                  />
                </div>

                {extractedPreviewId && (
                  <div className="mt-2.5 p-2 bg-zinc-50 rounded-xl border border-zinc-200 flex items-center gap-3">
                    <img
                      src={getYouTubeThumbnail(extractedPreviewId)}
                      alt="Preview"
                      className="w-20 h-12 object-cover rounded-lg border border-zinc-200"
                    />
                    <div className="text-xs">
                      <span className="text-emerald-700 font-bold block">✓ Video detectado</span>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        ID: {extractedPreviewId}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Clave de Ejecución Técnica 1
                </label>
                <input
                  type="text"
                  value={formCue1}
                  onChange={(e) => setFormCue1(e.target.value)}
                  placeholder="ej. Retraer escápulas antes de comenzar la fase concéntrica"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Clave de Ejecución Técnica 2
                </label>
                <input
                  type="text"
                  value={formCue2}
                  onChange={(e) => setFormCue2(e.target.value)}
                  placeholder="ej. Bajar en 3 segundos sintiendo el estiramiento muscular"
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Consejo Privado del Entrenador
                </label>
                <input
                  type="text"
                  value={formCoachTips}
                  onChange={(e) => setFormCoachTips(e.target.value)}
                  placeholder="ej. Usar como segundo ejercicio de tracción. Monitorizar molestias de hombro."
                  className="w-full bg-white border border-zinc-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-orange-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar en el Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
