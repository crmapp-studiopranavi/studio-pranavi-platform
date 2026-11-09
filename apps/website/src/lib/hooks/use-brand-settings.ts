/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BrandSettings {
  business_name: string;
  business_tagline: string | null;
  logo_path: string | null;
  logo_light_path: string | null;
  logo_dark_path: string | null;
  logo_mobile_path: string | null;
  favicon_path: string | null;
  og_image_path: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  heading_font: string;
  body_font: string;
  button_radius: string;
  hero_image_path: string | null;
}

export const BRAND_DEFAULTS: BrandSettings = {
  business_name: 'Studio Pranavi',
  business_tagline: 'We design the essence of light.',
  logo_path: null,
  logo_light_path: null,
  logo_dark_path: null,
  logo_mobile_path: null,
  favicon_path: null,
  og_image_path: null,
  primary_color: '#C8973A',
  secondary_color: '#2C2C2C',
  accent_color: '#C8973A',
  heading_font: 'Playfair Display',
  body_font: 'Inter',
  button_radius: '6px',
  hero_image_path: null,
};

export function useBrandSettings() {
  return useQuery<BrandSettings>({
    queryKey: ['public-brand-settings'],
    queryFn: async () => {
      // public_brand_settings is a view added by migration 19; not in generated types yet
      const { data, error } = await (supabase as any)
        .from('public_brand_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data as BrandSettings;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: BRAND_DEFAULTS,
    select: (data) => ({ ...BRAND_DEFAULTS, ...data }),
  });
}

export type LogoVariant = 'default' | 'light' | 'dark' | 'mobile';

export function resolveLogoUrl(
  settings: BrandSettings | undefined,
  variant: LogoVariant = 'default'
): string | null {
  if (!settings) return null;

  if (variant === 'light') {
    const envUrl = import.meta.env.VITE_LOGO_LIGHT_URL as string | undefined;
    if (envUrl) return envUrl;
    if (settings.logo_light_path) return settings.logo_light_path;
    if (settings.logo_path) return settings.logo_path;
    return null;
  }

  if (variant === 'mobile') {
    if (settings.logo_mobile_path) return settings.logo_mobile_path;
    return resolveLogoUrl(settings, 'default');
  }

  if (variant === 'dark') {
    if (settings.logo_dark_path) return settings.logo_dark_path;
    return null;
  }

  const envUrl = import.meta.env.VITE_LOGO_URL as string | undefined;
  if (envUrl) return envUrl;
  if (settings.logo_path) return settings.logo_path;
  return null;
}
