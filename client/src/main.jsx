import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { fixLegacy } from './router.js';
import './styles.css';

fixLegacy(); // old "#/services" links -> "/services"
createRoot(document.getElementById('root')).render(<App />);
