export interface Link {
  id: string
  slug: string
  destination_url: string
  note: string
  is_active: boolean
  expires_at: string | null
  created_at: string
  password_hash: string | null
  clicks?: { count: number }[]
  total_clicks?: number
}

export interface LinkWithStats extends Link {
  total_clicks: number
  clicks_last_7_days: number[]
}