// Per-page SEO for the first HTML response, plus robots.txt / sitemap.xml helpers.
// The client keeps the same titles/descriptions in client/src/seo.js; if you change one, change the other.

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const pages = (name) => ({
  '/': {
    title: `${name} | 3D Printing Service in Vadodara, Gujarat`,
    description: 'Custom 3D printing in Vadodara, Gujarat. Upload a STEP file and request a quote for prototypes, spare parts and small batches. We ship across India.',
  },
  '/industries': {
    title: `Industries We Serve | ${name}`,
    description: '3D printed parts for automotive, electronics, robotics, food & beverage and aerospace. Prototypes, jigs, fixtures and low-volume production from Vadodara.',
  },
  '/services': {
    title: `3D Printing Services | ${name}`,
    description: 'FDM, SLA, MJF and metal 3D printing, with engineer-reviewed designs. Rapid prototyping, custom parts and small-batch production in Vadodara, Gujarat.',
  },
  '/materials': {
    title: `3D Printing Materials & Datasheets | ${name}`,
    description: 'Compare PLA, PETG, ABS, ASA, Nylon, TPU and resin for 3D printing, and download datasheets. Choose the right material for your part.',
  },
  '/privacy': {
    title: `Privacy Policy | ${name}`,
    description: `How ${name} collects, uses and protects your personal data when you request a quote or contact us.`,
  },
  '/terms': {
    title: `Terms & Conditions | ${name}`,
    description: `The terms that apply when you use the ${name} website and order 3D printing services from us.`,
  },
});

const PATHS = Object.keys(pages('x'));
const LEGAL_LASTMOD = { '/privacy': '2026-10-20', '/terms': '2026-10-20' };

// null = not a page we have (served as a 404 with noindex)
const pageFor = (p, name = 'The Aero Forge') => {
  const page = pages(name)[p];
  return page ? { ...page, path: p } : null;
};

function localBusiness(c, origin) {
  const loc = String(c.location || '');
  const parts = loc.split(',').map((t) => t.trim());
  const postal = (loc.match(/\b\d{6}\b/) || [])[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: c.name,
    url: origin + '/',
    image: origin + '/assets/og-image.png',
    logo: origin + '/assets/android-chrome-512x512.png',
    description: pages(c.name)['/'].description,
    telephone: c.phone,
    email: c.email,
    address: {
      '@type': 'PostalAddress',
      addressLocality: parts[0] || 'Vadodara',
      addressRegion: (parts[1] || 'Gujarat').replace(/\b\d{6}\b/, '').trim(),
      ...(postal ? { postalCode: postal } : {}),
      addressCountry: 'IN',
    },
    areaServed: 'IN',
  };
}

// Swap the <!-- seo:start --> ... <!-- seo:end --> block of client/dist/index.html for this page's tags.
function render(html, page, origin, c) {
  const name = c.name || 'The Aero Forge';
  const img = origin + '/assets/og-image.png';
  const alt = `${name}: from STEP file to printed part`;
  const p = page || { title: `Page not found | ${name}`, description: 'This page does not exist.' };

  const tags = [
    `<title>${esc(p.title)}</title>`,
    `<meta name="description" content="${esc(p.description)}" />`,
    page ? `<link rel="canonical" href="${origin}${page.path === '/' ? '/' : page.path}" />` : '<meta name="robots" content="noindex" />',
    '<meta property="og:type" content="website" />',
    `<meta property="og:site_name" content="${esc(name)}" />`,
    '<meta property="og:locale" content="en_IN" />',
    `<meta property="og:title" content="${esc(p.title)}" />`,
    `<meta property="og:description" content="${esc(p.description)}" />`,
    page ? `<meta property="og:url" content="${origin}${page.path === '/' ? '/' : page.path}" />` : '',
    `<meta property="og:image" content="${img}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(alt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(p.title)}" />`,
    `<meta name="twitter:description" content="${esc(p.description)}" />`,
    `<meta name="twitter:image" content="${img}" />`,
    page && page.path === '/'
      ? `<script type="application/ld+json">${JSON.stringify(localBusiness(c, origin)).replace(/</g, '\\u003c')}</script>`
      : '',
  ].filter(Boolean).join('\n    ');

  return html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, () => tags);
}

const robots = (origin) =>
  // /api/content and /api/images stay crawlable on purpose: the pages need them to render.
  `User-agent: *\nAllow: /\nDisallow: /api/admin/\nDisallow: /api/login\nDisallow: /api/inquiries\n\nSitemap: ${origin}/sitemap.xml\n`;

const sitemap = (origin) =>
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  PATHS.map((p) =>
    `  <url><loc>${origin}${p === '/' ? '/' : p}</loc>${LEGAL_LASTMOD[p] ? `<lastmod>${LEGAL_LASTMOD[p]}</lastmod>` : ''}</url>`
  ).join('\n') + '\n</urlset>\n';

module.exports = { PATHS, pageFor, render, robots, sitemap };
