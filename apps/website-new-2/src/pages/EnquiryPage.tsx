import { useState, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, Paperclip, X } from 'lucide-react';
import { PageMeta } from '@/components/ui/page-meta';
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

const SERVICES = [
  'Grand Installation',
  'Chandelier',
  'Architectural Glass',
  'Pendant Light',
  'Floor Lamp',
  'Décor Object',
  'Other / Not sure',
];

const step1Schema = z.object({
  project_description: z.string().min(20, 'Please describe your project in at least 20 characters').max(2000),
  service_type: z.string().optional().or(z.literal('')),
  budget_range: z.string().optional().or(z.literal('')),
  location_text: z.string().max(200).optional().or(z.literal('')),
});

const step2Schema = z
  .object({
    full_name: z.string().min(2, 'Please enter your full name').max(200),
    email: z.string().email('Please enter a valid email').max(320).optional().or(z.literal('')),
    phone: z.string().max(30).optional().or(z.literal('')),
    whatsapp_number: z.string().max(30).optional().or(z.literal('')),
    preferred_contact_method: z.enum(['phone', 'email', 'whatsapp', 'sms', 'in_person', 'other']).optional(),
    _gotcha: z.string().optional(),
  })
  .refine((d) => d.email || d.phone, {
    message: 'Please provide at least an email or phone number',
    path: ['email'],
  });

