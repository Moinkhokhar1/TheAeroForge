import { useState, useEffect } from 'react';
import { api } from './lib.jsx';
import Nav from './Nav.jsx';
import Footer from './Footer.jsx';
import { normContent } from './defaults.js';
import { go } from './router.js';
import { useSeo, pageSeo } from './seo.js';

// Privacy Policy and Terms & Conditions. Business name, address, email and phone come from
// the admin-managed content, so they stay correct if you change them there.
// This is a solid starting draft, not legal advice: have a lawyer review it before relying on it.

const UPDATED = '20 October 2026';

const privacy = ({ name, email, phone, location }) => [
  { h: 'Who we are', p: [
    `${name} is a 3D printing service based in ${location}. This policy explains what personal data we collect through this website, why we collect it, and the choices you have.`,
    `We handle personal data in line with applicable Indian law, including the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, as they apply to us. You can reach us at ${email} or ${phone}.`,
  ] },
  { h: 'What we collect', ul: [
    'Inquiry and quote details: your name, email address, phone number (if you give it), what you need printed, your message and any notes.',
    'Files you choose to send: STEP, STL, 3MF, OBJ, PDF, ZIP, drawings or images attached to an inquiry.',
    'Technical data: your IP address and browser details, which our hosting servers record in normal operation and which we use for security and to prevent spam.',
    'Analytics data, only if you accept analytics cookies: pages viewed, device and browser type, approximate location and how you arrived at the site.',
  ], p2: [
    'When you drop a STEP file into the quote tool, it is measured inside your own browser. The file is not uploaded to us unless you press the button to send an inquiry.',
  ] },
  { h: 'How we use your data', ul: [
    'To reply to your inquiry, prepare quotes and, if you go ahead, make and deliver your order.',
    'To keep the website secure and block spam and abuse.',
    'To understand which pages are useful and improve the site, but only with your consent to analytics cookies.',
    'To meet legal, tax and accounting obligations.',
  ], p2: ['We do not sell your personal data and we do not use it for advertising.'] },
  { h: 'Cookies and similar storage', p: [
    'This site uses a small amount of browser storage that it needs to work: your cookie choice (saved on your device) and, within one browser tab, the contact details you typed into the quote form so you do not have to retype them. The tab storage is cleared when you close the tab.',
    'Analytics cookies are off by default. If you accept them in the banner, we use Google Analytics to count visits. You can change your mind at any time with the “Cookie settings” link in the footer. Declining does not limit what you can do on the site.',
  ] },
  { h: 'Who we share data with', ul: [
    'Our web hosting provider, which stores the website, inquiries and uploaded files on our behalf.',
    'Google, if you accept analytics (Google Analytics). The site also loads its fonts from Google Fonts, so Google receives your IP address when a page loads.',
    'WhatsApp (Meta), only if you choose to click the chat link. Their own privacy policy then applies.',
    'Authorities or professional advisers, where the law requires it or to protect our legal rights.',
  ] },
  { h: 'Spam protection', p: ['To keep our forms usable we use a hidden field, a timing check and a limit on how often one connection can submit. Your IP address is used briefly for that limit.'] },
  { h: 'How long we keep it', p: [
    'We keep inquiry details and files only for as long as we need them to respond, complete your order and meet record-keeping obligations. If you would like something deleted sooner, ask us and we will do so unless we have to keep it by law.',
  ] },
  { h: 'Security', p: [
    'We use reasonable technical and organisational safeguards, including encrypted connections (HTTPS) and restricted access to inquiries. No system is completely secure. If your design is sensitive, email us first and we can discuss confidentiality before you send files.',
  ] },
  { h: 'Your rights', p: [
    `You can ask us to show you the personal data we hold about you, correct it, delete it, or withdraw consent you gave us. Email ${email} and we will respond within a reasonable time. For privacy complaints, write to the same address and we will try to resolve it; you may also approach the relevant authority under applicable law.`,
  ] },
  { h: 'Children', p: ['This website is not aimed at children under 18 and we do not knowingly collect their personal data.'] },
  { h: 'Changes to this policy', p: [`We may update this policy from time to time. The date at the top shows when it last changed.`] },
];

