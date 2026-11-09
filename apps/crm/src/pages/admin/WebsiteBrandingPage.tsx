/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@platform/ui';
import { cn } from '@platform/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'identity' | 'logos' | 'colours' | 'typography';

const TABS: { id: Tab; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'logos', label: 'Logos' },
  { id: 'colours', label: 'Brand Colours' },
  { id: 'typography', label: 'Typography' },
];

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

const APPROVED_HEADING_FONTS = ['Playfair Display', 'Cormorant Garamond', 'EB Garamond'] as const;
const APPROVED_BODY_FONTS = ['Inter', 'DM Sans', 'Lato'] as const;

const BUTTON_RADIUS_OPTIONS = [
  { label: 'Square', value: '0px' },
  { label: 'Slight', value: '4px' },
  { label: 'Rounded', value: '6px' },
  { label: 'Soft', value: '12px' },
] as const;

// ── Schema ────────────────────────────────────────────────────────────────────

export const brandingSchema = z.object({
  business_name: z.string().min(1, 'Business name is required'),
  business_tagline: z.string().nullable().optional(),
  logo_path: z.string().nullable().optional(),
  logo_light_path: z.string().nullable().optional(),
  logo_dark_path: z.string().nullable().optional(),
  logo_mobile_path: z.string().nullable().optional(),
  favicon_path: z.string().nullable().optional(),
  og_image_path: z.string().nullable().optional(),
  primary_color: z.string().regex(HEX_RE, 'Must be a 6-digit hex color, e.g. #C8973A'),
  secondary_color: z.string().regex(HEX_RE, 'Must be a 6-digit hex color, e.g. #2C2C2C'),
  accent_color: z.string().regex(HEX_RE, 'Must be a 6-digit hex color, e.g. #C8973A'),
  heading_font: z.enum(APPROVED_HEADING_FONTS, {
    errorMap: () => ({ message: 'Select an approved heading font' }),
  }),
  body_font: z.enum(APPROVED_BODY_FONTS, {
    errorMap: () => ({ message: 'Select an approved body font' }),
  }),
  button_radius: z.string().min(1),
  hero_image_path: z.string().nullable().optional(),
});

type BrandingForm = z.infer<typeof brandingSchema>;

// ── Data hooks ────────────────────────────────────────────────────────────────

function useBrandingSettings() {
  return useQuery({
    queryKey: ['website-branding'],
    queryFn: async () => {
      // New branding columns (phase 10B) are not in generated types yet — use 'select *' + cast
      const { data, error } = await (supabase as any)
        .from('business_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as Record<string, unknown> & { business_name: string; logo_path: string | null };
    },
  });
}

function useUpdateBrandingSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (values: BrandingForm) => {
      const { data: existing, error: fetchErr } = await (supabase as any)
        .from('business_settings')
        .select('id')
        .limit(1)
        .single();
      if (fetchErr) throw fetchErr;

      // Cast pattern: new columns are not in the generated Supabase types yet
      const payload = {
        business_name: values.business_name,
        logo_path: values.logo_path ?? null,
        ...(values.business_tagline !== undefined && { business_tagline: values.business_tagline }),
        ...(values.logo_light_path !== undefined && { logo_light_path: values.logo_light_path }),
        ...(values.logo_dark_path !== undefined && { logo_dark_path: values.logo_dark_path }),
        ...(values.logo_mobile_path !== undefined && { logo_mobile_path: values.logo_mobile_path }),
        ...(values.favicon_path !== undefined && { favicon_path: values.favicon_path }),
        ...(values.og_image_path !== undefined && { og_image_path: values.og_image_path }),
        ...(values.hero_image_path !== undefined && { hero_image_path: values.hero_image_path }),
        primary_color: values.primary_color,
        secondary_color: values.secondary_color,
        accent_color: values.accent_color,
        heading_font: values.heading_font,
        body_font: values.body_font,
        button_radius: values.button_radius,
      } as Record<string, unknown>;

      const { error } = await (supabase as any)
        .from('business_settings')
        .update(payload)
        .eq('id', existing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['website-branding'] });
      void qc.invalidateQueries({ queryKey: ['business-settings'] });
    },
  });
}

