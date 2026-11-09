import { QuotePage } from './QuotePage';

// /start-a-project is the public canonical URL for the quote request form.
// It delegates entirely to QuotePage, which already reads ?service= via useSearchParams.
export function StartProjectPage() {
  return <QuotePage />;
}
