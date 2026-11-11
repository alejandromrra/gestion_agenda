'use client';

import { useState } from 'react';

import {
  PROFESIONALES, TIPOS, fechaCorta, horarios, tandasAbiertas, tipoDe, type Estado, type Turno,
} from '@/lib/agenda';

const campo = 'mt-1 w-full rounded-lg border border-cuero/25 bg-white px-3 py-2.5 text-base text-cuero focus:border-cempasuchil focus:outline-none focus:ring-2 focus:ring-cempasuchil/30 disabled:bg-stone-100';
const etiqueta = 'block text-sm font-medium text-cuero';

export function TurnoForm({ turnos, inicial, fechaIni, onSave, onClose }: {
  turnos: Turno[]; inicial?: Turno; fechaIni: string; onSave: (t: Turno) => void; onClose: () => void;
}) {
  const [tipoN, setTipoN] = useState(inicial?.tipo ?? TIPOS[0].nombre);
  const [profId, setProfId] = useState(inicial?.profesionalId ?? '');
  const [fecha, setFecha] = useState(inicial?.fecha ?? fechaIni);
  const [hora, setHora] = useState(inicial?.horaInicio ?? '');
  const [pareja, setPareja] = useState(inicial?.pareja ?? '');
  const [estado, setEstado] = useState<Estado>(inicial?.estado ?? 'Confirmado');
  const [tandaSel, setTandaSel] = useState('');

  const tipo = tipoDe(tipoN);
  const profs = PROFESIONALES.filter((p) => p.rol === tipo.rol);
  const prof = profs.find((p) => p.id === profId) ?? profs[0];
  const info = horarios(turnos, prof, tipo, fecha, inicial?.id);
  const tandas = tipo.tanda ? tandasAbiertas(turnos, prof.id, fecha, inicial?.id) : [];
  const modo = tandas.some((x) => x.id === tandaSel) ? tandaSel : tandaSel === 'nueva' || !tandas.length ? 'nueva' : tandas[0].id;
  const unida = tandas.find((x) => x.id === modo);
  const horaEf = unida ? unida.hora : info.slots.includes(hora) ? hora : '';
  const valido = pareja.trim() !== '' && fecha !== '' && horaEf !== '';

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    onSave({
      id: inicial?.id ?? `t${Date.now()}`,
      profesionalId: prof.id, tipo: tipoN, fecha, horaInicio: horaEf, pareja: pareja.trim(), estado,
      tandaId: tipo.tanda ? (unida ? unida.id : `tanda-${Date.now()}`) : undefined,
    });
  }

  return (
    <form onSubmit={guardar} className="space-y-4">
      <div>
        <label className={etiqueta} htmlFor="tipo">Tipo de turno</label>
        <select id="tipo" className={campo} value={tipoN} onChange={(e) => { setTipoN(e.target.value); setProfId(''); setHora(''); setTandaSel(''); }}>
          {TIPOS.map((t) => <option key={t.nombre}>{t.nombre}</option>)}
        </select>
        <p className="mt-1 text-sm text-cuero/70">{tipo.duracionMin} min · {tipo.precioMXN ? `$${tipo.precioMXN.toLocaleString('es-MX')} MXN` : 'Sin costo'}</p>
      </div>
      <div>
        <label className={etiqueta} htmlFor="prof">Profesional</label>
        <select id="prof" className={campo} value={prof.id} onChange={(e) => { setProfId(e.target.value); setHora(''); setTandaSel(''); }}>
          {profs.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.rol})</option>)}
        </select>
      </div>
      <div>
        <label className={etiqueta} htmlFor="fecha">Fecha</label>
        <input id="fecha" type="date" className={campo} value={fecha} onChange={(e) => { setFecha(e.target.value); setHora(''); setTandaSel(''); }} />
      </div>
      {tipo.tanda && fecha && (
        <div>
          <label className={etiqueta} htmlFor="tanda">Tanda</label>
          <select id="tanda" className={campo} value={modo} onChange={(e) => setTandaSel(e.target.value)}>
            {tandas.map((x) => <option key={x.id} value={x.id}>Unirse a la tanda de las {x.hora} (quedan {x.lugares} {x.lugares === 1 ? 'lugar' : 'lugares'})</option>)}
            <option value="nueva">Abrir nueva tanda</option>
          </select>
        </div>
      )}
      {!unida && (
        <div>
          <label className={etiqueta} htmlFor="hora">Hora</label>
          <select id="hora" className={campo} value={horaEf} disabled={!info.slots.length} onChange={(e) => setHora(e.target.value)}>
            <option value="">{info.slots.length ? 'Elige un horario' : '—'}</option>
            {info.slots.map((h) => <option key={h}>{h}</option>)}
          </select>
          {info.completo && <p className="mt-1 text-sm font-medium text-red-800">Día completo</p>}
          {info.noLabora && <p className="mt-1 text-sm text-cuero/70">{prof.nombre} no trabaja el {fechaCorta(fecha)}.</p>}
          {!info.completo && !info.noLabora && !info.slots.length && <p className="mt-1 text-sm text-red-800">No quedan horarios libres ese día.</p>}
        </div>
      )}
      <div>
        <label className={etiqueta} htmlFor="pareja">Pareja</label>
        <input id="pareja" className={campo} placeholder="Ej. Camila y Diego" value={pareja} onChange={(e) => setPareja(e.target.value)} />
      </div>
      <div>
        <label className={etiqueta} htmlFor="estado">Estado</label>
        <select id="estado" className={campo} value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
          {(['Pendiente', 'Confirmado', 'Realizado'] as Estado[]).map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={!valido} className="flex-1 rounded-lg bg-cempasuchil px-4 py-3 font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-40">Guardar</button>
        <button type="button" onClick={onClose} className="rounded-lg border border-cuero/25 px-4 py-3 font-medium text-cuero hover:bg-cantera/20">Cerrar</button>
      </div>
    </form>
  );
}
