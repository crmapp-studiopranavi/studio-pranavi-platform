import { useState } from 'react';
import type {
  ParsedImport,
  DuplicateAction,
  ParsedRow,
} from '../../../lib/data-import/import-engine';

interface Props {
  parsed: ParsedImport;
  onConfirm: (resolvedRows: ParsedRow[]) => void;
  onBack: () => void;
}

const ACTION_LABELS: Record<DuplicateAction, string> = {
  skip: 'Skip',
  update: 'Update Existing',
  create_new: 'Create New',
};

export function StepDuplicates({ parsed, onConfirm, onBack }: Props) {
  const dupRows = parsed.rows.filter((r) => r.duplicateMatch !== null);
  const [actions, setActions] = useState<Record<number, DuplicateAction>>(
    Object.fromEntries(dupRows.map((r) => [r.index, 'skip' as DuplicateAction]))
  );

  function setAll(action: DuplicateAction) {
    setActions(Object.fromEntries(dupRows.map((r) => [r.index, action])));
  }

  function handleConfirm() {
    const resolved = parsed.rows.map((r) =>
      r.duplicateMatch ? { ...r, duplicateAction: actions[r.index] ?? 'skip' } : r
    );
    onConfirm(resolved);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {dupRows.length} row(s) match existing records. Choose how to handle each.
      </p>

      <div className="flex gap-2">
        {(['skip', 'update', 'create_new'] as DuplicateAction[]).map((a) => (
          <button
            key={a}
            onClick={() => setAll(a)}
            className="rounded-md border px-3 py-1 text-xs hover:bg-accent"
          >
            All: {ACTION_LABELS[a]}
          </button>
        ))}
      </div>

      <div className="max-h-72 overflow-y-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              <th className="px-2 py-1 text-left">Row</th>
              <th className="px-2 py-1 text-left">Name</th>
              <th className="px-2 py-1 text-left">Match</th>
              <th className="px-2 py-1 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {dupRows.map((r) => (
              <tr key={r.index} className="border-t">
                <td className="px-2 py-1 font-mono text-xs">{r.index + 2}</td>
                <td className="px-2 py-1">{r.mapped['full_name'] ?? r.mapped['name'] ?? '—'}</td>
                <td className="px-2 py-1 text-xs text-muted-foreground">
                  {r.duplicateMatch?.matchField}: {r.mapped[r.duplicateMatch?.matchField ?? '']}
                </td>
                <td className="px-2 py-1">
                  <select
                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                    value={actions[r.index] ?? 'skip'}
                    onChange={(e) =>
                      setActions((prev) => ({
                        ...prev,
                        [r.index]: e.target.value as DuplicateAction,
                      }))
                    }
                  >
                    {Object.entries(ACTION_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Back
        </button>
        <button
          onClick={handleConfirm}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Preview Import
        </button>
      </div>
    </div>
  );
}
