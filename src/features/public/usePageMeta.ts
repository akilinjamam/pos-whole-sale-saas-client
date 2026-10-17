import { useEffect } from 'react';

const SITE = 'Optical Wholesale';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Title, description and canonical link for a public page (SaaS phase 8). Search engines that run
 * JavaScript (Google, Bing) read these; `index.html` carries the defaults for the ones that do not.
 */
export function usePageMeta(title: string, description: string, { exact = false } = {}) {
  useEffect(() => {
    const previous = document.title;
    // `exact`: the title is already complete (the landing page's, in the visitor's language).
    document.title = exact ? title : `${title} · ${SITE}`;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', document.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${window.location.pathname}`;

    return () => {
      document.title = previous;
    };
  }, [title, description, exact]);
}
