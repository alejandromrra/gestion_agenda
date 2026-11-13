import type { NextConfig } from 'next';

// App 100 % del lado del navegador: se exporta como sitio estático (carpeta `out/`).
// No hay API, base de datos ni servidor de datos: los turnos viven en localStorage.
// BASE_PATH se define al publicar en GitHub Pages (ver .github/workflows/pages.yml).
const nextConfig: NextConfig = {
  output: 'export',
  basePath: process.env.BASE_PATH ?? '',
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
};

export default nextConfig;
