import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';

const SettingsPage = lazy(() =>
  import('./pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);

const WebsiteBrandingPage = lazy(() =>
  import('./pages/admin/WebsiteBrandingPage').then((m) => ({ default: m.WebsiteBrandingPage }))
);

const CmsPagesPage = lazy(() =>
  import('./pages/cms/CmsPagesPage').then((m) => ({ default: m.CmsPagesPage }))
);
const CmsPageSectionsPage = lazy(() =>
  import('./pages/cms/CmsPageSectionsPage').then((m) => ({ default: m.CmsPageSectionsPage }))
);
const CmsMediaLibraryPage = lazy(() =>
  import('./pages/cms/CmsMediaLibraryPage').then((m) => ({ default: m.CmsMediaLibraryPage }))
);
const CmsServicesPage = lazy(() =>
  import('./pages/cms/CmsServicesPage').then((m) => ({ default: m.CmsServicesPage }))
);
const CmsProjectsPage = lazy(() =>
  import('./pages/cms/CmsProjectsPage').then((m) => ({ default: m.CmsProjectsPage }))
);
const CmsCollectionsPage = lazy(() =>
  import('./pages/cms/CmsCollectionsPage').then((m) => ({ default: m.CmsCollectionsPage }))
);
const CmsCataloguePage = lazy(() =>
  import('./pages/cms/CmsCataloguePage').then((m) => ({ default: m.CmsCataloguePage }))
);
const CmsTestimonialsPage = lazy(() =>
  import('./pages/cms/CmsTestimonialsPage').then((m) => ({ default: m.CmsTestimonialsPage }))
);
const CmsNavigationPage = lazy(() =>
  import('./pages/cms/CmsNavigationPage').then((m) => ({ default: m.CmsNavigationPage }))
);
const CmsSeoPage = lazy(() =>
  import('./pages/cms/CmsSeoPage').then((m) => ({ default: m.CmsSeoPage }))
);

const FollowUpsPage = lazy(() => import('./pages/sales/FollowUpsPage'));
const SiteVisitsPage = lazy(() => import('./pages/sales/SiteVisitsPage'));
const MeasurementsPage = lazy(() => import('./pages/operations/MeasurementsPage'));
const ProductionPage = lazy(() => import('./pages/operations/ProductionPage'));
const InstallationsPage = lazy(() => import('./pages/operations/InstallationsPage'));
const PaymentsPage = lazy(() => import('./pages/finance/PaymentsPage'));
const OutstandingPage = lazy(() => import('./pages/finance/OutstandingPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AuditPage = lazy(() => import('./pages/admin/AuditPage'));
const DataManagementPage = lazy(() =>
  import('./pages/admin/DataManagementPage').then((m) => ({ default: m.DataManagementPage }))
);

const AutomationRulesPage = lazy(() =>
  import('./pages/admin/AutomationRulesPage').then((m) => ({ default: m.AutomationRulesPage }))
);

const NotificationsPage = lazy(() =>
  import('./pages/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);

const NotificationPreferencesPage = lazy(() =>
  import('./pages/notifications/NotificationPreferencesPage').then((m) => ({
    default: m.NotificationPreferencesPage,
  }))
);

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
// Each bundle is only downloaded when the user navigates to that route.

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const LeadsPage = lazy(() =>
  import('./pages/leads/LeadsPage').then((m) => ({ default: m.LeadsPage }))
);
const LeadDetailPage = lazy(() =>
  import('./pages/leads/LeadDetailPage').then((m) => ({ default: m.LeadDetailPage }))
);
const CustomersPage = lazy(() =>
  import('./pages/customers/CustomersPage').then((m) => ({ default: m.CustomersPage }))
);
const CustomerDetailPage = lazy(() =>
  import('./pages/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage }))
);
const TasksPage = lazy(() =>
  import('./pages/tasks/TasksPage').then((m) => ({ default: m.TasksPage }))
);
const QuotesPage = lazy(() =>
  import('./pages/quotes/QuotesPage').then((m) => ({ default: m.QuotesPage }))
);
const NewQuotePage = lazy(() =>
  import('./pages/quotes/NewQuotePage').then((m) => ({ default: m.NewQuotePage }))
);
const QuoteDetailPage = lazy(() =>
  import('./pages/quotes/QuoteDetailPage').then((m) => ({ default: m.QuoteDetailPage }))
);
const QuotePreviewPage = lazy(() =>
  import('./pages/quotes/QuotePreviewPage').then((m) => ({ default: m.QuotePreviewPage }))
);
const OrdersPage = lazy(() =>
  import('./pages/orders/OrdersPage').then((m) => ({ default: m.OrdersPage }))
);
const OrderDetailPage = lazy(() =>
  import('./pages/orders/OrderDetailPage').then((m) => ({ default: m.OrderDetailPage }))
);
const ProjectsPage = lazy(() =>
  import('./pages/projects/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const ProjectDetailPage = lazy(() =>
  import('./pages/projects/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const InvoicesPage = lazy(() =>
  import('./pages/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage }))
);
const NewInvoicePage = lazy(() =>
  import('./pages/invoices/NewInvoicePage').then((m) => ({ default: m.NewInvoicePage }))
);
const InvoiceDetailPage = lazy(() =>
  import('./pages/invoices/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage }))
);
const InvoicePreviewPage = lazy(() =>
  import('./pages/invoices/InvoicePreviewPage').then((m) => ({ default: m.InvoicePreviewPage }))
);

// ── Suspense wrapper ──────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
function PageLoader() {
  return (
    <div className="flex h-full min-h-[16rem] items-center justify-center p-8">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
        aria-label="Loading page"
      />
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

// eslint-disable-next-line react-refresh/only-export-components
function Protected({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },

  // Quote preview — outside shell for clean print layout
  {
    path: '/quotes/:id/preview',
    element: (
      <Protected>
        <S>
          <QuotePreviewPage />
        </S>
      </Protected>
    ),
  },

  // Invoice preview — outside shell for clean print layout
  {
    path: '/invoices/:id/preview',
    element: (
      <Protected>
        <S>
          <InvoicePreviewPage />
        </S>
      </Protected>
    ),
  },

  // Protected CRM shell
  {
    path: '/',
    element: (
      <Protected>
        <AppShell />
      </Protected>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      {
        path: 'dashboard',
        element: (
          <S>
            <DashboardPage />
          </S>
        ),
      },
      {
        path: 'leads',
        handle: { crumb: 'Leads' },
        element: (
          <S>
            <LeadsPage />
          </S>
        ),
      },
      {
        path: 'leads/:id',
        element: (
          <S>
            <LeadDetailPage />
          </S>
        ),
      },
      {
        path: 'customers',
        handle: { crumb: 'Customers' },
        element: (
          <S>
            <CustomersPage />
          </S>
        ),
      },
      {
        path: 'customers/:id',
        element: (
          <S>
            <CustomerDetailPage />
          </S>
        ),
      },
      {
        path: 'quotes',
        handle: { crumb: 'Quotes' },
        element: (
          <S>
            <QuotesPage />
          </S>
        ),
      },
      {
        path: 'quotes/new',
        element: (
          <S>
            <NewQuotePage />
          </S>
        ),
      },
      {
        path: 'quotes/:id',
        element: (
          <S>
            <QuoteDetailPage />
          </S>
        ),
      },
      {
        path: 'orders',
        handle: { crumb: 'Orders' },
        element: (
          <S>
            <OrdersPage />
          </S>
        ),
      },
      {
        path: 'orders/:id',
        element: (
          <S>
            <OrderDetailPage />
          </S>
        ),
      },
      {
        path: 'projects',
        handle: { crumb: 'Projects' },
        element: (
          <S>
            <ProjectsPage />
          </S>
        ),
      },
      {
        path: 'projects/:id',
        element: (
          <S>
            <ProjectDetailPage />
          </S>
        ),
      },
      {
        path: 'invoices',
        handle: { crumb: 'Invoices' },
        element: (
          <S>
            <InvoicesPage />
          </S>
        ),
      },
      {
        path: 'invoices/new',
        element: (
          <S>
            <NewInvoicePage />
          </S>
        ),
      },
      {
        path: 'invoices/:id',
        element: (
          <S>
            <InvoiceDetailPage />
          </S>
        ),
      },
      {
        path: 'tasks',
        handle: { crumb: 'Tasks' },
        element: (
          <S>
            <TasksPage />
          </S>
        ),
      },
      {
        path: 'admin/settings',
        handle: { crumb: 'Business Settings' },
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <S>
              <SettingsPage />
            </S>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/website-branding',
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <S>
              <WebsiteBrandingPage />
            </S>
          </ProtectedRoute>
        ),
      },
      {
        path: 'cms/pages',
        element: (
          <S>
            <CmsPagesPage />
          </S>
        ),
      },
      {
        path: 'cms/pages/:id/sections',
        element: (
          <S>
            <CmsPageSectionsPage />
          </S>
        ),
      },
      {
        path: 'cms/media',
        element: (
          <S>
            <CmsMediaLibraryPage />
          </S>
        ),
      },
      {
        path: 'cms/services',
        element: (
          <S>
            <CmsServicesPage />
          </S>
        ),
      },
      {
        path: 'cms/projects',
        element: (
          <S>
            <CmsProjectsPage />
          </S>
        ),
      },
      {
        path: 'cms/collections',
        element: (
          <S>
            <CmsCollectionsPage />
          </S>
        ),
      },
      {
        path: 'cms/catalogue',
        element: (
          <S>
            <CmsCataloguePage />
          </S>
        ),
      },
      {
        path: 'cms/testimonials',
        element: (
          <S>
            <CmsTestimonialsPage />
          </S>
        ),
      },
      {
        path: 'cms/navigation',
        element: (
          <S>
            <CmsNavigationPage />
          </S>
        ),
      },
      {
        path: 'cms/seo',
        element: (
          <S>
            <CmsSeoPage />
          </S>
        ),
      },
      {
        path: 'cms/branding',
        element: (
          <S>
            <WebsiteBrandingPage />
          </S>
        ),
      },
      {
        path: 'follow-ups',
        handle: { crumb: 'Follow-ups' },
        element: (
          <S>
            <FollowUpsPage />
          </S>
        ),
      },
      {
        path: 'site-visits',
        handle: { crumb: 'Site Visits' },
        element: (
          <S>
            <SiteVisitsPage />
          </S>
        ),
      },
      {
        path: 'measurements',
        handle: { crumb: 'Measurements' },
        element: (
          <S>
            <MeasurementsPage />
          </S>
        ),
      },
      {
        path: 'production',
        handle: { crumb: 'Production' },
        element: (
          <S>
            <ProductionPage />
          </S>
        ),
      },
      {
        path: 'installations',
        handle: { crumb: 'Installations' },
        element: (
          <S>
            <InstallationsPage />
          </S>
        ),
      },
      {
        path: 'payments',
        handle: { crumb: 'Payments' },
        element: (
          <S>
            <PaymentsPage />
          </S>
        ),
      },
      {
        path: 'outstanding',
        handle: { crumb: 'Outstanding' },
        element: (
          <S>
            <OutstandingPage />
          </S>
        ),
      },
      {
        path: 'reports',
        handle: { crumb: 'Reports' },
        element: (
          <S>
            <ReportsPage />
          </S>
        ),
      },
      {
        path: 'admin/users',
        handle: { crumb: 'Users' },
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <S>
              <UsersPage />
            </S>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/audit',
        handle: { crumb: 'Audit History' },
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <S>
              <AuditPage />
            </S>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/data-management',
        handle: { crumb: 'Data Management' },
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <S>
              <DataManagementPage />
            </S>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/automation',
        handle: { crumb: 'Automation Rules' },
        element: (
          <ProtectedRoute requiredRoles={['admin']}>
            <S>
              <AutomationRulesPage />
            </S>
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        handle: { crumb: 'Notifications' },
        element: (
          <S>
            <NotificationsPage />
          </S>
        ),
      },
      {
        path: 'notifications/preferences',
        handle: { crumb: 'Notification Preferences' },
        element: (
          <S>
            <NotificationPreferencesPage />
          </S>
        ),
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
