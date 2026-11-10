import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './components/layout/RootLayout';
import { HomePage } from './pages/HomePage';

const ProductsPage = lazy(() =>
  import('./pages/ProductsPage').then((m) => ({ default: m.ProductsPage }))
);
const CollectionsPage = lazy(() =>
  import('./pages/CollectionsPage').then((m) => ({ default: m.CollectionsPage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const EnquiryPage = lazy(() =>
  import('./pages/EnquiryPage').then((m) => ({ default: m.EnquiryPage }))
);
const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((m) => ({ default: m.ContactPage }))
);
const PrivacyPage = lazy(() =>
  import('./pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage }))
);
const PartnersPage = lazy(() =>
  import('./pages/PartnersPage').then((m) => ({ default: m.PartnersPage }))
);
const CareerPage = lazy(() =>
  import('./pages/CareerPage').then((m) => ({ default: m.CareerPage }))
);
const ShowroomPage = lazy(() =>
  import('./pages/ShowroomPage').then((m) => ({ default: m.ShowroomPage }))
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

function withSuspense(element: React.ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border border-brand-border border-t-brand-text" />
        </div>
      }
    >
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: withSuspense(<ProductsPage />) },
      { path: 'collections', element: withSuspense(<CollectionsPage />) },
      { path: 'about', element: withSuspense(<AboutPage />) },
      { path: 'enquiry', element: withSuspense(<EnquiryPage />) },
      { path: 'contact', element: withSuspense(<ContactPage />) },
      { path: 'privacy', element: withSuspense(<PrivacyPage />) },
      { path: 'partners', element: withSuspense(<PartnersPage />) },
      { path: 'career', element: withSuspense(<CareerPage />) },
      { path: 'showroom', element: withSuspense(<ShowroomPage />) },
      { path: '*', element: withSuspense(<NotFoundPage />) },
    ],
  },
]);
