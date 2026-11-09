import { CheckCircle, XCircle } from 'lucide-react';
import type { EntityType } from '../../../lib/data-import/column-map';

interface Props {
  entity: EntityType;
  imported: number;
  skipped: number;
  errors: number;
  onImportAnother: () => void;
}

export function StepResult({ entity, imported, skipped, errors, onImportAnother }: Props) {
  return (
    <div className="space-y-4 text-center">
      {errors === 0 ? (
        <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
      ) : (
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
      )}
      <div>
        <p className="text-lg font-semibold">
          {imported} {entity} record{imported !== 1 ? 's' : ''} imported successfully
        </p>
        {skipped > 0 && <p className="text-sm text-muted-foreground">{skipped} rows skipped</p>}
        {errors > 0 && <p className="text-sm text-destructive">{errors} rows failed to insert</p>}
      </div>
      <button
        onClick={onImportAnother}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Import Another File
      </button>
    </div>
  );
}
