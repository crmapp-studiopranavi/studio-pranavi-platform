import { Link } from 'react-router-dom';
import { PageMeta } from '@/components/ui/page-meta';

export function NotFoundPage() {
  return (
    <>
      <PageMeta title="Page Not Found" />
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center bg-white">
        <p className="title-4">404</p>
        <h1 className="title-2 mt-4">Page not found</h1>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-black mt-10">Back to Home</Link>
      </div>
    </>
  );
}