// ── Preview panel ─────────────────────────────────────────────────────────────

function BrandPreview({ values }: { values: Partial<BrandingForm> }) {
  const logoUrl = values.logo_path ?? '/logo.png';
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Preview
      </p>

      {/* Logo */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-40 items-center justify-center rounded border border-border bg-muted">
          {logoFailed || !logoUrl ? (
            <span className="text-sm font-medium">{values.business_name ?? 'Studio Pranavi'}</span>
          ) : (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="h-10 w-auto object-contain"
              onError={() => setLogoFailed(true)}
            />
          )}
        </div>
        <div
          className="flex h-16 w-16 items-center justify-center rounded border border-border"
          style={{ backgroundColor: values.secondary_color ?? '#2C2C2C' }}
        >
          {logoFailed || !logoUrl ? (
            <span
              className="text-xs font-bold"
              style={{ color: values.primary_color ?? '#C8973A' }}
            >
              SP
            </span>
          ) : (
            <img
              src={logoUrl}
              alt="Logo on dark"
              className="h-8 w-auto object-contain brightness-0 invert"
              onError={() => {}}
            />
          )}
        </div>
      </div>

      {/* Colour swatches */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Colours</p>
        <div className="flex gap-2">
          {[
            { label: 'Primary', color: values.primary_color },
            { label: 'Secondary', color: values.secondary_color },
            { label: 'Accent', color: values.accent_color },
          ].map(({ label, color }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-10 rounded-md border border-border"
                style={{ backgroundColor: color ?? '#ccc' }}
              />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tagline */}
      {values.business_tagline && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Tagline</p>
          <p className="text-sm italic" style={{ fontFamily: values.heading_font ?? 'serif' }}>
            {values.business_tagline}
          </p>
        </div>
      )}

      {/* OG image */}
      {values.og_image_path && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">OG Image</p>
          <img
            src={values.og_image_path}
            alt="OG image preview"
            className="w-full rounded border border-border object-cover"
            style={{ aspectRatio: '1200 / 630' }}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Changes appear on the public website within 5 minutes after saving.
      </p>
    </div>
  );
}

// ── Identity tab ──────────────────────────────────────────────────────────────

function IdentityFields({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<BrandingForm>>['register'];
  errors: ReturnType<typeof useForm<BrandingForm>>['formState']['errors'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Identity</CardTitle>
        <CardDescription>Business name and tagline shown on the public website.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input id="business_name" {...register('business_name')} />
          {errors.business_name && (
            <p className="text-xs text-destructive">{errors.business_name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="business_tagline">Tagline</Label>
          <Input
            id="business_tagline"
            {...register('business_tagline')}
            placeholder="We design the essence of light."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero_image_path">Default Hero Image Path</Label>
          <Input
            id="hero_image_path"
            {...register('hero_image_path')}
            placeholder="/images/hero.jpg or Supabase Storage URL"
          />
          <p className="text-xs text-muted-foreground">
            Used as the homepage hero fallback when no specific hero is configured.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="og_image_path">Social / OG Image Path</Label>
          <Input
            id="og_image_path"
            {...register('og_image_path')}
            placeholder="/og-placeholder.svg or full URL"
          />
          <p className="text-xs text-muted-foreground">Recommended: 1200 × 630 px.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Logos tab ─────────────────────────────────────────────────────────────────

function LogosFields({
  register,
}: {
  register: ReturnType<typeof useForm<BrandingForm>>['register'];
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Logo Paths</CardTitle>
          <CardDescription>
            Enter Supabase Storage public URLs or relative paths. Leave blank to use the default
            logo file (<code>/logo.png</code>).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="logo_path">Main Logo</Label>
            <Input id="logo_path" {...register('logo_path')} placeholder="https://… or /logo.png" />
            <p className="text-xs text-muted-foreground">Used on light / ivory backgrounds.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logo_light_path">Light / Reversed Logo</Label>
            <Input
              id="logo_light_path"
              {...register('logo_light_path')}
              placeholder="https://… (white version for dark backgrounds)"
            />
            <p className="text-xs text-muted-foreground">
              Used in the footer. Until a white variant is commissioned, the main logo is inverted
              via CSS.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logo_dark_path">Dark Logo</Label>
            <Input id="logo_dark_path" {...register('logo_dark_path')} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logo_mobile_path">Mobile Logo</Label>
            <Input
              id="logo_mobile_path"
              {...register('logo_mobile_path')}
              placeholder="https://… (square mark or condensed version)"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="favicon_path">Favicon Path</Label>
            <Input id="favicon_path" {...register('favicon_path')} placeholder="/favicon.svg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Colours tab ───────────────────────────────────────────────────────────────

function ColoursFields({
  register,
  errors,
}: {
  register: ReturnType<typeof useForm<BrandingForm>>['register'];
  errors: ReturnType<typeof useForm<BrandingForm>>['formState']['errors'];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Colours</CardTitle>
        <CardDescription>
          6-digit hex values only, e.g. <code>#C8973A</code>. These update CSS custom properties on
          the public website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(
          [
            { id: 'primary_color', label: 'Primary', hint: 'Buttons, links, highlights' },
            { id: 'secondary_color', label: 'Secondary', hint: 'Dark surfaces, charcoal' },
            { id: 'accent_color', label: 'Accent', hint: 'Decorative accents' },
          ] as const
        ).map(({ id, label, hint }) => (
          <div key={id} className="space-y-1.5">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-3">
              <Input
                id={id}
                {...register(id)}
                placeholder="#RRGGBB"
                className="font-mono"
                maxLength={7}
              />
            </div>
            <p className="text-xs text-muted-foreground">{hint}</p>
            {errors[id] && <p className="text-xs text-destructive">{errors[id]?.message}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ── Typography tab ────────────────────────────────────────────────────────────

function TypographyFields({
  register,
  errors,
  watch,
}: {
  register: ReturnType<typeof useForm<BrandingForm>>['register'];
  errors: ReturnType<typeof useForm<BrandingForm>>['formState']['errors'];
  watch: ReturnType<typeof useForm<BrandingForm>>['watch'];
}) {
  const buttonRadius = watch('button_radius');

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Fonts</CardTitle>
          <CardDescription>
            Choose from approved fonts only. Custom font URLs are not accepted here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="heading_font">Heading Font</Label>
            <select
              id="heading_font"
              {...register('heading_font')}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {APPROVED_HEADING_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errors.heading_font && (
              <p className="text-xs text-destructive">{errors.heading_font.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body_font">Body Font</Label>
            <select
              id="body_font"
              {...register('body_font')}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {APPROVED_BODY_FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            {errors.body_font && (
              <p className="text-xs text-destructive">{errors.body_font.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Button Radius</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {BUTTON_RADIUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                  buttonRadius === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  type="radio"
                  {...register('button_radius')}
                  value={opt.value}
                  className="sr-only"
                />
                <div className="h-8 w-24 bg-primary/80" style={{ borderRadius: opt.value }} />
                <span className="text-xs font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function WebsiteBrandingPage() {
  const [activeTab, setActiveTab] = useState<Tab>('identity');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const { data: settings, isLoading, isError } = useBrandingSettings();
  const update = useUpdateBrandingSettings();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<BrandingForm>({ resolver: zodResolver(brandingSchema) });

  const watchedValues = watch();

  useEffect(() => {
    if (settings) {
      const s = settings as Record<string, unknown>;
      reset({
        business_name: settings.business_name,
        business_tagline: (s.business_tagline as string | null) ?? null,
        logo_path: settings.logo_path ?? null,
        logo_light_path: (s.logo_light_path as string | null) ?? null,
        logo_dark_path: (s.logo_dark_path as string | null) ?? null,
        logo_mobile_path: (s.logo_mobile_path as string | null) ?? null,
        favicon_path: (s.favicon_path as string | null) ?? null,
        og_image_path: (s.og_image_path as string | null) ?? null,
        primary_color: (s.primary_color as string) ?? '#C8973A',
        secondary_color: (s.secondary_color as string) ?? '#2C2C2C',
        accent_color: (s.accent_color as string) ?? '#C8973A',
        heading_font:
          (s.heading_font as string as (typeof APPROVED_HEADING_FONTS)[number]) ??
          'Playfair Display',
        body_font: (s.body_font as string as (typeof APPROVED_BODY_FONTS)[number]) ?? 'Inter',
        button_radius: (s.button_radius as string) ?? '6px',
        hero_image_path: (s.hero_image_path as string | null) ?? null,
      });
    }
  }, [settings, reset]);

  function onSubmit(values: BrandingForm) {
    update.mutate(values, {
      onSuccess: () => {
        setSavedAt(new Date());
        reset(values);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
          role="status"
          aria-label="Loading branding settings"
        />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive" role="alert">
        Failed to load branding settings. Make sure migration 20261109000019 has been applied.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Website Branding</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure how Studio Pranavi appears on the public website.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreviewOpen(!previewOpen)}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          aria-pressed={previewOpen}
        >
          {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {previewOpen ? 'Hide preview' : 'Show preview'}
        </button>
      </div>

      <div className={cn('grid gap-6', previewOpen ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1')}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Tab bar */}
          <div className="border-b border-border">
            <nav className="-mb-px flex gap-6" aria-label="Branding sections">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors',
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === 'identity' && <IdentityFields register={register} errors={errors} />}
            {activeTab === 'logos' && <LogosFields register={register} />}
            {activeTab === 'colours' && <ColoursFields register={register} errors={errors} />}
            {activeTab === 'typography' && (
              <TypographyFields register={register} errors={errors} watch={watch} />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={update.isPending || !isDirty}>
              {update.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!isDirty}
              onClick={() => {
                if (settings) {
                  const s = settings as Record<string, unknown>;
                  reset({
                    business_name: settings.business_name,
                    business_tagline: (s.business_tagline as string | null) ?? null,
                    logo_path: settings.logo_path ?? null,
                    logo_light_path: (s.logo_light_path as string | null) ?? null,
                    logo_dark_path: (s.logo_dark_path as string | null) ?? null,
                    logo_mobile_path: (s.logo_mobile_path as string | null) ?? null,
                    favicon_path: (s.favicon_path as string | null) ?? null,
                    og_image_path: (s.og_image_path as string | null) ?? null,
                    primary_color: (s.primary_color as string) ?? '#C8973A',
                    secondary_color: (s.secondary_color as string) ?? '#2C2C2C',
                    accent_color: (s.accent_color as string) ?? '#C8973A',
                    heading_font:
                      (s.heading_font as string as (typeof APPROVED_HEADING_FONTS)[number]) ??
                      'Playfair Display',
                    body_font:
                      (s.body_font as string as (typeof APPROVED_BODY_FONTS)[number]) ?? 'Inter',
                    button_radius: (s.button_radius as string) ?? '6px',
                    hero_image_path: (s.hero_image_path as string | null) ?? null,
                  });
                }
              }}
            >
              Discard Changes
            </Button>

            {savedAt && !isDirty && (
              <span className="flex items-center gap-1.5 text-sm text-green-700">
                <Check className="h-4 w-4" aria-hidden="true" />
                Saved — changes appear within 5 minutes
              </span>
            )}

            {update.isError && (
              <p className="text-sm text-destructive" role="alert">
                Save failed. Please try again.
              </p>
            )}
          </div>
        </form>

        {previewOpen && (
          <aside aria-label="Branding preview">
            <BrandPreview values={watchedValues} />
          </aside>
        )}
      </div>
    </div>
  );
}
