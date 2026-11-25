import {StrictMode, type ReactNode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { GalleryPage } from './pages/GalleryPage';
import { SketchesPage } from './pages/SketchesPage';
import { SubmitPage } from './pages/SubmitPage';
import { SignInPage } from './pages/SignInPage';
import { ModerationPage } from './pages/ModerationPage';
import './index.css';

const fromQuery = new URLSearchParams(window.location.search).get('path');
const path = (fromQuery || window.location.pathname).replace(/\/$/, '') || '/';
const routes: Record<string, ReactNode> = {
  '/gallery': <GalleryPage />,
  '/sketches': <SketchesPage />,
  '/submit': <SubmitPage />,
  '/signin': <SignInPage />,
  '/moderation': <ModerationPage />,
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {routes[path] ?? <App />}
  </StrictMode>,
);
