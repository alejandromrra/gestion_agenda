import type { NextConfig } from 'next';

// App 100 % del lado del navegador: se exporta como sitio estático (carpeta `out/`).
// No hay API, base de datos ni servidor de datos: los turnos viven en localStorage.
const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
