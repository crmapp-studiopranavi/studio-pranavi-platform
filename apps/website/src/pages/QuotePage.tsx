import { useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Label } from '@platform/ui';
import { CheckCircle2, ArrowRight, ArrowLeft, Paperclip, X, Upload } from 'lucide-react';
import { PageMeta } from '@/components/ui/page-meta';
import { useServices } from '@/lib/hooks/use-services';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const MAX_FILES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];

const BUDGET_RANGES = [
  { label: 'Flexible / Not sure', min: null, max: null },
  { label: 'Under ₹50,000', min: null, max: 5_000_000 },
  { label: '₹50,000 – ₹1,00,000', min: 5_000_000, max: 10_000_000 },
  { label: '₹1,00,000 – ₹5,00,000', min: 10_000_000, max: 50_000_000 },
  { label: '₹5,00,000 – ₹15,00,000', min: 50_000_000, max: 150_000_000 },
  { label: '₹15,00,000 – ₹50,00,000', min: 150_000_000, max: 500_000_000 },
  { label: 'Above ₹50,00,000', min: 500_000_000, max: null },
] as const;

const step1Schema = z.object({
  project_description: z
    .string()
    .min(20, 'Please describe your project in at least 20 characters')
    .max(2000),
  service_id: z.string().uuid().optional().or(z.literal('')),
  budget_range: z.string().optional(),
  location_text: z.string().max(200).optional().or(z.literal('')),
});

const step2Schema = z
  .object({
    full_name: z.string().min(2, 'Please enter your full name').max(200),
    email: z.string().email('Please enter a valid email').max(320).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    whatsapp_number: z.string().max(30).optional().or(z.literal('')),
    preferred_contact_method: z
      .enum(['phone', 'email', 'whatsapp', 'sms', 'in_person', 'other'])
      .optional(),
    _gotcha: z.string().optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Please provide at least an email or phone number',
    path: ['email'],
  });

