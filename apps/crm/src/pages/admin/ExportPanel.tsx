import { useState } from 'react';
import { Download, FileDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  EXPORT_CONFIGS,
  generateCsvBlob,
  downloadBlob,
  sanitiseValue,
} from '../../lib/data-export/export-engine';

const ENTITY_TABLES: Record<string, string> = {
  leads: 'leads',
  customers: 'customers',
  tasks: 'tasks',
  site_visits: 'site_visits',
  measurements: 'measurements',
  quotations: 'quotes',
  orders: 'orders',
  projects: 'projects',
  installations: 'installations',
  invoices: 'invoices',
  payments: 'payments',
};

const ENTITY_LABELS: Record<string, string> = {
  leads: 'Leads',
  customers: 'Customers',
  tasks: 'Tasks',
  site_visits: 'Site Visits',
  measurements: 'Measurements',
  quotations: 'Quotations',
  orders: 'Orders',
  projects: 'Projects',
  installations: 'Installations',
  invoices: 'Invoices',
  payments: 'Payments',
};

type LoadingState = { csv: boolean; xlsx: boolean };
type ErrorState = string | null;

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function logExportJob(
  entityType: string,
  format: 'csv' | 'xlsx',
  rowCount: number
): Promise<void> {
  // actor_id is set server-side by RLS trigger; cast to bypass strict Insert type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.from('export_jobs') as any).insert({
    entity_type: entityType,
    format,
    scope: 'all',
    row_count: rowCount,
  });
  // Intentionally ignore errors — logging is best-effort
}

async function fetchRecords(entity: string): Promise<Record<string, unknown>[]> {
  const table = ENTITY_TABLES[entity];
  // Cast to `any` because the typed client only accepts literal table names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await (supabase.from(table as any) as any).select('*')) as {
    data: Record<string, unknown>[] | null;
    error: { message: string } | null;
  };
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

interface EntityCardProps {
  entity: string;
}

function EntityCard({ entity }: EntityCardProps) {
  const [loading, setLoading] = useState<LoadingState>({ csv: false, xlsx: false });
  const [error, setError] = useState<ErrorState>(null);

  const label = ENTITY_LABELS[entity] ?? entity;
  const config = EXPORT_CONFIGS[entity];

  async function handleCsvDownload() {
    setError(null);
    setLoading((prev) => ({ ...prev, csv: true }));
    try {
      const records = await fetchRecords(entity);
      const blob = generateCsvBlob(config, records);
      downloadBlob(blob, `${entity}_export_${todayStr()}.csv`);
      await logExportJob(entity, 'csv', records.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading((prev) => ({ ...prev, csv: false }));
    }
  }

  async function handleXlsxDownload() {
    setError(null);
    setLoading((prev) => ({ ...prev, xlsx: true }));
    try {
      const records = await fetchRecords(entity);
      const ExcelJS = await import('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(label);

      // Add header row — sanitise in case config headers ever contain special chars
      sheet.addRow(config.columns.map((c) => sanitiseValue(c.header)));

      // Add data rows with formula injection protection
      for (const record of records) {
        sheet.addRow(config.columns.map((c) => sanitiseValue(record[c.key])));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      downloadBlob(blob, `${entity}_export_${todayStr()}.xlsx`);
      await logExportJob(entity, 'xlsx', records.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading((prev) => ({ ...prev, xlsx: false }));
    }
  }

  const isAnyLoading = loading.csv || loading.xlsx;

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="font-medium text-sm">{label}</span>
      </div>

      {error && (
        <p className="text-xs text-destructive rounded bg-destructive/10 px-2 py-1">{error}</p>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          onClick={handleCsvDownload}
          disabled={isAnyLoading}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          {loading.csv ? 'Exporting…' : 'Download CSV'}
        </button>

        <button
          onClick={handleXlsxDownload}
          disabled={isAnyLoading}
          className="flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground disabled:opacity-50 transition-colors"
        >
          <FileDown className="h-3.5 w-3.5" />
          {loading.xlsx ? 'Exporting…' : 'Download XLSX'}
        </button>
      </div>
    </div>
  );
}

export function ExportPanel() {
  const entities = Object.keys(EXPORT_CONFIGS);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Export Data</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Download all records for any entity as CSV or XLSX. Each export is logged for audit
          purposes.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entities.map((entity) => (
          <EntityCard key={entity} entity={entity} />
        ))}
      </div>
    </div>
  );
}
