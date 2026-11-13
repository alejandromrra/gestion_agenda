'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { CLAVE_PANEL } from '@/lib/clave';
import {
  ACCESO_KEY, ESTADOS, PROFESIONALES, STORAGE_KEY, activo, addDias, fechaCorta, fechaLarga, fechaStr, finDe, hoy,
  lugares, lunesDe, mensajeWhatsApp, parseF, profDe, semilla, tipoDe, type Estado, type Turno,
} from '@/lib/agenda';
import { TurnoForm } from './turno-form';

const DIAS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
const ESTADO_CLASE: Record<Estado, string> = {
  Pendiente: 'bg-amber-100 text-amber-900',
  Confirmado: 'bg-pino/15 text-pino',
  Realizado: 'bg-stone-200 text-stone-700',
  Cancelado: 'bg-red-100 text-red-900',
};
const btn = 'rounded-lg px-4 py-2.5 text-sm font-semibold';
const sec = `${btn} border border-cuero/25 text-tinta hover:bg-cantera/20`;
const pri = `${btn} bg-cempasuchil text-white shadow-sm hover:brightness-95`;
const sel = 'rounded-lg border border-cuero/25 bg-white px-3 py-2 text-sm text-tinta';

const Badge = ({ estado }: { estado: Estado }) => (
  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_CLASE[estado]}`}>{estado}</span>
);
const sinConfirmar = (t: Turno) => t.estado === 'Pendiente' && t.fecha < hoy();

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-cuero/50 sm:items-center sm:p-4" onClick={onClose}>
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-marfil p-5 shadow-xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-2xl text-tinta">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

function Acceso({ onOk }: { onOk: () => void }) {
  const [v, setV] = useState('');
  const [mal, setMal] = useState(false);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-cuero p-5">
      <form
        className="w-full max-w-sm rounded-2xl border-2 border-dashed border-cantera bg-marfil p-7 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (v === CLAVE_PANEL) { try { localStorage.setItem(ACCESO_KEY, '1'); } catch {} onOk(); } else setMal(true);
        }}
      >
        <p className="text-xs uppercase tracking-[0.25em] text-cempasuchil">Morelia</p>
        <h1 className="mt-1 font-display text-3xl text-tinta">Agenda de bodas</h1>
        <p className="mt-2 text-tinta/70">Solo para el equipo. Escribe la clave para pasar.</p>
        <label htmlFor="clave" className="mt-6 block text-sm font-medium text-tinta">Clave del panel</label>
        <input id="clave" type="password" autoComplete="off" value={v} onChange={(e) => { setV(e.target.value); setMal(false); }}
          className="mt-1 w-full rounded-lg border border-cuero/25 bg-white px-3 py-2.5 text-base focus:border-cempasuchil focus:outline-none focus:ring-2 focus:ring-cempasuchil/30" />
        {mal && <p className="mt-2 text-sm text-red-800">La clave no es correcta. Inténtalo otra vez.</p>}
        <button type="submit" className={`${pri} mt-5 w-full py-3`}>Entrar</button>
      </form>
    </main>
  );
}

function Chip({ t, onClick }: { t: Turno; onClick: () => void }) {
  const c = profDe(t.profesionalId).color;
  return (
    <button onClick={onClick} style={{ borderColor: c, backgroundColor: `${c}22` }}
      className={`w-full rounded-md border-l-4 px-2 py-1.5 text-left text-xs leading-tight text-tinta hover:brightness-95 ${t.estado === 'Cancelado' ? 'opacity-50 line-through' : ''}`}>
      <span className="font-semibold">{t.horaInicio}</span> {t.pareja}
      <span className="block text-tinta/70">{t.tipo}</span>
    </button>
  );
}

function Fila({ t, turnos, onClick }: { t: Turno; turnos: Turno[]; onClick: () => void }) {
  const p = profDe(t.profesionalId);
  const l = t.tandaId && activo(t) ? lugares(turnos, t.tandaId) : null;
  return (
    <button onClick={onClick} className="flex w-full items-stretch gap-3 rounded-xl border border-cuero/15 bg-white p-3 text-left hover:border-cempasuchil">
      <span className="w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-tinta">{t.pareja}</span><Badge estado={t.estado} />
          {sinConfirmar(t) && <span className="text-xs font-medium text-amber-800">Sin confirmar</span>}
        </span>
        <span className="block text-sm text-tinta/80">{t.tipo} · {p.nombre}</span>
        <span className="block text-sm capitalize text-tinta/70">{fechaCorta(t.fecha)} · {t.horaInicio}–{finDe(t)}</span>
        {l !== null && <span className="mt-0.5 block text-sm font-medium text-cempasuchil">{l === 0 ? 'Tanda completa' : `Quedan ${l} ${l === 1 ? 'lugar' : 'lugares'} en esta tanda`}</span>}
      </span>
    </button>
  );
}

function Detalle({ t, turnos, onClose, onCambio, onReprogramar }: {
  t: Turno; turnos: Turno[]; onClose: () => void; onCambio: (t: Turno) => void; onReprogramar: () => void;
}) {
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const p = profDe(t.profesionalId);
  const l = t.tandaId && activo(t) ? lugares(turnos, t.tandaId) : null;
  const abierto = t.estado === 'Pendiente' || t.estado === 'Confirmado';
  return (
    <Modal titulo={t.pareja} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge estado={t.estado} />
        {sinConfirmar(t) && <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-950">Sin confirmar</span>}
      </div>
      <dl className="mt-4 space-y-2 text-tinta">
        <div><dt className="text-xs uppercase tracking-wide text-tinta/60">Turno</dt><dd>{t.tipo} · {tipoDe(t.tipo).duracionMin} min</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-tinta/60">Cuándo</dt><dd className="capitalize">{fechaLarga(t.fecha)}, {t.horaInicio}–{finDe(t)}</dd></div>
        <div><dt className="text-xs uppercase tracking-wide text-tinta/60">Profesional</dt>
          <dd className="flex items-center gap-2"><span className="size-3 rounded-full" style={{ backgroundColor: p.color }} />{p.nombre} ({p.rol})</dd></div>
        {l !== null && <div className="font-medium text-cempasuchil">{l === 0 ? 'Tanda completa' : `Quedan ${l} ${l === 1 ? 'lugar' : 'lugares'} en esta tanda`}</div>}
        {t.motivoCancelacion && <div><dt className="text-xs uppercase tracking-wide text-tinta/60">Motivo de cancelación</dt><dd>{t.motivoCancelacion}</dd></div>}
      </dl>
      {cancelando ? (
        <div className="mt-5 space-y-3">
          <label htmlFor="motivo" className="block text-sm font-medium text-tinta">Motivo de la cancelación</label>
          <textarea id="motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
            className="w-full rounded-lg border border-cuero/25 bg-white px-3 py-2 text-base" />
          <div className="flex gap-3">
            <button disabled={!motivo.trim()} className={`${btn} flex-1 bg-red-800 text-white disabled:opacity-40`}
              onClick={() => onCambio({ ...t, estado: 'Cancelado', motivoCancelacion: motivo.trim() })}>Cancelar turno</button>
            <button className={sec} onClick={() => setCancelando(false)}>Volver</button>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-2">
          {t.estado === 'Pendiente' && <button className={pri} onClick={() => onCambio({ ...t, estado: 'Confirmado' })}>Confirmar</button>}
          {abierto && <button className={sec} onClick={onReprogramar}>Reprogramar</button>}
          {abierto && <button className={`${sec} text-red-800`} onClick={() => setCancelando(true)}>Cancelar</button>}
          <a className={`${sec} text-center`} href={mensajeWhatsApp(t)} target="_blank" rel="noreferrer">Avisar por WhatsApp</a>
          <button className={`${sec} col-span-2`} onClick={onClose}>Cerrar</button>
        </div>
      )}
    </Modal>
  );
}

export function AgendaApp() {
  const [listo, setListo] = useState(false);
  const [dentro, setDentro] = useState(false);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [aviso, setAviso] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const [toast, setToast] = useState('');
  const [vista, setVista] = useState<'calendario' | 'agenda'>('calendario');
  const [modo, setModo] = useState<'semana' | 'mes'>('semana');
  const [ancla, setAncla] = useState(hoy());
  const [diaSel, setDiaSel] = useState(hoy());
  const [fProf, setFProf] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [detalleId, setDetalleId] = useState<string | null>(null);
  const [form, setForm] = useState<{ inicial?: Turno } | null>(null);

  useEffect(() => {
    try { setDentro(localStorage.getItem(ACCESO_KEY) === '1'); } catch {}
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) setTurnos(semilla());
      else {
        const v = JSON.parse(raw);
        if (!Array.isArray(v)) throw new Error('formato');
        setTurnos(v);
      }
    } catch (e) {
      if (e instanceof SyntaxError || (e as Error).message === 'formato') {
        setBloqueado(true);
        setAviso('No pudimos leer los datos guardados. No se ha cambiado nada: puedes restaurar los datos de ejemplo cuando quieras.');
      } else setTurnos(semilla());
    }
    setListo(true);
  }, []);

  useEffect(() => {
    if (!listo || bloqueado) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(turnos)); }
    catch { setAviso('Este navegador no deja guardar. Lo que escribas se conserva mientras no cierres esta página.'); }
  }, [turnos, listo, bloqueado]);

  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 3500); return () => clearTimeout(id); } }, [toast]);

  const filtrados = useMemo(
    () => turnos.filter((t) => (!fProf || t.profesionalId === fProf) && (!fEstado || t.estado === fEstado)),
    [turnos, fProf, fEstado],
  );
  const porDia = (f: string) => filtrados.filter((t) => t.fecha === f).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  const detalle = turnos.find((t) => t.id === detalleId);

  function guardar(t: Turno) {
    setTurnos((prev) => (prev.some((x) => x.id === t.id) ? prev.map((x) => (x.id === t.id ? t : x)) : [...prev, t]));
    setForm(null); setDetalleId(null);
    setAncla(t.fecha); setDiaSel(t.fecha);
    setToast(t.estado === 'Confirmado' ? 'Turno confirmado' : 'Turno guardado');
  }
  function cambiar(t: Turno) {
    setTurnos((prev) => prev.map((x) => (x.id === t.id ? t : x)));
    setDetalleId(null);
    setToast(t.estado === 'Cancelado' ? 'Turno cancelado' : 'Turno confirmado');
  }
  function restaurar() {
    if (!window.confirm('Se repondrán los datos de ejemplo de esta agenda y se perderán los cambios. ¿Continuar?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setBloqueado(false); setAviso(''); setTurnos(semilla()); setToast('Datos de ejemplo repuestos');
  }

  if (!listo) return null;
  if (!dentro) return <Acceso onOk={() => setDentro(true)} />;

  const lunes = lunesDe(ancla);
  const semana = Array.from({ length: 7 }, (_, i) => addDias(lunes, i));
  const primero = fechaStr(new Date(parseF(ancla).getFullYear(), parseF(ancla).getMonth(), 1));
  const mesDias = Array.from({ length: 42 }, (_, i) => addDias(lunesDe(primero), i));
  const mesNum = parseF(ancla).getMonth();
  const titulo = modo === 'semana'
    ? `${parseF(lunes).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${parseF(addDias(lunes, 6)).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : parseF(ancla).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  const mover = (n: number) => {
    if (modo === 'semana') setAncla(addDias(ancla, n * 7));
    else { const d = parseF(ancla); d.setDate(1); d.setMonth(d.getMonth() + n); setAncla(fechaStr(d)); }
  };
  const agenda = [...filtrados].sort((a, b) => (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio));

  return (
    <div className="min-h-dvh bg-marfil text-tinta">
      <header className="bg-cuero text-marfil">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-display text-3xl leading-none">Agenda de bodas</p>
            <p className="text-xs text-cantera">Morelia · equipo</p>
          </div>
          <div className="flex gap-2 text-sm">
            <button onClick={restaurar} className="rounded-md border border-cantera/50 px-3 py-1.5 hover:bg-white/10">Restaurar ejemplo</button>
            <button onClick={() => { try { localStorage.removeItem(ACCESO_KEY); } catch {} setDentro(false); }} className="rounded-md border border-cantera/50 px-3 py-1.5 hover:bg-white/10">Salir</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        {aviso && <p role="alert" className="mb-4 rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950">{aviso}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-lg border border-cuero/25 bg-white p-0.5 text-sm font-medium">
            {(['calendario', 'agenda'] as const).map((v) => (
              <button key={v} onClick={() => setVista(v)} className={`rounded-md px-4 py-2 capitalize ${vista === v ? 'bg-cuero text-marfil' : 'text-tinta'}`}>{v === 'agenda' ? 'Agenda' : 'Calendario'}</button>
            ))}
          </div>
          <button className={`${pri} ml-auto`} onClick={() => setForm({})}>Nuevo turno</button>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm">Profesional{' '}
            <select aria-label="Profesional" className={sel} value={fProf} onChange={(e) => setFProf(e.target.value)}>
              <option value="">Todos</option>
              {PROFESIONALES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
          <label className="text-sm">Estado{' '}
            <select aria-label="Estado" className={sel} value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {PROFESIONALES.map((p) => <span key={p.id} className="flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />{p.nombre.split(' ')[0]}</span>)}
        </div>

        {filtrados.length === 0 ? (
          <div className="mt-8 rounded-2xl border-2 border-dashed border-cantera p-10 text-center">
            <p className="font-display text-2xl">Aún no hay turnos</p>
            <p className="mt-1 text-tinta/70">Crea el primero con «Nuevo turno».</p>
          </div>
        ) : vista === 'agenda' ? (
          <div className="mt-5 space-y-2">{agenda.map((t) => <Fila key={t.id} t={t} turnos={turnos} onClick={() => setDetalleId(t.id)} />)}</div>
        ) : (
          <section className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <button className={sec} onClick={() => mover(-1)} aria-label="Anterior">‹</button>
              <button className={sec} onClick={() => { setAncla(hoy()); setDiaSel(hoy()); }}>Hoy</button>
              <button className={sec} onClick={() => mover(1)} aria-label="Siguiente">›</button>
              <h2 className="ml-1 font-display text-2xl capitalize">{titulo}</h2>
              <div className="ml-auto inline-flex rounded-lg border border-cuero/25 bg-white p-0.5 text-sm">
                {(['semana', 'mes'] as const).map((m) => (
                  <button key={m} onClick={() => setModo(m)} className={`rounded-md px-3 py-1.5 capitalize ${modo === m ? 'bg-cantera text-tinta' : ''}`}>{m === 'mes' ? 'Mes' : 'Semana'}</button>
                ))}
              </div>
            </div>

            {modo === 'semana' ? (
              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-7">
                {semana.map((f, i) => (
                  <div key={f} className={`rounded-xl border p-2 ${f === hoy() ? 'border-cempasuchil bg-orange-50' : 'border-cuero/15 bg-white'}`}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-tinta/70">{DIAS[i]} {parseF(f).getDate()}</p>
                    <div className="space-y-1.5">
                      {porDia(f).map((t) => <Chip key={t.id} t={t} onClick={() => setDetalleId(t.id)} />)}
                      {porDia(f).length === 0 && <p className="text-xs text-tinta/40">Sin turnos</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-tinta/60">
                  {DIAS.map((d) => <span key={d}>{d.slice(0, 3)}</span>)}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {mesDias.map((f) => {
                    const ts = porDia(f);
                    return (
                      <button key={f} onClick={() => setDiaSel(f)} aria-label={fechaLarga(f)}
                        className={`min-h-14 rounded-lg border p-1 text-left align-top md:min-h-24 ${f === diaSel ? 'border-cempasuchil ring-2 ring-cempasuchil/40' : 'border-cuero/15'} ${parseF(f).getMonth() === mesNum ? 'bg-white' : 'bg-white/40 text-tinta/40'} ${f === hoy() ? 'font-bold' : ''}`}>
                        <span className="text-xs">{parseF(f).getDate()}</span>
                        <span className="mt-1 hidden space-y-0.5 md:block">
                          {ts.slice(0, 3).map((t) => (
                            <span key={t.id} className="block truncate rounded px-1 text-[11px] text-tinta" style={{ backgroundColor: `${profDe(t.profesionalId).color}30`, borderLeft: `3px solid ${profDe(t.profesionalId).color}` }}>{t.horaInicio} {t.pareja}</span>
                          ))}
                          {ts.length > 3 && <span className="block text-[11px]">+{ts.length - 3} más</span>}
                        </span>
                        <span className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                          {ts.slice(0, 6).map((t) => <span key={t.id} className="size-2 rounded-full" style={{ backgroundColor: profDe(t.profesionalId).color }} />)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4">
                  <h3 className="mb-2 font-display text-lg capitalize">{fechaLarga(diaSel)}</h3>
                  <div className="space-y-2">
                    {porDia(diaSel).map((t) => <Fila key={t.id} t={t} turnos={turnos} onClick={() => setDetalleId(t.id)} />)}
                    {porDia(diaSel).length === 0 && <p className="text-sm text-tinta/60">Sin turnos este día.</p>}
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>

      {toast && <div role="status" className="fixed inset-x-0 bottom-5 z-50 mx-auto w-fit rounded-full bg-cuero px-5 py-2.5 text-sm font-medium text-marfil shadow-lg">{toast}</div>}

      {detalle && !form && (
        <Detalle t={detalle} turnos={turnos} onClose={() => setDetalleId(null)} onCambio={cambiar} onReprogramar={() => setForm({ inicial: detalle })} />
      )}
      {form && (
        <Modal titulo={form.inicial ? 'Reprogramar turno' : 'Nuevo turno'} onClose={() => setForm(null)}>
          <TurnoForm turnos={turnos} inicial={form.inicial} fechaIni={form.inicial?.fecha ?? (vista === 'calendario' && modo === 'mes' ? diaSel : hoy())} onSave={guardar} onClose={() => setForm(null)} />
        </Modal>
      )}
    </div>
  );
}
