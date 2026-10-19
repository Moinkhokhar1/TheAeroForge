const express = require('express'), multer = require('multer'), jwt = require('jsonwebtoken'),
  cors = require('cors'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const PORT = process.env.PORT || 5001;
const SECRET = process.env.JWT_SECRET || 'change-this-secret';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'moinkhokhar2730vdr@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // CHANGE in production
const DB = path.join(__dirname, 'data.json'), UP = path.join(__dirname, 'uploads');
const DS = path.join(UP, 'datasheets');
const IM = path.join(UP, 'images');
fs.mkdirSync(UP, { recursive: true });
fs.mkdirSync(DS, { recursive: true });
fs.mkdirSync(IM, { recursive: true });

const safeEq = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

const defaults = {
  content: {
    name: 'Layerforge 3D', badge: 'Now taking orders in Vadodara, Gujarat',
    heroTitle: 'From STEP file to printed part.',
    heroText: 'Drop in your CAD file and see a price in seconds, right in your browser. Then send it to us and we will print it. Precision 3D printing for engineers, founders and makers.',
    stats: [{ value: '24h', label: 'fastest turnaround' }, { value: '6', label: 'engineering materials' }, { value: '0.1 mm', label: 'finest layer height' }, { value: '256 mm', label: 'max part size' }],
    quoteTitle: 'Get an instant price for your part',
    quoteText: 'Upload a STEP file. We measure the model in your browser and price it using your material, quality and quantity. The file stays on your device until you choose to send it.',
    servicesTitle: 'What we print, and how we help',
    servicesText: 'From a single bracket to a batch of 500, printed on calibrated machines and checked before it leaves.',
    services: [
      { title: 'Rapid prototyping', desc: 'Functional prototypes in 24–72 hours so you can test fit and form before you commit to tooling.' },
      { title: 'Custom parts & spares', desc: 'Brackets, enclosures, jigs, replacement parts. Send a STEP file or a sketch and we will help.' },
      { title: 'Small-batch production', desc: 'Repeat runs of 5 to 500 parts with consistent quality and quantity pricing.' },
      { title: 'Student & project support', desc: 'Final-year projects, IoT enclosures, robotics parts. Fair pricing and design feedback.' },
      { title: 'CAD & design help', desc: 'No model yet? We can turn your measurements or idea into a printable CAD file.' },
      { title: 'Finishing', desc: 'Sanding, priming, painting and assembly for parts that need to look as good as they work.' }
    ],
    materialsTitle: 'Materials', materialsText: 'Pick the plastic that fits the job. Prices in the instant quote update as you switch.',
    stepsTitle: 'How it works',
    steps: [
      { title: 'Upload your STEP file', desc: 'Get an instant estimate in your browser. Your file is not uploaded anywhere until you send an inquiry.' },
      { title: 'Send an inquiry', desc: 'Confirm material, quantity and deadline. We review the model and reply within a few hours.' },
      { title: 'We print', desc: 'Your parts are sliced, printed and quality-checked on calibrated machines.' },
      { title: 'Delivery or pickup', desc: 'Pick up in Vadodara or get it shipped across India.' }
    ],
    aboutTitle: 'A small workshop that answers its phone',
    aboutText: 'Layerforge 3D started in Vadodara, Gujarat in 2026. We are engineers, so we look at your design before we print it and tell you honestly if a small change will make it stronger, faster or cheaper to make.\n\nFounders, students, workshops and factories send us their parts. You deal directly with the person running the printers, not a ticket queue.',
    location: 'Vadodara, Gujarat 390001', hours: 'Mon – Sat, 10:00 – 19:00', phone: '+91 7229064808', email: 'moinkhokhar2730vdr@gmail.com',
    faqTitle: 'Questions people ask',
    faqs: [
      { q: 'Is the online price final?', a: 'It is a close estimate based on your model’s volume, surface area and the options you pick. We confirm a final quote after reviewing the file, usually within a few hours.' },
      { q: 'Is my file uploaded when I get a quote?', a: 'No. Measuring happens in your browser. The file is only sent if you submit an inquiry.' },
      { q: 'Which file formats can I send?', a: 'STEP or STP for the instant quote. In an inquiry you can also attach STL, 3MF, OBJ, PDF or ZIP up to 15 MB.' }
    ],
    contactTitle: 'Tell us what you need printed', contactText: 'Send a message with your file or idea. We reply within a few hours during working hours.'
  },
  pricing: {
    currency: '₹', setupFee: 100, hourlyRate: 100, speedCm3PerHour: 12, markupPct: 20, minPrice: 200,
    supportsPct: 25, wallMm: 1.2, rangePct: 15, buildVolume: [256, 256, 256],
    qualities: [{ name: 'Draft', layer: 0.3 }, { name: 'Standard', layer: 0.2 }, { name: 'Fine', layer: 0.12 }],
    materials: [
      { name: 'PLA', desc: 'Best all-rounder. Prototypes, models, display parts.', density: 1.24, pricePerGram: 2.5 },
      { name: 'PETG', desc: 'Tougher than PLA, handles light outdoor use.', density: 1.27, pricePerGram: 3.2 },
      { name: 'ABS', desc: 'Heat resistant, easy to sand and finish.', density: 1.04, pricePerGram: 3.0 },
      { name: 'ASA', desc: 'UV-stable, built for outdoor enclosures.', density: 1.07, pricePerGram: 3.4 },
      { name: 'Nylon', desc: 'Strong and wear-resistant. Gears, hinges.', density: 1.14, pricePerGram: 7.0 },
      { name: 'TPU', desc: 'Flexible. Grips, gaskets, bumpers.', density: 1.21, pricePerGram: 5.5 }
    ]
  },
  pages: {
    industries: {
      title: 'Industries that rely on 3D printing',
      text: 'From the first prototype to production tooling, additive manufacturing shortens development time and cuts cost across sectors.',
      items: [
        { name: 'Automotive', desc: 'Faster design cycles and low-volume parts without tooling cost.', uses: 'Prototype brackets and housings\nJigs, fixtures and checking gauges\nCustom and replacement parts' },
        { name: 'Electronics', desc: 'Enclosures and fixtures made to fit your board exactly.', uses: 'Device enclosures and mounts\nTest fixtures\nCable and connector holders' },
        { name: 'Robotics', desc: 'Lightweight, custom parts that evolve with each design iteration.', uses: 'Grippers and end effectors\nChassis and brackets\nSensor mounts' },
        { name: 'Food & Beverage', desc: 'Tooling and fixtures for processing and packaging lines.', uses: 'Custom guides and change parts\nPrototype packaging\nMolds and forming tools' },
        { name: 'Aerospace', desc: 'Lightweight, complex geometry for prototyping and tooling.', uses: 'Ducting and housings\nFlight-test prototypes\nAssembly jigs' }
      ]
    },
    services: {
      title: 'Our services',
      text: 'Manufacturing capabilities backed by engineers who review your design before it is printed.',
      groupTitle: 'Advance Manufacturing',
      groupText: 'Industrial additive manufacturing in metal and plastic.',
      categories: [
        { name: 'Metal 3D printing', desc: 'Strong, functional metal parts for demanding applications.' },
        { name: 'Plastic 3D printing', desc: 'A range of plastic technologies, from quick prototypes to production-grade parts.' }
      ],
      technologies: [
        { category: 'Metal 3D printing', name: 'DMLS / SLM', desc: 'Laser powder-bed fusion for dense, high-strength metal parts.' },
        { category: 'Plastic 3D printing', name: 'FDM', desc: 'Fused deposition modeling. Economical, durable parts in engineering thermoplastics.' },
        { category: 'Plastic 3D printing', name: 'SLA', desc: 'Stereolithography. Smooth surface finish and fine detail from liquid resin.' },
        { category: 'Plastic 3D printing', name: 'MJF', desc: 'Multi Jet Fusion. Strong, consistent nylon parts, great for small batches.' }
      ]
    },
    materials: {
      title: 'Materials',
      text: 'Choose a technology to see the materials we support and download their datasheets.',
      technologies: [
        { name: 'FDM', desc: 'Fused deposition modeling. Strong thermoplastic parts for prototypes and end-use.' },
        { name: 'SLA', desc: 'Stereolithography. High detail and smooth surfaces using photopolymer resin.' },
        { name: 'MJF', desc: 'Multi Jet Fusion. Durable nylon parts with consistent mechanical properties.' }
      ],
      items: [
        { name: 'PLA', tech: 'FDM', desc: 'Best all-rounder for prototypes, models and display parts.', props: 'Density 1.24 g/cm³\nEasy to print', datasheet: '', datasheetName: '' },
        { name: 'PETG', tech: 'FDM', desc: 'Tougher than PLA, handles light outdoor use.', props: 'Density 1.27 g/cm³\nGood chemical resistance', datasheet: '', datasheetName: '' },
        { name: 'ABS', tech: 'FDM', desc: 'Heat resistant, easy to sand and finish.', props: 'Density 1.04 g/cm³\nHeat resistant', datasheet: '', datasheetName: '' },
        { name: 'ASA', tech: 'FDM', desc: 'UV-stable, built for outdoor enclosures.', props: 'Density 1.07 g/cm³\nUV stable', datasheet: '', datasheetName: '' },
        { name: 'Nylon', tech: 'FDM', desc: 'Strong and wear-resistant. Gears, hinges.', props: 'Density 1.14 g/cm³\nWear resistant', datasheet: '', datasheetName: '' },
        { name: 'TPU', tech: 'FDM', desc: 'Flexible. Grips, gaskets, bumpers.', props: 'Density 1.21 g/cm³\nFlexible', datasheet: '', datasheetName: '' },
        { name: 'Standard resin', tech: 'SLA', desc: 'Fine detail and smooth finish for visual models.', props: 'Smooth surface\nHigh detail', datasheet: '', datasheetName: '' },
        { name: 'PA12 (Nylon 12)', tech: 'MJF', desc: 'Strong, durable functional parts and small batches.', props: 'Isotropic strength\nGood chemical resistance', datasheet: '', datasheetName: '' }
      ]
    }
  },
  inquiries: []
};

defaults.pages.home = {
  title: 'Recent work',
  text: 'A look at parts we have printed for customers.',
  slides: []
};
defaults.pages.industries.slides = [
  { image: '', title: 'Built for your industry', text: 'From automotive to aerospace, we print parts that fit real production needs.' },
  { image: '', title: 'Prototype to production', text: 'Iterate quickly without tooling cost.' }
];
defaults.pages.services.slides = [
  { image: '', title: 'Advance manufacturing', text: 'Metal and plastic 3D printing under one roof.' },
  { image: '', title: 'Engineer-reviewed', text: 'We check your design before we print it.' }
];
defaults.pages.materials.slides = [
  { image: '', title: 'Engineering materials', text: 'Choose a technology, compare materials, download datasheets.' }
];

const load = () => {
  if (!fs.existsSync(DB)) return structuredClone(defaults);
  const d = JSON.parse(fs.readFileSync(DB, 'utf8'));
  const pages = {};
  for (const k of Object.keys(defaults.pages)) pages[k] = { ...defaults.pages[k], ...(d.pages || {})[k] };
  return {
    content: { ...defaults.content, ...d.content },
    pricing: { ...defaults.pricing, ...d.pricing },
    pages,
    inquiries: d.inquiries || []
  };
};
const save = d => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
if (!fs.existsSync(DB)) save(defaults);

const rnd = (f) => crypto.randomBytes(8).toString('hex') + path.extname(f.originalname).toLowerCase();

// Inquiry uploads (STEP file + drawings)
const upload = multer({
  storage: multer.diskStorage({ destination: UP, filename: (_, f, cb) => cb(null, rnd(f)) }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, f, cb) =>
    /\.(step|stp|stl|3mf|obj|pdf|zip|dxf|dwg|png|jpg|jpeg)$/i.test(f.originalname)
      ? cb(null, true)
      : cb(new Error('Allowed files: STEP, STL, 3MF, OBJ, PDF, ZIP, DXF, DWG, PNG, JPG'))
});

// Material datasheet PDFs (admin)
const uploadSheet = multer({
  storage: multer.diskStorage({ destination: DS, filename: (_, f, cb) => cb(null, rnd(f)) }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_, f, cb) =>
    /\.pdf$/i.test(f.originalname) ? cb(null, true) : cb(new Error('Datasheet must be a PDF'))
});

// Page images (admin)
const uploadImage = multer({
  storage: multer.diskStorage({ destination: IM, filename: (_, f, cb) => cb(null, rnd(f)) }),
  limits: { fileSize: 6 * 1024 * 1024 },
  fileFilter: (_, f, cb) =>
    /\.(jpe?g|png|webp|gif)$/i.test(f.originalname) ? cb(null, true) : cb(new Error('Image must be JPG, PNG, WEBP or GIF'))
});

const app = express();
app.use(cors()); app.use(express.json({ limit: '1mb' }));

const auth = (req, res, next) => {
  try { jwt.verify((req.headers.authorization || '').replace('Bearer ', '') || req.query.t, SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
};

// ---------- Public ----------
app.get('/api/content', (_, res) => { const { content, pricing, pages } = load(); res.json({ content, pricing, pages }); });

app.get('/api/datasheets/:file', (req, res) => {
  const f = path.join(DS, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.type('application/pdf').sendFile(f);
});

app.get('/api/images/:file', (req, res) => {
  const f = path.join(IM, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).end();
  res.set('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(f);
});

app.post('/api/inquiries', (req, res) =>
  upload.fields([{ name: 'file', maxCount: 1 }, { name: 'drawings', maxCount: 5 }])(req, res, err => {
    const files = req.files || {};
    const main = (files.file || [])[0];
    const drawings = files.drawings || [];
    const cleanup = () => [main, ...drawings].filter(Boolean).forEach(f => fs.unlink(f.path, () => {}));

    if (err) {
      cleanup();
      return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 15 MB' : err.message });
    }

    const { name, email, phone = '', topic = '', message, notes = '' } = req.body || {};
    if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || !message) {
      cleanup();
      return res.status(400).json({ error: 'Name, a valid email and a message are required' });
    }

    const db = load();
    db.inquiries.unshift({
      id: Date.now().toString(36),
      name: String(name).slice(0, 100),
      email: String(email).slice(0, 120),
      phone: String(phone).slice(0, 30),
      topic: String(topic).slice(0, 60),
      message: String(message).slice(0, 4000),
      notes: String(notes).slice(0, 2000),
      file: main ? main.filename : null,
      fileName: main ? main.originalname : null,
      drawings: drawings.map(f => ({ file: f.filename, fileName: f.originalname })),
      status: 'new',
      createdAt: new Date().toISOString()
    });
    save(db);
    res.json({ ok: true });
  })
);

// ---------- Admin ----------
app.post('/api/login', (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const okEmail = safeEq(String(email).trim().toLowerCase(), ADMIN_EMAIL);
  const okPass = safeEq(password, ADMIN_PASSWORD);
  if (!okEmail || !okPass) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: jwt.sign({ admin: true }, SECRET, { expiresIn: '12h' }) });
});

app.get('/api/admin/data', auth, (_, res) => res.json(load()));
app.put('/api/admin/content', auth, (req, res) => { const d = load(); d.content = req.body; save(d); res.json({ ok: true }); });
app.put('/api/admin/pricing', auth, (req, res) => { const d = load(); d.pricing = req.body; save(d); res.json({ ok: true }); });
app.put('/api/admin/pages', auth, (req, res) => { const d = load(); d.pages = req.body; save(d); res.json({ ok: true }); });

app.post('/api/admin/datasheet', auth, (req, res) =>
  uploadSheet.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'File is larger than 15 MB' : err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    res.json({ file: req.file.filename, fileName: req.file.originalname });
  })
);

