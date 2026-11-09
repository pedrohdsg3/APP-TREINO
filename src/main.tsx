import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import './styles.css';
import { App } from './App';
import { Galeria } from './ui/Galeria';
import { iniciarTema } from './lib/tema';

iniciarTema();
const galeria = new URLSearchParams(location.search).has('galeria');
createRoot(document.getElementById('root')!).render(<StrictMode>{galeria ? <Galeria /> : <App />}</StrictMode>);
