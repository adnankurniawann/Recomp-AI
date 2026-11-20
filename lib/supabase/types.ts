
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "agent_actions": {
                  Row: {
                    "actor_id": string,"agent": Database["public"]['Enums']["agent_t"],"approval": Database["public"]['Enums']["approval_t"],"created_at": string,"duration_ms": number | null,"error": string | null,"id": string,"input": Json | null,"model": string | null,"output": Json | null,"target_id": string | null,"team_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"agent": Database["public"]['Enums']["agent_t"],"approval"?: Database["public"]['Enums']["approval_t"],"created_at"?: string,"duration_ms"?: number | null,"error"?: string | null,"id"?: string,"input"?: Json | null,"model"?: string | null,"output"?: Json | null,"target_id"?: string | null,"team_id"?: string | null
                  }
                  Update: {
                    "actor_id"?: string,"agent"?: Database["public"]['Enums']["agent_t"],"approval"?: Database["public"]['Enums']["approval_t"],"created_at"?: string,"duration_ms"?: number | null,"error"?: string | null,"id"?: string,"input"?: Json | null,"model"?: string | null,"output"?: Json | null,"target_id"?: string | null,"team_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "agent_actions_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "agent_actions_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"attempts": {
                  Row: {
                    "ai_feedback": Json | null,"answer": NonNullable<Json>,"attempt_no": number,"created_at": string,"id": string,"is_correct": boolean | null,"points_awarded": number,"profile_id": string,"question_id": string,"score": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ai_feedback"?: Json | null,"answer": NonNullable<Json>,"attempt_no"?: number,"created_at"?: string,"id"?: string,"is_correct"?: boolean | null,"points_awarded"?: number,"profile_id": string,"question_id": string,"score"?: number | null
                  }
                  Update: {
                    "ai_feedback"?: Json | null,"answer"?: NonNullable<Json>,"attempt_no"?: number,"created_at"?: string,"id"?: string,"is_correct"?: boolean | null,"points_awarded"?: number,"profile_id"?: string,"question_id"?: string,"score"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attempts_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attempts_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attempts_question_id_fkey"
      columns: ["question_id"]
isOneToOne: false
      referencedRelation: "questions_public"
      referencedColumns: ["id"]
    }
                  ]
                },"bookings": {
                  Row: {
                    "booked_by": string,"created_at": string,"id": string,"is_simulated": boolean,"mentor_id": string,"mentor_share": number,"paid_at": string | null,"platform_fee": number,"price": number,"service_id": string,"slot_id": string | null,"status": Database["public"]['Enums']["booking_status_t"],"team_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "booked_by": string,"created_at"?: string,"id"?: string,"is_simulated"?: boolean,"mentor_id": string,"mentor_share": number,"paid_at"?: string | null,"platform_fee": number,"price": number,"service_id": string,"slot_id"?: string | null,"status"?: Database["public"]['Enums']["booking_status_t"],"team_id": string
                  }
                  Update: {
                    "booked_by"?: string,"created_at"?: string,"id"?: string,"is_simulated"?: boolean,"mentor_id"?: string,"mentor_share"?: number,"paid_at"?: string | null,"platform_fee"?: number,"price"?: number,"service_id"?: string,"slot_id"?: string | null,"status"?: Database["public"]['Enums']["booking_status_t"],"team_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_booked_by_fkey"
      columns: ["booked_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "mentors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_service_id_fkey"
      columns: ["service_id"]
isOneToOne: false
      referencedRelation: "mentor_services"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_slot_id_fkey"
      columns: ["slot_id"]
isOneToOne: true
      referencedRelation: "mentor_slots"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"chapters": {
                  Row: {
                    "course_id": string,"id": string,"sort": number,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"id"?: string,"sort": number,"title": string
                  }
                  Update: {
                    "course_id"?: string,"id"?: string,"sort"?: number,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chapters_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"competition_extractions": {
                  Row: {
                    "competition_id": string,"created_at": string,"created_by": string | null,"data": Json | null,"error": string | null,"id": string,"model": string | null,"page_count": number | null,"prompt_version": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"status": Database["public"]['Enums']["extraction_status_t"],"warnings": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "competition_id": string,"created_at"?: string,"created_by"?: string | null,"data"?: Json | null,"error"?: string | null,"id"?: string,"model"?: string | null,"page_count"?: number | null,"prompt_version"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["extraction_status_t"],"warnings"?: (string)[]
                  }
                  Update: {
                    "competition_id"?: string,"created_at"?: string,"created_by"?: string | null,"data"?: Json | null,"error"?: string | null,"id"?: string,"model"?: string | null,"page_count"?: number | null,"prompt_version"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"status"?: Database["public"]['Enums']["extraction_status_t"],"warnings"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "competition_extractions_competition_id_fkey"
      columns: ["competition_id"]
isOneToOne: false
      referencedRelation: "competitions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "competition_extractions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "competition_extractions_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"competition_history": {
                  Row: {
                    "category": Database["public"]['Enums']["comp_category_t"],"competition_name": string,"created_at": string,"evidence_url": string | null,"id": string,"note": string | null,"profile_id": string,"result": Database["public"]['Enums']["comp_result_t"],"role": string | null,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["comp_category_t"],"competition_name": string,"created_at"?: string,"evidence_url"?: string | null,"id"?: string,"note"?: string | null,"profile_id": string,"result"?: Database["public"]['Enums']["comp_result_t"],"role"?: string | null,"year": number
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["comp_category_t"],"competition_name"?: string,"created_at"?: string,"evidence_url"?: string | null,"id"?: string,"note"?: string | null,"profile_id"?: string,"result"?: Database["public"]['Enums']["comp_result_t"],"role"?: string | null,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "competition_history_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"competition_interests": {
                  Row: {
                    "competition_id": string,"created_at": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "competition_id": string,"created_at"?: string,"profile_id": string
                  }
                  Update: {
                    "competition_id"?: string,"created_at"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "competition_interests_competition_id_fkey"
      columns: ["competition_id"]
isOneToOne: false
      referencedRelation: "competitions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "competition_interests_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"competitions": {
                  Row: {
                    "category": Database["public"]['Enums']["comp_category_t"],"created_at": string,"created_by": string | null,"description": string | null,"eligibility": NonNullable<Json>,"event_date": string | null,"guidebook_path": string | null,"id": string,"is_featured": boolean,"is_published": boolean,"is_simulated": boolean,"name": string,"official_url": string | null,"organizer": string,"poster_path": string | null,"registration_deadline": string | null,"slug": string,"team_max": number,"team_min": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["comp_category_t"],"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"eligibility"?: NonNullable<Json>,"event_date"?: string | null,"guidebook_path"?: string | null,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"is_simulated"?: boolean,"name": string,"official_url"?: string | null,"organizer": string,"poster_path"?: string | null,"registration_deadline"?: string | null,"slug": string,"team_max"?: number,"team_min"?: number
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["comp_category_t"],"created_at"?: string,"created_by"?: string | null,"description"?: string | null,"eligibility"?: NonNullable<Json>,"event_date"?: string | null,"guidebook_path"?: string | null,"id"?: string,"is_featured"?: boolean,"is_published"?: boolean,"is_simulated"?: boolean,"name"?: string,"official_url"?: string | null,"organizer"?: string,"poster_path"?: string | null,"registration_deadline"?: string | null,"slug"?: string,"team_max"?: number,"team_min"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "competitions_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"course_access": {
                  Row: {
                    "course_id": string,"created_at": string,"profile_id": string,"source": Database["public"]['Enums']["access_source_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "course_id": string,"created_at"?: string,"profile_id": string,"source": Database["public"]['Enums']["access_source_t"]
                  }
                  Update: {
                    "course_id"?: string,"created_at"?: string,"profile_id"?: string,"source"?: Database["public"]['Enums']["access_source_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "course_access_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "course_access_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"courses": {
                  Row: {
                    "category": Database["public"]['Enums']["comp_category_t"],"cover_path": string | null,"created_at": string,"description": string | null,"est_minutes": number | null,"id": string,"is_published": boolean,"level": string,"price": number,"slug": string,"subtitle": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["comp_category_t"],"cover_path"?: string | null,"created_at"?: string,"description"?: string | null,"est_minutes"?: number | null,"id"?: string,"is_published"?: boolean,"level"?: string,"price"?: number,"slug": string,"subtitle"?: string | null,"title": string
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["comp_category_t"],"cover_path"?: string | null,"created_at"?: string,"description"?: string | null,"est_minutes"?: number | null,"id"?: string,"is_published"?: boolean,"level"?: string,"price"?: number,"slug"?: string,"subtitle"?: string | null,"title"?: string
                  }
                  Relationships: [
                    
                  ]
                },"invites": {
                  Row: {
                    "agent_action_id": string | null,"ai_drafted": boolean,"candidate_id": string,"created_at": string,"created_by": string,"direction": Database["public"]['Enums']["invite_dir_t"],"id": string,"message": string | null,"responded_at": string | null,"status": Database["public"]['Enums']["invite_status_t"],"team_id": string,"team_role_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "agent_action_id"?: string | null,"ai_drafted"?: boolean,"candidate_id": string,"created_at"?: string,"created_by": string,"direction": Database["public"]['Enums']["invite_dir_t"],"id"?: string,"message"?: string | null,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["invite_status_t"],"team_id": string,"team_role_id": string
                  }
                  Update: {
                    "agent_action_id"?: string | null,"ai_drafted"?: boolean,"candidate_id"?: string,"created_at"?: string,"created_by"?: string,"direction"?: Database["public"]['Enums']["invite_dir_t"],"id"?: string,"message"?: string | null,"responded_at"?: string | null,"status"?: Database["public"]['Enums']["invite_status_t"],"team_id"?: string,"team_role_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "invites_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "invites_team_role_id_fkey"
      columns: ["team_role_id"]
isOneToOne: false
      referencedRelation: "team_roles"
      referencedColumns: ["id"]
    }
                  ]
                },"lesson_progress": {
                  Row: {
                    "completed_at": string,"lesson_id": string,"profile_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "completed_at"?: string,"lesson_id": string,"profile_id": string
                  }
                  Update: {
                    "completed_at"?: string,"lesson_id"?: string,"profile_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lesson_progress_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "lesson_progress_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"lessons": {
                  Row: {
                    "chapter_id": string,"content_md": string,"est_minutes": number | null,"id": string,"is_free_preview": boolean,"slug": string,"sort": number,"title": string,"video_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "chapter_id": string,"content_md": string,"est_minutes"?: number | null,"id"?: string,"is_free_preview"?: boolean,"slug": string,"sort": number,"title": string,"video_url"?: string | null
                  }
                  Update: {
                    "chapter_id"?: string,"content_md"?: string,"est_minutes"?: number | null,"id"?: string,"is_free_preview"?: boolean,"slug"?: string,"sort"?: number,"title"?: string,"video_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "lessons_chapter_id_fkey"
      columns: ["chapter_id"]
isOneToOne: false
      referencedRelation: "chapters"
      referencedColumns: ["id"]
    }
                  ]
                },"matching_config": {
                  Row: {
                    "active": boolean,"created_at": string,"experience_cap": number,"id": number,"no_evidence_factor": number,"optional_bonus": number,"podium_bonus": number,"weights": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"experience_cap"?: number,"id"?: number,"no_evidence_factor"?: number,"optional_bonus"?: number,"podium_bonus"?: number,"weights"?: NonNullable<Json>
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"experience_cap"?: number,"id"?: number,"no_evidence_factor"?: number,"optional_bonus"?: number,"podium_bonus"?: number,"weights"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"mentor_contacts": {
                  Row: {
                    "contact_email": string | null,"mentor_id": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string | null,"mentor_id": string,"whatsapp"?: string | null
                  }
                  Update: {
                    "contact_email"?: string | null,"mentor_id"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentor_contacts_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: true
      referencedRelation: "mentors"
      referencedColumns: ["id"]
    }
                  ]
                },"mentor_services": {
                  Row: {
                    "description": string | null,"duration_min": number,"id": string,"mentor_id": string,"name": string,"price": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description"?: string | null,"duration_min": number,"id"?: string,"mentor_id": string,"name": string,"price": number
                  }
                  Update: {
                    "description"?: string | null,"duration_min"?: number,"id"?: string,"mentor_id"?: string,"name"?: string,"price"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentor_services_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "mentors"
      referencedColumns: ["id"]
    }
                  ]
                },"mentor_slots": {
                  Row: {
                    "id": string,"is_booked": boolean,"mentor_id": string,"starts_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id"?: string,"is_booked"?: boolean,"mentor_id": string,"starts_at": string
                  }
                  Update: {
                    "id"?: string,"is_booked"?: boolean,"mentor_id"?: string,"starts_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentor_slots_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "mentors"
      referencedColumns: ["id"]
    }
                  ]
                },"mentors": {
                  Row: {
                    "achievements": NonNullable<Json>,"bio": string | null,"competition_categories": (Database["public"]['Enums']["comp_category_t"])[],"created_at": string,"display_name": string,"headline": string,"id": string,"is_active": boolean,"is_simulated": boolean,"photo_path": string | null,"profile_id": string | null,"roles": (string)[],"verified": boolean
                  }
                  ComputedFields: never
                  Insert: {
                    "achievements"?: NonNullable<Json>,"bio"?: string | null,"competition_categories"?: (Database["public"]['Enums']["comp_category_t"])[],"created_at"?: string,"display_name": string,"headline": string,"id"?: string,"is_active"?: boolean,"is_simulated"?: boolean,"photo_path"?: string | null,"profile_id"?: string | null,"roles": (string)[],"verified"?: boolean
                  }
                  Update: {
                    "achievements"?: NonNullable<Json>,"bio"?: string | null,"competition_categories"?: (Database["public"]['Enums']["comp_category_t"])[],"created_at"?: string,"display_name"?: string,"headline"?: string,"id"?: string,"is_active"?: boolean,"is_simulated"?: boolean,"photo_path"?: string | null,"profile_id"?: string | null,"roles"?: (string)[],"verified"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentors_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "created_at": string,"id": string,"payload": NonNullable<Json>,"profile_id": string,"read_at": string | null,"type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"payload"?: NonNullable<Json>,"profile_id": string,"read_at"?: string | null,"type": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"payload"?: NonNullable<Json>,"profile_id"?: string,"read_at"?: string | null,"type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"portfolio_items": {
                  Row: {
                    "cover_path": string | null,"created_at": string,"description": string | null,"id": string,"profile_id": string,"skill_ids": (number)[],"sort": number,"title": string,"url": string
                  }
                  ComputedFields: never
                  Insert: {
                    "cover_path"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"profile_id": string,"skill_ids"?: (number)[],"sort"?: number,"title": string,"url": string
                  }
                  Update: {
                    "cover_path"?: string | null,"created_at"?: string,"description"?: string | null,"id"?: string,"profile_id"?: string,"skill_ids"?: (number)[],"sort"?: number,"title"?: string,"url"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "portfolio_items_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_contacts": {
                  Row: {
                    "contact_email": string | null,"profile_id": string,"whatsapp": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_email"?: string | null,"profile_id": string,"whatsapp"?: string | null
                  }
                  Update: {
                    "contact_email"?: string | null,"profile_id"?: string,"whatsapp"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_contacts_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profile_skills": {
                  Row: {
                    "evidence_url": string | null,"level": number,"profile_id": string,"skill_id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "evidence_url"?: string | null,"level": number,"profile_id": string,"skill_id": number
                  }
                  Update: {
                    "evidence_url"?: string | null,"level"?: number,"profile_id"?: string,"skill_id"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_skills_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_skills_skill_id_fkey"
      columns: ["skill_id"]
isOneToOne: false
      referencedRelation: "skills"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "app_role": Database["public"]['Enums']["app_role_t"],"avatar_url": string | null,"bio": string | null,"campus": string | null,"created_at": string,"entry_year": number | null,"full_name": string,"goal": Database["public"]['Enums']["goal_t"],"hours_per_week": number,"id": string,"is_simulated": boolean,"major": string | null,"onboarding_done": boolean,"open_to_invite": boolean,"preferred_roles": (string)[],"updated_at": string,"user_id": string | null,"username": string | null,"work_time": Database["public"]['Enums']["work_time_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "app_role"?: Database["public"]['Enums']["app_role_t"],"avatar_url"?: string | null,"bio"?: string | null,"campus"?: string | null,"created_at"?: string,"entry_year"?: number | null,"full_name"?: string,"goal"?: Database["public"]['Enums']["goal_t"],"hours_per_week"?: number,"id"?: string,"is_simulated"?: boolean,"major"?: string | null,"onboarding_done"?: boolean,"open_to_invite"?: boolean,"preferred_roles"?: (string)[],"updated_at"?: string,"user_id"?: string | null,"username"?: string | null,"work_time"?: Database["public"]['Enums']["work_time_t"]
                  }
                  Update: {
                    "app_role"?: Database["public"]['Enums']["app_role_t"],"avatar_url"?: string | null,"bio"?: string | null,"campus"?: string | null,"created_at"?: string,"entry_year"?: number | null,"full_name"?: string,"goal"?: Database["public"]['Enums']["goal_t"],"hours_per_week"?: number,"id"?: string,"is_simulated"?: boolean,"major"?: string | null,"onboarding_done"?: boolean,"open_to_invite"?: boolean,"preferred_roles"?: (string)[],"updated_at"?: string,"user_id"?: string | null,"username"?: string | null,"work_time"?: Database["public"]['Enums']["work_time_t"]
                  }
                  Relationships: [
                    
                  ]
                },"promo_codes": {
                  Row: {
                    "code": string,"course_id": string | null,"discount_percent": number,"expires_at": string | null,"quota": number,"used": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"course_id"?: string | null,"discount_percent": number,"expires_at"?: string | null,"quota": number,"used"?: number
                  }
                  Update: {
                    "code"?: string,"course_id"?: string | null,"discount_percent"?: number,"expires_at"?: string | null,"quota"?: number,"used"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "promo_codes_course_id_fkey"
      columns: ["course_id"]
isOneToOne: false
      referencedRelation: "courses"
      referencedColumns: ["id"]
    }
                  ]
                },"questions": {
                  Row: {
                    "answer_key": string | null,"explanation_md": string | null,"id": string,"lesson_id": string,"options": Json | null,"points": number,"prompt_md": string,"rubric": Json | null,"sort": number,"type": Database["public"]['Enums']["question_type_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "answer_key"?: string | null,"explanation_md"?: string | null,"id"?: string,"lesson_id": string,"options"?: Json | null,"points"?: number,"prompt_md": string,"rubric"?: Json | null,"sort": number,"type": Database["public"]['Enums']["question_type_t"]
                  }
                  Update: {
                    "answer_key"?: string | null,"explanation_md"?: string | null,"id"?: string,"lesson_id"?: string,"options"?: Json | null,"points"?: number,"prompt_md"?: string,"rubric"?: Json | null,"sort"?: number,"type"?: Database["public"]['Enums']["question_type_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "questions_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                },"recommendation_feedback": {
                  Row: {
                    "candidate_id": string,"created_at": string,"created_by": string,"factors": NonNullable<Json>,"feedback": Database["public"]['Enums']["feedback_t"],"score": number,"team_role_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "candidate_id": string,"created_at"?: string,"created_by": string,"factors": NonNullable<Json>,"feedback": Database["public"]['Enums']["feedback_t"],"score": number,"team_role_id": string
                  }
                  Update: {
                    "candidate_id"?: string,"created_at"?: string,"created_by"?: string,"factors"?: NonNullable<Json>,"feedback"?: Database["public"]['Enums']["feedback_t"],"score"?: number,"team_role_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "recommendation_feedback_candidate_id_fkey"
      columns: ["candidate_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendation_feedback_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "recommendation_feedback_team_role_id_fkey"
      columns: ["team_role_id"]
isOneToOne: false
      referencedRelation: "team_roles"
      referencedColumns: ["id"]
    }
                  ]
                },"role_templates": {
                  Row: {
                    "category": Database["public"]['Enums']["comp_category_t"],"color_key": string,"description": string | null,"hours_per_week": number,"id": number,"name": string,"optional_skill_ids": (number)[],"required_skills": NonNullable<Json>,"slots": number,"sort": number
                  }
                  ComputedFields: never
                  Insert: {
                    "category": Database["public"]['Enums']["comp_category_t"],"color_key"?: string,"description"?: string | null,"hours_per_week": number,"id"?: number,"name": string,"optional_skill_ids"?: (number)[],"required_skills": NonNullable<Json>,"slots"?: number,"sort"?: number
                  }
                  Update: {
                    "category"?: Database["public"]['Enums']["comp_category_t"],"color_key"?: string,"description"?: string | null,"hours_per_week"?: number,"id"?: number,"name"?: string,"optional_skill_ids"?: (number)[],"required_skills"?: NonNullable<Json>,"slots"?: number,"sort"?: number
                  }
                  Relationships: [
                    
                  ]
                },"skills": {
                  Row: {
                    "aliases": (string)[],"category": string,"id": number,"name": string,"slug": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aliases"?: (string)[],"category": string,"id"?: number,"name": string,"slug": string
                  }
                  Update: {
                    "aliases"?: (string)[],"category"?: string,"id"?: number,"name"?: string,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"team_members": {
                  Row: {
                    "competition_id": string,"is_leader": boolean,"joined_at": string,"profile_id": string,"team_id": string,"team_role_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "competition_id": string,"is_leader"?: boolean,"joined_at"?: string,"profile_id": string,"team_id": string,"team_role_id"?: string | null
                  }
                  Update: {
                    "competition_id"?: string,"is_leader"?: boolean,"joined_at"?: string,"profile_id"?: string,"team_id"?: string,"team_role_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_competition_id_fkey"
      columns: ["competition_id"]
isOneToOne: false
      referencedRelation: "competitions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "team_members_team_role_id_fkey"
      columns: ["team_role_id"]
isOneToOne: false
      referencedRelation: "team_roles"
      referencedColumns: ["id"]
    }
                  ]
                },"team_roles": {
                  Row: {
                    "color_key": string,"created_at": string,"description": string | null,"edited": boolean,"hours_per_week": number,"id": string,"name": string,"optional_skill_ids": (number)[],"required_skills": NonNullable<Json>,"slots": number,"sort": number,"source": Database["public"]['Enums']["role_source_t"],"source_criterion": string | null,"source_page": number | null,"team_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color_key"?: string,"created_at"?: string,"description"?: string | null,"edited"?: boolean,"hours_per_week": number,"id"?: string,"name": string,"optional_skill_ids"?: (number)[],"required_skills": NonNullable<Json>,"slots"?: number,"sort"?: number,"source": Database["public"]['Enums']["role_source_t"],"source_criterion"?: string | null,"source_page"?: number | null,"team_id": string
                  }
                  Update: {
                    "color_key"?: string,"created_at"?: string,"description"?: string | null,"edited"?: boolean,"hours_per_week"?: number,"id"?: string,"name"?: string,"optional_skill_ids"?: (number)[],"required_skills"?: NonNullable<Json>,"slots"?: number,"sort"?: number,"source"?: Database["public"]['Enums']["role_source_t"],"source_criterion"?: string | null,"source_page"?: number | null,"team_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_roles_team_id_fkey"
      columns: ["team_id"]
isOneToOne: false
      referencedRelation: "teams"
      referencedColumns: ["id"]
    }
                  ]
                },"teams": {
                  Row: {
                    "competition_id": string,"created_at": string,"extraction_id": string | null,"goal": Database["public"]['Enums']["goal_t"],"id": string,"leader_id": string,"name": string,"status": Database["public"]['Enums']["team_status_t"],"updated_at": string,"work_time": Database["public"]['Enums']["work_time_t"]
                  }
                  ComputedFields: never
                  Insert: {
                    "competition_id": string,"created_at"?: string,"extraction_id"?: string | null,"goal": Database["public"]['Enums']["goal_t"],"id"?: string,"leader_id": string,"name": string,"status"?: Database["public"]['Enums']["team_status_t"],"updated_at"?: string,"work_time": Database["public"]['Enums']["work_time_t"]
                  }
                  Update: {
                    "competition_id"?: string,"created_at"?: string,"extraction_id"?: string | null,"goal"?: Database["public"]['Enums']["goal_t"],"id"?: string,"leader_id"?: string,"name"?: string,"status"?: Database["public"]['Enums']["team_status_t"],"updated_at"?: string,"work_time"?: Database["public"]['Enums']["work_time_t"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "teams_competition_id_fkey"
      columns: ["competition_id"]
isOneToOne: false
      referencedRelation: "competitions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_extraction_id_fkey"
      columns: ["extraction_id"]
isOneToOne: false
      referencedRelation: "competition_extractions"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teams_leader_id_fkey"
      columns: ["leader_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "questions_public": {
                  Row: {
                    "id": string,"lesson_id": string,"options": Json | null,"points": number,"prompt_md": string,"rubric": Json | null,"sort": number,"type": Database["public"]['Enums']["question_type_t"]
                  }
                  ComputedFields: never
                  Insert: {
                           "id"?: string | null,"lesson_id"?: string | null,"options"?: Json | null,"points"?: number | null,"prompt_md"?: string | null,"rubric"?: Json | null,"sort"?: number | null,"type"?: Database["public"]['Enums']["question_type_t"] | null
                         }
                        Update: {
                           "id"?: string | null,"lesson_id"?: string | null,"options"?: Json | null,"points"?: number | null,"prompt_md"?: string | null,"rubric"?: Json | null,"sort"?: number | null,"type"?: Database["public"]['Enums']["question_type_t"] | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "questions_lesson_id_fkey"
      columns: ["lesson_id"]
isOneToOne: false
      referencedRelation: "lessons"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "accept_invite":
{ Args: { "p_invite": string }; Returns: string
                           },
"are_teammates":
{ Args: { "a": string,"b": string }; Returns: boolean
                           },
"cancel_invite":
{ Args: { "p_invite": string }; Returns: undefined
                           },
"complete_onboarding":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"current_profile_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"decline_invite":
{ Args: { "p_invite": string }; Returns: string
                           },
"is_admin":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"is_team_member":
{ Args: { "p_team": string }; Returns: boolean
                           },
"recompute_team_status":
{ Args: { "p_team": string }; Returns: Database["public"]['Enums']["team_status_t"]
                           },
"save_profile_contact":
{ Args: { "p_contact_email": string,"p_goal": Database["public"]['Enums']["goal_t"],"p_hours_per_week": number,"p_open_to_invite": boolean,"p_whatsapp": string,"p_work_time": Database["public"]['Enums']["work_time_t"] }; Returns: undefined
                           },
"save_profile_history_portfolio":
{ Args: { "p_history": Json,"p_portfolio": Json }; Returns: undefined
                           },
"save_profile_skills":
{ Args: { "p_preferred_roles": (string)[],"p_skills": Json }; Returns: number
                           },
"send_invite":
{ Args: { "p_agent_action"?: string,"p_ai_drafted"?: boolean,"p_candidate": string,"p_message": string,"p_team_role": string }; Returns: string
                           }
          }
          Enums: {
            "access_source_t": "free_preview"|"promo"|"simulated_payment"|"admin","agent_t": "guidebook"|"recruiter"|"case_feedback","app_role_t": "user"|"admin","approval_t": "pending"|"approved"|"rejected"|"auto","booking_status_t": "pending_payment"|"paid"|"done"|"cancelled","comp_category_t": "hackathon"|"it_competition"|"ui_ux"|"data"|"business_case"|"paper","comp_result_t": "participant"|"finalist"|"winner_1"|"winner_2"|"winner_3"|"honorable","extraction_status_t": "processing"|"draft"|"reviewed"|"failed","feedback_t": "fit"|"not_fit","goal_t": "win"|"learn","invite_dir_t": "invite"|"apply","invite_status_t": "pending"|"accepted"|"declined"|"cancelled"|"expired","question_type_t": "mcq"|"case","role_source_t": "guidebook"|"criteria"|"template"|"manual","team_status_t": "forming"|"complete"|"archived","work_time_t": "morning"|"afternoon"|"night"|"flexible"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "access_source_t": ["free_preview", "promo", "simulated_payment", "admin"],"agent_t": ["guidebook", "recruiter", "case_feedback"],"app_role_t": ["user", "admin"],"approval_t": ["pending", "approved", "rejected", "auto"],"booking_status_t": ["pending_payment", "paid", "done", "cancelled"],"comp_category_t": ["hackathon", "it_competition", "ui_ux", "data", "business_case", "paper"],"comp_result_t": ["participant", "finalist", "winner_1", "winner_2", "winner_3", "honorable"],"extraction_status_t": ["processing", "draft", "reviewed", "failed"],"feedback_t": ["fit", "not_fit"],"goal_t": ["win", "learn"],"invite_dir_t": ["invite", "apply"],"invite_status_t": ["pending", "accepted", "declined", "cancelled", "expired"],"question_type_t": ["mcq", "case"],"role_source_t": ["guidebook", "criteria", "template", "manual"],"team_status_t": ["forming", "complete", "archived"],"work_time_t": ["morning", "afternoon", "night", "flexible"]
          }
        }
} as const
