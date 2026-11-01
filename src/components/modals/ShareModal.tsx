import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  MessageSquare,
  QrCode,
  Smartphone,
  X,
} from 'lucide-react';
import { useGym } from '../../context/GymContext';
import { Student } from '../../types/gym';

interface ShareModalProps {
  student: Student;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ student, onClose }) => {
  const { routines, exercises, getStudentShareUrl } = useGym();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const studentRoutine = routines.find(
    (r) => r.id === student.activeRoutineId || r.studentId === student.id
  );

  const shareUrl = getStudentShareUrl(student);

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); } catch { alert("No se pudo copiar. Seleccioná y copiá el enlace manualmente."); return; }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Build nice WhatsApp message
  const buildWhatsAppMessage = () => {
    let msg = `💪 ¡Hola *${student.name}*! Te comparto tu rutina personalizada en Active Functional Studio:\n\n`;
    if (studentRoutine) {
      msg += `📋 *${studentRoutine.name}*\n`;
      msg += `🎯 Objetivo: ${student.goal}\n\n`;
      msg += `🏋️‍♂️ *Estructura de tus días:* \n`;
      studentRoutine.days.forEach((day, index) => {
        msg += `\n*Día ${index + 1}: ${day.dayName}*\n`;
        day.exercises.forEach((re, exIdx) => {
          const exData = exercises.find((e) => e.id === re.exerciseId);
          const topSet = re.sets.find((s) => s.setType === 'top_set') || re.sets[0];
          msg += `  ${exIdx + 1}. ${exData ? exData.name : 'Ejercicio'} (${re.sets.length} series x ${topSet?.targetReps || '8-10 reps'})\n`;
        });
      });
    }

    msg += `\n📲 *Accede a tu rutina interactiva con temporizador y videos de YouTube aquí:*\n${shareUrl}\n\n`;
    msg += `(Guarda el enlace en la pantalla de inicio de tu celular para tenerla siempre a mano en el gym) 🔥`;

    return encodeURIComponent(msg);
  };

  const whatsappLink = `https://api.whatsapp.com/send?phone=${student.phone.replace(/[^0-9]/g, '')}&text=${buildWhatsAppMessage()}`;

  // QR code image URL using reliable public QR API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}&color=10-10-10&bgcolor=255-255-255`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg bg-white border border-zinc-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-950">
                Compartir Rutina con {student.name}
              </h3>
              <p className="text-xs text-zinc-500">
                Tu alumno tendrá su rutina en vivo en su teléfono móvil
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* Active Routine Info */}
          <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="text-xs text-zinc-500 font-medium">Rutina Asignada</div>
            <div className="text-sm font-bold text-zinc-950 mt-0.5">
              {studentRoutine ? studentRoutine.name : 'Sin rutina activa asignada'}
            </div>
            {studentRoutine && (
              <div className="flex items-center gap-2 mt-1.5 text-xs text-zinc-500">
                <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 font-medium">
                  {studentRoutine.daysCount} días / semana
                </span>
                <span>•</span>
                <span className="text-orange-600 font-bold">
                  {studentRoutine.days.reduce((acc, d) => acc + d.exercises.length, 0)} ejercicios con video
                </span>
              </div>
            )}
          </div>

          {/* Direct Link Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-700">
                Enlace Exclusivo para {student.name}
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                🔒 Acceso Privado y Aislado
              </span>
            </div>
            <div className="flex items-center gap-2 bg-zinc-50 p-2 rounded-xl border border-zinc-200">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full bg-transparent text-xs text-zinc-800 focus:outline-none px-2 font-mono truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5">
              El alumno debe crear su acceso con el correo registrado en su ficha y confirmar ese correo. Después verá su planificación actualizada en este mismo enlace.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-white" />
              Enviar por WhatsApp
            </a>

            <button
              onClick={() => setShowQr(!showQr)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-zinc-600" />
              {showQr ? 'Ocultar Código QR' : 'Mostrar Código QR'}
            </button>
          </div>

          {/* QR Code view */}
          {showQr && (
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-xl border border-zinc-200 animate-fade-in text-center">
              <div className="p-2.5 bg-white rounded-xl shadow-md border border-zinc-200 mb-2">
                <img
                  src={qrCodeUrl}
                  alt={`QR para ${student.name}`}
                  className="w-44 h-44 object-contain"
                />
              </div>
              <p className="text-xs text-zinc-600 max-w-xs">
                Pídele a <span className="text-zinc-950 font-bold">{student.name}</span> que escanee este código con la cámara de su teléfono para abrir su rutina al instante.
              </p>
            </div>
          )}

          {/* Tip for client home screen */}
          <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-200 text-xs text-zinc-700 space-y-1.5">
            <div className="text-zinc-950 font-bold flex items-center gap-1.5">
              💡 ¿Cómo lo usa tu alumno en el gimnasio?
            </div>
            <p>
              1. Abre el enlace en el navegador de su teléfono (Safari o Chrome).
            </p>
            <p>
              2. Puede tocar <span className="text-zinc-950 font-semibold">"Añadir a pantalla de inicio"</span> para tener la app como un icono en su celular.
            </p>
            <p>
              3. En el gym registrará sus repeticiones, pesos levantados y podrá consultar el video de YouTube de cada ejercicio si tiene dudas de técnica.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Abrir Vista Alumno <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
