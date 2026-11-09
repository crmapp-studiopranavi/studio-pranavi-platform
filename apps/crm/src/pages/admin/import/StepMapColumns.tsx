import { useState } from 'react';
import {
  ENTITY_FIELD_CONFIGS,
  resolveHeaders,
  type EntityType,
  type HeaderResolution,
} from '../../../lib/data-import/column-map';

interface Props {
  entity: EntityType;
  sourceHeaders: string[];
  onConfirm: (resolutions: HeaderResolution[]) => void;
}

export function StepMapColumns({ entity, sourceHeaders, onConfirm }: Props) {
  const initialResolutions = resolveHeaders(entity, sourceHeaders);
  const [resolutions, setResolutions] = useState<HeaderResolution[]>(initialResolutions);
  const fieldOptions = ENTITY_FIELD_CONFIGS[entity].map((f) => f.field);

  function updateTarget(sourceIdx: number, target: string | null) {
    setResolutions((prev) => prev.map((r, i) => (i === sourceIdx ? { ...r, target } : r)));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Map each column from your file to a CRM field. Unrecognised columns are ignored.
      </p>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Your Column</th>
              <th className="px-3 py-2 text-left font-medium">Maps To</th>
            </tr>
          </thead>
          <tbody>
            {resolutions.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{r.source}</td>
                <td className="px-3 py-2">
                  <select
                    className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                    value={r.target ?? ''}
                    onChange={(e) => updateTarget(i, e.target.value || null)}
                  >
                    <option value="">(ignore this column)</option>
                    {fieldOptions.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => onConfirm(resolutions)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Continue to Validation
      </button>
    </div>
  );
}
