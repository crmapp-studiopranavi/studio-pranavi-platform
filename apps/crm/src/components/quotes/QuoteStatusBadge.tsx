const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  internal_review: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-blue-100 text-blue-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  expired: 'bg-orange-100 text-orange-700',
  superseded: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  internal_review: 'Internal Review',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
  superseded: 'Superseded',
  cancelled: 'Cancelled',
};

interface Props {
  status: string;
}

export function QuoteStatusBadge({ status }: Props) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
  const label = STATUS_LABEL[status] ?? status;
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

export { STATUS_LABEL as QUOTE_STATUS_LABEL };
export const QUOTE_STATUSES = Object.keys(STATUS_LABEL);
