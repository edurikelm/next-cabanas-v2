import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configuración de imágenes para Firebase Storage
  images: {
    domains: [
      'firebasestorage.googleapis.com',
      'storage.googleapis.com',
      'lh3.googleusercontent.com', // Para avatares de Google
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  
  // Configuración experimental para mejor rendimiento
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  
  // Configuración para Vercel
  outputFileTracing: true,
  
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://*.vercel.app' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration para optimización
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimización para Firebase
    config.resolve.alias = {
      ...config.resolve.alias,
      '@firebase/app': '@firebase/app/dist/esm/index.esm.js',
      '@firebase/firestore': '@firebase/firestore/dist/esm/index.esm.js',
      '@firebase/storage': '@firebase/storage/dist/esm/index.esm.js',
    };
    
    return config;
  },
  
  // Variables de entorno públicas
  env: {
    CUSTOM_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
    BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
