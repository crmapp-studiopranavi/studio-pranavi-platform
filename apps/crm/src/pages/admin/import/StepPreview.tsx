import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ParsedRow } from '../../../lib/data-import/import-engine';
import type { EntityType } from '../../../lib/data-import/column-map';

interface Props {
  entity: EntityType;
  rows: ParsedRow[];
  onComplete: (importedCount: number, skippedCount: number, errorCount: number) => void;
  onBack: () => void;
}

const ENTITY_TABLES: Record<EntityType, string> = {
  leads: 'leads',
  customers: 'customers',
  orders: 'orders',
  projects: 'projects',
  tasks: 'tasks',
};

export function StepPreview({ entity, rows, onComplete, onBack }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [includeWarnings, setIncludeWarnings] = useState(true);
  const [importing, setImporting] = useState(false);

  // Hard failures — required field missing → always skipped
  const hardFailed = rows.filter((r) => r.errors.length > 0);
  // Rows with format warnings but no hard errors → importable if user opts in
  const withWarnings = rows.filter(
    (r) => r.errors.length === 0 && r.warnings.length > 0 && r.duplicateAction !== 'skip'
  );
  // Clean rows — no issues
  const clean = rows.filter(
    (r) => r.errors.length === 0 && r.warnings.length === 0 && r.duplicateAction !== 'skip'
  );
  // Explicitly skipped duplicates
  const skippedDups = rows.filter((r) => r.duplicateAction === 'skip');

  const toImport = [...clean, ...(includeWarnings ? withWarnings : [])];
  const toSkip = [...hardFailed, ...skippedDups, ...(!includeWarnings ? withWarnings : [])];

  async function handleConfirm() {
    if (!confirmed || importing) return;
    setImporting(true);

    let importedCount = 0;
    let errorCount = 0;
    const table = ENTITY_TABLES[entity];
    const BATCH = 50;

    try {
      for (let i = 0; i < toImport.length; i += BATCH) {
        const batch = toImport.slice(i, i + BATCH);
        const inserts = batch.filter((r) => r.duplicateAction !== 'update').map((r) => r.coerced);
        const updates = batch.filter((r) => r.duplicateAction === 'update');

        if (inserts.length > 0) {
          const { error } = await supabase.from(table as never).insert(inserts as never);
          if (error) errorCount += inserts.length;
          else importedCount += inserts.length;
        }

        for (const upd of updates) {
          const { error } = await supabase
            .from(table as never)
            .update(upd.coerced as never)
            .eq('id', upd.duplicateMatch!.id);
          if (error) errorCount++;
          else importedCount++;
        }
      }
    } catch {
      errorCount += toImport.length - importedCount;
    } finally {
      setImporting(false);
      onComplete(importedCount, toSkip.length, errorCount);
    }
  }

  const previewHeaders = Object.keys(toImport[0]?.coerced ?? {}).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <span className="font-medium text-green-600">{clean.length} clean rows</span>
        {withWarnings.length > 0 && (
          <span className="font-medium text-amber-600">
            {withWarnings.length} rows with format warnings
          </span>
        )}
        {hardFailed.length > 0 && (
          <span className="font-medium text-red-600">
            {hardFailed.length} rows missing required fields (skipped)
          </span>
        )}
        {skippedDups.length > 0 && (
          <span className="text-muted-foreground">{skippedDups.length} duplicates skipped</span>
        )}
      </div>

      {/* Warning rows toggle */}
      {withWarnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 space-y-2">
          <p className="text-sm font-medium text-amber-800">
            {withWarnings.length} row{withWarnings.length !== 1 ? 's have' : ' has'} format issues
            (e.g. unusual email/phone, unrecognised enum value). These rows can still be imported —
            fields with issues will be stored as-is or left blank.
          </p>
          <label className="flex items-center gap-2 text-sm text-amber-800 cursor-pointer">
            <input
              type="checkbox"
              checked={includeWarnings}
              onChange={(e) => setIncludeWarnings(e.target.checked)}
              className="h-4 w-4"
            />
            Import these rows anyway ({withWarnings.length} rows)
          </label>
          {/* Show warnings detail for first few rows */}
          <details className="text-xs text-amber-700">
            <summary className="cursor-pointer hover:underline">Show warning details</summary>
            <ul className="mt-1 space-y-1 pl-2">
              {withWarnings.slice(0, 10).map((r) => (
                <li key={r.index}>
                  Row {r.index + 2}: {r.warnings.map((w) => w.message).join(' · ')}
                </li>
              ))}
              {withWarnings.length > 10 && <li>…and {withWarnings.length - 10} more</li>}
            </ul>
          </details>
        </div>
      )}

      {/* Hard failures detail */}
      {hardFailed.length > 0 && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 space-y-1">
          <p className="text-sm font-medium text-red-800">
            {hardFailed.length} row{hardFailed.length !== 1 ? 's are' : ' is'} missing required
            fields and cannot be imported.
          </p>
          <details className="text-xs text-red-700">
            <summary className="cursor-pointer hover:underline">Show details</summary>
            <ul className="mt-1 space-y-1 pl-2">
              {hardFailed.slice(0, 10).map((r) => (
                <li key={r.index}>
                  Row {r.index + 2}: {r.errors.map((e) => e.message).join(' · ')}
                </li>
              ))}
              {hardFailed.length > 10 && <li>…and {hardFailed.length - 10} more</li>}
            </ul>
          </details>
        </div>
      )}

      {/* Preview table */}
      {toImport.length > 0 && (
        <div className="max-h-60 overflow-auto rounded-md border text-xs">
          <table className="w-full">
            <thead className="sticky top-0 bg-muted/80">
              <tr>
                {previewHeaders.map((h) => (
                  <th key={h} className="px-2 py-1 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {toImport.slice(0, 20).map((r) => (
                <tr
                  key={r.index}
                  className={`border-t ${r.warnings.length > 0 ? 'bg-amber-50/50' : ''}`}
                >
                  {previewHeaders.map((h) => (
                    <td key={h} className="px-2 py-1">
                      {String(r.coerced[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {toImport.length > 20 && (
            <p className="p-2 text-center text-muted-foreground">
              …and {toImport.length - 20} more rows
            </p>
          )}
        </div>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        I have reviewed the data above and confirm the import
      </label>

      <div className="flex gap-2">
        <button
          onClick={onBack}
          disabled={importing}
          className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={!confirmed || importing || toImport.length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {importing ? 'Importing…' : `Import ${toImport.length} Records`}
        </button>
      </div>
    </div>
  );
}
