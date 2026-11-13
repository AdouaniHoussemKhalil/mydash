
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "item_files": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"item_id": string,"mime_type": string,"name": string,"size_bytes": number,"storage_path": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"item_id": string,"mime_type"?: string,"name": string,"size_bytes": number,"storage_path": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"item_id"?: string,"mime_type"?: string,"name"?: string,"size_bytes"?: number,"storage_path"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_files_item_id_workspace_id_fkey"
      columns: ["item_id","workspace_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "item_files_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"item_links": {
                  Row: {
                    "created_at": string,"from_item": string,"relation": string,"to_item": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"from_item": string,"relation"?: string,"to_item": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"from_item"?: string,"relation"?: string,"to_item"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_links_from_item_workspace_id_fkey"
      columns: ["from_item","workspace_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "item_links_to_item_workspace_id_fkey"
      columns: ["to_item","workspace_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    }
                  ]
                },"item_spaces": {
                  Row: {
                    "item_id": string,"space_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "item_id": string,"space_id": string,"workspace_id": string
                  }
                  Update: {
                    "item_id"?: string,"space_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_spaces_item_id_workspace_id_fkey"
      columns: ["item_id","workspace_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "item_spaces_space_id_workspace_id_fkey"
      columns: ["space_id","workspace_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id","workspace_id"]
    }
                  ]
                },"item_tags": {
                  Row: {
                    "item_id": string,"tag_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "item_id": string,"tag_id": string,"workspace_id": string
                  }
                  Update: {
                    "item_id"?: string,"tag_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "item_tags_item_id_workspace_id_fkey"
      columns: ["item_id","workspace_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "item_tags_tag_id_workspace_id_fkey"
      columns: ["tag_id","workspace_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id","workspace_id"]
    }
                  ]
                },"items": {
                  Row: {
                    "archived": boolean,"body": string,"created_at": string,"created_by": string | null,"embedding": string | null,"id": string,"in_inbox": boolean,"parent_id": string | null,"pinned": boolean,"search_vector": unknown,"title": string,"type": Database["public"]['Enums']["item_type"],"updated_at": string,"url": string | null,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"body"?: string,"created_at"?: string,"created_by"?: string | null,"embedding"?: string | null,"id"?: string,"in_inbox"?: boolean,"parent_id"?: string | null,"pinned"?: boolean,"search_vector"?: never,"title": string,"type": Database["public"]['Enums']["item_type"],"updated_at"?: string,"url"?: string | null,"workspace_id": string
                  }
                  Update: {
                    "archived"?: boolean,"body"?: string,"created_at"?: string,"created_by"?: string | null,"embedding"?: string | null,"id"?: string,"in_inbox"?: boolean,"parent_id"?: string | null,"pinned"?: boolean,"search_vector"?: never,"title"?: string,"type"?: Database["public"]['Enums']["item_type"],"updated_at"?: string,"url"?: string | null,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_parent_id_workspace_id_fkey"
      columns: ["parent_id","workspace_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "items_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"link_meta": {
                  Row: {
                    "created_at": string,"description": string | null,"favicon_url": string | null,"fetch_error": string | null,"fetched_at": string | null,"image_url": string | null,"is_read": boolean,"item_id": string,"page_title": string | null,"site_name": string | null,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"favicon_url"?: string | null,"fetch_error"?: string | null,"fetched_at"?: string | null,"image_url"?: string | null,"is_read"?: boolean,"item_id": string,"page_title"?: string | null,"site_name"?: string | null,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"favicon_url"?: string | null,"fetch_error"?: string | null,"fetched_at"?: string | null,"image_url"?: string | null,"is_read"?: boolean,"item_id"?: string,"page_title"?: string | null,"site_name"?: string | null,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "link_meta_item_id_workspace_id_fkey"
      columns: ["item_id","workspace_id"]
isOneToOne: true
      referencedRelation: "items"
      referencedColumns: ["id","workspace_id"]
    },{
      foreignKeyName: "link_meta_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"spaces": {
                  Row: {
                    "color": string | null,"created_at": string,"icon": string | null,"id": string,"name": string,"position": number,"updated_at": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string | null,"created_at"?: string,"icon"?: string | null,"id"?: string,"name": string,"position"?: number,"updated_at"?: string,"workspace_id": string
                  }
                  Update: {
                    "color"?: string | null,"created_at"?: string,"icon"?: string | null,"id"?: string,"name"?: string,"position"?: number,"updated_at"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "spaces_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "color": string | null,"created_at": string,"id": string,"name": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string | null,"created_at"?: string,"id"?: string,"name": string,"workspace_id": string
                  }
                  Update: {
                    "color"?: string | null,"created_at"?: string,"id"?: string,"name"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tags_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspace_members": {
                  Row: {
                    "created_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string,"workspace_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string,"workspace_id": string
                  }
                  Update: {
                    "created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string,"workspace_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workspace_members_workspace_id_fkey"
      columns: ["workspace_id"]
isOneToOne: false
      referencedRelation: "workspaces"
      referencedColumns: ["id"]
    }
                  ]
                },"workspaces": {
                  Row: {
                    "created_at": string,"created_by": string | null,"id": string,"is_personal": boolean,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_personal"?: boolean,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"id"?: string,"is_personal"?: boolean,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_write":
{ Args: { "ws": string }; Returns: boolean
                           },
"is_member":
{ Args: { "ws": string }; Returns: boolean
                           },
"is_owner":
{ Args: { "ws": string }; Returns: boolean
                           },
"storage_item_in_workspace":
{ Args: { "object_name": string }; Returns: boolean
                           },
"storage_workspace_id":
{ Args: { "object_name": string }; Returns: string
                           }
          }
          Enums: {
            "item_type": "link"|"note"|"doc"|"file"|"repo"|"tool"|"prompt"|"skill"|"snippet"|"task"|"event","member_role": "owner"|"editor"|"viewer"
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
            "item_type": ["link", "note", "doc", "file", "repo", "tool", "prompt", "skill", "snippet", "task", "event"],"member_role": ["owner", "editor", "viewer"]
          }
        }
} as const
