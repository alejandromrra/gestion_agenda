# Agenda de bodas · Morelia

Agenda interna para que la organizadora y su asistente coordinen los turnos de cada pareja con sus profesionales en un solo calendario, sin choques de horario.

## Stack
React + Tailwind CSS + `localStorage`. Sin base de datos, sin servidor de datos y sin cuentas: la app es 100 % del lado del navegador (Next.js solo la empaqueta como sitio estático).

## Cómo correrlo
1. `npm install`
2. `npm run dev` y abrir http://localhost:3100
3. Escribir la clave del panel y pulsar «Entrar».

Para publicarla: `npm run build` genera el sitio estático en `out/`, que se puede subir a cualquier hosting estático. `npm run typecheck` revisa los tipos.

## Dónde está cada cosa
- `src/lib/agenda.ts`: profesionales, tipos de turno, reglas de horarios/tope/tandas, datos de ejemplo y mensaje de WhatsApp.
- `src/lib/clave.ts`: clave del panel.
- `src/components/agenda-app.tsx`: acceso, calendario (semana/mes), agenda, detalle del turno, filtros y guardado en `localStorage`.
- `src/components/turno-form.tsx`: formulario de nuevo turno / reprogramar.
- `src/app/globals.css`: colores y tipografías (identidad visual). `src/app/layout.tsx`: fuentes y metadatos.

## Qué está simulado
- **WhatsApp:** «Avisar por WhatsApp» no envía nada por sí solo. Abre `wa.me` con el texto ya escrito («Hola, les confirmamos su turno de…») y la persona elige el contacto y pulsa enviar en WhatsApp.
- **Correos y pagos:** no existen. El precio de cada tipo de turno es solo informativo en el formulario; no se cobra ni se envía ningún correo.
- **Cuentas:** no hay. La clave del panel solo oculta la pantalla en este navegador.
- **Datos:** todo vive en `localStorage` (ver abajo); no hay servidor ni base de datos.

## Clave del panel
Está en `src/lib/clave.ts` (`CLAVE_PANEL`, por defecto `morelia2026`). Para cambiarla, edita ese texto y guarda. Es una barrera sencilla para uso interno: no sustituye a una cuenta de usuario.

## Datos
- Los turnos se guardan en el navegador (`localStorage`, clave `agenda-bodas-morelia:v1`). No hay cuentas ni servidor de datos: **los datos solo se ven en el mismo navegador** y dispositivo donde se capturaron.
- Profesionales y tipos de turno están en `src/lib/agenda.ts`.
- **Datos sintéticos:** la primera vez que se abre (cuando la clave no existe) se cargan parejas y turnos inventados, siempre alrededor de la semana en curso. Una lista vacía guardada no se considera primera visita.
- Incluyen: una tanda de degustación completa, otra con «Quedan 2 lugares», el lunes de la próxima semana con «Día completo» para Renata, un turno cancelado y un Pendiente con fecha pasada («Sin confirmar»).
- **Reiniciar los datos:** botón «Restaurar ejemplo» (arriba; pide confirmación y repone solo los datos de esta agenda), o a mano borrando en el navegador la clave `agenda-bodas-morelia:v1` (DevTools → Application → Local Storage) y recargando. Si borras también `agenda-bodas-morelia:acceso`, vuelve a pedir la clave.
- Si el navegador no puede guardar, aparece un aviso y lo escrito se conserva en pantalla sin cambiar estados.

## Reglas
Turnos cada 30 min dentro del horario, terminando antes del cierre; sin superponer turnos Pendiente/Confirmado/Realizado del mismo profesional; tope diario por fecha (cancelar libera); degustación en tandas de 3 que ocupan un solo horario y un solo cupo del chef.
