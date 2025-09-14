import { createClient } from "@/lib/server"

export interface Pill {
  id: string
  created_at: string
  updated_at: string
  name?: string
  generic_name?: string
  brand_name?: string
  ndc_number?: string
  shape?: string
  color?: string
  size_mm?: number
  thickness_mm?: number
  front_imprint?: string
  back_imprint?: string
  drug_class?: string
  schedule?: string
  scoring?: string
  manufacturer?: string
}

export interface UserSearch {
  id: string
  created_at: string
  original_image_url?: string
  processed_image_url?: string
  detected_shape?: string
  detected_color?: string
  detected_front_imprint?: string
  detected_back_imprint?: string
  detected_size_mm?: number
  user_confirmed_shape?: string
  user_confirmed_color?: string
  user_confirmed_front_imprint?: string
  user_confirmed_back_imprint?: string
  matched_pill_ids?: string[]
  confidence_score?: number
  session_id?: string
  user_agent?: string
}

export async function searchPills(attributes: {
  shape?: string
  color?: string
  front_imprint?: string
  back_imprint?: string
  size_mm?: number
}) {
  const supabase = await createClient()

  let query = supabase.from("pills").select("*")

  // Apply filters based on provided attributes
  if (attributes.shape) {
    query = query.ilike("shape", `%${attributes.shape}%`)
  }
  if (attributes.color) {
    query = query.ilike("color", `%${attributes.color}%`)
  }
  if (attributes.front_imprint) {
    query = query.ilike("front_imprint", `%${attributes.front_imprint}%`)
  }
  if (attributes.back_imprint) {
    query = query.ilike("back_imprint", `%${attributes.back_imprint}%`)
  }
  if (attributes.size_mm) {
    // Allow for 2mm tolerance in size matching
    query = query.gte("size_mm", attributes.size_mm - 2).lte("size_mm", attributes.size_mm + 2)
  }

  const { data, error } = await query.limit(20)

  if (error) {
    throw new Error(`Database search failed: ${error.message}`)
  }

  return data as Pill[]
}

export async function saveUserSearch(searchData: Partial<UserSearch>) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("user_searches").insert(searchData).select().single()

  if (error) {
    throw new Error(`Failed to save search: ${error.message}`)
  }

  return data as UserSearch
}

export async function fuzzySearchPills(searchText: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("pills").select("*").textSearch("search_vector", searchText).limit(20)

  if (error) {
    throw new Error(`Fuzzy search failed: ${error.message}`)
  }

  return data as Pill[]
}