const terms = ({ name, email, phone, location }) => [
  { h: 'About these terms', p: [
    `These terms apply when you use this website and when you order 3D printing or related services from ${name} (“we”, “us”), based in ${location}. By using the site or sending us an inquiry you agree to them. If you do not agree, please do not use the site.`,
  ] },
  { h: 'Our services', p: [
    'We offer 3D printing, prototyping, small-batch production, finishing and CAD or design help. Technologies, materials and sizes we can offer may change, and we may decline a job that we cannot produce well.',
  ] },
  { h: 'Quotes and orders', ul: [
    'Prices and estimates shown or sent during an inquiry are indicative only.',
    'A price is final only when we confirm it to you in writing after reviewing your file. An order exists once we have confirmed it and, where we ask for it, received payment.',
    'Prices are in Indian rupees. Applicable taxes, such as GST, and delivery charges are added where they apply.',
  ] },
  { h: 'Your files and designs', ul: [
    'You keep ownership of your designs. You give us permission to use your files only to review, quote and produce your order.',
    'You confirm that you own the design or have the right to have it made, and that printing it does not infringe anyone else’s rights.',
    'We will not print anything unlawful, including weapons or weapon parts, or items that infringe intellectual property. We may refuse or cancel such a job.',
  ] },
  { h: 'Tolerances, finish and use', p: [
    '3D printing has natural variation: visible layer lines, small dimensional differences and slight colour variation between batches are normal. Material datasheet values are typical figures, not guarantees.',
    'Unless we agree otherwise in writing, parts are not guaranteed for safety-critical, medical, aviation or load-bearing uses. Testing a part for your application is your responsibility.',
  ] },
  { h: 'Payment, production and delivery', p: [
    'Payment terms are stated in our written quote. Lead times are estimates, not promises, and courier delays are outside our control. You can collect your order in Vadodara or have it shipped across India.',
  ] },
  { h: 'Cancellations and problems with an order', p: [
    'Parts are made specially for you, so once production has started an order generally cannot be cancelled or returned for a change of mind.',
    `If a part arrives damaged or does not match what we confirmed in writing, tell us at ${email} with photos within 7 days of receiving it. We will reprint or refund the affected part, as we agree with you. Nothing here limits any rights you have under consumer protection law.`,
  ] },
  { h: 'Using the website', p: [
    'Please do not misuse the site: no attempts to break or overload it, send spam or malicious files, scrape it automatically, or use it for anything unlawful.',
  ] },
  { h: 'Our content', p: [`The text, design, logo and other material on this site belong to ${name} or its licensors. You may not copy or reuse them without our permission.`] },
  { h: 'Liability', p: [
    'The website is provided “as is”. To the extent the law allows, we are not liable for indirect or consequential loss, such as lost profit or delay costs, and our total liability for any order is limited to the amount you paid us for that order. Nothing in these terms excludes liability that cannot be excluded by law.',
  ] },
  { h: 'Privacy', p: ['How we handle personal data is explained in our Privacy Policy.'], link: ['/privacy', 'Read the Privacy Policy'] },
  { h: 'Governing law', p: ['These terms are governed by the laws of India. Courts in Vadodara, Gujarat have jurisdiction, unless the law gives you the right to bring a claim elsewhere.'] },
  { h: 'Changes and contact', p: [`We may update these terms; the date above shows the latest version. Questions? Email ${email} or call ${phone}.`] },
];

export default function Legal({ kind }) {
  const [c, setC] = useState(null);

  useEffect(() => {
    api('/content').then((d) => setC(normContent(d.content))).catch(() => {});
  }, []);

  const info = {
    name: c?.name || 'The Aero Forge',
    email: c?.email || '',
    phone: c?.phone || '',
    location: c?.location || 'Vadodara, Gujarat',
  };
  const isPrivacy = kind === 'privacy';
  const seo = pageSeo(kind, info.name);
  useSeo(seo);

  const sections = (isPrivacy ? privacy : terms)(info);

  return (
    <>
      {c && <Nav c={c} />}

      <main id="main" className="legal">
        <div className="w">
          <h1>{isPrivacy ? 'Privacy Policy' : 'Terms & Conditions'}</h1>
          <p className="mut">Last updated: {UPDATED}</p>

          {sections.map((s) => (
            <div key={s.h}>
              <h2>{s.h}</h2>
              {s.p && s.p.map((t, i) => <p key={i}>{t}</p>)}
              {s.ul && <ul>{s.ul.map((t, i) => <li key={i}>{t}</li>)}</ul>}
              {s.p2 && s.p2.map((t, i) => <p key={'b' + i}>{t}</p>)}
              {s.link && <p><a href={s.link[0]} onClick={(e) => go(s.link[0], e)}>{s.link[1]}</a></p>}
            </div>
          ))}

          <p style={{ marginTop: 48 }}>
            <a href="/" onClick={(e) => go('/', e)}>← Back to home</a>
          </p>
        </div>
      </main>

      {c && <Footer c={c} />}
    </>
  );
}
