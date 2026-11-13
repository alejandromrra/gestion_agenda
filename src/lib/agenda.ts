export type Estado = 'Pendiente' | 'Confirmado' | 'Realizado' | 'Cancelado';
export type Profesional = {
  id: string; nombre: string; rol: string; dias: number[]; horaInicio: string; horaFin: string; tope: number; color: string;
};
export type TipoTurno = { nombre: string; duracionMin: number; precioMXN: number; rol: string; tanda?: number };
export type Turno = {
  id: string; profesionalId: string; tipo: string; fecha: string; horaInicio: string; pareja: string;
  estado: Estado; motivoCancelacion?: string; tandaId?: string;
};

export const STORAGE_KEY = 'agenda-bodas-morelia:v1';
export const ACCESO_KEY = 'agenda-bodas-morelia:acceso';
export const ESTADOS: Estado[] = ['Pendiente', 'Confirmado', 'Realizado', 'Cancelado'];

// dias: 0 = domingo … 6 = sábado
export const PROFESIONALES: Profesional[] = [
  { id: 'renata', nombre: 'Renata Villaseñor', rol: 'coordinadora', dias: [1, 2, 3, 4, 5], horaInicio: '10:00', horaFin: '18:00', tope: 4, color: '#7a3b2e' },
  { id: 'ulises', nombre: 'Ulises Cárdenas', rol: 'chef', dias: [4, 6], horaInicio: '12:00', horaFin: '18:00', tope: 2, color: '#3e5c50' },
  { id: 'ximena', nombre: 'Ximena Olmos', rol: 'maquillista', dias: [2, 3, 4, 5, 6], horaInicio: '09:00', horaFin: '17:00', tope: 3, color: '#a1556b' },
  { id: 'emiliano', nombre: 'Emiliano Tapia', rol: 'fotógrafo', dias: [3, 4, 5, 6, 0], horaInicio: '08:00', horaFin: '16:00', tope: 2, color: '#3f6b8a' },
  { id: 'paloma', nombre: 'Paloma Quiroz', rol: 'coreógrafa', dias: [1, 3, 5], horaInicio: '16:00', horaFin: '21:00', tope: 4, color: '#7a5c8f' },
];

export const TIPOS: TipoTurno[] = [
  { nombre: 'Planeación', duracionMin: 60, precioMXN: 0, rol: 'coordinadora' },
  { nombre: 'Visita jardín', duracionMin: 45, precioMXN: 0, rol: 'coordinadora' },
  { nombre: 'Degustación', duracionMin: 120, precioMXN: 1800, rol: 'chef', tanda: 3 },
  { nombre: 'Peinado y maquillaje', duracionMin: 90, precioMXN: 1500, rol: 'maquillista' },
  { nombre: 'Sesión fotos', duracionMin: 120, precioMXN: 3200, rol: 'fotógrafo' },
  { nombre: 'Ensayo baile', duracionMin: 60, precioMXN: 650, rol: 'coreógrafa' },
];

export const tipoDe = (n: string) => TIPOS.find((t) => t.nombre === n)!;
export const profDe = (id: string) => PROFESIONALES.find((p) => p.id === id)!;

// ---- fechas (texto AAAA-MM-DD, horas HH:MM) ----
const pad = (n: number) => String(n).padStart(2, '0');
export const fechaStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseF = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDias = (s: string, n: number) => { const d = parseF(s); d.setDate(d.getDate() + n); return fechaStr(d); };
export const hoy = () => fechaStr(new Date());
export const lunesDe = (s: string) => addDias(s, -((parseF(s).getDay() + 6) % 7));
export const toMin = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
export const toHM = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
export const fechaLarga = (s: string) =>
  parseF(s).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
export const fechaCorta = (s: string) =>
  parseF(s).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
export const finDe = (t: Turno) => toHM(toMin(t.horaInicio) + tipoDe(t.tipo).duracionMin);

// ---- disponibilidad ----
export const activo = (t: Turno) => t.estado !== 'Cancelado';

/** Bloques ocupados de un profesional en una fecha; una tanda cuenta como un solo bloque. */
export function bloques(turnos: Turno[], profId: string, fecha: string, excluir?: string) {
  const out = new Map<string, { ini: number; fin: number }>();
  for (const t of turnos) {
    if (t.id === excluir || !activo(t) || t.profesionalId !== profId || t.fecha !== fecha) continue;
    const ini = toMin(t.horaInicio);
    out.set(t.tandaId ?? t.id, { ini, fin: ini + tipoDe(t.tipo).duracionMin });
  }
  return [...out.values()];
}

