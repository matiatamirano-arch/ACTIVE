import React from 'react';
import { ExternalLink, X, Youtube, Info, CheckCircle2 } from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { getYouTubeEmbedUrl } from '../../utils/youtube';

export const VideoModal: React.FC = () => {
  const { videoModalExercise, setVideoModalExercise } = useGym();

  if (!videoModalExercise) return null;

  const embedUrl = getYouTubeEmbedUrl(videoModalExercise.youtubeVideoId, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
              <Youtube className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-zinc-950 truncate">
                {videoModalExercise.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 font-bold border border-orange-200">
                  {videoModalExercise.muscleGroup}
                </span>
                <span>•</span>
                <span>{videoModalExercise.equipment}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setVideoModalExercise(null)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative w-full bg-black aspect-video flex-shrink-0">
          <iframe
            src={embedUrl}
            title={videoModalExercise.name}
            className="absolute inset-0 w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Content & Cues */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-zinc-700">
          {videoModalExercise.cues && videoModalExercise.cues.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-600 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Claves de Ejecución Técnica
              </h4>
              <ul className="space-y-1.5 bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                {videoModalExercise.cues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-zinc-800 text-xs sm:text-sm">
                    <span className="text-orange-500 font-bold mt-0.5">•</span>
                    <span>{cue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {videoModalExercise.tipsForCoach && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs sm:text-sm text-amber-800 flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <span className="font-semibold block mb-0.5 text-amber-900">Nota Metodológica del Entrenador:</span>
                <span>{videoModalExercise.tipsForCoach}</span>
              </div>
            </div>
          )}

          {/* Action footer */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200">
            <a
              href={videoModalExercise.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir video directo en YouTube
            </a>
            <button
              onClick={() => setVideoModalExercise(null)}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-colors ml-auto shadow-xs cursor-pointer"
            >
              Listo, volver a la rutina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
