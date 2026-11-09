export interface ExistingRecord {
  id: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  external_id: string | null;
}

export interface DuplicateMatch {
  id: string;
  matchField: 'email' | 'phone' | 'whatsapp' | 'external_id';
}

export type IncomingKeys = {
  email?: string;
  phone?: string;
  whatsapp?: string;
  external_id?: string;
};

function normalisePhone(v: string | null | undefined): string {
  if (!v) return '';
  return v.replace(/[\s\-().]/g, '');
}

export function detectDuplicates(
  existing: ExistingRecord[],
  incoming: IncomingKeys
): DuplicateMatch | null {
  const inEmail = (incoming.email ?? '').trim().toLowerCase();
  const inPhone = normalisePhone(incoming.phone);
  const inWa = normalisePhone(incoming.whatsapp);
  const inExt = (incoming.external_id ?? '').trim();

  for (const rec of existing) {
    if (inEmail && rec.email && rec.email.toLowerCase() === inEmail) {
      return { id: rec.id, matchField: 'email' };
    }
    if (inPhone && rec.phone && normalisePhone(rec.phone) === inPhone) {
      return { id: rec.id, matchField: 'phone' };
    }
    if (inWa && rec.whatsapp && normalisePhone(rec.whatsapp) === inWa) {
      return { id: rec.id, matchField: 'whatsapp' };
    }
    if (inExt && rec.external_id && rec.external_id.trim() === inExt) {
      return { id: rec.id, matchField: 'external_id' };
    }
  }
  return null;
}
