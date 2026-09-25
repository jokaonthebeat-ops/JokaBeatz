export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_content: {
        Row: {
          active: boolean
          beat_id: string | null
          body: string | null
          created_at: string
          ends_at: string | null
          id: string
          image_url: string | null
          link: string | null
          sort_order: number
          starts_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          beat_id?: string | null
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          sort_order?: number
          starts_at?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          beat_id?: string | null
          body?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          sort_order?: number
          starts_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_content_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
        ]
      }
      beat_license_deliverables: {
        Row: {
          license_id: string
          paths: string[]
          updated_at: string
        }
        Insert: {
          license_id: string
          paths?: string[]
          updated_at?: string
        }
        Update: {
          license_id?: string
          paths?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beat_license_deliverables_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: true
            referencedRelation: "beat_licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      beat_licenses: {
        Row: {
          active: boolean
          beat_id: string
          created_at: string
          id: string
          price_cents: number
          stripe_price_id: string | null
          terms_summary: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          beat_id: string
          created_at?: string
          id?: string
          price_cents?: number
          stripe_price_id?: string | null
          terms_summary?: string | null
          tier: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          beat_id?: string
          created_at?: string
          id?: string
          price_cents?: number
          stripe_price_id?: string | null
          terms_summary?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "beat_licenses_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
        ]
      }
      beats: {
        Row: {
          bpm: number | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          genre: string | null
          id: string
          mood: string | null
          musical_key: string | null
          plays_count: number
          preview_audio_path: string | null
          slug: string | null
          sort_order: number
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          genre?: string | null
          id?: string
          mood?: string | null
          musical_key?: string | null
          plays_count?: number
          preview_audio_path?: string | null
          slug?: string | null
          sort_order?: number
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          bpm?: number | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          genre?: string | null
          id?: string
          mood?: string | null
          musical_key?: string | null
          plays_count?: number
          preview_audio_path?: string | null
          slug?: string | null
          sort_order?: number
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          is_ai_generated: boolean | null
          og_image: string | null
          published_at: string | null
          read_time: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_ai_generated?: boolean | null
          og_image?: string | null
          published_at?: string | null
          read_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_ai_generated?: boolean | null
          og_image?: string | null
          published_at?: string | null
          read_time?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_settings: {
        Row: {
          auto_generate_enabled: boolean | null
          content_topics: Json | null
          created_at: string
          default_author: string | null
          generation_frequency: string | null
          id: string
          last_generated_at: string | null
          updated_at: string
        }
        Insert: {
          auto_generate_enabled?: boolean | null
          content_topics?: Json | null
          created_at?: string
          default_author?: string | null
          generation_frequency?: string | null
          id?: string
          last_generated_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_generate_enabled?: boolean | null
          content_topics?: Json | null
          created_at?: string
          default_author?: string | null
          generation_frequency?: string | null
          id?: string
          last_generated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          content: string
          created_at: string
          emails_bounced: number | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_opened: number | null
          emails_sent: number | null
          id: string
          recipient_count: number | null
          recipient_type: string
          sent_at: string | null
          sent_by: string | null
          subject: string
          unique_clicks: number | null
          unique_opens: number | null
        }
        Insert: {
          content: string
          created_at?: string
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          id?: string
          recipient_count?: number | null
          recipient_type: string
          sent_at?: string | null
          sent_by?: string | null
          subject: string
          unique_clicks?: number | null
          unique_opens?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          id?: string
          recipient_count?: number | null
          recipient_type?: string
          sent_at?: string | null
          sent_by?: string | null
          subject?: string
          unique_clicks?: number | null
          unique_opens?: number | null
        }
        Relationships: []
      }
      email_sequence_enrollments: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          current_step: number
          enrolled_at: string
          id: string
          next_send_at: string | null
          recipient_email: string
          sequence_id: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          next_send_at?: string | null
          recipient_email: string
          sequence_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          enrolled_at?: string
          id?: string
          next_send_at?: string | null
          recipient_email?: string
          sequence_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_enrollments_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_enrollments_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_logs: {
        Row: {
          bounced_at: string | null
          click_count: number | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          enrollment_id: string
          id: string
          open_count: number | null
          opened_at: string | null
          sent_at: string
          status: string
          step_id: string
        }
        Insert: {
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          enrollment_id: string
          id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string
          status?: string
          step_id: string
        }
        Update: {
          bounced_at?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          enrollment_id?: string
          id?: string
          open_count?: number | null
          opened_at?: string | null
          sent_at?: string
          status?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_logs_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_logs_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "email_sequence_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequence_steps: {
        Row: {
          content: string
          created_at: string
          delay_hours: number
          id: string
          sequence_id: string
          step_order: number
          subject: string
          template_id: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          delay_hours?: number
          id?: string
          sequence_id: string
          step_order?: number
          subject: string
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          delay_hours?: number
          id?: string
          sequence_id?: string
          step_order?: number
          subject?: string
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequence_steps_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_sequence_steps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_tracking_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          recipient_email: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          recipient_email: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          recipient_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      free_beat_requests: {
        Row: {
          created_at: string
          email: string
          genre: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          genre?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          genre?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      free_beats: {
        Row: {
          active: boolean
          bpm: number | null
          created_at: string
          display_order: number
          download_url: string
          genre: string | null
          id: string
          image_url: string | null
          preview_url: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bpm?: number | null
          created_at?: string
          display_order?: number
          download_url: string
          genre?: string | null
          id?: string
          image_url?: string | null
          preview_url: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bpm?: number | null
          created_at?: string
          display_order?: number
          download_url?: string
          genre?: string | null
          id?: string
          image_url?: string | null
          preview_url?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          source_page: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          source_page?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          source_page?: string | null
        }
        Relationships: []
      }
      lyrics: {
        Row: {
          bars_per_section: number
          beat_id: string | null
          body: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bars_per_section?: number
          beat_id?: string | null
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          bars_per_section?: number
          beat_id?: string | null
          body?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyrics_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
        ]
      }
      mastering_jobs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          input_file_url: string
          output_file_url: string | null
          preview_file_url: string | null
          price_cents: number | null
          processing_stage: string | null
          service_id: string | null
          settings: Json
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_file_url: string
          output_file_url?: string | null
          preview_file_url?: string | null
          price_cents?: number | null
          processing_stage?: string | null
          service_id?: string | null
          settings?: Json
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          input_file_url?: string
          output_file_url?: string | null
          preview_file_url?: string | null
          price_cents?: number | null
          processing_stage?: string | null
          service_id?: string | null
          settings?: Json
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastering_jobs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "mastering_services"
            referencedColumns: ["id"]
          },
        ]
      }
      mastering_services: {
        Row: {
          created_at: string
          default_settings: Json
          description: string | null
          display_order: number
          features: string[]
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_cents: number
          sale_price_cents: number | null
          service_type: string
          slug: string
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_settings?: Json
          description?: string | null
          display_order?: number
          features?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_cents?: number
          sale_price_cents?: number | null
          service_type?: string
          slug: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_settings?: Json
          description?: string | null
          display_order?: number
          features?: string[]
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_cents?: number
          sale_price_cents?: number | null
          service_type?: string
          slug?: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      music_video_order_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          order_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          order_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "music_video_order_images_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "music_video_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      music_video_orders: {
        Row: {
          base_price: number
          created_at: string
          customer_email: string
          customer_name: string
          final_video_url: string | null
          id: string
          notification_sent: boolean | null
          progress_note: string | null
          progress_percent: number | null
          song_url: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_price: number
          updated_at: string
          upgrades: Json | null
          user_id: string | null
          video_quality: string
          video_style: string
          vision_description: string
        }
        Insert: {
          base_price: number
          created_at?: string
          customer_email: string
          customer_name: string
          final_video_url?: string | null
          id?: string
          notification_sent?: boolean | null
          progress_note?: string | null
          progress_percent?: number | null
          song_url: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_price: number
          updated_at?: string
          upgrades?: Json | null
          user_id?: string | null
          video_quality: string
          video_style: string
          vision_description: string
        }
        Update: {
          base_price?: number
          created_at?: string
          customer_email?: string
          customer_name?: string
          final_video_url?: string | null
          id?: string
          notification_sent?: boolean | null
          progress_note?: string | null
          progress_percent?: number | null
          song_url?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_price?: number
          updated_at?: string
          upgrades?: Json | null
          user_id?: string | null
          video_quality?: string
          video_style?: string
          vision_description?: string
        }
        Relationships: []
      }
      music_video_settings: {
        Row: {
          available_upgrades: Json | null
          created_at: string
          demo_full_video_url: string | null
          demo_reels_url: string | null
          full_video_price: number
          headline: string | null
          id: string
          reels_price: number
          subheadline: string | null
          updated_at: string
          upgrade_1080p_price: number
          upgrade_720p_price: number
        }
        Insert: {
          available_upgrades?: Json | null
          created_at?: string
          demo_full_video_url?: string | null
          demo_reels_url?: string | null
          full_video_price?: number
          headline?: string | null
          id?: string
          reels_price?: number
          subheadline?: string | null
          updated_at?: string
          upgrade_1080p_price?: number
          upgrade_720p_price?: number
        }
        Update: {
          available_upgrades?: Json | null
          created_at?: string
          demo_full_video_url?: string | null
          demo_reels_url?: string | null
          full_video_price?: number
          headline?: string | null
          id?: string
          reels_price?: number
          subheadline?: string | null
          updated_at?: string
          upgrade_1080p_price?: number
          upgrade_720p_price?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          beat_id: string | null
          created_at: string
          id: string
          license_tier: string | null
          product_id: string | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          beat_id?: string | null
          created_at?: string
          id?: string
          license_tier?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          beat_id?: string | null
          created_at?: string
          id?: string
          license_tier?: string | null
          product_id?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      page_seo_settings: {
        Row: {
          created_at: string
          id: string
          image_prompt: string | null
          og_image: string | null
          page_name: string
          path: string
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_prompt?: string | null
          og_image?: string | null
          page_name: string
          path: string
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_prompt?: string | null
          og_image?: string | null
          page_name?: string
          path?: string
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partner_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      product_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_files_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[]
          name: string
          price: number
          slug: string | null
          stripe_price_id: string | null
          updated_at: string
          youtube_video_id: string | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          name: string
          price: number
          slug?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          youtube_video_id?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          name?: string
          price?: number
          slug?: string | null
          stripe_price_id?: string | null
          updated_at?: string
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          beat_id: string | null
          created_at: string
          duration_ms: number | null
          id: string
          is_hidden: boolean
          is_public: boolean
          lyrics_id: string | null
          mix_settings: Json
          storage_path: string
          title: string
          user_id: string
        }
        Insert: {
          beat_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          is_hidden?: boolean
          is_public?: boolean
          lyrics_id?: string | null
          mix_settings?: Json
          storage_path: string
          title?: string
          user_id?: string
        }
        Update: {
          beat_id?: string | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          is_hidden?: boolean
          is_public?: boolean
          lyrics_id?: string | null
          mix_settings?: Json
          storage_path?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_beat_id_fkey"
            columns: ["beat_id"]
            isOneToOne: false
            referencedRelation: "beats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_lyrics_id_fkey"
            columns: ["lyrics_id"]
            isOneToOne: false
            referencedRelation: "lyrics"
            referencedColumns: ["id"]
          },
        ]
      }
      sender_domains: {
        Row: {
          created_at: string
          email: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_orders: {
        Row: {
          additional_data: Json | null
          created_at: string
          customer_email: string
          customer_name: string
          file_urls: Json | null
          final_delivery_url: string | null
          id: string
          notification_sent: boolean | null
          price: number
          progress_note: string | null
          progress_percent: number | null
          project_notes: string | null
          service_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_data?: Json | null
          created_at?: string
          customer_email: string
          customer_name: string
          file_urls?: Json | null
          final_delivery_url?: string | null
          id?: string
          notification_sent?: boolean | null
          price: number
          progress_note?: string | null
          progress_percent?: number | null
          project_notes?: string | null
          service_type: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_data?: Json | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          file_urls?: Json | null
          final_delivery_url?: string | null
          id?: string
          notification_sent?: boolean | null
          price?: number
          progress_note?: string | null
          progress_percent?: number | null
          project_notes?: string | null
          service_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
          youtube_video_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      youtube_genres: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      youtube_oauth_tokens: {
        Row: {
          access_token: string
          channel_id: string | null
          channel_title: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          channel_id?: string | null
          channel_title?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          channel_id?: string | null
          channel_title?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      youtube_type_artists: {
        Row: {
          artist_name: string
          created_at: string
          display_order: number
          genre: string
          id: string
        }
        Insert: {
          artist_name: string
          created_at?: string
          display_order?: number
          genre: string
          id?: string
        }
        Update: {
          artist_name?: string
          created_at?: string
          display_order?: number
          genre?: string
          id?: string
        }
        Relationships: []
      }
      youtube_uploads: {
        Row: {
          beat_name: string
          bpm: number | null
          created_at: string
          description: string | null
          error_message: string | null
          genre: string | null
          id: string
          music_key: string | null
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          type_artist: string | null
          updated_at: string
          user_id: string
          youtube_url: string | null
          youtube_video_id: string | null
        }
        Insert: {
          beat_name: string
          bpm?: number | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          genre?: string | null
          id?: string
          music_key?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          type_artist?: string | null
          updated_at?: string
          user_id: string
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Update: {
          beat_name?: string
          bpm?: number | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          genre?: string | null
          id?: string
          music_key?: string | null
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          type_artist?: string | null
          updated_at?: string
          user_id?: string
          youtube_url?: string | null
          youtube_video_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      order_status: "pending" | "completed" | "failed" | "refunded"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      order_status: ["pending", "completed", "failed", "refunded"],
    },
  },
} as const
