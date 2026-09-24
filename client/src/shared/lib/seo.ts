export interface SeoMeta {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
}

const SITE_NAME = 'KodxCamp';
const DEFAULT_DESCRIPTION =
  'Browser-first, learn-by-doing programming platform - interactive lessons, DSA practice, projects, and live classes.';

export function setSeo(meta: SeoMeta) {
  if (typeof document === 'undefined') return;

  const {
    title,
    description = DEFAULT_DESCRIPTION,
    image = '/og-image.png',
    url = window.location.href,
    type = 'website',
  } = meta;

  const fullTitle = title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;

  document.title = fullTitle;

  upsert('name', 'description', description);
  upsert('property', 'og:title', fullTitle);
  upsert('property', 'og:description', description);
  upsert('property', 'og:image', image);
  upsert('property', 'og:url', url);
  upsert('property', 'og:type', type);
  upsert('property', 'og:site_name', SITE_NAME);
  upsert('name', 'twitter:card', 'summary_large_image');
  upsert('name', 'twitter:title', fullTitle);
  upsert('name', 'twitter:description', description);
  upsert('name', 'twitter:image', image);
}

function upsert(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}
