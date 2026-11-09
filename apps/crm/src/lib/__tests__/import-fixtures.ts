export interface RawLeadRow {
  full_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  requirement: string;
  status: string;
  priority: string;
  source: string;
  budget_min_paise: string;
  budget_max_paise: string;
  next_followup_at: string;
  notes: string;
  external_id: string;
}

const FIRST = [
  'Aarav',
  'Priya',
  'Rohan',
  'Meera',
  'Arjun',
  'Kavya',
  'Vivek',
  'Ananya',
  'Raj',
  'Sunita',
];
const LAST = [
  'Sharma',
  'Patel',
  'Singh',
  'Kumar',
  'Gupta',
  'Mehta',
  'Joshi',
  'Verma',
  'Nair',
  'Iyer',
];
const REQS = [
  'Bedroom chandelier',
  'Living room pendant',
  'Office lighting',
  'Kitchen under-cabinet',
];
const STATUSES = ['new', 'contacted', 'site_visit_scheduled', 'quote_drafting', 'won'];
const PRIORITIES = ['low', 'medium', 'high'];
const SOURCES = ['website', 'referral', 'instagram', 'google'];

export function generateLeadRows(count: number): RawLeadRow[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = LAST[Math.floor(i / FIRST.length) % LAST.length];
    const n = i + 1;
    return {
      full_name: `${first} ${last} ${n}`,
      email: `lead${n}@testfixture.invalid`,
      phone: `+9198765${String(n).padStart(5, '0')}`,
      whatsapp: `+9198765${String(n).padStart(5, '0')}`,
      requirement: REQS[i % REQS.length],
      status: STATUSES[i % STATUSES.length],
      priority: PRIORITIES[i % PRIORITIES.length],
      source: SOURCES[i % SOURCES.length],
      budget_min_paise: String(((i % 10) + 1) * 50000),
      budget_max_paise: String(((i % 10) + 2) * 100000),
      next_followup_at: `2027-0${(i % 9) + 1}-01`,
      notes: `Auto-generated fixture row ${n}`,
      external_id: `EXT-${String(n).padStart(5, '0')}`,
    };
  });
}

export const FIXTURE_100 = generateLeadRows(100);
export const FIXTURE_1000 = generateLeadRows(1000);

export const FIXTURE_INVALID: Partial<RawLeadRow>[] = [
  { full_name: '', email: 'bad', status: 'bogus' },
  { full_name: 'OK Name', email: '', budget_min_paise: 'abc' },
  { full_name: 'Date Test', next_followup_at: '31/12/2026' },
];
