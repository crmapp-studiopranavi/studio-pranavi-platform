import { useState } from 'react';
import { ImportWizard } from './import/ImportWizard';
import { ExportPanel } from './ExportPanel';

type Tab = 'import' | 'export';

export function DataManagementPage() {
  const [tab, setTab] = useState<Tab>('import');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Import and export CRM data in bulk.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
        <button
          onClick={() => setTab('import')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'import'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Import
        </button>
        <button
          onClick={() => setTab('export')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            tab === 'export'
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Export
        </button>
      </div>

      {/* Content */}
      {tab === 'import' ? <ImportWizard /> : <ExportPanel />}
    </div>
  );
}
