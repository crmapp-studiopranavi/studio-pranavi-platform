import type { FieldConfig } from './column-map';

export interface FieldError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[]; // hard failures — required field missing; row is blocked
  warnings: FieldError[]; // soft warnings — format issues on optional fields; row can still be imported
  coerced: Record<string, unknown>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+\d\s\-().]{7,20}$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false;
  const [year, month, day] = s.split('-').map(Number);
  const d = new Date(s);
  return (
    !isNaN(d.getTime()) &&
    d.getUTCFullYear() === year &&
    d.getUTCMonth() + 1 === month &&
    d.getUTCDate() === day
  );
}

export function validateRow(
  config: FieldConfig[],
  row: Record<string, string | undefined>
): ValidationResult {
  const errors: FieldError[] = [];
  const warnings: FieldError[] = [];
  const coerced: Record<string, unknown> = {};

  for (const field of config) {
    const raw = (row[field.field] ?? '').trim();

    if (!raw) {
      if (field.required) {
        // Hard failure — required field is empty, row cannot be imported
        errors.push({ field: field.field, message: `${field.label} is required` });
      }
      continue;
    }

    switch (field.type) {
      case 'email':
        if (!EMAIL_RE.test(raw)) {
          // Soft warning — store raw value, flag as suspicious
          warnings.push({
            field: field.field,
            message: `${field.label}: "${raw}" doesn't look like a valid email — will be stored as-is`,
          });
          coerced[field.field] = raw.toLowerCase();
        } else {
          coerced[field.field] = raw.toLowerCase();
        }
        break;

      case 'phone':
        if (!PHONE_RE.test(raw)) {
          // Soft warning — store raw value
          warnings.push({
            field: field.field,
            message: `${field.label}: "${raw}" has an unusual format — will be stored as-is`,
          });
          coerced[field.field] = raw;
        } else {
          coerced[field.field] = raw;
        }
        break;

      case 'enum':
        if (!field.enumValues?.includes(raw)) {
          // Soft warning — store null rather than an invalid enum value
          warnings.push({
            field: field.field,
            message: `${field.label}: "${raw}" is not a recognised value (${field.enumValues?.join(', ')}) — field will be left blank`,
          });
          // Don't coerce — leave field absent so DB default applies
        } else {
          coerced[field.field] = raw;
        }
        break;

      case 'date':
        if (!isValidDate(raw)) {
          // Soft warning — store null
          warnings.push({
            field: field.field,
            message: `${field.label}: "${raw}" is not YYYY-MM-DD — field will be left blank`,
          });
          // Don't coerce
        } else {
          coerced[field.field] = raw;
        }
        break;

      case 'budget_paise': {
        const n = Number(raw.replace(/[,\s₹]/g, ''));
        if (isNaN(n) || n < 0) {
          warnings.push({
            field: field.field,
            message: `${field.label}: "${raw}" is not a valid number — field will be left blank`,
          });
          // Don't coerce
        } else {
          coerced[field.field] = Math.round(n * 100);
        }
        break;
      }

      default:
        coerced[field.field] = raw;
    }
  }

  // valid = no hard errors (warnings are allowed)
  return { valid: errors.length === 0, errors, warnings, coerced };
}
