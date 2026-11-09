export { LEAD_STATUSES, STATUS_LABEL, NEXT_STATUS } from './lead-constants';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: 'New', className: 'bg-blue-100 text-blue-800' },
  contacted: { label: 'Contacted', className: 'bg-indigo-100 text-indigo-800' },
  site_visit_scheduled: {
    label: 'Site Visit Scheduled',
    className: 'bg-purple-100 text-purple-800',
  },
  site_visit_completed: { label: 'Site Visit Done', className: 'bg-violet-100 text-violet-800' },
  quote_drafting: { label: 'Quote Drafting', className: 'bg-yellow-100 text-yellow-800' },
  quote_sent: { label: 'Quote Sent', className: 'bg-orange-100 text-orange-800' },
  negotiation: { label: 'Negotiation', className: 'bg-amber-100 text-amber-800' },
  won: { label: 'Won', className: 'bg-green-100 text-green-800' },
  lost: { label: 'Lost', className: 'bg-red-100 text-red-800' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600' },
};

export function LeadStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
