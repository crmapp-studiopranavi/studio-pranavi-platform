const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(paise: number | null | undefined): string {
  if (paise == null) return '—';
  return inrFormatter.format(paise / 100);
}

export function formatBudgetRange(
  minPaise: number | null | undefined,
  maxPaise: number | null | undefined
): string {
  if (minPaise == null && maxPaise == null) return '—';
  if (minPaise == null) return `Up to ${formatCurrency(maxPaise)}`;
  if (maxPaise == null) return `From ${formatCurrency(minPaise)}`;
  return `${formatCurrency(minPaise)} – ${formatCurrency(maxPaise)}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}
