// /* Defaults used when the saved admin data does not have the new keys yet.
//    Imported by both App.jsx and Admin.jsx. */

// export const DEF_TECH = [
//   { name: 'FDM', desc: 'Strong, affordable parts for prototypes and functional use.', rateMul: 1, speedMul: 1, refLayer: 0.2 },
//   { name: 'SLA', desc: 'Resin printing for fine detail and smooth surfaces.', rateMul: 1.5, speedMul: 0.6, refLayer: 0.05 },
// ];

// // rate = how much 1 unit of your BASE currency (the one with rate 1) is worth. Update these in Admin.
// export const DEF_CUR = [
//   { code: 'INR', symbol: '₹', rate: 1 },
//   { code: 'USD', symbol: '$', rate: 0.012 },
//   { code: 'EUR', symbol: '€', rate: 0.011 },
//   { code: 'GBP', symbol: '£', rate: 0.0095 },
//   { code: 'AED', symbol: 'AED ', rate: 0.044 },
// ];

// export const DEF_COUNTRIES = [
//   { name: 'India', currency: 'INR' },
//   { name: 'United States', currency: 'USD' },
//   { name: 'United Kingdom', currency: 'GBP' },
//   { name: 'Germany', currency: 'EUR' },
//   { name: 'United Arab Emirates', currency: 'AED' },
// ];

// export const DEF_CHECKS = [
//   { key: 'watertight', label: 'Closed Geometry (Watertight)', on: 'yes' },
//   { key: 'thin', label: 'Thin walls', on: 'yes' },
//   { key: 'overhang', label: 'Overhangs and Supports', on: 'yes' },
//   { key: 'integrity', label: 'Part Integrity', on: 'yes' },
// ];
// export const CHECK_KEYS = DEF_CHECKS.map(x => x.key);

// export const normPricing = P => ({
//   ...P,
//   technologies: P.technologies && P.technologies.length ? P.technologies : DEF_TECH,
//   currencies: P.currencies && P.currencies.length ? P.currencies : DEF_CUR,
//   countries: P.countries && P.countries.length ? P.countries : DEF_COUNTRIES,
//   materials: P.materials.map(m => ({ tech: '', ...m })),   // tech '' = available for every technology
//   qualities: P.qualities.map(q => ({ tech: '', ...q })),
// });

// export const normContent = c => ({
//   leadTitle: 'Almost there',
//   leadText: 'Choose your country and currency, then enter your details to see your instant estimate. We only use them to follow up on your quote.',
//   leadButton: 'Show my estimate',
//   technologyLabel: 'Technology',
//   holesTitle: 'Detected',
//   showHoles: 'yes',
//   showChecks: 'yes',
//   checks: DEF_CHECKS,
//   ...c,
// });



/* Defaults used when the saved admin data does not have the new keys yet.
   Imported by both App.jsx and Admin.jsx. */

export const DEF_TECH = [
  { name: 'FDM', desc: 'Strong, affordable parts for prototypes and functional use.', rateMul: 1, speedMul: 1, refLayer: 0.2 },
  { name: 'SLA', desc: 'Resin printing for fine detail and smooth surfaces.', rateMul: 1.5, speedMul: 0.6, refLayer: 0.05 },
];

// rate = how much 1 unit of your BASE currency (the one with rate 1) is worth. Update these in Admin.
export const DEF_CUR = [
  { code: 'INR', symbol: '₹', rate: 1 },
  { code: 'USD', symbol: '$', rate: 0.012 },
  { code: 'EUR', symbol: '€', rate: 0.011 },
  { code: 'GBP', symbol: '£', rate: 0.0095 },
  { code: 'AED', symbol: 'AED ', rate: 0.044 },
];

export const DEF_COUNTRIES = [
  { name: 'India', currency: 'INR' },
  { name: 'United States', currency: 'USD' },
  { name: 'United Kingdom', currency: 'GBP' },
  { name: 'Germany', currency: 'EUR' },
  { name: 'United Arab Emirates', currency: 'AED' },
];

export const DEF_CHECKS = [
  { key: 'watertight', label: 'Closed Geometry (Watertight)', on: 'yes' },
  { key: 'thin', label: 'Thin walls', on: 'yes' },
  { key: 'overhang', label: 'Overhangs and Supports', on: 'yes' },
  { key: 'integrity', label: 'Part Integrity', on: 'yes' },
];
export const DEF_UNITS = [
  { name: 'Millimeters (mm)', factor: 1 },
  { name: 'Centimeters (cm)', factor: 10 },
  { name: 'Inches (in)', factor: 25.4 },
];
export const DEF_INFILLS = [10, 20, 40, 60, 100].map(value => ({ value }));

export const CHECK_KEYS = DEF_CHECKS.map(x => x.key);

export const normPricing = P => ({
  ...P,
  technologies: P.technologies && P.technologies.length ? P.technologies : DEF_TECH,
  currencies: P.currencies && P.currencies.length ? P.currencies : DEF_CUR,
  countries: P.countries && P.countries.length ? P.countries : DEF_COUNTRIES,
  units: P.units && P.units.length ? P.units : DEF_UNITS,
  infills: P.infills && P.infills.length ? P.infills : DEF_INFILLS,
  materials: P.materials.map(m => ({ tech: '', ...m })),   // tech '' = available for every technology
  qualities: P.qualities.map(q => ({ tech: '', ...q })),
});

export const normContent = c => ({
  leadTitle: 'Almost there',
  leadText: 'Choose your country and currency, then enter your details to see your instant estimate. We only use them to follow up on your quote.',
  leadButton: 'Show my estimate',
  technologyLabel: 'Technology',
  unitLabel: 'What unit is your model in?',
  drawEnabled: 'yes',
  drawTitle: 'Technical Drawings and Notes',
  drawHint: 'Add drawings or reference files (max 5 MB each, up to 5 files) and any notes.',
  drawMaxMb: 5,
  holesTitle: 'Detected',
  showHoles: 'yes',
  showChecks: 'yes',
  checks: DEF_CHECKS,
  ...c,
});