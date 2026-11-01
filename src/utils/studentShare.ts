import { Routine, Student } from '../types/gym';

export interface StudentSharePayload {
  s: Student;
  r?: Routine;
  version?: number;
}

/**
 * Encodes student profile and their active routine into a URL-safe Base64 string.
 * Supports full UTF-8 characters (e.g., accents like Rocío).
 */
export function encodeStudentShareData(payload: StudentSharePayload): string {
  try {
    // Minimize payload to essential data
    const minified = {
      version: 1,
      s: {
        id: payload.s.id,
        name: payload.s.name,
        slug: payload.s.slug,
        email: payload.s.email || '',
        phone: payload.s.phone || '',
        goal: payload.s.goal,
        level: payload.s.level,
        pinCode: payload.s.pinCode || '1234',
        currentProgramWeek: payload.s.currentProgramWeek || 1,
        activeRoutineId: payload.s.activeRoutineId,
        avatarUrl: payload.s.avatarUrl,
        injuriesOrLimitations: payload.s.injuriesOrLimitations || '',
        coachNotes: payload.s.coachNotes || '',
      },
      r: payload.r
        ? {
            id: payload.r.id,
            name: payload.r.name,
            description: payload.r.description,
            methodologyType: payload.r.methodologyType,
            daysCount: payload.r.daysCount,
            currentWeek: payload.r.currentWeek || 1,
            days: payload.r.days,
          }
        : undefined,
    };

    const json = JSON.stringify(minified);
    const base64 = btoa(
      encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      })
    );

    // Make URL-safe (replace + with -, / with _, trim =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode student share data:', err);
    return '';
  }
}

/**
 * Decodes URL-safe Base64 string back into student and routine.
 */
export function decodeStudentShareData(str: string): StudentSharePayload | null {
  try {
    if (!str || typeof str !== 'string') return null;

    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const json = decodeURIComponent(
      Array.prototype.map
        .call(atob(base64), (c: string) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    const parsed = JSON.parse(json);
    if (!parsed || !parsed.s) return null;

    return {
      s: parsed.s as Student,
      r: parsed.r as Routine | undefined,
      version: parsed.version || 1,
    };
  } catch (err) {
    console.error('Failed to decode student share data:', err);
    return null;
  }
}
