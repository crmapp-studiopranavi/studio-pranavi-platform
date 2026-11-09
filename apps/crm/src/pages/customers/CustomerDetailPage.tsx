import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useInvoices } from '@/lib/hooks/use-invoices';
import {
  useCustomerDetail,
  useCustomerContacts,
  useCustomerAddresses,
  useCustomerActivities,
  useCustomerTasks,
  useCustomerSiteVisits,
  useCustomerQuotes,
  useCustomerOrders,
  useCustomerProjects,
  useAddCustomerActivity,
  useCreateCustomerTask,
  useUpdateCustomerTask,
  useCreateSiteVisit,
  useUpdateSiteVisit,
  useCreateMeasurement,
  useAddCustomerContact,
  useAddCustomerAddress,
} from '@/lib/hooks/use-customer-detail';
import { useStaffProfiles } from '@/lib/hooks/use-staff-profiles';
import { formatCurrency, formatDate, formatDateTime, isOverdue, relativeDays } from '@/lib/format';
import { Skeleton } from '@/components/ui/skeleton';
import type { TablesUpdate } from '@platform/types';

const ACTIVITY_ICONS: Record<string, string> = {
  note: '📝',
  call: '📞',
  email: '✉️',
  whatsapp: '💬',
  meeting: '🤝',
  site_visit: '🏠',
  status_change: '🔄',
  quote_sent: '📄',
  payment: '💰',
  system: '⚙️',
};