export function horarios(turnos: Turno[], prof: Profesional, tipo: TipoTurno, fecha: string, excluir?: string) {
  if (!prof.dias.includes(parseF(fecha).getDay())) return { slots: [] as string[], completo: false, noLabora: true };
  const ocupados = bloques(turnos, prof.id, fecha, excluir);
  if (ocupados.length >= prof.tope) return { slots: [] as string[], completo: true, noLabora: false };
  const slots: string[] = [];
  for (let m = toMin(prof.horaInicio); m + tipo.duracionMin <= toMin(prof.horaFin); m += 30) {
    if (!ocupados.some((o) => m < o.fin && o.ini < m + tipo.duracionMin)) slots.push(toHM(m));
  }
  return { slots, completo: false, noLabora: false };
}

export const TANDA = 3;
export const lugares = (turnos: Turno[], tandaId: string) =>
  TANDA - turnos.filter((t) => t.tandaId === tandaId && activo(t)).length;

export function tandasAbiertas(turnos: Turno[], profId: string, fecha: string, excluir?: string) {
  const ids = new Set<string>();
  const out: { id: string; hora: string; lugares: number }[] = [];
  for (const t of turnos) {
    if (t.id === excluir || !t.tandaId || !activo(t) || t.profesionalId !== profId || t.fecha !== fecha || ids.has(t.tandaId)) continue;
    ids.add(t.tandaId);
    const libres = TANDA - turnos.filter((x) => x.tandaId === t.tandaId && x.id !== excluir && activo(x)).length;
    if (libres > 0) out.push({ id: t.tandaId, hora: t.horaInicio, lugares: libres });
  }
  return out.sort((a, b) => a.hora.localeCompare(b.hora));
}

// ---- datos de ejemplo (sintéticos), relativos a la semana en curso ----
export function semilla(): Turno[] {
  const lunes = lunesDe(hoy());
  const d = (sem: number, dow: number) => addDias(lunes, sem * 7 + dow - 1);
  let n = 0;
  const t = (profesionalId: string, tipo: string, fecha: string, horaInicio: string, pareja: string, estado: Estado, extra: Partial<Turno> = {}): Turno =>
    ({ id: `t${++n}`, profesionalId, tipo, fecha, horaInicio, pareja, estado, ...extra });
  const [A, B, C, D] = ['Camila y Diego', 'Valeria y Mateo', 'Sofía y Andrés', 'Regina y Joaquín'];
  return [
    t('renata', 'Planeación', d(0, 1), '10:00', A, 'Realizado'),
    t('renata', 'Visita jardín', d(0, 1), '12:00', B, 'Pendiente'),
    t('renata', 'Visita jardín', d(0, 3), '11:00', C, 'Confirmado'),
    t('renata', 'Planeación', d(0, 5), '15:00', D, 'Pendiente'),
    t('renata', 'Planeación', d(1, 1), '10:00', A, 'Confirmado'),
    t('renata', 'Planeación', d(1, 1), '11:00', B, 'Confirmado'),
    t('renata', 'Planeación', d(1, 1), '12:00', C, 'Pendiente'),
    t('renata', 'Planeación', d(1, 1), '14:00', D, 'Confirmado'),
    t('ulises', 'Degustación', d(0, 4), '12:00', A, 'Confirmado', { tandaId: 'tanda-1' }),
    t('ulises', 'Degustación', d(0, 4), '12:00', B, 'Confirmado', { tandaId: 'tanda-1' }),
    t('ulises', 'Degustación', d(0, 4), '12:00', C, 'Pendiente', { tandaId: 'tanda-1' }),
    t('ulises', 'Degustación', d(0, 6), '13:00', D, 'Confirmado', { tandaId: 'tanda-2' }),
    t('ximena', 'Peinado y maquillaje', d(0, 2), '09:00', A, 'Realizado'),
    t('ximena', 'Peinado y maquillaje', d(0, 6), '10:00', D, 'Confirmado'),
    t('ximena', 'Peinado y maquillaje', d(0, 5), '11:00', B, 'Cancelado', { motivoCancelacion: 'Cambiaron la fecha de la boda' }),
    t('emiliano', 'Sesión fotos', d(0, 7), '09:00', C, 'Pendiente'),
    t('emiliano', 'Sesión fotos', d(0, 3), '13:00', A, 'Confirmado'),
    t('emiliano', 'Sesión fotos', d(1, 6), '10:00', B, 'Confirmado'),
    t('paloma', 'Ensayo baile', d(0, 3), '16:00', B, 'Confirmado'),
    t('paloma', 'Ensayo baile', d(0, 5), '18:00', A, 'Pendiente'),
    t('paloma', 'Ensayo baile', d(1, 3), '17:00', C, 'Confirmado'),
  ];
}

export function mensajeWhatsApp(t: Turno) {
  const p = profDe(t.profesionalId);
  const txt = `Hola, les confirmamos su turno de ${t.tipo} el ${fechaLarga(t.fecha)} a las ${t.horaInicio} con ${p.nombre}`;
  return `https://wa.me/?text=${encodeURIComponent(txt)}`;
}
