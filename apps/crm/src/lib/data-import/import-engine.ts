import { resolveHeaders, ENTITY_FIELD_CONFIGS, type EntityType } from './column-map';
import { validateRow } from './validators';
import { detectDuplicates, type ExistingRecord } from './duplicate-detector';
import type { FieldError } from './validators';

export type DuplicateAction = 'skip' | 'update' | 'create_new';

export interface ParsedRow {
  index: number;
  raw: Record<string, string>;
  mapped: Record<string, string>;
  errors: FieldError[]; // hard failures — required field missing
  warnings: FieldError[]; // soft warnings — format issues, row still importable
  coerced: Record<string, unknown>;
  duplicateMatch: { id: string; matchField: string } | null;
  duplicateAction: DuplicateAction | null;
}

export interface ParsedImport {
  total: number;
  valid: number;
  invalid: number;
  duplicates: number;
  rows: ParsedRow[];
}

export function parseAndMap(
  entity: EntityType,
  rawRows: Record<string, string>[],
  existingRecords: ExistingRecord[] = []
): ParsedImport {
  if (rawRows.length === 0) {
    return { total: 0, valid: 0, invalid: 0, duplicates: 0, rows: [] };
  }

  // Union all keys from all rows so that rows with different columns are all resolved
  const allKeys = new Set<string>();
  for (const row of rawRows) {
    for (const key of Object.keys(row)) {
      allKeys.add(key);
    }
  }
  const headers = Array.from(allKeys);

  const resolutions = resolveHeaders(entity, headers);
  const config = ENTITY_FIELD_CONFIGS[entity];

  const rows: ParsedRow[] = rawRows.map((raw, index) => {
    const mapped: Record<string, string> = {};
    for (const res of resolutions) {
      if (res.target) {
        mapped[res.target] = raw[res.source] ?? '';
      }
    }

    const { errors, warnings, coerced } = validateRow(config, mapped);
    const duplicateMatch = detectDuplicates(existingRecords, {
      email: mapped['email'],
      phone: mapped['phone'],
      whatsapp: mapped['whatsapp'],
      external_id: mapped['external_id'],
    });

    return {
      index,
      raw,
      mapped,
      errors,
      warnings,
      coerced,
      duplicateMatch,
      duplicateAction: null,
    };
  });

  const valid = rows.filter((r) => r.errors.length === 0 && !r.duplicateMatch).length;
  const invalid = rows.filter((r) => r.errors.length > 0).length;
  const duplicates = rows.filter((r) => r.duplicateMatch !== null).length;

  return { total: rows.length, valid, invalid, duplicates, rows };
}
