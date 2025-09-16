import { createClient } from '@/lib/server'

export interface Pill {
  id: string
  created_at: string
  updated_at: string
  name?: string
  brand_name?: string
  shape?: string
  color?: string
  size_mm?: number
  imprint?: string
  scoring?: string
  manufacturer?: string
  image_url?: string
  back_image_url?: string
}

export interface UserSearch {
  id: string
  created_at: string
  original_image_url?: string
  processed_image_url?: string
  detected_shape?: string
  detected_color?: string
  detected_imprint?: string
  detected_size_mm?: number
  user_confirmed_shape?: string
  user_confirmed_color?: string
  user_confirmed_imprint?: string
  matched_pill_ids?: string[]
  confidence_score?: number
  session_id?: string
  user_agent?: string
}

export async function searchPills(attributes: {
  shape?: string
  color?: string
  imprint?: string
  size_mm?: number
  scoring?: string
}) {
  const supabase = await createClient()

  let query = supabase.from('pills').select('*')

  // Apply filters based on provided attributes
  if (attributes.shape) {
    query = query.ilike('shape', `%${attributes.shape}%`)
  }
  if (attributes.color) {
    query = query.ilike('color', `%${attributes.color}%`)
  }
  if (attributes.imprint) {
    query = query.ilike('imprint', `%${attributes.imprint}%`)
  }
  if (attributes.size_mm) {
    // Allow for 2mm tolerance in size matching
    query = query.gte('size_mm', attributes.size_mm - 2).lte('size_mm', attributes.size_mm + 2)
  }
  if (attributes.scoring) {
    query = query.ilike('scoring', `%${attributes.scoring}%`)
  }

  const { data, error } = await query.limit(20)

  if (error) {
    throw new Error(`Database search failed: ${error.message}`)
  }

  return data as Pill[]
}

// Broader search: returns pills matching ANY of the provided attributes (OR semantics) to surface partial matches.
export async function searchPillsAny(attributes: {
  shape?: string
  color?: string
  imprint?: string
  scoring?: string
}) {
  const supabase = await createClient()
  const conditions: string[] = []
  const params: any = {}

  // Build a dynamic OR filter using ilike for text attributes
  if (attributes.shape) {
    conditions.push(`shape.ilike.%${attributes.shape}%`)
  }
  if (attributes.color) {
    conditions.push(`color.ilike.%${attributes.color}%`)
  }
  if (attributes.imprint) {
    conditions.push(`imprint.ilike.%${attributes.imprint}%`)
  }
  if (attributes.scoring) {
    conditions.push(`scoring.ilike.%${attributes.scoring}%`)
  }

  if (conditions.length === 0) return []

  // Supabase JS client lacks a direct high-level OR builder for ilike chains; use .or() with comma-separated filters
  const orFilter = conditions.join(',')
  const { data, error } = await supabase.from('pills').select('*').or(orFilter).limit(40)
  if (error) {
    throw new Error(`Database broad search failed: ${error.message}`)
  }
  return data as Pill[]
}

export async function saveUserSearch(searchData: Partial<UserSearch>) {
  const supabase = await createClient()

  const { data, error } = await supabase.from('user_searches').insert(searchData).select().single()

  if (error) {
    throw new Error(`Failed to save search: ${error.message}`)
  }

  return data as UserSearch
}

export async function fuzzySearchPills(searchText: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pills')
    .select('*')
    .textSearch('search_vector', searchText)
    .limit(20)

  if (error) {
    throw new Error(`Fuzzy search failed: ${error.message}`)
  }

  return data as Pill[]
}
