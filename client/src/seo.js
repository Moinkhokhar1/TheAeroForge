import { useEffect } from 'react';

// Per-page titles and descriptions. The server (server/seo.js) writes the same text into
// the first HTML response; this file keeps them correct when visitors move between pages.
// If you change one, change the other.
export const pageSeo = (route, name = 'The Aero Forge') =>
  ({
    home: {
      title: `${name} | 3D Printing Service in Vadodara, Gujarat`,
      description: 'Custom 3D printing in Vadodara, Gujarat. Upload a STEP file and request a quote for prototypes, spare parts and small batches. We ship across India.',
      path: '/',
    },
    industries: {
      title: `Industries We Serve | ${name}`,
      description: '3D printed parts for automotive, electronics, robotics, food & beverage and aerospace. Prototypes, jigs, fixtures and low-volume production from Vadodara.',
      path: '/industries',
    },
    services: {
      title: `3D Printing Services | ${name}`,
      description: 'FDM, SLA, MJF and metal 3D printing, with engineer-reviewed designs. Rapid prototyping, custom parts and small-batch production in Vadodara, Gujarat.',
      path: '/services',
    },
    materials: {
      title: `3D Printing Materials & Datasheets | ${name}`,
      description: 'Compare PLA, PETG, ABS, ASA, Nylon, TPU and resin for 3D printing, and download datasheets. Choose the right material for your part.',
      path: '/materials',
    },
    privacy: {
      title: `Privacy Policy | ${name}`,
      description: `How ${name} collects, uses and protects your personal data when you request a quote or contact us.`,
      path: '/privacy',
    },
    terms: {
      title: `Terms & Conditions | ${name}`,
      description: `The terms that apply when you use the ${name} website and order 3D printing services from us.`,
      path: '/terms',
    },
  })[route];

function upsert(tag, key, val) {
  let el = document.head.querySelector(`${tag}[${key}="${val}"]`);
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  return el;
}

// Keeps <title>, description, canonical, Open Graph / Twitter tags and robots in sync.
export function useSeo({ title, description, path = '/', noindex = false }) {
  useEffect(() => {
    if (title) document.title = title;
    const url = location.origin + path;
    const set = (tag, key, val, attr, v) => v && upsert(tag, key, val).setAttribute(attr, v);

    set('meta', 'name', 'description', 'content', description);
    set('link', 'rel', 'canonical', 'href', url);
    set('meta', 'property', 'og:title', 'content', title);
    set('meta', 'property', 'og:description', 'content', description);
    set('meta', 'property', 'og:url', 'content', url);
    set('meta', 'name', 'twitter:title', 'content', title);
    set('meta', 'name', 'twitter:description', 'content', description);

    const robots = document.head.querySelector('meta[name="robots"]');
    if (noindex) upsert('meta', 'name', 'robots').setAttribute('content', 'noindex');
    else if (robots) robots.remove();
  }, [title, description, path, noindex]);
}
