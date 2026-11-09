export type ContentStatus = 'draft' | 'published' | 'archived';
export type MediaKind = 'image' | 'video_file' | 'video_embed';
export type VideoPlatform = 'youtube' | 'vimeo' | 'upload';
export type SectionType =
  | 'hero'
  | 'selected_projects'
  | 'services'
  | 'collections'
  | 'gallery'
  | 'video'
  | 'about'
  | 'text_image'
  | 'craftsmanship'
  | 'materials'
  | 'process_timeline'
  | 'before_after'
  | 'testimonials'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'map';
export type SectionTheme = 'light' | 'dark' | 'stone' | 'amber';
export type NavGroup = 'main' | 'footer' | 'mobile';

export interface MediaFolder {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  is_public: boolean;
  created_at: string;
}

export interface MediaItem {
  id: string;
  folder_id: string | null;
  filename: string;
  title: string | null;
  caption: string | null;
  alt_text: string;
  media_kind: MediaKind;
  storage_path: string | null;
  external_url: string | null;
  video_platform: VideoPlatform | null;
  video_id: string | null;
  thumbnail_path: string | null;
  poster_path: string | null;
  video_transcript: string | null;
  autoplay: boolean;
  muted: boolean;
  loop: boolean;
  mobile_fallback_path: string | null;
  width: number | null;
  height: number | null;
  file_size_bytes: number | null;
  focal_point_x: number;
  focal_point_y: number;
  tags: string[];
  is_public: boolean;
  archived_at: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsitePage {
  id: string;
  slug: string;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_id: string | null;
  status: ContentStatus;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface PageSection {
  id: string;
  page_id: string;
  section_type: SectionType;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  content: Record<string, unknown>;
  media_id: string | null;
  theme: SectionTheme;
  background_color: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_secondary_label: string | null;
  cta_secondary_url: string | null;
  alignment: 'left' | 'center' | 'right';
  is_visible: boolean;
  sort_order: number;
  status: ContentStatus;
  published_at: string | null;
  scheduled_publish_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebsiteCollection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image_id: string | null;
  status: ContentStatus;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogueCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  cover_image_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface CatalogueItem {
  id: string;
  category_id: string;
  slug: string;
  model_number: string | null;
  name: string;
  short_description: string | null;
  description: string | null;
  specifications: Record<string, string>;
  cover_image_id: string | null;
  gallery_media_ids: string[];
  catalogue_pdf_id: string | null;
  is_downloadable: boolean;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CmsTestimonial {
  id: string;
  display_name: string;
  role_label: string | null;
  organisation: string | null;
  location_label: string | null;
  project_type: string | null;
  quote: string;
  rating: number | null;
  consent_recorded_at: string | null;
  photo_id: string | null;
  source_type: 'direct' | 'google' | 'email' | 'other' | null;
  is_featured: boolean;
  status: ContentStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  url: string;
  parent_id: string | null;
  sort_order: number;
  is_visible: boolean;
  opens_in_new_tab: boolean;
  nav_group: NavGroup;
  created_at: string;
}

export interface WebsiteSeo {
  id: string;
  page_path: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image_id: string | null;
  canonical_url: string | null;
  robots_directive: string;
  structured_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