const VISIT_STATUS_LABEL: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  rescheduled: 'Rescheduled',
};

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();

  const { data: customer, isLoading } = useCustomerDetail(id!);
  const { data: contacts = [] } = useCustomerContacts(id!);
  const { data: addresses = [] } = useCustomerAddresses(id!);
  const { data: activities = [] } = useCustomerActivities(id!);
  const { data: tasks = [] } = useCustomerTasks(id!);
  const { data: siteVisits = [] } = useCustomerSiteVisits(id!);
  const { data: staff = [] } = useStaffProfiles();

  const addActivity = useAddCustomerActivity();
  const createTask = useCreateCustomerTask();
  const updateTask = useUpdateCustomerTask();
  const createVisit = useCreateSiteVisit();
  const updateVisit = useUpdateSiteVisit();
  const createMeasurement = useCreateMeasurement();
  const addContact = useAddCustomerContact();
  const addAddress = useAddCustomerAddress();

  const { data: invoicesData } = useInvoices({ customerId: id! });
  const customerInvoices = invoicesData?.invoices ?? [];
  const { data: customerQuotes = [] } = useCustomerQuotes(id!);
  const { data: customerOrders = [] } = useCustomerOrders(id!);
  const { data: customerProjects = [] } = useCustomerProjects(id!);

  const [noteText, setNoteText] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  // Site visit form
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitStart, setVisitStart] = useState('');
  const [visitEnd, setVisitEnd] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [visitAssignee, setVisitAssignee] = useState('');

  // Measurement form
  const [activeMeasurementVisit, setActiveMeasurementVisit] = useState<string | null>(null);
  const [mAreaOrItem, setMAreaOrItem] = useState('');
  const [mWidth, setMWidth] = useState('');
  const [mHeight, setMHeight] = useState('');
  const [mDepth, setMDepth] = useState('');
  const [mQty, setMQty] = useState('1');
  const [mUnit, setMUnit] = useState('mm');
  const [mNotes, setMNotes] = useState('');

  // Contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactTitle, setContactTitle] = useState('');

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrType, setAddrType] = useState('');

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!customer) {
    return <div className="p-6 text-muted-foreground">Customer not found.</div>;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const owner = (customer as any).owner as { id: string; full_name: string | null } | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sourceLead = (customer as any).source_lead as {
    id: string;
    lead_number: number;
    full_name: string;
    status: string;
  } | null;

  const activeTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');
  const doneTasks = tasks.filter((t) => t.status === 'done' || t.status === 'cancelled');

  const handleAddNote = () => {
    if (!noteText.trim() || !profile?.id) return;
    void addActivity
      .mutateAsync({
        customerId: id!,
        actorId: profile.id,
        subject: noteText.trim(),
        activityType: 'note',
      })
      .then(() => setNoteText(''));
  };

  const handleAddTask = () => {
    if (!taskTitle.trim() || !profile?.id) return;
    void createTask
      .mutateAsync({
        customerId: id!,
        createdBy: profile.id,
        title: taskTitle.trim(),
        dueAt: taskDue || undefined,
      })
      .then(() => {
        setTaskTitle('');
        setTaskDue('');
      });
  };

  const handleCompleteTask = (taskId: string) => {
    void updateTask.mutateAsync({
      taskId,
      customerId: id!,
      update: { status: 'done', completed_at: new Date().toISOString() } as TablesUpdate<'tasks'>,
    });
  };

  const handleCreateVisit = () => {
    if (!visitStart) return;
    void createVisit
      .mutateAsync({
        customerId: id!,
        scheduledStart: visitStart,
        scheduledEnd: visitEnd || undefined,
        purpose: visitPurpose || undefined,
        assignedTo: visitAssignee || undefined,
      })
      .then(() => {
        setShowVisitForm(false);
        setVisitStart('');
        setVisitEnd('');
        setVisitPurpose('');
        setVisitAssignee('');
      });
  };

  const handleCompleteVisit = (visitId: string) => {
    void updateVisit.mutateAsync({
      visitId,
      customerId: id!,
      update: {
        status: 'completed',
        completed_at: new Date().toISOString(),
      } as TablesUpdate<'site_visits'>,
    });
  };

  const handleAddMeasurement = () => {
    if (!mAreaOrItem.trim() || !activeMeasurementVisit || !profile?.id) return;
    void createMeasurement
      .mutateAsync({
        siteVisitId: activeMeasurementVisit,
        customerId: id!,
        areaOrItem: mAreaOrItem.trim(),
        widthMm: mWidth ? parseFloat(mWidth) : null,
        heightMm: mHeight ? parseFloat(mHeight) : null,
        depthMm: mDepth ? parseFloat(mDepth) : null,
        quantity: mQty ? parseFloat(mQty) : 1,
        unit: mUnit || 'mm',
        notes: mNotes || undefined,
        recordedBy: profile.id,
      })
      .then(() => {
        setMAreaOrItem('');
        setMWidth('');
        setMHeight('');
        setMDepth('');
        setMQty('1');
        setMUnit('mm');
        setMNotes('');
      });
  };

  const handleAddContact = () => {
    if (!contactName.trim()) return;
    void addContact
      .mutateAsync({
        customerId: id!,
        fullName: contactName.trim(),
        email: contactEmail || undefined,
        phone: contactPhone || undefined,
        title: contactTitle || undefined,
      })
      .then(() => {
        setShowContactForm(false);
        setContactName('');
        setContactEmail('');
        setContactPhone('');
        setContactTitle('');
      });
  };

  const handleAddAddress = () => {
    if (!addrLine1.trim()) return;
    void addAddress
      .mutateAsync({
        customerId: id!,
        line1: addrLine1.trim(),
        line2: addrLine2 || undefined,
        city: addrCity || undefined,
        state: addrState || undefined,
        postalCode: addrPostal || undefined,
        addressType: addrType || undefined,
      })
      .then(() => {
        setShowAddressForm(false);
        setAddrLine1('');
        setAddrLine2('');
        setAddrCity('');
        setAddrState('');
        setAddrPostal('');
        setAddrType('');
      });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link to="/customers" className="hover:underline">
            Customers
          </Link>
          <span>/</span>
          <span>#{customer.customer_number}</span>
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{customer.display_name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Customer #{customer.customer_number}
              {customer.customer_type && ` · ${customer.customer_type}`}
              {' · '}Created {formatDate(customer.created_at)}
            </p>
          </div>
          {sourceLead && (
            <Link
              to={`/leads/${sourceLead.id}`}
              className="rounded border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              Source lead #{sourceLead.lead_number}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contacts */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Contacts</h2>
              <button
                onClick={() => setShowContactForm((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                + Add Contact
              </button>
            </div>

            {showContactForm && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded border border-border p-3 bg-muted/20">
                <input
                  placeholder="Full name *"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="col-span-2 rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Title / role"
                  value={contactTitle}
                  onChange={(e) => setContactTitle(e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="rounded border border-border px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddContact}
                    disabled={!contactName.trim() || addContact.isPending}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-medium">
                      {c.full_name}
                      {c.is_primary && (
                        <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          Primary
                        </span>
                      )}
                    </p>
                    {c.title && <p className="text-xs text-muted-foreground">{c.title}</p>}
                    <div className="mt-0.5 flex gap-3 text-xs text-muted-foreground">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="hover:underline text-primary">
                          {c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="hover:underline text-primary">
                          {c.phone}
                        </a>
                      )}
                      {c.whatsapp_number && (
                        <a
                          href={`https://wa.me/${c.whatsapp_number.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline text-green-600"
                        >
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && (
                <p className="text-sm text-muted-foreground">No contacts.</p>
              )}
            </div>
          </section>

          {/* Addresses */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Addresses</h2>
              <button
                onClick={() => setShowAddressForm((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                + Add Address
              </button>
            </div>

            {showAddressForm && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded border border-border p-3 bg-muted/20">
                <input
                  placeholder="Address type (e.g. site, billing)"
                  value={addrType}
                  onChange={(e) => setAddrType(e.target.value)}
                  className="col-span-2 rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Line 1 *"
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  className="col-span-2 rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Line 2"
                  value={addrLine2}
                  onChange={(e) => setAddrLine2(e.target.value)}
                  className="col-span-2 rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="City"
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="State"
                  value={addrState}
                  onChange={(e) => setAddrState(e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <input
                  placeholder="Postal code"
                  value={addrPostal}
                  onChange={(e) => setAddrPostal(e.target.value)}
                  className="rounded border border-border px-2 py-1.5 text-sm"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="rounded border border-border px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddAddress}
                    disabled={!addrLine1.trim() || addAddress.isPending}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {addresses.map((a) => (
                <div key={a.id} className="text-sm">
                  {a.address_type && (
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {a.address_type}
                      {a.is_primary && ' · Primary'}
                    </p>
                  )}
                  <p>{a.line1}</p>
                  {a.line2 && <p>{a.line2}</p>}
                  <p className="text-muted-foreground">
                    {[a.city, a.state, a.postal_code].filter(Boolean).join(', ')}
                    {a.country_code && a.country_code !== 'IN' && ` · ${a.country_code}`}
                  </p>
                </div>
              ))}
              {addresses.length === 0 && (
                <p className="text-sm text-muted-foreground">No addresses.</p>
              )}
            </div>
          </section>

          {/* Quotes */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Quotations</h2>
              <Link
                to={`/quotes/new?customerId=${id}`}
                className="text-xs text-primary hover:underline"
              >
                + New Quote
              </Link>
            </div>
            {customerQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quotations yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3">Quote #</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(customerQuotes as any[]).map((q) => (
                    <tr key={q.id}>
                      <td className="py-2 pr-3">
                        <Link
                          to={`/quotes/${q.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {q.quote_number}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 capitalize text-muted-foreground">
                        {q.status.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 text-right font-mono">
                        {q.current_version ? formatCurrency(q.current_version.total_minor) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Orders */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Orders</h2>
            {customerOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3">Order #</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Order Date</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customerOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="py-2 pr-3">
                        <Link
                          to={`/orders/${o.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 capitalize text-muted-foreground">
                        {o.status.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatDate(o.order_date)}
                      </td>
                      <td className="py-2 text-right font-mono">{formatCurrency(o.total_minor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Projects */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Projects</h2>
            {customerProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3">Project #</th>
                    <th className="pb-2 pr-3">Name</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customerProjects.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2 pr-3">
                        <Link
                          to={`/projects/${p.id}`}
                          className="font-mono text-primary hover:underline"
                        >
                          {p.project_number}
                        </Link>
                      </td>
                      <td className="py-2 pr-3">{p.name}</td>
                      <td className="py-2 pr-3 capitalize text-muted-foreground">
                        {p.status.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {formatDate(p.target_completion_date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Activity Timeline */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium">Activity Timeline</h2>
            <div className="mb-4 flex gap-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                placeholder="Add a note…"
                className="flex-1 rounded border border-border px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || addActivity.isPending}
                className="self-end rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
              >
                Add Note
              </button>
            </div>
            <div className="space-y-3">
              {activities.map((act) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const actor = (act as any).actor as { full_name: string | null } | null;
                return (
                  <div key={act.id} className="flex gap-3 text-sm">
                    <span className="text-lg">{ACTIVITY_ICONS[act.activity_type] ?? '•'}</span>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium">{act.subject}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(act.occurred_at)}
                        </span>
                      </div>
                      {act.body && (
                        <p className="mt-0.5 text-muted-foreground whitespace-pre-wrap">
                          {act.body}
                        </p>
                      )}
                      {actor?.full_name && (
                        <p className="mt-0.5 text-xs text-muted-foreground">by {actor.full_name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              {activities.length === 0 && (
                <p className="text-sm text-muted-foreground">No activities yet.</p>
              )}
            </div>
          </section>

          {/* Site Visits */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Site Visits</h2>
              <button
                onClick={() => setShowVisitForm((v) => !v)}
                className="text-xs text-primary hover:underline"
              >
                + Schedule Visit
              </button>
            </div>

            {showVisitForm && (
              <div className="mb-4 grid grid-cols-2 gap-2 rounded border border-border p-3 bg-muted/20">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">Start *</label>
                  <input
                    type="datetime-local"
                    value={visitStart}
                    onChange={(e) => setVisitStart(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">End</label>
                  <input
                    type="datetime-local"
                    value={visitEnd}
                    onChange={(e) => setVisitEnd(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted-foreground">Assigned to</label>
                  <select
                    value={visitAssignee}
                    onChange={(e) => setVisitAssignee(e.target.value)}
                    className="w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.full_name ?? s.id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs text-muted-foreground">Purpose</label>
                  <input
                    placeholder="e.g. Initial measurement, Installation check…"
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    className="w-full rounded border border-border px-2 py-1.5 text-sm"
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowVisitForm(false)}
                    className="rounded border border-border px-3 py-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateVisit}
                    disabled={!visitStart || createVisit.isPending}
                    className="rounded bg-primary px-3 py-1 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {siteVisits.map((visit) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = (visit as any).assignee as { full_name: string | null } | null;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const measurements = (visit as any).measurements as Array<{
                  id: string;
                  area_or_item: string;
                  width_mm: number | null;
                  height_mm: number | null;
                  depth_mm: number | null;
                  quantity: number;
                  unit: string;
                  notes: string | null;
                }>;
                const isAddingMeasurements = activeMeasurementVisit === visit.id;
                return (
                  <div key={visit.id} className="rounded border border-border p-3 text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {visit.scheduled_start
                            ? formatDateTime(visit.scheduled_start)
                            : 'No date set'}
                        </p>
                        {visit.purpose && <p className="text-muted-foreground">{visit.purpose}</p>}
                        {assignee?.full_name && (
                          <p className="text-xs text-muted-foreground">
                            Assigned: {assignee.full_name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            visit.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : visit.status === 'cancelled'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {VISIT_STATUS_LABEL[visit.status] ?? visit.status}
                        </span>
                        {visit.status !== 'completed' && visit.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCompleteVisit(visit.id)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Mark complete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Measurements */}
                    {measurements.length > 0 && (
                      <div className="mt-3">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          Measurements
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="text-muted-foreground">
                              <tr>
                                <th className="text-left pr-3 py-1">Item / Area</th>
                                <th className="text-right pr-3 py-1">W (mm)</th>
                                <th className="text-right pr-3 py-1">H (mm)</th>
                                <th className="text-right pr-3 py-1">D (mm)</th>
                                <th className="text-right pr-3 py-1">Qty</th>
                                <th className="text-left py-1">Notes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {measurements.map((m) => (
                                <tr key={m.id} className="border-t border-border/50">
                                  <td className="pr-3 py-1">{m.area_or_item}</td>
                                  <td className="text-right pr-3 py-1">{m.width_mm ?? '—'}</td>
                                  <td className="text-right pr-3 py-1">{m.height_mm ?? '—'}</td>
                                  <td className="text-right pr-3 py-1">{m.depth_mm ?? '—'}</td>
                                  <td className="text-right pr-3 py-1">
                                    {m.quantity} {m.unit}
                                  </td>
                                  <td className="py-1 text-muted-foreground">{m.notes ?? ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Add measurement */}
                    <div className="mt-2">
                      {!isAddingMeasurements ? (
                        <button
                          onClick={() => setActiveMeasurementVisit(visit.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          + Add measurement
                        </button>
                      ) : (
                        <div className="mt-2 rounded border border-border p-2 bg-muted/20">
                          <p className="mb-2 text-xs font-medium text-muted-foreground">
                            New Measurement
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <input
                              placeholder="Item / area *"
                              value={mAreaOrItem}
                              onChange={(e) => setMAreaOrItem(e.target.value)}
                              className="col-span-3 rounded border border-border px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Width (mm)"
                              type="number"
                              value={mWidth}
                              onChange={(e) => setMWidth(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Height (mm)"
                              type="number"
                              value={mHeight}
                              onChange={(e) => setMHeight(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Depth (mm)"
                              type="number"
                              value={mDepth}
                              onChange={(e) => setMDepth(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Qty"
                              type="number"
                              min="0.001"
                              step="any"
                              value={mQty}
                              onChange={(e) => setMQty(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Unit"
                              value={mUnit}
                              onChange={(e) => setMUnit(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            />
                            <input
                              placeholder="Notes"
                              value={mNotes}
                              onChange={(e) => setMNotes(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            />
                          </div>
                          <div className="mt-2 flex justify-end gap-2">
                            <button
                              onClick={() => setActiveMeasurementVisit(null)}
                              className="rounded border border-border px-2 py-1 text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleAddMeasurement}
                              disabled={!mAreaOrItem.trim() || createMeasurement.isPending}
                              className="rounded bg-primary px-2 py-1 text-xs text-primary-foreground disabled:opacity-50"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {siteVisits.length === 0 && (
                <p className="text-sm text-muted-foreground">No site visits scheduled.</p>
              )}
            </div>
          </section>

          {/* Invoices */}
          <section className="rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium">Invoices</h2>
              <Link
                to={`/invoices/new?customerId=${id}`}
                className="text-xs text-primary hover:underline"
              >
                + New Invoice
              </Link>
            </div>
            {customerInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 pr-3">Invoice #</th>
                      <th className="pb-2 pr-3">Issued</th>
                      <th className="pb-2 pr-3">Due</th>
                      <th className="pb-2 pr-3 text-right">Total</th>
                      <th className="pb-2 pr-3 text-right">Balance</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(customerInvoices as any[]).map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-2 pr-3">
                          <Link
                            to={`/invoices/${inv.id}`}
                            className="font-mono text-primary hover:underline text-xs"
                          >
                            {inv.invoice_number}
                          </Link>
                        </td>
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {formatDate(inv.issue_date)}
                        </td>
                        <td
                          className={`py-2 pr-3 text-xs ${inv.status === 'overdue' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}
                        >
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-xs">
                          {formatCurrency(inv.total_minor)}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono text-xs">
                          {formatCurrency(inv.balance_minor)}
                        </td>
                        <td className="py-2">
                          <span
                            className={`inline-flex rounded-full px-1.5 py-0.5 text-xs font-medium ${
                              inv.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : inv.status === 'overdue'
                                  ? 'bg-red-100 text-red-700'
                                  : inv.status === 'partially_paid'
                                    ? 'bg-orange-100 text-orange-700'
                                    : inv.status === 'issued'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {inv.status === 'partially_paid'
                              ? 'Partial'
                              : inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Customer Details */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Customer Details</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Owner</dt>
                <dd>{owner?.full_name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Type</dt>
                <dd className="capitalize">{customer.customer_type ?? '—'}</dd>
              </div>
              {customer.gstin && (
                <div>
                  <dt className="text-xs text-muted-foreground">GSTIN</dt>
                  <dd className="font-mono text-xs">{customer.gstin}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd>{formatDateTime(customer.created_at)}</dd>
              </div>
              {sourceLead && (
                <div>
                  <dt className="text-xs text-muted-foreground">Source Lead</dt>
                  <dd>
                    <Link to={`/leads/${sourceLead.id}`} className="text-primary hover:underline">
                      #{sourceLead.lead_number} {sourceLead.full_name}
                    </Link>
                  </dd>
                </div>
              )}
            </dl>
            {customer.notes && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </section>

          {/* Tasks */}
          <section className="rounded-lg border border-border p-4">
            <h2 className="mb-3 font-medium text-sm">Tasks</h2>
            <div className="mb-3 space-y-2">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New task title…"
                className="w-full rounded border border-border px-2 py-1.5 text-sm"
              />
              <input
                type="datetime-local"
                value={taskDue}
                onChange={(e) => setTaskDue(e.target.value)}
                className="w-full rounded border border-border px-2 py-1.5 text-sm"
              />
              <button
                onClick={handleAddTask}
                disabled={!taskTitle.trim() || createTask.isPending}
                className="w-full rounded bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
              >
                Add Task
              </button>
            </div>

            <div className="space-y-2">
              {activeTasks.map((task) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const assignee = (task as any).assignee as { full_name: string | null } | null;
                const overdue = task.due_at && isOverdue(task.due_at) && task.status === 'todo';
                return (
                  <div key={task.id} className="flex items-start gap-2 text-sm">
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-border hover:border-green-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className={overdue ? 'text-red-600 font-medium' : ''}>{task.title}</p>
                      {task.due_at && (
                        <p
                          className={`text-xs ${overdue ? 'text-red-500' : 'text-muted-foreground'}`}
                        >
                          {relativeDays(task.due_at)}
                        </p>
                      )}
                      {assignee?.full_name && (
                        <p className="text-xs text-muted-foreground">{assignee.full_name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {doneTasks.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-muted-foreground">
                  {doneTasks.length} completed task{doneTasks.length !== 1 ? 's' : ''}
                </summary>
                <div className="mt-2 space-y-1">
                  {doneTasks.map((task) => (
                    <p key={task.id} className="text-sm line-through text-muted-foreground">
                      {task.title}
                    </p>
                  ))}
                </div>
              </details>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
