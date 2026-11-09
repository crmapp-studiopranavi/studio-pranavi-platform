import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout';
import { PageFallback } from './components/layout/PageFallback';

// Eager — above the fold, always rendered
import { HomePage } from './pages/HomePage';

// Lazy — loaded on demand
const ProjectsPage = lazy(() =>
  import('./pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('./pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const ExpertisePage = lazy(() =>
  import('./pages/expertise/ExpertisePage').then((m) => ({ default: m.ExpertisePage }))
);
const ExpertiseDetailPage = lazy(() =>
  import('./pages/expertise/ExpertiseDetailPage').then((m) => ({ default: m.ExpertiseDetailPage }))
);
const StudioAboutPage = lazy(() =>
  import('./pages/studio/StudioAboutPage').then((m) => ({ default: m.StudioAboutPage }))
);
const StudioCraftsmanshipPage = lazy(() =>
  import('./pages/studio/StudioCraftsmanshipPage').then((m) => ({
    default: m.StudioCraftsmanshipPage,
  }))
);
const StudioMaterialsPage = lazy(() =>
  import('./pages/studio/StudioMaterialsPage').then((m) => ({ default: m.StudioMaterialsPage }))
);
const StudioProcessPage = lazy(() =>
  import('./pages/studio/StudioProcessPage').then((m) => ({ default: m.StudioProcessPage }))
);
const CataloguePage = lazy(() =>
  import('./pages/CataloguePage').then((m) => ({ default: m.CataloguePage }))
);
const CollectionsPage = lazy(() =>
  import('./pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage }))
);
const StartProjectPage = lazy(() =>
  import('./pages/StartProjectPage').then((m) => ({ default: m.StartProjectPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // ── Home ────────────────────────────────────────────────────────────
      { index: true, element: <HomePage /> },

      // ── Projects (canonical) ────────────────────────────────────────────
      { path: 'projects', element: withSuspense(<ProjectsPage />) },
      { path: 'projects/:slug', element: withSuspense(<ProjectDetailPage />) },

      // ── Expertise (canonical) ───────────────────────────────────────────
      { path: 'expertise', element: withSuspense(<ExpertisePage />) },
      { path: 'expertise/:slug', element: withSuspense(<ExpertiseDetailPage />) },

      // ── Studio sub-pages ────────────────────────────────────────────────
      { path: 'studio', element: <Navigate to="/studio/about" replace /> },
      { path: 'studio/about', element: withSuspense(<StudioAboutPage />) },
      { path: 'studio/craftsmanship', element: withSuspense(<StudioCraftsmanshipPage />) },
      { path: 'studio/materials', element: withSuspense(<StudioMaterialsPage />) },
      { path: 'studio/process', element: withSuspense(<StudioProcessPage />) },

      // ── Catalogue & Collections (stubs) ─────────────────────────────────
      { path: 'catalogue', element: withSuspense(<CataloguePage />) },
      { path: 'collections', element: withSuspense(<CollectionsPage />) },

      // ── Start a Project (canonical) ─────────────────────────────────────
      { path: 'start-a-project', element: withSuspense(<StartProjectPage />) },

      // ── Contact & Privacy (preserved) ───────────────────────────────────
      { path: 'contact', element: withSuspense(<ContactPage />) },
      { path: 'privacy', element: withSuspense(<PrivacyPage />) },

      // ── Legacy redirects (bookmarks & external links preserved) ─────────
      { path: 'portfolio', element: <Navigate to="/projects" replace /> },
      { path: 'portfolio/:slug', element: <Navigate to="/projects" replace /> },
      { path: 'services', element: <Navigate to="/expertise" replace /> },
      { path: 'services/:slug', element: <Navigate to="/expertise" replace /> },
      { path: 'about', element: <Navigate to="/studio/about" replace /> },
      { path: 'get-a-quote', element: <Navigate to="/start-a-project" replace /> },

      // ── 404 ─────────────────────────────────────────────────────────────
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
