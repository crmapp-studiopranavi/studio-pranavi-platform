import type { ParsedImport } from '../../../lib/data-import/import-engine';

interface Props {
  parsed: ParsedImport;
  onContinue: () => void;
  onBack: () => void;
}

export function StepValidate({ parsed, onContinue, onBack }: Props) {
  const hasErrors = parsed.invalid > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Rows', value: parsed.total, color: 'text-foreground' },
          { label: 'Valid', value: parsed.valid, color: 'text-green-600' },
          { label: 'Invalid', value: parsed.invalid, color: 'text-destructive' },
          { label: 'Duplicates', value: parsed.duplicates, color: 'text-amber-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border p-3 text-center">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {hasErrors && (
        <div className="max-h-60 overflow-y-auto rounded-md border">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-muted/80">
              <tr>
                <th className="px-2 py-1 text-left">Row</th>
                <th className="px-2 py-1 text-left">Field</th>
                <th className="px-2 py-1 text-left">Error</th>
              </tr>
            </thead>
            <tbody>
              {parsed.rows
                .filter((r) => r.errors.length > 0)
                .flatMap((r) =>
                  r.errors.map((e, ei) => (
                    <tr key={`${r.index}-${ei}`} className="border-t">
                      <td className="px-2 py-1 font-mono">{r.index + 2}</td>
                      <td className="px-2 py-1">{e.field}</td>
                      <td className="px-2 py-1 text-destructive">{e.message}</td>
                    </tr>
                  ))
                )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={onBack} className="rounded-md border px-4 py-2 text-sm hover:bg-accent">
          Back
        </button>
        <button
          onClick={onContinue}
          disabled={parsed.valid === 0 && parsed.duplicates === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {parsed.duplicates > 0 ? 'Review Duplicates' : 'Preview Import'}
        </button>
      </div>
    </div>
  );
}
