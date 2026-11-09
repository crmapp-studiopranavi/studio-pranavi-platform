import type { EntityType } from '../../../lib/data-import/column-map';

const ENTITY_OPTIONS: { value: EntityType; label: string; description: string }[] = [
  { value: 'leads', label: 'Leads', description: 'Prospective customers and enquiries' },
  { value: 'customers', label: 'Customers', description: 'Confirmed customer accounts' },
  { value: 'orders', label: 'Orders', description: 'Customer orders (requires existing customer)' },
  { value: 'projects', label: 'Projects', description: 'Projects linked to customers or orders' },
  { value: 'tasks', label: 'Tasks', description: 'Team tasks and to-dos' },
];

interface Props {
  onSelect: (entity: EntityType) => void;
}

export function StepSelectEntity({ onSelect }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select the type of data you want to import. Download the template CSV to see required
        columns.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ENTITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className="rounded-lg border border-border p-4 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="font-medium">{opt.label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{opt.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
