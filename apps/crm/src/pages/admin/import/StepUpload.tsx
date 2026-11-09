import { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Download, Upload } from 'lucide-react';
import type { EntityType } from '../../../lib/data-import/column-map';
import { ENTITY_FIELD_CONFIGS } from '../../../lib/data-import/column-map';

interface Props {
  entity: EntityType;
  onParsed: (rows: Record<string, string>[]) => void;
}

function downloadTemplate(entity: EntityType) {
  const config = ENTITY_FIELD_CONFIGS[entity];
  const headers = config.map((f) => f.label);
  const exampleRow = config.map((f) => {
    switch (f.type) {
      case 'email':
        return 'example@email.com';
      case 'phone':
        return '+919876543210';
      case 'date':
        return '2026-12-01';
      case 'budget_paise':
        return '100000';
      case 'enum':
        return f.enumValues?.[0] ?? '';
      default:
        return `Sample ${f.label}`;
    }
  });
  const csv = [headers.join(','), exampleRow.join(',')].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${entity}_import_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function StepUpload({ entity, onParsed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();

    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (result.errors.length > 0) {
            setError(`CSV parse error: ${result.errors[0].message}`);
            return;
          }
          if (result.data.length === 0) {
            setError('The file contains no data rows. Add at least one row and try again.');
            return;
          }
          onParsed(result.data);
        },
      });
    } else if (ext === 'xlsx') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const ExcelJS = await import('exceljs');
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(e.target!.result as ArrayBuffer);
          const ws = wb.worksheets[0];
          if (!ws) {
            setError('No worksheet found in XLSX');
            return;
          }
          const rows: Record<string, string>[] = [];
          const headers: string[] = [];
          ws.eachRow((row, rowNum) => {
            if (rowNum === 1) {
              row.eachCell((cell) => headers.push(String(cell.value ?? '')));
            } else {
              const obj: Record<string, string> = {};
              row.eachCell({ includeEmpty: true }, (cell, colNum) => {
                obj[headers[colNum - 1]] = String(cell.value ?? '');
              });
              rows.push(obj);
            }
          });
          if (rows.length === 0) {
            setError('The file contains no data rows. Add at least one row and try again.');
            return;
          }
          onParsed(rows);
        } catch (err) {
          setError(`XLSX parse error: ${(err as Error).message}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setError('Only CSV or XLSX files are supported.');
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => downloadTemplate(entity)}
        className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent"
      >
        <Download className="h-4 w-4" />
        Download Template CSV
      </button>

      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">Drop CSV or XLSX here, or click to browse</p>
        {fileName && <p className="mt-2 text-xs text-muted-foreground">{fileName}</p>}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
