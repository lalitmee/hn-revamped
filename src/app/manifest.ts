import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HN Revamped — Intelligent Hacker News Reader',
    short_name: 'HN Revamped',
    description:
      'A fast, readable Hacker News client with split-pane and reader modes.',
    start_url: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#101114',
    theme_color: '#101114',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
