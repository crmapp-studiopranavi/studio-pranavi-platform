// AUTO-GENERATED PLACEHOLDER — replace by running:
//   npx supabase gen types typescript --local > packages/types/src/database.types.ts
// after `npx supabase start` with migrations applied.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: Database['public']['Enums']['app_role'];
          is_active: boolean;
          avatar_path: string | null;
          last_seen_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: Database['public']['Enums']['app_role'];
          is_active?: boolean;
          avatar_path?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: Database['public']['Enums']['app_role'];
          is_active?: boolean;
          avatar_path?: string | null;
          last_seen_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      business_settings: {
        Row: {
          id: string;
          business_name: string;
          legal_name: string | null;
          gstin: string | null;
          default_currency: string;
          timezone: string;
          phone: string | null;
          email: string | null;
          whatsapp_number: string | null;
          address: Json | null;
          logo_path: string | null;
          quotation_prefix: string;
          order_prefix: string;
          invoice_prefix: string;
          default_tax_rate: number;
          quote_validity_days: number;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          legal_name?: string | null;
          gstin?: string | null;
          default_currency?: string;
          timezone?: string;
          phone?: string | null;
          email?: string | null;
          whatsapp_number?: string | null;
          address?: Json | null;
          logo_path?: string | null;
          quotation_prefix?: string;
          order_prefix?: string;
          invoice_prefix?: string;
          default_tax_rate?: number;
          quote_validity_days?: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string;
          legal_name?: string | null;
          gstin?: string | null;
          default_currency?: string;
          timezone?: string;
          phone?: string | null;
          email?: string | null;
          whatsapp_number?: string | null;
          address?: Json | null;
          logo_path?: string | null;
          quotation_prefix?: string;
          order_prefix?: string;
          invoice_prefix?: string;
          default_tax_rate?: number;
          quote_validity_days?: number;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          description: string | null;
          category: string;
          hero_image_path: string | null;
          features: Json;
          faqs: Json;
          status: Database['public']['Enums']['content_status'];
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          short_description: string;
          description?: string | null;
          category: string;
          hero_image_path?: string | null;
          features?: Json;
          faqs?: Json;
          status?: Database['public']['Enums']['content_status'];
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          short_description?: string;
          description?: string | null;
          category?: string;
          hero_image_path?: string | null;
          features?: Json;
          faqs?: Json;
          status?: Database['public']['Enums']['content_status'];
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      portfolio_projects: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          location_label: string | null;
          summary: string;
          description: string | null;
          materials: string[];
          completed_on: string | null;
          cover_image_path: string | null;
          status: Database['public']['Enums']['content_status'];
          is_featured: boolean;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category: string;
          location_label?: string | null;
          summary: string;
          description?: string | null;
          materials?: string[];
          completed_on?: string | null;
          cover_image_path?: string | null;
          status?: Database['public']['Enums']['content_status'];
          is_featured?: boolean;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          category?: string;
          location_label?: string | null;
          summary?: string;
          description?: string | null;
          materials?: string[];
          completed_on?: string | null;
          cover_image_path?: string | null;
          status?: Database['public']['Enums']['content_status'];
          is_featured?: boolean;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      portfolio_images: {
        Row: {
          id: string;
          project_id: string;
          storage_path: string;
          alt_text: string;
          caption: string | null;
          width: number | null;
          height: number | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          storage_path: string;
          alt_text: string;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          storage_path?: string;
          alt_text?: string;
          caption?: string | null;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'portfolio_images_project_id_fkey';
            columns: ['project_id'];
            referencedRelation: 'portfolio_projects';
            referencedColumns: ['id'];
          },
        ];
      };
      testimonials: {
        Row: {
          id: string;
          display_name: string;
          project_type: string | null;
          quote: string;
          rating: number | null;
          consent_recorded_at: string | null;
          photo_id: string | null;
          location_label: string | null;
          source_type: string | null;
          status: Database['public']['Enums']['content_status'];
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          project_type?: string | null;
          quote: string;
          rating?: number | null;
          consent_recorded_at?: string | null;
          photo_id?: string | null;
          location_label?: string | null;
          source_type?: string | null;
          status?: Database['public']['Enums']['content_status'];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          project_type?: string | null;
          quote?: string;
          rating?: number | null;
          photo_id?: string | null;
          location_label?: string | null;
          source_type?: string | null;
          consent_recorded_at?: string | null;
          status?: Database['public']['Enums']['content_status'];
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          lead_number: number;
          source: string;
          status: Database['public']['Enums']['lead_status'];
          priority: Database['public']['Enums']['lead_priority'];
          full_name: string;
          email: string | null;
          phone: string | null;
          whatsapp_number: string | null;
          preferred_contact_method: Database['public']['Enums']['contact_method'] | null;
          location_text: string | null;
          service_id: string | null;
          service_interest: string | null;
          budget_min_minor: number | null;
          budget_max_minor: number | null;
          project_description: string;
          owner_id: string | null;
          next_follow_up_at: string | null;
          lost_reason: string | null;
          consent_text_version: string | null;
          consented_at: string | null;
          converted_customer_id: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          lead_number?: number;
          source?: string;
          status?: Database['public']['Enums']['lead_status'];
          priority?: Database['public']['Enums']['lead_priority'];
          full_name: string;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          preferred_contact_method?: Database['public']['Enums']['contact_method'] | null;
          location_text?: string | null;
          service_id?: string | null;
          service_interest?: string | null;
          budget_min_minor?: number | null;
          budget_max_minor?: number | null;
          project_description: string;
          owner_id?: string | null;
          next_follow_up_at?: string | null;
          lost_reason?: string | null;
          consent_text_version?: string | null;
          consented_at?: string | null;
          converted_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          lead_number?: number;
          source?: string;
          status?: Database['public']['Enums']['lead_status'];
          priority?: Database['public']['Enums']['lead_priority'];
          full_name?: string;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          preferred_contact_method?: Database['public']['Enums']['contact_method'] | null;
          location_text?: string | null;
          service_id?: string | null;
          service_interest?: string | null;
          budget_min_minor?: number | null;
          budget_max_minor?: number | null;
          project_description?: string;
          owner_id?: string | null;
          next_follow_up_at?: string | null;
          lost_reason?: string | null;
          consent_text_version?: string | null;
          consented_at?: string | null;
          converted_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          customer_number: number;
          display_name: string;
          customer_type: string | null;
          primary_contact_id: string | null;
          gstin: string | null;
          owner_id: string | null;
          source_lead_id: string | null;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          customer_number?: number;
          display_name: string;
          customer_type?: string | null;
          primary_contact_id?: string | null;
          gstin?: string | null;
          owner_id?: string | null;
          source_lead_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          customer_number?: number;
          display_name?: string;
          customer_type?: string | null;
          primary_contact_id?: string | null;
          gstin?: string | null;
          owner_id?: string | null;
          source_lead_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      customer_contacts: {
        Row: {
          id: string;
          customer_id: string;
          full_name: string;
          title: string | null;
          email: string | null;
          phone: string | null;
          whatsapp_number: string | null;
          preferred_contact_method: Database['public']['Enums']['contact_method'] | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          full_name: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          preferred_contact_method?: Database['public']['Enums']['contact_method'] | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          full_name?: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          whatsapp_number?: string | null;
          preferred_contact_method?: Database['public']['Enums']['contact_method'] | null;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customer_contacts_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
        ];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          address_type: string | null;
          line1: string;
          line2: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          country_code: string;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          address_type?: string | null;
          line1: string;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country_code?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          address_type?: string | null;
          line1?: string;
          line2?: string | null;
          city?: string | null;
          state?: string | null;
          postal_code?: string | null;
          country_code?: string;
          is_primary?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          activity_type: Database['public']['Enums']['activity_type'];
          subject: string | null;
          body: string | null;
          occurred_at: string;
          actor_id: string | null;
          lead_id: string | null;
          customer_id: string | null;
          quote_id: string | null;
          order_id: string | null;
          project_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          activity_type: Database['public']['Enums']['activity_type'];
          subject?: string | null;
          body?: string | null;
          occurred_at?: string;
          actor_id?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          quote_id?: string | null;
          order_id?: string | null;
          project_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          activity_type?: Database['public']['Enums']['activity_type'];
          subject?: string | null;
          body?: string | null;
          occurred_at?: string;
          actor_id?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          quote_id?: string | null;
          order_id?: string | null;
          project_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          assigned_to: string | null;
          created_by: string | null;
          due_at: string | null;
          completed_at: string | null;
          priority: Database['public']['Enums']['lead_priority'] | null;
          status: string;
          lead_id: string | null;
          customer_id: string | null;
          quote_id: string | null;
          order_id: string | null;
          project_id: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          priority?: Database['public']['Enums']['lead_priority'] | null;
          status?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          quote_id?: string | null;
          order_id?: string | null;
          project_id?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          due_at?: string | null;
          completed_at?: string | null;
          priority?: Database['public']['Enums']['lead_priority'] | null;
          status?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          quote_id?: string | null;
          order_id?: string | null;
          project_id?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      site_visits: {
        Row: {
          id: string;
          lead_id: string | null;
          customer_id: string | null;
          project_id: string | null;
          scheduled_start: string | null;
          scheduled_end: string | null;
          assigned_to: string | null;
          address_id: string | null;
          status: string;
          purpose: string | null;
          notes: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          project_id?: string | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          assigned_to?: string | null;
          address_id?: string | null;
          status?: string;
          purpose?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lead_id?: string | null;
          customer_id?: string | null;
          project_id?: string | null;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          assigned_to?: string | null;
          address_id?: string | null;
          status?: string;
          purpose?: string | null;
          notes?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      measurements: {
        Row: {
          id: string;
          site_visit_id: string | null;
          project_id: string | null;
          area_or_item: string;
          width_mm: number | null;
          height_mm: number | null;
          depth_mm: number | null;
          quantity: number;
          unit: string;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_visit_id?: string | null;
          project_id?: string | null;
          area_or_item: string;
          width_mm?: number | null;
          height_mm?: number | null;
          depth_mm?: number | null;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          site_visit_id?: string | null;
          project_id?: string | null;
          area_or_item?: string;
          width_mm?: number | null;
          height_mm?: number | null;
          depth_mm?: number | null;
          quantity?: number;
          unit?: string;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          id: string;
          quote_number: string;
          customer_id: string;
          lead_id: string | null;
          project_id: string | null;
          status: Database['public']['Enums']['quote_status'];
          current_version_id: string | null;
          owner_id: string | null;
          accepted_at: string | null;
          rejected_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          quote_number: string;
          customer_id: string;
          lead_id?: string | null;
          project_id?: string | null;
          status?: Database['public']['Enums']['quote_status'];
          current_version_id?: string | null;
          owner_id?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          quote_number?: string;
          customer_id?: string;
          lead_id?: string | null;
          project_id?: string | null;
          status?: Database['public']['Enums']['quote_status'];
          current_version_id?: string | null;
          owner_id?: string | null;
          accepted_at?: string | null;
          rejected_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      quote_versions: {
        Row: {
          id: string;
          quote_id: string;
          version_number: number;
          issue_date: string;
          valid_until: string;
          currency: string;
          subtotal_minor: number;
          discount_minor: number;
          tax_minor: number;
          total_minor: number;
          terms: string | null;
          customer_notes: string | null;
          internal_notes: string | null;
          sent_at: string | null;
          snapshot_customer: Json;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_id: string;
          version_number: number;
          issue_date: string;
          valid_until: string;
          currency?: string;
          subtotal_minor?: number;
          discount_minor?: number;
          tax_minor?: number;
          total_minor?: number;
          terms?: string | null;
          customer_notes?: string | null;
          internal_notes?: string | null;
          sent_at?: string | null;
          snapshot_customer?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_id?: string;
          version_number?: number;
          issue_date?: string;
          valid_until?: string;
          currency?: string;
          subtotal_minor?: number;
          discount_minor?: number;
          tax_minor?: number;
          total_minor?: number;
          terms?: string | null;
          customer_notes?: string | null;
          internal_notes?: string | null;
          sent_at?: string | null;
          snapshot_customer?: Json;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      quote_items: {
        Row: {
          id: string;
          quote_version_id: string;
          line_number: number;
          item_type: string;
          title: string;
          description: string | null;
          quantity: number;
          unit: string;
          unit_price_minor: number;
          discount_rate: number;
          tax_rate: number;
          line_subtotal_minor: number;
          line_discount_minor: number;
          line_tax_minor: number;
          line_total_minor: number;
          sort_order: number;
          metadata: Json;
        };
        Insert: {
          id?: string;
          quote_version_id: string;
          line_number: number;
          item_type: string;
          title: string;
          description?: string | null;
          quantity: number;
          unit: string;
          unit_price_minor: number;
          discount_rate?: number;
          tax_rate?: number;
          line_subtotal_minor: number;
          line_discount_minor: number;
          line_tax_minor: number;
          line_total_minor: number;
          sort_order?: number;
          metadata?: Json;
        };
        Update: {
          id?: string;
          quote_version_id?: string;
          line_number?: number;
          item_type?: string;
          title?: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          unit_price_minor?: number;
          discount_rate?: number;
          tax_rate?: number;
          line_subtotal_minor?: number;
          line_discount_minor?: number;
          line_tax_minor?: number;
          line_total_minor?: number;
          sort_order?: number;
          metadata?: Json;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          quote_id: string | null;
          accepted_quote_version_id: string | null;
          status: Database['public']['Enums']['order_status'];
          order_date: string;
          target_completion_date: string | null;
          currency: string;
          total_minor: number;
          owner_id: string | null;
          notes: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          quote_id?: string | null;
          accepted_quote_version_id?: string | null;
          status?: Database['public']['Enums']['order_status'];
          order_date?: string;
          target_completion_date?: string | null;
          currency?: string;
          total_minor: number;
          owner_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          quote_id?: string | null;
          accepted_quote_version_id?: string | null;
          status?: Database['public']['Enums']['order_status'];
          order_date?: string;
          target_completion_date?: string | null;
          currency?: string;
          total_minor?: number;
          owner_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          project_number: string;
          order_id: string | null;
          customer_id: string;
          name: string;
          status: Database['public']['Enums']['project_status'];
          location_address_id: string | null;
          start_date: string | null;
          target_completion_date: string | null;
          actual_completion_date: string | null;
          project_manager_id: string | null;
          scope: string | null;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          project_number: string;
          order_id?: string | null;
          customer_id: string;
          name: string;
          status?: Database['public']['Enums']['project_status'];
          location_address_id?: string | null;
          start_date?: string | null;
          target_completion_date?: string | null;
          actual_completion_date?: string | null;
          project_manager_id?: string | null;
          scope?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          project_number?: string;
          order_id?: string | null;
          customer_id?: string;
          name?: string;
          status?: Database['public']['Enums']['project_status'];
          location_address_id?: string | null;
          start_date?: string | null;
          target_completion_date?: string | null;
          actual_completion_date?: string | null;
          project_manager_id?: string | null;
          scope?: string | null;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          description: string | null;
          status: string;
          due_date: string | null;
          completed_at: string | null;
          sort_order: number;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          description?: string | null;
          status?: string;
          due_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          description?: string | null;
          status?: string;
          due_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      installations: {
        Row: {
          id: string;
          project_id: string;
          scheduled_start: string | null;
          scheduled_end: string | null;
          assigned_team: string | null;
          lead_installer_id: string | null;
          status: string;
          completion_notes: string | null;
          customer_signoff_name: string | null;
          signed_off_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          assigned_team?: string | null;
          lead_installer_id?: string | null;
          status?: string;
          completion_notes?: string | null;
          customer_signoff_name?: string | null;
          signed_off_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          scheduled_start?: string | null;
          scheduled_end?: string | null;
          assigned_team?: string | null;
          lead_installer_id?: string | null;
          status?: string;
          completion_notes?: string | null;
          customer_signoff_name?: string | null;
          signed_off_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          customer_id: string;
          order_id: string | null;
          project_id: string | null;
          status: Database['public']['Enums']['invoice_status'];
          issue_date: string;
          due_date: string;
          currency: string;
          subtotal_minor: number;
          discount_minor: number;
          tax_minor: number;
          total_minor: number;
          amount_paid_minor: number;
          balance_minor: number;
          notes: string | null;
          issued_at: string | null;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          customer_id: string;
          order_id?: string | null;
          project_id?: string | null;
          status?: Database['public']['Enums']['invoice_status'];
          issue_date: string;
          due_date: string;
          currency?: string;
          subtotal_minor: number;
          discount_minor?: number;
          tax_minor?: number;
          total_minor: number;
          amount_paid_minor?: number;
          balance_minor: number;
          notes?: string | null;
          issued_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          customer_id?: string;
          order_id?: string | null;
          project_id?: string | null;
          status?: Database['public']['Enums']['invoice_status'];
          issue_date?: string;
          due_date?: string;
          currency?: string;
          subtotal_minor?: number;
          discount_minor?: number;
          tax_minor?: number;
          total_minor?: number;
          amount_paid_minor?: number;
          balance_minor?: number;
          notes?: string | null;
          issued_at?: string | null;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          line_number: number;
          title: string;
          description: string | null;
          quantity: number;
          unit: string;
          unit_price_minor: number;
          discount_rate: number;
          tax_rate: number;
          line_subtotal_minor: number;
          line_discount_minor: number;
          line_tax_minor: number;
          line_total_minor: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          line_number: number;
          title: string;
          description?: string | null;
          quantity: number;
          unit: string;
          unit_price_minor: number;
          discount_rate?: number;
          tax_rate?: number;
          line_subtotal_minor: number;
          line_discount_minor: number;
          line_tax_minor: number;
          line_total_minor: number;
          sort_order?: number;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          line_number?: number;
          title?: string;
          description?: string | null;
          quantity?: number;
          unit?: string;
          unit_price_minor?: number;
          discount_rate?: number;
          tax_rate?: number;
          line_subtotal_minor?: number;
          line_discount_minor?: number;
          line_tax_minor?: number;
          line_total_minor?: number;
          sort_order?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          payment_number: string;
          invoice_id: string;
          customer_id: string;
          amount_minor: number;
          currency: string;
          payment_date: string;
          method: Database['public']['Enums']['payment_method'];
          status: Database['public']['Enums']['payment_status'];
          reference: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
          reversed_at: string | null;
        };
        Insert: {
          id?: string;
          payment_number: string;
          invoice_id: string;
          customer_id: string;
          amount_minor: number;
          currency?: string;
          payment_date: string;
          method: Database['public']['Enums']['payment_method'];
          status?: Database['public']['Enums']['payment_status'];
          reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
          reversed_at?: string | null;
        };
        Update: {
          id?: string;
          payment_number?: string;
          invoice_id?: string;
          customer_id?: string;
          amount_minor?: number;
          currency?: string;
          payment_date?: string;
          method?: Database['public']['Enums']['payment_method'];
          status?: Database['public']['Enums']['payment_status'];
          reference?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
          reversed_at?: string | null;
        };
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          bucket: string;
          storage_path: string;
          original_filename: string;
          content_type: string;
          size_bytes: number;
          visibility: Database['public']['Enums']['attachment_visibility'];
          uploaded_by: string | null;
          lead_id: string | null;
          customer_id: string | null;
          quote_id: string | null;
          order_id: string | null;
          project_id: string | null;
          activity_id: string | null;
          checksum: string | null;
          created_at: string;
          archived_at: string | null;
        };
        Insert: {
          id?: string;
          bucket: string;
          storage_path: string;
          original_filename: string;
          content_type: string;
          size_bytes: number;
          visibility?: Database['public']['Enums']['attachment_visibility'];
          uploaded_by?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          quote_id?: string | null;
          order_id?: string | null;
          project_id?: string | null;
          activity_id?: string | null;
          checksum?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Update: {
          id?: string;
          bucket?: string;
          storage_path?: string;
          original_filename?: string;
          content_type?: string;
          size_bytes?: number;
          visibility?: Database['public']['Enums']['attachment_visibility'];
          uploaded_by?: string | null;
          lead_id?: string | null;
          customer_id?: string | null;
          quote_id?: string | null;
          order_id?: string | null;
          project_id?: string | null;
          activity_id?: string | null;
          checksum?: string | null;
          created_at?: string;
          archived_at?: string | null;
        };
        Relationships: [];
      };
      notification_outbox: {
        Row: {
          id: string;
          event_type: string;
          template_key: string;
          recipient: string;
          payload: Json;
          idempotency_key: string;
          status: 'pending' | 'processing' | 'delivered' | 'failed';
          attempts: number;
          max_attempts: number;
          last_error: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          template_key?: string;
          recipient?: string;
          payload?: Json;
          idempotency_key: string;
          status?: 'pending' | 'processing' | 'delivered' | 'failed';
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          template_key?: string;
          recipient?: string;
          payload?: Json;
          idempotency_key?: string;
          status?: 'pending' | 'processing' | 'delivered' | 'failed';
          attempts?: number;
          max_attempts?: number;
          last_error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          before_data: Json | null;
          after_data: Json | null;
          request_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: never;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          request_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: never;
          actor_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          before_data?: Json | null;
          after_data?: Json | null;
          request_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      media_folders: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          is_public: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          is_public?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      media_library: {
        Row: {
          id: string;
          folder_id: string | null;
          filename: string;
          title: string | null;
          caption: string | null;
          alt_text: string;
          media_kind: string;
          storage_path: string | null;
          external_url: string | null;
          video_platform: string | null;
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
        };
        Insert: {
          id?: string;
          folder_id?: string | null;
          filename: string;
          title?: string | null;
          caption?: string | null;
          alt_text?: string;
          media_kind?: string;
          storage_path?: string | null;
          external_url?: string | null;
          video_platform?: string | null;
          video_id?: string | null;
          thumbnail_path?: string | null;
          poster_path?: string | null;
          video_transcript?: string | null;
          autoplay?: boolean;
          muted?: boolean;
          loop?: boolean;
          mobile_fallback_path?: string | null;
          width?: number | null;
          height?: number | null;
          file_size_bytes?: number | null;
          focal_point_x?: number;
          focal_point_y?: number;
          tags?: string[];
          is_public?: boolean;
          archived_at?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          folder_id?: string | null;
          filename?: string;
          title?: string | null;
          caption?: string | null;
          alt_text?: string;
          media_kind?: string;
          storage_path?: string | null;
          external_url?: string | null;
          video_platform?: string | null;
          video_id?: string | null;
          thumbnail_path?: string | null;
          poster_path?: string | null;
          video_transcript?: string | null;
          autoplay?: boolean;
          muted?: boolean;
          loop?: boolean;
          mobile_fallback_path?: string | null;
          width?: number | null;
          height?: number | null;
          file_size_bytes?: number | null;
          focal_point_x?: number;
          focal_point_y?: number;
          tags?: string[];
          is_public?: boolean;
          archived_at?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      media_usage: {
        Row: {
          id: string;
          media_id: string;
          entity_type: string;
          entity_id: string;
          field_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          media_id: string;
          entity_type: string;
          entity_id: string;
          field_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          media_id?: string;
          entity_type?: string;
          entity_id?: string;
          field_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      website_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          meta_title: string | null;
          meta_description: string | null;
          og_image_id: string | null;
          status: string;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image_id?: string | null;
          status?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image_id?: string | null;
          status?: string;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_sections: {
        Row: {
          id: string;
          page_id: string;
          section_type: string;
          title: string | null;
          subtitle: string | null;
          description: string | null;
          content: Json;
          media_id: string | null;
          theme: string;
          background_color: string | null;
          cta_label: string | null;
          cta_url: string | null;
          cta_secondary_label: string | null;
          cta_secondary_url: string | null;
          alignment: string;
          is_visible: boolean;
          sort_order: number;
          status: string;
          published_at: string | null;
          scheduled_publish_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          section_type: string;
          title?: string | null;
          subtitle?: string | null;
          description?: string | null;
          content?: Json;
          media_id?: string | null;
          theme?: string;
          background_color?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          cta_secondary_label?: string | null;
          cta_secondary_url?: string | null;
          alignment?: string;
          is_visible?: boolean;
          sort_order?: number;
          status?: string;
          published_at?: string | null;
          scheduled_publish_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_id?: string;
          section_type?: string;
          title?: string | null;
          subtitle?: string | null;
          description?: string | null;
          content?: Json;
          media_id?: string | null;
          theme?: string;
          background_color?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          cta_secondary_label?: string | null;
          cta_secondary_url?: string | null;
          alignment?: string;
          is_visible?: boolean;
          sort_order?: number;
          status?: string;
          published_at?: string | null;
          scheduled_publish_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_collections: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          cover_image_id: string | null;
          status: string;
          sort_order: number;
          seo_title: string | null;
          seo_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          cover_image_id?: string | null;
          status?: string;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          cover_image_id?: string | null;
          status?: string;
          sort_order?: number;
          seo_title?: string | null;
          seo_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalogue_categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          parent_id: string | null;
          cover_image_id: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          parent_id?: string | null;
          cover_image_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          parent_id?: string | null;
          cover_image_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      catalogue_items: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          model_number: string | null;
          name: string;
          short_description: string | null;
          description: string | null;
          specifications: Json;
          cover_image_id: string | null;
          gallery_media_ids: string[];
          catalogue_pdf_id: string | null;
          is_downloadable: boolean;
          status: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          model_number?: string | null;
          name: string;
          short_description?: string | null;
          description?: string | null;
          specifications?: Json;
          cover_image_id?: string | null;
          gallery_media_ids?: string[];
          catalogue_pdf_id?: string | null;
          is_downloadable?: boolean;
          status?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          slug?: string;
          model_number?: string | null;
          name?: string;
          short_description?: string | null;
          description?: string | null;
          specifications?: Json;
          cover_image_id?: string | null;
          gallery_media_ids?: string[];
          catalogue_pdf_id?: string | null;
          is_downloadable?: boolean;
          status?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      website_navigation: {
        Row: {
          id: string;
          label: string;
          url: string;
          parent_id: string | null;
          sort_order: number;
          is_visible: boolean;
          opens_in_new_tab: boolean;
          nav_group: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          label: string;
          url: string;
          parent_id?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          opens_in_new_tab?: boolean;
          nav_group?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          label?: string;
          url?: string;
          parent_id?: string | null;
          sort_order?: number;
          is_visible?: boolean;
          opens_in_new_tab?: boolean;
          nav_group?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      website_seo: {
        Row: {
          id: string;
          page_path: string;
          meta_title: string | null;
          meta_description: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image_id: string | null;
          canonical_url: string | null;
          robots_directive: string;
          structured_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          page_path: string;
          meta_title?: string | null;
          meta_description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image_id?: string | null;
          canonical_url?: string | null;
          robots_directive?: string;
          structured_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          page_path?: string;
          meta_title?: string | null;
          meta_description?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image_id?: string | null;
          canonical_url?: string | null;
          robots_directive?: string;
          structured_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      import_jobs: {
        Row: {
          id: string;
          entity_type: 'leads' | 'customers' | 'orders' | 'projects' | 'tasks';
          actor_id: string;
          status: 'pending' | 'processing' | 'done' | 'failed';
          total_rows: number | null;
          valid_rows: number | null;
          invalid_rows: number | null;
          duplicate_rows: number | null;
          imported_rows: number | null;
          error_summary: Record<string, unknown> | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          entity_type: 'leads' | 'customers' | 'orders' | 'projects' | 'tasks';
          actor_id: string;
          status?: 'pending' | 'processing' | 'done' | 'failed';
          total_rows?: number | null;
          valid_rows?: number | null;
          invalid_rows?: number | null;
          duplicate_rows?: number | null;
          imported_rows?: number | null;
          error_summary?: Record<string, unknown> | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          entity_type?: 'leads' | 'customers' | 'orders' | 'projects' | 'tasks';
          actor_id?: string;
          status?: 'pending' | 'processing' | 'done' | 'failed';
          total_rows?: number | null;
          valid_rows?: number | null;
          invalid_rows?: number | null;
          duplicate_rows?: number | null;
          imported_rows?: number | null;
          error_summary?: Record<string, unknown> | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      export_jobs: {
        Row: {
          id: string;
          entity_type: string;
          actor_id: string;
          format: 'csv' | 'xlsx';
          scope: 'filtered' | 'selected' | 'all';
          row_count: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          actor_id: string;
          format: 'csv' | 'xlsx';
          scope: 'filtered' | 'selected' | 'all';
          row_count?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          entity_type?: string;
          actor_id?: string;
          format?: 'csv' | 'xlsx';
          scope?: 'filtered' | 'selected' | 'all';
          row_count?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          notification_type: string;
          title: string;
          body: string | null;
          related_entity_type: string | null;
          related_entity_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          notification_type: string;
          title: string;
          body?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          notification_type?: string;
          title?: string;
          body?: string | null;
          related_entity_type?: string | null;
          related_entity_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          profile_id: string;
          notification_type: string;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          notification_type: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          notification_type?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_rules: {
        Row: {
          id: string;
          rule_key: string;
          label: string;
          description: string | null;
          enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          rule_key: string;
          label: string;
          description?: string | null;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          rule_key?: string;
          label?: string;
          description?: string | null;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      convert_lead_to_customer: {
        Args: { p_lead_id: string };
        Returns: { customer_id: string };
      };
      create_quote: {
        Args: {
          p_customer_id: string;
          p_lead_id?: string | null;
          p_issue_date?: string;
          p_valid_until?: string;
          p_currency?: string;
          p_owner_id?: string | null;
          p_terms?: string | null;
          p_customer_notes?: string | null;
          p_internal_notes?: string | null;
        };
        Returns: { quote_id: string; version_id: string };
      };
      recalculate_version_totals: {
        Args: { p_version_id: string };
        Returns: {
          subtotal_minor: number;
          discount_minor: number;
          tax_minor: number;
          total_minor: number;
        };
      };
      send_quote: {
        Args: { p_quote_id: string };
        Returns: { quote_id: string };
      };
      accept_quote: {
        Args: { p_quote_id: string; p_notes?: string | null };
        Returns: { quote_id: string };
      };
      reject_quote: {
        Args: { p_quote_id: string; p_reason?: string | null };
        Returns: { quote_id: string };
      };
      revise_quote: {
        Args: { p_quote_id: string };
        Returns: { quote_id: string; version_id: string };
      };
      create_order_from_quote: {
        Args: { p_quote_id: string };
        Returns: { order_id: string };
      };
      create_project: {
        Args: {
          p_name: string;
          p_customer_id: string;
          p_order_id?: string | null;
          p_manager_id?: string | null;
          p_scope?: string | null;
          p_start_date?: string | null;
          p_target_completion_date?: string | null;
        };
        Returns: { project_id: string; project_number: string };
      };
      get_staff_list: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: Database['public']['Enums']['app_role'];
          is_active: boolean;
          last_seen_at: string | null;
          created_at: string;
        }[];
      };
      apply_payment: {
        Args: { p_payment_id: string };
        Returns: undefined;
      };
      create_invoice: {
        Args: {
          p_customer_id: string;
          p_order_id?: string | null;
          p_project_id?: string | null;
          p_issue_date?: string;
          p_due_date?: string;
          p_notes?: string | null;
        };
        Returns: { invoice_id: string; invoice_number: string };
      };
      add_invoice_item: {
        Args: {
          p_invoice_id: string;
          p_title: string;
          p_description?: string | null;
          p_quantity?: number;
          p_unit?: string;
          p_unit_price_minor?: number;
          p_discount_rate?: number;
          p_tax_rate?: number;
        };
        Returns: { item_id: string };
      };
      recalculate_invoice_totals: {
        Args: { p_invoice_id: string };
        Returns: undefined;
      };
      issue_invoice: {
        Args: { p_invoice_id: string };
        Returns: undefined;
      };
      record_payment: {
        Args: {
          p_invoice_id: string;
          p_amount_minor: number;
          p_method: string;
          p_payment_date: string;
          p_reference?: string | null;
          p_notes?: string | null;
        };
        Returns: { payment_id: string; payment_number: string };
      };
      reverse_payment: {
        Args: { p_payment_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      void_invoice: {
        Args: { p_invoice_id: string };
        Returns: undefined;
      };
      submit_public_lead: {
        Args: {
          p_full_name: string;
          p_email?: string;
          p_phone?: string;
          p_whatsapp_number?: string;
          p_preferred_contact_method?: string;
          p_location_text?: string;
          p_service_id?: string;
          p_budget_min_minor?: number;
          p_budget_max_minor?: number;
          p_project_description: string;
          p_consent_text_version?: string;
          p_source?: string;
          p_attachment_paths?: string[];
        };
        Returns: { receipt_id: string };
      };
      submit_contact_inquiry: {
        Args: {
          p_name: string;
          p_email?: string;
          p_phone?: string;
          p_message?: string;
        };
        Returns: { success: boolean };
      };
      get_my_role: {
        Args: Record<string, never>;
        Returns: Database['public']['Enums']['app_role'];
      };
      is_active_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      publish_page_section: {
        Args: { p_section_id: string };
        Returns: undefined;
      };
      reorder_page_sections: {
        Args: { p_page_id: string; p_ordered_ids: string[] };
        Returns: undefined;
      };
      get_manager_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_sales_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_operations_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_finance_metrics: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      enqueue_time_based_notifications: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      process_next_outbox_item: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      mark_notifications_read: {
        Args: { p_ids: string[] };
        Returns: undefined;
      };
      get_unread_notification_count: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      get_sales_report: {
        Args: {
          p_from?: string | null;
          p_to?: string | null;
          p_source?: string | null;
          p_service_id?: string | null;
          p_owner_id?: string | null;
        };
        Returns: Json;
      };
      get_operations_report: {
        Args: {
          p_from?: string | null;
          p_to?: string | null;
          p_project_status?: string | null;
          p_owner_id?: string | null;
        };
        Returns: Json;
      };
      get_finance_report: {
        Args: {
          p_from?: string | null;
          p_to?: string | null;
          p_customer_id?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: 'admin' | 'manager' | 'sales' | 'operations' | 'viewer';
      lead_status:
        | 'new'
        | 'contacted'
        | 'site_visit_scheduled'
        | 'site_visit_completed'
        | 'quote_drafting'
        | 'quote_sent'
        | 'negotiation'
        | 'won'
        | 'lost'
        | 'archived';
      lead_priority: 'low' | 'medium' | 'high' | 'urgent';
      contact_method: 'phone' | 'email' | 'whatsapp' | 'sms' | 'in_person' | 'other';
      quote_status:
        | 'draft'
        | 'internal_review'
        | 'sent'
        | 'viewed'
        | 'accepted'
        | 'rejected'
        | 'expired'
        | 'superseded'
        | 'cancelled';
      order_status:
        | 'confirmed'
        | 'design_or_measurement'
        | 'production'
        | 'ready_for_installation'
        | 'installation_scheduled'
        | 'installed'
        | 'completed'
        | 'cancelled'
        | 'on_hold';
      project_status: 'planned' | 'active' | 'blocked' | 'on_hold' | 'completed' | 'cancelled';
      invoice_status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'overdue' | 'void';
      payment_method: 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'other';
      payment_status: 'pending' | 'cleared' | 'failed' | 'reversed' | 'refunded';
      activity_type:
        | 'note'
        | 'call'
        | 'email'
        | 'whatsapp'
        | 'meeting'
        | 'site_visit'
        | 'status_change'
        | 'quote_sent'
        | 'payment'
        | 'system';
      attachment_visibility: 'private' | 'customer_shareable' | 'public';
      content_status: 'draft' | 'published' | 'archived';
      section_type:
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
      section_theme: 'light' | 'dark' | 'stone' | 'amber';
      media_kind: 'image' | 'video_file' | 'video_embed';
      video_platform: 'youtube' | 'vimeo' | 'upload';
      nav_group: 'main' | 'footer' | 'mobile';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ─── Supabase convenience helpers ──────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];