const step3Schema = z.object({
  consent: z.literal(true, { errorMap: () => ({ message: 'You must agree to continue' }) }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

interface SelectedFile {
  file: File;
  error?: string;
}

const STEPS = ['Project Details', 'Your Info', 'Review & Submit'] as const;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p role="alert" className="mt-1 text-xs text-red-600">{message}</p>;
}

function FieldLabel({ htmlFor, children, required }: { htmlFor: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs uppercase tracking-widest text-brand-muted">
      {children}{required && <span className="ml-1 text-red-600" aria-hidden="true">*</span>}
    </label>
  );
}

const inputClass =
  'mt-2 block w-full border border-brand-border bg-white px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-text focus:outline-none';

const selectClass =
  'mt-2 block w-full border border-brand-border bg-white px-4 py-3 text-sm text-brand-text focus:border-brand-text focus:outline-none';

export function EnquiryPage() {
  const [searchParams] = useSearchParams();
  const preselectedService = searchParams.get('service') ?? '';

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

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { service_type: preselectedService, budget_range: '' },
  });

  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      const remaining = MAX_FILES - selectedFiles.length;
      const newFiles: SelectedFile[] = files.slice(0, remaining).map((file) => {
        if (!ALLOWED_TYPES.includes(file.type)) return { file, error: 'File type not supported (use JPG, PNG, WebP, PDF)' };
        if (file.size > MAX_FILE_BYTES) return { file, error: 'File is too large (max 10 MB)' };
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
      const { error } = await supabase.storage.from('lead-uploads').upload(path, file, { upsert: false });
      if (!error) uploadedPaths.push(path);
    }
    setUploadingFiles(false);
    return uploadedPaths;
  }

  async function handleStep3() {
    if (!step1Data || !step2Data) return;
    if (step2Data._gotcha) { setSubmitted(true); return; }

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
        p_service_id: undefined,
        p_budget_min_minor: budgetEntry?.min ?? undefined,
        p_budget_max_minor: budgetEntry?.max ?? undefined,
        p_project_description: step1Data.project_description,
        p_source: 'website3_enquiry_form',
        p_attachment_paths: uploadedPaths.length > 0 ? uploadedPaths : undefined,
      });

      if (error) { setServerError(error.message || 'Something went wrong. Please try again.'); return; }
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
        <PageMeta title="Enquiry Submitted" path="/enquiry" />
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-600" aria-hidden="true" />
          <h1 className="title-2 mt-8">Enquiry Received</h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-brand-muted">
            Thank you for your enquiry. We will review the details and get back to you within one
            business day.
          </p>
          <Link to="/" className="btn-outline mt-10 inline-flex">
            Back to Home
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Request a Quote"
        description="Tell us about your glass or lighting project and receive a free, tailored quote within one business day."
        path="/enquiry"
      />

      <section className="border-b border-brand-border py-20 lg:py-32 bg-white">
        <div className="sp-container">
          <h3 className="title-4">Free Quote</h3>
          <h1 className="title-1 mt-6 max-w-2xl">Tell Us About Your Project</h1>
          <p className="title-3 mt-6 max-w-xl leading-relaxed text-brand-muted">
            Fill in the form below and we will prepare a detailed quote tailored to your project —
            at no charge and with no obligation.
          </p>
        </div>
      </section>

      <section className="sp-section bg-white">
        <div className="sp-container max-w-2xl">
          {/* Step indicator */}
          <nav aria-label="Progress" className="mb-10">
            <ol className="flex items-center">
              {STEPS.map((step, idx) => (
                <li
                  key={step}
                  className={cn(
                    'flex flex-1 items-center',
                    idx < STEPS.length - 1 && 'after:mx-2 after:flex-1 after:border-t after:content-[""]',
                    idx < currentStep ? 'after:border-brand-border' : 'after:border-brand-border'
                  )}
                >
                  <span
                    aria-current={idx === currentStep ? 'step' : undefined}
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center text-xs',
                      idx < currentStep
                        ? 'bg-brand-text text-white'
                        : idx === currentStep
                          ? 'border border-brand-text text-brand-text'
                          : 'border border-brand-border text-brand-muted'
                    )}
                  >
                    {idx < currentStep ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : idx + 1}
                  </span>
                </li>
              ))}
            </ol>
            <ol className="mt-2 flex">
              {STEPS.map((step, idx) => (
                <li key={step} className="flex-1">
                  <span className={cn('text-xs uppercase tracking-wider', idx === currentStep ? 'text-brand-text' : 'text-brand-muted')}>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Step 1 */}
          {currentStep === 0 && (
            <form onSubmit={form1.handleSubmit(handleStep1)} noValidate className="space-y-6 border border-brand-border p-8">
              <h2 className="title-2">Project Details</h2>

              <div>
                <FieldLabel htmlFor="project_description" required>Project Description</FieldLabel>
                <textarea
                  id="project_description"
                  rows={5}
                  placeholder="Describe what you have in mind — type of glass or lighting, size, location, style references, etc."
                  className={cn(inputClass, 'resize-none')}
                  {...form1.register('project_description')}
                />
                <FieldError message={form1.formState.errors.project_description?.message} />
              </div>

              <div>
                <FieldLabel htmlFor="service_type">Collection / Service (optional)</FieldLabel>
                <select id="service_type" className={selectClass} {...form1.register('service_type')}>
                  <option value="">— Select —</option>
                  {SERVICES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="budget_range">Budget Range (optional)</FieldLabel>
                <select id="budget_range" className={selectClass} {...form1.register('budget_range')}>
                  <option value="">— Select a range —</option>
                  {BUDGET_RANGES.map((r) => (
                    <option key={r.label} value={r.label}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="location_text">City / Location (optional)</FieldLabel>
                <input
                  id="location_text"
                  type="text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  className={inputClass}
                  {...form1.register('location_text')}
                />
              </div>

              <div className="space-y-2">
                <FieldLabel htmlFor="file-upload">Reference Photos or Documents (optional)</FieldLabel>
                <p className="text-xs text-brand-muted">Up to {MAX_FILES} files · Images or PDF · Max 10 MB each</p>

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
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex cursor-pointer items-center gap-2 border border-dashed border-brand-border px-5 py-2.5 text-sm text-brand-muted transition-colors hover:border-brand-text hover:text-brand-text"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Choose files
                    </label>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <ul className="space-y-2">
                    {selectedFiles.map((sf, i) => (
                      <li
                        key={i}
                        className={cn(
                          'flex items-center justify-between border px-3 py-2 text-sm',
                          sf.error ? 'border-red-800 text-red-600' : 'border-brand-border text-brand-muted'
                        )}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <span className="truncate">{sf.file.name}</span>
                          {sf.error && <span className="text-xs">— {sf.error}</span>}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="ml-2 shrink-0 hover:text-brand-text"
                          aria-label={`Remove ${sf.file.name}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="btn-outline inline-flex items-center gap-2"
                >
                  Next: Your Info
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 2 */}
          {currentStep === 1 && (
            <form onSubmit={form2.handleSubmit(handleStep2)} noValidate className="space-y-6 border border-brand-border p-8">
              <h2 className="title-2">Your Contact Information</h2>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="_gotcha">Leave this blank</label>
                <input id="_gotcha" type="text" tabIndex={-1} autoComplete="off" {...form2.register('_gotcha')} />
              </div>

              <div>
                <FieldLabel htmlFor="full_name" required>Full Name</FieldLabel>
                <input
                  id="full_name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  className={inputClass}
                  {...form2.register('full_name')}
                />
                <FieldError message={form2.formState.errors.full_name?.message} />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClass}
                    {...form2.register('email')}
                  />
                  <FieldError message={form2.formState.errors.email?.message} />
                </div>
                <div>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    className={inputClass}
                    {...form2.register('phone')}
                  />
                </div>
              </div>
              <p className="text-xs text-brand-muted -mt-4">Please provide at least an email or phone number.</p>

              <div>
                <FieldLabel htmlFor="whatsapp_number">WhatsApp (optional)</FieldLabel>
                <input
                  id="whatsapp_number"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className={inputClass}
                  {...form2.register('whatsapp_number')}
                />
              </div>

              <div>
                <FieldLabel htmlFor="preferred_contact_method">Preferred Contact Method</FieldLabel>
                <select
                  id="preferred_contact_method"
                  className={selectClass}
                  {...form2.register('preferred_contact_method')}
                >
                  <option value="">— No preference —</option>
                  <option value="phone">Phone call</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(0)}
                  className="btn-outline inline-flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  className="btn-outline inline-flex items-center gap-2"
                >
                  Review &amp; Submit
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3 */}
          {currentStep === 2 && step1Data && step2Data && (
            <form onSubmit={form3.handleSubmit(handleStep3)} noValidate className="space-y-6 border border-brand-border p-8">
              <h2 className="title-2">Review Your Enquiry</h2>

              <div className="space-y-4 border border-brand-border bg-brand-bgalt p-5 text-sm">
                <div>
                  <p className="title-4">Project Description</p>
                  <p className="mt-1 text-brand-text">{step1Data.project_description}</p>
                </div>
                {step1Data.service_type && (
                  <div>
                    <p className="title-4">Collection / Service</p>
                    <p className="mt-1 text-brand-text">{step1Data.service_type}</p>
                  </div>
                )}
                {step1Data.location_text && (
                  <div>
                    <p className="title-4">Location</p>
                    <p className="mt-1 text-brand-text">{step1Data.location_text}</p>
                  </div>
                )}
                {step1Data.budget_range && (
                  <div>
                    <p className="title-4">Budget Range</p>
                    <p className="mt-1 text-brand-text">{step1Data.budget_range}</p>
                  </div>
                )}
                <div className="border-t border-brand-border pt-4">
                  <p className="title-4">Name</p>
                  <p className="mt-1 text-brand-text">{step2Data.full_name}</p>
                </div>
                {step2Data.email && (
                  <div>
                    <p className="title-4">Email</p>
                    <p className="mt-1 text-brand-text">{step2Data.email}</p>
                  </div>
                )}
                {step2Data.phone && (
                  <div>
                    <p className="title-4">Phone</p>
                    <p className="mt-1 text-brand-text">{step2Data.phone}</p>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  {...form3.register('consent')}
                />
                <label htmlFor="consent" className="text-sm leading-relaxed text-brand-muted cursor-pointer">
                  I agree to be contacted about my project enquiry. My information will be handled
                  in accordance with the{' '}
                  <Link to="/privacy" className="text-brand-text underline underline-offset-2">
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
              <FieldError message={form3.formState.errors.consent?.message} />

              {serverError && (
                <div role="alert" className="border border-red-800 bg-red-950/30 p-4 text-sm text-red-600">
                  {serverError}
                </div>
              )}

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  disabled={isSubmitting || uploadingFiles}
                  className="btn-outline inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || uploadingFiles}
                  className="btn-black inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {uploadingFiles ? 'Uploading…' : isSubmitting ? 'Submitting…' : 'Submit Enquiry'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
