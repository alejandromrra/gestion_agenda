import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agenda de bodas · Morelia',
  description: 'Agenda interna para coordinar turnos de parejas y profesionales en Morelia',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-dvh bg-marfil font-sans text-cuero antialiased">{children}</body>
    </html>
  );
}