app.post('/api/admin/image', auth, (req, res) =>
  uploadImage.single('file')(req, res, err => {
    if (err) return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image is larger than 6 MB' : err.message });
    if (!req.file) return res.status(400).json({ error: 'No file received' });
    res.json({ file: req.file.filename });
  })
);

app.get('/api/admin/files/:name', auth, (req, res) => {
  let found = null;
  for (const i of load().inquiries) {
    if (i.file === req.params.name) { found = { file: i.file, fileName: i.fileName }; break; }
    const d = (i.drawings || []).find(f => f.file === req.params.name);
    if (d) { found = d; break; }
  }
  if (!found) return res.status(404).end();
  res.download(path.join(UP, found.file), found.fileName);
});

app.patch('/api/admin/inquiries/:id', auth, (req, res) => {
  const d = load(), q = d.inquiries.find(i => i.id === req.params.id);
  if (q) q.status = req.body.status;
  save(d); res.json({ ok: true });
});

app.delete('/api/admin/inquiries/:id', auth, (req, res) => {
  const d = load(), q = d.inquiries.find(i => i.id === req.params.id);
  if (q?.file) fs.unlink(path.join(UP, q.file), () => {});
  (q?.drawings || []).forEach(f => fs.unlink(path.join(UP, f.file), () => {}));
  d.inquiries = d.inquiries.filter(i => i.id !== req.params.id);
  save(d);
  res.json({ ok: true });
});

const dist = path.join(__dirname, '../client/dist');
const indexHtml = path.join(dist, 'index.html');

// Static files must be served BEFORE the catch-all below, otherwise every
// request (including /assets/*.js) hits the 404 handler and the page is blank.
if (fs.existsSync(dist)) app.use(express.static(dist));

// Unknown API routes get JSON
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// Homepage gets 200; any other unknown path gets the SPA with a 404 status
app.use((req, res) => {
  if (!fs.existsSync(indexHtml)) {
    return res.status(404).type('text/plain').send('Client build not found. Run "npm run build" in /client first.');
  }
  const isHome = req.path === '/' || req.path === '/index.html';
  res.status(isHome ? 200 : 404).sendFile(indexHtml);
});

app.listen(PORT, () => console.log('Server on :' + PORT));