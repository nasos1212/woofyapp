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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      adoption_inquiries: {
        Row: {
          created_at: string
          id: string
          inquirer_email: string
          inquirer_name: string
          inquirer_phone: string | null
          message: string
          pet_id: string
          shelter_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquirer_email: string
          inquirer_name: string
          inquirer_phone?: string | null
          message: string
          pet_id: string
          shelter_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inquirer_email?: string
          inquirer_name?: string
          inquirer_phone?: string | null
          message?: string
          pet_id?: string
          shelter_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adoption_inquiries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "shelter_adoptable_pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adoption_inquiries_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_sessions: {
        Row: {
          created_at: string
          id: string
          pet_breed: string | null
          pet_name: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_breed?: string | null
          pet_name?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_breed?: string | null
          pet_name?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_proactive_alerts: {
        Row: {
          alert_type: string
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_dismissed: boolean
          is_read: boolean
          message: string
          priority: string
          title: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message: string
          priority?: string
          title: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean
          is_read?: boolean
          message?: string
          priority?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      business_birthday_settings: {
        Row: {
          business_id: string
          created_at: string
          custom_message: string | null
          days_before_reminder: number
          enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          custom_message?: string | null
          days_before_reminder?: number
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          custom_message?: string | null
          days_before_reminder?: number
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_birthday_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_birthday_settings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_hours: {
        Row: {
          business_id: string
          close_time: string | null
          created_at: string
          day_of_week: number
          id: string
          is_closed: boolean
          open_time: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          close_time?: string | null
          created_at?: string
          day_of_week: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          close_time?: string | null
          created_at?: string
          day_of_week?: number
          id?: string
          is_closed?: boolean
          open_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_hours_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_locations: {
        Row: {
          address: string | null
          business_id: string
          city: string
          created_at: string
          display_order: number | null
          google_maps_url: string | null
          id: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          business_id: string
          city: string
          created_at?: string
          display_order?: number | null
          google_maps_url?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          business_id?: string
          city?: string
          created_at?: string
          display_order?: number | null
          google_maps_url?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_photos: {
        Row: {
          business_id: string
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          photo_url: string
        }
        Insert: {
          business_id: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url: string
        }
        Update: {
          business_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_photos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_photos_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      business_reviews: {
        Row: {
          business_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          business_name: string
          category: Database["public"]["Enums"]["business_category"]
          city: string | null
          created_at: string
          description: string | null
          email: string
          google_maps_url: string | null
          id: string
          logo_url: string | null
          phone: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category: Database["public"]["Enums"]["business_category"]
          city?: string | null
          created_at?: string
          description?: string | null
          email: string
          google_maps_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: Database["public"]["Enums"]["business_category"]
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string
          google_maps_url?: string | null
          id?: string
          logo_url?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      community_answer_photos: {
        Row: {
          answer_id: string
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          photo_url: string
        }
        Insert: {
          answer_id: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url: string
        }
        Update: {
          answer_id?: string
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_answer_photos_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "community_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      community_answers: {
        Row: {
          content: string
          created_at: string
          downvotes: number | null
          id: string
          is_accepted: boolean | null
          is_verified_pro: boolean | null
          question_id: string
          updated_at: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          is_verified_pro?: boolean | null
          question_id: string
          updated_at?: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          downvotes?: number | null
          id?: string
          is_accepted?: boolean | null
          is_verified_pro?: boolean | null
          question_id?: string
          updated_at?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_expert_stats: {
        Row: {
          accepted_answers: number | null
          expertise_areas: string[] | null
          id: string
          is_verified_professional: boolean | null
          professional_credentials: string | null
          professional_title: string | null
          reputation_score: number | null
          total_answers: number | null
          total_upvotes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_answers?: number | null
          expertise_areas?: string[] | null
          id?: string
          is_verified_professional?: boolean | null
          professional_credentials?: string | null
          professional_title?: string | null
          reputation_score?: number | null
          total_answers?: number | null
          total_upvotes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_answers?: number | null
          expertise_areas?: string[] | null
          id?: string
          is_verified_professional?: boolean | null
          professional_credentials?: string | null
          professional_title?: string | null
          reputation_score?: number | null
          total_answers?: number | null
          total_upvotes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_helped: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_helped_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_question_followers: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_question_followers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_question_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          photo_url: string
          question_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url: string
          question_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_question_photos_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_questions: {
        Row: {
          animal_type: string | null
          breed_tags: string[] | null
          category_id: string
          content: string
          created_at: string
          helped_count: number | null
          id: string
          is_featured: boolean | null
          is_pinned: boolean | null
          pet_id: string | null
          status: string
          title: string
          updated_at: string
          urgency: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          animal_type?: string | null
          breed_tags?: string[] | null
          category_id: string
          content: string
          created_at?: string
          helped_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          pet_id?: string | null
          status?: string
          title: string
          updated_at?: string
          urgency?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          animal_type?: string | null
          breed_tags?: string[] | null
          category_id?: string
          content?: string
          created_at?: string
          helped_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_pinned?: boolean | null
          pet_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_questions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "community_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_questions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      community_saved_questions: {
        Row: {
          created_at: string
          id: string
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_saved_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "community_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_votes: {
        Row: {
          answer_id: string
          created_at: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          answer_id: string
          created_at?: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          answer_id?: string
          created_at?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "community_answers"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_offers: {
        Row: {
          created_at: string
          id: string
          offer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          offer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          offer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorite_offers_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pet_alert_photos: {
        Row: {
          alert_id: string
          created_at: string
          display_order: number | null
          id: string
          photo_position: number | null
          photo_url: string
        }
        Insert: {
          alert_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          photo_position?: number | null
          photo_url: string
        }
        Update: {
          alert_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          photo_position?: number | null
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_alert_photos_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "lost_pet_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pet_alert_photos_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "lost_pet_alerts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pet_alerts: {
        Row: {
          additional_info: string | null
          alert_type: string
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          last_seen_date: string
          last_seen_latitude: number | null
          last_seen_location: string
          last_seen_longitude: number | null
          owner_user_id: string
          pet_breed: string | null
          pet_description: string
          pet_id: string | null
          pet_name: string
          pet_photo_url: string | null
          pet_type: string | null
          resolved_at: string | null
          reward_offered: string | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_info?: string | null
          alert_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_seen_date: string
          last_seen_latitude?: number | null
          last_seen_location: string
          last_seen_longitude?: number | null
          owner_user_id: string
          pet_breed?: string | null
          pet_description: string
          pet_id?: string | null
          pet_name: string
          pet_photo_url?: string | null
          pet_type?: string | null
          resolved_at?: string | null
          reward_offered?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_info?: string | null
          alert_type?: string
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          last_seen_date?: string
          last_seen_latitude?: number | null
          last_seen_location?: string
          last_seen_longitude?: number | null
          owner_user_id?: string
          pet_breed?: string | null
          pet_description?: string
          pet_id?: string | null
          pet_name?: string
          pet_photo_url?: string | null
          pet_type?: string | null
          resolved_at?: string | null
          reward_offered?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_alerts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pet_notification_preferences: {
        Row: {
          cities: string[]
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cities?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cities?: string[]
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lost_pet_sightings: {
        Row: {
          alert_id: string
          created_at: string
          description: string | null
          id: string
          photo_url: string | null
          reporter_user_id: string
          sighting_date: string
          sighting_latitude: number | null
          sighting_location: string
          sighting_longitude: number | null
        }
        Insert: {
          alert_id: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string | null
          reporter_user_id: string
          sighting_date: string
          sighting_latitude?: number | null
          sighting_location: string
          sighting_longitude?: number | null
        }
        Update: {
          alert_id?: string
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string | null
          reporter_user_id?: string
          sighting_date?: string
          sighting_latitude?: number | null
          sighting_location?: string
          sighting_longitude?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_sightings_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "lost_pet_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pet_sightings_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "lost_pet_alerts_public"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_expiry_notifications: {
        Row: {
          days_until_expiry: number
          id: string
          membership_id: string
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          days_until_expiry: number
          id?: string
          membership_id: string
          notification_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          days_until_expiry?: number
          id?: string
          membership_id?: string
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_expiry_notifications_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_shares: {
        Row: {
          id: string
          joined_at: string
          membership_id: string
          shared_with_user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          membership_id: string
          shared_with_user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          membership_id?: string
          shared_with_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_shares_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          max_pets: number
          member_number: string
          pet_breed: string | null
          pet_name: string | null
          plan_type: string
          share_code: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          max_pets?: number
          member_number: string
          pet_breed?: string | null
          pet_name?: string | null
          plan_type?: string
          share_code?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          max_pets?: number
          member_number?: string
          pet_breed?: string | null
          pet_name?: string | null
          plan_type?: string
          share_code?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offer_redemptions: {
        Row: {
          business_id: string
          id: string
          member_name: string | null
          member_number: string | null
          membership_id: string
          offer_id: string
          pet_id: string | null
          pet_names: string | null
          redeemed_at: string
          redeemed_by_user_id: string
        }
        Insert: {
          business_id: string
          id?: string
          member_name?: string | null
          member_number?: string | null
          membership_id: string
          offer_id: string
          pet_id?: string | null
          pet_names?: string | null
          redeemed_at?: string
          redeemed_by_user_id: string
        }
        Update: {
          business_id?: string
          id?: string
          member_name?: string | null
          member_number?: string | null
          membership_id?: string
          offer_id?: string
          pet_id?: string | null
          pet_names?: string | null
          redeemed_at?: string
          redeemed_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offer_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offer_redemptions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number | null
          id: string
          is_active: boolean
          is_limited_time: boolean | null
          limited_time_label: string | null
          max_redemptions: number | null
          offer_type: string
          pet_type: string | null
          redemption_frequency: string | null
          redemption_scope: string | null
          terms: string | null
          title: string
          updated_at: string
          valid_days: number[] | null
          valid_from: string | null
          valid_hours_end: string | null
          valid_hours_start: string | null
          valid_until: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value?: number | null
          id?: string
          is_active?: boolean
          is_limited_time?: boolean | null
          limited_time_label?: string | null
          max_redemptions?: number | null
          offer_type?: string
          pet_type?: string | null
          redemption_frequency?: string | null
          redemption_scope?: string | null
          terms?: string | null
          title: string
          updated_at?: string
          valid_days?: number[] | null
          valid_from?: string | null
          valid_hours_end?: string | null
          valid_hours_start?: string | null
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          id?: string
          is_active?: boolean
          is_limited_time?: boolean | null
          limited_time_label?: string | null
          max_redemptions?: number | null
          offer_type?: string
          pet_type?: string | null
          redemption_frequency?: string | null
          redemption_scope?: string | null
          terms?: string | null
          title?: string
          updated_at?: string
          valid_days?: number[] | null
          valid_from?: string | null
          valid_hours_end?: string | null
          valid_hours_start?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_friendly_places: {
        Row: {
          added_by_user_id: string | null
          address: string | null
          business_id: string | null
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_24_hour: boolean | null
          is_emergency: boolean | null
          latitude: number
          longitude: number
          name: string
          phone: string | null
          place_type: string
          rating: number | null
          updated_at: string
          verified: boolean | null
          website: string | null
        }
        Insert: {
          added_by_user_id?: string | null
          address?: string | null
          business_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_24_hour?: boolean | null
          is_emergency?: boolean | null
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          place_type: string
          rating?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          added_by_user_id?: string | null
          address?: string | null
          business_id?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_24_hour?: boolean | null
          is_emergency?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          place_type?: string
          rating?: number | null
          updated_at?: string
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_friendly_places_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_friendly_places_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_health_records: {
        Row: {
          clinic_name: string | null
          created_at: string
          date_administered: string | null
          description: string | null
          document_url: string | null
          id: string
          next_due_date: string | null
          notes: string | null
          owner_user_id: string
          pet_id: string
          preferred_time: string | null
          record_type: string
          reminder_interval_days: number | null
          reminder_interval_type: string | null
          title: string
          updated_at: string
          veterinarian_name: string | null
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string
          date_administered?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          owner_user_id: string
          pet_id: string
          preferred_time?: string | null
          record_type: string
          reminder_interval_days?: number | null
          reminder_interval_type?: string | null
          title: string
          updated_at?: string
          veterinarian_name?: string | null
        }
        Update: {
          clinic_name?: string | null
          created_at?: string
          date_administered?: string | null
          description?: string | null
          document_url?: string | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          owner_user_id?: string
          pet_id?: string
          preferred_time?: string | null
          record_type?: string
          reminder_interval_days?: number | null
          reminder_interval_type?: string | null
          title?: string
          updated_at?: string
          veterinarian_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pet_health_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          age_years: number | null
          birthday: string | null
          birthday_locked: boolean | null
          created_at: string
          gender: string | null
          id: string
          membership_id: string
          notes: string | null
          owner_user_id: string
          pet_breed: string | null
          pet_name: string
          pet_type: string
          photo_url: string | null
        }
        Insert: {
          age_years?: number | null
          birthday?: string | null
          birthday_locked?: boolean | null
          created_at?: string
          gender?: string | null
          id?: string
          membership_id: string
          notes?: string | null
          owner_user_id: string
          pet_breed?: string | null
          pet_name: string
          pet_type?: string
          photo_url?: string | null
        }
        Update: {
          age_years?: number | null
          birthday?: string | null
          birthday_locked?: boolean | null
          created_at?: string
          gender?: string | null
          id?: string
          membership_id?: string
          notes?: string | null
          owner_user_id?: string
          pet_breed?: string | null
          pet_name?: string
          pet_type?: string
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          login_count: number | null
          phone: string | null
          preferred_city: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          login_count?: number | null
          phone?: string | null
          preferred_city?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          login_count?: number | null
          phone?: string | null
          preferred_city?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string
          description: string | null
          discount_type: string
          discount_value: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          discount_type: string
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          discount_type?: string
          discount_value?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      promo_memberships: {
        Row: {
          expires_at: string
          granted_at: string
          granted_by: string
          id: string
          membership_id: string | null
          notes: string | null
          promo_code_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          expires_at: string
          granted_at?: string
          granted_by: string
          id?: string
          membership_id?: string | null
          notes?: string | null
          promo_code_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          expires_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          membership_id?: string | null
          notes?: string | null
          promo_code_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_memberships_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_memberships_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_prompts: {
        Row: {
          business_id: string
          created_at: string
          dismissed: boolean
          id: string
          prompt_after: string
          prompted_at: string | null
          redemption_id: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          dismissed?: boolean
          id?: string
          prompt_after: string
          prompted_at?: string | null
          redemption_id: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          dismissed?: boolean
          id?: string
          prompt_after?: string
          prompted_at?: string | null
          redemption_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_prompts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_prompts_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: true
            referencedRelation: "offer_redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          reward_given_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_user_id: string
          referrer_user_id: string
          reward_given_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_user_id?: string
          referrer_user_id?: string
          reward_given_at?: string | null
          status?: string
        }
        Relationships: []
      }
      sent_birthday_offers: {
        Row: {
          business_id: string
          discount_type: string
          discount_value: number
          id: string
          message: string
          owner_name: string | null
          owner_user_id: string
          pet_id: string
          pet_name: string
          sent_at: string
        }
        Insert: {
          business_id: string
          discount_type?: string
          discount_value: number
          id?: string
          message: string
          owner_name?: string | null
          owner_user_id: string
          pet_id: string
          pet_name: string
          sent_at?: string
        }
        Update: {
          business_id?: string
          discount_type?: string
          discount_value?: number
          id?: string
          message?: string
          owner_name?: string | null
          owner_user_id?: string
          pet_id?: string
          pet_name?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_birthday_offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_birthday_offers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sent_birthday_offers_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_adoptable_pet_photos: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          pet_id: string
          photo_url: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          pet_id: string
          photo_url: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          pet_id?: string
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelter_adoptable_pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "shelter_adoptable_pets"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_adoptable_pets: {
        Row: {
          age: string | null
          breed: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          is_available: boolean
          name: string
          pet_type: string
          photo_url: string | null
          shelter_id: string
          updated_at: string
        }
        Insert: {
          age?: string | null
          breed?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          is_available?: boolean
          name: string
          pet_type?: string
          photo_url?: string | null
          shelter_id: string
          updated_at?: string
        }
        Update: {
          age?: string | null
          breed?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          is_available?: boolean
          name?: string
          pet_type?: string
          photo_url?: string | null
          shelter_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelter_adoptable_pets_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelter_photos: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          id: string
          photo_url: string
          shelter_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url: string
          shelter_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          id?: string
          photo_url?: string
          shelter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shelter_photos_shelter_id_fkey"
            columns: ["shelter_id"]
            isOneToOne: false
            referencedRelation: "shelters"
            referencedColumns: ["id"]
          },
        ]
      }
      shelters: {
        Row: {
          address: string | null
          city: string | null
          contact_name: string
          cover_photo_position: number | null
          cover_photo_url: string | null
          created_at: string
          description: string | null
          dogs_helped_count: number | null
          dogs_in_care: string | null
          donation_link: string | null
          email: string
          facebook_url: string | null
          id: string
          instagram_url: string | null
          location: string
          logo_url: string | null
          mission_statement: string | null
          phone: string | null
          shelter_name: string
          updated_at: string
          user_id: string | null
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          website: string | null
          years_operating: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_name: string
          cover_photo_position?: number | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          dogs_helped_count?: number | null
          dogs_in_care?: string | null
          donation_link?: string | null
          email: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          location: string
          logo_url?: string | null
          mission_statement?: string | null
          phone?: string | null
          shelter_name: string
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          website?: string | null
          years_operating?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_name?: string
          cover_photo_position?: number | null
          cover_photo_url?: string | null
          created_at?: string
          description?: string | null
          dogs_helped_count?: number | null
          dogs_in_care?: string | null
          donation_link?: string | null
          email?: string
          facebook_url?: string | null
          id?: string
          instagram_url?: string | null
          location?: string
          logo_url?: string | null
          mission_statement?: string | null
          phone?: string | null
          shelter_name?: string
          updated_at?: string
          user_id?: string | null
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          website?: string | null
          years_operating?: string | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_tracking: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          page_path: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          page_path?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          page_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vaccination_reminders: {
        Row: {
          created_at: string
          id: string
          owner_user_id: string
          pet_health_record_id: string
          reminder_date: string
          reminder_sent: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          owner_user_id: string
          pet_health_record_id: string
          reminder_date: string
          reminder_sent?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          owner_user_id?: string
          pet_health_record_id?: string
          reminder_date?: string
          reminder_sent?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "vaccination_reminders_pet_health_record_id_fkey"
            columns: ["pet_health_record_id"]
            isOneToOne: false
            referencedRelation: "pet_health_records"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_attempts: {
        Row: {
          attempted_member_id: string
          business_id: string
          created_at: string
          id: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          attempted_member_id: string
          business_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          attempted_member_id?: string
          business_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "verification_attempts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_attempts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      businesses_public: {
        Row: {
          address: string | null
          business_name: string | null
          category: Database["public"]["Enums"]["business_category"] | null
          city: string | null
          created_at: string | null
          description: string | null
          google_maps_url: string | null
          id: string | null
          logo_url: string | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          category?: Database["public"]["Enums"]["business_category"] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          google_maps_url?: string | null
          id?: string | null
          logo_url?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          category?: Database["public"]["Enums"]["business_category"] | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          google_maps_url?: string | null
          id?: string | null
          logo_url?: string | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      lost_pet_alerts_public: {
        Row: {
          additional_info: string | null
          alert_type: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          id: string | null
          last_seen_date: string | null
          last_seen_latitude: number | null
          last_seen_location: string | null
          last_seen_longitude: number | null
          owner_user_id: string | null
          pet_breed: string | null
          pet_description: string | null
          pet_id: string | null
          pet_name: string | null
          pet_photo_url: string | null
          pet_type: string | null
          resolved_at: string | null
          reward_offered: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          additional_info?: string | null
          alert_type?: string | null
          contact_email?: never
          contact_phone?: never
          created_at?: string | null
          id?: string | null
          last_seen_date?: string | null
          last_seen_latitude?: number | null
          last_seen_location?: string | null
          last_seen_longitude?: number | null
          owner_user_id?: string | null
          pet_breed?: string | null
          pet_description?: string | null
          pet_id?: string | null
          pet_name?: string | null
          pet_photo_url?: string | null
          pet_type?: string | null
          resolved_at?: string | null
          reward_offered?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          additional_info?: string | null
          alert_type?: string | null
          contact_email?: never
          contact_phone?: never
          created_at?: string | null
          id?: string | null
          last_seen_date?: string | null
          last_seen_latitude?: number | null
          last_seen_location?: string | null
          last_seen_longitude?: number | null
          owner_user_id?: string | null
          pet_breed?: string | null
          pet_description?: string | null
          pet_id?: string | null
          pet_name?: string | null
          pet_photo_url?: string | null
          pet_type?: string | null
          resolved_at?: string | null
          reward_offered?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_alerts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_edit_pet_birthday: { Args: { _pet_id: string }; Returns: boolean }
      can_view_lost_pet_contact: {
        Args: { alert_id: string; alert_owner_id: string }
        Returns: boolean
      }
      create_family_invite_notification: {
        Args: { _invitee_user_id: string; _share_code: string }
        Returns: undefined
      }
      generate_member_number: { Args: never; Returns: string }
      generate_member_share_code: {
        Args: { member_name: string }
        Returns: string
      }
      generate_referral_code: { Args: { user_name: string }; Returns: string }
      generate_share_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_membership_owner: {
        Args: { _membership_id: string; _user_id: string }
        Returns: boolean
      }
      is_membership_shared_with: {
        Args: { _membership_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_membership_access: {
        Args: { _membership_id: string; _user_id: string }
        Returns: boolean
      }
      user_owns_membership: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "member" | "business" | "admin" | "shelter"
      business_category:
        | "trainer"
        | "pet_shop"
        | "hotel"
        | "grooming"
        | "vet"
        | "daycare"
        | "food"
        | "accessories"
        | "other"
        | "physio"
      verification_status: "pending" | "approved" | "rejected"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      app_role: ["member", "business", "admin", "shelter"],
      business_category: [
        "trainer",
        "pet_shop",
        "hotel",
        "grooming",
        "vet",
        "daycare",
        "food",
        "accessories",
        "other",
        "physio",
      ],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
