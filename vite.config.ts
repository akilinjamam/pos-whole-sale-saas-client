import react from '@vitejs/plugin-react-swc';
import { defineConfig, loadEnv } from 'vite';

import type { Plugin } from 'vite';

/** The signed-out pages search engines may index (SaaS phase 8). */
const PUBLIC_PAGES = ['/', '/signup', '/terms', '/privacy', '/refund-policy'];

/**
 * `robots.txt` and `sitemap.xml`, written into the build from VITE_SITE_URL. A sitemap needs the
 * absolute address, which only the deploy knows — so without it there is no sitemap, and
 * robots.txt says nothing about one.
 */
function seoFiles(siteUrl: string): Plugin {
  const base = siteUrl.replace(/\/+$/, '');
  return {
    name: 'seo-files',
    apply: 'build',
    generateBundle() {
      const robots = [
        'User-agent: *',
        'Allow: /',
        // The app behind sign-in, and the platform admin, have nothing for a search engine.
        'Disallow: /platform',
        'Disallow: /login',
        'Disallow: /forgot-password',
        'Disallow: /reset-password',
        'Disallow: /verify-email',
        ...(base ? ['', `Sitemap: ${base}/sitemap.xml`] : []),
      ].join('\n');
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots}\n` });
      if (!base) return;
      const today = new Date().toISOString().slice(0, 10);
      const urls = PUBLIC_PAGES.map(
        (p) => `  <url><loc>${base}${p}</loc><lastmod>${today}</lastmod></url>`,
      ).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), seoFiles(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL ?? '')],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
      // This project's own copy of the API contract shared with the server.
      // Kept in sync with pos-whole-sale-server/src/shared — see `npm run check:shared`.
      '@shared': new URL('./src/shared', import.meta.url).pathname,
    },
  },
  build: {
    /**
     * Vite 8 defaults to a modern baseline and emits CSS media range syntax —
     * `@media (width>=768px)` instead of `@media (min-width:768px)`.
     *
     * A browser older than Chrome 104 / Safari 16.4 / Firefox 102 does not parse that and
     * discards the ENTIRE media block. Every `md:` utility would then be dropped: the
     * desktop sidebar would stay `display:none` on desktop, and the mobile drawer overlay
     * would appear over it. Not a degraded layout — a broken one.
     *
     * This runs on whatever hardware the shop already owns, including older Android
     * tablets, so the CSS target is pinned well below that line.
     */
    cssTarget: ['chrome87', 'edge88', 'firefox78', 'safari14'],
  },
  server: {
    // 5175, so this runs alongside the retail client (5173) and the original wholesale client (5174).
    port: 5175,
    strictPort: true,
  },
}));
