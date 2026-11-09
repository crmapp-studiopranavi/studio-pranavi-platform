import { useState } from 'react';
import type { EntityType, HeaderResolution } from '../../../lib/data-import/column-map';
import { parseAndMap } from '../../../lib/data-import/import-engine';
import type { ParsedImport, ParsedRow } from '../../../lib/data-import/import-engine';
import { StepSelectEntity } from './StepSelectEntity';
import { StepUpload } from './StepUpload';
import { StepMapColumns } from './StepMapColumns';
import { StepValidate } from './StepValidate';
import { StepDuplicates } from './StepDuplicates';
import { StepPreview } from './StepPreview';
import { StepResult } from './StepResult';

type Step =
  'select_entity' | 'upload' | 'map_columns' | 'validate' | 'duplicates' | 'preview' | 'result';

const STEP_LABELS: Record<Step, string> = {
  select_entity: 'Select Entity',
  upload: 'Upload File',
  map_columns: 'Map Columns',
  validate: 'Validate',
  duplicates: 'Duplicates',
  preview: 'Preview',
  result: 'Result',
};

const STEP_ORDER: Step[] = [
  'select_entity',
  'upload',
  'map_columns',
  'validate',
  'duplicates',
  'preview',
  'result',
];

export function ImportWizard() {
  const [step, setStep] = useState<Step>('select_entity');
  const [entity, setEntity] = useState<EntityType | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [resolvedRows, setResolvedRows] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState<{
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);

  function reset() {
    setStep('select_entity');
    setEntity(null);
    setRawRows([]);
    setParsed(null);
    setResolvedRows([]);
    setResult(null);
  }

  const currentIdx = STEP_ORDER.indexOf(step);

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 text-xs" aria-label="Import steps">
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className={[
              'whitespace-nowrap rounded px-2 py-1 font-medium',
              i < currentIdx ? 'text-muted-foreground line-through' : '',
              i === currentIdx ? 'bg-primary/20 text-primary' : '',
              i > currentIdx ? 'text-muted-foreground' : '',
            ].join(' ')}
          >
            {i + 1}. {STEP_LABELS[s]}
          </span>
        ))}
      </nav>

      {step === 'select_entity' && (
        <StepSelectEntity
          onSelect={(e) => {
            setEntity(e);
            setStep('upload');
          }}
        />
      )}

      {step === 'upload' && entity && (
        <StepUpload
          entity={entity}
          onParsed={(rows) => {
            setRawRows(rows);
            setStep('map_columns');
          }}
        />
      )}

      {step === 'map_columns' && entity && rawRows.length > 0 && (
        <StepMapColumns
          entity={entity}
          sourceHeaders={Object.keys(rawRows[0])}
          onConfirm={(resolutions: HeaderResolution[]) => {
            const remapped = rawRows.map((row) => {
              const out: Record<string, string> = {};
              for (const res of resolutions) {
                if (res.target) out[res.target] = row[res.source] ?? '';
              }
              return out;
            });
            const p = parseAndMap(entity, remapped);
            setParsed(p);
            setStep('validate');
          }}
        />
      )}

      {step === 'validate' && parsed && (
        <StepValidate
          parsed={parsed}
          onContinue={() => setStep(parsed.duplicates > 0 ? 'duplicates' : 'preview')}
          onBack={() => setStep('map_columns')}
        />
      )}

      {step === 'duplicates' && parsed && (
        <StepDuplicates
          parsed={parsed}
          onConfirm={(rows) => {
            setResolvedRows(rows);
            setStep('preview');
          }}
          onBack={() => setStep('validate')}
        />
      )}

      {step === 'preview' && entity && (
        <StepPreview
          entity={entity}
          rows={resolvedRows.length > 0 ? resolvedRows : (parsed?.rows ?? [])}
          onComplete={(imported, skipped, errors) => {
            setResult({ imported, skipped, errors });
            setStep('result');
          }}
          onBack={() => setStep(parsed?.duplicates ? 'duplicates' : 'validate')}
        />
      )}

      {step === 'result' && entity && result && (
        <StepResult
          entity={entity}
          imported={result.imported}
          skipped={result.skipped}
          errors={result.errors}
          onImportAnother={reset}
        />
      )}
    </div>
  );
}