const step3Schema = z.object({
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to continue' }),
  }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface SelectedFile {
  file: File;
  error?: string;
}

const STEPS = ['Project Details', 'Your Contact Info', 'Review & Submit'] as const;

export function QuotePage() {
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service') ?? '';

  const uploadSessionId = useRef(crypto.randomUUID()).current;

  const [currentStep, setCurrentStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: services } = useServices();

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { service_id: preselectedServiceId, budget_range: '' },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const remaining = MAX_FILES - selectedFiles.length;

      const newFiles: SelectedFile[] = files.slice(0, remaining).map((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
          return { file, error: 'File type not supported (use JPG, PNG, WebP, PDF)' };
        }
        if (file.size > MAX_FILE_BYTES) {
          return { file, error: 'File is too large (max 10 MB)' };
        }
        return { file };
      });

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [selectedFiles.length]
  );

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  function handleStep1(data: Step1Data) {
    setStep1Data(data);
    setCurrentStep(1);
  }

  function handleStep2(data: Step2Data) {
    setStep2Data(data);
    setCurrentStep(2);
  }

  async function uploadFiles(): Promise<string[]> {
    const validFiles = selectedFiles.filter((sf) => !sf.error);
    if (validFiles.length === 0) return [];

    setUploadingFiles(true);
    const uploadedPaths: string[] = [];

    for (const { file } of validFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `pending/${uploadSessionId}/${safeName}`;
      const { error } = await supabase.storage
        .from('lead-uploads')
        .upload(path, file, { upsert: false });

      if (!error) {
        uploadedPaths.push(path);
      }
    }

    setUploadingFiles(false);
    return uploadedPaths;
  }

  async function handleStep3() {
    if (!step1Data || !step2Data) return;

    if (step2Data._gotcha) {
      setSubmitted(true);
      return;
    }

    setServerError(null);
    setIsSubmitting(true);

    try {
      const uploadedPaths = await uploadFiles();
      const budgetEntry = BUDGET_RANGES.find((r) => r.label === step1Data.budget_range);

      const { error } = await supabase.rpc('submit_public_lead', {
        p_full_name: step2Data.full_name,
        p_email: step2Data.email || undefined,
        p_phone: step2Data.phone || undefined,
        p_whatsapp_number: step2Data.whatsapp_number || undefined,
        p_preferred_contact_method: step2Data.preferred_contact_method,
        p_location_text: step1Data.location_text || undefined,
        p_service_id: step1Data.service_id || undefined,
        p_budget_min_minor: budgetEntry?.min ?? undefined,
        p_budget_max_minor: budgetEntry?.max ?? undefined,
        p_project_description: step1Data.project_description,
        p_source: 'website_quote_form',
        p_attachment_paths: uploadedPaths.length > 0 ? uploadedPaths : undefined,
      });

      if (error) {
        setServerError(error.message || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <>
        <PageMeta title="Quote Request Submitted" path="/get-a-quote" />
        <div className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
          <CheckCircle2 className="h-16 w-16 text-brand-amber" aria-hidden="true" />
          <h1 className="mt-6 font-display text-3xl font-semibold">Request Received!</h1>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Thank you for your quote request. We&apos;ll review the details and get back to you
            within one business day.
          </p>
          <Button asChild className="mt-8">
            <Link to="/">Back to Home</Link>
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Get a Quote"
        description="Request a free, no-obligation quote for your custom glass or lighting project."
        path="/get-a-quote"
      />

      <section className="bg-brand-charcoal py-14 text-brand-ivory">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Get a Free Quote</h1>
          <p className="mt-3 text-brand-ivory/70">
            Fill in the details below and we&apos;ll prepare a tailored quote for your project.
          </p>
        </div>
      </section>

      <section className="bg-brand-ivory py-12">
        <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <nav aria-label="Progress" className="mb-10">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, idx) => (
                <li
                  key={step}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1.5 text-center',
                    idx < STEPS.length - 1 && 'relative'
                  )}
                >
                  {idx < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={cn(
                        'absolute top-4 left-1/2 h-0.5 w-full -translate-y-1/2',
                        idx < currentStep ? 'bg-brand-amber' : 'bg-border'
                      )}
                    />
                  )}
                  <span
                    aria-current={idx === currentStep ? 'step' : undefined}
                    className={cn(
                      'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                      idx < currentStep
                        ? 'bg-brand-amber text-white'
                        : idx === currentStep
                          ? 'border-2 border-brand-amber bg-background text-brand-amber'
                          : 'border-2 border-border bg-background text-muted-foreground'
                    )}
                  >
                    {idx < currentStep ? (
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      'hidden text-xs sm:block',
                      idx === currentStep ? 'font-medium text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Step 1 — Project Details */}
          {currentStep === 0 && (
            <form
              onSubmit={form1.handleSubmit(handleStep1)}
              noValidate
              className="rounded-xl border border-border bg-card p-6 space-y-5"
            >
              <h2 className="font-display text-xl font-semibold">Tell us about your project</h2>

              <div className="space-y-1.5">
                <Label htmlFor="project_description">
                  Project Description{' '}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <textarea
                  id="project_description"
                  rows={5}
                  placeholder="Describe what you have in mind — type of glass, size, location, style preferences, etc."
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...form1.register('project_description')}
                />
                {form1.formState.errors.project_description && (
                  <p role="alert" className="text-xs text-destructive">
                    {form1.formState.errors.project_description.message}
                  </p>
                )}
              </div>

              {services && services.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="service_id">Service Type (optional)</Label>
                  <select
                    id="service_id"
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...form1.register('service_id')}
                  >
                    <option value="">— Select a service —</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="budget_range">Budget Range (optional)</Label>
                <select
                  id="budget_range"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...form1.register('budget_range')}
                >
                  <option value="">— Select a range —</option>
                  {BUDGET_RANGES.map((r) => (
                    <option key={r.label} value={r.label}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="location_text">City / Location (optional)</Label>
                <Input
                  id="location_text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  {...form1.register('location_text')}
                />
              </div>

              {/* Optional file attachments */}
              <div className="space-y-2">
                <Label>Project Photos or References (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Up to {MAX_FILES} files · Images or PDF · Max 10 MB each
                </p>

                {selectedFiles.length < MAX_FILES && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      className="sr-only"
                      id="file-upload"
                      onChange={handleFileChange}
                      aria-label="Upload project photos or reference files"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-background px-4 py-2 text-sm text-muted-foreground hover:border-brand-amber hover:text-brand-amber transition-colors"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Choose files
                    </label>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <ul className="space-y-2" aria-label="Selected files">
                    {selectedFiles.map((sf, i) => (
                      <li
                        key={i}
                        className={cn(
                          'flex items-center justify-between rounded-md border px-3 py-2 text-sm',
                          sf.error
                            ? 'border-destructive/40 bg-destructive/5 text-destructive'
                            : 'border-border bg-muted/30'
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Paperclip className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span className="truncate">{sf.file.name}</span>
                          {sf.error && <span className="text-xs">— {sf.error}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="ml-2 shrink-0 rounded p-0.5 hover:bg-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          aria-label={`Remove ${sf.file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end">
                <Button type="submit" className="bg-brand-amber text-white hover:bg-brand-brass">
                  Next: Contact Info
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 2 — Contact Info */}
          {currentStep === 1 && (
            <form
              onSubmit={form2.handleSubmit(handleStep2)}
              noValidate
              className="rounded-xl border border-border bg-card p-6 space-y-5"
            >
              <h2 className="font-display text-xl font-semibold">Your contact information</h2>

              {/* Honeypot — hidden from real users, filled by bots */}
              <div className="hidden" aria-hidden="true">
                <label htmlFor="_gotcha">Leave this blank</label>
                <input
                  id="_gotcha"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...form2.register('_gotcha')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="full_name">
                  Full Name{' '}
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id="full_name"
                  autoComplete="name"
                  placeholder="Your full name"
                  {...form2.register('full_name')}
                />
                {form2.formState.errors.full_name && (
                  <p role="alert" className="text-xs text-destructive">
                    {form2.formState.errors.full_name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    {...form2.register('email')}
                  />
                  {form2.formState.errors.email && (
                    <p role="alert" className="text-xs text-destructive">
                      {form2.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    {...form2.register('phone')}
                  />
                  {form2.formState.errors.phone && (
                    <p role="alert" className="text-xs text-destructive">
                      {form2.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Please provide at least an email or phone number.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp_number">WhatsApp Number (optional)</Label>
                <Input
                  id="whatsapp_number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  {...form2.register('whatsapp_number')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="preferred_contact_method">Preferred Contact Method</Label>
                <select
                  id="preferred_contact_method"
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  {...form2.register('preferred_contact_method')}
                >
                  <option value="">— No preference —</option>
                  <option value="phone">Phone call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(0)}>
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <Button type="submit" className="bg-brand-amber text-white hover:bg-brand-brass">
                  Review &amp; Submit
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 — Review & Submit */}
          {currentStep === 2 && step1Data && step2Data && (
            <form
              onSubmit={form3.handleSubmit(handleStep3)}
              noValidate
              className="rounded-xl border border-border bg-card p-6 space-y-6"
            >
              <h2 className="font-display text-xl font-semibold">Review your request</h2>

              <div className="rounded-lg bg-muted p-4 space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Project Description</p>
                  <p className="mt-0.5 font-medium">{step1Data.project_description}</p>
                </div>
                {step1Data.location_text && (
                  <div>
                    <p className="text-muted-foreground">Location</p>
                    <p className="mt-0.5 font-medium">{step1Data.location_text}</p>
                  </div>
                )}
                {step1Data.budget_range && (
                  <div>
                    <p className="text-muted-foreground">Budget Range</p>
                    <p className="mt-0.5 font-medium">{step1Data.budget_range}</p>
                  </div>
                )}
                {selectedFiles.filter((f) => !f.error).length > 0 && (
                  <div>
                    <p className="text-muted-foreground">Attachments</p>
                    <p className="mt-0.5 font-medium">
                      {selectedFiles.filter((f) => !f.error).length} file(s) will be uploaded
                    </p>
                  </div>
                )}
                <hr className="border-border" />
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="mt-0.5 font-medium">{step2Data.full_name}</p>
                </div>
                {step2Data.email && (
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="mt-0.5 font-medium">{step2Data.email}</p>
                  </div>
                )}
                {step2Data.phone && (
                  <div>
                    <p className="text-muted-foreground">Phone</p>
                    <p className="mt-0.5 font-medium">{step2Data.phone}</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-input accent-brand-amber"
                  {...form3.register('consent')}
                />
                <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                  I agree to be contacted about my project enquiry. I understand my information will
                  be handled in accordance with the{' '}
                  <Link to="/privacy" className="underline hover:text-primary">
                    Privacy Policy
                  </Link>
                  .
                </Label>
              </div>
              {form3.formState.errors.consent && (
                <p role="alert" className="text-xs text-destructive -mt-3">
                  {form3.formState.errors.consent.message}
                </p>
              )}

              {serverError && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {serverError}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  disabled={isSubmitting || uploadingFiles}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || uploadingFiles}
                  className="bg-brand-amber text-white hover:bg-brand-brass"
                >
                  {uploadingFiles
                    ? 'Uploading files…'
                    : isSubmitting
                      ? 'Submitting…'
                      : 'Submit Request'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
